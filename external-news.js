(() => {
  const section = document.createElement('section');
  section.className = 'external-news';
  section.innerHTML = '<div class="resultshead"><h2>ข่าวจากกองกิจการนักศึกษา</h2><a href="https://sa.op.kmutnb.ac.th/" target="_blank" rel="noopener noreferrer">เว็บไซต์กองกิจฯ ↗</a></div><p class="external-status" role="status" aria-live="polite">กำลังโหลดข่าวจากกองกิจการนักศึกษา…</p><div class="newsgrid"></div>';
  document.querySelector('.infobar').before(section);
  const status = section.querySelector('.external-status');
  const grid = section.querySelector('.newsgrid');
  const safeURL = value => { try { const u = new URL(value); return u.protocol === 'https:' && u.hostname === 'sa.op.kmutnb.ac.th' ? u.href : ''; } catch { return ''; } };
  let busy = false;
  async function refresh() {
    if (busy || document.hidden) return;
    busy = true;
    try {
      const data = await VC_API.call('externalNews');
      grid.replaceChildren();
      for (const post of data.items || []) {
        const link = safeURL(post.url);
        if (!link) continue;
        const card = document.createElement('article'); card.className = 'newscard';
        const imageURL = safeURL(post.image);
        if (imageURL) { const img = document.createElement('img'); img.src = imageURL; img.alt = ''; img.loading = 'lazy'; img.referrerPolicy = 'no-referrer'; img.addEventListener('error', () => img.remove(), {once:true}); card.append(img); }
        const body = document.createElement('div'); body.className = 'newsbody';
        const tag = document.createElement('span'); tag.textContent = 'กองกิจการนักศึกษา มจพ.';
        const title = document.createElement('h3'); title.textContent = post.title;
        const date = document.createElement('small'); const published = new Date(post.publishedAt); date.textContent = Number.isNaN(+published) ? '' : published.toLocaleDateString('th-TH', {day:'numeric',month:'long',year:'numeric'});
        const summary = document.createElement('p'); summary.textContent = post.summary;
        const anchor = document.createElement('a'); anchor.href = link; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; anchor.textContent = 'อ่านข่าวต้นฉบับ ↗';
        body.append(tag,title,date,summary,anchor); card.append(body); grid.append(card);
      }
      status.textContent = grid.children.length ? 'อัปเดตข่าวอัตโนมัติ · ตรวจข่าวทุก 15 นาที' + (data.syncedAt ? ' · ล่าสุด ' + new Date(data.syncedAt).toLocaleString('th-TH') : '') : 'ยังไม่มีข่าวจากแหล่งข้อมูลนี้';
    } catch (error) {
      status.textContent = grid.children.length ? 'แสดงข่าวที่โหลดไว้ก่อนหน้า · ยังตรวจข่าวใหม่ไม่ได้' : 'ยังเชื่อมข่าวอัตโนมัติไม่ได้ สามารถอ่านข่าวที่เว็บไซต์กองกิจฯ ได้';
    } finally { busy = false; }
  }
  document.addEventListener('visibilitychange', refresh);
  setInterval(refresh, 60000);
  refresh();
})();
