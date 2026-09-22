import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Body parser with high limit for image payloads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy Gemini client initialization
let genAIClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "DocuPrep",
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// AI Document & Photo Compliance Analysis using gemini-3.1-pro-preview with ThinkingLevel.HIGH
app.post("/api/analyze-compliance", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", requirementType, userQuestion } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "GEMINI_API_KEY is not configured on the server. Basic offline heuristics will be used.",
        fallback: true,
      });
    }

    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64 in request body." });
    }

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");

    const promptText = `
You are a senior document, visa, and passport photo compliance officer and forensic image analyst.
The user is submitting an image for: "${requirementType || "General Document / Passport Photo"}".
Specific user question or notes: "${userQuestion || "Check if this photo/document meets official compliance standards."}".

Analyze the image thoroughly. Evaluate:
1. Overall Compliance Score (0 to 100).
2. Background check (Color uniformity, plain white/off-white vs patterned, shadows).
3. Face & Head Positioning (Centered, head occupies 50%-70% of vertical height, eye line at 56%-69% from bottom, straight posture, no head tilt).
4. Lighting & Quality (Even lighting, no harsh shadows, no flash reflection, sharp focus, no blur, no pixelation).
5. Expression & Accessories (Neutral expression, mouth closed, eyes open & clearly visible, no colored glasses, no glare, head coverings only for religious reasons and not obscuring face).
6. Recommended Fixes: actionable step-by-step adjustments in DocuPrep (e.g. crop tighter, remove background, increase brightness, resize to exact mm/pixels).

Return your response in clean JSON format adhering to this structure:
{
  "complianceScore": 85,
  "verdict": "Likely Compliant" | "Requires Minor Adjustments" | "Non-Compliant / Retake Recommended",
  "summary": "Brief 1-2 sentence executive assessment.",
  "checks": [
    {
      "category": "Background",
      "status": "PASS" | "WARN" | "FAIL",
      "details": "Clear explanation of findings."
    },
    {
      "category": "Face & Head Positioning",
      "status": "PASS" | "WARN" | "FAIL",
      "details": "Clear explanation of findings."
    },
    {
      "category": "Lighting & Shadows",
      "status": "PASS" | "WARN" | "FAIL",
      "details": "Clear explanation of findings."
    },
    {
      "category": "Sharpness & Resolution",
      "status": "PASS" | "WARN" | "FAIL",
      "details": "Clear explanation of findings."
    },
    {
      "category": "Expression & Features",
      "status": "PASS" | "WARN" | "FAIL",
      "details": "Clear explanation of findings."
    }
  ],
  "actionableTips": [
    "Tip 1...",
    "Tip 2..."
  ]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType || "image/jpeg",
            },
          },
          { text: promptText },
        ],
      },
      config: {
        systemInstruction: "You are an expert government document compliance evaluator. Inspect photos and documents with rigorous standards. Respond with valid JSON only.",
        responseMimeType: "application/json",
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    const responseText = response.text || "{}";
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // Clean possible markdown code fences
      const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    }

    return res.json({ success: true, result: parsed });
  } catch (error: any) {
    console.error("Compliance analysis error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to analyze document compliance.",
      fallback: true,
    });
  }
});

// Vite middleware in dev or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DocuPrep server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
