const express = require('express');
const multer = require('multer');
const axios = require('axios');
const googleTTS = require('google-tts-api');
const fs = require('fs');
const path = require('path');
const cors = require('cors');





const app = express();
const upload = multer({ dest: 'uploads/' });

// AssemblyAI API Key
const assemblyApiKey = 'f077e8b6be294893bb9426c2dbc6b896';
app.use(cors()); // Enable CORS for all requests

app.post('/audio', upload.single('audio'), async (req, res) => {
  try {
    // Check if the file was uploaded
    if (!req.file) {
      return res.status(400).send({ error: 'No audio file uploaded' });
    }

    const filePath = path.join(__dirname, req.file.path); // Path to uploaded file

    

    // Step 1: Upload audio file to AssemblyAI
    const uploadResponse = await axios.post(
      'https://api.assemblyai.com/v2/upload',
      fs.createReadStream(filePath),
      {
        headers: {
          authorization: assemblyApiKey,
          'content-type': 'application/octet-stream',
        },
      }
    );

    // Step 2: Request transcription
    const transcriptResponse = await axios.post(
      'https://api.assemblyai.com/v2/transcript',
      {
        audio_url: uploadResponse.data.upload_url,
      },
      {
        headers: { authorization: assemblyApiKey },
      }
    );

    // Poll the transcription status
    const transcriptId = transcriptResponse.data.id;
    let transcriptResult = null;
    while (!transcriptResult || transcriptResult.status !== 'completed') {
      const transcriptStatus = await axios.get(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        {
          headers: { authorization: assemblyApiKey },
        }
      );
      transcriptResult = transcriptStatus.data;

      if (transcriptResult.status === 'failed') {
        return res.status(400).send({ error: 'Transcription failed' });
      }
    }

    const transcription = transcriptResult.text;

    // Step 3: Text-to-Speech response using Google TTS
    const ttsResponse = googleTTS.getAudioUrl(transcription, {
      lang: 'en',
      slow: false,
      host: 'https://translate.google.com',
    });

    res.json({ text: transcription, response: ttsResponse });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing audio');
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));
