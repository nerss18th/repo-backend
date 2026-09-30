const express = require('express');
const router = express.Router();
const pool = require('./mysql');
const fs = require('fs');
const path = require('path');

// อ่านไฟล์ ontology.jsonld ที่เป็น TBox
const ontologyPath = path.join(__dirname, 'ontology.jsonld');
let ontologySchema = {};
if (fs.existsSync(ontologyPath)) {
    ontologySchema = JSON.parse(fs.readFileSync(ontologyPath, 'utf8'));
}

async function buildGraphData(projectId) {
    try {
        // ค้นหาข้อมูล (ABox) จากฐานข้อมูล
        const [useCases] = await pool.query('SELECT * FROM use_cases WHERE project_id = ?', [projectId]);
        const [classes] = await pool.query('SELECT * FROM classes WHERE project_id = ?', [projectId]);
        const [attributes] = await pool.query('SELECT * FROM class_attributes WHERE project_id = ?', [projectId]);
        const [methods] = await pool.query('SELECT * FROM class_methods WHERE project_id = ?', [projectId]);
        
        // ดึง Activity Diagram
        const [activityDiagrams] = await pool.query('SELECT * FROM activity_diagrams WHERE project_id = ?', [projectId]);
        // ดึง Activity Actions (ต้อง join หรือดึงมาเฉพาะในโปรเจค)
        const [activityActions] = await pool.query(`
            SELECT a.* FROM activity_actions a
            JOIN activity_diagrams d ON a.activity_diagram_id = d.id
            WHERE d.project_id = ?
        `, [projectId]);

        const graph = [];

        // 1. นำเข้า Schema หลัก (TBox)
        if (ontologySchema["@graph"]) {
            graph.push(...ontologySchema["@graph"]);
        }

        // 2. นำเข้า Use Cases
        useCases.forEach(uc => {
            graph.push({
                "@id": `project${projectId}:${uc.id}`,
                "@type": "se:UseCase",
                "rdfs:label": uc.caption,
                "rdfs:comment": uc.description || ""
            });
        });

        // 3. นำเข้า Classes
        classes.forEach(c => {
            let classNode = {
                "@id": `project${projectId}:${c.id}`,
                "@type": "se:Class",
                "rdfs:label": c.name
            };
            if (c.reference && c.reference.trim() !== "") {
                // เปลี่ยนจากรองรับแค่ ID เดียว ให้สามารถ Split ด้วยจุลภาค และทำเป็น Array หลายๆ ค่าได้
                const refs = c.reference.split(',').map(r => r.trim()).filter(r => r !== "");
                if (refs.length > 1) {
                    classNode["se:realizes"] = refs.map(ref => ({ "@id": `project${projectId}:${ref}` }));
                } else if (refs.length === 1) {
                    classNode["se:realizes"] = { "@id": `project${projectId}:${refs[0]}` };
                }
            }
            
            // เพิ่ม attributes ที่เชื่อมโยงกับ class (hasAttribute)
            const classAttrs = attributes.filter(a => a.class_id === c.id);
            if (classAttrs.length > 0) {
                classNode["se:hasAttribute"] = classAttrs.map(a => ({ "@id": `project${projectId}:ATTR-${a.id}` }));
            }
            
            // เพิ่ม methods ที่เชื่อมโยงกับ class
            const classMethods = methods.filter(m => m.class_id === c.id);
            if (classMethods.length > 0) {
                // กำหนด attribute ให้กับ TBox ด้วยว่ามี hasMethod ถ้ายังไม่มี
                classNode["se:hasMethod"] = classMethods.map(m => ({ "@id": `project${projectId}:METH-${m.id}` }));
            }

            graph.push(classNode);
        });

        // 4. นำเข้า Attributes
        attributes.forEach(a => {
            graph.push({
                "@id": `project${projectId}:ATTR-${a.id}`,
                "@type": "se:Attribute",
                "rdfs:label": a.name,
                "rdfs:comment": `Type: ${a.data_type}, Encapsulation: ${a.encapsulation}`
            });
        });

        // 5. นำเข้า Methods
        methods.forEach(m => {
            graph.push({
                "@id": `project${projectId}:METH-${m.id}`,
                "@type": "se:Method",
                "rdfs:label": m.name,
                "rdfs:comment": `Returns: ${m.return_data_type}, Encapsulation: ${m.encapsulation}`
            });
        });

        // 6. นำเข้า Activity Diagrams
        activityDiagrams.forEach(act => {
            let actNode = {
                "@id": `project${projectId}:${act.activity_id}`,
                "@type": "se:ActivityDiagram",
                "rdfs:label": act.activity_name,
                "rdfs:comment": act.description || ""
            };
            
            if (act.use_case_ref && act.use_case_ref.trim() !== "") {
                // เปลี่ยนจากรองรับแค่ ID เดียว ให้สามารถ Split ด้วยจุลภาค และทำเป็น Array หลายๆ ค่าได้เหมือน Class
                const refs = act.use_case_ref.split(',').map(r => r.trim().split(' ')[0]).filter(r => r !== "");
                if (refs.length > 1) {
                    actNode["se:realizes"] = refs.map(ref => ({ "@id": `project${projectId}:${ref}` }));
                } else if (refs.length === 1) {
                    actNode["se:realizes"] = { "@id": `project${projectId}:${refs[0]}` };
                }
            }

            // หา Actions ที่อยู่ใน Diagram นี้
            const actionsInDiag = activityActions.filter(a => a.activity_diagram_id === act.id);
            if (actionsInDiag.length > 0) {
                actNode["se:hasAction"] = actionsInDiag.map(a => ({ "@id": `project${projectId}:ACT-NODE-${a.id}` }));
            }

            graph.push(actNode);
        });

        // 7. นำเข้า Activity Actions
        activityActions.forEach(a => {
            graph.push({
                "@id": `project${projectId}:ACT-NODE-${a.id}`,
                "@type": "se:ActivityAction",
                "rdfs:label": a.caption,
                "rdfs:comment": a.description || ""
            });
        });

        const jsonLdResponse = {
            "@context": ontologySchema["@context"] || {
                "se": "http://example.org/software-engineering#",
                "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
                "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
                "owl": "http://www.w3.org/2002/07/owl#"
            },
            "@graph": graph
        };

        return jsonLdResponse;
    } catch (error) {
        throw error;
    }
}

