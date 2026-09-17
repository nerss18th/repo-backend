const express = require('express');
const router = express.Router();
const pool = require('../mysql');
const { authGuard } = require('../authguard');

/**
 * Class Diagram Tables Initializer
 */
async function initClassTables() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS classes (
                id VARCHAR(50) NOT NULL,
                project_id INT NOT NULL DEFAULT 1,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(50) DEFAULT 'Class',
                reference VARCHAR(255) DEFAULT 'None',
                description TEXT,
                extend_to_class VARCHAR(255) DEFAULT 'None',
                extend_to_class_id VARCHAR(50) DEFAULT NULL,
                PRIMARY KEY (id, project_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        try { await pool.query('ALTER TABLE classes ADD COLUMN project_id INT NOT NULL DEFAULT 1'); } catch (e) {}
        try { await pool.query('ALTER TABLE classes ADD COLUMN extend_to_class VARCHAR(255) DEFAULT "None"'); } catch (e) {}
        try { await pool.query('ALTER TABLE classes ADD COLUMN extend_to_class_id VARCHAR(50) DEFAULT NULL'); } catch (e) {}

        await pool.query(`
            CREATE TABLE IF NOT EXISTS class_implements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                class_id VARCHAR(50) NOT NULL,
                project_id INT NOT NULL DEFAULT 1,
                class_name VARCHAR(255) NOT NULL,
                impl_class_id VARCHAR(50) DEFAULT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        try { await pool.query('ALTER TABLE class_implements ADD COLUMN project_id INT NOT NULL DEFAULT 1'); } catch (e) {}
        try { await pool.query('ALTER TABLE class_implements ADD COLUMN class_name VARCHAR(255) NOT NULL DEFAULT ""'); } catch (e) {}
        try { await pool.query('ALTER TABLE class_implements ADD COLUMN impl_class_id VARCHAR(50) DEFAULT NULL'); } catch (e) {}
        try { await pool.query('ALTER TABLE class_implements DROP COLUMN interface_class_id'); } catch (e) {}
        try { await pool.query('ALTER TABLE class_implements DROP COLUMN interface_name'); } catch (e) {}

        await pool.query(`
            CREATE TABLE IF NOT EXISTS class_attributes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                class_id VARCHAR(50) NOT NULL,
                project_id INT NOT NULL DEFAULT 1,
                name VARCHAR(255) NOT NULL,
                encapsulation VARCHAR(50) DEFAULT 'private',
                data_type VARCHAR(100) DEFAULT 'String',
                data_size VARCHAR(50) DEFAULT '',
                description TEXT,
                example_format VARCHAR(255) DEFAULT ''
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        try { await pool.query('ALTER TABLE class_attributes ADD COLUMN project_id INT NOT NULL DEFAULT 1'); } catch (e) {}

        await pool.query(`
            CREATE TABLE IF NOT EXISTS class_methods (
                id INT AUTO_INCREMENT PRIMARY KEY,
                class_id VARCHAR(50) NOT NULL,
                project_id INT NOT NULL DEFAULT 1,
                type VARCHAR(100) DEFAULT 'Method',
                encapsulation VARCHAR(50) DEFAULT 'public',
                name VARCHAR(255) NOT NULL,
                description TEXT,
                return_value VARCHAR(255) DEFAULT '',
                return_data_type VARCHAR(100) DEFAULT 'void',
                return_description TEXT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        try { await pool.query('ALTER TABLE class_methods ADD COLUMN project_id INT NOT NULL DEFAULT 1'); } catch (e) {}

        await pool.query(`
            CREATE TABLE IF NOT EXISTS method_parameters (
                id INT AUTO_INCREMENT PRIMARY KEY,
                method_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                data_type VARCHAR(100) DEFAULT 'String',
                description TEXT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
    } catch (err) {
        console.error('Init class tables error:', err.message);
    }
}

/**
 * @route   GET /diagrams/project/:projectId/classes
 * @desc    ดึงรายการ Class Diagrams ของ Project
 * @access  Private
 */
router.get('/project/:projectId/classes', authGuard, async (req, res) => {
    try {
        await initClassTables();
        const { projectId } = req.params;

        let [classesList] = await pool.query(
            'SELECT id, name, type, reference, description, extend_to_class AS extendToClass, extend_to_class_id AS extendToClassId FROM classes WHERE project_id = ? ORDER BY id ASC',
            [projectId]
        );

        // ลบการสร้างข้อมูลจำลองอัตโนมัติเมื่อไม่มี Classes

        const result = [];
        for (const cls of classesList) {
            const [attributes] = await pool.query(
                'SELECT name, encapsulation, data_type AS dataType, data_size AS dataSize, description, example_format AS exampleFormat FROM class_attributes WHERE class_id = ? AND project_id = ?',
                [cls.id, projectId]
            );

            const [methods] = await pool.query(
                'SELECT id, type, encapsulation, name, description, return_value AS returnValue, return_data_type AS returnDataType, return_description AS returnDescription FROM class_methods WHERE class_id = ? AND project_id = ?',
                [cls.id, projectId]
            );

            for (const m of methods) {
                const [params] = await pool.query(
                    'SELECT name, data_type AS dataType, description FROM method_parameters WHERE method_id = ?',
                    [m.id]
                );
                m.parameters = params;
            }

            const [implementsInterfaces] = await pool.query(
                'SELECT class_name AS className, impl_class_id AS classId FROM class_implements WHERE class_id = ? AND project_id = ?',
                [cls.id, projectId]
            );

            result.push({
                ...cls,
                attributes,
                methods,
                implementsInterfaces
            });
        }

        return res.json({ success: true, classes: result });
    } catch (error) {
        console.error('Get project classes error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   POST /diagrams/project/:projectId/classes
 * @desc    เพิ่มหรืออัปเดต Class Diagram ใน Project
 * @access  Private
 */
router.post('/project/:projectId/classes', authGuard, async (req, res) => {
    try {
        await initClassTables();
        const { projectId } = req.params;
        const { id, name, type, reference, description, extendToClass, extendToClassId, implementsInterfaces, attributes, methods } = req.body;

        await pool.query(
            `INSERT INTO classes (id, project_id, name, type, reference, description, extend_to_class, extend_to_class_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE name = VALUES(name), type = VALUES(type), reference = VALUES(reference), description = VALUES(description), extend_to_class = VALUES(extend_to_class), extend_to_class_id = VALUES(extend_to_class_id)`,
            [id, projectId, name, type || 'Class', reference || 'None', description || '', extendToClass || 'None', extendToClassId || null]
        );

        // บันทึก Implements Interfaces
        await pool.query('DELETE FROM class_implements WHERE class_id = ? AND project_id = ?', [id, projectId]);
        if (Array.isArray(implementsInterfaces)) {
            for (const impl of implementsInterfaces) {
                await pool.query(
                    'INSERT INTO class_implements (class_id, project_id, class_name, impl_class_id) VALUES (?, ?, ?, ?)',
                    [id, projectId, impl.className || '', impl.classId || null]
                );
            }
        }

        // บันทึก Attributes
        await pool.query('DELETE FROM class_attributes WHERE class_id = ? AND project_id = ?', [id, projectId]);
        if (Array.isArray(attributes)) {
            for (const attr of attributes) {
                await pool.query(
                    'INSERT INTO class_attributes (class_id, project_id, name, encapsulation, data_type, data_size, description, example_format) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [id, projectId, attr.name, attr.encapsulation || 'private', attr.dataType || 'String', attr.dataSize || '', attr.description || '', attr.exampleFormat || '']
                );
            }
        }

        // บันทึก Methods & Parameters
        await pool.query('DELETE FROM class_methods WHERE class_id = ? AND project_id = ?', [id, projectId]);
        if (Array.isArray(methods)) {
            for (const m of methods) {
                const [resM] = await pool.query(
                    'INSERT INTO class_methods (class_id, project_id, type, encapsulation, name, description, return_value, return_data_type, return_description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [id, projectId, m.type || 'Method', m.encapsulation || 'public', m.name, m.description || '', m.returnValue || '', m.returnDataType || 'void', m.returnDescription || '']
                );

                if (Array.isArray(m.parameters)) {
                    for (const p of m.parameters) {
                        await pool.query(
                            'INSERT INTO method_parameters (method_id, name, data_type, description) VALUES (?, ?, ?, ?)',
                            [resM.insertId, p.name, p.dataType || 'String', p.description || '']
                        );
                    }
                }
            }
        }

        return res.json({ success: true, message: 'บันทึก Class สำเร็จ' });
    } catch (error) {
        console.error('Save class error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   DELETE /diagrams/project/:projectId/classes/:id
 * @desc    ลบ Class ตาม ID และ project_id
 * @access  Private
 */
router.delete('/project/:projectId/classes/:id', authGuard, async (req, res) => {
    try {
        await initClassTables();
        const { projectId, id } = req.params;
        await pool.query('DELETE FROM classes WHERE project_id = ? AND id = ?', [projectId, id]);
        return res.json({ success: true, message: 'ลบ Class เรียบร้อยแล้ว' });
    } catch (error) {
        console.error('Delete class error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
