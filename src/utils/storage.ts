import type {
  LivingState,
  Routine,
  RoutineId,
  SceneId,
} from "../types";
import { initialState } from "../data/mock";

const STORAGE_KEY = "mellow-living-room-v2";
const LEGACY_KEY = "smart-living-v1";
const sceneIds: SceneId[] = ["home", "movie", "sleep", "away"];
const routineIds: RoutineId[] = ["morning", "night"];
const clamp = (value: number, min: number, max: number) =>
  Math.round(Math.max(min, Math.min(max, value)));
const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

function validate(value: unknown): LivingState | null {
  if (
    !isRecord(value) ||
    !isRecord(value.lamp) ||
    !isRecord(value.curtain) ||
    !isRecord(value.climate)
  )
    return null;
  const { lamp, curtain, climate } = value;
  if (typeof lamp.on !== "boolean" || typeof climate.on !== "boolean")
    return null;
  if (
    ![lamp.brightness, lamp.colorTemp, curtain.position, climate.target].every(
      (item) => typeof item === "number" && Number.isFinite(item),
    )
  )
    return null;
  const extras = isRecord(value.extras) ? value.extras : {};
  const routines: Routine[] = initialState.routines.map((fallback) => {
    const saved = Array.isArray(value.routines)
      ? value.routines.find((item) => isRecord(item) && item.id === fallback.id)
      : null;
    if (!isRecord(saved) || !routineIds.includes(saved.id as RoutineId))
      return { ...fallback };
    return {
      id: fallback.id,
      time:
        typeof saved.time === "string" &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(saved.time)
          ? saved.time
          : fallback.time,
      enabled:
        typeof saved.enabled === "boolean" ? saved.enabled : fallback.enabled,
      lastRunDay:
        typeof saved.lastRunDay === "string" ? saved.lastRunDay : null,
    };
  });
  return {
    lamp: {
      on: lamp.on,
      brightness: clamp(lamp.brightness as number, 0, 100),
      colorTemp: clamp(lamp.colorTemp as number, 2700, 6500),
    },
    curtain: { position: clamp(curtain.position as number, 0, 100) },
    climate: {
      on: climate.on,
      target: clamp(climate.target as number, 16, 30),
    },
    extras: {
      plug:
        typeof extras.plug === "boolean"
          ? extras.plug
          : initialState.extras.plug,
      tv: typeof extras.tv === "boolean" ? extras.tv : initialState.extras.tv,
      speaker:
        typeof extras.speaker === "boolean"
          ? extras.speaker
          : initialState.extras.speaker,
      vacuum:
        typeof extras.vacuum === "boolean"
          ? extras.vacuum
          : initialState.extras.vacuum,
    },
    activeSceneId: sceneIds.includes(value.activeSceneId as SceneId)
      ? (value.activeSceneId as SceneId)
      : null,
    routines,
  };
}

function migrateLegacy(): LivingState | null {
  try {
    const saved = JSON.parse(localStorage.getItem(LEGACY_KEY) ?? "null") as {
      devices?: Array<Record<string, unknown>>;
    } | null;
    const find = (id: string) =>
      saved?.devices?.find((device) => device.id === id);
    const light = find("living-light"),
      curtain = find("living-curtain"),
      climate = find("living-ac");
    if (!light || !curtain || !climate) return null;
    return validate({
      lamp: {
        on: light.on,
        brightness: light.brightness,
        colorTemp: light.colorTemp,
      },
      curtain: { position: curtain.position },
      climate: { on: climate.on, target: climate.temperature },
      activeSceneId: null,
    });
  } catch {
    return null;
  }
}

export function loadState(): LivingState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (
      (saved ? validate(JSON.parse(saved)) : migrateLegacy()) ??
      structuredClone(initialState)
    );
  } catch {
    return structuredClone(initialState);
  }
}

export function saveState(value: LivingState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
