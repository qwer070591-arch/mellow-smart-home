import { test, expect } from "@playwright/test";

const base = "http://127.0.0.1:5180";
const leftCurtainEdgeAt = (position: number) =>
  `${Number((23.5 - 16.5 * (position / 100)).toFixed(2))}%`;
const rightCurtainEdgeAt = (position: number) =>
  `${Number((23.5 + 18.5 * (position / 100)).toFixed(2))}%`;

test.beforeEach(async ({ page }) => {
  await page.goto(base);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole("heading", { name: "客廳" })).toBeVisible();
});

test("首頁與鬧鐘操作沒有瀏覽器執行錯誤", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.reload();
  await expect(page.locator(".scene-photo")).toHaveCount(4);
  await expect.poll(() => page.locator(".scene-photo").evaluateAll((images) =>
    images.every((image) => (image as HTMLImageElement).naturalWidth > 0),
  )).toBe(true);
  await page.getByRole("button", { name: "開啟鬧鐘與排程" }).click();
  await page.getByRole("button", { name: /早安排程時間 07:00/ }).click();
  await page.getByRole("button", { name: "取消" }).click();
  await page.getByRole("button", { name: "關閉鬧鐘" }).click();
  expect(errors).toEqual([]);
});

test("窗簾由中央向左右拉開且不影響室內照明", async ({ page }) => {
  const slider = page.locator("#living-curtain-position");
  const sources = await page.locator(".scene-photo").evaluateAll((images) =>
    images.map((image) => (image as HTMLImageElement).currentSrc),
  );
  for (const position of [49, 50, 51]) {
    await slider.evaluate((input, value) => {
      (input as HTMLInputElement).value = String(value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, position);
    await expect(slider).toHaveValue(String(position));
    await expect(page.getByTestId("curtain-opening")).toHaveCSS(
      "--curtain-left-edge", leftCurtainEdgeAt(position),
    );
    await expect(page.getByTestId("curtain-opening")).toHaveCSS(
      "--curtain-right-edge", rightCurtainEdgeAt(position),
    );
  }
  expect(await page.locator(".scene-photo").evaluateAll((images) =>
    images.map((image) => (image as HTMLImageElement).currentSrc),
  )).toEqual(sources);
  const shade = await page.getByTestId("ambient-shade").evaluate((element) => getComputedStyle(element).opacity);
  for (const position of [0, 25, 50, 75, 100]) {
    await slider.evaluate((input, value) => {
      (input as HTMLInputElement).value = String(value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, position);
    await expect(page.getByTestId("curtain-opening")).toHaveCSS(
      "--curtain-left-edge", leftCurtainEdgeAt(position),
    );
    await expect(page.getByTestId("curtain-opening")).toHaveCSS(
      "--curtain-right-edge", rightCurtainEdgeAt(position),
    );
    await expect(page.getByTestId("ambient-shade")).toHaveCSS("opacity", shade);
    const outdoorOpacity = Number((position / 100 * (0.95 - 0.75 * Math.pow(0.8, 1.12))).toFixed(3));
    await expect(page.getByTestId("outdoor-light")).toHaveCSS("opacity", String(outdoorOpacity));
    await page.locator(".room-stage").screenshot({
      path: `output/playwright/curtain-${position}.png`,
    });
  }
});

test("客廳場景、室內溫度與趨勢都在裝置控制", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "裝置總覽" })).toHaveCount(0);
  await expect(page.getByText("日照示意")).toHaveCount(0);
  await expect(page.locator(".room-stage")).toBeVisible();
  await expect(page.locator(".scene-photo")).toHaveCount(4);
  expect(await page.locator(".scene-photo").first().evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByRole("button", { name: "開啟鬧鐘與排程" })).toBeVisible();
  await expect(page.getByText("裝置控制")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "室內溫度" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "24 小時環境趨勢" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "氛圍控制" })).toBeVisible();
  await expect(page.getByText("環境管家")).toHaveCount(0);
  await page.goto(`${base}/environmental-manager`);
  await expect(page).toHaveURL(`${base}/`);
});

