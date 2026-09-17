const express = require('express');
const router = express.Router();
const pool = require('../mysql');
const { authGuard } = require('../authguard');

/**
 * Activity Diagram Helper: Init Tables if not exists
 */
async function initActivityTables() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS activity_diagrams (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id INT NOT NULL,
                activity_id VARCHAR(50) NOT NULL,
                activity_name VARCHAR(255) NOT NULL,
                use_case_ref VARCHAR(255) DEFAULT '',
                preliminary_activity_id VARCHAR(50) DEFAULT '',
                description TEXT,
                image_path LONGTEXT DEFAULT NULL,
                file_name VARCHAR(255) DEFAULT NULL,
                has_swimlane VARCHAR(10) DEFAULT 'No',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS activity_swimlanes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                activity_diagram_id INT NOT NULL,
                lane_no VARCHAR(50) NOT NULL,
                type VARCHAR(100) DEFAULT '',
                caption VARCHAR(255) DEFAULT '',
                reference_id VARCHAR(255) DEFAULT '',
                FOREIGN KEY (activity_diagram_id) REFERENCES activity_diagrams(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS activity_start_points (
                id INT AUTO_INCREMENT PRIMARY KEY,
                activity_diagram_id INT NOT NULL,
                from_lane_no VARCHAR(50) DEFAULT '',
                to_action VARCHAR(100) DEFAULT '',
                FOREIGN KEY (activity_diagram_id) REFERENCES activity_diagrams(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS activity_end_points (
                id INT AUTO_INCREMENT PRIMARY KEY,
                activity_diagram_id INT NOT NULL,
                lane_no VARCHAR(50) DEFAULT '',
                from_type VARCHAR(50) DEFAULT '',
                from_no VARCHAR(50) DEFAULT '',
                end_state VARCHAR(20) DEFAULT 'Success',
                FOREIGN KEY (activity_diagram_id) REFERENCES activity_diagrams(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS activity_actions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                activity_diagram_id INT NOT NULL,
                action_no VARCHAR(50) NOT NULL,
                lane_no VARCHAR(50) DEFAULT '',
                caption VARCHAR(255) DEFAULT '',
                description TEXT,
                FOREIGN KEY (activity_diagram_id) REFERENCES activity_diagrams(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS activity_decision_nodes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                activity_diagram_id INT NOT NULL,
                decision_no VARCHAR(50) NOT NULL,
                lane_no VARCHAR(50) DEFAULT '',
                from_action_no VARCHAR(50) DEFAULT '',
                caption VARCHAR(255) DEFAULT '',
                FOREIGN KEY (activity_diagram_id) REFERENCES activity_diagrams(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS activity_decision_criteria (
                id INT AUTO_INCREMENT PRIMARY KEY,
                decision_node_id INT NOT NULL,
                criteria_no VARCHAR(50) NOT NULL,
                detail TEXT,
                reference_id VARCHAR(50) DEFAULT '',
                FOREIGN KEY (decision_node_id) REFERENCES activity_decision_nodes(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
    } catch (err) {
        console.error('Init activity tables error:', err.message);
    }
}

/**
 * @route   GET /diagrams/project/:projectId/activity-diagrams
 * @desc    ดึงข้อมูล Activity Diagrams ทั้งหมดของ Project
 * @access  Private
 */
router.get('/project/:projectId/activity-diagrams', authGuard, async (req, res) => {
    try {
        await initActivityTables();
        const { projectId } = req.params;

        let [diagrams] = await pool.query(
            'SELECT * FROM activity_diagrams WHERE project_id = ? ORDER BY id ASC',
            [projectId]
        );

        // ลบการสร้างข้อมูลจำลองอัตโนมัติเมื่อไม่มี Diagrams

        const result = [];
        for (const ad of diagrams) {
            const [swimlanes] = await pool.query(
                'SELECT id, lane_no AS laneNo, type, caption, reference_id AS referenceId FROM activity_swimlanes WHERE activity_diagram_id = ?',
                [ad.id]
            );

            const [startPoints] = await pool.query(
                'SELECT id, from_lane_no AS fromLaneNo, to_action AS toAction FROM activity_start_points WHERE activity_diagram_id = ?',
                [ad.id]
            );

            const [endPoints] = await pool.query(
                'SELECT id, lane_no AS laneNo, from_type AS fromType, from_no AS fromNo, end_state AS endState FROM activity_end_points WHERE activity_diagram_id = ?',
                [ad.id]
            );

            const [actions] = await pool.query(
                'SELECT id, action_no AS actionNo, lane_no AS laneNo, caption, description FROM activity_actions WHERE activity_diagram_id = ?',
                [ad.id]
            );

            const [decisionNodes] = await pool.query(
                'SELECT id, decision_no AS decisionNo, lane_no AS laneNo, from_action_no AS fromActionNo, caption FROM activity_decision_nodes WHERE activity_diagram_id = ?',
                [ad.id]
            );

            for (const dn of decisionNodes) {
                const [criteria] = await pool.query(
                    'SELECT id, criteria_no AS criteriaNo, detail, reference_id AS referenceId FROM activity_decision_criteria WHERE decision_node_id = ?',
                    [dn.id]
                );
                dn.criteria = criteria;
            }

            result.push({
                id: ad.id,
                projectId: ad.project_id,
                activityId: ad.activity_id,
                activityName: ad.activity_name,
                useCaseRef: ad.use_case_ref,
                preliminaryActivityId: ad.preliminary_activity_id,
                description: ad.description,
                imagePath: ad.image_path,
                fileName: ad.file_name,
                hasSwimlane: ad.has_swimlane,
                swimlanes,
                startPoint: startPoints[0] || { fromLaneNo: '', toAction: '' },
                endPoints,
                actions,
                decisionNodes
            });
        }

        return res.json({ success: true, activityDiagrams: result });
    } catch (error) {
        console.error('Get activity diagrams error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   POST /diagrams/project/:projectId/activity-diagrams
 * @desc    บันทึก/อัปเดต Activity Diagram
 * @access  Private
 */
router.post('/project/:projectId/activity-diagrams', authGuard, async (req, res) => {
    try {
        await initActivityTables();
        const { projectId } = req.params;
        const {
            id,
            activityId,
            activityName,
            useCaseRef,
            preliminaryActivityId,
            description,
            imagePath,
            fileName,
            hasSwimlane,
            swimlanes,
            startPoint,
            endPoints,
            actions,
            decisionNodes
        } = req.body;

        let diagramPkId = null;
        if (id) {
            const [existRows] = await pool.query('SELECT id FROM activity_diagrams WHERE id = ? AND project_id = ?', [id, projectId]);
            if (existRows.length > 0) {
                diagramPkId = id;
            }
        }

        if (diagramPkId) {
            await pool.query(
                `UPDATE activity_diagrams 
                 SET activity_id = ?, activity_name = ?, use_case_ref = ?, preliminary_activity_id = ?, description = ?, image_path = ?, file_name = ?, has_swimlane = ?
                 WHERE id = ? AND project_id = ?`,
                [
                    activityId || 'ACT-01',
                    activityName || 'Activity Diagram',
                    useCaseRef || '',
                    preliminaryActivityId || '',
                    description || '',
                    imagePath || null,
                    fileName || null,
                    hasSwimlane || 'No',
                    diagramPkId,
                    projectId
                ]
            );
        } else {
            const [insRes] = await pool.query(
                `INSERT INTO activity_diagrams (project_id, activity_id, activity_name, use_case_ref, preliminary_activity_id, description, image_path, file_name, has_swimlane)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    projectId,
                    activityId || 'ACT-01',
                    activityName || 'Activity Diagram',
                    useCaseRef || '',
                    preliminaryActivityId || '',
                    description || '',
                    imagePath || null,
                    fileName || null,
                    hasSwimlane || 'No'
                ]
            );
            diagramPkId = insRes.insertId;
        }

        // ลบข้อมูลเดิมและเพิ่มข้อมูล swimlanes
        await pool.query('DELETE FROM activity_swimlanes WHERE activity_diagram_id = ?', [diagramPkId]);
        if (Array.isArray(swimlanes)) {
            for (const s of swimlanes) {
                await pool.query(
                    'INSERT INTO activity_swimlanes (activity_diagram_id, lane_no, type, caption, reference_id) VALUES (?, ?, ?, ?, ?)',
                    [diagramPkId, s.laneNo || '', s.type || '', s.caption || '', s.referenceId || '']
                );
            }
        }

        // ลบข้อมูลเดิมและเพิ่มข้อมูล start point
        await pool.query('DELETE FROM activity_start_points WHERE activity_diagram_id = ?', [diagramPkId]);
        if (startPoint) {
            await pool.query(
                'INSERT INTO activity_start_points (activity_diagram_id, from_lane_no, to_action) VALUES (?, ?, ?)',
                [diagramPkId, startPoint.fromLaneNo || '', startPoint.toAction || '']
            );
        }

        // ลบข้อมูลเดิมและเพิ่มข้อมูล end points
        await pool.query('DELETE FROM activity_end_points WHERE activity_diagram_id = ?', [diagramPkId]);
        if (Array.isArray(endPoints)) {
            for (const ep of endPoints) {
                await pool.query(
                    'INSERT INTO activity_end_points (activity_diagram_id, lane_no, from_type, from_no, end_state) VALUES (?, ?, ?, ?, ?)',
                    [diagramPkId, ep.laneNo || '', ep.fromType || '', ep.fromNo || '', ep.endState || 'Success']
                );
            }
        }

        // ลบข้อมูลเดิมและเพิ่มข้อมูล actions
        await pool.query('DELETE FROM activity_actions WHERE activity_diagram_id = ?', [diagramPkId]);
        if (Array.isArray(actions)) {
            for (const act of actions) {
                await pool.query(
                    'INSERT INTO activity_actions (activity_diagram_id, action_no, lane_no, caption, description) VALUES (?, ?, ?, ?, ?)',
                    [diagramPkId, act.actionNo || '', act.laneNo || '', act.caption || '', act.description || '']
                );
            }
        }

        // ลบข้อมูลเดิมและเพิ่มข้อมูล decision nodes และ criteria
        await pool.query('DELETE FROM activity_decision_nodes WHERE activity_diagram_id = ?', [diagramPkId]);
        if (Array.isArray(decisionNodes)) {
            for (const dn of decisionNodes) {
                const [insDn] = await pool.query(
                    'INSERT INTO activity_decision_nodes (activity_diagram_id, decision_no, lane_no, from_action_no, caption) VALUES (?, ?, ?, ?, ?)',
                    [diagramPkId, dn.decisionNo || '', dn.laneNo || '', dn.fromActionNo || '', dn.caption || '']
                );
                const dnId = insDn.insertId;
                if (Array.isArray(dn.criteria)) {
                    for (const cr of dn.criteria) {
                        await pool.query(
                            'INSERT INTO activity_decision_criteria (decision_node_id, criteria_no, detail, reference_id) VALUES (?, ?, ?, ?)',
                            [dnId, cr.criteriaNo || '', cr.detail || '', cr.referenceId || '']
                        );
                    }
                }
            }
        }

        return res.json({ success: true, message: 'บันทึก Activity Diagram สำเร็จ', id: diagramPkId });
    } catch (error) {
        console.error('Save activity diagram error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   DELETE /diagrams/project/:projectId/activity-diagrams/:id
 * @desc    ลบ Activity Diagram ตาม ID
 * @access  Private
 */
router.delete('/project/:projectId/activity-diagrams/:id', authGuard, async (req, res) => {
    try {
        await initActivityTables();
        const { projectId, id } = req.params;

        await pool.query('DELETE FROM activity_diagrams WHERE id = ? AND project_id = ?', [id, projectId]);
        return res.json({ success: true, message: 'ลบ Activity Diagram เรียบร้อยแล้ว' });
    } catch (error) {
        console.error('Delete activity diagram error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
