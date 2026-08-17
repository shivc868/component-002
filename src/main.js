import "./style.css";

/*
 * MFA portfolio slider
 * Slides ride an exponential bell curve, the curved title rotates in sync.
 * Vanilla JS + rAF, no dependencies.
 *
 * Everything lives inside the single mfaSlider() closure below, so nothing
 * leaks into the page. Safe to drop next to any host code (GSAP etc.).
 * Mount point: <div id="mfa-root"></div>
 */

(function mfaSlider() {
  const mount = document.querySelector("#mfa-root");
  if (!mount) return; // container missing, do nothing

  const rows = [
    ["Portraits", "2021 — 2022", ["SONY A7 IV", "85MM F1.4"]],
    ["After Dark", "2022", ["SONY A7S III", "24MM F1.4"]],
    ["Structures", "2022 — 2023", ["NIKON Z8", "14MM F2.8"]],
    ["On Film", "2023", ["LEICA M6", "35MM F2"]],
    ["Wanderlust", "2023", ["FUJI X100V", "23MM F2"]],
    ["Up Close", "2024", ["CANON R5", "100MM MACRO"]],
    ["Night Sky", "2024 — 2025", ["NIKON Z6 II", "20MM F1.8"]],
    ["Open Water", "2023 — 2024", ["SONY A1", "70-200MM"]],
    ["Monsoon", "2024", ["RICOH GR III", "28MM F2.8"]],
    ["Geometry", "2025", ["FUJI GFX 100S", "110MM F2"]],
    ["Summits", "2025", ["SONY A7R V", "16-35MM"]],
    ["In Motion", "2025 — 2026", ["LEICA Q2", "28MM F1.7"]],
  ];

  const projects = rows.map(([name, duration, tags], i) => ({
    name,
    duration,
    tags,
    link: "#",
    src: `/assets/slide-img-${i + 1}.jpg`,
    alt: `${name} photo series cover`,
  }));

  // tuning
  const config = {
    lerp: 0.075, // scroll easing, lower = floatier
    aspect: 9 / 14, // slide width : height
    baseline: 0, // lifts slides off the bottom edge (fraction of height)
    shadeMax: 0.92, // focus shade at the screen edges (0 = off, 1 = black)
    shadeCurve: 1.35, // >1 keeps slides near the centre clearer for longer

    arcGap: 1, // em between neighbouring names on the circle
    arcSpan: 2.5, // names kept visible either side of the centre
    arcFadeFalloff: 0.5, // opacity drop per slot of distance from centre

    introDuration: 1.6, // rise wave, centre to edges (s)
    introRise: 0.5, // each slide's own rise as a fraction of the wave
    introArcFade: 1.4, // title block fade-in (s)
  };

  // bell + input feel; mobile = one full centre slide, half-cut neighbours
  const layouts = {
    desktop: { minSize: 0.085, growth: 0.23, scrollSpeed: 6.5 },
    mobile: { minSize: 0.21, growth: 1.7, scrollSpeed: 2.5 },
  };

  const el = (tag, className, parent) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (parent) parent.appendChild(node);
    return node;
  };

  const wrap = (value, max) => ((value % max) + max) % max;

  // shortest signed distance around a ring of `max` items
  const wrapSigned = (value, max) => {
    const w = wrap(value, max);
    return w > max / 2 ? w - max : w;
  };

  const easeOutCubic = (x) => 1 - (1 - x) ** 3;

  // markup prototypes live in a hidden div in the page, cloned per instance
  const cloneTemplate = (id) =>
    document.getElementById(id).firstElementChild.cloneNode(true);

  const SVG_NS = "http://www.w3.org/2000/svg";

  /*
   * Curved title + duration ticker.
   * Every char sits on one big circle, so scrolling only rotates the ring.
   * update(pos) drives it; pos = fractional index of the centred project.
   */
  function createProjectInfo(info) {
    // a drag must not start from over the text
    info.addEventListener("pointerdown", (e) => e.stopPropagation());

    const arc = info.querySelector("[data-arc]");
    const track = info.querySelector("[data-duration-track]");

    // clip wrapper fades the names out toward the screen edges (see css)
    const clip = el("div", "mfa-project-info__arc-mask", arc);
    const ring = el("div", "mfa-project-info__ring", clip);

    const titles = projects.map((project) => {
      const link = el("a", "mfa-project-info__title", ring);
      link.href = project.link;
      link.target = "_blank";
      link.rel = "noopener";

      const chars = [...project.name].map((ch) => {
        const span = el("span", "mfa-project-info__char", link);
        // nbsp, a normal space would collapse during the measure pass
        span.textContent = ch === " " ? " " : ch;
        return span;
      });

      // hover underline: svg arc, drawn in via stroke-dashoffset
      const svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("class", "mfa-project-info__underline");
      svg.setAttribute("aria-hidden", "true");
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("pathLength", "1");
      svg.appendChild(path);
      link.appendChild(svg);

      return { link, path, chars };
    });

    // ticker lines, plus a clone of the first for a seamless wrap
    for (const project of [...projects, projects[0]]) {
      const line = el("div", "mfa-project-info__line", track);
      el("span", null, line).textContent = project.duration;
      for (const tag of project.tags)
        el("span", "mfa-project-info__tag", line).textContent = tag;
    }

    const slot = (Math.PI * 2) / projects.length;
    let radiusEm = 0;
    let lineHeight = 0;

    // em -> px: rotate every char onto the rim, write the underline arcs
    const layout = () => {
      const fontSize = parseFloat(getComputedStyle(arc).fontSize);
      const radius = radiusEm * fontSize;
      const lineR = radius - 0.94 * fontSize;
      const pt = (a) =>
        `${(lineR * Math.sin(a)).toFixed(2)} ${(-lineR * Math.cos(a)).toFixed(2)}`;
      ring.style.top = `${radius}px`;
      for (const t of titles) {
        t.chars.forEach((span, i) => {
          span.style.transform = `rotate(${t.charThetas[i]}rad) translateY(${-radius}px) translateX(-50%)`;
        });
        t.path.setAttribute(
          "d",
          `M ${pt(t.theta - t.halfAngle)} A ${lineR} ${lineR} 0 0 1 ${pt(t.theta + t.halfAngle)}`,
        );
      }
    };

    // rescale after resize (font size is vw based)
    const relayout = () => {
      lineHeight = track.firstElementChild.getBoundingClientRect().height;
      layout();
    };

    // measure chars in normal inline flow, in em so resizes keep the angles
    const rebuild = () => {
      if (!arc.isConnected) return; // fonts.ready can fire after a teardown

      ring.classList.add("mfa-project-info__ring--measure");
      const fontSize = parseFloat(getComputedStyle(arc).fontSize);
      for (const t of titles) {
        const box = t.link.getBoundingClientRect();
        t.width = box.width / fontSize;
        t.centers = t.chars.map((span) => {
          const r = span.getBoundingClientRect();
          return (r.left - box.left + r.width / 2) / fontSize;
        });
      }
      ring.classList.remove("mfa-project-info__ring--measure");

      // radius: longest name + gap fills one slot
      const maxWidth = Math.max(...titles.map((t) => t.width));
      radiusEm = ((maxWidth + config.arcGap) * projects.length) / (Math.PI * 2);

      // names step right, so the next one enters from the right — the arc
      // then travels the same way as the slides below it
      titles.forEach((t, i) => {
        t.theta = i * slot;
        t.halfAngle = t.width / 2 / radiusEm;
        t.charThetas = t.centers.map(
          (c) => t.theta + (c - t.width / 2) / radiusEm,
        );
      });
      relayout();
    };

    rebuild();
    document.fonts?.ready.then(rebuild); // fallback font metrics skew kerning

    // rotate the ring to pos, fade names by distance, sync the ticker
    const update = (pos) => {
      ring.style.transform = `rotate(${-pos * slot}rad)`;
      track.style.transform = `translateY(${-pos * lineHeight}px)`;

      const active = wrap(Math.round(pos), projects.length);
      titles.forEach((t, i) => {
        const dist = Math.abs(wrapSigned(i - pos, projects.length));
        t.link.style.opacity =
          dist > config.arcSpan
            ? "0"
            : String(Math.max(0, 1 - dist * config.arcFadeFalloff));
        t.link.classList.toggle(
          "mfa-project-info__title--active",
          i === active,
        );
      });
    };

    return { update, relayout };
  }

  /* Builds the whole slider for one breakpoint, returns its teardown. */
  function renderSlider({ minSize, growth, scrollSpeed }) {
    // halfSpan = slide units from a screen edge to the centre
    const halfSpan = Math.log(1 + growth / (2 * minSize)) / growth;
    const span = 2 * halfSpan;
    const slideCount = Math.ceil(span) + 4;

    // no id on purpose: ids are page-global and invite host-page collisions
    const slider = el("section", "mfa-slider");
    slider.appendChild(cloneTemplate("tpl-mfa-project-info"));
    for (let i = 0; i < slideCount; i++)
      slider.appendChild(cloneTemplate("tpl-mfa-slide"));
    mount.replaceChildren(slider);

    const slides = Array.from(slider.querySelectorAll(".mfa-slide"));
    const slideStreamIndex = slides.map((_, i) => i);
    const slideShades = slides.map((s) => s.querySelector(".mfa-slide__shade"));

    const info = slider.querySelector(".mfa-project-info");
    const projectInfo = createProjectInfo(info);

    // corner frame over the centre slot, images scroll through it
    const marker = el("div", "mfa-center-marker", slider);
    marker.style.opacity = "0"; // fades in during the intro

    // bell geometry: cumulative width (screen fraction) up to position s
    const rise = (s) => (minSize * (Math.exp(growth * s) - 1)) / growth;

    // left edge x of position s, mirrored past the centre
    const edgeX = (s, width) => {
      if (s <= 0) return width * minSize * s;
      if (s >= span) return width * (1 + minSize * (s - span));
      return width * (s <= halfSpan ? rise(s) : 1 - rise(span - s));
    };

    const positionMarker = () => {
      const w = slider.clientWidth;
      const h = slider.clientHeight;
      const left = edgeX(halfSpan - 0.5, w);
      const width = edgeX(halfSpan + 0.5, w) - left;
      const height = width / config.aspect;
      marker.style.left = `${left}px`;
      marker.style.top = `${h - height}px`;
      marker.style.width = `${width}px`;
      marker.style.height = `${height}px`;
    };
    positionMarker();

    const onResize = () => {
      projectInfo.relayout();
      positionMarker();
      wake();
    };
    window.addEventListener("resize", onResize);

    const setSlideContent = (slide, index) => {
      if (slide.dataset.index === String(index)) return;
      slide.dataset.index = String(index);
      const img = slide.querySelector("img");
      img.src = projects[index].src;
      img.alt = projects[index].alt;
      slide.querySelector("[data-caption]").textContent = projects[index].name;
    };

    let scroll = 0;
    let scrollTarget = 0;
    let rafId = 0;
    let running = false;
    let onScreen = false;

    // loader: percent cover until all images are cached, then the intro
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let introReady = false; // all images loaded
    let introStart = 0; // stamped on the first frame after introReady

    const loader = el("div", "mfa-loader", slider);
    const counter = el("span", "mfa-loader__count", loader);
    counter.textContent = "0%";

    let loaded = 0;
    const preload = (src) =>
      new Promise((resolve) => {
        const img = new Image();
        const done = () => {
          loaded++;
          counter.textContent = `${Math.round((loaded / projects.length) * 100)}%`;
          resolve();
        };
        img.onload = done;
        img.onerror = done; // a broken image must not block the intro
        img.src = src;
      });
    Promise.all(projects.map((p) => preload(p.src))).then(() => {
      introReady = true;
      loader.classList.add("mfa-loader--done");
      loader.addEventListener("transitionend", () => loader.remove(), {
        once: true,
      });
      wake();
    });

    // input: ease the nearest slide onto the exact centre on release
    const snapToCenter = () => {
      scrollTarget = halfSpan - 0.5 - Math.round(halfSpan - scrollTarget - 0.5);
      wake();
    };

    let wheelSnapTimer = 0;
    const onWheel = (e) => {
      e.preventDefault();
      if (!introReady) return;
      scrollTarget += (e.deltaY + e.deltaX) * scrollSpeed * 0.0014;
      clearTimeout(wheelSnapTimer);
      wheelSnapTimer = setTimeout(snapToCenter, 180);
      wake();
    };

    let lastPointerX = null;
    const onPointerDown = (e) => {
      // stop the browser's native image drag, it cancels pointer events
      e.preventDefault();
      if (!introReady) return;
      lastPointerX = e.clientX;
      slider.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e) => {
      if (lastPointerX === null) return;
      scrollTarget += (lastPointerX - e.clientX) * scrollSpeed * -0.005;
      lastPointerX = e.clientX;
      wake();
    };
    const releasePointer = () => {
      if (lastPointerX === null) return;
      lastPointerX = null;
      snapToCenter();
    };

    // start with a project centred, title hidden until the intro fades it in
    snapToCenter();
    scroll = scrollTarget;
    projectInfo.update(wrap(halfSpan - scroll - 0.5, projects.length));
    if (!reduceMotion) info.style.opacity = "0";

    slider.addEventListener("wheel", onWheel, { passive: false });
    slider.addEventListener("pointerdown", onPointerDown);
    slider.addEventListener("pointermove", onPointerMove);
    slider.addEventListener("pointerup", releasePointer);
    slider.addEventListener("pointercancel", releasePointer);

    // render loop
    const render = (now) => {
      rafId = 0;
      scroll += (scrollTarget - scroll) * config.lerp;

      if (introReady && !introStart) introStart = now;
      const elapsed = introStart ? (now - introStart) / 1000 : 0;
      const tArc = reduceMotion
        ? 1
        : Math.min(elapsed / config.introArcFade, 1);
      const tRise = reduceMotion
        ? 1
        : Math.min(elapsed / config.introDuration, 1);

      // idle (loading wait / snap landed): paint once and sleep until wake()
      const settled =
        Math.abs(scrollTarget - scroll) < 1e-4 &&
        ((tArc === 1 && tRise === 1) || !introStart);
      if (settled) scroll = scrollTarget;

      // centre slide's middle sits on halfSpan, hence the 0.5 shift
      projectInfo.update(wrap(halfSpan - scroll - 0.5, projects.length));

      info.style.opacity = tArc < 1 ? String(easeOutCubic(tArc)) : "";
      marker.style.opacity =
        tRise < 1
          ? String(easeOutCubic(Math.min(tRise / config.introRise, 1)))
          : "";

      const sliderWidth = slider.clientWidth;
      const sliderHeight = slider.clientHeight;
      const baselineOffset = sliderHeight * config.baseline;
      const activeStream = Math.round(halfSpan - scroll - 0.5);

      for (let i = 0; i < slideCount; i++) {
        const slide = slides[i];
        let streamIndex = slideStreamIndex[i];

        // recycle: a slide that left one side re-enters on the other
        while (edgeX(streamIndex + scroll, sliderWidth) > sliderWidth)
          streamIndex -= slideCount;
        while (edgeX(streamIndex + scroll + 1, sliderWidth) < 0)
          streamIndex += slideCount;
        slideStreamIndex[i] = streamIndex;

        const left = edgeX(streamIndex + scroll, sliderWidth);
        const right = edgeX(streamIndex + scroll + 1, sliderWidth);
        const width = right - left;
        const height = width / config.aspect;

        setSlideContent(slide, wrap(streamIndex, projects.length));
        slide.classList.toggle(
          "mfa-slide--active",
          streamIndex === activeStream,
        );

        // focus shade: clear at the centre, darkening toward both edges
        const shadeDist = Math.min(
          Math.abs(streamIndex + scroll + 0.5 - halfSpan) / halfSpan,
          1,
        );
        slideShades[i].style.opacity = (
          config.shadeMax *
          shadeDist ** config.shadeCurve
        ).toFixed(3);

        // rise wave: each slide's start grows with distance from the centre
        let introY = 0;
        if (tRise < 1) {
          const fromCenter = Math.min(
            Math.abs(streamIndex + scroll + 0.5 - halfSpan) / (halfSpan + 1),
            1,
          );
          const begin = fromCenter * (1 - config.introRise);
          const p = Math.min(
            Math.max((tRise - begin) / config.introRise, 0),
            1,
          );
          introY = (1 - easeOutCubic(p)) * height;
        }

        slide.style.width = `${width}px`;
        slide.style.height = `${height}px`;
        slide.style.zIndex = String(Math.round(right));
        slide.style.transform = `translate(${left}px, ${introY - baselineOffset}px)`;
      }

      if (running && !settled) rafId = requestAnimationFrame(render);
    };

    // hoisted so the handlers above can call it
    function wake() {
      if (running && !rafId) rafId = requestAnimationFrame(render);
    }

    // run only while the slider is on screen and the tab is visible
    const start = () => {
      if (running || !onScreen || document.hidden) return;
      running = true;
      wake();
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(rafId);
      rafId = 0;
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

    // teardown for breakpoint switches
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

  // rebuild on breakpoint changes
  const mq = window.matchMedia("(min-width: 768px)");
  let cleanup = null;

  const build = () => {
    if (cleanup) cleanup();
    cleanup = renderSlider(mq.matches ? layouts.desktop : layouts.mobile);
  };

  mq.addEventListener("change", build);
  build();
})();
