/** Student Affairs RSS synchronization. Run enableExternalNews once. */
const SA_FEED = 'https://sa.op.kmutnb.ac.th/feed/';
function saURL(value) {
  return /^https:\/\/sa\.op\.kmutnb\.ac\.th\//i.test(String(value || '')) ? String(value) : '';
}
function saPlain(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0*39;/g, "'").replace(/\s+/g, ' ').trim();
}
function parseStudentAffairs(xml) {
  const root = XmlService.parse(xml).getRootElement();
  const channel = root.getChild('channel');
  if (!channel) throw Error('RSS channel missing');
  const contentNS = XmlService.getNamespace('http://purl.org/rss/1.0/modules/content/');
  return channel.getChildren('item').map(item => {
    const url = saURL(item.getChildText('link'));
    const html = item.getChildText('encoded', contentNS) || item.getChildText('description') || '';
    const image = html.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i);
    const date = new Date(item.getChildText('pubDate'));
    return {id:hash(url),url,title:saPlain(item.getChildText('title')).slice(0,300),summary:saPlain(item.getChildText('description') || html).slice(0,350),image:saURL(image && image[1]),publishedAt:isNaN(+date)?null:date.toISOString()};
  }).filter(item => item.url && item.title && item.publishedAt);
}
function externalNewsData() {
  return {items:rows('externalNews').sort((a,b)=>new Date(b.publishedAt)-new Date(a.publishedAt)).slice(0,12),syncedAt:prop('SA_SYNCED_AT') || null};
}
function enableExternalNews() {
  syncStudentAffairs();
  if (!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='syncStudentAffairs')) {
    ScriptApp.newTrigger('syncStudentAffairs').timeBased().everyMinutes(15).create();
  }
  return 'RSS enabled; existing news imported without email notifications';
}
function syncStudentAffairs() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    requestRows = {};
    const response = UrlFetchApp.fetch(SA_FEED,{muteHttpExceptions:true});
    if (response.getResponseCode()!==200) throw Error('RSS fetch failed');
    const items = parseStudentAffairs(response.getContentText());
    if (!items.length) throw Error('RSS is empty; baseline unchanged');
    const props = PropertiesService.getScriptProperties();
    const baseline = prop('SA_EMAIL_BASELINE');
    const existing = new Set(rows('externalNews').map(item=>item.id));
    const queue = rows('mailQueue');
    for (const item of items) {
      if (existing.has(item.id)) continue;
      // Queue only articles published after initial activation. Deterministic IDs prevent duplicates.
      if (baseline && new Date(item.publishedAt)>new Date(baseline)) {
        for (const member of rows('members')) {
          if (!member.email || member.newsEmailOptOut || (member.createdAt && new Date(member.createdAt)>new Date(item.publishedAt))) continue;
          const id = item.id + ':' + member.id;
          if (!queue.some(job=>job.id===id)) {
            const job = {id,email:member.email,title:item.title,url:item.url,createdAt:now(),status:'pending'};
            put('mailQueue',job); queue.push(job);
          }
        }
      }
      put('externalNews',item);
    }
    if (!baseline) props.setProperty('SA_EMAIL_BASELINE',now());
    props.setProperty('SA_SYNCED_AT',now());
    // Leave quota available for OTP; pending jobs continue during subsequent checks.
    let available = Math.max(0,MailApp.getRemainingDailyQuota()-20);
    for (const job of queue.filter(j=>j.status==='pending').slice(0,Math.min(30,available))) {
      // Persist before sending to avoid retrying an ambiguous delivery after a crash.
      job.status='sending'; job.attemptedAt=now(); put('mailQueue',job);
      try {
        MailApp.sendEmail({to:job.email,subject:job.subject||'KMUTNB VC · ข่าวใหม่จากกองกิจการนักศึกษา',body:job.body||job.title+'\n\nอ่านข่าวต้นฉบับ: '+job.url+'\n\nแหล่งที่มา: กองกิจการนักศึกษา มจพ.'});
        job.status='sent'; job.sentAt=now();
      } catch(error) {job.status='failed'; job.error=String(error.message).slice(0,200);}
      put('mailQueue',job);
    }
  } finally {lock.releaseLock();}
}