test("場景情境同步設備及溫度，重新整理後保留", async ({ page }) => {
  await page
    .locator(".scene-presets button")
    .filter({ hasText: "觀影" })
    .click();
  await expect(page.locator("#living-brightness")).toHaveValue("12");
  await expect(page.locator("#living-curtain-position")).toHaveValue("0");
  await expect(page.locator(".toast")).toHaveCount(0);
  await expect(page.getByRole("slider", { name: "目標溫度" })).toHaveAttribute(
    "aria-valuenow",
    "24",
  );
  await page.reload();
  await expect(page.locator("#living-brightness")).toHaveValue("12");
  await expect(
    page.locator(".scene-presets button").filter({ hasText: "觀影" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .locator(".scene-presets button")
    .filter({ hasText: "睡眠" })
    .click();
  await expect(page.locator("#living-brightness")).toHaveValue("5");
  await expect(page.locator(".toast")).toHaveCount(0);
});

test("燈光與窗簾滑桿會改變場景並保存", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#living-brightness").focus();
  await page.keyboard.press("Home");
  await expect(page.locator("#living-brightness")).toHaveValue("0");
  await expect(page.getByTestId("lamp-lit-room")).toHaveCSS("opacity", "0");
  await page.locator("#living-color-temp").focus();
  await page.keyboard.press("End");
  await expect(page.locator("#living-color-temp")).toHaveValue("6500");
  await page.locator("#living-curtain-position").focus();
  await page.keyboard.press("Home");
  await expect(page.getByTestId("ambient-shade")).toHaveCSS("opacity", "0.2");
  await expect(page.getByTestId("outdoor-light")).toHaveCSS("opacity", "0");
  await expect(page.getByTestId("curtain-opening")).toHaveCSS("opacity", "0");
  await expect(page.getByTestId("curtain-opening")).toHaveCSS("--curtain-left-edge", "23.5%");
  await expect(page.getByTestId("curtain-opening")).toHaveCSS("--curtain-right-edge", "23.5%");
  await page.locator(".room-stage").screenshot({ path: "output/playwright/room-closed-390.png" });
  await page.locator("#living-brightness").focus();
  await page.keyboard.press("End");
  await expect(page.getByTestId("ambient-shade")).toHaveCSS("opacity", "0");
  await expect(page.getByTestId("lamp-lit-room")).toHaveCSS("opacity", "1");
  await expect(page.getByTestId("lamp-tone")).toHaveCSS("opacity", "0.55");
  await page.locator(".room-stage").screenshot({ path: "output/playwright/room-closed-lit-390.png" });
  await page.locator("#living-curtain-position").focus();
  await page.keyboard.press("End");
  await expect(page.getByTestId("ambient-shade")).toHaveCSS("opacity", "0");
  await expect(page.getByTestId("curtain-opening")).toHaveCSS("--curtain-left-edge", "7%");
  await expect(page.getByTestId("curtain-opening")).toHaveCSS("--curtain-right-edge", "42%");
  await expect(page.getByTestId("curtain-opening")).toHaveCSS("opacity", "1");
  await expect(page.getByTestId("outdoor-light")).toHaveCSS("opacity", "0.2");
  await page.locator("#living-brightness").focus();
  await page.keyboard.press("Home");
  await expect(page.getByTestId("ambient-shade")).toHaveCSS("opacity", "0.2");
  await expect(page.getByTestId("outdoor-light")).toHaveCSS("opacity", "0.95");
  await page.locator(".room-stage").screenshot({ path: "output/playwright/room-open-dark-390.png" });
  await page.keyboard.press("End");
  await expect(page.getByTestId("lamp-lit-room")).toHaveCSS("opacity", "1");
  await page.locator(".room-stage").screenshot({ path: "output/playwright/room-lit-390.png" });
  await page.reload();
  await expect(page.locator("#living-color-temp")).toHaveValue("6500");
  await expect(page.locator("#living-curtain-position")).toHaveValue("100");
});

test("四個情境不跳通知，離家同步關燈與空調", async ({ page }) => {
  const shortcuts = page.locator(".scene-presets button");
  await expect(shortcuts).toHaveCount(4);
  for (const name of ["觀影", "睡眠", "離家", "回家"]) {
    await shortcuts.filter({ hasText: name }).click();
    await expect(page.locator(".toast")).toHaveCount(0);
  }
  await shortcuts.filter({ hasText: "離家" }).click();
  await expect(page.getByRole("switch", { name: "檯燈電源" })).toHaveAttribute("aria-checked", "false");
  await expect(page.getByRole("button", { name: "開啟空調" })).toBeVisible();
  await expect(page.locator("#living-curtain-position")).toHaveValue("0");
  await shortcuts.filter({ hasText: "回家" }).click();
  await expect(page.getByRole("switch", { name: "檯燈電源" })).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: "提高目標溫度" }).click();
  await expect(page.getByRole("slider", { name: "目標溫度" })).toHaveAttribute(
    "aria-valuenow",
    "25",
  );
  await page.getByRole("button", { name: "關閉空調" }).click();
  await expect(
    page.getByRole("button", { name: "提高目標溫度" }),
  ).toBeDisabled();
});

