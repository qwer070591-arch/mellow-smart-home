export type SceneId = "home" | "movie" | "sleep" | "away";
export type RoutineId = "morning" | "night";

export interface LampState {
  on: boolean;
  brightness: number;
  colorTemp: number;
}

export interface CurtainState {
  position: number;
}

export interface ClimateState {
  on: boolean;
  target: number;
}

export interface ExtraDevices {
  plug: boolean;
  tv: boolean;
  speaker: boolean;
  vacuum: boolean;
}

export interface Routine {
  id: RoutineId;
  time: string;
  enabled: boolean;
  lastRunDay: string | null;
}

export interface LivingState {
  lamp: LampState;
  curtain: CurtainState;
  climate: ClimateState;
  extras: ExtraDevices;
  activeSceneId: SceneId | null;
  routines: Routine[];
}

export interface ScenePreset {
  id: SceneId;
  name: string;
  detail: string;
  lamp: LampState;
  curtain: CurtainState;
  climate: ClimateState;
  extras: ExtraDevices;
}
