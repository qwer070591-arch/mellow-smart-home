import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'

export type RoomId = 'living' | 'bedroom' | 'kitchen'
export type SceneId = 'home' | 'movie' | 'sleep' | 'away'
export type DevicePanel = 'vacuum' | 'lighting' | 'climate' | 'curtain' | 'scene'

interface RoomDevices {
  brightness: number
  colorTemp: number
  curtain: number
  climateOn: boolean
  targetTemperature: number
}
interface DashboardState {
  selectedRoom: RoomId
  rooms: Record<RoomId, RoomDevices>
  vacuum: { running: boolean; battery: number; progress: number; nextCleaning: string }
}

export const roomDetails: Record<RoomId, { name: string; english: string; devices: number; curtainName: string; actualTemperature: number }> = {
  living: { name: '客廳', english: 'Living Room', devices: 4, curtainName: '雙開布簾', actualTemperature: 26.3 },
  bedroom: { name: '主臥', english: 'Master Bedroom', devices: 3, curtainName: '遮光布簾', actualTemperature: 24.8 },
  kitchen: { name: '廚房', english: 'Kitchen', devices: 2, curtainName: '捲簾', actualTemperature: 27.1 },
}
export const roomIds: RoomId[] = ['living', 'bedroom', 'kitchen']
export const scenePresets: Record<SceneId, { label: string; brightness: number; curtain: number; colorTemp: number; climateOn: boolean; targetTemperature: number }> = {
  home: { label: '回家', brightness: 80, curtain: 100, colorTemp: 3000, climateOn: true, targetTemperature: 24 },
  movie: { label: '觀影', brightness: 20, curtain: 0, colorTemp: 2700, climateOn: true, targetTemperature: 24 },
  sleep: { label: '睡眠', brightness: 0, curtain: 0, colorTemp: 2700, climateOn: true, targetTemperature: 26 },
  away: { label: '離家', brightness: 0, curtain: 0, colorTemp: 4000, climateOn: false, targetTemperature: 24 },
}
export const sceneIds = Object.keys(scenePresets) as SceneId[]

const STORAGE_KEY = 'mellow-dashboard-v1'
const clamp = (value: number, min: number, max: number) => Math.round(Math.max(min, Math.min(max, value)))
const finite = (value: unknown, fallback: number, min: number, max: number) =>
  typeof value === 'number' && Number.isFinite(value) ? clamp(value, min, max) : fallback
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)

const initial = (): DashboardState => ({
  selectedRoom: 'living',
  rooms: {
    living: { brightness: 80, colorTemp: 3000, curtain: 100, climateOn: true, targetTemperature: 24 },
    bedroom: { brightness: 45, colorTemp: 2700, curtain: 70, climateOn: true, targetTemperature: 23 },
    kitchen: { brightness: 65, colorTemp: 4000, curtain: 50, climateOn: false, targetTemperature: 24 },
  },
  vacuum: { running: false, battery: 82, progress: 38, nextCleaning: '10:00' },
})

function load(): DashboardState {
  const fallback = initial()
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as unknown
    if (!record(raw)) return fallback
    if (roomIds.includes(raw.selectedRoom as RoomId)) fallback.selectedRoom = raw.selectedRoom as RoomId
    if (record(raw.rooms)) for (const id of roomIds) {
      const saved = raw.rooms[id]
      if (!record(saved)) continue
      const room = fallback.rooms[id]
      room.brightness = finite(saved.brightness, room.brightness, 0, 100)
      room.colorTemp = finite(saved.colorTemp, room.colorTemp, 2700, 6500)
      room.curtain = finite(saved.curtain, room.curtain, 0, 100)
      room.targetTemperature = finite(saved.targetTemperature, room.targetTemperature, 16, 30)
      if (typeof saved.climateOn === 'boolean') room.climateOn = saved.climateOn
    }
    if (record(raw.vacuum)) {
      fallback.vacuum.battery = finite(raw.vacuum.battery, 82, 0, 100)
      fallback.vacuum.progress = finite(raw.vacuum.progress, 38, 0, 100)
      fallback.vacuum.running = raw.vacuum.running === true && fallback.vacuum.battery > 0 && fallback.vacuum.progress < 100
      if (typeof raw.vacuum.nextCleaning === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(raw.vacuum.nextCleaning)) fallback.vacuum.nextCleaning = raw.vacuum.nextCleaning
    }
  } catch { /* 無效或不可用的儲存資料使用預設值。 */ }
  return fallback
}

