# Medical AI Dashboard

This is a dashboard where you can just chat and ask for what you want to see
("show me brain tumor cases", "melanoma on the back") and it figures out
which dataset, filters, and visualizations to show, including a 3D model
that highlights and zooms into the relevant body part.

## How it works
You type something in chat
↓
Gemini turns it into structured JSON
↓
{ dataset, task, bodyRegion, filter, visualizations }
↓
Dashboard updates the image, bounding box, heatmap, JSON panel, and 3D model


## Built with

- Next.js + React + Tailwind
- Gemini API (free tier) for the chat → routing part
- Three.js / React Three Fiber for the 3D model
- No auth for now, just a prototype

## Datasets

- **RSNA Pneumonia** — chest X-rays, lungs, detection, real bounding boxes
- **Brain Tumor MRI** — brain, classification (Glioma/Meningioma/Pituitary/No Tumor), real bounding boxes
- **HAM10000** — skin lesions, classification, filterable by diagnosis/sex/localization

All the images and annotations were converted and validated with Pydantic
into one shared JSON format so the dashboard can treat all 3 datasets the
same way.

## What it does

- Chat routing — type what you want and Gemini picks the dataset/task/filters
- Real images with bounding box overlays + thumbnail strip
- Heatmap (illustrative, made from the annotations — not from a trained
  model, and it says so in the UI so it's not overclaiming)
- A panel showing the raw JSON Gemini generated, so you can see exactly
  what it decided
- 3D model — real skeleton, real brain, real lungs inside a translucent
  body. Whichever organ matches the current dataset lights up and the
  camera zooms into it automatically, whether you pick the dataset from
  the dropdown or just ask for it in chat

## About the 3D models

Used real anatomical models (skeleton/brain/lungs), all free and properly
licensed — sources and licenses are listed in
[`ATTRIBUTIONS.md`](./ATTRIBUTIONS.md). The body itself is just a simple
translucent shell I made, not a real anatomical skin model — couldn't find
one that's both free/open-licensed and not fully explicit, so went with a
neutral shell instead.

## Still not done / known gaps

- No separate male/female body model right now since a proper free option
  doesn't really exist
- Heatmap is annotation-based, not from an actual trained model — being
  upfront about that in the UI

## Running it

```bash
npm install
npm run dev
```

Go to `http://localhost:3000`. Needs a Gemini API key in `.env.local`.