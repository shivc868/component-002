import { chromium } from 'playwright'

const OUT = process.argv[2] || '.'
const URL = process.argv[3] || 'http://localhost:5175/'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
await page.screenshot({ path: `${OUT}/mk-00-rest.png` })

// Hover a SIDE image (left of centre) — should zoom.
await page.mouse.move(300, 800)
await page.waitForTimeout(700)
await page.screenshot({ path: `${OUT}/mk-01-hover-side.png` })

// Hover the CENTRE image — should NOT zoom, but marker stays put.
await page.mouse.move(720, 750)
await page.waitForTimeout(700)
await page.screenshot({ path: `${OUT}/mk-02-hover-center.png` })

// Mid-drag: marker must stay fixed while images slide under it.
const slider = await page.$('#slider')
const box = await slider.boundingBox()
const cy = box.y + box.height * 0.9
await page.mouse.move(720, cy)
await page.mouse.down()
await page.mouse.move(640, cy, { steps: 5 })
await page.waitForTimeout(120)
await page.screenshot({ path: `${OUT}/mk-03-mid-drag.png` })
await page.mouse.up()
await page.waitForTimeout(1400)
await page.screenshot({ path: `${OUT}/mk-04-settled.png` })

await browser.close()
console.log('done')
