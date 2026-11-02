<script setup lang="ts">
import { computed } from "vue";
import {
  Blinds,
  Lightbulb,
  House,
  Clapperboard,
  Moon,
  DoorOpen,
} from "@lucide/vue";
import { useHomeStore } from "../stores/home";
import LivingRoomScene from "./LivingRoomScene.vue";

const store = useHomeStore();
const lamp = computed(() => store.state.lamp);
const curtainPosition = computed(() => store.state.curtain.position);
const brightness = computed(() => (lamp.value.on ? lamp.value.brightness : 0));
const sceneIcons = {
  home: House,
  movie: Clapperboard,
  sleep: Moon,
  away: DoorOpen,
};
const warmthLabel = computed(() =>
  lamp.value.colorTemp <= 3500
    ? "暖白"
    : lamp.value.colorTemp >= 5000
      ? "冷白"
      : "自然白",
);
const sceneLabel = computed(
  () =>
    `客廳預覽：檯燈亮度 ${brightness.value}%，窗簾開度 ${curtainPosition.value}%。`,
);
</script>

<template>
  <section class="living-experience" aria-labelledby="living-title">
    <div class="room-stage">
      <div class="stage-heading">
        <div>
          <span>家的片刻 / 01</span>
          <h1 id="living-title">客廳</h1>
        </div>
      </div>
      <div class="scene-photo-frame" role="img" :aria-label="sceneLabel">
        <LivingRoomScene :brightness="brightness" :color-temp="lamp.colorTemp"
          :curtain-position="curtainPosition" />
      </div>
    </div>

    <section class="scene-atmosphere" aria-labelledby="atmosphere-title">
      <div class="atmosphere-heading">
        <span>一鍵切換家的光景</span>
        <h2 id="atmosphere-title">氛圍控制</h2>
      </div>
      <div class="scene-presets" aria-label="氛圍控制">
        <button
          v-for="scene in store.scenes"
          :key="scene.id"
          type="button"
          :class="{ active: store.state.activeSceneId === scene.id }"
          :aria-pressed="store.state.activeSceneId === scene.id"
          @click="store.runScene(scene.id)"
        >
          <component :is="sceneIcons[scene.id]" :size="19" />
          <strong>{{ scene.name }}</strong>
          <small>{{ scene.detail }}</small>
        </button>
      </div>
    </section>

    <div class="room-control-panel">
      <div id="light-control" class="room-control">
        <div class="room-control-heading">
          <span class="room-control-icon"><Lightbulb :size="19" /></span>
          <div><strong>燈光</strong><small>客廳檯燈</small></div>
          <output for="living-brightness">{{ brightness }}%</output
          ><button
            class="switch"
            type="button"
            role="switch"
            aria-label="檯燈電源"
            :aria-checked="lamp.on"
            @click="store.setLamp({ on: !lamp.on })"
          >
            <span></span>
          </button>
        </div>
        <label for="living-brightness">亮度</label>
        <input
          id="living-brightness"
          type="range"
          min="0"
          max="100"
          :value="lamp.brightness"
          :disabled="!lamp.on"
          @input="
            store.setLamp({
              brightness: Number(($event.target as HTMLInputElement).value),
            })
          "
        />
        <div class="control-endpoints"><span>暗</span><span>亮</span></div>
        <div class="temperature-row">
          <label for="living-color-temp">色溫</label
          ><strong>{{ warmthLabel }}・{{ lamp.colorTemp }} K</strong>
        </div>
        <input
          id="living-color-temp"
          type="range"
          min="2700"
          max="6500"
          step="100"
          :value="lamp.colorTemp"
          :disabled="!lamp.on"
          @input="
            store.setLamp({
              colorTemp: Number(($event.target as HTMLInputElement).value),
            })
          "
        />
        <div class="control-endpoints"><span>暖光</span><span>冷白</span></div>
      </div>
      <div id="curtain-control" class="room-control">
        <div class="room-control-heading">
          <span class="room-control-icon"><Blinds :size="19" /></span>
          <div><strong>窗簾</strong><small>落地窗</small></div>
          <output for="living-curtain-position">{{ curtainPosition }}%</output>
        </div>
        <label for="living-curtain-position">開度</label>
        <input
          id="living-curtain-position"
          type="range"
          min="0"
          max="100"
          :value="curtainPosition"
          @input="
            store.setCurtain(Number(($event.target as HTMLInputElement).value))
          "
        />
        <div class="control-endpoints"><span>全關</span><span>全開</span></div>
      </div>
    </div>
  </section>
</template>
