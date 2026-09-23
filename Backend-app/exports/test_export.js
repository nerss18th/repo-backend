const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');

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

async function run() {
    const templatePath = path.join(__dirname, '..', 'templates', 'activity', 'Activity-Description-Form.docx');
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    const imageOptions = {
        centered: false,
        fileType: "docx",
        getImage: function(tagValue, tagName) {
            console.log("getImage called with tagValue:", tagValue, "tagName:", tagName);
            if (!tagValue || !fs.existsSync(tagValue)) {
                console.log("Returning placeholder");
                return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
            }
            console.log("Returning real file");
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

    const mockImagePath = path.join(__dirname, '..', 'diagram_pic', 'activity', 'diagram_activity_pro_91547.png');
    console.log("Mock Image Path:", mockImagePath, "Exists?", fs.existsSync(mockImagePath));

    const renderData = replaceEmpty({
        projectName: 'Test Project',
        projectDetail: 'Test Detail',
        activities: [
            {
                activityId: 'ACT-01',
                activityName: 'Test Activity',
                useCaseRef: 'UC-01',
                preliminaryActivityId: '-',
                description: 'Test Desc',
                hasSwimlane: 'No',
                startPoint_fromLaneNo: '-',
                startPoint_toAction: '-',
                swimlanes: [],
                endPoints: [],
                actions: [],
                decisionNodes: [],
                activity_diagram_image: mockImagePath,
                pageBreak: ""
            }
        ]
    });

    try {
        doc.render(renderData);
        console.log("Render successful!");
        const buf = doc.getZip().generate({ type: 'nodebuffer' });
        fs.writeFileSync(path.join(__dirname, '..', 'test_output.docx'), buf);
        console.log("Saved test_output.docx");
    } catch (error) {
        console.error("Render error:", error);
    }
}
run();
