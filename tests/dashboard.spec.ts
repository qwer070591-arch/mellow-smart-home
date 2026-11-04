import { test, expect } from '@playwright/test'

const base = 'http://127.0.0.1:5185/'

test.beforeEach(async ({ page }) => { await page.setViewportSize({ width: 1024, height: 768 }); await page.goto(base) })

test('房間 Tabs 在兩種主題保持可讀，支援方向鍵與 Home、End', async ({ page }) => {
  for (const [width, height] of [[360, 800], [390, 844], [768, 1024], [1024, 768], [1440, 900]]) {
    await page.setViewportSize({ width, height })
    for (const theme of ['light', 'dark']) {
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      const tabs = page.getByRole('tablist', { name: '切換房間' })
      await expect(tabs.getByRole('tab')).toHaveCount(3)
      const colors = await tabs.evaluate(element => ({
        surface: getComputedStyle(element).backgroundColor,
        selected: getComputedStyle(element.querySelector('[aria-selected="true"]')!).color,
        unselected: getComputedStyle(element.querySelector('[aria-selected="false"]')!).color,
        indicator: getComputedStyle(element, '::before').backgroundColor,
      }))
      expect(colors.surface).toBe('rgba(251, 250, 246, 0.94)')
      expect(colors.selected).toBe('rgb(255, 255, 255)')
      expect(colors.unselected).toBe('rgb(38, 59, 52)')
      expect(colors.indicator).toBe('rgb(37, 66, 56)')
      await tabs.getByRole('tab', { name: '客廳' }).click()
      await tabs.getByRole('tab', { name: '客廳' }).press('ArrowRight')
      await expect(tabs.getByRole('tab', { name: '主臥' })).toHaveAttribute('aria-selected', 'true')
      await tabs.getByRole('tab', { name: '主臥' }).press('End')
      await expect(tabs.getByRole('tab', { name: '廚房' })).toHaveAttribute('aria-selected', 'true')
      await tabs.getByRole('tab', { name: '廚房' }).press('Home')
      await expect(tabs.getByRole('tab', { name: '客廳' })).toHaveAttribute('aria-selected', 'true')
      if (theme === 'light') await page.locator('.theme-toggle').click()
    }
    await page.locator('.theme-toggle').click()
  }
})

test('首頁在手機、平板和桌機維持單螢幕且圖片載入正常', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  for (const [width, height] of [[360,800],[390,844],[430,932],[768,1024],[820,1180],[1024,768],[1180,820],[1280,800],[1440,900],[390,667],[1024,600]]) {
    await page.setViewportSize({ width, height })
    await page.evaluate(() => document.fonts.ready)
    await expect(page.locator('.room-viewer__photo:not(.room-viewer__lights-off)')).toBeVisible()
    await page.locator('.room-viewer__photo:not(.room-viewer__lights-off)').evaluate((image: HTMLImageElement) => image.decode())
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
    const layout = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, imageOk: (document.querySelector('.room-viewer__photo') as HTMLImageElement).naturalWidth > 0, cardOverflow: [...document.querySelectorAll('.dashboard-overview__cards .device-card')].some(card => card.scrollHeight > card.clientHeight + 2), summaryOverflow: (() => { const summary = document.querySelector('.device-summary')!; return summary.scrollHeight > summary.clientHeight + 2 })() }))
    expect(layout.width, `${width} 水平溢出`).toBeLessThanOrEqual(width)
    expect(layout.height, `${width} 垂直捲動`).toBeLessThanOrEqual(height)
    expect(layout.imageOk).toBe(true)
    expect(layout.cardOverflow, `${width} 卡片內容裁切`).toBe(false)
    expect(layout.summaryOverflow, `${width} 狀態卡內容裁切`).toBe(false)
    expect(await page.locator('.dashboard-overview__cards > .device-card').count()).toBe(3)
    await expect(page.locator('.dashboard-overview__cards .vacuum-card')).toHaveCount(0)
    await expect(page.locator('.dashboard-overview__cards .climate-card')).toHaveCount(1)
    await expect(page.locator('.dashboard-overview__cards .music-card')).toHaveCount(0)
  }
  expect(errors).toEqual([])
})

