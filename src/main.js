import "./style.css";

/* ── Data ───────────────────────────────────────────────────────────── */
// Images live in /public so no import/bundling is needed.
// name / duration / link / awards are placeholders — swap in the real data.
// Award labels: SOTD (Site of the Day), SOTM (Site of the Month),
// HM (Honorable Mention), DEV (Developer Award) — Awwwards;
// WOTD (Website of the Day) — CSS Design Awards.
const slideData = [
  {
    src: "/assets/slide-img-1.jpg",
    name: "Detroit",
    duration: "2021 — 2022",
    link: "#",
    awards: ["SOTD", "DEV"],
    alt: "Detroit cityscape featured in the GSAP draggable perspective slider component",
  },
  {
    src: "/assets/slide-img-2.jpg",
    name: "Paris",
    duration: "2022",
    link: "#",
    awards: ["HM"],
    alt: "Paris architecture showcased in the GSAP draggable perspective slider component",
  },
  {
    src: "/assets/slide-img-3.jpg",
    name: "Monolith",
    duration: "2022 — 2023",
    link: "#",
    awards: ["WOTD"],
    alt: "Editorial showcase image in the interactive GSAP drag slider for creative agency websites",
  },
  {
    src: "/assets/slide-img-4.jpg",
    name: "Halo",
    duration: "2023",
    link: "#",
    awards: ["HM"],
    alt: "Full-bleed visual demonstrating the smooth GSAP perspective slider animation",
  },
  {
    src: "/assets/slide-img-5.jpg",
    name: "Vessel",
    duration: "2023",
    link: "#",
    awards: ["SOTD"],
    alt: "Award-style portfolio slide inside the draggable GSAP image carousel",
  },
  {
    src: "/assets/slide-img-6.jpg",
    name: "Verdure",
    duration: "2023 — 2024",
    link: "#",
    awards: ["SOTM"],
    alt: "Creative-direction showcase frame in the GSAP touch-enabled slider component",
  },
  {
    src: "/assets/slide-img-7.jpg",
    name: "Drapery",
    duration: "2024",
    link: "#",
    awards: ["SOTD", "HM"],
    alt: "Cinematic slider visual built with GSAP for premium agency and studio sites",
  },
  {
    src: "/assets/slide-img-8.jpg",
    name: "Cartography",
    duration: "2024",
    link: "#",
    awards: ["WOTD"],
    alt: "Interactive drag-to-explore slide from the GSAP perspective gallery snippet",
  },
  {
    src: "/assets/slide-img-9.jpg",
    name: "Stillness",
    duration: "2024 — 2025",
    link: "#",
    awards: ["SOTM", "DEV"],
    alt: "High-end editorial image animated by the GSAP horizontal drag slider",
  },
  {
    src: "/assets/slide-img-10.jpg",
    name: "Atlas",
    duration: "2025",
    link: "#",
    awards: ["SOTD"],
    alt: "Award-winning style showcase slide powered by the GSAP creative slider component",
  },
];

const config = {
  lerp: 0.075,
  scrollSpeed: 6.5,
  minSize: 0.07, // slide width at the screen edges (fraction of screen width)
  growth: 0.18, // how fast slides grow toward the screen center
  aspect: 9 / 13, // width : height — smaller = taller slides
  baseline: 0.0,
  // Title arc: every character is placed on a big circle so the text itself
  // bends along a real curve; scrolling rotates the whole ring. The radius
  // is derived from the longest name so neighbouring names never overlap.
  arcGap: 1, // gap between neighbouring names (em of the title font)
  arcSpan: 2.5, // how many names stay visible either side of centre
  arcFadeFalloff: 0.5, // fade per unit of distance from centre
  // Load intro: plays once the loader clears (all images cached) — the
  // slides rise from the bottom edge (centre slide first, then outward to
  // both sides) while the title block fades in.
  introDuration: 1.6, // seconds for the full centre→edges rise wave
  introRise: 0.5, // fraction of the wave each slide's own rise takes
  introArcFade: 1.4, // seconds for the title block's 0→1 fade-in
};

// Slides grow exponentially from the left edge to the screen center, then
// shrink symmetrically toward the right edge. `halfSpan` is how many slide
// units fit between an edge and the center (cumulative width = half screen).
const halfSpan =
  Math.log(1 + config.growth / (2 * config.minSize)) / config.growth;
const span = 2 * halfSpan;
const slideCount = Math.ceil(span) + 4;

