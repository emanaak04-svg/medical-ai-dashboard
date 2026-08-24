import fs from "fs";

function addHeatmap(records, imgSizeKey) {
  return records.map((r) => {
    const boxes = r.bounding_boxes || [];
    if (boxes.length === 0) {
      return { ...r, heatmap: null };
    }

    const [imgW, imgH] = r[imgSizeKey];

    const minX = Math.min(...boxes.map((b) => b.x));
    const minY = Math.min(...boxes.map((b) => b.y));
    const maxX = Math.max(...boxes.map((b) => b.x + b.width));
    const maxY = Math.max(...boxes.map((b) => b.y + b.height));

    const cx = (minX + maxX) / 2 / imgW;
    const cy = (minY + maxY) / 2 / imgH;

    const spanW = (maxX - minX) / imgW;
    const spanH = (maxY - minY) / imgH;
    let r_ = Math.max(spanW, spanH) / 2;
    r_ = Math.max(0.08, Math.min(r_, 0.35));

    return {
      ...r,
      heatmap: { cx: round(cx), cy: round(cy), r: round(r_) },
    };
  });
}

function round(n) {
  return Math.round(n * 1000) / 1000;
}

const files = ["data/rsna/samples.json", "data/brain/samples.json"];

for (const file of files) {
  const raw = fs.readFileSync(file, "utf-8");
  const records = JSON.parse(raw);
  const updated = addHeatmap(records, "image_size");
  fs.writeFileSync(file, JSON.stringify(updated, null, 2));
  console.log(`${file}: updated ${updated.length} records`);
}