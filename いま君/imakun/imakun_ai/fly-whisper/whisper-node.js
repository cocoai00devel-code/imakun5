import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { exec } from 'child_process';

const app = express();
const port = process.env.PORT || 3001;
const upload = multer({ dest: 'uploads/' });

app.post('/transcribe', upload.single('audio'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  const cmd = `python transcribe.py "${file.path}"`;
  exec(cmd, (err, stdout, stderr) => {
    fs.unlinkSync(file.path); // アップロード削除
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Transcription failed' });
    }
    res.json({ text: stdout.trim() });
  });
});

app.listen(port, () => {
  console.log(`Whisper server listening at http://localhost:${port}`);
});
