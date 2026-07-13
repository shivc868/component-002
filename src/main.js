import './style.css'

/* ── Data ───────────────────────────────────────────────────────────── */
// Images live in /public so no import/bundling is needed.
const slideData = [
  {
    src: '/assets/slide-img-1.jpg',
    description: 'Detroit',
    alt: 'Detroit cityscape featured in the GSAP draggable perspective slider component',
  },
  {
    src: '/assets/slide-img-2.jpg',
    description: 'Paris',
    alt: 'Paris architecture showcased in the GSAP draggable perspective slider component',
  },
  {
    src: '/assets/slide-img-3.jpg',
    description: 'Slide 3',
    alt: 'Editorial showcase image in the interactive GSAP drag slider for creative agency websites',
  },
  {
    src: '/assets/slide-img-4.jpg',
    description: 'Slide 4',
    alt: 'Full-bleed visual demonstrating the smooth GSAP perspective slider animation',
  },
  {
    src: '/assets/slide-img-5.jpg',
    description: 'Slide 5',
    alt: 'Award-style portfolio slide inside the draggable GSAP image carousel',
  },
  {
    src: '/assets/slide-img-6.jpg',
    description: 'Slide 6',
    alt: 'Creative-direction showcase frame in the GSAP touch-enabled slider component',
  },
  {
    src: '/assets/slide-img-7.jpg',
    description: 'Slide 7',
    alt: 'Cinematic slider visual built with GSAP for premium agency and studio sites',
  },
  {
    src: '/assets/slide-img-8.jpg',
    description: 'Slide 8',
    alt: 'Interactive drag-to-explore slide from the GSAP perspective gallery snippet',
  },
  {
    src: '/assets/slide-img-9.jpg',
    description: 'Slide 9',
    alt: 'High-end editorial image animated by the GSAP horizontal drag slider',
  },
  {
    src: '/assets/slide-img-10.jpg',
    description: 'Slide 10',
    alt: 'Award-winning style showcase slide powered by the GSAP creative slider component',
  },
]

const config = {
  lerp: 0.075,
  scrollSpeed: 3.5,
  minSize: 0.1,
  growth: 0.25,
  aspect: 1 / 1.25,
  baseline: 0.0,
}

const growthRatio = Math.exp(config.growth)
const slideCount =
  Math.ceil(Math.log(1 + (growthRatio - 1) / config.minSize) / config.growth) + 4

/* ── Static markup lives in index.html as <template> elements ────────── */
// Clone a template's content into a fresh DocumentFragment.
const cloneTemplate = (id) => document.getElementById(id).content.cloneNode(true)

const app = document.querySelector('#app')