test('三房在同一照片容器切換，設定各自保存', async ({ page }) => {
  const viewer = page.locator('.room-viewer')
  const initial = await viewer.boundingBox()
  const livingSrc = await page.locator('.room-viewer__photo:not(.room-viewer__lights-off)').getAttribute('src')
  await page.getByRole('tab', { name: '主臥' }).click()
  await expect(viewer.getByRole('heading', { name: '主臥' })).toBeVisible()
  expect(await viewer.evaluate(element => element.querySelectorAll('.room-viewer__photo').length)).toBe(2)
  await expect(page.locator('.room-viewer__photo')).toHaveCount(2)
  const bedroomSrc = await page.locator('.room-viewer__photo:not(.room-viewer__lights-off)').getAttribute('src')
  expect(bedroomSrc).not.toBe(livingSrc)
  expect(page.url()).toBe(base)
  expect(await viewer.boundingBox()).toEqual(initial)
  await page.locator('.lighting-card input[type=range]').first().evaluate((input: HTMLInputElement) => { input.value = '17'; input.dispatchEvent(new Event('input', { bubbles: true })) })
  await page.getByRole('button', { name: '全關' }).click()
  await page.getByRole('tab', { name: '廚房' }).click()
  await expect(viewer.getByRole('heading', { name: '廚房' })).toBeVisible()
  await page.getByRole('tab', { name: '客廳' }).click()
  await expect(page.locator('.lighting-card input[type=range]').first()).toHaveValue('80')
  await page.getByRole('tab', { name: '主臥' }).click()
  await expect(page.locator('.lighting-card input[type=range]').first()).toHaveValue('17')
  await expect(page.locator('.device-summary > input[type=range]')).toHaveValue('0')
  await page.reload()
  await expect(viewer.getByRole('heading', { name: '主臥' })).toBeVisible()
  await expect(page.locator('.lighting-card input[type=range]').first()).toHaveValue('17')
  expect(await viewer.boundingBox()).toEqual(initial)
  expect(await page.locator('.room-viewer').count()).toBe(1)
})

test('燈光開關、滑桿和照片氛圍同步', async ({ page }) => {
  const toggle = page.getByRole('switch', { name: '關閉燈光' })
  await toggle.click()
  await expect(page.getByRole('switch', { name: '開啟燈光' })).toHaveAttribute('aria-checked', 'false')
  await expect(page.locator('.lighting-card input[type=range]').first()).toHaveValue('0')
  await page.getByRole('switch', { name: '開啟燈光' }).click()
  await expect(page.locator('.lighting-card input[type=range]').first()).toHaveValue('1')
  await expect(page.getByRole('switch', { name: '關閉燈光' })).toHaveAttribute('aria-checked', 'true')
  await page.locator('.lighting-card input[type=range]').first().evaluate((input: HTMLInputElement) => { input.value = '70'; input.dispatchEvent(new Event('input', { bubbles: true })) })
  await expect(page.locator('.room-viewer')).toHaveCSS('--lamp-glow', '0.154')
  await expect(page.locator('.room-viewer__lights-off')).toHaveCSS('opacity', '1')
  await expect(page.locator('.room-viewer__lights-on')).toHaveCSS('opacity', '0.7')
})

test('膠囊亮度控制支援手機觸控、鍵盤與開關同步', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  const page = await context.newPage()
  await page.goto(base)
  await page.locator('.dashboard-overview__mobile-actions button').nth(2).click()
  const sheet = page.getByRole('dialog', { name: '智慧燈光' })
  const slider = sheet.locator('.bubble-slider input[type=range]')
  const bounds = await slider.boundingBox()
  expect(bounds).not.toBeNull()
  const y = bounds!.y + bounds!.height / 2
  const x = (fraction: number) => bounds!.x + bounds!.width * fraction
  const cdp = await context.newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x(.02), y }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x(.37), y }] })
  await expect.poll(async () => Number(await slider.inputValue())).toBeGreaterThan(32)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x(.83), y }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect.poll(async () => Number(await slider.inputValue())).toBeGreaterThan(78)
  await expect(sheet.getByRole('switch', { name: '關閉燈光' })).toHaveAttribute('aria-checked', 'true')
  await sheet.getByRole('switch', { name: '關閉燈光' }).click()
  await expect(slider).toHaveValue('0')
  await expect(sheet.locator('.lighting-product__lamp--on')).toHaveCSS('opacity', '0')
  await sheet.getByRole('switch', { name: '開啟燈光' }).click()
  await expect(slider).toHaveValue('1')
  await slider.focus()
  await page.keyboard.press('End')
  await expect(slider).toHaveValue('100')
  await context.close()
})

