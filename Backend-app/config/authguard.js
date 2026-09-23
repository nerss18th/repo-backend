const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('./mysql'); // Added to support database queries in guards

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const SALT_ROUNDS = 10;

/**
 * เข้ารหัสรหัสผ่าน (ใช้ตอนสมัครสมาชิก)
 * @param {string} password - รหัสผ่านตัวเต็ม
 * @returns {Promise<string>} - รหัสผ่านที่ถูก hash แล้ว
 */
const hashPassword = async (password) => {
    return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * ตรวจสอบรหัสผ่าน (ใช้ตอนเข้าสู่ระบบ)
 * @param {string} password - รหัสผ่านตัวเต็มที่ส่งมา
 * @param {string} hashedPassword - รหัสผ่านที่ hash ไว้ในฐานข้อมูล
 * @returns {Promise<boolean>} - true หากรหัสผ่านถูกต้อง
 */
const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

/**
 * สร้าง JWT Token (ใช้ตอนเข้าสู่ระบบสำเร็จ)
 * @param {object} payload - ข้อมูลผู้ใช้ เช่น { id, email, role }
 * @param {string} expiresIn - อายุของ token (เช่น '1h', '1d', '7d')
 * @returns {string} - JWT token
 */
const generateToken = (payload, expiresIn = '1d') => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

/**
 * ถอดรหัสและตรวจสอบ JWT Token
 * @param {string} token - JWT token
 * @returns {object|null} - payload ที่ถูกถอดรหัส หรือ null ถ้าไม่ถูกต้อง/หมดอายุ
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

/**
 * Middleware สำหรับป้องกัน Route ที่ต้องผ่านการเข้าสู่ระบบก่อนใช้งาน
 */
const authGuard = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // รูปแบบ "Bearer <TOKEN>"

    if (!token) {
        return res.status(401).json({ success: false, message: 'Unauthorized: ไม่พบ Token' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Token ไม่ถูกต้องหรือหมดอายุ' });
    }
};

/**
 * Middleware สำหรับป้องกัน Route ที่สงวนไว้สำหรับ Admin เท่านั้น
 * ต้องเรียกใช้หลังจาก authGuard
 */
const adminGuard = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.plan === 'Admin')) {
        next();
    } else {
        return res.status(403).json({ success: false, message: 'Forbidden: คุณไม่มีสิทธิ์เข้าถึงส่วนนี้' });
    }
};

/**
 * Middleware สำหรับป้องกันการแก้ไขข้อมูลของ Viewer (อนุญาตเฉพาะ Owner หรือ Editor)
 * ต้องเรียกใช้หลังจาก authGuard
 */
const projectEditorGuard = async (req, res, next) => {
    try {
        const projectId = req.params.projectId || req.params.id || req.body.projectId;

        if (!projectId) {
            // ถ้าระบุโปรเจกต์ไม่ได้ (เช่นบางอัพโหลด) ให้ผ่านไปก่อน แล้วค่อยไปเช็คใน route ถ้าจำเป็น
            return next();
        }

        const userId = req.user.id;
        const userEmail = req.user.email;

        // 1. ตรวจสอบว่าเป็นเจ้าของโปรเจกต์ (Owner) หรือไม่
        const [projects] = await pool.query('SELECT created_by FROM projects WHERE id = ?', [projectId]);
        if (projects.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบโปรเจกต์' });
        }
        
        if (projects[0].created_by === userId) {
            return next();
        }

        // 2. ตรวจสอบว่าเป็นสมาชิกที่มีสิทธิ์ Editor หรือไม่
        const [members] = await pool.query(
            'SELECT role FROM project_members WHERE project_id = ? AND (user_id = ? OR email = ?)',
            [projectId, userId, userEmail]
        );

        if (members.length > 0 && members[0].role === 'Editor') {
            return next();
        }

        // ไม่มีสิทธิ์
        return res.status(403).json({ success: false, message: 'Forbidden: คุณเข้าชมในฐานะ Viewer เท่านั้น ไม่มีสิทธิ์แก้ไขข้อมูลในโปรเจกต์นี้' });

    } catch (error) {
        console.error('projectEditorGuard error:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken,
    authGuard,
    adminGuard,
    projectEditorGuard
};
