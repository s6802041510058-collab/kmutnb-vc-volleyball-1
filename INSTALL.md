# ติดตั้งระบบสมาชิก KMUTNB VC ใหม่

1. เปิดโครงการ Apps Script ที่ใช้ URL Web App ที่ส่งมา
2. วาง Code.gs จากเว็บแทนโค้ดเดิม (สำรองโค้ดเดิมก่อน)
3. เลือกฟังก์ชัน setup แล้วกด Run และอนุญาตเข้าถึง Sheets, Drive และการส่งอีเมล
4. Deploy > Manage deployments > Edit > Version: New version
5. ตั้ง Execute as: Me และ Who has access: Anyone แล้ว Deploy
6. ใช้ deployment เดิม เพื่อให้ URL /exec ไม่เปลี่ยน
7. เปิด URL /exec ควรเห็น JSON ที่มี status: ready
8. เปิดหน้าสมัครสมาชิก กรอกข้อมูล รับ OTP และยืนยันรหัส

Code.gs ตั้งค่า Spreadsheet ID, Drive Folder ID และอีเมลผู้ดูแลตามที่ให้มาในฟังก์ชัน setup แล้ว ไม่สร้างสมาชิกหรือข้อมูลตัวอย่าง

ผู้ดูแลต้องสมัครและยืนยันอีเมล s6802041510058@email.kmutnb.ac.th ก่อน ระบบกำหนด role เป็น admin จากฝั่งเซิร์ฟเวอร์ โดยตำแหน่งชมรมยังเป็นสมาชิก

รอบนี้เชื่อมการสมัคร เข้าสู่ระบบ และรายชื่อสมาชิก ส่วน CMS/โพสต์/กิจกรรม/อุปกรณ์/เอกสารจะเชื่อมต่อทีละส่วนภายหลัง

## เวอร์ชัน 3: รูปอุปกรณ์และยืม–คืนแบบเปิด
แทน Code.gs ด้วยไฟล์ล่าสุดแล้ว Deploy > Manage deployments > Edit > New version > Deploy โดยใช้ URL เดิม ไม่จำเป็นต้อง Run setup ซ้ำหากตั้งค่าครบแล้ว
เวอร์ชันนี้ไม่ปิดอุปกรณ์เพราะมีคนยืมอยู่ รองรับหลายรายการยืมและการส่งภาพคืนโดยไม่มีรายการยืมเดิม เพิ่มรูปอุปกรณ์ และลดการอ่าน Sheets ซ้ำภายในคำขอเดียว
เว็บแสดงภาพใต้รายการอุปกรณ์สำหรับเจ้าของรายการและผู้ดูแล


## ข่าวอัตโนมัติจากกองกิจการนักศึกษา
1. สำรองโค้ดเดิมและแทน Code.gs ด้วยไฟล์ล่าสุด
2. เพิ่มไฟล์สคริปต์ ExternalNews.gs ใน Apps Script และวางโค้ดจากไฟล์ชื่อเดียวกัน
3. Run ฟังก์ชัน enableExternalNews หนึ่งครั้ง และอนุญาตการเรียกเว็บภายนอก การส่งอีเมล และตัวตั้งเวลา
4. ฟังก์ชันจะนำเข้าข่าวเดิมโดยไม่ส่งอีเมล และสร้าง trigger ตรวจข่าวทุก 15 นาที (Run ซ้ำไม่สร้าง trigger ซ้ำ)
5. Deploy > Manage deployments > Edit > New version > Deploy ใช้ URL เดิม
6. เปิด news.html ตรวจส่วนข่าวจากกองกิจการนักศึกษา และตรวจ trigger ใน Apps Script
7. เว็บไซต์ที่ Vercel ต้องอัปเดตไฟล์หน้าเว็บจากเวอร์ชันนี้ด้วย

ข่าวใหม่หลังเปิดระบบจะเข้าคิวอีเมลให้สมาชิกที่สมัครก่อนข่าวเผยแพร่ มีการป้องกันข่าวและคิวซ้ำ เหลือโควตา 20 ฉบับสำหรับ OTP ในแต่ละรอบ งาน pending จะส่งต่อในรอบถัดไป สถานะ failed/sending ต้องตรวจในชีต mailQueue ก่อนส่งซ้ำเพื่อป้องกันอีเมลซ้ำ การแจ้งเตือนนี้ตรวจทุก 15 นาที ไม่ใช่ทันที และยังไม่ครอบคลุมโพสต์ของชมรมหรือปฏิทิน


## ปฏิทินและแจ้งเตือนข่าว/กิจกรรมใหม่
- อัปเดต Code.gs และ ExternalNews.gs และเพิ่ม Notifications.gs
- Run enableClubNotifications หนึ่งครั้ง อนุญาตสิทธิ์อีเมลและ trigger
- Deploy เวอร์ชันใหม่โดยใช้ URL เดิม
- ตั้ง Script Property CLUB_SITE_URL เป็น URL เว็บ Vercel จริงเพื่อให้อีเมลมีลิงก์เว็บของคุณ
- เว็บแสดงปฏิทินเดือนปัจจุบันตามเวลาประเทศไทย ใช้ข้อมูลกิจกรรมเดิมและปุ่มเพิ่มลง Google Calendar (เวลาสิ้นสุดเริ่มต้น 1 ชั่วโมง ต้องตรวจแก้ก่อนบันทึก)
- สมาชิกที่เข้าสู่ระบบจะเห็นกล่องแจ้งเตือน ตรวจทุก 30 วินาทีขณะเปิดหน้าเว็บและแท็บทำงาน ไม่ใช่ push ขณะปิดเว็บ
- ผู้ดูแลสร้างข่าว/กิจกรรมใหม่จะสร้างรายการแจ้งเตือนและคิวอีเมล การแก้รายการเดิมไม่แจ้งซ้ำ ข่าว/กิจกรรมย้อนหลังไม่ถูกนำมาส่ง
- trigger ส่งอีเมลประมาณทุก 1 นาที สูงสุด 20 ฉบับต่อรอบและเหลือโควตา 20 สำหรับ OTP จึงอาจล่าช้าตามจำนวนสมาชิกและโควตา
- สถานะ sending/failed ใน mailQueue ต้องตรวจสอบก่อนส่งซ้ำ ไม่ส่งซ้ำอัตโนมัติเมื่อผลส่งไม่แน่นอน
- ทดสอบสร้างข่าวใหม่และกิจกรรมใหม่ด้วย CMS ตรวจบัญชีสมาชิกอีกบัญชี ปฏิทิน กล่องแจ้งเตือน และอีเมล


## Student card and equipment quantity update
Replace the entire main Code.gs in Google Apps Script with this version, save, and deploy a new version using the same Web App URL. Keep your existing Notifications.gs and ExternalNews.gs. No need to run setup again. New borrowing and returns require student-card evidence and a positive integer quantity. Partial returns create separate evidence records and update the remaining quantity. Old records keep their original evidence.
