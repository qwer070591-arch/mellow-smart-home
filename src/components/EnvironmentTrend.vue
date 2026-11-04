<script setup lang="ts">
import { computed, ref } from "vue";
import { environment, environmentHistory } from "../data/mock";

const metric = ref<"temperature" | "humidity">("temperature");
const readings = computed(() =>
  environmentHistory.map((point) => point[metric.value]),
);
const bounds = computed(() =>
  metric.value === "temperature" ? { min: 24, max: 30 } : { min: 40, max: 60 },
);
const points = computed(() =>
  readings.value.map((value, index) => ({
    x: 42 + index * (676 / (readings.value.length - 1)),
    y:
      184 -
      ((value - bounds.value.min) / (bounds.value.max - bounds.value.min)) *
        146,
  })),
);
const line = computed(() =>
  points.value
    .map(
      (point, index) =>
        `${index ? "L" : "M"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
    )
    .join(" "),
);
const area = computed(() => `${line.value} L718 184 L42 184 Z`);
const chartLabel = computed(
  () =>
    `${metric.value === "temperature" ? "溫度" : "濕度"}，24 小時趨勢；目前為 ${metric.value === "temperature" ? `${environment.temperature} 度` : `${environment.humidity}%`}。`,
);
</script>

<template>
  <section class="insight-card trend-card" aria-labelledby="trend-title">
    <div class="section-heading">
      <div>
        <h2 id="trend-title">24 小時環境趨勢</h2>
      </div>
      <div class="metric-tabs" aria-label="趨勢項目">
        <button
          type="button"
          :aria-pressed="metric === 'temperature'"
          @click="metric = 'temperature'"
        >
          溫度
        </button>
        <button
          type="button"
          :aria-pressed="metric === 'humidity'"
          @click="metric = 'humidity'"
        >
          濕度
        </button>
      </div>
    </div>
    <div class="trend-current">
      <strong>{{
        metric === "temperature"
          ? environment.temperature.toFixed(1)
          : environment.humidity
      }}</strong
      ><span>{{ metric === "temperature" ? "°C" : "%" }}</span
      ><small>目前數值</small>
    </div>
    <svg
      class="trend-chart"
      viewBox="0 0 760 230"
      role="img"
      :aria-label="chartLabel"
    >
      <defs>
        <linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="var(--sage)" stop-opacity="0.26" />
          <stop offset="1" stop-color="var(--sage)" stop-opacity="0" />
        </linearGradient>
      </defs>
      <path
        v-for="y in [38, 87, 136, 184]"
        :key="y"
        :d="`M42 ${y}H718`"
        class="trend-grid"
      />
      <path :d="area" fill="url(#trend-fill)" />
      <path :d="line" class="trend-line" />
      <circle
        v-for="(point, index) in points"
        :key="index"
        :cx="point.x"
        :cy="point.y"
        r="3"
        class="trend-point"
      />
      <text
        v-for="(hour, index) in ['00', '04', '08', '12', '16', '20', '24']"
        :key="hour"
        :x="42 + (index * 676) / 6"
        y="216"
        text-anchor="middle"
      >
        {{ hour }}:00
      </text>
    </svg>
    <p class="trend-note">
      曲線不會記錄實際 24 小時的感測值。
    </p>
  </section>
</template>
