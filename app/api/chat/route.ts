import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

type DatasetConfig = {
  key: string;
  label: string;
  bodyRegion: string;
  task: string;
  aliases: string[];
};

const DATASETS: DatasetConfig[] = [
  {
    key: "rsna",
    label: "RSNA Pneumonia",
    bodyRegion: "lungs",
    task: "detection",
    aliases: ["rsna", "pneumonia", "chest", "lung"],
  },
  {
    key: "brain",
    label: "Brain Tumor MRI",
    bodyRegion: "brain",
    task: "classification",
    aliases: ["brain", "tumor", "glioma", "meningioma", "pituitary", "mri"],
  },
];

function fallbackAction(message: string) {
  const lower = message.toLowerCase();
  const match = DATASETS.find((d) => d.aliases.some((a) => lower.includes(a)));

  if (!match) {
    return {
      dataset: null,
      task: null,
      bodyRegion: null,
      visualizations: { bbox: false, heatmap: false, threeD: false },
      reply: "Tell me which dataset — RSNA or Brain Tumor MRI.",
    };
  }

  return {
    dataset: match.key,
    task: match.task,
    bodyRegion: match.bodyRegion,
    visualizations: { bbox: true, heatmap: true, threeD: true },
    reply: `Showing ${match.label}.`,
  };
}

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(fallbackAction(message));
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are routing a medical dataset dashboard. Choose ONE dataset from: rsna (chest X-ray, pneumonia, lungs), brain (brain tumor MRI, brain). Respond with ONLY minified JSON, no markdown: {"dataset": "rsna" or "brain" or null, "task": "detection" or "classification" or null, "bodyRegion": "lungs" or "brain" or null, "visualizations": {"bbox": true, "heatmap": true, "threeD": true}, "reply": "one short friendly sentence"}. User message: "${message}"`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = (result.text ?? "").trim().replace(/^```json\s*|```\s*$/g, "");
    const parsed = JSON.parse(text);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("GEMINI ERROR:", err);
    return NextResponse.json(fallbackAction(message));
  }
}