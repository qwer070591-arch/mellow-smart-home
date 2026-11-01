import type { LivingState, ScenePreset } from "../types";

export const scenes: ScenePreset[] = [
  {
    id: "home",
    name: "回家",
    detail: "燈光 80%",
    lamp: { on: true, brightness: 80, colorTemp: 2700 },
    curtain: { position: 60 },
    climate: { on: true, target: 24 },
    extras: {
      plug: true,
      tv: false,
      speaker: false,
      vacuum: false,
    },
  },
  {
    id: "movie",
    name: "觀影",
    detail: "關簾・微光",
    lamp: { on: true, brightness: 12, colorTemp: 2700 },
    curtain: { position: 0 },
    climate: { on: true, target: 24 },
    extras: {
      plug: true,
      tv: true,
      speaker: true,
      vacuum: false,
    },
  },
  {
    id: "sleep",
    name: "睡眠",
    detail: "夜燈 5%",
    lamp: { on: true, brightness: 5, colorTemp: 2700 },
    curtain: { position: 0 },
    climate: { on: true, target: 26 },
    extras: {
      plug: false,
      tv: false,
      speaker: false,
      vacuum: false,
    },
  },
  {
    id: "away",
    name: "離家",
    detail: "關燈・開始清掃",
    lamp: { on: false, brightness: 0, colorTemp: 2700 },
    curtain: { position: 0 },
    climate: { on: false, target: 26 },
    extras: {
      plug: false,
      tv: false,
      speaker: false,
      vacuum: true,
    },
  },
];

export const initialState: LivingState = {
  lamp: { ...scenes[0]!.lamp },
  curtain: { ...scenes[0]!.curtain },
  climate: { ...scenes[0]!.climate },
  extras: { ...scenes[0]!.extras },
  activeSceneId: "home",
  routines: [
    { id: "morning", time: "07:00", enabled: false, lastRunDay: null },
    { id: "night", time: "23:00", enabled: false, lastRunDay: null },
  ],
};

export const environment = {
  temperature: 26.3,
  humidity: 48,
  airQuality: "優",
} as const;

// 固定示範資料；不代表真實感測器的歷史讀值。
export const environmentHistory = [
  { hour: "00", temperature: 27.1, humidity: 54 },
  { hour: "02", temperature: 26.7, humidity: 53 },
  { hour: "04", temperature: 26.3, humidity: 52 },
  { hour: "06", temperature: 26.0, humidity: 52 },
  { hour: "08", temperature: 26.5, humidity: 49 },
  { hour: "10", temperature: 27.2, humidity: 47 },
  { hour: "12", temperature: 27.8, humidity: 45 },
  { hour: "14", temperature: 28.1, humidity: 44 },
  { hour: "16", temperature: 27.7, humidity: 46 },
  { hour: "18", temperature: 27.0, humidity: 47 },
  { hour: "20", temperature: 26.7, humidity: 49 },
  { hour: "22", temperature: 26.4, humidity: 50 },
  { hour: "24", temperature: 26.3, humidity: 48 },
] as const;
