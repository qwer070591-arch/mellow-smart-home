# mellow. 智慧生活

以 Vue 3 製作的智慧家庭互動展示。介面以手機和平板為主，提供夜景客廳、燈光與窗簾控制、室內溫度、氛圍切換及鬧鐘式排程。所有裝置與環境資料均為本機模擬。

## 安裝與啟動

需要 Node.js 與 npm。

```bash
npm ci
npm run dev
```

依終端機顯示的本機網址開啟頁面。製作正式版本使用 `npm run build`；可用 `npm run preview` 預覽建置結果。

## 功能

- 客廳燈光開關、亮度與色溫調整；照片會隨亮度呈現不同照明。
- 窗簾開度調整；全關、半開與全開場景間平滑切換。
- 可用滑鼠、觸控或鍵盤調整目標溫度。
- 「回家、觀影、睡眠、離家」氛圍控制會同步變更相關設備狀態。
- 頂部鬧鐘可設定早晚排程、啟停排程，使用滾輪選擇時間。
- 設備與排程狀態儲存在瀏覽器 LocalStorage，重新整理後保留。
- 24 小時溫濕度趨勢圖可切換檢視。

## 測試

```bash
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright 測試涵蓋主要控制、排程、狀態保存，以及平板與手機寬度。

## 展示限制

這是純前端示範，沒有後端、真實 IoT 設備或感測器。室溫、濕度、空氣品質及趨勢圖是固定模擬資料；調整目標溫度不會改變模擬室溫。排程只在網頁開啟時檢查與執行，關閉頁面後不會背景運作，也不會發出系統鬧鈴或手機推播。窗簾的中間開度是照片插值示意。

## 技術

Vue 3、Vite、TypeScript、Pinia、Vue Router、SCSS、Lucide Icons、LocalStorage、Playwright。
