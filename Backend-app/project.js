const express = require('express');
const router = express.Router();
const pool = require('./config/mysql');
const { authGuard, projectEditorGuard } = require('./config/authguard');

/**
 * @route   GET /projects
 * @desc    ดึงโปรเจกต์ทั้งหมดที่ผู้ใช้มีสิทธิ์เข้าถึง (เป็น Owner หรือ Member)
 * @access  Private
 */
router.get('/', authGuard, async (req, res) => {
    try {
        const userId = req.user.id;
        const userEmail = req.user.email;

        const [projects] = await pool.query(
            `SELECT DISTINCT p.id, p.name, p.detail, p.created_by
             FROM projects p
             LEFT JOIN project_members pm ON p.id = pm.project_id
             WHERE p.created_by = ? OR pm.user_id = ? OR pm.email = ?`,
            [userId, userId, userEmail]
        );

        return res.json({ success: true, projects });
    } catch (error) {
        console.error('Get projects error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   POST /projects
 * @desc    สร้างโปรเจกต์ใหม่
 * @access  Private
 */
router.post('/', authGuard, async (req, res) => {
    try {
        const { name, detail } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อโปรเจกต์' });
        }

        const userId = req.user.id;

        // ตรวจสอบ Plan ปัจจุบันของ user
        const [users] = await pool.query('SELECT plan FROM users WHERE id = ?', [userId]);
        const userPlan = users.length > 0 ? users[0].plan : 'Standard';

        if (userPlan !== 'Pro') {
            // นับจำนวนโปรเจกต์ที่ user คนนี้สร้าง
            const [projectCountRes] = await pool.query('SELECT COUNT(*) as count FROM projects WHERE created_by = ?', [userId]);
            const projectCount = projectCountRes[0].count;

            if (projectCount >= 1) {
                return res.status(403).json({ success: false, message: 'บัญชี Standard สามารถสร้างโปรเจกต์ได้สูงสุด 1 โปรเจกต์ กรุณาอัปเกรดเป็น Pro' });
            }
        }

        const [result] = await pool.query(
            'INSERT INTO projects (name, detail, created_by) VALUES (?, ?, ?)',
            [name.trim(), detail ? detail.trim() : '', userId]
        );

        // เพิ่มเจ้าของลงใน project_members เป็น Owner
        await pool.query(
            'INSERT INTO project_members (project_id, user_id, email, role) VALUES (?, ?, ?, ?)',
            [result.insertId, userId, req.user.email, 'Owner']
        );

        return res.status(201).json({
            success: true,
            message: 'สร้างโปรเจกต์สำเร็จ',
            project: {
                id: result.insertId,
                name: name.trim(),
                detail: detail ? detail.trim() : '',
                created_by: userId
            }
        });
    } catch (error) {
        console.error('Create project error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   GET /projects/:id
 * @desc    ดึงข้อมูลรายละเอียดโปรเจกต์และสมาชิกในทีม
 * @access  Private
 */
router.get('/:id', authGuard, async (req, res) => {
    try {
        const projectId = req.params.id;

        const [projects] = await pool.query(
            'SELECT id, name, detail, created_by FROM projects WHERE id = ?',
            [projectId]
        );

        if (projects.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบโปรเจกต์นี้' });
        }

        const [members] = await pool.query(
            `SELECT pm.id, pm.user_id, pm.email, pm.role, u.name 
             FROM project_members pm
             LEFT JOIN users u ON pm.user_id = u.id OR pm.email = u.email
             WHERE pm.project_id = ?`,
            [projectId]
        );

        // ถ้าเป็น Admin (และไม่ได้เป็นสมาชิกอยู่แล้ว) ให้เพิ่มสิทธิ์ Viewer ชั่วคราวเพื่อให้ดูข้อมูลได้
        if (req.user && (req.user.role === 'admin' || req.user.plan === 'Admin')) {
            const isAdminMember = members.some(m => m.user_id === req.user.id || m.email === req.user.email);
            if (!isAdminMember) {
                members.push({
                    id: 999999, // ID สมมติ
                    user_id: req.user.id,
                    email: req.user.email,
                    role: 'Viewer',
                    name: req.user.name || 'Admin'
                });
            }
        }

        return res.json({
            success: true,
            project: projects[0],
            members
        });
    } catch (error) {
        console.error('Get project detail error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   PUT /projects/:id
 * @desc    แก้ไขชื่อโปรเจกต์และรายละเอียด
 * @access  Private
 */
router.put('/:id', [authGuard, projectEditorGuard], async (req, res) => {
    try {
        const projectId = req.params.id;
        const { name, detail } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อโปรเจกต์' });
        }

        await pool.query(
            'UPDATE projects SET name = ?, detail = ? WHERE id = ?',
            [name.trim(), detail ? detail.trim() : '', projectId]
        );

        return res.json({ success: true, message: 'บันทึกการแก้ไขโปรเจกต์สำเร็จ' });
    } catch (error) {
        console.error('Update project error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   DELETE /projects/:id
 * @desc    ลบโปรเจกต์
 * @access  Private (Owner)
 */
router.delete('/:id', authGuard, async (req, res) => {
    try {
        const projectId = req.params.id;
        const userId = req.user.id;

        // ตรวจสอบสิทธิ์ว่าใช่เจ้าของโปรเจกต์ (created_by) หรือเป็น Admin หรือไม่
        const [project] = await pool.query('SELECT created_by FROM projects WHERE id = ?', [projectId]);
        if (project.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบโปรเจกต์' });
        }
        if (project[0].created_by !== userId && req.user.role !== 'admin' && req.user.plan !== 'Admin') {
            return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์ลบโปรเจกต์นี้' });
        }

        // ลบข้อมูลที่เกี่ยวข้อง
        await pool.query('DELETE FROM diagrams WHERE project_id = ?', [projectId]);
        await pool.query('DELETE FROM project_members WHERE project_id = ?', [projectId]);
        await pool.query('DELETE FROM projects WHERE id = ?', [projectId]);

        return res.json({ success: true, message: 'ลบโปรเจกต์สำเร็จ' });
    } catch (error) {
        console.error('Delete project error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   POST /projects/:id/members
 * @desc    เพิ่มสมาชิกในทีม
 * @access  Private
 */
router.post('/:id/members', authGuard, async (req, res) => {
    try {
        const projectId = req.params.id;
        const { email, role } = req.body;

        if (!email || !email.trim()) {
            return res.status(400).json({ success: false, message: 'กรุณากรอกอีเมลสมาชิก' });
        }

        // ตรวจสอบสิทธิ์ว่าเป็นเจ้าของโปรเจกต์ (Owner) เท่านั้นที่เพิ่มสมาชิกได้
        const [projectRows] = await pool.query('SELECT created_by FROM projects WHERE id = ?', [projectId]);
        if (projectRows.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบโปรเจกต์' });
        }
        if (projectRows[0].created_by !== req.user.id) {
            return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์เพิ่มสมาชิกในโปรเจกต์นี้ เฉพาะเจ้าของโปรเจกต์เท่านั้น' });
        }

        // ค้นหา user_id ถ้าสมาชิกมีการลงทะเบียนในระบบแล้ว
        const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email.trim()]);
        const targetUserId = users.length > 0 ? users[0].id : null;

        const [result] = await pool.query(
            'INSERT INTO project_members (project_id, user_id, email, role) VALUES (?, ?, ?, ?)',
            [projectId, targetUserId, email.trim(), 'Editor']
        );

        return res.status(201).json({
            success: true,
            message: 'เพิ่มสมาชิกสำเร็จ',
            member: {
                id: result.insertId,
                email: email.trim(),
                role: 'Editor',
                user_id: targetUserId
            }
        });
    } catch (error) {
        console.error('Add member error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   DELETE /projects/:id/members/:memberId
 * @desc    ลบสมาชิกออกจากทีม
 * @access  Private
 */
router.delete('/:id/members/:memberId', authGuard, async (req, res) => {
    try {
        const { id: projectId, memberId } = req.params;

        // ตรวจสอบสิทธิ์ว่าเป็นเจ้าของโปรเจกต์ (Owner) เท่านั้นที่ลบสมาชิกได้
        const [projectRows] = await pool.query('SELECT created_by FROM projects WHERE id = ?', [projectId]);
        if (projectRows.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบโปรเจกต์' });
        }
        if (projectRows[0].created_by !== req.user.id) {
            return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์ลบสมาชิกในโปรเจกต์นี้ เฉพาะเจ้าของโปรเจกต์เท่านั้น' });
        }

        await pool.query('DELETE FROM project_members WHERE id = ?', [memberId]);
        return res.json({ success: true, message: 'ลบสมาชิกเรียบร้อยแล้ว' });
    } catch (error) {
        console.error('Remove member error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