export const useDashboardStore = defineStore('dashboard', () => {
  const state = ref<DashboardState>(load())
  const storageError = ref(false)
  const room = computed(() => state.value.rooms[state.value.selectedRoom])
  const details = computed(() => roomDetails[state.value.selectedRoom])
  const activeScene = computed<SceneId | null>(() => {
    const current = room.value
    return sceneIds.find(id => {
      const preset = scenePresets[id]
      return current.brightness === preset.brightness && current.curtain === preset.curtain &&
        current.colorTemp === preset.colorTemp && current.climateOn === preset.climateOn &&
        (!preset.climateOn || current.targetTemperature === preset.targetTemperature)
    }) ?? null
  })

  function selectRoom(id: RoomId) { state.value.selectedRoom = id }
  function setBrightness(value: number) { if (Number.isFinite(value)) room.value.brightness = clamp(value, 0, 100) }
  function setColorTemp(value: number) { if (Number.isFinite(value)) room.value.colorTemp = clamp(value, 2700, 6500) }
  function toggleLight() { setBrightness(room.value.brightness ? 0 : 1) }
  function setCurtain(value: number) { if (Number.isFinite(value)) room.value.curtain = clamp(value, 0, 100) }
  function setClimate(changes: { on?: boolean; target?: number }) {
    if (typeof changes.on === 'boolean') room.value.climateOn = changes.on
    if (typeof changes.target === 'number' && Number.isFinite(changes.target)) room.value.targetTemperature = clamp(changes.target, 16, 30)
  }
  function setRoomDevice(id: RoomId, action: 'lighting' | 'curtain' | 'climate', value: number) {
    if (!roomIds.includes(id) || !Number.isFinite(value)) return
    const device = state.value.rooms[id]
    if (action === 'lighting') device.brightness = clamp(value, 0, 100)
    if (action === 'curtain') device.curtain = clamp(value, 0, 100)
    if (action === 'climate') { device.climateOn = true; device.targetTemperature = clamp(value, 16, 30) }
  }
  function applyScene(id: RoomId, scene: SceneId) {
    if (!roomIds.includes(id) || !sceneIds.includes(scene)) return
    const preset = scenePresets[scene]
    Object.assign(state.value.rooms[id], {
      brightness: preset.brightness, curtain: preset.curtain, colorTemp: preset.colorTemp,
      climateOn: preset.climateOn, targetTemperature: preset.targetTemperature,
    })
  }
  function applyLivingPreset(brightness: number, curtain: number, climateOn: boolean, targetTemperature: number) {
    const living = state.value.rooms.living
    living.brightness = clamp(brightness, 0, 100)
    living.curtain = clamp(curtain, 0, 100)
    living.climateOn = climateOn
    living.targetTemperature = clamp(targetTemperature, 16, 30)
  }
  function toggleVacuum() {
    if (state.value.vacuum.battery === 0 || state.value.vacuum.progress === 100) {
      state.value.vacuum.battery = Math.max(state.value.vacuum.battery, 20)
      state.value.vacuum.progress = 0
    }
    state.value.vacuum.running = !state.value.vacuum.running
  }
  function setVacuumTime(value: string) { if (/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) state.value.vacuum.nextCleaning = value }
  function reset() { state.value = initial() }
  function tickDemo() {
    const vacuum = state.value.vacuum
    if (vacuum.running) {
      vacuum.progress = Math.min(100, vacuum.progress + 1)
      if (vacuum.progress % 10 === 0) vacuum.battery = Math.max(0, vacuum.battery - 1)
      if (vacuum.progress === 100 || vacuum.battery === 0) vacuum.running = false
    }
  }
  watch(state, value => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); storageError.value = false }
    catch { storageError.value = true }
  }, { deep: true })
  return { state, room, details, activeScene, storageError, selectRoom, setBrightness, setColorTemp, toggleLight, setCurtain, setClimate, setRoomDevice, applyScene, applyLivingPreset, toggleVacuum, setVacuumTime, tickDemo, reset }
})
