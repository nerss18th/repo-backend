const express = require('express');
const router = express.Router();
const pool = require('../mysql');
const { authGuard } = require('../authguard');
const { uploadDiagramPic } = require('../multerConfig');

/**
 * @route   GET /diagrams/project/:projectId/type/:type
 * @desc    ดึงข้อมูล Diagram ตาม project_id และประเภท ('use-case', 'class')
 * @access  Private
 */
router.get('/project/:projectId/type/:type', authGuard, async (req, res) => {
    try {
        const { projectId, type } = req.params;

        const [diagrams] = await pool.query(
            'SELECT id, project_id, type, title, file_name, image_path, pic FROM diagrams WHERE project_id = ? AND type = ?',
            [projectId, type]
        );

        if (diagrams.length === 0) {
            // ถ้ายังไม่มี ให้สร้าง record ตั้งต้นให้
            const defaultTitle = type === 'class' ? 'Class Diagram' : 'Use Case Diagram';
            const [result] = await pool.query(
                'INSERT INTO diagrams (project_id, type, title, file_name, image_path, pic) VALUES (?, ?, ?, ?, ?, ?)',
                [projectId, type, defaultTitle, type === 'class' ? 'ex-class-diagram.png' : 'ex-diagram.png', null, null]
            );

            return res.json({
                success: true,
                diagram: {
                    id: result.insertId,
                    project_id: Number(projectId),
                    type,
                    title: defaultTitle,
                    file_name: type === 'class' ? 'ex-class-diagram.png' : 'ex-diagram.png',
                    image_path: null,
                    pic: null
                }
            });
        }

        return res.json({ success: true, diagram: diagrams[0] });
    } catch (error) {
        console.error('Get diagram error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   POST /diagrams/upload
 * @desc    บันทึก/อัปเดตรูปภาพแผนภาพ Diagram
 * @access  Private
 */
router.post('/upload', authGuard, async (req, res) => {
    try {
        const { projectId, type, fileName, imagePath } = req.body;

        const [existing] = await pool.query(
            'SELECT id FROM diagrams WHERE project_id = ? AND type = ?',
            [projectId, type]
        );

        let diagramId;
        if (existing.length > 0) {
            diagramId = existing[0].id;
            const oldPath = existing[0].image_path;
            
            // ลบไฟล์รูปเดิมถ้ามีและถูกแทนที่ด้วยรูปใหม่
            if (oldPath && oldPath !== imagePath) {
                const fs = require('fs');
                const path = require('path');
                const absoluteOldPath = path.join(__dirname, '..', oldPath);
                if (fs.existsSync(absoluteOldPath)) {
                    fs.unlinkSync(absoluteOldPath);
                }
            }

            await pool.query(
                'UPDATE diagrams SET file_name = ?, image_path = ?, pic = ? WHERE id = ?',
                [fileName, imagePath, imagePath, diagramId]
            );
        } else {
            const title = type === 'class' ? 'Class Diagram' : 'Use Case Diagram';
            const [result] = await pool.query(
                'INSERT INTO diagrams (project_id, type, title, file_name, image_path, pic) VALUES (?, ?, ?, ?, ?, ?)',
                [projectId, type, title, fileName, imagePath, imagePath]
            );
            diagramId = result.insertId;
        }

        return res.json({
            success: true,
            message: 'บันทึกรูปภาพแผนภาพสำเร็จ',
            diagram: { id: diagramId, projectId, type, fileName, imagePath, pic: imagePath }
        });
    } catch (error) {
        console.error('Upload diagram error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   POST /diagrams/upload-image
 * @desc    อัปโหลดไฟล์รูปภาพของแผนภาพ Diagram
 * @access  Private
 */
router.post('/upload-image', authGuard, uploadDiagramPic.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'ไม่มีไฟล์รูปภาพที่อัปโหลด' });
        }
        
        // พาธของรูปภาพที่จะถูกเข้าถึงจาก frontend
        const type = req.body.type || 'other';
        const imagePath = `/diagram_pic/${type}/${req.file.filename}`;
        
        return res.json({
            success: true,
            message: 'อัปโหลดไฟล์รูปภาพสำเร็จ',
            imagePath: imagePath
        });
    } catch (error) {
        console.error('Upload diagram image error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
