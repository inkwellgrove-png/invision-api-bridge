import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const aiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey: aiKey });

app.get('/', (req, res) => {
  res.send('Invision Pro Cloud API Bridge is Online!');
});

app.post('/api/animate', async (req, res) => {
  const { image, prompt } = req.body;

  if (!image) {
      return res.status(400).json({ error: "Missing base64 image data." });
  }
  
  if (!aiKey) {
      return res.status(500).json({ error: "Cloud backend missing GEMINI_API_KEY." });
  }

  try {
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image-preview',
          contents: [
              { text: `Animate this scene beautifully. Action details: ${prompt || "Add cinematic subtle movement."}` },
              { inlineData: { mimeType: "image/jpeg", data: image } }
          ],
          generationConfig: {
              responseModalities: ["VIDEO"]
          }
      });

      const videoPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData && p.inlineData.mimeType.includes('video'));

      if (!videoPart || !videoPart.inlineData?.data) {
          throw new Error("Gemini model did not return a valid video.");
      }

      const videoDataUri = `data:video/mp4;base64,${videoPart.inlineData.data}`;
      res.json({ videoUrl: videoDataUri });

  } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
