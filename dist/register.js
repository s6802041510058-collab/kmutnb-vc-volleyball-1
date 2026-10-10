const form=document.querySelector('#registerForm');
const fields=['fullName','nickname','studentId','email'];
const labels={fullName:'ชื่อ–นามสกุล',nickname:'ชื่อเล่น',studentId:'รหัสนักศึกษา',email:'อีเมล'};
function clearError(id){document.querySelector('#'+id+'Error').hidden=true;document.querySelector('#'+id).removeAttribute('aria-invalid');document.querySelector('#'+id+'Wrap').classList.remove('invalid');}
fields.forEach(id=>document.querySelector('#'+id).addEventListener('input',()=>clearError(id)));
form.addEventListener('submit',event=>{
 event.preventDefault();let firstInvalid=null;
 fields.forEach(id=>{clearError(id);const input=document.querySelector('#'+id);input.value=input.value.trim();if(!input.validity.valid){const error=document.querySelector('#'+id+'Error');error.textContent=input.validity.valueMissing?'กรุณากรอก'+labels[id]:id==='email'?'กรุณากรอกอีเมลให้ถูกต้อง เช่น you@example.com':'กรุณากรอกรหัสนักศึกษาเป็นตัวเลข';error.hidden=false;input.setAttribute('aria-invalid','true');document.querySelector('#'+id+'Wrap').classList.add('invalid');firstInvalid??=input;}});
 if(firstInvalid){firstInvalid.focus();return;}
 document.querySelector('#statusTitle').textContent='ข้อมูลครบถ้วนแล้ว';
 document.querySelector('#statusText').textContent='หน้านี้เป็นตัวอย่างสำหรับตรวจดีไซน์ ยังไม่ได้บันทึกข้อมูล สมัครสมาชิก หรือส่งรหัสยืนยันจริง เราจะเชื่อมระบบหลังจากตรวจหน้านี้ร่วมกันแล้วค่ะ';
 document.querySelector('#status').showModal();
});
document.querySelector('#closeDialog').addEventListener('click',()=>document.querySelector('#status').close());
