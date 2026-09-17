# 🚀 คู่มือการตั้งค่าและรันโปรเจกต์

โปรเจกต์นี้ใช้ Docker ในการรันระบบทั้งหมด

## 📋 สิ่งที่ต้องติดตั้งไว้ในเครื่อง
- Docker Desktop
- Git

---

## 🛠️ ขั้นตอนการติดตั้ง

### 1. โคลนโปรเจกต์
เปิด Terminal ตำแหน่งที่ต้องการติดตั้ง แล้วรันคำสั่งเพื่อดึงโค้ดและเข้าไปที่โฟลเดอร์ `backend`:
```bash
git clone [URL_ของ_Repository]
cd backend
```

### 2. จัดเตรียมไฟล์ .env
- เข้าไปที่โฟลเดอร์ Backend-app/ 
- คัดลอกไฟล์ .env มาวาง

### 3. ตรวจสอบไฟล์ฐานข้อมูล 
ตรวจสอบว่าในโฟลเดอร์ init-db/ มีไฟล์ ontology_db.sql อยู่หรือไม่

### 4. รันระบบ
เปิด Terminal ที่โฟลเดอร์ที่มีไฟล์ docker-compose.yml แล้วรันคำสั่ง: 
```bash
docker-compose up -d --build
```

### 💻 ข้อมูลการเข้าใช้งาน
- phpMyAdmin: http://localhost:8080
- Username: root
- Password: rootpassword