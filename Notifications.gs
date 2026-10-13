/** Run enableClubNotifications once to enable queued email delivery. */
function enableClubNotifications() {
  ['notifications','mailQueue'].forEach(sheet);
  if (!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='deliverClubEmails')) {
    ScriptApp.newTrigger('deliverClubEmails').timeBased().everyMinutes(1).create();
  }
  MailApp.getRemainingDailyQuota();
  return 'Club notifications enabled';
}
function publishClubNotification(kind,record) {
  const id=kind+':'+record.id;
  if(rows('notifications').some(n=>n.id===id))return;
  const notification={id,title:record.title,kind,recordId:record.id,createdAt:now(),path:kind==='event'?'events.html':'news.html'};
  put('notifications',notification);
  rows('members').filter(m=>m.email&&!m.newsEmailOptOut).forEach(member=>{
    put('mailQueue',{id:'club:'+id+':'+member.id,email:member.email,title:record.title,subject:kind==='event'?'KMUTNB VC · กิจกรรมใหม่':'KMUTNB VC · ข่าวสารใหม่',body:record.title+'\n\n'+record.body+(kind==='event'?'\nวันเวลา: '+new Date(record.date).toLocaleString('th-TH',{timeZone:'Asia/Bangkok'})+'\nสถานที่: '+record.location:'')+'\n\nเปิดเว็บไซต์ชมรมเพื่อดูรายละเอียด'+(prop('CLUB_SITE_URL')?'\n'+prop('CLUB_SITE_URL').replace(/\/$/,'')+'/'+notification.path:''),createdAt:now(),status:'pending'});
  });
}
function deliverClubEmails() {
  const lock=LockService.getScriptLock();if(!lock.tryLock(1000))return;
  try{requestRows={};const quota=Math.max(0,MailApp.getRemainingDailyQuota()-20);
    for(const job of rows('mailQueue').filter(j=>j.status==='pending').slice(0,Math.min(quota,20))){
      job.status='sending';job.attemptedAt=now();put('mailQueue',job);
      try{MailApp.sendEmail({to:job.email,subject:job.subject||'KMUTNB VC · ข่าวใหม่จากกองกิจการนักศึกษา',body:job.body||job.title+'\n\nอ่านข่าวต้นฉบับ: '+job.url});job.status='sent';job.sentAt=now();}
      catch(error){job.status='failed';job.error=String(error.message).slice(0,200);}put('mailQueue',job);
    }
  }finally{lock.releaseLock();}
}
