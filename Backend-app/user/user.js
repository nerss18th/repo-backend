const express = require('express');
const router = express.Router();
const pool = require('../config/mysql');
const { hashPassword, comparePassword, generateToken, authGuard } = require('../config/authguard');
const { uploadUserPic, uploadReceipt } = require('../config/multerConfig');

/**
 * @route   POST /users/signup
 * @desc    สมัครสมาชิกผู้ใช้งานใหม่
 * @access  Public
 */
router.post('/signup', async (req, res) => {
    try {
        const { email, password, name, username, phone, plan } = req.body;

        // 1. ตรวจสอบข้อมูลที่จำเป็น
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'กรุณากรอก email และ password ให้ครบถ้วน'
            });
        }

        // 2. ตรวจสอบว่ามี email หรือ username นี้ในระบบแล้วหรือยัง
        const [existingUsers] = await pool.query(
            'SELECT id, email, username FROM users WHERE email = ? OR username = ?',
            [email, username || email.split('@')[0]]
        );

        if (existingUsers.length > 0) {
            const conflict = existingUsers[0];
            if (conflict.email === email) {
                return res.status(409).json({
                    success: false,
                    message: 'อีเมลนี้ถูกใช้งานในระบบแล้ว'
                });
            } else {
                return res.status(409).json({
                    success: false,
                    message: 'ชื่อผู้ใช้ (Username) นี้ถูกใช้งานในระบบแล้ว'
                });
            }
        }

        // 3. เข้ารหัสรหัสผ่าน (Hash password)
        const hashedPassword = await hashPassword(password);

        // 4. แยกการเก็บ username และ name
        const userNameVal = username || email.split('@')[0];
        const fullNameVal = name || userNameVal;
        const userPlan = plan === 'Pro' ? 'Pro' : 'Standard';
        const userPhone = phone || null;

        const [result] = await pool.query(
            'INSERT INTO users (email, password_hash, username, name, phone, plan) VALUES (?, ?, ?, ?, ?, ?)',
            [email, hashedPassword, userNameVal, fullNameVal, userPhone, userPlan]
        );

        const newUser = {
            id: result.insertId,
            email,
            username: userNameVal,
            name: fullNameVal,
            phone: userPhone,
            plan: userPlan
        };

        const token = generateToken({ id: newUser.id, email: newUser.email, username: newUser.username, name: newUser.name, plan: newUser.plan, role: 'user' });

        return res.status(201).json({
            success: true,
            message: 'สมัครสมาชิกสำเร็จ',
            token,
            user: newUser
        });
    } catch (error) {
        console.error('Signup Error:', error);
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์',
            error: error.message
        });
    }
});

/**
 * @route   POST /users/login
 * @desc    เข้าสู่ระบบ
 * @access  Public
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'กรุณากรอก email และ password'
            });
        }

        const [users] = await pool.query(
            'SELECT id, email, password_hash, username, name, phone, plan, pic, description, role, receipt FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
            });
        }

        const user = users[0];
        const isMatch = await comparePassword(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
            });
        }

        const loggedInUser = {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name || user.username,
            phone: user.phone,
            plan: user.plan,
            pic: user.pic,
            description: user.description,
            role: user.role,
            receipt: user.receipt
        };

        const token = generateToken({ id: user.id, email: user.email, username: user.username, name: loggedInUser.name, plan: user.plan, role: user.role });

        return res.json({
            success: true,
            message: 'เข้าสู่ระบบสำเร็จ',
            token,
            user: loggedInUser
        });
    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
            error: error.message
        });
    }
});

/**
 * @route   GET /users/me
 * @desc    ดึงข้อมูลผู้ใช้งานที่ล็อกอินอยู่
 * @access  Private
 */
router.get('/me', authGuard, async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, email, username, name, phone, plan, pic, description, role, receipt FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้งาน' });
        }

        return res.json({ success: true, user: users[0] });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   PUT /users/plan
 * @desc    อัปเดตแพ็กเกจผู้ใช้งาน (Standard / Pro)
 * @access  Private
 */
router.put('/plan', authGuard, async (req, res) => {
    try {
        const { plan } = req.body;
        const newPlan = plan === 'Pro' ? 'Pro' : 'Standard';

        await pool.query(
            'UPDATE users SET plan = ? WHERE id = ?',
            [newPlan, req.user.id]
        );

        return res.json({ success: true, message: 'อัปเดตแพ็กเกจเรียบร้อยแล้ว', plan: newPlan });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   PUT /users/profile
 * @desc    แก้ไขข้อมูลส่วนตัวของผู้ใช้งาน (ชื่อ - นามสกุล, เบอร์โทร)
 * @access  Public / Private
 */
router.put('/profile', async (req, res) => {
    try {
        const { id, email, name, phone, description } = req.body;

        let targetId = id;
        if (!targetId && email) {
            const [found] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
            if (found.length > 0) targetId = found[0].id;
        }

        if (!targetId) {
            return res.status(400).json({ success: false, message: 'ไม่พบรหัสผู้ใช้งานที่ต้องการแก้ไข' });
        }

        await pool.query(
            'UPDATE users SET email = COALESCE(?, email), name = ?, phone = ?, description = ? WHERE id = ?',
            [email || null, name ? name.trim() : null, phone ? phone.trim() : null, description ? description.trim() : null, targetId]
        );

        const [updatedUsers] = await pool.query(
            'SELECT id, email, username, name, phone, plan, pic, description, role FROM users WHERE id = ?',
            [targetId]
        );

        return res.json({
            success: true,
            message: 'แก้ไขข้อมูลส่วนตัวเรียบร้อยแล้ว',
            user: updatedUsers[0]
        });
    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   POST /users/upload-profile-pic
 * @desc    อัปโหลดรูปโปรไฟล์ผู้ใช้งาน
 * @access  Private
 */
router.post('/upload-profile-pic', authGuard, uploadUserPic.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'ไม่มีไฟล์รูปภาพที่อัปโหลด' });
        }
        
        const imagePath = `/user_pic/${req.file.filename}`;
        
        // อัปเดตที่อยู่รูปลงในคอลัมน์ pic ของตาราง users
        await pool.query('UPDATE users SET pic = ? WHERE id = ?', [imagePath, req.user.id]);
        
        return res.json({
            success: true,
            message: 'อัปโหลดรูปภาพโปรไฟล์สำเร็จ',
            imagePath: imagePath
        });
    } catch (error) {
        console.error('Upload profile pic error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   POST /users/upload-receipt
 * @desc    อัปโหลดสลิปการชำระเงินของผู้ใช้งาน (Pro Plan)
 * @access  Private
 */
router.post('/upload-receipt', authGuard, uploadReceipt.single('receipt'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'ไม่มีไฟล์สลิปที่อัปโหลด' });
        }

        const receiptPath = `/user_pic/Receipt/${req.file.filename}`;

        // อัปเดตที่อยู่สลิปลงในคอลัมน์ receipt ของตาราง users
        await pool.query('UPDATE users SET receipt = ? WHERE id = ?', [receiptPath, req.user.id]);

        return res.json({
            success: true,
            message: 'อัปโหลดสลิปการชำระเงินสำเร็จ',
            receiptPath: receiptPath
        });
    } catch (error) {
        console.error('Upload receipt error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
