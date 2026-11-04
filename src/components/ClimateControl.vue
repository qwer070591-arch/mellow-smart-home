<script setup lang="ts">
import { computed, ref } from "vue";
import { Minus, Plus, Power, Droplets, Wind } from "@lucide/vue";
import { useHomeStore } from "../stores/home";
import { environment } from "../data/mock";

const store = useHomeStore();
const climate = computed(() => store.state.climate);
const progress = computed(() => ((climate.value.target - 16) / 14) * 100);
const dialAngle = computed(
  () => ((150 + progress.value * 2.4) * Math.PI) / 180,
);
const dialHandle = computed(() => ({
  x: 150 + 115 * Math.cos(dialAngle.value),
  y: 150 + 115 * Math.sin(dialAngle.value),
}));
const dialSvg = ref<SVGSVGElement | null>(null);
const draggingDial = ref(false);

function updateTemperatureFromPointer(event: PointerEvent) {
  if (!climate.value.on || !dialSvg.value) return;
  const matrix = dialSvg.value.getScreenCTM();
  if (!matrix) return;
  const point = dialSvg.value.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const local = point.matrixTransform(matrix.inverse());
  let angle = (Math.atan2(local.y - 150, local.x - 150) * 180) / Math.PI;
  if (angle < 0) angle += 360;
  const clampAngle = (value: number) => Math.max(150, Math.min(390, value));
  const wrapped = angle + 360;
  if (
    Math.abs(wrapped - clampAngle(wrapped)) <
    Math.abs(angle - clampAngle(angle))
  )
    angle = wrapped;
  const fraction = (clampAngle(angle) - 150) / 240;
  store.setClimate({ target: Math.round(16 + fraction * 14) });
}

function startDialDrag(event: PointerEvent) {
  if (!climate.value.on) return;
  event.preventDefault();
  draggingDial.value = true;
  (event.currentTarget as SVGElement).setPointerCapture(event.pointerId);
  updateTemperatureFromPointer(event);
}

function moveDial(event: PointerEvent) {
  if (draggingDial.value) updateTemperatureFromPointer(event);
}

function stopDialDrag() {
  draggingDial.value = false;
}

function onDialKeydown(event: KeyboardEvent) {
  if (!climate.value.on) return;
  const next = {
    ArrowLeft: climate.value.target - 1,
    ArrowDown: climate.value.target - 1,
    ArrowRight: climate.value.target + 1,
    ArrowUp: climate.value.target + 1,
    Home: 16,
    End: 30,
  }[event.key];
  if (next === undefined) return;
  event.preventDefault();
  store.setClimate({ target: next });
}
const climateStatus = computed(() =>
  !climate.value.on
    ? "空調已關閉"
    : climate.value.target < environment.temperature
      ? "製冷中"
      : "維持舒適溫度",
);
</script>

<template>
  <section
    id="climate-control"
    class="climate-section"
    aria-labelledby="climate-title"
  >
    <div class="climate-section-heading">
      <div>
        <p>拖曳圓點調整目標溫度</p>
        <h2 id="climate-title">室內溫度</h2>
      </div>
      <button
        class="climate-power"
        type="button"
        :aria-label="climate.on ? '關閉空調' : '開啟空調'"
        :aria-pressed="climate.on"
        @click="store.setClimate({ on: !climate.on })"
      >
        <Power :size="21" />
      </button>
    </div>

    <div
      class="thermostat"
      :class="{ inactive: !climate.on, dragging: draggingDial }"
    >
      <svg ref="dialSvg" viewBox="0 0 300 240">
        <path d="M50.4 207.5 A115 115 0 1 1 249.6 207.5" class="dial-track" />
        <path
          d="M50.4 207.5 A115 115 0 1 1 249.6 207.5"
          class="dial-progress"
          pathLength="100"
          :style="{ strokeDasharray: `${progress} 100` }"
        />
        <path
          d="M50.4 207.5 A115 115 0 1 1 249.6 207.5"
          class="dial-hit-area"
          role="slider"
          tabindex="0"
          aria-label="目標溫度"
          aria-valuemin="16"
          aria-valuemax="30"
          :aria-valuenow="climate.target"
          :aria-valuetext="`${climate.target} 度`"
          :aria-disabled="!climate.on"
          @pointerdown="startDialDrag"
          @pointermove="moveDial"
          @pointerup="stopDialDrag"
          @pointercancel="stopDialDrag"
          @keydown="onDialKeydown"
        />
        <circle
          class="dial-handle"
          :cx="dialHandle.x"
          :cy="dialHandle.y"
          r="8"
          aria-hidden="true"
          @pointerdown="startDialDrag"
          @pointermove="moveDial"
          @pointerup="stopDialDrag"
          @pointercancel="stopDialDrag"
        />
      </svg>
      <div class="thermostat-center">
        <span>目標溫度</span><strong>{{ climate.target }}<sup>°</sup></strong
        ><small>{{ climateStatus }}</small>
      </div>
      <span class="dial-min">16°</span><span class="dial-max">30°</span>
    </div>

    <div class="climate-adjust">
      <button
        type="button"
        aria-label="降低目標溫度"
        :disabled="!climate.on || climate.target <= 16"
        @click="store.setClimate({ target: climate.target - 1 })"
      >
        <Minus :size="20" />
      </button>
      <span
        >目前室溫
        <strong>{{ environment.temperature.toFixed(1) }}°C</strong></span
      >
      <button
        type="button"
        aria-label="提高目標溫度"
        :disabled="!climate.on || climate.target >= 30"
        @click="store.setClimate({ target: climate.target + 1 })"
      >
        <Plus :size="20" />
      </button>
    </div>

    <div class="environment-row">
      <span
        ><Droplets :size="18" />濕度
        <strong>{{ environment.humidity }}%</strong></span
      ><span
        ><Wind :size="18" />空氣
        <strong>{{ environment.airQuality }}</strong></span
      >
    </div>
  </section>
</template>
