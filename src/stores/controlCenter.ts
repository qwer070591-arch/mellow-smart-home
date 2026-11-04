import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { roomDetails, roomIds, sceneIds, scenePresets, useDashboardStore, type RoomId, type SceneId } from './dashboard'

export type ScheduleAction = 'lighting' | 'curtain' | 'climate' | 'scene'
export interface Schedule {
  id: string
  room: RoomId
  action: ScheduleAction
  value: number
  scene?: SceneId
  time: string
  enabled: boolean
  lastRunDay: string | null
}
interface Notice { id: string; message: string; createdAt: string; read: boolean }
interface CenterState {
  name: string
  securityMode: 'home' | 'away'
  doorLocked: boolean
  notifications: Notice[]
  schedules: Schedule[]
  musicVolume: number
}

const KEY = 'mellow-control-center-v1'
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/
const number = (value: unknown, fallback: number, min: number, max: number) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, Math.round(value))) : fallback
const isRoom = (value: unknown): value is RoomId => roomIds.includes(value as RoomId)
const isAction = (value: unknown): value is ScheduleAction => ['lighting', 'curtain', 'climate', 'scene'].includes(String(value))
const isScene = (value: unknown): value is SceneId => sceneIds.includes(value as SceneId)
const actionLabel: Record<ScheduleAction, string> = { lighting: '燈光', curtain: '窗簾', climate: '目標溫度', scene: '氛圍' }
const defaults = (): CenterState => ({
  name: '我的家', securityMode: 'home', doorLocked: true,
  notifications: [{ id: 'welcome', message: '智慧生活示範已就緒，設備狀態皆為模擬資料。', createdAt: new Date().toISOString(), read: false }],
  schedules: [], musicVolume: 45,
})

function load(): CenterState {
  const value = defaults()
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return value
    const data = raw as Partial<CenterState>
    if (typeof data.name === 'string') value.name = data.name.trim().slice(0, 32) || value.name
    if (data.securityMode === 'home' || data.securityMode === 'away') value.securityMode = data.securityMode
    if (typeof data.doorLocked === 'boolean') value.doorLocked = data.doorLocked
    value.musicVolume = number(data.musicVolume, 45, 0, 100)
    if (Array.isArray(data.notifications)) value.notifications = data.notifications.filter((n): n is Notice =>
      !!n && typeof n.id === 'string' && typeof n.message === 'string' && typeof n.createdAt === 'string' && typeof n.read === 'boolean').slice(0, 40)
    if (Array.isArray(data.schedules)) value.schedules = data.schedules.filter((s): s is Schedule =>
      !!s && typeof s.id === 'string' && isRoom(s.room) && isAction(s.action) &&
      typeof s.time === 'string' && timePattern.test(s.time) && typeof s.value === 'number' &&
      (s.action !== 'scene' || isScene(s.scene)) &&
      typeof s.enabled === 'boolean').slice(0, 30).map(s => ({
        ...s, value: number(s.value, 0, s.action === 'climate' ? 16 : 0, s.action === 'climate' ? 30 : 100),
        lastRunDay: typeof s.lastRunDay === 'string' ? s.lastRunDay : null,
      }))
  } catch { /* 損壞的儲存資料回退至示範預設值。 */ }
  return value
}

export const useControlCenterStore = defineStore('controlCenter', () => {
  const state = ref(load())
  const storageError = ref(false)
  const unreadCount = computed(() => state.value.notifications.filter(n => !n.read).length)
  const dashboard = useDashboardStore()

  function notify(message: string) {
    state.value.notifications.unshift({ id: crypto.randomUUID(), message, createdAt: new Date().toISOString(), read: false })
    state.value.notifications = state.value.notifications.slice(0, 40)
  }
  function setName(name: string) { state.value.name = name.trim().slice(0, 32) || '我的家' }
  function setVolume(value: number) { state.value.musicVolume = number(value, state.value.musicVolume, 0, 100) }
  function setSecurityMode(mode: 'home' | 'away') {
    state.value.securityMode = mode
    if (mode === 'away') state.value.doorLocked = true
    notify(mode === 'away' ? '已切換離家安全模式並鎖上示範門鎖。' : '已切換在家安全模式。')
  }
  function setDoorLocked(locked: boolean) {
    state.value.doorLocked = locked
    notify(locked ? '示範門鎖已上鎖。' : '示範門鎖已解鎖。')
  }
  function markRead(id: string) { const item = state.value.notifications.find(n => n.id === id); if (item) item.read = true }
  function markAllRead() { state.value.notifications.forEach(n => { n.read = true }) }
  function clearNotifications() { state.value.notifications = [] }
  function saveSchedule(input: Omit<Schedule, 'id' | 'lastRunDay'>, id?: string): boolean {
    if (!isRoom(input.room) || !isAction(input.action) || !timePattern.test(input.time) ||
      (input.action === 'scene' && !isScene(input.scene)) ||
      !Number.isFinite(input.value) || input.value < (input.action === 'climate' ? 16 : 0) ||
      input.value > (input.action === 'climate' ? 30 : 100)) return false
    const next: Schedule = { ...input, value: Math.round(input.value), id: id ?? crypto.randomUUID(), lastRunDay: null }
    const index = state.value.schedules.findIndex(s => s.id === id)
    if (index >= 0) state.value.schedules[index] = next
    else if (state.value.schedules.length < 30) state.value.schedules.push(next)
    else return false
    return true
  }
  function removeSchedule(id: string) { state.value.schedules = state.value.schedules.filter(s => s.id !== id) }
  function toggleSchedule(id: string) { const item = state.value.schedules.find(s => s.id === id); if (item) item.enabled = !item.enabled }
  function executeSchedule(schedule: Schedule) {
    if (schedule.action === 'scene' && schedule.scene) dashboard.applyScene(schedule.room, schedule.scene)
    else if (schedule.action !== 'scene') dashboard.setRoomDevice(schedule.room, schedule.action, schedule.value)
    const result = schedule.action === 'scene' && schedule.scene ? scenePresets[schedule.scene].label : `${schedule.value}${schedule.action === 'climate' ? '°C' : '%'}`
    notify(`${roomDetails[schedule.room].name}的${actionLabel[schedule.action]}排程已執行：${result}。`)
  }
  function runSchedule(id: string) { const item = state.value.schedules.find(s => s.id === id); if (item) executeSchedule(item) }
  function checkSchedules(now = new Date()) {
    const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
    const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Taipei', hour: '2-digit', minute: '2-digit', hour12: false }).format(now)
    for (const item of state.value.schedules) if (item.enabled && item.time === time && item.lastRunDay !== today) {
      item.lastRunDay = today
      executeSchedule(item)
    }
  }
  function reset() { state.value = defaults() }

  watch(state, value => {
    try { localStorage.setItem(KEY, JSON.stringify(value)); storageError.value = false }
    catch { storageError.value = true }
  }, { deep: true })
  return { state, unreadCount, storageError, notify, setName, setVolume, setSecurityMode, setDoorLocked,
    markRead, markAllRead, clearNotifications, saveSchedule, removeSchedule, toggleSchedule, runSchedule, checkSchedules, reset }
})
