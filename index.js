const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const huggingFaceToken = process.env.HUGGING_FACE_TOKEN;
const huggingFaceModel = 'your-model-name';

app.post('/api/chat', async (req, res) => {
  try {
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${huggingFaceModel}`,
      req.body,
      {
        headers: {
          Authorization: `Bearer ${huggingFaceToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to call Hugging Face API' });
  }
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