/* ── DESKTOP (≥768px): perspective slider ───────────────────────────── */
function renderDesktop() {
  const slider = document.createElement('section')
  slider.id = 'slider'
  slider.className = 'slider'
  slider.appendChild(cloneTemplate('tpl-header'))
  for (let i = 0; i < slideCount; i++) slider.appendChild(cloneTemplate('tpl-slide'))
  app.replaceChildren(slider)

  const slides = Array.from(slider.querySelectorAll('.slide'))
  const slideStreamIndex = slides.map((_, i) => i)

  const wrap = (value, max) => ((value % max) + max) % max
  const edgeX = (position, width) =>
    (width * config.minSize * (Math.pow(growthRatio, position) - 1)) / (growthRatio - 1)

  const setSlideContent = (slide, index) => {
    if (slide.dataset.index === String(index)) return
    slide.dataset.index = String(index)

    const img = slide.querySelector('img')
    if (img) {
      img.src = slideData[index].src
      img.alt = slideData[index].alt
    }
    const caption = slide.querySelector('[data-caption]')
    if (caption) caption.textContent = slideData[index].description
  }

  let scroll = 0
  let scrollTarget = 0
  let rafId = 0
  let running = false
  let onScreen = false

  const onWheel = (e) => {
    e.preventDefault()
    scrollTarget += (e.deltaY + e.deltaX) * config.scrollSpeed * 0.0014
  }

  let lastPointerX = null
  const onPointerDown = (e) => {
    lastPointerX = e.clientX
    slider.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (lastPointerX === null) return
    scrollTarget += (lastPointerX - e.clientX) * config.scrollSpeed * -0.005
    lastPointerX = e.clientX
  }
  const releasePointer = () => {
    lastPointerX = null
  }

  slider.addEventListener('wheel', onWheel, {passive: false})
  slider.addEventListener('pointerdown', onPointerDown)
  slider.addEventListener('pointermove', onPointerMove)
  slider.addEventListener('pointerup', releasePointer)
  slider.addEventListener('pointercancel', releasePointer)

  const render = () => {
    scroll += (scrollTarget - scroll) * config.lerp

    const sliderWidth = slider.clientWidth
    const sliderHeight = slider.clientHeight
    const baselineOffset = sliderHeight * config.baseline

    for (let i = 0; i < slideCount; i++) {
      const slide = slides[i]
      if (!slide) continue

      let streamIndex = slideStreamIndex[i]

      while (edgeX(streamIndex + scroll, sliderWidth) > sliderWidth) streamIndex -= slideCount
      while (edgeX(streamIndex + scroll + 1, sliderWidth) < 0) streamIndex += slideCount
      slideStreamIndex[i] = streamIndex

      const left = edgeX(streamIndex + scroll, sliderWidth)
      const right = edgeX(streamIndex + scroll + 1, sliderWidth)
      const width = right - left
      const height = width / config.aspect

      setSlideContent(slide, wrap(streamIndex, slideData.length))

      slide.style.width = `${width}px`
      slide.style.height = `${height}px`
      slide.style.zIndex = String(Math.round(right))
      slide.style.transform = `translate(${left}px, ${-baselineOffset}px)`
    }

    if (running) rafId = requestAnimationFrame(render)
  }

  // Only run the render loop while the slider is on screen AND the tab is
  // visible — an off-screen/background animation just burns CPU+GPU.
  const start = () => {
    if (running || !onScreen || document.hidden) return
    running = true
    rafId = requestAnimationFrame(render)
  }
  const stop = () => {
    running = false
    cancelAnimationFrame(rafId)
  }

  const io = new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting
      if (onScreen) start()
      else stop()
    },
    {threshold: 0},
  )
  io.observe(slider)

  const onVisibility = () => {
    if (document.hidden) stop()
    else start()
  }
  document.addEventListener('visibilitychange', onVisibility)

  // Cleanup for when the breakpoint switches to mobile.
  return () => {
    stop()
    io.disconnect()
    document.removeEventListener('visibilitychange', onVisibility)
    slider.removeEventListener('wheel', onWheel)
    slider.removeEventListener('pointerdown', onPointerDown)
    slider.removeEventListener('pointermove', onPointerMove)
    slider.removeEventListener('pointerup', releasePointer)
    slider.removeEventListener('pointercancel', releasePointer)
  }
}

/* ── MOBILE (<768px): simple swipeable cards ────────────────────────── */
function renderMobile() {
  const section = document.createElement('section')
  section.className = 'mobile-slider'
  section.appendChild(cloneTemplate('tpl-header'))

  const row = document.createElement('div')
  row.className = 'card-row'

  for (const slide of slideData) {
    const card = cloneTemplate('tpl-card')
    const img = card.querySelector('[data-img]')
    img.src = slide.src
    img.alt = slide.alt
    card.querySelector('[data-caption]').textContent = slide.description
    row.appendChild(card)
  }

  section.appendChild(row)
  app.replaceChildren(section)
}

/* ── Breakpoint switch (was React's useState + matchMedia) ──────────── */
const mq = window.matchMedia('(min-width: 768px)')
let cleanup = null

const build = () => {
  if (cleanup) {
    cleanup()
    cleanup = null
  }
  cleanup = mq.matches ? renderDesktop() : (renderMobile(), null)
}

mq.addEventListener('change', build)
build()