test('三房六段亮度連續控制關燈影像且不改變夜景、窗簾與主題', async ({ page }) => {
  const slider = page.locator('.lighting-card input[type=range]').first()
  for (const [index, room] of ['living', 'bedroom', 'kitchen'].entries()) {
    await page.locator('.room-tabs button').nth(index).click()
    const scene = page.locator('.room-viewer')
    const photo = await scene.locator('.room-viewer__photo:not(.room-viewer__lights-off)').getAttribute('src')
    const curtain = await page.locator('.device-summary > input[type=range]').inputValue()
    for (const brightness of [0, 1, 25, 50, 75, 100]) {
      await slider.evaluate((input: HTMLInputElement, value) => {
        input.value = String(value)
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }, brightness)
      await expect(slider).toHaveValue(String(brightness))
      await expect(scene.locator('.room-viewer__lights-off')).toHaveCSS('opacity', '1')
      await expect(scene.locator('.room-viewer__lights-on')).toHaveCSS('opacity', String(brightness / 100))
      expect(await scene.locator('.room-viewer__photo:not(.room-viewer__lights-off)').getAttribute('src')).toBe(photo)
      await expect(page.locator('.device-summary > input[type=range]')).toHaveValue(curtain)
    }
  }
  await page.getByRole('button', { name: '切換至深色介面' }).click()
  await expect(slider).toHaveValue('100')
  await page.locator('.room-tabs button').first().click()
  await expect(slider).toHaveValue('100')
})

test('三間房的窗簾及月光在 12 個開度皆連續更新並保存', async ({ page }) => {
  const values = [0, 1, 17, 25, 37, 50, 63, 75, 83, 93, 99, 100]
  const slider = page.locator('.device-summary > input[type=range]')
  for (const [index, room] of ['living', 'bedroom', 'kitchen'].entries()) {
    await page.locator('.room-tabs button').nth(index).click()
    const seen = new Set<number>()
    for (const value of values) {
      await slider.evaluate((input: HTMLInputElement, next) => {
        input.value = String(next)
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }, value)
      await expect(slider).toHaveValue(String(value))
      const expectedPosition = (room === 'kitchen' ? 535 : room === 'living' ? 460 : 330) * (1 - value / 100)
      await expect.poll(async () => page.locator('.room-viewer').evaluate((viewer, room) => {
        const curtain = viewer.querySelector(room === 'kitchen' ? '#curtain-kitchen polygon' : '#curtain-left rect')!
        return room === 'kitchen'
          ? Number(curtain.getAttribute('points')!.split(' ')[2]!.split(',')[1])
          : Number(curtain.getAttribute('width'))
      }, room), { intervals: [25], timeout: 2000 }).toBeCloseTo(expectedPosition, 1)
      const visual = await page.locator('.room-viewer').evaluate((viewer, room) => {
        const curtain = viewer.querySelector(room === 'kitchen' ? '#curtain-kitchen polygon' : '#curtain-left rect')!
        return {
          position: room === 'kitchen'
            ? Number(curtain.getAttribute('points')!.split(' ')[2]!.split(',')[1])
            : Number(curtain.getAttribute('width')),
          moonlight: Number(getComputedStyle(viewer).getPropertyValue('--moonlight')),
          reach: Number(getComputedStyle(viewer).getPropertyValue('--moon-reach')),
        }
      }, room)
      expect(visual.position).toBeCloseTo(expectedPosition, 1)
      expect(visual.moonlight).toBeCloseTo(value / 100 * .42, 3)
      expect(visual.reach).toBeCloseTo(.45 + value / 100 * .55, 3)
      seen.add(visual.position)
    }
    expect(seen.size).toBe(values.length)
  }
  await slider.evaluate((input: HTMLInputElement) => { input.value = '37'; input.dispatchEvent(new Event('input', { bubbles: true })) })
  await page.getByRole('button', { name: '切換至深色介面' }).click()
  await expect(slider).toHaveValue('37')
  await page.reload()
  await expect(slider).toHaveValue('37')
  await page.locator('.room-tabs button').first().click()
  await expect(slider).toHaveValue('100')
})

test('窗簾快捷操作柔和跟隨；減少動畫偏好立即定位', async ({ page }) => {
  const slider = page.locator('.device-summary > input[type=range]')
  const leftPanel = page.locator('#curtain-left rect')
  await page.getByRole('button', { name: '全關' }).click()
  await expect(slider).toHaveValue('0')
  const duringMotion = Number(await leftPanel.getAttribute('width'))
  expect(duringMotion).toBeLessThan(460)
  await expect.poll(async () => Number(await leftPanel.getAttribute('width')), { intervals: [25] }).toBeCloseTo(460, 1)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: '全開' }).click()
  await expect(leftPanel).toHaveAttribute('width', '0')
  await page.getByRole('button', { name: '全關' }).click()
  await expect(leftPanel).toHaveAttribute('width', '460')
})

