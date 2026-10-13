let category='ทั้งหมด';
const search=document.querySelector('#search');
const buttons=[...document.querySelectorAll('[data-category]')];
function renderEmpty(){
 const query=search.value.trim();
 buttons.forEach(button=>{const active=button.dataset.category===category;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
 document.querySelector('#resultHeading').textContent=category==='ทั้งหมด'?'ประกาศทั้งหมด':'ประกาศ · '+category;
 document.querySelector('#emptyTitle').textContent=query?'ไม่พบประกาศที่ค้นหา':category==='ทั้งหมด'?'ยังไม่มีข่าวสารและประกาศ':'ยังไม่มีประกาศหมวด'+category;
 document.querySelector('#emptyText').textContent=query?'ยังไม่มีประกาศที่ตรงกับ “'+query+'” ลองเปลี่ยนคำค้นหาหรือดูประกาศทั้งหมด':'ข่าวสารที่ผู้ดูแลชมรมเผยแพร่จะแสดงที่นี่';
 document.querySelector('#reset').hidden=!query&&category==='ทั้งหมด';
}
buttons.forEach(button=>button.addEventListener('click',()=>{category=button.dataset.category;renderEmpty();}));
search.addEventListener('input',renderEmpty);
document.querySelector('#reset').addEventListener('click',()=>{category='ทั้งหมด';search.value='';renderEmpty();});
