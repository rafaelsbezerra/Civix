import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const reference = {
  frame: { left: 0, top: 0, width: 1728, height: 760 },
  marker: { left: 128, top: 80, width: 88, height: 19 },
  heading: { left: 813, top: 80, width: 683, height: 106 },
  introduction: { left: 813, top: 209, width: 557, height: 80 },
  laptop: { left: 128, top: 247, width: 635, height: 477 },
  scribble: { left: 672, top: 289, width: 104, height: 104 },
  principles: { left: 989, top: 446, width: 611, height: 257 },
}

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds))

function expectWithin(actual, expected, label, tolerance = 4) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${label}: expected ${expected} ±${tolerance}, received ${actual}`,
  )
}

function expectReferenceRect(actual, expected, label) {
  expectWithin(actual.left, expected.left, `${label}.left`)
  expectWithin(actual.top, expected.top, `${label}.top`)
  expectWithin(actual.width, expected.width, `${label}.width`)
  expectWithin(actual.height, expected.height, `${label}.height`)
}

function rectanglesOverlap(first, second) {
  return !(
    first.right <= second.left ||
    second.right <= first.left ||
    first.bottom <= second.top ||
    second.bottom <= first.top
  )
}

function parseRgb(color) {
  const channels = color.match(/[\d.]+/g)?.map(Number)
  assert.ok(channels && channels.length >= 3, `Unsupported color: ${color}`)
  return { channels: channels.slice(0, 3), alpha: channels[3] ?? 1 }
}

function channelToLinear(channel) {
  const value = channel / 255
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function relativeLuminance(channels) {
  const [red, green, blue] = channels.map(channelToLinear)
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function contrastRatio(foreground, background) {
  const foregroundRgb = parseRgb(foreground)
  const backgroundRgb = parseRgb(background)
  const composite = foregroundRgb.channels.map(
    (channel, index) =>
      foregroundRgb.alpha * channel +
      (1 - foregroundRgb.alpha) * backgroundRgb.channels[index],
  )
  const first = relativeLuminance(composite)
  const second = relativeLuminance(backgroundRgb.channels)
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

async function stabilize(page, baseUrl) {
  await page.goto(`${baseUrl}/sobre`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() =>
    Promise.all([
      document.fonts.load('16px "Inter Variable"'),
      document.fonts.load('16px "Urbanist Variable"'),
    ]),
  )
  await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete))
}

async function readLayout(page) {
  return page.evaluate(() => {
    const rect = (selector) => {
      const element = document.querySelector(selector)
      if (!element) throw new Error(`Missing ${selector}`)
      return element.getBoundingClientRect().toJSON()
    }
    return {
      clientWidth: document.documentElement.clientWidth,
      frame: rect('[data-testid="about-frame"]'),
      heading: rect('#about-title'),
      introduction: rect('[data-testid="about-introduction"]'),
      laptop: rect('[data-testid="about-laptop"]'),
      marker: rect('[data-testid="about-marker"]'),
      principles: rect('[aria-label="Princípios da Civix"]'),
      scribble: rect('[data-testid="about-scribble"]'),
      scrollWidth: document.documentElement.scrollWidth,
      visual: rect('[data-testid="about-visual"]'),
    }
  })
}

const server = await createServer({
  logLevel: 'error',
  server: { host: '127.0.0.1', port: 0 },
})
let browser

try {
  await server.listen()
  const address = server.httpServer.address()
  assert.ok(address && typeof address !== 'string', 'Vite server did not expose a port')
  const baseUrl = `http://127.0.0.1:${address.port}`

  browser = await chromium.launch({ channel: 'chrome' })
  const page = await browser.newPage()
  await page.route(/fonts\.(?:googleapis|gstatic)\.com/, (route) => route.abort())

  await page.setViewportSize({ width: 1728, height: 760 })
  await stabilize(page, baseUrl)
  const desktop = await readLayout(page)
  for (const [name, expected] of Object.entries(reference)) {
    expectReferenceRect(desktop[name], expected, name)
  }

  for (const viewport of [
    { width: 320, height: 900 },
    { width: 768, height: 1024 },
    { width: 1024, height: 760 },
    { width: 1728, height: 760 },
  ]) {
    await page.setViewportSize(viewport)
    await stabilize(page, baseUrl)
    const layout = await readLayout(page)
    assert.equal(layout.scrollWidth, layout.clientWidth, `${viewport.width}px overflow`)
    for (const [name, rectangle] of Object.entries({
      heading: layout.heading,
      introduction: layout.introduction,
      principles: layout.principles,
    })) {
      assert.ok(rectangle.left >= -0.5, `${name} clipped left at ${viewport.width}px`)
      assert.ok(
        rectangle.right <= layout.clientWidth + 0.5,
        `${name} clipped right at ${viewport.width}px`,
      )
    }
    if (viewport.width < 1024) {
      assert.equal(rectanglesOverlap(layout.marker, layout.heading), false)
      assert.equal(rectanglesOverlap(layout.introduction, layout.visual), false)
      assert.equal(rectanglesOverlap(layout.visual, layout.principles), false)
    }
  }

  await page.setViewportSize({ width: 1728, height: 760 })
  await stabilize(page, baseUrl)
  const colors = await page.evaluate(() => {
    const style = (selector) => {
      const element = document.querySelector(selector)
      if (!element) throw new Error(`Missing ${selector}`)
      return getComputedStyle(element)
    }
    return {
      accent: style('[data-testid="about-marker"] span').color,
      background: style('[data-testid="about-frame"]').backgroundColor,
      heading: style('#about-title').color,
      normal: style('[data-testid="about-introduction"]').color,
    }
  })
  assert.ok(contrastRatio(colors.accent, colors.background) >= 4.5, 'accent contrast')
  assert.ok(contrastRatio(colors.normal, colors.background) >= 4.5, 'normal contrast')
  assert.ok(contrastRatio(colors.heading, colors.background) >= 3, 'heading contrast')

  const clsPage = await browser.newPage({ viewport: { width: 320, height: 900 } })
  await clsPage.route(/fonts\.(?:googleapis|gstatic)\.com/, (route) => route.abort())
  await clsPage.addInitScript(() => {
    window.__aboutCls = 0
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__aboutCls += entry.value
      }
    }).observe({ buffered: true, type: 'layout-shift' })
  })
  await clsPage.route(/\.(?:png|svg)(?:\?.*)?$/, async (route) => {
    await delay(150)
    await route.continue()
  })
  await stabilize(clsPage, baseUrl)
  await delay(300)
  const cls = await clsPage.evaluate(() => window.__aboutCls ?? 0)
  assert.ok(cls <= 0.1, `CLS expected <= 0.1, received ${cls}`)
  await clsPage.close()

  console.log('Browser checks passed: geometry, responsiveness, contrast, and CLS.')
} finally {
  await browser?.close()
  await server.close()
}
