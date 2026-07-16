# Slide Image Prompts — Photographer Portfolio (Noir + Acid theme)

## Specs (every image)

- **Ratio:** portrait **2:3** (e.g. 1024×1536 / 1696×2528). Closest match to the slider's 9:14 frame; `object-fit: cover` handles the small crop.
- **Composition:** subject centered, breathing room at the edges (sides may get cropped).
- **Look:** moody near-monochrome photography — deep charcoal blacks, soft off-white highlights. The UI's chartreuse accent stays in the UI; images stay mostly monochrome so the accent pops.
- **No text / logos / watermarks / borders.**

## Base style (paste before every subject)

> A photorealistic photograph, portrait 2:3. Moody high-contrast editorial photography, near-monochrome color grade: deep charcoal blacks, soft off-white highlights, muted desaturated midtones. Cinematic single-source lighting, deep shadows swallowing the frame edges, subtle fine film grain. Dark background so the frame melts into black. Subject centered with generous negative space. No text, no logos, no watermarks.

## Subjects (slide order → file name)

1. **Portraits** (85mm portrait) → `slide-img-1.jpg`
   > Subject: an intimate street portrait of a stranger lost in thought by a rain-streaked window at night, shallow depth of field, 85mm f/1.4 look, face half-lit by cold window light.

2. **After Dark** (night streets) → `slide-img-2.jpg`
   > Subject: an empty city street at 3am under a single sodium street lamp, long shadows, wet asphalt reflections, wide 24mm night-photography look, lone silhouette in the distance.

3. **Structures** (architecture) → `slide-img-3.jpg`
   > Subject: looking straight up between brutalist concrete towers converging into a dark sky, ultra-wide 14mm perspective, hard geometric shadows, one shaft of light cutting across.

4. **On Film** (analog film) → `slide-img-4.jpg`
   > Subject: a candid analog film photograph of a smoky dim café interior, 35mm rangefinder look, heavy authentic film grain, blown highlights from a single window, timeless mood.

5. **Wanderlust** (travel/street) → `slide-img-5.jpg`
   > Subject: a narrow foggy alley in an old foreign city at dawn, a figure with an umbrella walking away, 23mm street-photography framing, layers of mist swallowing the depth.

6. **Open Water** (ocean) → `slide-img-6.jpg`
   > Subject: a massive dark ocean wave curling mid-break, shot tight on a 70-200mm telephoto, backlit spray glowing white against a black sea, high shutter frozen detail.

7. **Monsoon** (rain) → `slide-img-7.jpg`
   > Subject: heavy rain hammering a city crosswalk seen through a fogged window covered in droplets, 28mm compact-camera candid look, bokeh from blurred traffic lights kept nearly colorless.

8. **Up Close** (macro) → `slide-img-8.jpg`
   > Subject: an extreme macro of a butterfly chrysalis hanging from a branch in darkness, 100mm macro look, razor-thin focus plane, dew drops catching a single light source.

9. **Night Sky** (astro) → `slide-img-9.jpg`
   > Subject: a lone tent under a colossal starry night sky and faint milky way band, 20mm astrophotography look, jagged mountain silhouette, the only warm light is the tiny glow inside the tent.

10. **Geometry** (abstract architecture) → `slide-img-10.jpg`
    > Subject: an abstract repeating pattern of dark metal facade panels shot on a 110mm medium-format lens, compressed perspective, rhythmic light and shadow, almost graphic minimalism.

11. **Summits** (mountains) → `slide-img-11.jpg`
    > Subject: a vast moody mountain ridge above a sea of clouds at blue hour, 16-35mm landscape framing, tiny hiker on the ridgeline for scale, monochromatic layers fading to black.

12. **In Motion** (motion) → `slide-img-12.jpg`
    > Subject: a dancer mid-leap in an empty dark studio, single hard spotlight, 28mm full-body framing, motion blur in the fabric but face sharp, chiaroscuro lighting.

## Tips

- Ek hi chat/session mein saari 12 generate karo aur bolo: **"keep the exact same monochrome grade, grain and lighting style as the previous image"** — consistency ke liye.
- Generate hone ke baad file ko us slide ka naam dekar `public/assets/` mein daal do (upar mapping di hai) — code change ki zaroorat nahi.