test("溫控圓環支援拖曳、鍵盤與本機保存", async ({ page }) => {
  const dial = page.getByRole("slider", { name: "目標溫度" });
  await dial.focus();
  await page.keyboard.press("Home");
  await expect(dial).toHaveAttribute("aria-valuenow", "16");
  await page.keyboard.press("ArrowRight");
  await expect(dial).toHaveAttribute("aria-valuenow", "17");
  const pointAt = (fraction: number) =>
    dial.evaluate((element, position) => {
      const path = element as SVGPathElement;
      const point = path.getPointAtLength(path.getTotalLength() * position);
      const screen = point.matrixTransform(path.getScreenCTM()!);
      return { x: screen.x, y: screen.y };
    }, fraction);
  const start = await page.locator(".dial-handle").evaluate((element) => {
    const handle = element as SVGCircleElement;
    const point = handle.ownerSVGElement!.createSVGPoint();
    point.x = handle.cx.baseVal.value;
    point.y = handle.cy.baseVal.value;
    const screen = point.matrixTransform(handle.getScreenCTM()!);
    return { x: screen.x, y: screen.y };
  });
  const end = await pointAt(0.99);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 12 });
  await page.mouse.up();
  await expect(dial).toHaveAttribute("aria-valuenow", "30");
  await page.reload();
  await expect(page.getByRole("slider", { name: "目標溫度" })).toHaveAttribute(
    "aria-valuenow",
    "30",
  );
});

test("手機觸控可調整溫控圓環", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  try {
    const page = await context.newPage();
    await page.goto(base);
    const dial = page.getByRole("slider", { name: "目標溫度" });
    await dial.scrollIntoViewIfNeeded();
    const point = await dial.evaluate((element) => {
      const path = element as SVGPathElement;
      const location = path.getPointAtLength(path.getTotalLength() * 0.99);
      const screen = location.matrixTransform(path.getScreenCTM()!);
      return { x: screen.x, y: screen.y };
    });
    await page.touchscreen.tap(point.x, point.y);
    await expect(dial).toHaveAttribute("aria-valuenow", "30");
    const handle = await page.locator(".dial-handle").evaluate((element) => {
      const circle = element as SVGCircleElement;
      const point = circle.ownerSVGElement!.createSVGPoint();
      point.x = circle.cx.baseVal.value;
      point.y = circle.cy.baseVal.value;
      const screen = point.matrixTransform(circle.getScreenCTM()!);
      return { x: screen.x, y: screen.y };
    });
    const start = await dial.evaluate((element) => {
      const path = element as SVGPathElement;
      const location = path.getPointAtLength(0);
      const screen = location.matrixTransform(path.getScreenCTM()!);
      return { x: screen.x, y: screen.y };
    });
    const session = await context.newCDPSession(page);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: handle.x, y: handle.y, id: 1 }],
    });
    for (let step = 1; step <= 12; step++) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{
          x: handle.x + (start.x - handle.x) * step / 12,
          y: handle.y + (start.y - handle.y) * step / 12,
          id: 1,
        }],
      });
    }
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect(dial).toHaveAttribute("aria-valuenow", "16");
  } finally {
    await context.close();
  }
});

test("環境趨勢可切換溫度與濕度", async ({ page }) => {
  await page.getByRole("button", { name: "濕度", exact: true }).click();
  await expect(page.locator(".trend-chart")).toHaveAttribute(
    "aria-label",
    /濕度，24 小時模擬趨勢/,
  );
  await page.getByRole("button", { name: "溫度", exact: true }).click();
  await expect(page.locator(".trend-chart")).toHaveAttribute(
    "aria-label",
    /溫度，24 小時模擬趨勢/,
  );
});

test("鬧鐘面板會保存排程時間與啟用狀態", async ({ page }) => {
  await page.getByRole("button", { name: "開啟鬧鐘與排程" }).click();
  await expect(page.getByRole("dialog", { name: "鬧鐘與排程" })).toBeVisible();
  await page.getByRole("button", { name: /早安排程時間 07:00/ }).click();
  const hourWheel = page.getByRole("listbox", { name: "早安排程小時" });
  const minuteWheel = page.getByRole("listbox", { name: "早安排程分鐘" });
  await hourWheel.getByRole("option", { name: "08" }).click();
  await minuteWheel.getByRole("option", { name: "01" }).click();
  await expect(hourWheel.getByRole("option", { name: "08" })).toHaveAttribute("aria-selected", "true");
  await expect(minuteWheel.getByRole("option", { name: "01" })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("button", { name: "確定" }).click();
  await expect(page.getByRole("button", { name: /早安排程時間 08:01/ })).toBeVisible();
  await expect(page.locator(".toast")).toHaveCount(0);
  await page.getByRole("switch", { name: "早安排程啟用" }).click();
  await page.reload();
  await page.getByRole("button", { name: "開啟鬧鐘與排程" }).click();
  await expect(
    page.getByRole("switch", { name: "早安排程啟用" }),
  ).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("button", { name: /早安排程時間 08:01/ })).toBeVisible();
  await page.getByRole("button", { name: /早安排程時間 08:01/ }).click();
  await expect(page.getByRole("dialog", { name: "早安排程時間選擇器" })).toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "早安排程時間選擇器" })).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  await page.getByRole("button", { name: /早安排程時間 08:01/ }).click();
  await page.getByRole("listbox", { name: "早安排程分鐘" }).getByRole("option", { name: "02" }).click();
  await page.getByRole("button", { name: "確定" }).click();
  await expect(page.getByRole("button", { name: /早安排程時間 08:02/ })).toBeVisible();
  await expect(page.locator(".toast")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "鬧鐘與排程" })).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  await page.locator(".scene-presets button").filter({ hasText: "離家" }).click();
  await expect(
    page.getByRole("switch", { name: "檯燈電源" }),
  ).toHaveAttribute("aria-checked", "false");
  await expect(page.locator(".toast")).toHaveCount(0);
});

