const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// POST /api/detect-image
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }
  const imagePath = path.resolve(req.file.path);
  const pythonProcess = spawn('python', [path.resolve('trial.py'), imagePath]);

  let result = '';
  pythonProcess.stdout.on('data', (data) => {
    result += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error('Python stderr:', data.toString());
  });

  pythonProcess.on('close', (code) => {
    // Clean up uploaded file
    fs.unlink(imagePath, () => {});
    console.log('AI detection result:', result.trim(), 'Exit code:', code);
    if (code !== 0) {
      return res.status(500).json({ error: 'AI detection failed', details: result.trim() });
    }
    // Return result (trim whitespace)
    if (result.trim() === 'AI' || result.trim() === 'Natural') {
      res.json({ result: result.trim() });
    } else {
      res.status(500).json({ error: 'Unexpected AI detection output', details: result.trim() });
    }
  });
});

module.exports = router; 