require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./mysql');
const userRoutes = require('./user');
const projectRoutes = require('./project');
const useCaseRoutes = require('./diagram/use_case');
const classDiagramRoutes = require('./diagram/class_diagram');
const activityDiagramRoutes = require('./diagram/activity_diagram');
const diagramRoutes = require('./diagram/diagram');
const exportRoutes = require('./export_doc');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ให้บริการไฟล์ static (รูปภาพ)
app.use('/user_pic', express.static(path.join(__dirname, 'user_pic')));
app.use('/diagram_pic', express.static(path.join(__dirname, 'diagram_pic')));

// เส้นทาง API
app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/diagrams', useCaseRoutes);
app.use('/diagrams', classDiagramRoutes);
app.use('/diagrams', activityDiagramRoutes);
app.use('/diagrams', diagramRoutes);
app.use('/export', exportRoutes);

// หน้าแรกเริ่มต้น
app.get('/', (req, res) => {
    res.send('Ontology Backend API is running');
});

// Endpoint ทดสอบการเชื่อมต่อ Database
app.get('/test-db', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT NOW() AS currentTime');
        res.json({ success: true, serverTime: rows[0].currentTime });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend is running on http://localhost:${PORT}`);
});