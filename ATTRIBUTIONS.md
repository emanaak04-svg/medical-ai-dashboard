# Attributions

This project uses third-party 3D anatomical assets in the interactive body
visualization (`components/BodyModel.tsx`). Credit and license terms below.

## Brain (`public/models/brain.glb`)

- Source: [DrMuratAltun/beyin-simulatoru](https://github.com/DrMuratAltun/beyin-simulatoru)
- Underlying data: BodyParts3D / Z-Anatomy
- License: CC BY-SA 4.0 (data), MIT (viewer code, not used here)
- This file is a derivative work. Any redistribution must retain
  attribution and be shared under the same CC BY-SA 4.0 terms.

## Lungs (`public/models/lungs.glb`)

- Source: NIH 3D / Human Reference Atlas — "Lung, Male"
  (`hra-reference-organ-lung-male-v1.3`)
- URL: https://3d.nih.gov/entries/21008
- Underlying data: Visible Human Project (U.S. National Library of Medicine)
- License: CC BY 4.0

## Skeleton (`public/models/Skeleton.glb`)

- Source: NIH 3D — "Human Skeleton" (3dpx-016838)
- URL: https://3d.nih.gov/entries/3dpx-016838
- License: CC BY 4.0

## Notes

- The translucent body shell in `BodyModel.tsx` (capsule + sphere) is an
  original, non-anatomical placeholder created for this project — no
  external asset or license applies to it.
- No full anatomical skin/body-surface model is used in this project.