router.get('/export/:project_id', async (req, res) => {
    try {
        const data = await buildGraphData(req.params.project_id);
        res.json(data);
    } catch (error) {
        console.error("Export Ontology Error: ", error);
        res.status(500).json({ success: false, error: 'Failed to export ontology' });
    }
});

router.get('/validate/:project_id', async (req, res) => {
    try {
        const data = await buildGraphData(req.params.project_id);
        const graph = data['@graph'];
        const issues = [];
        
        // รวบรวม @id ทั้งหมดเพื่อทำ Data Integrity Check
        const allIds = new Set();
        graph.forEach(node => {
            if (node['@id']) allIds.add(node['@id']);
        });

        // แยกประเภทของ Node
        const useCases = graph.filter(n => n['@type'] === 'se:UseCase');
        const classes = graph.filter(n => n['@type'] === 'se:Class');
        
        // 1. ตรวจสอบ Orphan Use Cases (ถูกข้ามเนื่องจากผู้ใช้แจ้งว่าไม่จำเป็นต้องมี Realize By)
        // useCases.forEach(uc => {
        //     const realizedBy = graph.find(n => n['se:realizes'] && n['se:realizes']['@id'] === uc['@id']);
        //     if (!realizedBy) {
        //         issues.push({ 
        //             type: 'Orphan Use Case', 
        //             element: uc['@id'], 
        //             message: 'Use Case นี้ยังไม่มี Class หรือ Activity ใดมาอ้างอิง (realizes) เลย' 
        //         });
        //     }
        // });
        
        // 2. ตรวจสอบ Missing Realization สำหรับ Classes และ Activities
        const activities = graph.filter(n => n['@type'] === 'se:ActivityDiagram');
        
        classes.forEach(cls => {
            if (!cls['se:realizes']) {
                issues.push({ 
                    type: 'Missing', 
                    element: cls['@id'], 
                    message: 'Class นี้ไม่ได้ถูกระบุว่าตอบโจทย์ (realizes) Use Case ใดเลย' 
                });
            }
        });

        activities.forEach(act => {
            if (!act['se:realizes']) {
                issues.push({ 
                    type: 'Missing', 
                    element: act['@id'], 
                    message: 'Activity Diagram นี้ไม่ได้ถูกระบุว่าตอบโจทย์ (realizes) Use Case ใดเลย' 
                });
            }
        });
        // 3. ตรวจสอบ Data Integrity (Dangling References)
        graph.forEach(node => {
            const propertiesToCheck = ['se:hasAttribute', 'se:hasMethod', 'se:hasAction', 'se:realizes'];
            propertiesToCheck.forEach(prop => {
                if (node[prop]) {
                    const refs = Array.isArray(node[prop]) ? node[prop] : [node[prop]];
                    refs.forEach(ref => {
                        if (ref['@id'] && !allIds.has(ref['@id'])) {
                            issues.push({ 
                                type: 'Dangling Reference', 
                                element: node['@id'], 
                                message: `อ้างอิงไปยัง ${prop} ที่ไม่มีอยู่จริง: ${ref['@id']}` 
                            });
                        }
                    });
                }
            });
        });
        
        res.json({ success: true, total_issues: issues.length, issues });
    } catch(err) {
        console.error("Validate Ontology Error: ", err);
        res.status(500).json({ success: false, error: err.toString() });
    }
});

module.exports = router;
