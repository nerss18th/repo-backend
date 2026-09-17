const express = require('express');
const router = express.Router();
const pool = require('../mysql');
const { authGuard } = require('../authguard');

/**
 * Use Case Tables Initializer
 */
async function initUseCaseTables() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS use_cases (
                id VARCHAR(50) NOT NULL,
                project_id INT NOT NULL DEFAULT 1,
                type VARCHAR(50) DEFAULT 'Use Case',
                caption VARCHAR(255) NOT NULL,
                description TEXT,
                PRIMARY KEY (id, project_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        try { await pool.query('ALTER TABLE use_cases ADD COLUMN project_id INT NOT NULL DEFAULT 1'); } catch (e) {}
        try { await pool.query('ALTER TABLE use_case_relations ADD COLUMN project_id INT NOT NULL DEFAULT 1'); } catch (e) {}
    } catch (err) {
        console.error('Init use_case tables error:', err.message);
    }
}

/**
 * @route   GET /diagrams/project/:projectId/use-cases
 * @desc    ดึงรายการ Use Cases ของ Project
 * @access  Private
 */
router.get('/project/:projectId/use-cases', authGuard, async (req, res) => {
    try {
        await initUseCaseTables();
        const { projectId } = req.params;
        let [useCases] = await pool.query(
            'SELECT id, type, caption, description FROM use_cases WHERE project_id = ? ORDER BY id ASC',
            [projectId]
        );

        // ลบการสร้างข้อมูลจำลองอัตโนมัติเมื่อไม่มี Use Cases

        return res.json({ success: true, useCases });
    } catch (error) {
        console.error('Get use cases error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   POST /diagrams/project/:projectId/use-cases
 * @desc    เพิ่มหรืออัปเดต Use Case ตาม project_id
 * @access  Private
 */
router.post('/project/:projectId/use-cases', authGuard, async (req, res) => {
    try {
        await initUseCaseTables();
        const { projectId } = req.params;
        const { id, type, caption, description } = req.body;

        await pool.query(
            `INSERT INTO use_cases (id, project_id, type, caption, description)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE type = VALUES(type), caption = VALUES(caption), description = VALUES(description)`,
            [id, projectId, type || 'Use Case', caption, description || '']
        );

        return res.json({ success: true, message: 'บันทึก Use Case สำเร็จ' });
    } catch (error) {
        console.error('Save use case error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   DELETE /diagrams/project/:projectId/use-cases/:id
 * @desc    ลบ Use Case ตาม ID และ project_id
 * @access  Private
 */
router.delete('/project/:projectId/use-cases/:id', authGuard, async (req, res) => {
    try {
        await initUseCaseTables();
        const { projectId, id } = req.params;
        await pool.query('DELETE FROM use_cases WHERE project_id = ? AND id = ?', [projectId, id]);
        return res.json({ success: true, message: 'ลบ Use Case เรียบร้อยแล้ว' });
    } catch (error) {
        console.error('Delete use case error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   GET /diagrams/:diagramId/use-cases (Legacy Support)
 */
router.get('/:diagramId/use-cases', authGuard, async (req, res) => {
    try {
        await initUseCaseTables();
        const { diagramId } = req.params;
        const [useCases] = await pool.query(
            'SELECT id, type, caption, description FROM use_cases WHERE project_id = ? OR id = ? ORDER BY id ASC',
            [diagramId, diagramId]
        );
        return res.json({ success: true, useCases });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   POST /diagrams/:diagramId/use-cases (Legacy Support)
 */
router.post('/:diagramId/use-cases', authGuard, async (req, res) => {
    try {
        await initUseCaseTables();
        const { diagramId } = req.params;
        const { id, type, caption, description } = req.body;

        await pool.query(
            `INSERT INTO use_cases (id, project_id, type, caption, description)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE type = VALUES(type), caption = VALUES(caption), description = VALUES(description)`,
            [id, diagramId, type || 'Use Case', caption, description || '']
        );

        return res.json({ success: true, message: 'บันทึก Use Case สำเร็จ' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   DELETE /diagrams/:diagramId/use-cases/:id (Legacy Support)
 */
router.delete('/:diagramId/use-cases/:id', authGuard, async (req, res) => {
    try {
        await initUseCaseTables();
        const { diagramId, id } = req.params;
        await pool.query('DELETE FROM use_cases WHERE (project_id = ? OR id = ?) AND id = ?', [diagramId, diagramId, id]);
        return res.json({ success: true, message: 'ลบ Use Case เรียบร้อยแล้ว' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
