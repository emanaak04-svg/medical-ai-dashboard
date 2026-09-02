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
      "nevus",
      "mole",
      "basal cell carcinoma",
      "bcc",
      "benign keratosis",
      "actinic keratosis",
      "vascular lesion",
      "dermatofibroma",
      "dermatology",
    ],
  },
];

function getSkinFilter(message: string) {
  const lower = message.toLowerCase();
  const filters = [];

  if (lower.includes("melanoma")) {
    filters.push({ field: "dx", value: "mel" });
  } else if (
    lower.includes("nevus") ||
    lower.includes("mole")
  ) {
    filters.push({ field: "dx", value: "nv" });
  } else if (
    lower.includes("basal cell carcinoma") ||
    lower.includes("bcc")
  ) {
    filters.push({ field: "dx", value: "bcc" });
  } else if (
    lower.includes("benign keratosis") ||
    lower.includes("seborrheic keratosis")
  ) {
    filters.push({ field: "dx", value: "bkl" });
  } else if (lower.includes("actinic keratosis")) {
    filters.push({ field: "dx", value: "akiec" });
  } else if (lower.includes("vascular lesion")) {
    filters.push({ field: "dx", value: "vasc" });
  } else if (lower.includes("dermatofibroma")) {
    filters.push({ field: "dx", value: "df" });
  }

  if (lower.includes("face")) {
    filters.push({ field: "localization", value: "face" });
  } else if (lower.includes("back")) {
    filters.push({ field: "localization", value: "back" });
  } else if (lower.includes("chest")) {
    filters.push({ field: "localization", value: "chest" });
  } else if (lower.includes("abdomen")) {
    filters.push({ field: "localization", value: "abdomen" });
  } else if (lower.includes("trunk")) {
    filters.push({ field: "localization", value: "trunk" });
  } else if (lower.includes("upper extremity")) {
    filters.push({ field: "localization", value: "upper extremity" });
  } else if (lower.includes("lower extremity")) {
    filters.push({ field: "localization", value: "lower extremity" });
  }

  if (lower.includes("male")) {
    filters.push({ field: "sex", value: "male" });
  } else if (lower.includes("female")) {
    filters.push({ field: "sex", value: "female" });
  }

    return filters.length > 0 ? filters : null;

}

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
      filter: null,
      visualizations: {
        bbox: false,
        heatmap: false,
        threeD: false,
      },
      reply:
        "Tell me which dataset — RSNA, Brain Tumor MRI, or HAM10000.",
    };
  }

  const filter =
    match.key === "ham10000"
      ? getSkinFilter(message)
      : null;

  return {
    dataset: match.key,
    task: match.task,
    bodyRegion: match.bodyRegion,
    filter,
    visualizations: {
  bbox: match.key !== "ham10000",
  heatmap:
    /\b(heatmap|heat map|attention map|attention)\b/i.test(message),
  threeD: match.key !== "ham10000",
},
    reply: filter
      ? `Showing ${match.label} filtered results.`
      : `Showing ${match.label}.`,
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

    const prompt = `You route a medical dataset dashboard.

Datasets:
- rsna = chest X-ray, pneumonia, lungs
- brain = brain tumor MRI
- ham10000 = skin lesion images

HAM10000 filters:
- melanoma = mel
- nevus or mole = nv
- basal cell carcinoma or BCC = bcc
- benign keratosis = bkl
- actinic keratosis = akiec
- vascular lesion = vasc
- dermatofibroma = df

If the user asks for one of these skin conditions, return the matching filter.

Respond ONLY with JSON:
{"dataset":"rsna" or "brain" or "ham10000" or null,"task":"detection" or "classification" or null,"bodyRegion":"lungs" or "brain" or null,"filter":[{"field":"dx","value":"mel|nv|bcc|bkl|akiec|vasc|df"},{"field":"localization","value":"face|back|chest|abdomen|trunk|upper extremity|lower extremity"},{"field":"sex","value":"male|female"}] or null,"visualizations":{"bbox":true or false,"heatmap":true or false,"threeD":true or false},"reply":"short sentence"}

For HAM10000:
bbox=false
threeD=false

If the user asks for multiple skin filters, return all of them.

User: "${message}"`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = (result.text ?? "")
      .trim()
      .replace(/^```json\s*|```\s*$/g, "");

    return NextResponse.json(JSON.parse(text));
  } catch (err) {
    console.error("GEMINI ERROR:", err);
    return NextResponse.json(fallbackAction(message));
  }
}