test('主題切換不更動房間夜景，且重新整理後保留', async ({ page }) => {
  const src = await page.locator('.room-viewer__photo:not(.room-viewer__lights-off)').getAttribute('src')
  await page.getByRole('button', { name: '切換至深色介面' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await page.locator('.room-viewer__photo:not(.room-viewer__lights-off)').getAttribute('src')).toBe(src)
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await page.locator('.room-viewer__photo:not(.room-viewer__lights-off)').getAttribute('src')).toBe(src)
})

test('首頁顯示燈光、氛圍與溫控三張等高卡片', async ({ page }) => {
  const cards = page.locator('.dashboard-overview__cards > .device-card')
  await expect(cards).toHaveCount(3)
  const boxes = await cards.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().toJSON()))
  expect(Math.abs(boxes[0]!.width - boxes[2]!.width)).toBeLessThan(2)
  expect(Math.abs(boxes[0]!.height - boxes[1]!.height)).toBeLessThan(2)
  expect(Math.abs(boxes[1]!.height - boxes[2]!.height)).toBeLessThan(2)
  await expect(page.locator('.atmosphere-card__presets button')).toHaveCount(4)
  await expect(page.locator('.vacuum-card')).toHaveCount(0)
})

test('室內溫度可用按鈕、鍵盤與圓弧拖曳調整，關閉後保留設定', async ({ page }) => {
  const card = page.locator('.climate-card--compact')
  const dial = card.getByRole('slider', { name: '目標溫度' })
  await expect(card).toContainText('目前室溫 26.3°C')
  await expect(dial).toHaveAttribute('aria-valuenow', '24')
  await card.getByRole('button', { name: '提高目標溫度' }).click()
  await expect(dial).toHaveAttribute('aria-valuenow', '25')
  await card.getByRole('button', { name: '降低目標溫度' }).click()
  await expect(dial).toHaveAttribute('aria-valuenow', '24')
  await dial.focus()
  await dial.press('ArrowUp')
  await expect(dial).toHaveAttribute('aria-valuenow', '25')
  await dial.press('Home')
  await expect(dial).toHaveAttribute('aria-valuenow', '16')
  await dial.press('End')
  await expect(dial).toHaveAttribute('aria-valuenow', '30')
  await card.getByRole('switch', { name: '關閉空調' }).click()
  await expect(card).toContainText('OFF')
  await expect(dial).toHaveAttribute('aria-disabled', 'true')
  await card.getByRole('switch', { name: '開啟空調' }).click()
  await expect(dial).toHaveAttribute('aria-valuenow', '30')

  const points = await dial.evaluate((element: SVGPathElement) => {
    const matrix = element.ownerSVGElement!.getScreenCTM()!
    const at = (temperature: number) => {
      const angle = (150 + (temperature - 16) / 14 * 240) * Math.PI / 180
      const point = new DOMPoint(150 + 115 * Math.cos(angle), 150 + 115 * Math.sin(angle)).matrixTransform(matrix)
      return { x: point.x, y: point.y }
    }
    return { start: at(30), end: at(22) }
  })
  await page.mouse.move(points.start.x, points.start.y)
  await page.mouse.down()
  await page.mouse.move(points.end.x, points.end.y, { steps: 12 })
  await page.mouse.up()
  await expect(dial).toHaveAttribute('aria-valuenow', '22')
})

test('三個房間溫控互不干擾，重新整理與切換主題後維持設定', async ({ page }) => {
  const card = page.locator('.climate-card--compact')
  const dial = card.getByRole('slider', { name: '目標溫度' })
  await page.getByRole('tab', { name: '主臥' }).click()
  await dial.focus()
  await dial.press('Home')
  for (let count = 0; count < 6; count++) await dial.press('ArrowRight')
  await expect(dial).toHaveAttribute('aria-valuenow', '22')
  await expect(card).toContainText('目前室溫 24.8°C')
  await page.getByRole('tab', { name: '廚房' }).click()
  await card.getByRole('switch', { name: '開啟空調' }).click()
  await dial.focus()
  await dial.press('End')
  for (let count = 0; count < 4; count++) await dial.press('ArrowLeft')
  await expect(dial).toHaveAttribute('aria-valuenow', '26')
  await expect(card).toContainText('目前室溫 27.1°C')
  await page.getByRole('button', { name: '切換至深色介面' }).click()
  await expect(dial).toHaveAttribute('aria-valuenow', '26')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(dial).toHaveAttribute('aria-valuenow', '26')
  await page.getByRole('tab', { name: '客廳' }).click()
  await expect(dial).toHaveAttribute('aria-valuenow', '24')
  await page.getByRole('tab', { name: '主臥' }).click()
  await expect(dial).toHaveAttribute('aria-valuenow', '22')
})

