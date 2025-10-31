import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('❌ Missing GEMINI_API_KEY environment variable for Try-on feature.');
}
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const MODEL_ID = process.env.GEMINI_MODEL_ID || 'gemini-2.0-flash-exp-image-generation';

router.post(
  '/',
  upload.fields([
    { name: 'userImage', maxCount: 1 },
    { name: 'clothingImage', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const userImageFile = req.files?.userImage?.[0];
      const clothingImageFile = req.files?.clothingImage?.[0];

      if (!userImageFile || !clothingImageFile) {
        return res
          .status(400)
          .json({ error: 'Both userImage and clothingImage files are required' });
      }

      const detailedPrompt = `
# ROLE: You are a world-class AI digital artist specializing in photorealistic virtual try-on and image compositing. Your work is indistinguishable from reality.

# CORE MISSION:
Your primary objective is to execute a FLAWLESS virtual try-on. You will take a person from a source image, dress them in a garment from a second image, and place them into a brand new, photorealistic background. The two most critical rules are: the person's face MUST remain 100% unchanged, and the garment's appearance MUST remain 100% unchanged.

---

### INPUTS

1.  **PERSON_IMAGE (Input 1 - The first image provided):**
    * **Contains:** The target person.
    * **Purpose:** Use this for their **EXACT facial identity, skin tone, expression, hair, body shape, and pose**.
    * **Crucial:** The background of this image will be COMPLETELY DISCARDED.

2.  **GARMENT_IMAGE (Input 2 - The second image provided):**
    * **Contains:** The target clothing item.
    * **Purpose:** Use this **STRICTLY** for the garment's visual properties: **EXACT color, pattern, texture, style, and material feel**.
    * **Crucial:** Isolate the garment only. Discard any model, mannequin, or background from this image.

3.  **BACKGROUND_PREFERENCE (Optional Text):**
    * A text description for the new background (e.g., "minimalist grey studio", "sunny Parisian street", "moody indoor library").
    * If not provided, generate a neutral, professional, and photorealistic studio background that complements the subject.

---

### NON-NEGOTIABLE RULES & CONSTRAINTS

1.  **PIXEL-PERFECT IDENTITY LOCK (PRIORITY: ABSOLUTE MAXIMUM):**
    * The person's face, features, skin tone, and expression from PERSON_IMAGE must be preserved with **100% pixel-for-pixel accuracy**.
    * **ZERO** alterations to the face are permitted.

2.  **PIXEL-PERFECT GARMENT FIDELITY (PRIORITY: ABSOLUTE MAXIMUM):**
    * The garment from GARMENT_IMAGE must be replicated with **100% pixel-for-pixel accuracy** in terms of color, pattern, texture, and design.
    * **ZERO** deviation from the source garment's appearance is allowed.

3.  **COMPLETE BACKGROUND REPLACEMENT (PRIORITY: CRITICAL):**
    * Generate a **COMPLETELY NEW and DIFFERENT** background.
    * **NO elements, colors, or textures** from the original background of PERSON_IMAGE should appear in the final output.
    * The person must be seamlessly composited into this new scene.

4.  **POSE & BODY PRESERVATION (PRIORITY: HIGH):**
    * Retain the **exact** body pose, shape, and proportions of the person from PERSON_IMAGE.
    * Scale the garment to fit these proportions realistically.

5.  **LIGHTING & SHADOW REALISM (PRIORITY: HIGH):**
    * The **NEW BACKGROUND dictates the lighting environment**.

---

### PROCESSING WORKFLOW
1. Analyze & Isolate
2. Generate Scene
3. Composite & Drape
4. Re-Lighting

### FINAL QUALITY CONTROL CHECKLIST
- Face Check
- Garment Check
- Background Check
- Artifact Check
- Lighting Check
`;

      const userImageBase64 = Buffer.from(userImageFile.buffer).toString('base64');
      const clothingImageBase64 = Buffer.from(clothingImageFile.buffer).toString('base64');
      const userImageMimeType = userImageFile.mimetype || 'image/jpeg';
      const clothingImageMimeType = clothingImageFile.mimetype || 'image/png';

      let response;
      try {
        const contents = [
          {
            role: 'user',
            parts: [
              { text: detailedPrompt },
              { inlineData: { mimeType: userImageMimeType, data: userImageBase64 } },
              { inlineData: { mimeType: clothingImageMimeType, data: clothingImageBase64 } },
            ],
          },
        ];

        response = await ai.models.generateContent({
          model: MODEL_ID,
          contents,
          config: {
            temperature: 0.6,
            topP: 0.95,
            topK: 40,
            responseModalities: ['Text', 'Image'],
          },
        });
      } catch (err) {
        console.error('Gemini API error:', err);
        return res.status(500).json({ error: 'AI generation failed' });
      }

      let textResponse = null;
      let imageData = null;
      let imageMimeType = 'image/png';

      if (response?.candidates?.length) {
        const parts = response.candidates[0]?.content?.parts;
        if (parts) {
          for (const part of parts) {
            if (part?.inlineData) {
              imageData = part.inlineData.data;
              imageMimeType = part.inlineData.mimeType || 'image/png';
            } else if (part?.text) {
              textResponse = part.text;
            }
          }
        }
      } else {
        const reason = response?.promptFeedback?.blockReason || 'unknown';
        return res.status(500).json({ error: `Empty AI response (${reason})` });
      }

      return res.json({
        image: imageData ? `data:${imageMimeType};base64,${imageData}` : null,
        description: textResponse || 'AI description not available.',
      });
    } catch (error) {
      console.error('Error processing try-on:', error);
      return res.status(500).json({ error: 'Failed to process virtual try-on' });
    }
  }
);

export default router;
