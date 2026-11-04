<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { Droplets, Lightbulb, Thermometer } from '@lucide/vue'
import { roomDetails, roomIds, useDashboardStore, type RoomId } from '../stores/dashboard'
import livingPhoto from '../assets/rooms/living.webp'
import bedroomPhoto from '../assets/rooms/bedroom.webp'
import kitchenPhoto from '../assets/rooms/kitchen.webp'
import livingLightsOff from '../assets/rooms/living-lights-off.webp'
import bedroomLightsOff from '../assets/rooms/bedroom-lights-off.webp'
import kitchenLightsOff from '../assets/rooms/kitchen-lights-off.webp'
import livingClosed from '../assets/rooms/living-closed.webp'
import bedroomClosed from '../assets/rooms/bedroom-closed.webp'
import kitchenClosed from '../assets/rooms/kitchen-closed.webp'

const store = useDashboardStore()
const selectedRoomIndex = computed(() => roomIds.indexOf(store.state.selectedRoom))
function handleRoomTabKeydown(event: KeyboardEvent, id: RoomId) {
  const index = roomIds.indexOf(id)
  const next = event.key === 'ArrowRight' ? (index + 1) % roomIds.length
    : event.key === 'ArrowLeft' ? (index - 1 + roomIds.length) % roomIds.length
    : event.key === 'Home' ? 0 : event.key === 'End' ? roomIds.length - 1 : -1
  if (next < 0) return
  event.preventDefault()
  store.selectRoom(roomIds[next]!)
  const tabs = (event.currentTarget as HTMLButtonElement).parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
  tabs?.[next]?.focus()
}
const visualCurtain = ref(store.room.curtain)
let curtainFrame = 0
let previousFrameTime = 0

function stopCurtainMotion() {
  if (curtainFrame) cancelAnimationFrame(curtainFrame)
  curtainFrame = 0
  previousFrameTime = 0
}

function followCurtain(time: number) {
  const elapsed = previousFrameTime ? Math.min(time - previousFrameTime, 64) : 16
  previousFrameTime = time
  const target = store.room.curtain
  const distance = target - visualCurtain.value
  if (Math.abs(distance) < .08) {
    visualCurtain.value = target
    stopCurtainMotion()
    return
  }
  visualCurtain.value += distance * (1 - Math.exp(-elapsed / 48))
  curtainFrame = requestAnimationFrame(followCurtain)
}

watch(() => store.state.selectedRoom, () => {
  stopCurtainMotion()
  visualCurtain.value = store.room.curtain
}, { flush: 'sync' })

