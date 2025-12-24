import express from 'express';
import multer from 'multer';
import fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// ファイルアップロード設定
const upload = multer({ dest: 'uploads/' });

app.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const form = new FormData();
    form.append('file', fs.createReadStream(file.path));
    form.append('model', 'whisper-1');
    form.append('language', 'ja');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form
    });

    const data = await response.json();
    fs.unlinkSync(file.path); // アップロードファイル削除
    res.json({ text: data.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

app.listen(port, () => {
  console.log(`Whisper server listening at http://localhost:${port}`);
});