test("時間滾輪支援滑鼠滾動、鍵盤與手機滑動", async ({ page, browser }) => {
  await page.getByRole("button", { name: "開啟鬧鐘與排程" }).click();
  await page.getByRole("button", { name: /早安排程時間 07:00/ }).click();
  const hourWheel = page.getByRole("listbox", { name: "早安排程小時" });
  await hourWheel.hover();
  await page.mouse.wheel(0, 120);
  await expect.poll(() => hourWheel.locator('[aria-selected="true"]').textContent()).not.toBe("07");
  await hourWheel.focus();
  await page.keyboard.press("Home");
  await expect(hourWheel.getByRole("option", { name: "00" })).toHaveAttribute("aria-selected", "true");

  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  try {
    const mobile = await context.newPage();
    await mobile.goto(base);
    await mobile.getByRole("button", { name: "開啟鬧鐘與排程" }).click();
    await mobile.getByRole("button", { name: /早安排程時間 07:00/ }).click();
    await expect(mobile.locator(".time-sheet-panel:not(.alarm-sheet-panel)")).toHaveCSS("transform", "none");
    const minuteWheel = mobile.getByRole("listbox", { name: "早安排程分鐘" });
    await minuteWheel.scrollIntoViewIfNeeded();
    const box = await minuteWheel.boundingBox();
    const x = box!.x + box!.width / 2;
    const y = box!.y + box!.height / 2;
    const session = await context.newCDPSession(mobile);
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] });
    for (let step = 1; step <= 8; step++) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: y - step * 16, id: 1 }],
      });
    }
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(() => minuteWheel.locator('[aria-selected="true"]').textContent()).not.toBe("00");
  } finally {
    await context.close();
  }
});

for (const width of [1024, 768, 390, 375]) {
  test(`${width}px 平板與手機畫面無水平溢出`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole("heading", { name: "客廳" })).toBeVisible();
    await expect(page.locator(".room-stage")).toBeVisible();
    await expect(page.getByRole("button", { name: "開啟鬧鐘與排程" })).toBeVisible();
    const frame = await page.locator(".living-page").boundingBox();
    expect(frame).not.toBeNull();
    expect(frame!.x).toBeGreaterThan(0);
    expect(frame!.width).toBeLessThan(width);
    await expect(
      page.getByRole("heading", { name: "24 小時環境趨勢" }),
    ).toBeVisible();
    if (width <= 390) {
      await expect(page.locator("#living-brightness")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
      ).toBe(false);
      await expect(page.locator("#living-curtain-position")).toBeVisible();
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    await page.screenshot({
      path: `output/playwright/overview-${width}.png`,
      fullPage: true,
    });
    if (width <= 768) {
      await page.getByRole("button", { name: "開啟鬧鐘與排程" }).click();
      await expect(page.getByRole("dialog", { name: "鬧鐘與排程" })).toBeVisible();
      await expect(page.locator(".alarm-sheet-panel")).toHaveCSS("transform", "none");
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
      await page.screenshot({ path: `output/playwright/alarm-${width}.png` });
      if (width <= 390) {
        await page.getByRole("button", { name: /早安排程時間 07:00/ }).click();
        await expect(page.getByRole("listbox", { name: "早安排程小時" })).toBeVisible();
        await expect(page.getByRole("dialog", { name: "早安排程時間選擇器" })).toBeVisible();
        await expect(page.locator(".time-sheet-panel:not(.alarm-sheet-panel)")).toHaveCSS("transform", "none");
        expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
        await page.screenshot({ path: `output/playwright/time-wheel-${width}.png` });
        await page.getByRole("button", { name: "取消" }).click();
      }
      await page.getByRole("button", { name: "關閉鬧鐘" }).click();
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
  });
}