watch(() => store.room.curtain, target => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    stopCurtainMotion()
    visualCurtain.value = target
  } else if (!curtainFrame && visualCurtain.value !== target) {
    curtainFrame = requestAnimationFrame(followCurtain)
  }
}, { flush: 'sync' })
onUnmounted(stopCurtainMotion)
const photos: Record<RoomId, string> = { living: livingPhoto, bedroom: bedroomPhoto, kitchen: kitchenPhoto }
const lightsOffPhotos: Record<RoomId, string> = { living: livingLightsOff, bedroom: bedroomLightsOff, kitchen: kitchenLightsOff }
const closedPhotos: Record<RoomId, string> = { living: livingClosed, bedroom: bedroomClosed, kitchen: kitchenClosed }
const windowBounds: Record<RoomId, { left: number; center: number; right: number; top: number; bottom: number }> = {
  living: { left: 680, center: 1140, right: 1599, top: 85, bottom: 675 },
  bedroom: { left: 850, center: 1180, right: 1599, top: 35, bottom: 685 },
  kitchen: { left: 1110, center: 0, right: 1599, top: 0, bottom: 535 },
}
const bounds = computed(() => windowBounds[store.state.selectedRoom])
const closedFraction = computed(() => 1 - visualCurtain.value / 100)
const leftWidth = computed(() => (bounds.value.center - bounds.value.left) * closedFraction.value)
const rightWidth = computed(() => (bounds.value.right - bounds.value.center) * closedFraction.value)
const leftFeather = computed(() => Math.min(14, leftWidth.value) * visualCurtain.value / 100)
const rightFeather = computed(() => Math.min(14, rightWidth.value) * visualCurtain.value / 100)
const leftOuterFeather = computed(() => Math.min(58, leftWidth.value / 2))
const rightOuterFeather = computed(() => Math.min(42, rightWidth.value / 2))
// 廚房窗框上緣隨透視往右上方收斂，只裁出窗戶內的捲簾影像。
const kitchenClipPoints = computed(() => {
  const open = closedFraction.value
  return `1110,130 1599,0 1599,${535 * open} 1110,${130 + 405 * open}`
})
const warmth = computed(() => (store.room.colorTemp - 2700) / 3800)
const curtainStyle = computed(() => ({
  '--light-level': `${store.room.brightness / 100}`,
  '--fabric-exposure': `${.36 + store.room.brightness / 100 * .64}`,
  '--fabric-saturation': `${.7 + store.room.brightness / 100 * .3}`,
  '--lamp-glow': `${store.room.brightness / 100 * .22}`,
  '--lamp-r': `${Math.round(255 - warmth.value * 35)}`,
  '--lamp-g': `${Math.round(202 + warmth.value * 18)}`,
  '--lamp-b': `${Math.round(128 + warmth.value * 98)}`,
  '--moonlight': `${visualCurtain.value / 100 * .42}`,
  '--moon-reach': `${.45 + visualCurtain.value / 100 * .55}`,
}))
</script>

