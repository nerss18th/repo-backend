const fs = require('fs');
const path = require('path');

let code = fs.readFileSync(path.join(__dirname, 'exports', 'export_doc.js'), 'utf8');

// Replace express router to add child_process
code = code.replace(
    "const { authGuard } = require('../config/authguard');",
    "const { authGuard } = require('../config/authguard');\nconst { exec } = require('child_process');\nconst util = require('util');\nconst execPromise = util.promisify(exec);"
);

const oldResDownload = `        res.download(exportFilePath, exportFileName, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                if (!res.headersSent) {
                    res.status(500).json({ success: false, message: 'Error downloading file' });
                }
            }
        });`;

const newResDownload = `        const pdfDir = path.dirname(exportFilePath);
        const pdfFileName = exportFileName.replace('.docx', '.pdf');
        const pdfFilePath = path.join(pdfDir, pdfFileName);
        
        try {
            const psCommand = \`$word = New-Object -ComObject Word.Application; $word.Visible = $false; $doc = $word.Documents.Open('\${exportFilePath}'); $doc.SaveAs([ref] '\${pdfFilePath}', [ref] 17); $doc.Close(); $word.Quit();\`;
            await execPromise(\`powershell.exe -Command "\${psCommand}"\`);
            res.download(pdfFilePath, pdfFileName, (err) => {
                if (err) console.error('Error downloading PDF:', err);
                if (fs.existsSync(exportFilePath)) fs.unlinkSync(exportFilePath);
                if (fs.existsSync(pdfFilePath)) fs.unlinkSync(pdfFilePath);
            });
        } catch (execErr) {
            console.error('Error converting to PDF:', execErr);
            if (!res.headersSent) res.status(500).json({ success: false, message: 'Error converting to PDF' });
        }`;

code = code.split(oldResDownload).join(newResDownload);

fs.writeFileSync(path.join(__dirname, 'exports', 'export_pdf.js'), code);
console.log('Done!');
