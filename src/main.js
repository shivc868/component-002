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
  aspect: 9 / 14, // width : height — smaller = taller slides
  baseline: 0.0,
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
  slider.appendChild(marker);

  const info = slider.querySelector(".project-info");
  const infoLink = info.querySelector("[data-link]");

  // The title block is not a drag surface — swallow pointerdowns so the
  // slider doesn't start a drag from over the text.
  const stopInfoDrag = (e) => e.stopPropagation();
  info.addEventListener("pointerdown", stopInfoDrag);
  const nameTrack = info.querySelector("[data-name-track]");
  const durationTrack = info.querySelector("[data-duration-track]");

  // Fill the ticker tracks: one line per project, plus a clone of the first
  // project at the end so the wrap from last back to first is seamless.
  const fillTrack = (track, build) => {
    for (const project of [...slideData, slideData[0]]) {
      const line = document.createElement("div");
      line.className = "project-info__line";
      build(line, project);
      track.appendChild(line);
    }
  };
  fillTrack(nameTrack, (line, project) => {
    // Inner span so the hover underline only spans the text, not the track.
    const text = document.createElement("span");
    text.className = "project-info__line-text";
    text.textContent = project.name;
    line.appendChild(text);
  });
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

  // Line heights drive the ticker offsets; remeasure when fonts/viewport
  // change the computed sizes.
  let nameLineH = 0;
  let durationLineH = 0;
  const measureInfo = () => {
    nameLineH = nameTrack.firstElementChild.getBoundingClientRect().height;
    durationLineH =
      durationTrack.firstElementChild.getBoundingClientRect().height;
  };
  measureInfo();

  const wrap = (value, max) => ((value % max) + max) % max;

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
  };

  /* Active project = the slide sitting on the screen's horizontal center.
     The name/duration tickers are driven by the same lerped scroll as the
     slides, so the text moves exactly as fast as the images are dragged. */
  let shownIndex = -1;

  const updateActiveInfo = () => {
    // edgeX(halfSpan) is the screen center. A slide is dead-center when its
    // middle (stream position + 0.5) sits on halfSpan, so shift by 0.5 —
    // the tickers then rest exactly on a whole line once snapped.
    const pos = wrap(halfSpan - scroll - 0.5, slideData.length);
    nameTrack.style.transform = `translateY(${-pos * nameLineH}px)`;
    durationTrack.style.transform = `translateY(${-pos * durationLineH}px)`;

    const active = wrap(Math.round(pos), slideData.length);
    if (active !== shownIndex) {
      shownIndex = active;
      infoLink.href = slideData[active].link;
    }
  };

  let scroll = 0;
  let scrollTarget = 0;
  let rafId = 0;
  let running = false;
  let onScreen = false;

  // Ease the nearest slide onto the exact screen center once the user lets
  // go (pointer release / wheel idle) — this also lands the text tickers on
  // a whole line instead of stopping mid-transition.
  const snapToCenter = () => {
    scrollTarget = halfSpan - 0.5 - Math.round(halfSpan - scrollTarget - 0.5);
  };

  let wheelSnapTimer = 0;
  const onWheel = (e) => {
    e.preventDefault();
    scrollTarget += (e.deltaY + e.deltaX) * config.scrollSpeed * 0.0014;
    clearTimeout(wheelSnapTimer);
    wheelSnapTimer = setTimeout(snapToCenter, 180);
  };

  let lastPointerX = null;
  const onPointerDown = (e) => {
    // Without this the browser starts a native image drag (imgs are
    // draggable by default), which cancels our pointer events mid-drag.
    e.preventDefault();
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

  // Start with a project already centered (and its text line aligned).
  snapToCenter();
  scroll = scrollTarget;

  slider.addEventListener("wheel", onWheel, { passive: false });
  slider.addEventListener("pointerdown", onPointerDown);
  slider.addEventListener("pointermove", onPointerMove);
  slider.addEventListener("pointerup", releasePointer);
  slider.addEventListener("pointercancel", releasePointer);

  const render = () => {
    scroll += (scrollTarget - scroll) * config.lerp;
    updateActiveInfo();

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

      slide.style.width = `${width}px`;
      slide.style.height = `${height}px`;
      slide.style.zIndex = String(Math.round(right));
      slide.style.transform = `translate(${left}px, ${-baselineOffset}px)`;
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
