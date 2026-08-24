import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

type DatasetConfig = {
  key: string;
  label: string;
  bodyRegion: string | null;
  task: string;
  aliases: string[];
};

const DATASETS: DatasetConfig[] = [
  {
    key: "rsna",
    label: "RSNA Pneumonia",
    bodyRegion: "lungs",
    task: "detection",
    aliases: ["rsna", "pneumonia", "chest", "lung", "lungs"],
  },
  {
    key: "brain",
    label: "Brain Tumor MRI",
    bodyRegion: "brain",
    task: "classification",
    aliases: ["brain", "tumor", "glioma", "meningioma", "pituitary", "mri"],
  },
  {
    key: "ham10000",
    label: "HAM10000 Skin Lesions",
    bodyRegion: null,
    task: "classification",
    aliases: [
      "skin",
      "skin lesion",
      "skin lesions",
      "ham10000",
      "melanoma",
      "lesion",
      "dermatology",
    ],
  },
];

function fallbackAction(message: string) {
  const lower = message.toLowerCase();

  const match = DATASETS.find((d) =>
    d.aliases.some((a) => lower.includes(a))
  );

  if (!match) {
    return {
      dataset: null,
      task: null,
      bodyRegion: null,
      visualizations: {
        bbox: false,
        heatmap: false,
        threeD: false,
      },
      reply: "Tell me which dataset — RSNA, Brain Tumor MRI, or HAM10000.",
    };
  }

  return {
    dataset: match.key,
    task: match.task,
    bodyRegion: match.bodyRegion,
    visualizations: {
      bbox: match.key !== "ham10000",
      heatmap: lower.includes("heatmap"),
      threeD: match.key !== "ham10000",
    },
    reply: `Showing ${match.label}.`,
  };
}

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  if (!message || typeof message !== "string") {
    return NextResponse.json(
      { error: "message is required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(fallbackAction(message));
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const lower = message.toLowerCase();
    const wantsHeatmap = lower.includes("heatmap");

    const prompt = `Choose one dataset based on the user message.

Datasets:
- rsna = chest X-ray, pneumonia, lungs
- brain = brain tumor MRI
- ham10000 = skin lesion images

Return ONLY JSON:
{"dataset":"rsna" or "brain" or "ham10000" or null,"task":"detection" or "classification" or null,"bodyRegion":"lungs" or "brain" or null,"visualizations":{"bbox":true or false,"heatmap":true or false,"threeD":true or false},"reply":"short sentence"}

Rules:
- HAM10000: bbox=false, threeD=false
- Heatmap=true only if the user explicitly asks for "heatmap"
- Otherwise heatmap=false

User message: "${message}"`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = (result.text ?? "")
      .trim()
      .replace(/^```json\s*|```\s*$/g, "");

    const parsed = JSON.parse(text);

    parsed.visualizations.heatmap = wantsHeatmap;

    if (parsed.dataset === "ham10000") {
      parsed.visualizations.bbox = false;
      parsed.visualizations.threeD = false;
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("GEMINI ERROR:", err);
    return NextResponse.json(fallbackAction(message));
  }
}