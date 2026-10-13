/** KMUTNB VC — Google Apps Script backend. See SETUP.md. */

let requestRows={};

const TABLES=['members','posts','hearts','events','joins','equipment','loans','folders','files','sessions','otps','settings','externalNews','mailQueue','notifications'];

function prop(k){return PropertiesService.getScriptProperties().getProperty(k)||''}

function db(){if(!prop('SPREADSHEET_ID'))throw Error('ยังไม่ได้ตั้งค่า SPREADSHEET_ID');return SpreadsheetApp.openById(prop('SPREADSHEET_ID'))}

function sheet(t){if(!TABLES.includes(t))throw Error('Invalid table');let s=db().getSheetByName(t);if(!s){s=db().insertSheet(t);s.appendRow(['id','json'])}return s}

function rows(t){if(requestRows[t])return requestRows[t];let s=sheet(t);if(s.getLastRow()<2)return [];return requestRows[t]=s.getRange(2,2,s.getLastRow()-1,1).getValues().map(r=>JSON.parse(r[0]))}

function put(t,o){delete requestRows[t];let s=sheet(t),ids=s.getLastRow()>1?s.getRange(2,1,s.getLastRow()-1,1).getValues().flat():[],i=ids.indexOf(o.id);if(i>=0)s.getRange(i+2,1,1,2).setValues([[o.id,JSON.stringify(o)]]);else s.appendRow([o.id,JSON.stringify(o)]);return o}

function del(t,id){delete requestRows[t];let s=sheet(t);if(s.getLastRow()<2)return;let ids=s.getRange(2,1,s.getLastRow()-1,1).getValues().flat(),i=ids.indexOf(id);if(i>=0)s.deleteRow(i+2)}

function uid(){return Utilities.getUuid()}

function now(){return new Date().toISOString()}

function hash(s){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s).map(x=>('0'+((x+256)%256).toString(16)).slice(-2)).join('')}

function text(s,max){return String(s||'').trim().slice(0,max||5000)}

function publicMember(m){return {id:m.id,name:m.name,nickname:m.nickname||'',position:m.position}}

function current(token){if(!token)return null;let s=rows('sessions').find(x=>x.id===hash(token)&&x.expires>Date.now());return s?rows('members').find(m=>m.id===s.memberId):null}

function must(m){if(!m)throw Error('กรุณาเข้าสู่ระบบอีกครั้ง');return m}

function admin(m){must(m);if(m.email!==prop('ADMIN_EMAIL').toLowerCase().trim())throw Error('เฉพาะผู้ดูแลเท่านั้น')}

function folder(){if(!prop('DRIVE_FOLDER_ID'))throw Error('ยังไม่ได้ตั้งค่า DRIVE_FOLDER_ID');return DriveApp.getFolderById(prop('DRIVE_FOLDER_ID'))}

function upload(f,imageOnly){if(!f||!f.base64||!f.name)throw Error('กรุณาแนบไฟล์');if(imageOnly&&!/^image\/(jpeg|png|webp)$/.test(f.mime))throw Error('ต้องเป็นภาพ JPEG PNG หรือ WebP');let b=Utilities.base64Decode(f.base64);if(b.length>5*1024*1024)throw Error('ไฟล์เกิน 5 MB');let file=folder().createFile(Utilities.newBlob(b,f.mime,text(f.name,200)));return file.getId()}

function blob(id){let f=DriveApp.getFileById(id),b=f.getBlob();return {name:f.getName(),mime:b.getContentType(),base64:Utilities.base64Encode(b.getBytes())}}

function setup(){PropertiesService.getScriptProperties().setProperties({SPREADSHEET_ID:'1pAG4t_fYntbCMXoMO9SDEgeVeiH7ULAX6g7uA4w8Sm8',DRIVE_FOLDER_ID:'1ObK_e_VPLtWXfxKyBTzUw8kCuffr-JDu',ADMIN_EMAIL:'s6802041510058@email.kmutnb.ac.th'});TABLES.forEach(sheet);folder().getName();MailApp.getRemainingDailyQuota();return 'Ready'}

function doPost(e){let lock=LockService.getScriptLock();try{requestRows={};let a=JSON.parse(e.postData.contents);if(!['load','me','members','postImage','eventImage','equipmentImage','loanPhoto','download','participants','externalNews','notifications'].includes(a.action))lock.waitLock(30000);let m=current(a.token),result=handle(a,m);return json({ok:true,data:result})}catch(e){return json({ok:false,error:e.message})}finally{if(lock.hasLock())lock.releaseLock()}}

