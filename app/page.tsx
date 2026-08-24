"use client";

import { useState } from "react";
import rsnaData from "@/data/rsna/samples.json";
import brainData from "@/data/brain/samples.json";
import BodyModel from "@/components/BodyModel";

type BoundingBox = { x: number; y: number; width: number; height: number };
type Sample = {
  dataset: string;
  task: string;
  image_id: string;
  image_file: string;
  modality: string;
  body_part: string;
  disease: string;
  detailed_class: string;
  bounding_boxes: BoundingBox[];
  image_size: [number, number];
  annotation_type: string;
};

type ChatMsg = { role: "user" | "assistant"; text: string };

type DatasetConfig = {
  label: string;
  samples: Sample[];
  imagePath: string;
  bodyRegion: "brain" | "lungs";
  task: string;
};

type Action = {
  dataset: string;
  task: string | null;
  bodyRegion: "brain" | "lungs" | null;
  visualizations: { bbox: boolean; heatmap: boolean; threeD: boolean };
  reply: string;
};

const DATASETS: Record<string, DatasetConfig> = {
  rsna: { label: "RSNA Pneumonia", samples: rsnaData as Sample[], imagePath: "/samples/rsna", bodyRegion: "lungs", task: "detection" },
  brain: { label: "Brain Tumor MRI", samples: brainData as Sample[], imagePath: "/samples/brain", bodyRegion: "brain", task: "classification" },
};

const defaultAction: Action = {
  dataset: "rsna",
  task: DATASETS.rsna.task,
  bodyRegion: DATASETS.rsna.bodyRegion,
  visualizations: { bbox: true, heatmap: false, threeD: true },
  reply: "Showing RSNA Pneumonia.",
};

export default function Home() {
  const [action, setAction] = useState<Action>(defaultAction);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", text: "Ask me to show a dataset — e.g. \"show me brain tumor cases\"." },
  ]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);

  const dataset = DATASETS[action.dataset];
  const sample = dataset.samples[selectedIndex];

  const displayWidth = 400;
  const scale = displayWidth / sample.image_size[0];

  const selectDatasetManually = (key: string) => {
    const d = DATASETS[key];
    setAction({
      dataset: key,
      task: d.task,
      bodyRegion: d.bodyRegion,
      visualizations: { bbox: true, heatmap: false, threeD: true },
      reply: `Showing ${d.label}.`,
    });
    setSelectedIndex(0);
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setDraft("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      if (data.dataset && DATASETS[data.dataset]) {
        setAction(data as Action);
        setSelectedIndex(0);
      }

      setMessages((prev) => [...prev, { role: "assistant", text: data.reply ?? "Done." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Something went wrong." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* MAIN AREA */}
      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        <h1 className="text-lg font-semibold">Medical AI Dashboard</h1>

        {/* Image viewer */}
        <section className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <h2 className="text-xs uppercase tracking-wide text-gray-400 mb-2">
            Image Viewer — {sample.detailed_class}
          </h2>

          <div className="relative inline-block" style={{ width: displayWidth }}>
            <img
              src={`${dataset.imagePath}/${sample.image_file}`}
              alt={sample.image_id}
              width={displayWidth}
              className="rounded"
            />
            {action.visualizations.bbox &&
              sample.bounding_boxes.map((box, i) => (
                <div
                  key={i}
                  className="absolute border-2 border-red-500"
                  style={{
                    left: box.x * scale,
                    top: box.y * scale,
                    width: box.width * scale,
                    height: box.height * scale,
                  }}
                />
              ))}
          </div>

          <div className="flex gap-2 mt-3 overflow-x-auto">
            {dataset.samples.map((s, i) => (
              <button
                key={s.image_id}
                onClick={() => setSelectedIndex(i)}
                className={`shrink-0 rounded border-2 ${
                  i === selectedIndex ? "border-teal-400" : "border-transparent opacity-60"
                }`}
              >
                <img src={`${dataset.imagePath}/${s.image_file}`} alt={s.image_id} className="h-14 w-14 object-cover rounded" />
              </button>
            ))}
          </div>
        </section>

        {/* JSON panel — the actual structured action from Gemini, not the raw sample */}
        <section className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <h2 className="text-xs uppercase tracking-wide text-gray-400 mb-2">
            Generated Action (from Gemini)
          </h2>
          <pre className="text-xs text-teal-400 bg-black/40 rounded p-3 overflow-auto max-h-48">
            {JSON.stringify(action, null, 2)}
          </pre>
        </section>

        {/* Selected image's own dataset record, separate from the LLM action */}
        <section className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <h2 className="text-xs uppercase tracking-wide text-gray-400 mb-2">
            Selected Image Record
          </h2>
          <pre className="text-xs text-gray-400 bg-black/40 rounded p-3 overflow-auto max-h-48">
            {JSON.stringify(sample, null, 2)}
          </pre>
        </section>
      </main>

      {/* RIGHT SIDEBAR */}
      <aside className="w-80 shrink-0 border-l border-gray-800 bg-gray-900 p-4 flex flex-col">
        <h2 className="text-xs uppercase tracking-wide text-gray-400 mb-3">
          Dataset + Chat
        </h2>

        <select
          value={action.dataset}
          onChange={(e) => selectDatasetManually(e.target.value)}
          className="mb-4 rounded bg-gray-800 border border-gray-700 p-2 text-sm"
        >
          {Object.entries(DATASETS).map(([key, d]) => (
            <option key={key} value={key}>{d.label}</option>
          ))}
        </select>

        <div className="mb-4">
          <BodyModel activeRegion={action.visualizations.threeD ? action.bodyRegion : null} />
        </div>

        {/* Chat — now wired to /api/chat */}
        <div className="flex-1 rounded border border-gray-800 bg-gray-950 p-3 text-sm overflow-y-auto space-y-2">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
              <span className={`inline-block rounded px-2 py-1 ${m.role === "user" ? "bg-teal-900 text-teal-100" : "bg-gray-800 text-gray-300"}`}>
                {m.text}
              </span>
            </div>
          ))}
          {loading && <div className="text-gray-500 text-xs">thinking...</div>}
        </div>

        <div className="flex gap-2 mt-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask about a dataset..."
            className="flex-1 rounded bg-gray-800 border border-gray-700 p-2 text-sm"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="rounded bg-teal-600 px-3 py-2 text-sm disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </aside>
    </div>
  );
}