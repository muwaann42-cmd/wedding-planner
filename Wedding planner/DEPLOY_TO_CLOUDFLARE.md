# ☁️ คู่มือการนำ Webapp ขึ้น Cloudflare Pages + เชื่อมต่อ Cloudflare D1 Database

ระบบนี้ได้รับการออกแบบให้เป็น **Serverless Full-Stack บน Cloudflare 100%**:
- **Hosting:** Cloudflare Pages (โหลดเร็วระดับ Global Edge, CDN ฟรี, SSL อัตโนมัติ)
- **Backend API:** Cloudflare Pages Functions (`/functions/api/wedding.js`)
- **Database:** Cloudflare D1 (Serverless SQLite Database ของ Cloudflare)
- **Offline / Local Fallback:** หากเน็ตหลุดหรือรันบนเครื่อง จะเซฟลง IndexedDB ในตัวโดยไม่สะดุด

---

## 🚀 วิธีติดตั้งขึ้น Cloudflare (ง่ายที่สุดผ่านหน้า Dashboard)

### ขั้นตอนที่ 1: สร้าง Database บน Cloudflare D1
1. เข้าสู่ระบบที่ [https://dash.cloudflare.com/](https://dash.cloudflare.com/)
2. ที่เมนูด้านซ้าย เลือก **Storage & Databases** > **D1 SQL Database**
3. คลิกปุ่ม **Create database**
4. ตั้งชื่อ Database Name: `wedding-planner-db` แล้วคลิก **Create**
5. *(ตัวเลือกเสริม)* คลิกแท็บ **Console** แล้วนำโค้ดในไฟล์ [schema.sql](schema.sql) ไปวางแล้วกด **Execute** (หรือปล่อยให้ระบบสร้างตารางให้อัตโนมัติเมื่อมีการบันทึกครั้งแรก)

---

### ขั้นตอนที่ 2: Deploy ขึ้น Cloudflare Pages

เลือกทำได้ 2 แบบตามความสะดวก:

#### แบบที่ A: ผ่าน GitHub (แนะนำที่สุด — แก้ไขโค้ดแล้วอัปเดตให้อัตโนมัติ)
1. นำโฟลเดอร์นี้ Push ขึ้น GitHub ของคุณ
2. ใน Cloudflare Dashboard ไปที่ **Workers & Pages** > คลิก **Create application** > แท็บ **Pages**
3. คลิก **Connect to Git** แล้วเลือก Repository โปรเจกต์นี้
4. ตั้งค่า Build settings:
   - **Framework preset:** `None`
   - **Build command:** *(เว้นว่างไว้)*
   - **Build output directory:** `.`
5. คลิก **Save and Deploy**

#### แบบที่ B: อัปโหลดโฟลเดอร์โดยตรง (Direct Upload ไม่ต้องมี GitHub)
1. ใน Cloudflare Dashboard ไปที่ **Workers & Pages** > คลิก **Create application** > แท็บ **Pages**
2. เลือก **Upload assets**
3. ตั้งชื่อโปรเจกต์ เช่น `lumiere-wedding-planner`
4. ลากไฟล์ในโฟลเดอร์นี้ทั้งหมดขึ้นไปวาง แล้วกด **Deploy site**

---

### ขั้นตอนที่ 3: เชื่อมต่อ Database เข้ากับ Pages (ทำเพียงครั้งเดียว)
1. เมื่อ Deploy เสร็จแล้ว ให้เข้าไปที่หน้าโปรเจกต์ Pages นั้น
2. ไปที่แท็บ **Settings** > เมนูด้านซ้ายเลือก **Functions**
3. เลื่อนลงมาที่หัวข้อ **D1 Database Bindings** > คลิก **Add binding**
4. กำหนดค่า:
   - **Variable name:** `DB` *(ต้องพิมพ์เป็นตัวพิมพ์ใหญ่ว่า DB)*
   - **D1 database:** เลือก `wedding-planner-db` (ฐานข้อมูลที่สร้างไว้ในขั้นตอนที่ 1)
5. คลิก **Save**
6. ไปที่แท็บ **Deployments** > คลิกจุดสามจุด `...` ที่การ Deploy ล่าสุด แล้วเลือก **Retry deployment** (เพื่อให้ binding มีผล)

---

## ✨ ผลลัพธ์ที่ได้
- คุณจะได้ URL เว็บจริง เช่น `https://wedding-planner-xxx.pages.dev`
- สามารถส่งลิงก์นี้ให้บ่าวสาว ครอบครัว หรือทีมงานเปิดได้จากมือถือและคอมพิวเตอร์พร้อมกัน
- ข้อมูลที่แก้ไขจะถูกบันทึกลง **Cloudflare D1 Database** แบบเรียลไทม์ และมีป้ายสถานะสีเขียวขึ้นว่า `✓ เชื่อมต่อ Cloudflare D1 แล้ว`