/* ── Static markup lives in index.html as <template> elements ────────── */
// Clone a template's content into a fresh DocumentFragment.
const cloneTemplate = (id) =>
  document.getElementById(id).content.cloneNode(true);

const app = document.querySelector("#app");

/* ── DESKTOP (≥768px): perspective slider ───────────────────────────── */
function renderDesktop() {
  const slider = document.createElement("section");
  slider.id = "slider";
  slider.className = "slider";
  slider.appendChild(cloneTemplate("tpl-project-info"));
  for (let i = 0; i < slideCount; i++)
    slider.appendChild(cloneTemplate("tpl-slide"));
  app.replaceChildren(slider);

  const slides = Array.from(slider.querySelectorAll(".slide"));
  const slideStreamIndex = slides.map((_, i) => i);

  // A single static frame marking the centred slot. It stays put while
  // images scroll through it — it does NOT follow individual slides.
  const marker = document.createElement("div");
  marker.className = "center-marker";
  marker.style.opacity = "0"; // fades in with the centre slide's intro rise
  slider.appendChild(marker);

  const info = slider.querySelector(".project-info");

  // The title block is not a drag surface — swallow pointerdowns so the
  // slider doesn't start a drag from over the text.
  const stopInfoDrag = (e) => e.stopPropagation();
  info.addEventListener("pointerdown", stopInfoDrag);
  const arc = info.querySelector("[data-arc]");
  const durationTrack = info.querySelector("[data-duration-track]");

  // Title arc: all names live inside one "ring" element whose origin is the
  // circle's centre. Every character is its own span, placed on the circle
  // by buildArc(); scrolling then only rotates the ring (one transform).
  const ring = document.createElement("div");
  ring.className = "project-info__ring";
  arc.appendChild(ring);

  const titleEls = slideData.map((project) => {
    const link = document.createElement("a");
    link.className = "project-info__title";
    link.href = project.link;
    link.target = "_blank";
    link.rel = "noopener";
    for (const ch of project.name) {
      const span = document.createElement("span");
      span.className = "project-info__char";
      // The "space" below is a non-breaking space (U+00A0): a regular one
      // would collapse during the inline measuring pass in buildArc().
      span.textContent = ch === " " ? " " : ch;
      link.appendChild(span);
    }
    ring.appendChild(link);
    return link;
  });

  // Fill the duration ticker: one line per project, plus a clone of the first
  // project at the end so the wrap from last back to first is seamless.
  const fillTrack = (track, build) => {
    for (const project of [...slideData, slideData[0]]) {
      const line = document.createElement("div");
      line.className = "project-info__line";
      build(line, project);
      track.appendChild(line);
    }
  };
  fillTrack(durationTrack, (line, project) => {
    const duration = document.createElement("span");
    duration.textContent = project.duration;
    line.appendChild(duration);
    for (const award of project.awards) {
      const chip = document.createElement("span");
      chip.className = "project-info__award";
      chip.textContent = award;
      line.appendChild(chip);
    }
  });

  // Line height drives the duration ticker offsets; remeasure when
  // fonts/viewport change the computed sizes.
  let durationLineH = 0;
  const measureInfo = () => {
    durationLineH =
      durationTrack.firstElementChild.getBoundingClientRect().height;
  };
  measureInfo();

  const wrap = (value, max) => ((value % max) + max) % max;

  // Shortest signed distance on the ring of projects, in [-max/2, max/2].
  const wrapSigned = (value, max) => {
    const w = wrap(value, max);
    return w > max / 2 ? w - max : w;
  };

  /* ── Title arc layout ──────────────────────────────────────────────────
     The ten names close a full circle: each name owns a 360°/10 slot, so
     rotating the ring by `pos * slotAngle` wraps seamlessly from the last
     project back to the first. Characters are measured in em (font-size
     independent), so a resize only rescales pixel values — the angles,
     computed once in buildArc(), stay valid. */
  const slotAngle = (Math.PI * 2) / slideData.length;
  let arcRadiusEm = 0; // circle radius in em of the title font
  let charAngles = []; // per title: [{ span, theta }]

  // Convert the em-space layout to pixels: place the ring's origin (the
  // circle centre) radius-px below the arc's top edge, then put every char
  // on the circle — rotate() tilts it tangentially, translateY(-r) pushes it
  // out to the rim, translateX(-50%) centres its box on that point.
  const layoutArc = () => {
    const fontSize = parseFloat(getComputedStyle(arc).fontSize);
    const radius = arcRadiusEm * fontSize;
    ring.style.top = `${radius}px`;
    for (const chars of charAngles)
      for (const { span, theta } of chars)
        span.style.transform = `rotate(${theta}rad) translateY(${-radius}px) translateX(-50%)`;
  };

  const buildArc = () => {
    if (!arc.isConnected) return; // fonts.ready may fire after a re-render

    // Measure every char in normal inline flow (measure class kills the
    // absolute positioning + transforms), in em so results survive resizes.
    ring.classList.add("project-info__ring--measure");
    const fontSize = parseFloat(getComputedStyle(arc).fontSize);
    const measured = titleEls.map((link) => {
      const left = link.getBoundingClientRect().left;
      return {
        width: link.getBoundingClientRect().width / fontSize,
        chars: Array.from(link.children).map((span) => {
          const r = span.getBoundingClientRect();
          return { span, center: (r.left - left + r.width / 2) / fontSize };
        }),
      };
    });
    ring.classList.remove("project-info__ring--measure");

    // Radius so the longest name + gap fits exactly in one slot's arc.
    const maxWidth = Math.max(...measured.map((m) => m.width));
    arcRadiusEm =
      ((maxWidth + config.arcGap) * slideData.length) / (Math.PI * 2);

    // Base angle -i * slotAngle steps names to the LEFT, so scrolling
    // forward sends the active name right while the next rises in from the
    // left (and vice versa scrolling back). Within a name, each char sits at
    // its arc-length offset from the name's centre.
    charAngles = measured.map(({ width, chars }, i) =>
      chars.map(({ span, center }) => ({
        span,
        theta: -i * slotAngle + (center - width / 2) / arcRadiusEm,
      })),
    );
    layoutArc();
  };
  buildArc();

  // The display font loads async — widths measured against the fallback
  // font would bend the kerning out of shape, so re-measure once it's in.
  document.fonts?.ready.then(buildArc);

  // Cumulative width (as a fraction of screen width) from the left edge up
  // to position s while unit widths grow as minSize * e^(growth * s).
  const rise = (s) =>
    (config.minSize * (Math.exp(config.growth * s) - 1)) / config.growth;

  // Edge x for stream position s: exponential rise to the center, mirrored
  // fall to the right edge, extended linearly (min width) off screen so the
  // recycle loops below still work.
  const edgeX = (s, width) => {
    if (s <= 0) return width * config.minSize * s;
    if (s >= span) return width * (1 + config.minSize * (s - span));
    return width * (s <= halfSpan ? rise(s) : 1 - rise(span - s));
  };

  // Size/place the centre marker to the exact-centre slide box (bottom
  // anchored, like the slides). Static — only depends on viewport size.
  const positionMarker = () => {
    const w = slider.clientWidth;
    const h = slider.clientHeight;
    const boxLeft = edgeX(halfSpan - 0.5, w);
    const boxWidth = edgeX(halfSpan + 0.5, w) - boxLeft;
    const boxHeight = boxWidth / config.aspect;
    marker.style.left = `${boxLeft}px`;
    marker.style.top = `${h - boxHeight}px`;
    marker.style.width = `${boxWidth}px`;
    marker.style.height = `${boxHeight}px`;
  };
  positionMarker();

  const onResize = () => {
    measureInfo();
    layoutArc(); // font-size is vw-based — rescale the circle's px values
    positionMarker();
  };
  window.addEventListener("resize", onResize);

  const setSlideContent = (slide, index) => {
    if (slide.dataset.index === String(index)) return;
    slide.dataset.index = String(index);

    const img = slide.querySelector("img");
    if (img) {
      img.src = slideData[index].src;
      img.alt = slideData[index].alt;
    }
    const caption = slide.querySelector("[data-caption]");
    if (caption) caption.textContent = slideData[index].name;
  };

  /* Active project = the slide sitting on the screen's horizontal center.
     The title arc + duration ticker are driven by the same lerped scroll as
     the slides, so the text moves exactly as fast as the images are dragged. */

  // One rotation turns the whole ring: the name at `pos` lands on the top of
  // the circle. Scrolling forward rotates clockwise, so the active name
  // curves off to the right while the next one climbs in from the left.
  // Per-name we only fade with distance and mark the centred one active.
  const positionTitles = (pos) => {
    ring.style.transform = `rotate(${pos * slotAngle}rad)`;

    const active = wrap(Math.round(pos), slideData.length);
    for (let i = 0; i < titleEls.length; i++) {
      const el = titleEls[i];
      const ad = Math.abs(wrapSigned(i - pos, slideData.length));
      el.style.opacity =
        ad > config.arcSpan
          ? "0"
          : String(Math.max(0, 1 - ad * config.arcFadeFalloff));
      el.classList.toggle("project-info__title--active", i === active);
    }
  };

  const updateActiveInfo = () => {
    // edgeX(halfSpan) is the screen center. A slide is dead-center when its
    // middle (stream position + 0.5) sits on halfSpan, so shift by 0.5 — the
    // arc/ticker then rest exactly on a whole line once snapped.
    const pos = wrap(halfSpan - scroll - 0.5, slideData.length);
    durationTrack.style.transform = `translateY(${-pos * durationLineH}px)`;
    positionTitles(pos);
  };

  let scroll = 0;
  let scrollTarget = 0;
  let rafId = 0;
  let running = false;
  let onScreen = false;

  /* ── Loader + load intro ──────────────────────────────────────────────
     A simple cover with a percent counter sits over the stage until every
     slide image is cached. Only then does the intro play — the slides rise
     from below the bottom edge (centre first, wave outward) while the
     title block fades from 0 to 1 — so it never animates empty boxes. */
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const easeOutCubic = (x) => 1 - (1 - x) ** 3;
  let introReady = false; // flips once every slide image has loaded
  let introStart = 0; // stamped on the first frame after introReady

  const loader = document.createElement("div");
  loader.className = "loader";
  const loaderCount = document.createElement("span");
  loaderCount.className = "loader__count";
  loaderCount.textContent = "0%";
  loader.appendChild(loaderCount);
  slider.appendChild(loader);

  let loadedImages = 0;
  const trackImage = (project) =>
    new Promise((resolve) => {
      const img = new Image();
      const done = () => {
        loadedImages++;
        loaderCount.textContent = `${Math.round((loadedImages / slideData.length) * 100)}%`;
        resolve();
      };
      img.onload = done;
      img.onerror = done; // a broken image must not hold the intro hostage
      img.src = project.src;
    });
  Promise.all(slideData.map(trackImage)).then(() => {
    introReady = true;
    loader.classList.add("loader--done"); // CSS fades the cover away
    loader.addEventListener("transitionend", () => loader.remove(), {
      once: true,
    });
  });

  // Ease the nearest slide onto the exact screen center once the user lets
  // go (pointer release / wheel idle) — this also lands the text tickers on
  // a whole line instead of stopping mid-transition.
  const snapToCenter = () => {
    scrollTarget = halfSpan - 0.5 - Math.round(halfSpan - scrollTarget - 0.5);
  };

  let wheelSnapTimer = 0;
  const onWheel = (e) => {
    e.preventDefault();
    if (!introReady) return; // input waits for the loader to clear
    scrollTarget += (e.deltaY + e.deltaX) * config.scrollSpeed * 0.0014;
    clearTimeout(wheelSnapTimer);
    wheelSnapTimer = setTimeout(snapToCenter, 180);
  };

  let lastPointerX = null;
  const onPointerDown = (e) => {
    // Without this the browser starts a native image drag (imgs are
    // draggable by default), which cancels our pointer events mid-drag.
    e.preventDefault();
    if (!introReady) return; // input waits for the loader to clear
    lastPointerX = e.clientX;
    slider.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (lastPointerX === null) return;
    scrollTarget += (lastPointerX - e.clientX) * config.scrollSpeed * -0.005;
    lastPointerX = e.clientX;
  };
  const releasePointer = () => {
    if (lastPointerX === null) return;
    lastPointerX = null;
    snapToCenter();
  };

  // Start with a project already centered (and its text line aligned), and
  // hide the title block so the intro can fade it in from 0.
  snapToCenter();
  scroll = scrollTarget;
  updateActiveInfo();
  if (!reduceMotion) info.style.opacity = "0";

  slider.addEventListener("wheel", onWheel, { passive: false });
  slider.addEventListener("pointerdown", onPointerDown);
  slider.addEventListener("pointermove", onPointerMove);
  slider.addEventListener("pointerup", releasePointer);
  slider.addEventListener("pointercancel", releasePointer);

  const render = (now) => {
    scroll += (scrollTarget - scroll) * config.lerp;

    // Intro clocks (0→1, then stay 1). The clock only starts once the
    // loader has cleared (all images cached); until then both stay at 0.
    if (introReady && !introStart) introStart = now;
    const elapsed = introStart ? (now - introStart) / 1000 : 0;
    const tArc = reduceMotion ? 1 : Math.min(elapsed / config.introArcFade, 1);
    const tRise = reduceMotion
      ? 1
      : Math.min(elapsed / config.introDuration, 1);

    updateActiveInfo();

    // Title block (arc + duration) fades in from 0 → 1.
    info.style.opacity = tArc < 1 ? String(easeOutCubic(tArc)) : "";

    // The centre-slot corner frame fades in with the centre slide's rise.
    marker.style.opacity =
      tRise < 1
        ? String(easeOutCubic(Math.min(tRise / config.introRise, 1)))
        : "";

    const sliderWidth = slider.clientWidth;
    const sliderHeight = slider.clientHeight;
    const baselineOffset = sliderHeight * config.baseline;

    // The centred slide (biggest, straddling the screen middle) gets the
    // corner markers — its middle sits on halfSpan.
    const activeStream = Math.round(halfSpan - scroll - 0.5);

    for (let i = 0; i < slideCount; i++) {
      const slide = slides[i];
      if (!slide) continue;

      let streamIndex = slideStreamIndex[i];

      while (edgeX(streamIndex + scroll, sliderWidth) > sliderWidth)
        streamIndex -= slideCount;
      while (edgeX(streamIndex + scroll + 1, sliderWidth) < 0)
        streamIndex += slideCount;
      slideStreamIndex[i] = streamIndex;

      const left = edgeX(streamIndex + scroll, sliderWidth);
      const right = edgeX(streamIndex + scroll + 1, sliderWidth);
      const width = right - left;
      const height = width / config.aspect;

      setSlideContent(slide, wrap(streamIndex, slideData.length));

      slide.classList.toggle("slide--active", streamIndex === activeStream);

      // Load intro: each slide rises from below the bottom edge by its own
      // height. The wave starts at the screen centre and rolls outward —
      // a slide's start time grows with its distance from the centre.
      let introY = 0;
      if (tRise < 1) {
        const fromCenter = Math.min(
          Math.abs(streamIndex + scroll + 0.5 - halfSpan) / (halfSpan + 1),
          1,
        );
        const begin = fromCenter * (1 - config.introRise);
        const p = Math.min(Math.max((tRise - begin) / config.introRise, 0), 1);
        introY = (1 - easeOutCubic(p)) * height;
      }

      slide.style.width = `${width}px`;
      slide.style.height = `${height}px`;
      slide.style.zIndex = String(Math.round(right));
      slide.style.transform = `translate(${left}px, ${introY - baselineOffset}px)`;
    }

    if (running) rafId = requestAnimationFrame(render);
  };

  // Only run the render loop while the slider is on screen AND the tab is
  // visible — an off-screen/background animation just burns CPU+GPU.
  const start = () => {
    if (running || !onScreen || document.hidden) return;
    running = true;
    rafId = requestAnimationFrame(render);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(rafId);
  };

  const io = new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) start();
      else stop();
    },
    { threshold: 0 },
  );
  io.observe(slider);

  const onVisibility = () => {
    if (document.hidden) stop();
    else start();
  };
  document.addEventListener("visibilitychange", onVisibility);

  // Cleanup for when the breakpoint switches to mobile.
  return () => {
    stop();
    clearTimeout(wheelSnapTimer);
    window.removeEventListener("resize", onResize);
    io.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    slider.removeEventListener("wheel", onWheel);
    slider.removeEventListener("pointerdown", onPointerDown);
    slider.removeEventListener("pointermove", onPointerMove);
    slider.removeEventListener("pointerup", releasePointer);
    slider.removeEventListener("pointercancel", releasePointer);
  };
}

/* ── MOBILE (<768px): simple swipeable cards ────────────────────────── */
function renderMobile() {
  const section = document.createElement("section");
  section.className = "mobile-slider";

  const row = document.createElement("div");
  row.className = "card-row";

  for (const slide of slideData) {
    const card = cloneTemplate("tpl-card");
    card.querySelector(".card").href = slide.link;
    const img = card.querySelector("[data-img]");
    img.src = slide.src;
    img.alt = slide.alt;
    card.querySelector("[data-caption]").textContent = slide.name;
    card.querySelector("[data-duration]").textContent = slide.awards.length
      ? `${slide.duration} · ${slide.awards.join(" · ")}`
      : slide.duration;
    row.appendChild(card);
  }

  section.appendChild(row);
  app.replaceChildren(section);
}

/* ── Breakpoint switch (was React's useState + matchMedia) ──────────── */
const mq = window.matchMedia("(min-width: 768px)");
let cleanup = null;

const build = () => {
  if (cleanup) {
    cleanup();
    cleanup = null;
  }
  cleanup = mq.matches ? renderDesktop() : (renderMobile(), null);
};

mq.addEventListener("change", build);
build();