function doGet(){return json({ok:true,data:{service:'KMUTNB VC',status:'ready',apiVersion:3,build:'studentcard-quantity-20261013',notificationsEnabled:true}})}

function json(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}

function handle(a,m){
if(a.action==='notifications'){must(m);return {items:rows('notifications').filter(n=>!m.createdAt||n.createdAt>=m.createdAt).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,30)}}

if(a.action==='externalNews')return externalNewsData();

if(a.action==='requestOtp'){

 let email=text(a.email,254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('อีเมลไม่ถูกต้อง');let member=rows('members').find(x=>x.email===email);if(member&&a.register)throw Error('อีเมลนี้เป็นสมาชิกแล้ว กรุณากดเข้าสู่ระบบ');if(!member&&!a.register)throw Error('ยังไม่มีสมาชิกอีเมลนี้ กรุณาสมัครก่อน');if(!member&&(!text(a.name,100)||!text(a.nickname,40)||!/^\d{1,20}$/.test(text(a.studentId,30))))throw Error('กรอกชื่อ ชื่อเล่น และรหัสนักศึกษาให้ครบ');let old=rows('otps').find(x=>x.id===email);if(old&&Date.now()-old.sentAt<60000)throw Error('กรุณารอ 60 วินาทีก่อนขอรหัสอีกครั้ง');let code=String(Math.floor(100000+Math.random()*900000)),salt=uid();put('otps',{id:email,digest:hash(salt+code),salt,expires:Date.now()+600000,sentAt:Date.now(),attempts:0,name:text(a.name,100),studentId:text(a.studentId,30),nickname:text(a.nickname,40)});MailApp.sendEmail(email,'รหัสเข้าสู่ระบบ KMUTNB VC','รหัส OTP ของคุณคือ '+code+'\nใช้ได้ภายใน 10 นาที');return {sent:true}

}

if(a.action==='verifyOtp'){

 let email=text(a.email,254).toLowerCase(),o=rows('otps').find(x=>x.id===email);if(!o||o.expires<Date.now()||o.attempts>=5)throw Error('รหัสหมดอายุ กรุณาขอรหัสใหม่');o.attempts++;put('otps',o);if(hash(o.salt+text(a.otp,6))!==o.digest)throw Error('รหัสไม่ถูกต้อง');let member=rows('members').find(x=>x.email===email);if(!member)member=put('members',{id:uid(),email,name:o.name,studentId:o.studentId,nickname:o.nickname||'',position:'สมาชิก',createdAt:now()});del('otps',email);let token=uid()+uid();put('sessions',{id:hash(token),memberId:member.id,expires:Date.now()+86400000});return {token,user:{...publicMember(member),email:member.email,role:member.email===prop('ADMIN_EMAIL').toLowerCase().trim()?'admin':'member'}}

}

if(a.action==='logout'){if(a.token)del('sessions',hash(a.token));return true}

if(a.action==='me'){must(m);return {...publicMember(m),email:m.email,role:m.email===prop('ADMIN_EMAIL').toLowerCase().trim()?'admin':'member'}}

if(a.action==='members'){return rows('members').map(publicMember)}

if(a.action==='load'){

 let isAdmin=m&&m.email===prop('ADMIN_EMAIL').toLowerCase().trim(),hearts=rows('hearts'),joins=rows('joins'),loans=rows('loans');return {apiVersion:3,openBorrowing:true,currentUser:m?{...publicMember(m),email:m.email,role:isAdmin?'admin':'member'}:null,posts:rows('posts').map(p=>({...p,hearts:hearts.filter(h=>h.postId===p.id).length,liked:!!m&&hearts.some(h=>h.postId===p.id&&h.memberId===m.id)})),members:rows('members').map(publicMember),events:rows('events').map(e=>({...e,count:joins.filter(j=>j.eventId===e.id).length,joined:!!m&&joins.some(j=>j.eventId===e.id&&j.memberId===m.id)})),equipment:rows('equipment').map(e=>({...e,available:true})),loans:m?loans.filter(l=>isAdmin||l.memberId===m.id).map(l=>({id:l.id,equipmentId:l.equipmentId,equipmentName:l.equipmentName,memberId:l.memberId,memberName:l.memberName,borrowedAt:l.borrowedAt,returnedAt:l.returnedAt,quantity:l.quantity||1,returnedQuantity:l.returnedQuantity||0,closedAt:l.closedAt||null,parentLoanId:l.parentLoanId||null,evidenceType:l.evidenceType||'legacy',borrowPhotoDeleted:!!l.borrowPhotoDeleted,returnPhotoDeleted:!!l.returnPhotoDeleted})):[],folders:rows('folders'),files:rows('files').map(f=>({id:f.id,name:f.name,folderId:f.folderId,createdAt:f.createdAt})),settings:rows('settings').find(s=>s.id==='site')||{}}

}

if(a.action==='eventImage'){let e=rows('events').find(x=>x.id===a.id);if(!e||!e.imageDriveId)throw Error('ไม่พบภาพกิจกรรม');return blob(e.imageDriveId)}

if(a.action==='equipmentImage'){let e=rows('equipment').find(x=>x.id===a.id);if(!e||!e.imageDriveId)throw Error('ไม่พบภาพอุปกรณ์');return blob(e.imageDriveId)}

if(a.action==='postImage'){let p=rows('posts').find(p=>p.id===a.id);if(!p||!p.imageDriveId)throw Error('ไม่พบภาพโพสต์');return blob(p.imageDriveId)}

if(a.action==='heart'){

 must(m);if(!rows('posts').some(p=>p.id===a.id))throw Error('ไม่พบโพสต์');let id=m.id+':'+a.id,existing=rows('hearts').find(h=>h.id===id);if(existing)del('hearts',id);else put('hearts',{id,memberId:m.id,postId:a.id});return true

}

if(a.action==='join'){

 must(m);let e=rows('events').find(x=>x.id===a.id);if(!e||!e.open)throw Error('กิจกรรมปิดรับแล้ว');let id=m.id+':'+e.id,joins=rows('joins');if(joins.some(j=>j.id===id)){del('joins',id);return true}if(e.capacity&&joins.filter(j=>j.eventId===e.id).length>=e.capacity)throw Error('กิจกรรมเต็มแล้ว');put('joins',{id,eventId:e.id,memberId:m.id,createdAt:now()});return true

}

if(a.action==='borrow'||a.action==='return'){
 must(m);
 if(a.studentCardConfirmed!==true)throw Error('ต้องยืนยันว่าภาพเห็นบัตรนักศึกษาและอุปกรณ์ชัดเจน');
 const quantity=Number(a.quantity);if(!Number.isInteger(quantity)||quantity<1||quantity>9999)throw Error('จำนวนต้องเป็นจำนวนเต็มตั้งแต่ 1 ถึง 9999 ชิ้น');
 const equipment=rows('equipment').find(x=>x.id===a.id);if(!equipment)throw Error('ไม่พบอุปกรณ์');
 const loans=rows('loans');let parent=null;
 if(a.action==='return'&&a.loanId){parent=loans.find(x=>x.id===a.loanId&&x.equipmentId===a.id);if(!parent||parent.memberId!==m.id||!parent.borrowedAt||parent.returnedAt||parent.closedAt)throw Error('ไม่พบรายการยืมที่ยังคืนไม่ครบของคุณ');if(quantity>(parent.quantity||1)-(parent.returnedQuantity||0))throw Error('จำนวนคืนมากกว่าจำนวนที่ยืมคงเหลือ');}
 const photo=upload(a.photo,true),timestamp=now();
 const record={id:uid(),equipmentId:a.id,equipmentName:equipment.name,memberId:m.id,memberName:m.name,quantity,evidenceType:'studentCard',capturedAt:a.capturedAt||timestamp,borrowedAt:a.action==='borrow'?timestamp:null,returnedAt:a.action==='return'?timestamp:null};
 if(a.action==='borrow')record.borrowPhoto=photo;else{record.returnPhoto=photo;if(parent)record.parentLoanId=parent.id;}
 put('loans',record);
 if(parent){parent.returnedQuantity=(parent.returnedQuantity||0)+quantity;if(parent.returnedQuantity===(parent.quantity||1))parent.closedAt=timestamp;put('loans',parent);}
 return true
}
if(a.action==='download'){must(m);let f=rows('files').find(x=>x.id===a.id);if(!f)throw Error('ไม่พบไฟล์');return blob(f.driveId)}

if(a.action==='loanPhoto'){must(m);let l=rows('loans').find(x=>x.id===a.id);if(!l)throw Error('ไม่พบรายการ');if(l.memberId!==m.id)admin(m);let id=a.phase==='return'?l.returnPhoto:l.borrowPhoto;if(!id)throw Error('ยังไม่มีภาพ');return blob(id)}

admin(m);

if(a.action==='deleteLoanPhoto'){if(!['borrow','return'].includes(a.phase))throw Error('ประเภทภาพไม่ถูกต้อง');let l=rows('loans').find(x=>x.id===a.id);if(!l)throw Error('ไม่พบรายการ');let key=a.phase==='borrow'?'borrowPhoto':'returnPhoto';let driveId=l[key];if(!driveId)return true;DriveApp.getFileById(driveId).setTrashed(true);delete l[key];l[key+'Deleted']=true;put('loans',l);return true}

if(a.action==='save'){

 let id=a.id||uid();if(a.kind==='post'){let type=['news','club','university'].includes(a.type)?a.type:'news',old=rows('posts').find(p=>p.id===id);if(!text(a.title)||!text(a.body))throw Error('ระบุหัวข้อและเนื้อหา');let image=text(a.image,2000);if(image&&!/^https:\/\//.test(image))throw Error('URL ภาพต้องเป็น HTTPS');let imageDriveId=a.photo?upload(a.photo,true):(image?'':old?.imageDriveId||'');put('posts',{id,type,imageDriveId,title:text(a.title,200),body:text(a.body,10000),category:text(a.category,100),image,createdAt:old?.createdAt||now()});if(!old&&type==='news')publishClubNotification('news',{id,title:text(a.title,200),body:text(a.body,10000)})}

 else if(a.kind==='event'){if(!text(a.title)||!a.date||!text(a.location))throw Error('ข้อมูลกิจกรรมไม่ครบ');let date=new Date(a.date);if(isNaN(date))throw Error('วันที่ไม่ถูกต้อง');let old=rows('events').find(e=>e.id===id);put('events',{id,title:text(a.title,200),body:text(a.body),date:date.toISOString(),location:text(a.location,200),capacity:Math.max(0,Math.floor(Number(a.capacity)||0)),open:old?old.open:true,imageDriveId:a.photo?upload(a.photo,true):old?.imageDriveId||'',createdAt:old?.createdAt||now()});if(!old)publishClubNotification('event',{id,title:text(a.title,200),body:text(a.body),date:date.toISOString(),location:text(a.location,200)})}

 else if(a.kind==='equipment'){if(!text(a.name))throw Error('ระบุชื่ออุปกรณ์');let old=rows('equipment').find(e=>e.id===id);put('equipment',{id,name:text(a.name,150),detail:text(a.detail),imageDriveId:a.photo?upload(a.photo,true):old?.imageDriveId||''})}

 else if(a.kind==='folder'){if(!text(a.name))throw Error('ระบุชื่อโฟลเดอร์');put('folders',{id,name:text(a.name,150)})}

 else if(a.kind==='file'){if(a.folderId&&!rows('folders').some(f=>f.id===a.folderId))throw Error('ไม่พบโฟลเดอร์');let driveId=upload(a.file,false);put('files',{id,name:text(a.file.name,200),driveId,folderId:a.folderId||'',createdAt:now()})}else throw Error('ประเภทไม่ถูกต้อง');return true

}

if(a.action==='delete'){

 if(!['posts','events','equipment','folders','files'].includes(a.table))throw Error('ไม่อนุญาต');if(a.table==='equipment'&&rows('loans').some(l=>l.equipmentId===a.id))throw Error('มีประวัติยืม ไม่สามารถลบได้');if(a.table==='events')rows('joins').filter(j=>j.eventId===a.id).forEach(j=>del('joins',j.id));if(a.table==='folders'&&rows('files').some(f=>f.folderId===a.id))throw Error('โฟลเดอร์ยังมีไฟล์');if(a.table==='files'){let f=rows('files').find(f=>f.id===a.id);if(f)DriveApp.getFileById(f.driveId).setTrashed(true)}del(a.table,a.id);if(a.table==='posts')rows('hearts').filter(h=>h.postId===a.id).forEach(h=>del('hearts',h.id));return true

}

if(a.action==='settings'){let url=text(a.bookingUrl,2000);if(url&&!/^https:\/\//.test(url))throw Error('URL ต้องเป็น HTTPS');put('settings',{id:'site',bookingUrl:url});return true}

if(a.action==='toggleEvent'){let e=rows('events').find(x=>x.id===a.id);if(!e)throw Error('ไม่พบกิจกรรม');e.open=!e.open;put('events',e);return true}

if(a.action==='position'){let member=rows('members').find(x=>x.id===a.id);if(!member)throw Error('ไม่พบสมาชิก');member.position=text(a.position,100)||'สมาชิก';put('members',member);return true}

if(a.action==='participants'){let ids=rows('joins').filter(j=>j.eventId===a.id).map(j=>j.memberId);return rows('members').filter(m=>ids.includes(m.id)).map(m=>({name:m.name,studentId:m.studentId}))}

throw Error('Unknown action');

}
