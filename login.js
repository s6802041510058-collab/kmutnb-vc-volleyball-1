const form=document.querySelector('#loginForm');
const email=document.querySelector('#email');
const error=document.querySelector('#emailError');
const dialog=document.querySelector('#status');
function clearError(){error.hidden=true;email.removeAttribute('aria-invalid');document.querySelector('#emailWrap').classList.remove('invalid');}
function showStatus(title,message){document.querySelector('#statusTitle').textContent=title;document.querySelector('#statusText').textContent=message;dialog.showModal();}
email.addEventListener('input',clearError);
form.addEventListener('submit',event=>{event.preventDefault();clearError();email.value=email.value.trim();if(!email.validity.valid){error.textContent=email.validity.valueMissing?'กรุณากรอกอีเมลสมาชิก':'กรุณากรอกอีเมลให้ถูกต้อง เช่น you@example.com';error.hidden=false;email.setAttribute('aria-invalid','true');document.querySelector('#emailWrap').classList.add('invalid');email.focus();return;}showStatus('รูปแบบอีเมลถูกต้อง','หน้านี้เป็นตัวอย่างสำหรับตรวจดีไซน์ ระบบยังไม่ได้ส่งรหัสยืนยันหรือเข้าสู่ระบบจริง การเชื่อมระบบยืนยันอีเมลจะทำหลังจากตรวจหน้านี้ร่วมกันแล้ว');});
document.querySelector('#signup').addEventListener('click',()=>{location.href='register.html';});
document.querySelector('#closeDialog').addEventListener('click',()=>dialog.close());