<template>
  <section class="room-viewer" :class="`room-viewer--${store.state.selectedRoom}`" :style="curtainStyle" aria-label="房間即時預覽">
    <img class="room-viewer__photo room-viewer__lights-off" :src="lightsOffPhotos[store.state.selectedRoom]"
      :alt="`${store.details.name}的夜間室內照片`" width="1599" height="900" decoding="async" />
    <img class="room-viewer__photo room-viewer__lights-on" :src="photos[store.state.selectedRoom]"
      alt="" width="1599" height="900" decoding="async" aria-hidden="true" />
    <div class="room-viewer__moonlight" aria-hidden="true"></div>
    <svg class="room-viewer__fabric" viewBox="0 0 1599 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="curtain-soft-left"><stop offset="0" stop-color="white" /><stop offset="1" stop-color="black" /></linearGradient>
        <linearGradient id="curtain-soft-right"><stop offset="0" stop-color="black" /><stop offset="1" stop-color="white" /></linearGradient>
        <linearGradient id="curtain-outer-left"><stop offset="0" stop-color="black" /><stop offset="1" stop-color="white" /></linearGradient>
        <linearGradient id="curtain-outer-right"><stop offset="0" stop-color="white" /><stop offset="1" stop-color="black" /></linearGradient>
        <linearGradient id="curtain-floor-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="white" /><stop offset="1" stop-color="black" /></linearGradient>
        <clipPath id="curtain-left"><rect :x="bounds.left" :y="bounds.top" :width="leftWidth" :height="bounds.bottom - bounds.top" /></clipPath>
        <clipPath id="curtain-right"><rect :x="bounds.right - rightWidth" :y="bounds.top" :width="rightWidth" :height="bounds.bottom - bounds.top" /></clipPath>
        <!-- 主臥的床鋪位於窗簾前方；只顯示窗後可見的布面，避免照片差異形成床上的矩形接縫。 -->
        <clipPath id="bedroom-curtain-occlusion"><path d="M 850 0 H 1599 V 685 H 1080 L 1060 626 L 1020 582 L 960 551 L 850 536 Z" /></clipPath>
        <clipPath id="curtain-kitchen"><polygon :points="kitchenClipPoints" /></clipPath>
        <mask id="curtain-left-feather" maskUnits="userSpaceOnUse" :x="bounds.left" :y="bounds.top" :width="leftWidth" :height="bounds.bottom - bounds.top"><rect :x="bounds.left" :y="bounds.top" :width="leftOuterFeather" :height="bounds.bottom - bounds.top" fill="url(#curtain-outer-left)" /><rect :x="bounds.left + leftOuterFeather" :y="bounds.top" :width="Math.max(0, leftWidth - leftOuterFeather - leftFeather)" :height="bounds.bottom - bounds.top" fill="white" /><rect :x="bounds.left + leftWidth - leftFeather" :y="bounds.top" :width="leftFeather" :height="bounds.bottom - bounds.top" fill="url(#curtain-soft-left)" /></mask>
        <mask id="curtain-right-feather" maskUnits="userSpaceOnUse" :x="bounds.right - rightWidth" :y="bounds.top" :width="rightWidth" :height="bounds.bottom - bounds.top"><rect :x="bounds.right - rightWidth" :y="bounds.top" :width="rightFeather" :height="bounds.bottom - bounds.top" fill="url(#curtain-soft-right)" /><rect :x="bounds.right - rightWidth + rightFeather" :y="bounds.top" :width="Math.max(0, rightWidth - rightOuterFeather - rightFeather)" :height="bounds.bottom - bounds.top" fill="white" /><rect :x="bounds.right - rightOuterFeather" :y="bounds.top" :width="rightOuterFeather" :height="bounds.bottom - bounds.top" fill="url(#curtain-outer-right)" /></mask>
        <mask id="curtain-floor-feather" maskUnits="userSpaceOnUse" x="0" :y="bounds.top" width="1599" :height="bounds.bottom - bounds.top"><rect x="0" :y="bounds.top" width="1599" :height="bounds.bottom - bounds.top - 48" fill="white" /><rect x="0" :y="bounds.bottom - 48" width="1599" height="48" fill="url(#curtain-floor-fade)" /></mask>
      </defs>
      <g mask="url(#curtain-floor-feather)">
        <template v-if="store.state.selectedRoom === 'kitchen'">
          <image class="room-viewer__fabric-image" :href="closedPhotos.kitchen" width="1599" height="900" clip-path="url(#curtain-kitchen)" />
        </template>
        <template v-else>
          <g :clip-path="store.state.selectedRoom === 'bedroom' ? 'url(#bedroom-curtain-occlusion)' : undefined">
            <image class="room-viewer__fabric-image" :href="closedPhotos[store.state.selectedRoom]" width="1599" height="900" clip-path="url(#curtain-left)" mask="url(#curtain-left-feather)" />
            <image class="room-viewer__fabric-image" :href="closedPhotos[store.state.selectedRoom]" width="1599" height="900" clip-path="url(#curtain-right)" mask="url(#curtain-right-feather)" />
          </g>
        </template>
      </g>
    </svg>
    <div class="room-viewer__shade" aria-hidden="true"></div>
    <div class="room-viewer__warmth" aria-hidden="true"></div>
    <div class="room-viewer__top">
      <div class="room-tabs" role="tablist" aria-label="切換房間" :style="{ '--room-index': selectedRoomIndex }">
        <button v-for="id in roomIds" :key="id" type="button" role="tab"
          :aria-selected="store.state.selectedRoom === id" :tabindex="store.state.selectedRoom === id ? 0 : -1"
          @click="store.selectRoom(id)" @keydown="handleRoomTabKeydown($event, id)"><span>{{ roomDetails[id].name }}</span></button>
      </div>
    </div>
    <div class="room-viewer__bottom">
      <div><h1>{{ store.details.name }}</h1></div>
      <div class="room-viewer__chips" aria-label="目前房間設備狀態">
        <span><Thermometer :size="15" />{{ store.room.targetTemperature }}°</span>
        <span><Droplets :size="15" />{{ store.room.curtain }}% 窗簾</span>
        <span><Lightbulb :size="15" />{{ store.room.brightness }}% 燈光</span>
      </div>
    </div>
  </section>
</template>
