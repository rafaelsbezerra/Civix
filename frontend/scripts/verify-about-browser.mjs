import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
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
      essentialText: Array.from(
        document.querySelectorAll(
          '[data-testid="about-marker"], #about-title, [data-testid="about-introduction"], [aria-label="Princípios da Civix"] h2, [aria-label="Princípios da Civix"] p',
        ),
        (element) => ({ label: element.textContent?.trim() ?? '', rectangle: element.getBoundingClientRect().toJSON() }),
      ),
      principleItems: Array.from(
        document.querySelectorAll('[aria-label="Princípios da Civix"] article'),
        (article) => ({
          article: article.getBoundingClientRect().toJSON(),
          description: article.querySelector('p').getBoundingClientRect().toJSON(),
          heading: article.querySelector('h2').getBoundingClientRect().toJSON(),
        }),
      ),
      principles: rect('[aria-label="Princípios da Civix"]'),
      scribble: rect('[data-testid="about-scribble"]'),
      scrollHeight: document.documentElement.scrollHeight,
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
    for (const { label, rectangle } of layout.essentialText) {
      assert.ok(rectangle.left >= -0.5, `${label} clipped left at ${viewport.width}px`)
      assert.ok(
        rectangle.right <= layout.clientWidth + 0.5,
        `${label} clipped right at ${viewport.width}px`,
      )
      assert.ok(rectangle.top >= -0.5, `${label} clipped above the document`)
      assert.ok(
        rectangle.bottom <= layout.scrollHeight,
        `${label} clipped below the document`,
      )
    }
    if (viewport.width < 1024) {
      const copy = [layout.marker, layout.heading, layout.introduction]
      for (let index = 0; index < copy.length; index += 1) {
        for (let compared = index + 1; compared < copy.length; compared += 1) {
          assert.equal(rectanglesOverlap(copy[index], copy[compared]), false)
        }
      }
      assert.ok(layout.marker.bottom <= layout.heading.top)
      assert.ok(layout.heading.bottom <= layout.introduction.top)
      assert.ok(Math.max(...copy.map((rectangle) => rectangle.bottom)) <= layout.visual.top)
      assert.ok(layout.visual.bottom <= layout.principles.top)
      for (const [index, item] of layout.principleItems.entries()) {
        assert.equal(rectanglesOverlap(item.heading, item.description), false)
        assert.ok(item.heading.top >= item.article.top && item.heading.bottom <= item.article.bottom)
        assert.ok(
          item.description.top >= item.article.top && item.description.bottom <= item.article.bottom,
        )
        if (index > 0) {
          assert.ok(layout.principleItems[index - 1].article.bottom <= item.article.top)
        }
      }
    }
  }

  await page.setViewportSize({ width: 320, height: 900 })
  await stabilize(page, baseUrl)
  await page.evaluate(() => {
    for (const element of document.querySelectorAll(
      '[data-testid="about-marker"], #about-title, [data-testid="about-introduction"], [aria-label="Princípios da Civix"] h2, [aria-label="Princípios da Civix"] p',
    )) {
      const htmlElement = element
      htmlElement.style.fontSize = `${Number.parseFloat(getComputedStyle(element).fontSize) * 2}px`
      htmlElement.style.overflowWrap = 'anywhere'
    }
  })
  const zoomed = await readLayout(page)
  assert.equal(zoomed.scrollWidth, zoomed.clientWidth, '200% text overflow')
  for (const { label, rectangle } of zoomed.essentialText) {
    assert.ok(rectangle.left >= -0.5, `${label} clipped at 200% text`)
    assert.ok(rectangle.right <= zoomed.clientWidth + 0.5, `${label} clipped at 200% text`)
    assert.ok(rectangle.top >= -0.5, `${label} clipped at 200% text`)
    assert.ok(rectangle.bottom <= zoomed.scrollHeight, `${label} clipped at 200% text`)
  }
  const zoomedCopy = [zoomed.marker, zoomed.heading, zoomed.introduction]
  for (let index = 0; index < zoomedCopy.length; index += 1) {
    for (let compared = index + 1; compared < zoomedCopy.length; compared += 1) {
      assert.equal(rectanglesOverlap(zoomedCopy[index], zoomedCopy[compared]), false)
    }
  }
  assert.ok(zoomed.marker.bottom <= zoomed.heading.top)
  assert.ok(zoomed.heading.bottom <= zoomed.introduction.top)
  assert.ok(
    Math.max(zoomed.marker.bottom, zoomed.heading.bottom, zoomed.introduction.bottom) <=
      zoomed.visual.top,
  )
  assert.ok(zoomed.visual.bottom <= zoomed.principles.top)
  for (const [index, item] of zoomed.principleItems.entries()) {
    assert.equal(rectanglesOverlap(item.heading, item.description), false)
    assert.ok(item.heading.top >= item.article.top && item.heading.bottom <= item.article.bottom)
    assert.ok(
      item.description.top >= item.article.top && item.description.bottom <= item.article.bottom,
    )
    if (index > 0) {
      assert.ok(zoomed.principleItems[index - 1].article.bottom <= item.article.top)
    }
  }

  await page.setViewportSize({ width: 1728, height: 760 })
  await stabilize(page, baseUrl)
  const styles = await page.evaluate(() => {
    const inspect = (selector) => {
      const elements = Array.from(document.querySelectorAll(selector))
      if (elements.length === 0) throw new Error(`Missing ${selector}`)
      return elements.map((element) => {
        const computed = getComputedStyle(element)
        return { color: computed.color, fontFamily: computed.fontFamily }
      })
    }
    const root = getComputedStyle(document.documentElement)
    return {
      accent: inspect('[data-testid="about-marker"] span:first-child')[0],
      background: getComputedStyle(document.querySelector('[data-testid="about-frame"]')).backgroundColor,
      display: inspect('#about-title, [data-testid="about-marker"], [aria-label="Princípios da Civix"] h2'),
      heading: inspect('#about-title')[0],
      normal: inspect('[data-testid="about-introduction"], [aria-label="Princípios da Civix"] p'),
      markerLabel: inspect('[data-testid="about-marker"] span:last-child')[0],
      principleHeadings: inspect('[aria-label="Princípios da Civix"] h2'),
      tokens: {
        accessibleGold: root.getPropertyValue('--color-civix-gold-accessible').trim(),
        gold: root.getPropertyValue('--color-civix-gold').trim(),
        ivory: root.getPropertyValue('--color-civix-ivory').trim(),
        navy: root.getPropertyValue('--color-civix-navy').trim(),
      },
    }
  })
  assert.deepEqual(styles.tokens, {
    accessibleGold: '#9a6500',
    gold: '#d89c28',
    ivory: '#faf9f6',
    navy: '#07192a',
  })
  assert.equal(styles.background, 'rgb(250, 249, 246)')
  assert.equal(styles.accent.color, 'rgb(154, 101, 0)')
  assert.equal(styles.heading.color, 'rgb(7, 25, 42)')
  assert.equal(styles.markerLabel.color, 'rgb(7, 25, 42)')
  for (const role of styles.principleHeadings) assert.equal(role.color, 'rgb(7, 25, 42)')
  for (const role of styles.normal) assert.equal(role.color, 'rgba(7, 25, 42, 0.8)')
  for (const role of styles.display) assert.match(role.fontFamily, /Urbanist Variable/)
  for (const role of styles.normal) assert.match(role.fontFamily, /Inter Variable/)

  assert.ok(contrastRatio(styles.accent.color, styles.background) >= 4.5, 'accent contrast')
  assert.ok(contrastRatio(styles.markerLabel.color, styles.background) >= 4.5, 'marker contrast')
  for (const [index, role] of styles.principleHeadings.entries()) {
    assert.ok(contrastRatio(role.color, styles.background) >= 4.5, `principle ${index} contrast`)
  }
  for (const [index, role] of styles.normal.entries()) {
    assert.ok(contrastRatio(role.color, styles.background) >= 4.5, `normal ${index} contrast`)
  }
  assert.ok(contrastRatio(styles.heading.color, styles.background) >= 3, 'heading contrast')

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
