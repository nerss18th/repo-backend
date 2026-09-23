const multer = require('multer');
const path = require('path');

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
        const fs = require('fs');
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

// กำหนด filter สำหรับตรวจสอบไฟล์รูปภาพ (ถ้าต้องการ)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น!'), false);
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

module.exports = {
    uploadUserPic,
    uploadDiagramPic
};
