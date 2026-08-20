import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const DATASETS = [
  { key: "rsna", label: "RSNA Pneumonia", aliases: ["rsna", "pneumonia", "chest", "lung"] },
  { key: "brain", label: "Brain Tumor MRI", aliases: ["brain", "tumor", "glioma", "meningioma", "pituitary", "mri"] },
];

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const lower = message.toLowerCase();
    const match = DATASETS.find((d) => d.aliases.some((a) => lower.includes(a)));
    return NextResponse.json({
      dataset: match?.key ?? null,
      reply: match ? `Showing ${match.label}.` : "Tell me which dataset — RSNA or Brain Tumor MRI.",
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are routing a medical dataset dashboard. Choose ONE dataset key from: rsna (chest X-ray pneumonia), brain (brain tumor MRI). Respond with ONLY minified JSON, no markdown: {"dataset": "rsna" or "brain" or null, "reply": "one short friendly sentence"}. User message: "${message}"`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = (result.text ?? "").trim().replace(/^```json\s*|```\s*$/g, "");
    const parsed = JSON.parse(text);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("GEMINI ERROR:", err);
    return NextResponse.json({ dataset: null, reply: "Something went wrong reaching Gemini." });
  }
}