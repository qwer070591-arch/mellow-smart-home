<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from "vue";

const props = defineProps<{ modelValue: number; max: number; label: string }>();
const emit = defineEmits<{ "update:modelValue": [value: number] }>();
const itemHeight = 42;
const scroller = ref<HTMLElement | null>(null);
const values = Array.from({ length: props.max + 1 }, (_, index) => index);

function scrollToValue(value: number, behavior: ScrollBehavior = "smooth") {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "instant"
    : behavior;
  scroller.value?.scrollTo({ top: value * itemHeight, behavior: motion });
}

function onScroll() {
  if (!scroller.value) return;
  const next = Math.max(0, Math.min(props.max, Math.round(scroller.value.scrollTop / itemHeight)));
  if (next !== props.modelValue) emit("update:modelValue", next);
}

function selectValue(value: number) {
  scrollToValue(value, "instant");
  emit("update:modelValue", value);
}

function onKeydown(event: KeyboardEvent) {
  const next = {
    ArrowUp: props.modelValue - 1,
    ArrowDown: props.modelValue + 1,
    PageUp: props.modelValue - 5,
    PageDown: props.modelValue + 5,
    Home: 0,
    End: props.max,
  }[event.key];
  if (next === undefined) return;
  event.preventDefault();
  const bounded = Math.max(0, Math.min(props.max, next));
  scrollToValue(bounded, "instant");
  emit("update:modelValue", bounded);
}

onMounted(() => nextTick(() => scrollToValue(props.modelValue, "instant")));
watch(() => props.modelValue, (value) => {
  if (!scroller.value) return;
  const current = Math.round(scroller.value.scrollTop / itemHeight);
  if (current !== value) scrollToValue(value, "instant");
});
</script>

<template>
  <div class="time-wheel-column">
    <div class="time-wheel-selection" aria-hidden="true"></div>
    <div
      ref="scroller"
      class="time-wheel-scroll"
      role="listbox"
      :aria-label="label"
      tabindex="0"
      @scroll.passive="onScroll"
      @keydown="onKeydown"
    >
      <div
        v-for="value in values"
        :key="value"
        class="time-wheel-option"
        role="option"
        :aria-selected="modelValue === value"
        :class="{ selected: modelValue === value, nearby: Math.abs(modelValue - value) === 1 }"
        @click="selectValue(value)"
      >{{ String(value).padStart(2, "0") }}</div>
    </div>
  </div>
</template>
