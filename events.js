let events=[];
let status='ทั้งหมด';
const search=document.querySelector('#search');
const buttons=[...document.querySelectorAll('[data-status]')];
function render(){
 const query=search.value.trim().toLocaleLowerCase('th');
 buttons.forEach(button=>{const active=button.dataset.status===status;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
 const filtered=events.filter(event=>(status==='ทั้งหมด'||(event.open?'เปิดรับสมัคร':'ปิดรับสมัคร')===status)&&(event.title+' '+event.location).toLocaleLowerCase('th').includes(query)).sort((a,b)=>new Date(b.date)-new Date(a.date));
 const container=document.querySelector('#events');container.replaceChildren();
 filtered.forEach(event=>{
  const card=document.createElement('article');card.className='eventcard';
  if(event.image){const image=document.createElement('img');image.src=event.image;image.alt=event.title;image.loading='lazy';card.append(image);}
  const body=document.createElement('div');body.className='eventbody';const badge=document.createElement('span');badge.className='eventstatus'+(event.open?'':' closed');badge.textContent=event.open?'เปิดรับสมัคร':'ปิดรับสมัคร';const title=document.createElement('h3');title.textContent=event.title;const description=document.createElement('p');description.textContent=event.description;const meta=document.createElement('div');meta.className='eventmeta';const date=document.createElement('div');date.textContent='วันเวลา · '+new Date(event.date).toLocaleString('th-TH',{timeZone:'Asia/Bangkok'});const place=document.createElement('div');place.textContent='สถานที่ · '+event.location;meta.append(date,place);const actions=document.createElement('div');actions.className='eventactions';const count=document.createElement('small');count.textContent='ผู้ลงชื่อ '+(event.participantCount||0)+' คน'+(event.capacity?' / '+event.capacity+' คน':'');const join=document.createElement('button');join.textContent=event.open?(event.joined?'ยกเลิกการลงชื่อ':'ลงชื่อเข้าร่วม →'):'ปิดรับสมัครแล้ว';join.disabled=!event.open;join.addEventListener('click',async()=>{if(!sessionStorage.getItem('vc-session')){window.location.href='login.html';return;}join.disabled=true;try{await VC_API.call('join',{id:event.id});await loadEvents();}catch(e){alert(e.message);join.disabled=false;}});actions.append(count,join);const calendarLink=document.createElement('a');calendarLink.className='vc-calendar-link';calendarLink.href=VC_CALENDAR.link(event);calendarLink.target='_blank';calendarLink.rel='noopener noreferrer';calendarLink.textContent='เพิ่มลง Google Calendar ↗';body.append(badge,title,description,meta,calendarLink,actions);card.append(body);container.append(card);
 });
 document.querySelector('#resultHeading').textContent=status==='ทั้งหมด'?'กิจกรรมทั้งหมด':'กิจกรรม · '+status;
 document.querySelector('#resultCount').textContent=filtered.length+' กิจกรรม';document.querySelector('#empty').hidden=filtered.length>0;
 document.querySelector('#emptyTitle').textContent=query?'ไม่พบกิจกรรมที่ค้นหา':status==='ทั้งหมด'?'ยังไม่มีกิจกรรมชมรม':'ยังไม่มีกิจกรรมที่'+status;
 document.querySelector('#emptyText').textContent=query?'ลองเปลี่ยนคำค้นหาหรือดูกิจกรรมทั้งหมด':'กิจกรรมที่ผู้ดูแลโพสต์จะแสดงที่นี่';
 document.querySelector('#reset').hidden=!query&&status==='ทั้งหมด';
}
buttons.forEach(button=>button.addEventListener('click',()=>{status=button.dataset.status;render();}));search.addEventListener('input',render);document.querySelector('#reset').addEventListener('click',()=>{status='ทั้งหมด';search.value='';render();});render();

async function loadEvents(){try{const data=await VC_API.call('load');events=data.events.map(event=>({...event,description:event.body,participantCount:event.count}));render();window.dispatchEvent(new CustomEvent('vc-events',{detail:events}));await VC_API.images(events,'eventImage',()=>render());}catch(e){document.querySelector('#emptyTitle').textContent='โหลดกิจกรรมไม่สำเร็จ';document.querySelector('#emptyText').textContent=e.message;}}
loadEvents();

window.addEventListener('vc-content-updated',loadEvents);
