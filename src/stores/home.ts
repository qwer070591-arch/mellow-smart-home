import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { scenes } from "../data/mock";
import { loadState, saveState } from "../utils/storage";
import type { RoutineId, SceneId } from "../types";

const clamp = (value: number, min: number, max: number) =>
  Math.round(Math.max(min, Math.min(max, value)));

export const useHomeStore = defineStore("home", () => {
  const state = ref(loadState());
  const toast = ref("");
  const storageError = ref(false);
  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  function notify(message: string) {
    toast.value = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast.value = ""), 3000);
  }

  function setLamp(changes: {
    on?: boolean;
    brightness?: number;
    colorTemp?: number;
  }) {
    if (typeof changes.on === "boolean") state.value.lamp.on = changes.on;
    if (
      typeof changes.brightness === "number" &&
      Number.isFinite(changes.brightness)
    )
      state.value.lamp.brightness = clamp(changes.brightness, 0, 100);
    if (
      typeof changes.colorTemp === "number" &&
      Number.isFinite(changes.colorTemp)
    )
      state.value.lamp.colorTemp = clamp(changes.colorTemp, 2700, 6500);
    state.value.activeSceneId = null;
  }

  function setCurtain(position: number) {
    if (!Number.isFinite(position)) return;
    state.value.curtain.position = clamp(position, 0, 100);
    state.value.activeSceneId = null;
  }

  function setClimate(changes: { on?: boolean; target?: number }) {
    if (typeof changes.on === "boolean") state.value.climate.on = changes.on;
    if (typeof changes.target === "number" && Number.isFinite(changes.target))
      state.value.climate.target = clamp(changes.target, 16, 30);
    state.value.activeSceneId = null;
  }

  function runScene(id: SceneId) {
    const scene = scenes.find((item) => item.id === id);
    if (!scene) return;
    state.value.lamp = { ...scene.lamp };
    state.value.curtain = { ...scene.curtain };
    state.value.climate = { ...scene.climate };
    state.value.extras = { ...scene.extras };
    state.value.activeSceneId = id;
    toast.value = "";
    clearTimeout(toastTimer);
  }

  function updateRoutine(
    id: RoutineId,
    changes: { time?: string; enabled?: boolean },
  ) {
    const routine = state.value.routines.find((item) => item.id === id);
    if (!routine) return;
    if (
      typeof changes.time === "string" &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(changes.time)
    )
      routine.time = changes.time;
    if (typeof changes.enabled === "boolean") routine.enabled = changes.enabled;
  }

  function runRoutine(id: RoutineId) {
    runScene(id === "morning" ? "home" : "sleep");
    notify(id === "morning" ? "已執行早安排程" : "已執行晚安排程");
  }

  function checkRoutines(now = new Date()) {
    const localTime = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Taipei",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now);
    const localDay = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
    state.value.routines.forEach((routine) => {
      if (
        !routine.enabled ||
        routine.time !== localTime ||
        routine.lastRunDay === localDay
      )
        return;
      routine.lastRunDay = localDay;
      runRoutine(routine.id);
    });
  }

  watch(
    state,
    (value) => {
      storageError.value = !saveState(value);
    },
    { deep: true },
  );
  return {
    state,
    scenes,
    toast,
    storageError,
    setLamp,
    setCurtain,
    setClimate,
    runScene,
    updateRoutine,
    runRoutine,
    checkRoutines,
  };
});
