const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');
const pool = require('./mysql');
const { authGuard } = require('./authguard');

// Helper function to read file asynchronously (if needed, but fs.readFileSync is fine for docxtemplater)
const getTemplatePath = (diagramType, fileName) => {
    return path.join(__dirname, 'templates', diagramType, fileName);
};

const getExportPath = (diagramType, fileName) => {
    return path.join(__dirname, 'exports', diagramType, fileName);
};

const replaceEmpty = (obj) => {
    if (obj === null || obj === undefined || obj === '') {
        return '-';
    }
    if (Array.isArray(obj)) {
        return obj.map(item => replaceEmpty(item));
    }
    if (typeof obj === 'object' && obj !== null) {
        const newObj = {};
        for (let key in obj) {
            if (['diagramImage', 'class_diagram_image', 'activity_diagram_image', 'pageBreak'].includes(key)) {
                newObj[key] = obj[key];
            } else {
                newObj[key] = replaceEmpty(obj[key]);
            }
        }
        return newObj;
    }
    return obj;
};

/**
 * @route   GET /export/project/:projectId/use-case
 * @desc    Export Use Case Diagram data to a Word Document
 * @access  Private
 */
router.get('/project/:projectId/use-case', authGuard, async (req, res) => {
    try {
        const { projectId } = req.params;
        const username = req.user && req.user.username ? req.user.username : (req.user ? req.user.id : 'unknown');

        // 1. ดึงข้อมูลโปรเจกต์
        const [projects] = await pool.query('SELECT name, detail FROM projects WHERE id = ?', [projectId]);
        if (projects.length === 0) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        const project = projects[0];

        // 2. ดึงข้อมูล Use Cases
        const [useCases] = await pool.query(
            'SELECT id, type, caption, description FROM use_cases WHERE project_id = ? ORDER BY id ASC',
            [projectId]
        );

        // 2.5. ดึงรูปภาพ Diagram
        const [diagrams] = await pool.query(
            'SELECT image_path FROM diagrams WHERE project_id = ? AND type = "use-case"',
            [projectId]
        );
        let absoluteImagePath = null;
        if (diagrams.length > 0 && diagrams[0].image_path) {
            absoluteImagePath = path.join(__dirname, diagrams[0].image_path);
            if (!fs.existsSync(absoluteImagePath)) {
                absoluteImagePath = null;
            }
        }

        // 3. โหลดเทมเพลต
        const templatePath = getTemplatePath('use-case', 'Use-Case-Summary-Table.docx');
        if (!fs.existsSync(templatePath)) {
            return res.status(404).json({ success: false, message: 'Template file not found' });
        }

        const content = fs.readFileSync(templatePath, 'binary');
        const zip = new PizZip(content);

        const imageOptions = {
            centered: false,
            fileType: "docx",
            getImage: function(tagValue, tagName) {
                if (!tagValue || !fs.existsSync(tagValue)) {
                    return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
                }
                return fs.readFileSync(tagValue);
            },
            getSize: function(img, tagValue, tagName) {
                try {
                    const sizeOf = require('image-size');
                    const dimensions = sizeOf(img);
                    const maxWidth = 600; // ความกว้างสูงสุดในหน้า A4
                    
                    if (dimensions.width > maxWidth) {
                        const ratio = maxWidth / dimensions.width;
                        return [maxWidth * 0.8, Math.round(dimensions.height * ratio) * 0.8];
                    }
                    return [dimensions.width * 0.8, dimensions.height * 0.8];
                } catch (e) {
                    return [600 * 0.8, 400 * 0.8]; // ขนาดสำรองถ้าอ่านภาพไม่ได้
                }
            }
        };
        const imageModule = new ImageModule(imageOptions);

        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            delimiters: { start: '[[', end: ']]' },
            modules: [imageModule]
        });

        // 4. เรนเดอร์ข้อมูล
        const renderData = replaceEmpty({
            projectName: projects[0].name,
            projectDetail: projects[0].detail,
            useCases: useCases,
            diagramImage: absoluteImagePath || 'placeholder'
        });
        doc.render(renderData);

        // 5. สร้างไฟล์ผลลัพธ์
        const buf = doc.getZip().generate({
            type: 'nodebuffer',
            compression: 'DEFLATE',
        });

        const randomNumber = Math.floor(Math.random() * 100000);
        const exportFileName = `useCase_${username}_${projectId}_${randomNumber}.docx`;
        const exportFilePath = getExportPath('use-case', exportFileName);

        // บันทึกไฟล์ลงในโฟลเดอร์ exports
        fs.writeFileSync(exportFilePath, buf);

        // 6. ส่งไฟล์ให้ไคลเอนต์ (ผู้ใช้)
        res.download(exportFilePath, exportFileName, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                if (!res.headersSent) {
                    res.status(500).json({ success: false, message: 'Error downloading file' });
                }
            }
        });

    } catch (error) {
        console.error('Export Use Case error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   GET /export/project/:projectId/class-diagram
 * @desc    Export Class Diagram data to a Word Document
 * @access  Private
 */
router.get('/project/:projectId/class-diagram', authGuard, async (req, res) => {
    try {
        const { projectId } = req.params;
        const username = req.user && req.user.username ? req.user.username : (req.user ? req.user.id : 'unknown');

        // 1. Fetch Project Data
        const [projects] = await pool.query('SELECT name, detail FROM projects WHERE id = ?', [projectId]);
        if (projects.length === 0) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        const project = projects[0];

        // 2. ดึงข้อมูล Classes
        let [classesList] = await pool.query(
            'SELECT id, name, type, reference, description, extend_to_class AS extend_class_name, extend_to_class_id AS extend_class_id FROM classes WHERE project_id = ? ORDER BY id ASC',
            [projectId]
        );

        const classes = [];
        for (let i = 0; i < classesList.length; i++) {
            const cls = classesList[i];
            // แอตทริบิวต์ (Attributes)
            const [attributes] = await pool.query(
                'SELECT name AS attribute_name, encapsulation AS attribute_encapsulation, data_type AS attribute_data_type, data_size AS attribute_data_size, description AS attribute_description, example_format AS attribute_example FROM class_attributes WHERE class_id = ? AND project_id = ?',
                [cls.id, projectId]
            );

            // เมธอด (Methods)
            const [methodsList] = await pool.query(
                'SELECT id, type AS method_type, encapsulation AS method_encapsulation, name AS method_name, description AS method_description, return_value AS return_value, return_data_type AS return_data_type, return_description AS return_description FROM class_methods WHERE class_id = ? AND project_id = ?',
                [cls.id, projectId]
            );

            const methods = [];
            for (const m of methodsList) {
                const [parameters] = await pool.query(
                    'SELECT name AS parameter_name, data_type AS parameter_data_type, description AS parameter_description FROM method_parameters WHERE method_id = ?',
                    [m.id]
                );
                methods.push({
                    ...m,
                    parameters
                });
            }

            // อินเทอร์เฟซ (Interfaces)
            const [implement_interfaces] = await pool.query(
                'SELECT class_name AS interface_name, impl_class_id AS interface_id FROM class_implements WHERE class_id = ? AND project_id = ?',
                [cls.id, projectId]
            );

            const isLast = (i === classesList.length - 1);

            classes.push({
                class_id: cls.id,
                class_name: cls.name,
                class_type: cls.type,
                reference: cls.reference,
                description: cls.description,
                extend_class_name: cls.extend_class_name,
                extend_class_id: cls.extend_class_id,
                attributes,
                methods,
                implement_interfaces,
                pageBreak: isLast ? "" : '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'
            });
        }

        // 2.5. Fetch Diagram Image
        const [diagrams] = await pool.query(
            'SELECT image_path FROM diagrams WHERE project_id = ? AND type = "class"',
            [projectId]
        );
        let absoluteImagePath = null;
        if (diagrams.length > 0 && diagrams[0].image_path) {
            absoluteImagePath = path.join(__dirname, diagrams[0].image_path);
            if (!fs.existsSync(absoluteImagePath)) {
                absoluteImagePath = null;
            }
        }

        // 3. Load Template
        const templatePath = getTemplatePath('class', 'Class-Description-Form.docx');
        if (!fs.existsSync(templatePath)) {
            return res.status(404).json({ success: false, message: 'Template file not found' });
        }

        const content = fs.readFileSync(templatePath, 'binary');
        const zip = new PizZip(content);

        const imageOptions = {
            centered: false,
            fileType: "docx",
            getImage: function(tagValue, tagName) {
                if (!tagValue || !fs.existsSync(tagValue)) {
                    return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
                }
                return fs.readFileSync(tagValue);
            },
            getSize: function(img, tagValue, tagName) {
                try {
                    const sizeOf = require('image-size');
                    const dimensions = sizeOf(img);
                    const maxWidth = 600; 
                    
                    if (dimensions.width > maxWidth) {
                        const ratio = maxWidth / dimensions.width;
                        return [maxWidth * 0.8, Math.round(dimensions.height * ratio) * 0.8];
                    }
                    return [dimensions.width * 0.8, dimensions.height * 0.8];
                } catch (e) {
                    return [600 * 0.8, 400 * 0.8];
                }
            }
        };
        const imageModule = new ImageModule(imageOptions);

        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            delimiters: { start: '[[', end: ']]' },
            modules: [imageModule]
        });

        // 4. Render Data
        const renderData = replaceEmpty({
            projectName: project.name,
            projectDetail: project.detail,
            classes: classes,
            class_diagram_image: absoluteImagePath || 'placeholder'
        });
        doc.render(renderData);

        // 5. Generate Output
        const buf = doc.getZip().generate({
            type: 'nodebuffer',
            compression: 'DEFLATE',
        });

        const randomNumber = Math.floor(Math.random() * 100000);
        const exportFileName = `classDiagram_${username}_${projectId}_${randomNumber}.docx`;
        const exportFilePath = getExportPath('class', exportFileName);

        // ตรวจสอบและสร้างโฟลเดอร์ exports/class หากยังไม่มี
        const exportDir = path.dirname(exportFilePath);
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        // Save file to exports folder
        fs.writeFileSync(exportFilePath, buf);

        // 6. Send file to client
        res.download(exportFilePath, exportFileName, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                if (!res.headersSent) {
                    res.status(500).json({ success: false, message: 'Error downloading file' });
                }
            }
        });

    } catch (error) {
        console.error('Export Class Diagram error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   GET /export/project/:projectId/activity-diagram
 * @desc    Export Activity Diagram data to a Word Document
 * @access  Private
 */
router.get('/project/:projectId/activity-diagram', authGuard, async (req, res) => {
    try {
        const { projectId } = req.params;
        const username = req.user && req.user.username ? req.user.username : (req.user ? req.user.id : 'unknown');

        // 1. Fetch Project Data
        const [projects] = await pool.query('SELECT name, detail FROM projects WHERE id = ?', [projectId]);
        if (projects.length === 0) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        const project = projects[0];

        // 2. ดึงข้อมูล Activity Diagrams
        let [diagramsList] = await pool.query(
            'SELECT * FROM activity_diagrams WHERE project_id = ? ORDER BY id ASC',
            [projectId]
        );

        const activities = [];
        for (let i = 0; i < diagramsList.length; i++) {
            const ad = diagramsList[i];

            const [swimlanes] = await pool.query(
                'SELECT lane_no AS laneNo, type, caption, reference_id AS referenceId FROM activity_swimlanes WHERE activity_diagram_id = ?',
                [ad.id]
            );

            const [startPoints] = await pool.query(
                'SELECT from_lane_no AS fromLaneNo, to_action AS toAction FROM activity_start_points WHERE activity_diagram_id = ?',
                [ad.id]
            );

            const [endPoints] = await pool.query(
                'SELECT lane_no AS laneNo, from_type AS fromType, from_no AS fromNo, end_state AS endState FROM activity_end_points WHERE activity_diagram_id = ?',
                [ad.id]
            );

            const [actions] = await pool.query(
                'SELECT action_no AS actionNo, lane_no AS laneNo, caption, description FROM activity_actions WHERE activity_diagram_id = ?',
                [ad.id]
            );

            const [decisionNodes] = await pool.query(
                'SELECT id, decision_no AS decisionNo, lane_no AS laneNo, from_action_no AS fromActionNo, caption FROM activity_decision_nodes WHERE activity_diagram_id = ?',
                [ad.id]
            );

            const decisionNodesData = [];
            for (const dn of decisionNodes) {
                const [criteria] = await pool.query(
                    'SELECT criteria_no AS criteriaNo, detail, reference_id AS referenceId FROM activity_decision_criteria WHERE decision_node_id = ?',
                    [dn.id]
                );
                decisionNodesData.push({
                    ...dn,
                    criteria
                });
            }

            const startPoint = startPoints[0] || { fromLaneNo: '', toAction: '' };
            const isLast = (i === diagramsList.length - 1);

            // ดึงรูปภาพ Diagram สำหรับ activity นี้
            // (Assuming only one image per activity diagram type for the project, or per activity. 
            // In the DB, diagrams table stores images per type and project. If multiple activities, it might use the same image, or maybe they have their own image in activity_diagrams.image_path)
            // The template uses %activity_diagram_image, which Docxtemplater Image Module handles.
            // ใช้ ad.image_path ถ้ามี, หากไม่มีให้ใช้จากตาราง diagrams
            
            let absoluteImagePath = null;
            if (ad.image_path) {
                absoluteImagePath = path.join(__dirname, '..', ad.image_path);
            } else {
                const [globalDiagrams] = await pool.query(
                    'SELECT image_path FROM diagrams WHERE project_id = ? AND type = "activity"',
                    [projectId]
                );
                if (globalDiagrams.length > 0 && globalDiagrams[0].image_path) {
                    absoluteImagePath = path.join(__dirname, globalDiagrams[0].image_path);
                }
            }
            if (absoluteImagePath && !fs.existsSync(absoluteImagePath)) {
                absoluteImagePath = null;
            }

            activities.push({
                activityId: ad.activity_id,
                activityName: ad.activity_name,
                useCaseRef: ad.use_case_ref,
                preliminaryActivityId: ad.preliminary_activity_id,
                description: ad.description,
                hasSwimlane: ad.has_swimlane,
                startPoint_fromLaneNo: startPoint.fromLaneNo,
                startPoint_toAction: startPoint.toAction,
                swimlanes,
                endPoints,
                actions,
                decisionNodes: decisionNodesData,
                activity_diagram_image: absoluteImagePath || 'placeholder',
                pageBreak: isLast ? "" : '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'
            });
        }

        // 3. Load Template
        const templatePath = getTemplatePath('activity', 'Activity-Description-Form.docx');
        if (!fs.existsSync(templatePath)) {
            return res.status(404).json({ success: false, message: 'Template file not found' });
        }

        const content = fs.readFileSync(templatePath, 'binary');
        const zip = new PizZip(content);

        const imageOptions = {
            centered: false,
            fileType: "docx",
            getImage: function(tagValue, tagName) {
                if (!tagValue || !fs.existsSync(tagValue)) {
                    return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
                }
                return fs.readFileSync(tagValue);
            },
            getSize: function(img, tagValue, tagName) {
                try {
                    const sizeOf = require('image-size');
                    const dimensions = sizeOf(img);
                    const maxWidth = 600; 
                    
                    if (dimensions.width > maxWidth) {
                        const ratio = maxWidth / dimensions.width;
                        return [maxWidth * 0.8, Math.round(dimensions.height * ratio) * 0.8];
                    }
                    return [dimensions.width * 0.8, dimensions.height * 0.8];
                } catch (e) {
                    return [600 * 0.8, 400 * 0.8];
                }
            }
        };
        const imageModule = new ImageModule(imageOptions);

        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            delimiters: { start: '[[', end: ']]' },
            modules: [imageModule]
        });

        // 4. Render Data
        const renderData = replaceEmpty({
            projectName: project.name,
            projectDetail: project.detail,
            activities: activities
        });
        doc.render(renderData);

        // 5. Generate Output
        const buf = doc.getZip().generate({
            type: 'nodebuffer',
            compression: 'DEFLATE',
        });

        const randomNumber = Math.floor(Math.random() * 100000);
        const exportFileName = `activityDiagram_${username}_${projectId}_${randomNumber}.docx`;
        const exportFilePath = getExportPath('activity', exportFileName);

        // ตรวจสอบและสร้างโฟลเดอร์ exports/activity หากยังไม่มี
        const exportDir = path.dirname(exportFilePath);
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        // Save file to exports folder
        fs.writeFileSync(exportFilePath, buf);

        // 6. Send file to client
        res.download(exportFilePath, exportFileName, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                if (!res.headersSent) {
                    res.status(500).json({ success: false, message: 'Error downloading file' });
                }
            }
        });

    } catch (error) {
        console.error('Export Activity Diagram error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
