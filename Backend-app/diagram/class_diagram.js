const express = require('express');
const router = express.Router();
const pool = require('../config/mysql');
const { authGuard, projectEditorGuard } = require('../config/authguard');



/**
 * @route   GET /diagrams/project/:projectId/classes
 * @desc    ดึงรายการ Class Diagrams ของ Project
 * @access  Private
 */
router.get('/project/:projectId/classes', authGuard, async (req, res) => {
    try {
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
router.post('/project/:projectId/classes', [authGuard, projectEditorGuard], async (req, res) => {
    try {
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
router.delete('/project/:projectId/classes/:id', [authGuard, projectEditorGuard], async (req, res) => {
    try {
        const { projectId, id } = req.params;
        await pool.query('DELETE FROM classes WHERE project_id = ? AND id = ?', [projectId, id]);
        return res.json({ success: true, message: 'ลบ Class เรียบร้อยแล้ว' });
    } catch (error) {
        console.error('Delete class error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