test('手機觸控可切換房間並開啟底部控制面板', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const page = await context.newPage()
  await page.goto(base)
  const bedroom = page.locator('.room-tabs button').nth(1)
  const box = await bedroom.boundingBox()
  await page.touchscreen.tap(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await expect(page.locator('.room-viewer h1')).toHaveText('主臥')
  await page.getByRole('button', { name: /窗簾/ }).last().tap()
  await expect(page.getByRole('dialog', { name: '窗簾控制' })).toBeVisible()
  await expect(page.getByRole('dialog', { name: '窗簾控制' })).toHaveCSS('transform', 'none')
  const slider = page.locator('#sheet-curtain')
  const sliderBox = await slider.boundingBox()
  const touch = await context.newCDPSession(page)
  const y = sliderBox!.y + sliderBox!.height / 2
  const start = sliderBox!.x + sliderBox!.width * .7
  const end = sliderBox!.x + sliderBox!.width * .35
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: start, y }] })
  for (const ratio of [.6, .5, .4, .35]) {
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: sliderBox!.x + sliderBox!.width * ratio, y }] })
  }
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect.poll(async () => Number(await slider.inputValue())).toBeGreaterThan(25)
  await expect.poll(async () => Number(await slider.inputValue())).toBeLessThan(45)
  await page.getByRole('dialog', { name: '窗簾控制' }).getByRole('button', { name: '0%', exact: true }).tap()
  await expect(page.locator('#curtain-left rect')).toHaveAttribute('width', '330')
  await page.getByRole('button', { name: '關閉控制面板' }).tap()
  await expect(page.getByRole('dialog', { name: '窗簾控制' })).toHaveCount(0)
  await page.locator('.room-tabs button').first().tap()
  await page.locator('.room-tabs button').nth(1).tap()
  await page.getByRole('button', { name: /窗簾/ }).last().tap()
  await expect(page.locator('#sheet-curtain')).toHaveValue('0')
  await page.getByRole('button', { name: '關閉控制面板' }).tap()
  await page.locator('.dashboard-overview__mobile-actions button').first().tap()
  const climateSheet = page.getByRole('dialog', { name: '室內溫度' })
  await expect(climateSheet).toHaveCSS('transform', 'none')
  const climateDial = climateSheet.getByRole('slider', { name: '目標溫度' })
  await climateSheet.getByRole('button', { name: '提高目標溫度' }).tap()
  await expect(climateDial).toHaveAttribute('aria-valuenow', '24')
  const arc = await climateDial.evaluate((element: SVGPathElement) => {
    const matrix = element.ownerSVGElement!.getScreenCTM()!
    return [24, 25, 26, 27].map(temperature => {
      const angle = (150 + (temperature - 16) / 14 * 240) * Math.PI / 180
      const point = new DOMPoint(150 + 115 * Math.cos(angle), 150 + 115 * Math.sin(angle)).matrixTransform(matrix)
      return { x: point.x, y: point.y }
    })
  })
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [arc[0]!] })
  for (const point of arc.slice(1)) await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point] })
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect(climateDial).toHaveAttribute('aria-valuenow', '27')
  await expect(climateSheet.locator('.climate-card__dial')).not.toHaveClass(/dragging/)
  await context.close()
})

test('平板觸控拖曳窗簾滑桿會更新圖層及儲存狀態', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 768, height: 1024 }, hasTouch: true })
  const page = await context.newPage()
  await page.goto(base)
  const slider = page.locator('.device-summary > input[type=range]')
  const box = await slider.boundingBox()
  expect(box).not.toBeNull()
  const touch = await context.newCDPSession(page)
  const y = box!.y + box!.height / 2
  const x = (ratio: number) => box!.x + box!.width * ratio
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x(.9), y }] })
  for (const ratio of [.83, .75, .68, .62]) {
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x(ratio), y }] })
  }
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect.poll(async () => Number(await slider.inputValue())).toBeGreaterThan(55)
  await expect.poll(async () => Number(await slider.inputValue())).toBeLessThan(70)
  const saved = await slider.inputValue()
  await expect.poll(async () => Number(await page.locator('#curtain-left rect').getAttribute('width')), { intervals: [25] })
    .toBeCloseTo(460 * (1 - Number(saved) / 100), 1)
  await page.reload()
  await expect(slider).toHaveValue(saved)
  await context.close()
})
