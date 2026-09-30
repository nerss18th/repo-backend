const express = require('express');
const router = express.Router();
const pool = require('../config/mysql');
const { authGuard, adminGuard } = require('../config/authguard');

/**
 * @route   GET /admin/users
 * @desc    ดึงข้อมูลผู้ใช้งานทั้งหมดในระบบ (เฉพาะ Admin)
 * @access  Private (Admin Only)
 */
router.get('/users', authGuard, adminGuard, async (req, res) => {
    try {
        const [users] = await pool.query(
            "SELECT id, email, username, name, phone, plan, role FROM users WHERE role != 'admin' AND plan != 'Admin' ORDER BY id ASC"
        );
        return res.json({ success: true, users });
    } catch (error) {
        console.error('Get all users error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   PUT /admin/users/:id/role
 * @desc    เปลี่ยนระดับสิทธิ์ (Role) ของผู้ใช้งาน (เฉพาะ Admin)
 * @access  Private (Admin Only)
 */
router.put('/users/:id/role', authGuard, adminGuard, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body; // 'admin' หรือ 'user'

        if (!['admin', 'user'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Role ไม่ถูกต้อง' });
        }

        // ป้องกันไม่ให้แอดมินเปลี่ยนสิทธิ์ตัวเองโดยไม่ตั้งใจ
        if (parseInt(id) === req.user.id) {
             return res.status(400).json({ success: false, message: 'คุณไม่สามารถเปลี่ยนสิทธิ์ของตัวคุณเองได้ที่นี่' });
        }

        await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);

        return res.json({ success: true, message: `เปลี่ยนสิทธิ์ผู้ใช้เป็น ${role} สำเร็จ` });
    } catch (error) {
        console.error('Change role error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   DELETE /admin/users/:id
 * @desc    ลบบัญชีผู้ใช้งาน (เฉพาะ Admin)
 * @access  Private (Admin Only)
 */
router.delete('/users/:id', authGuard, adminGuard, async (req, res) => {
    try {
        const { id } = req.params;

        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ success: false, message: 'คุณไม่สามารถลบบัญชีของตัวคุณเองได้' });
        }

        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        return res.json({ success: true, message: 'ลบผู้ใช้งานเรียบร้อยแล้ว' });
    } catch (error) {
        console.error('Delete user error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   GET /admin/users/:id/projects
 * @desc    ดึงข้อมูลโปรเจกต์ทั้งหมดที่ผู้ใช้คนนั้นเป็น Owner
 * @access  Private (Admin Only)
 */
router.get('/users/:id/projects', authGuard, adminGuard, async (req, res) => {
    try {
        const { id } = req.params;
        const [projects] = await pool.query(
            'SELECT id, name, detail FROM projects WHERE created_by = ? ORDER BY id ASC',
            [id]
        );
        return res.json({ success: true, projects });
    } catch (error) {
        console.error('Get user projects error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   PUT /admin/users/:id/plan
 * @desc    เปลี่ยนแพ็กเกจ (Plan) ของผู้ใช้งาน (เฉพาะ Admin)
 * @access  Private (Admin Only)
 */
router.put('/users/:id/plan', authGuard, adminGuard, async (req, res) => {
    try {
        const { id } = req.params;
        const { plan } = req.body; // 'Standard' หรือ 'Pro'

        if (!['Standard', 'Pro'].includes(plan)) {
            return res.status(400).json({ success: false, message: 'Plan ไม่ถูกต้อง (รองรับ Standard หรือ Pro เท่านั้น)' });
        }

        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ success: false, message: 'คุณไม่สามารถเปลี่ยนแพ็กเกจของตัวคุณเองได้ที่นี่' });
        }

        await pool.query('UPDATE users SET plan = ? WHERE id = ?', [plan, id]);

        return res.json({ success: true, message: `เปลี่ยนแพ็กเกจผู้ใช้เป็น ${plan} สำเร็จ` });
    } catch (error) {
        console.error('Change plan error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
