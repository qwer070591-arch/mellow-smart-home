import { test, expect } from "@playwright/test";

const base = "http://127.0.0.1:5180";
const curtainWidthAt = (position: number) => 9 + 74 * (1 - position / 100);
const lampIntensityAt = (brightness: number) => {
  const level = brightness / 100;
  const lowLevel = Math.min(level * 5, 1);
  return Math.pow(level, 0.45) * (0.1 + 0.9 * lowLevel * lowLevel * (3 - 2 * lowLevel));
};

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
  await expect(page.getByTestId("living-room-scene")).toBeVisible();
  await expect(page.getByTestId("curtain-panel-left")).toHaveCount(1);
  await expect(page.getByTestId("arched-window")).toHaveCount(1);
  await expect(page.getByTestId("wall-art")).toHaveCount(1);
  await expect(page.getByTestId("pendant-lamp")).toHaveCount(1);
  await page.getByRole("button", { name: "開啟鬧鐘與排程" }).click();
  await page.getByRole("button", { name: /早安排程時間 07:00/ }).click();
  await page.getByRole("button", { name: "取消" }).click();
  await page.getByRole("button", { name: "關閉鬧鐘" }).click();
  expect(errors).toEqual([]);
});

test("預設白天，主題與時鐘獨立且重新整理後保留", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("button", { name: "切換至夜晚模式" })).toBeVisible();
  await expect(page.getByTestId("day-room")).toHaveCSS("opacity", "1");
  await expect(page.getByTestId("day-window")).toHaveCSS("opacity", "1");
  await expect(page.getByTestId("moonlight-spill")).toHaveCSS("opacity", "0");
  await expect(page.locator("#living-brightness")).toHaveValue("80");
  await expect(page.locator("#living-curtain-position")).toHaveValue("100");
  const clock = await page.locator(".living-header time").textContent();
  await page.getByRole("button", { name: "切換至夜晚模式" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByTestId("day-window")).toHaveCSS("opacity", "0");
  await expect(page.getByTestId("day-room")).toHaveCSS("opacity", "0");
  await expect(page.getByTestId("moonlight-spill")).not.toHaveCSS("opacity", "0");
  await expect(page.locator("#living-brightness")).toHaveValue("80");
  await expect(page.locator("#living-curtain-position")).toHaveValue("100");
  expect(await page.locator(".living-header time").textContent()).toBe(clock);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: "切換至白天模式" })).toBeVisible();
  await page.getByRole("button", { name: "切換至白天模式" }).click();
  await expect(page.getByTestId("day-window")).toHaveCSS("opacity", "1");
  await expect(page.getByTestId("moonlight-spill")).toHaveCSS("opacity", "0");
  await page.reload();
  await expect(page.getByRole("button", { name: "切換至夜晚模式" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("減少動畫偏好下仍可切換主題", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const duration = await page.getByTestId("day-window").evaluate((element) =>
    parseFloat(getComputedStyle(element).transitionDuration),
  );
  expect(duration).toBeLessThan(0.01);
  await page.getByRole("button", { name: "切換至夜晚模式" }).click();
  await expect(page.getByTestId("day-window")).toHaveCSS("opacity", "0");
});

test("窗簾由中央向左右拉開且不影響室內照明", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const slider = page.locator("#living-curtain-position");
  const left = page.getByTestId("curtain-panel-left");
  const right = page.getByTestId("curtain-panel-right");
  await page.locator("#living-brightness").focus();
  await page.keyboard.press("Home");
  await expect(page.getByTestId("lamp-lit-room")).toHaveCSS("opacity", "0");
  await slider.evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(page.getByTestId("daylight-spill")).toHaveCSS("opacity", "0");
  await page.locator(".room-stage").screenshot({ path: "output/playwright/curtain-day-0.png", animations: "disabled" });
  await slider.evaluate((input) => {
    (input as HTMLInputElement).value = "100";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(page.getByTestId("daylight-spill")).not.toHaveCSS("opacity", "0");
  await expect(page.getByTestId("moonlight-spill")).toHaveCSS("opacity", "0");
  await page.locator(".room-stage").screenshot({ path: "output/playwright/curtain-day-100.png", animations: "disabled" });
  await slider.evaluate((input) => {
    (input as HTMLInputElement).value = "50";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(page.getByTestId("daylight-spill")).toHaveCSS("opacity", "0.41");
  await page.locator(".room-stage").screenshot({ path: "output/playwright/curtain-day-50.png", animations: "disabled" });
  await page.getByRole("button", { name: "切換至夜晚模式" }).click();
  for (const position of [0, 25, 49, 50, 51, 75, 100]) {
    await slider.evaluate((input, value) => {
      (input as HTMLInputElement).value = String(value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, position);
    await expect(slider).toHaveValue(String(position));
    expect(Number(await left.getAttribute("width"))).toBeCloseTo(curtainWidthAt(position));
    expect(Number(await right.getAttribute("width"))).toBeCloseTo(curtainWidthAt(position));
    expect(Number(await right.getAttribute("x"))).toBeCloseTo(731 - curtainWidthAt(position));
    const moonlight = Number((position / 100 * 0.38).toFixed(3));
    await expect(page.getByTestId("moonlight-spill")).toHaveCSS("opacity", String(moonlight));
    if ([0, 50, 100].includes(position)) {
      await page.locator(".room-stage").screenshot({ path: `output/playwright/curtain-${position}.png` });
    }
  }
});

test("關燈關簾、漸開窗簾與開燈會改變室內材質受光", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const scene = page.getByTestId("living-room-scene");
  const brightness = page.locator("#living-brightness");
  const curtain = page.locator("#living-curtain-position");
  const setRange = async (slider: typeof brightness, value: number) => {
    await slider.evaluate((input, next) => {
      (input as HTMLInputElement).value = String(next);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, value);
    await expect(slider).toHaveValue(String(value));
  };
  const luminance = async (testId: string) => {
    const color = await page.getByTestId(testId).getAttribute("stop-color");
    const channels = color?.match(/\d+/g)?.map(Number);
    expect(channels).toHaveLength(3);
    return channels![0]! * 0.2126 + channels![1]! * 0.7152 + channels![2]! * 0.0722;
  };

  await setRange(brightness, 0);
  const ambientByCurtain: number[] = [];
  const wallByCurtain: number[] = [];
  const floorByCurtain: number[] = [];
  const sofaByCurtain: number[] = [];
  const tableByCurtain: number[] = [];
  const lightReachByCurtain: number[] = [];
  for (const open of [0, 25, 50, 100]) {
    await setRange(curtain, open);
    await expect(scene).toHaveAttribute("data-ambient-intensity", (0.42 + 0.58 * open / 100).toFixed(3));
    ambientByCurtain.push(Number(await scene.getAttribute("data-ambient-intensity")));
    wallByCurtain.push(await luminance("day-wall-center"));
    floorByCurtain.push(await luminance("day-floor-near"));
    sofaByCurtain.push(await luminance("sofa-surface-light"));
    tableByCurtain.push(await luminance("table-surface-light"));
    lightReachByCurtain.push(Number(await page.getByTestId("daylight-floor").getAttribute("rx")));
    await expect(page.getByTestId("daylight-spill")).toHaveCSS("opacity", String(Number((open * 0.0082).toFixed(3))));
    await expect(page.getByTestId("lamp-lit-room")).toHaveCSS("opacity", "0");
    if (open === 0 || open === 100) {
      await page.locator(".room-stage").screenshot({ path: `output/playwright/lighting-day-curtain-${open}-off.png`, animations: "disabled" });
    }
  }
  for (const values of [ambientByCurtain, wallByCurtain, floorByCurtain, sofaByCurtain, tableByCurtain, lightReachByCurtain]) {
    expect(values.every((value, index) => index === 0 || value > values[index - 1]!)).toBe(true);
  }

  await setRange(curtain, 0);
  const sofaClosedOff = await luminance("sofa-surface-light");
  const tableClosedOff = await luminance("table-surface-light");
  await setRange(brightness, 50);
  const sofaClosedHalf = await luminance("sofa-surface-light");
  const tableClosedHalf = await luminance("table-surface-light");
  await setRange(brightness, 100);
  expect(await luminance("sofa-surface-light")).toBeGreaterThan(sofaClosedHalf);
  expect(await luminance("table-surface-light")).toBeGreaterThan(tableClosedHalf);
  expect(sofaClosedHalf).toBeGreaterThan(sofaClosedOff);
  expect(tableClosedHalf).toBeGreaterThan(tableClosedOff);
  await expect(scene).toHaveAttribute("data-ambient-intensity", "0.420");
  await page.locator(".room-stage").screenshot({ path: "output/playwright/lighting-day-curtain-0-lamp-100.png", animations: "disabled" });

  await setRange(brightness, 0);
  await page.getByRole("button", { name: "切換至夜晚模式" }).click();
  await expect(scene).toHaveAttribute("data-ambient-intensity", "0.050");
  await expect(page.getByTestId("daylight-spill")).toHaveCSS("opacity", "0");
  await expect(page.getByTestId("moonlight-spill")).toHaveCSS("opacity", "0");
  await expect(page.getByTestId("lamp-lit-room")).toHaveCSS("opacity", "0");
  await page.locator(".room-stage").screenshot({ path: "output/playwright/lighting-night-curtain-0-off.png", animations: "disabled" });

  for (const [preset, light, open] of [["回家", 80, 100], ["觀影", 20, 0], ["睡眠", 0, 0], ["離家", 0, 0]] as const) {
    await page.locator(".scene-presets button").filter({ hasText: preset }).click();
    await expect(brightness).toHaveValue(String(light));
    await expect(curtain).toHaveValue(String(open));
    await expect.poll(async () => Number(await page.getByTestId("lamp-lit-room").evaluate((element) =>
      getComputedStyle(element).opacity,
    ))).toBeCloseTo(lampIntensityAt(light), 2);
    await expect(scene).toHaveAttribute("data-ambient-intensity", (0.05 + 0.17 * open / 100).toFixed(3));
  }
});

test("客廳場景、室內溫度與趨勢都在裝置控制", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "裝置總覽" })).toHaveCount(0);
  await expect(page.getByText("日照示意")).toHaveCount(0);
  await expect(page.locator(".room-stage")).toBeVisible();
  await expect(page.getByTestId("living-room-scene")).toBeVisible();
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
  await expect(page.locator("#living-brightness")).toHaveValue("20");
  await expect(page.locator("#living-curtain-position")).toHaveValue("0");
  await expect(page.locator(".toast")).toHaveCount(0);
  await expect(page.getByRole("slider", { name: "目標溫度" })).toHaveAttribute(
    "aria-valuenow",
    "24",
  );
  await page.reload();
  await expect(page.locator("#living-brightness")).toHaveValue("20");
  await expect(
    page.locator(".scene-presets button").filter({ hasText: "觀影" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .locator(".scene-presets button")
    .filter({ hasText: "睡眠" })
    .click();
  await expect(page.locator("#living-brightness")).toHaveValue("0");
  await expect(page.locator(".toast")).toHaveCount(0);
});

test("舊情境數值留在本機時保留設備設定並取消錯誤的選取狀態", async ({ page }) => {
  await page.locator(".scene-presets button").filter({ hasText: "觀影" }).click();
  await page.evaluate(() => {
    const key = "mellow-living-room-v2";
    const saved = JSON.parse(localStorage.getItem(key)!);
    saved.lamp.brightness = 12;
    localStorage.setItem(key, JSON.stringify(saved));
  });
  await page.reload();
  await expect(page.locator("#living-brightness")).toHaveValue("12");
  await expect(page.locator(".scene-presets button").filter({ hasText: "觀影" }))
    .toHaveAttribute("aria-pressed", "false");
  await page.locator(".scene-presets button").filter({ hasText: "觀影" }).click();
  await expect(page.locator("#living-brightness")).toHaveValue("20");
});

test("情境切換保留手動日夜主題", async ({ page }) => {
  await page.getByRole("button", { name: "切換至夜晚模式" }).click();
  await page.locator(".scene-presets button").filter({ hasText: "觀影" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("#living-brightness")).toHaveValue("20");
  await expect(page.getByTestId("moonlight-spill")).toHaveCSS("opacity", "0");
  await page.getByRole("button", { name: "切換至白天模式" }).click();
  await expect(page.locator("#living-brightness")).toHaveValue("20");
  await page.locator(".scene-presets button").filter({ hasText: "回家" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByTestId("daylight-spill")).toHaveCSS("opacity", "0.82");
});

test("觀影保有局部吊燈暖光，睡眠關閉主燈且與日夜主題獨立", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const presets = page.locator(".scene-presets button");
  const lamp = page.getByTestId("lamp-lit-room");
  const sofa = page.getByTestId("sofa-surface-light");
  const brightness = page.locator("#living-brightness");
  const curtain = page.locator("#living-curtain-position");
  const power = page.getByRole("switch", { name: "吊燈電源" });
  await expect(presets.filter({ hasText: "回家" })).toContainText("燈光 80%・窗簾 100%");
  await expect(presets.filter({ hasText: "觀影" })).toContainText("燈光 20%・窗簾 0%");
  await expect(presets.filter({ hasText: "睡眠" })).toContainText("主燈 0%・窗簾 0%");
  await expect(page.getByText("夜燈 5%")).toHaveCount(0);
  await page.locator(".room-stage").screenshot({ path: "output/playwright/scene-home-light-390.png", animations: "disabled" });

  for (const theme of ["light", "dark"] as const) {
    if (theme === "dark") await page.getByRole("button", { name: "切換至夜晚模式" }).click();
    await presets.filter({ hasText: "觀影" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(brightness).toHaveValue("20");
    await expect(curtain).toHaveValue("0");
    await expect(power).toHaveAttribute("aria-checked", "true");
    await expect.poll(async () => Number(await lamp.evaluate((element) => getComputedStyle(element).opacity)))
      .toBeCloseTo(lampIntensityAt(20), 2);
    const movieSofa = await sofa.getAttribute("stop-color");
    await page.locator(".room-stage").screenshot({ path: `output/playwright/scene-movie-${theme}-390.png`, animations: "disabled" });

    await presets.filter({ hasText: "睡眠" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(brightness).toHaveValue("0");
    await expect(curtain).toHaveValue("0");
    await expect(power).toHaveAttribute("aria-checked", "false");
    await expect(lamp).toHaveCSS("opacity", "0");
    await expect(sofa).not.toHaveAttribute("stop-color", movieSofa!);
    await page.locator(".room-stage").screenshot({ path: `output/playwright/scene-sleep-${theme}-390.png`, animations: "disabled" });
  }

  await presets.filter({ hasText: "離家" }).click();
  await expect(lamp).toHaveCSS("opacity", "0");
  await expect(power).toHaveAttribute("aria-checked", "false");
  await page.locator(".room-stage").screenshot({ path: "output/playwright/scene-away-dark-390.png", animations: "disabled" });
  await brightness.evaluate((input) => {
    (input as HTMLInputElement).value = "45";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(brightness).toHaveValue("45");
  await expect(presets.filter({ hasText: "離家" })).toHaveAttribute("aria-pressed", "false");
  await curtain.evaluate((input) => {
    (input as HTMLInputElement).value = "50";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(curtain).toHaveValue("50");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("吊燈開關與亮度使用同一狀態，情境和主題不會造成矛盾", async ({ page }) => {
  const slider = page.locator("#living-brightness");
  const power = page.getByRole("switch", { name: "吊燈電源" });
  const setBrightness = async (value: number) => {
    await slider.evaluate((input, next) => {
      (input as HTMLInputElement).value = String(next);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, value);
    await expect(slider).toHaveValue(String(value));
    await expect(power).toHaveAttribute("aria-checked", String(value > 0));
  };

  await setBrightness(0);
  await expect(page.getByTestId("pendant-emitter")).toHaveCSS("opacity", "0");
  await power.click();
  await expect(slider).toHaveValue("1");
  await expect(power).toHaveAttribute("aria-checked", "true");
  await power.click();
  await expect(slider).toHaveValue("0");
  await expect(power).toHaveAttribute("aria-checked", "false");
  await setBrightness(50);
  await setBrightness(0);
  await page.getByRole("button", { name: "切換至夜晚模式" }).click();
  await expect(slider).toHaveValue("0");
  await expect(power).toHaveAttribute("aria-checked", "false");

  for (const [scene, value] of [["回家", 80], ["觀影", 20], ["睡眠", 0], ["離家", 0]] as const) {
    await page.locator(".scene-presets button").filter({ hasText: scene }).click();
    await expect(slider).toHaveValue(String(value));
    await expect(power).toHaveAttribute("aria-checked", String(value > 0));
  }
  await page.reload();
  await expect(slider).toHaveValue("0");
  await expect(power).toHaveAttribute("aria-checked", "false");
});

test("舊版關燈資料載入時會將亮度歸零", async ({ page }) => {
  await page.locator("#living-brightness").evaluate((input) => {
    (input as HTMLInputElement).value = "50";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect.poll(() => page.evaluate(() => localStorage.getItem("mellow-living-room-v2"))).not.toBeNull();
  await page.evaluate(() => {
    const key = "mellow-living-room-v2";
    const saved = JSON.parse(localStorage.getItem(key) ?? "null");
    saved.lamp = { ...saved.lamp, on: false, brightness: 80 };
    localStorage.setItem(key, JSON.stringify(saved));
  });
  await page.reload();
  await expect(page.locator("#living-brightness")).toHaveValue("0");
  await expect(page.getByRole("switch", { name: "吊燈電源" })).toHaveAttribute("aria-checked", "false");
});

test("燈光與窗簾滑桿會改變場景並保存", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "切換至夜晚模式" }).click();
  await page.locator("#living-brightness").focus();
  await page.keyboard.press("Home");
  await expect(page.locator("#living-brightness")).toHaveValue("0");
  await expect(page.getByTestId("lamp-lit-room")).toHaveCSS("opacity", "0");
  await expect(page.getByTestId("room-night-shade")).toHaveCount(0);
  await expect(page.getByTestId("living-room-scene")).toHaveAttribute("data-ambient-intensity", "0.220");
  await page.getByRole("switch", { name: "吊燈電源" }).click();
  await expect(page.locator("#living-brightness")).toHaveValue("1");
  await page.locator("#living-color-temp").focus();
  await page.keyboard.press("End");
  await expect(page.locator("#living-color-temp")).toHaveValue("6500");
  await page.locator("#living-curtain-position").focus();
  await page.keyboard.press("Home");
  await expect(page.getByTestId("moonlight-spill")).toHaveCSS("opacity", "0");
  expect(Number(await page.getByTestId("curtain-panel-left").getAttribute("width"))).toBe(83);
  await page.locator(".room-stage").screenshot({ path: "output/playwright/room-closed-390.png" });
  await page.locator("#living-brightness").focus();
  await page.keyboard.press("End");
  await expect(page.getByTestId("lamp-lit-room")).toHaveCSS("opacity", "1");
  await expect(page.getByTestId("living-room-scene")).toHaveAttribute("data-ambient-intensity", "0.050");
  await expect(page.getByTestId("lamp-halo-color")).toHaveAttribute("stop-color", "rgb(221 241 247)");
  await expect(page.locator(".room-stage")).not.toHaveAttribute("style", /stage-glow/);
  await page.locator(".room-stage").screenshot({ path: "output/playwright/room-closed-lit-390.png" });
  await page.locator("#living-curtain-position").focus();
  await page.keyboard.press("End");
  expect(Number(await page.getByTestId("curtain-panel-left").getAttribute("width"))).toBe(9);
  await expect(page.getByTestId("moonlight-spill")).toHaveCSS("opacity", "0.38");
  await page.locator("#living-brightness").focus();
  await page.keyboard.press("Home");
  await expect(page.getByTestId("moonlight-spill")).toHaveCSS("opacity", "0.38");
  await page.locator(".room-stage").screenshot({ path: "output/playwright/room-open-dark-390.png" });
  await page.keyboard.press("End");
  await expect(page.getByTestId("lamp-lit-room")).toHaveCSS("opacity", "1");
  await page.locator(".room-stage").screenshot({ path: "output/playwright/room-lit-390.png" });
  await page.reload();
  await expect(page.locator("#living-color-temp")).toHaveValue("6500");
  await expect(page.locator("#living-curtain-position")).toHaveValue("100");
});

test("日夜與吊燈四種光照在手機及桌機可區分", async ({ page }) => {
  const brightness = page.locator("#living-brightness");
  const curtain = page.locator("#living-curtain-position");
  const setRange = async (selector: typeof brightness, value: number) => {
    await selector.evaluate((input, next) => {
      (input as HTMLInputElement).value = String(next);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, value);
  };
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    if (await page.locator("html").getAttribute("data-theme") === "dark") {
      await page.getByRole("button", { name: "切換至白天模式" }).click();
    }
    await setRange(curtain, 100);
    await setRange(brightness, 0);
    await expect(page.getByTestId("daylight-spill")).toHaveCSS("opacity", "0.82");
    await expect(page.getByTestId("wall-daylight")).toHaveCSS("opacity", "0.82");
    await expect(page.getByTestId("wall-moonlight")).toHaveCSS("opacity", "0");
    await expect(page.getByTestId("pendant-emitter")).toHaveCSS("opacity", "0");
    await page.locator(".room-stage").screenshot({ path: `output/playwright/light-day-off-${width}.png`, animations: "disabled" });

    await setRange(brightness, 80);
    await expect(page.getByTestId("lamp-lit-room")).not.toHaveCSS("opacity", "0");
    await expect(page.getByTestId("daylight-spill")).toHaveCSS("opacity", "0.82");
    await expect(page.getByTestId("wall-daylight")).toHaveCSS("opacity", "0.82");
    await page.locator(".room-stage").screenshot({ path: `output/playwright/light-day-on-${width}.png`, animations: "disabled" });

    await page.getByRole("button", { name: "切換至夜晚模式" }).click();
    await setRange(brightness, 0);
    await expect(page.getByTestId("daylight-spill")).toHaveCSS("opacity", "0");
    await expect(page.getByTestId("wall-daylight")).toHaveCSS("opacity", "0");
    await expect(page.getByTestId("moonlight-spill")).toHaveCSS("opacity", "0.38");
    await expect(page.getByTestId("wall-moonlight")).toHaveCSS("opacity", "0.38");
    await expect(page.getByTestId("pendant-emitter")).toHaveCSS("opacity", "0");
    await page.locator(".room-stage").screenshot({ path: `output/playwright/light-night-off-${width}.png`, animations: "disabled" });

    await setRange(brightness, 80);
    await expect(page.getByTestId("moonlight-spill")).toHaveCSS("opacity", "0.38");
    await expect(page.getByTestId("wall-moonlight")).toHaveCSS("opacity", "0.38");
    await page.locator(".room-stage").screenshot({ path: `output/playwright/light-night-on-${width}.png`, animations: "disabled" });
  }
});

test("亮度連續調整只改變人工光，不改變月光", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "切換至夜晚模式" }).click();
  const brightness = page.locator("#living-brightness");
  await expect(page.getByTestId("moonlight-spill")).toHaveCSS("opacity", "0.38");
  const moonlightBefore = await page.getByTestId("moonlight-spill").evaluate((element) =>
    getComputedStyle(element).opacity,
  );
  for (const value of [0, 1, 25, 50, 75, 100]) {
    await brightness.evaluate((input, next) => {
      (input as HTMLInputElement).value = String(next);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, value);
    await expect(brightness).toHaveValue(String(value));
    await expect.poll(async () => Number(await page.getByTestId("lamp-lit-room").evaluate((element) =>
      getComputedStyle(element).opacity,
    ))).toBeCloseTo(lampIntensityAt(value), 2);
    await expect(page.getByTestId("moonlight-spill")).toHaveCSS("opacity", moonlightBefore);
    if ([1, 50, 100].includes(value)) {
      await page.locator(".room-stage").screenshot({ path: `output/playwright/light-night-${value}-390.png`, animations: "disabled" });
    }
  }
});

test("四個情境不跳通知，離家同步關燈與空調", async ({ page }) => {
  const shortcuts = page.locator(".scene-presets button");
  await expect(shortcuts).toHaveCount(4);
  for (const name of ["觀影", "睡眠", "離家", "回家"]) {
    await shortcuts.filter({ hasText: name }).click();
    await expect(page.locator(".toast")).toHaveCount(0);
  }
  await shortcuts.filter({ hasText: "離家" }).click();
  await expect(page.getByRole("switch", { name: "吊燈電源" })).toHaveAttribute("aria-checked", "false");
  await expect(page.getByRole("button", { name: "開啟空調" })).toBeVisible();
  await expect(page.locator("#living-curtain-position")).toHaveValue("0");
  await shortcuts.filter({ hasText: "回家" }).click();
  await expect(page.getByRole("switch", { name: "吊燈電源" })).toHaveAttribute("aria-checked", "true");
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
    page.getByRole("switch", { name: "吊燈電源" }),
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

const viewports = [
  { width: 360, height: 800 },
  { width: 375, height: 900 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 820, height: 1180 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
];

for (const { width, height } of viewports) {
  test(`${width}×${height} 版面與排程面板無水平溢出`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await expect(page.getByRole("heading", { name: "客廳" })).toBeVisible();
    await expect(page.locator(".room-stage")).toBeVisible();
    await expect(page.getByRole("button", { name: "開啟鬧鐘與排程" })).toBeVisible();
    const brand = await page.locator(".living-brand").boundingBox();
    const theme = await page.locator(".theme-toggle").boundingBox();
    const alarm = await page.locator(".alarm-trigger").boundingBox();
    const clock = await page.locator(".living-header time").boundingBox();
    expect(brand!.x + brand!.width).toBeLessThan(theme!.x);
    expect(theme!.width).toBeGreaterThanOrEqual(44);
    expect(alarm!.width).toBeGreaterThanOrEqual(44);
    expect(clock!.x + clock!.width).toBeLessThanOrEqual(width);
    const columns = await page.locator(".scene-presets").evaluate((element) =>
      getComputedStyle(element).gridTemplateColumns.split(" ").length,
    );
    expect(columns).toBe(width <= 700 ? 2 : 4);
    const clippedCards = await page.locator(".scene-presets button").evaluateAll((cards) =>
      cards.some((card) => card.scrollHeight > card.clientHeight + 1),
    );
    expect(clippedCards).toBe(false);
    const lightOutput = await page.locator("#light-control output").boundingBox();
    const lightSwitch = await page.getByRole("switch", { name: "吊燈電源" }).boundingBox();
    expect(lightOutput!.x + lightOutput!.width).toBeLessThanOrEqual(lightSwitch!.x);
    for (const slider of ["#living-brightness", "#living-color-temp", "#living-curtain-position"]) {
      const box = await page.locator(slider).boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    const frame = await page.locator(".living-page").boundingBox();
    expect(frame).not.toBeNull();
    expect(frame!.x).toBeGreaterThan(0);
    expect(frame!.width).toBeLessThan(width);
    await expect(
      page.getByRole("heading", { name: "24 小時環境趨勢" }),
    ).toBeVisible();
    if (width <= 430) {
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
    if ([1440, 1024, 820, 768, 430, 390, 360].includes(width)) {
      await page.getByRole("button", { name: "切換至夜晚模式" }).click();
      await expect(page.getByTestId("day-window")).toHaveCSS("opacity", "0");
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
      await page.screenshot({ path: `output/playwright/overview-dark-${width}.png`, fullPage: true });
      await page.getByRole("button", { name: "切換至白天模式" }).click();
      await expect(page.getByTestId("day-window")).toHaveCSS("opacity", "1");
    }
    if (width <= 1024) {
      await page.getByRole("button", { name: "開啟鬧鐘與排程" }).click();
      await expect(page.getByRole("dialog", { name: "鬧鐘與排程" })).toBeVisible();
      await expect(page.locator(".alarm-sheet-panel")).toHaveCSS("transform", "none");
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
      await page.screenshot({ path: `output/playwright/alarm-${width}.png` });
      if (width <= 430) {
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
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });
}

for (const { width, height } of viewports.filter(({ width }) => width !== 375)) {
  test(`${width}×${height} 拖曳時間後顯示與儲存一致`, async ({ browser }) => {
    const hasTouch = width < 1440;
    const context = await browser.newContext({ viewport: { width, height }, hasTouch, isMobile: hasTouch });
    try {
      const page = await context.newPage();
      await page.goto(base);
      await page.getByRole("button", { name: "開啟鬧鐘與排程" }).click();
      await page.getByRole("button", { name: /早安排程時間 07:00/ }).click();
      await expect(page.locator(".time-sheet-panel:not(.alarm-sheet-panel)")).toHaveCSS("transform", "none");
      const dragWheel = async (label: string, distance: number, initial: string) => {
        const wheel = page.getByRole("listbox", { name: label });
        await expect(wheel).toHaveCSS("touch-action", "none");
        await wheel.scrollIntoViewIfNeeded();
        const box = await wheel.boundingBox();
        const x = box!.x + box!.width / 2;
        const y = box!.y + box!.height / 2;
        if (hasTouch) {
          const session = await context.newCDPSession(page);
          await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] });
          for (let step = 1; step <= 8; step++) {
            await session.send("Input.dispatchTouchEvent", {
              type: "touchMove",
              touchPoints: [{ x, y: y + distance * step / 8, id: 1 }],
            });
            if (step === 4) {
              await expect.poll(() => wheel.locator('[aria-selected="true"]').textContent()).not.toBe(initial);
            }
          }
          await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        } else {
          await page.mouse.move(x, y);
          await page.mouse.down();
          await page.mouse.move(x, y + distance, { steps: 8 });
          await page.mouse.up();
        }
        const selected = (await wheel.locator('[aria-selected="true"]').textContent())?.trim();
        expect(selected).not.toBe(initial);
        return selected;
      };
      const minute = await dragWheel("早安排程分鐘", -88, "00");
      const hour = await dragWheel("早安排程小時", 88, "07");
      expect(Number(minute)).toBeGreaterThan(0);
      expect(Number(hour)).toBeLessThan(7);
      await page.getByRole("button", { name: "確定" }).click();
      await expect(page.getByRole("button", { name: new RegExp(`早安排程時間 ${hour}:${minute}`) })).toBeVisible();
      await expect.poll(() => page.evaluate(() => {
        const saved = localStorage.getItem("mellow-living-room-v2");
        return saved ? JSON.parse(saved).routines.find((item: { id: string }) => item.id === "morning")?.time : null;
      })).toBe(`${hour}:${minute}`);
      await page.getByRole("button", { name: "關閉鬧鐘" }).click();
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    } finally {
      await context.close();
    }
  });
}
