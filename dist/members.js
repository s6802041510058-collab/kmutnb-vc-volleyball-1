let members=[];
let role='ทั้งหมด';
const search=document.querySelector('#search');
const buttons=[...document.querySelectorAll('[data-role]')];
function memberCard(member){
 const card=document.createElement('article');card.className='membercard';const avatar=document.createElement('div');avatar.className='avatar';avatar.setAttribute('aria-hidden','true');avatar.textContent=member.name.slice(0,1);const name=document.createElement('h3');name.textContent=member.name;const nickname=document.createElement('p');nickname.textContent=member.nickname?'ชื่อเล่น '+member.nickname:'';const badge=document.createElement('span');badge.className='rolepill';badge.textContent=member.position||'สมาชิก';card.append(avatar,name,nickname,badge);return card;
}
function render(){
 const query=search.value.trim().toLocaleLowerCase('th');
 buttons.forEach(button=>{const active=button.dataset.role===role;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
 const filtered=members.filter(member=>(role==='ทั้งหมด'||member.position===role)&&(member.name+' '+(member.nickname||'')).toLocaleLowerCase('th').includes(query));
 const rank={ประธาน:0,รองประธาน:1,สมาชิก:2};filtered.sort((a,b)=>(rank[a.position]??2)-(rank[b.position]??2)||a.name.localeCompare(b.name,'th'));
 document.querySelector('#totalCount').textContent=members.length+' คน';document.querySelector('#presidentCount').textContent=members.filter(m=>m.position==='ประธาน').length+' คน';document.querySelector('#viceCount').textContent=members.filter(m=>m.position==='รองประธาน').length+' คน';
 document.querySelector('#leaderSection').hidden=role!=='ทั้งหมด'||!!query;
 const leaders=members.filter(m=>['ประธาน','รองประธาน'].includes(m.position));if(leaders.length){const container=document.querySelector('#leaders');container.replaceChildren();for(const position of ['ประธาน','รองประธาน']){const group=leaders.filter(m=>m.position===position);if(group.length)group.forEach(m=>container.append(memberCard(m)));else{const empty=document.createElement('div');empty.className='leaderempty';empty.textContent='ยังไม่ได้กำหนด'+position+'ชมรม';container.append(empty);}}}
 const grid=document.querySelector('#memberGrid');grid.replaceChildren();filtered.forEach(member=>grid.append(memberCard(member)));
 document.querySelector('#resultCount').textContent=filtered.length+' คน';document.querySelector('#empty').hidden=filtered.length>0;
 document.querySelector('#emptyTitle').textContent=query?'ไม่พบสมาชิกที่ค้นหา':role==='ทั้งหมด'?'ยังไม่มีสมาชิกชมรม':'ยังไม่มีสมาชิกตำแหน่ง'+role;
 document.querySelector('#emptyText').textContent=query?'ลองเปลี่ยนชื่อหรือชื่อเล่นที่ค้นหา':role==='ทั้งหมด'?'รายชื่อจะแสดงเมื่อมีผู้สมัครสมาชิกและยืนยันอีเมลสำเร็จ':'ตำแหน่งชมรมจะแสดงตามข้อมูลที่ผู้ดูแลกำหนด';
 document.querySelector('#reset').hidden=!query&&role==='ทั้งหมด';document.querySelector('#join').hidden=!!query||role!=='ทั้งหมด';
}
buttons.forEach(button=>button.addEventListener('click',()=>{role=button.dataset.role;render();}));search.addEventListener('input',render);document.querySelector('#reset').addEventListener('click',()=>{role='ทั้งหมด';search.value='';render();});render();

async function loadMembers(){try{const response=await fetch('https://script.google.com/macros/s/AKfycbzjGMdPWMaGTUfkPNZxR0FLJCnyfk-YbfWomJzr77sasuaiHQXrbwRBTqRTuUyrYMko/exec',{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'members'})});const result=await response.json();if(!result.ok||!Array.isArray(result.data))throw Error(result.error||'ข้อมูลไม่ถูกต้อง');members=result.data;render();}catch(error){const notice=document.createElement('p');notice.className='infobar';notice.textContent='ยังโหลดรายชื่อจริงไม่ได้ กรุณาติดตั้ง Code.gs และ Deploy เวอร์ชันใหม่';document.querySelector('#memberGrid').before(notice);}}
loadMembers();
