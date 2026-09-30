const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ตั้งค่า storage สำหรับ user profile picture
const userStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'user_pic'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'user-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// ตั้งค่า storage สำหรับ diagram picture
const diagramStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const type = req.body.type || 'other';
        const dir = path.join(__dirname, '..', 'diagram_pic', type);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const type = req.body.type || 'other';
        const username = req.user && req.user.username ? req.user.username : (req.user ? req.user.id : 'unknown');
        const randomNumber = Math.floor(Math.random() * 100000);
        cb(null, `diagram_${type}_${username}_${randomNumber}${path.extname(file.originalname)}`);
    }
});

// ตั้งค่า storage สำหรับ Receipt (สลิปการชำระเงิน)
const receiptStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '..', 'user_pic', 'Receipt');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const randomNum = Math.floor(Math.random() * 1000000);
        cb(null, `user-${dateStr}-${randomNum}${path.extname(file.originalname)}`);
    }
});

// กำหนด filter สำหรับตรวจสอบไฟล์รูปภาพ (ถ้าต้องการ)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น!'), false);
    }
};

// filter สำหรับสลิป (รองรับทั้ง image และ pdf)
const receiptFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('กรุณาอัปโหลดไฟล์รูปภาพหรือ PDF เท่านั้น!'), false);
    }
};

const uploadUserPic = multer({
    storage: userStorage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // จำกัดขนาดไฟล์ที่ 5MB
});

const uploadDiagramPic = multer({
    storage: diagramStorage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // จำกัดขนาดไฟล์ที่ 10MB
});

const uploadReceipt = multer({
    storage: receiptStorage,
    fileFilter: receiptFileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // จำกัดขนาดไฟล์ที่ 10MB
});

module.exports = {
    uploadUserPic,
    uploadDiagramPic,
    uploadReceipt
};
