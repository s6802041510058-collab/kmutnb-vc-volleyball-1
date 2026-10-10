let posts=[];
let category='ทั้งหมด';
const categoryButtons=[...document.querySelectorAll('[data-category]')];
const search=document.querySelector('#search');
const sort=document.querySelector('#sort');
const grid=document.querySelector('#posts');
function render(){
 const query=search.value.trim().toLocaleLowerCase('th');
 const filtered=posts.filter(post=>(category==='ทั้งหมด'||post.category===category)&&(post.title+' '+post.body).toLocaleLowerCase('th').includes(query)).sort((a,b)=>sort.value==='hearts'?b.hearts-a.hearts:sort.value==='oldest'?new Date(a.date)-new Date(b.date):new Date(b.date)-new Date(a.date));
 grid.replaceChildren();
 filtered.forEach(post=>{
  const article=document.createElement('article');article.className='postcard';article.id='post-'+post.id;
  if(post.image){const image=document.createElement('img');image.src=post.image;image.alt=post.title;image.loading='lazy';article.append(image);}
  const body=document.createElement('div');body.className='postbody';const time=document.createElement('time');time.dateTime=post.date;time.textContent=new Date(post.date).toLocaleDateString('th-TH');const title=document.createElement('h3');title.textContent=post.title;const text=document.createElement('p');text.textContent=post.body;body.append(time,title,text);article.append(body);
  const actions=document.createElement('div');actions.className='postactions';const heart=document.createElement('button');heart.textContent=(post.liked?'♥ ':'♡ ')+post.hearts;heart.setAttribute('aria-pressed',String(!!post.liked));heart.setAttribute('aria-label','ส่งหัวใจให้ '+post.title);heart.addEventListener('click',async()=>{if(!sessionStorage.getItem('vc-session')){location.href='login.html';return;}heart.disabled=true;try{await VC_API.call('heart',{id:post.id});await loadPosts();}catch(e){alert(e.message);heart.disabled=false;}});const share=document.createElement('button');share.textContent='แชร์ ↗';share.addEventListener('click',async()=>{const url=new URL('university.html#post-'+encodeURIComponent(post.id),location.href).href;try{if(navigator.share)await navigator.share({title:post.title,url});else{await navigator.clipboard.writeText(url);share.textContent='คัดลอกแล้ว ✓';}}catch(error){if(error.name!=='AbortError'){const link=document.createElement('input');link.value=url;link.readOnly=true;actions.append(link);link.select();}}});actions.append(heart,share);article.append(actions);grid.append(article);
 });
 document.querySelector('#resultCount').textContent=filtered.length+' ผลงาน';
 document.querySelector('#empty').hidden=filtered.length>0;
 document.querySelector('#emptyTitle').textContent=query?'ไม่พบผลงานที่ค้นหา':category==='ทั้งหมด'?'ยังไม่มีผลงานกีฬามหาวิทยาลัย':'ยังไม่มีผลงานหมวด'+category;
 document.querySelector('#emptyText').textContent=query?'ลองเปลี่ยนคำค้นหา หรือกลับไปดูผลงานทั้งหมด':'รูปภาพและเรื่องราวที่ผู้ดูแลชมรมเผยแพร่จะแสดงที่นี่';
 document.querySelector('#reset').hidden=!query&&category==='ทั้งหมด';categoryButtons.forEach(button=>{const active=button.dataset.category===category;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
}
search.addEventListener('input',render);sort.addEventListener('change',render);document.querySelector('#reset').addEventListener('click',()=>{search.value='';sort.value='newest';category='ทั้งหมด';render();});render();

categoryButtons.forEach(button=>button.addEventListener('click',()=>{category=button.dataset.category;render();}));

async function loadPosts(){try{const data=await VC_API.call('load');posts=data.posts.filter(p=>p.type==='university').map(p=>({...p,date:p.createdAt}));render();await VC_API.images(posts,'postImage',()=>render());}catch(e){const p=document.createElement('p');p.className='infobar';p.textContent='โหลดผลงานไม่สำเร็จ: '+e.message;grid.before(p);}}
loadPosts();
