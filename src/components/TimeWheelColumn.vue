<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from "vue";

const props = defineProps<{ modelValue: number; max: number; label: string }>();
const emit = defineEmits<{ "update:modelValue": [value: number] }>();
const scroller = ref<HTMLElement | null>(null);
const dragging = ref(false);
const values = Array.from({ length: props.max + 1 }, (_, index) => index);
let activePointer: number | null = null;
let startY = 0;
let startScrollTop = 0;
let tappedValue: number | null = null;
let emittedValue: number | null = null;

const rowHeight = () => scroller.value?.querySelector<HTMLElement>(".time-wheel-option")?.offsetHeight ?? 44;
const boundedValue = (value: number) => Math.max(0, Math.min(props.max, value));

function emitValue(value: number) {
  if (value === props.modelValue) return;
  emittedValue = value;
  emit("update:modelValue", value);
}

function scrollToValue(value: number, behavior: ScrollBehavior = "smooth") {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "instant"
    : behavior;
  scroller.value?.scrollTo({ top: boundedValue(value) * rowHeight(), behavior: motion });
}

function onScroll() {
  if (!scroller.value) return;
  emitValue(boundedValue(Math.round(scroller.value.scrollTop / rowHeight())));
}

function selectValue(value: number) {
  scrollToValue(value, "instant");
  emitValue(value);
}

function startDrag(event: PointerEvent) {
  if (activePointer !== null || (event.pointerType === "mouse" && event.button !== 0)) return;
  const element = scroller.value;
  if (!element) return;
  activePointer = event.pointerId;
  startY = event.clientY;
  startScrollTop = element.scrollTop;
  const option = (event.target as HTMLElement).closest<HTMLElement>(".time-wheel-option");
  tappedValue = option ? Number(option.dataset.value) : null;
  element.setPointerCapture(event.pointerId);
}

function moveDrag(event: PointerEvent) {
  const element = scroller.value;
  if (!element || event.pointerId !== activePointer) return;
  const distance = startY - event.clientY;
  if (!dragging.value && Math.abs(distance) < 3) return;
  dragging.value = true;
  element.scrollTop = Math.max(0, Math.min(props.max * rowHeight(), startScrollTop + distance));
  onScroll();
}

function stopDrag(event: PointerEvent) {
  const element = scroller.value;
  if (!element || event.pointerId !== activePointer) return;
  if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
  activePointer = null;
  const wasDragging = dragging.value;
  dragging.value = false;
  if (wasDragging) {
    const next = boundedValue(Math.round(element.scrollTop / rowHeight()));
    emitValue(next);
    scrollToValue(next);
  } else if (tappedValue !== null && event.type === "pointerup") {
    selectValue(tappedValue);
  }
  tappedValue = null;
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
  const bounded = boundedValue(next);
  scrollToValue(bounded, "instant");
  emitValue(bounded);
}

onMounted(() => nextTick(() => scrollToValue(props.modelValue, "instant")));
watch(() => props.modelValue, (value) => {
  if (!scroller.value) return;
  if (value === emittedValue) {
    emittedValue = null;
    return;
  }
  emittedValue = null;
  const current = Math.round(scroller.value.scrollTop / rowHeight());
  if (current !== value) scrollToValue(value, "instant");
});
</script>

<template>
  <div class="time-wheel-column">
    <div class="time-wheel-selection" aria-hidden="true"></div>
    <div
      ref="scroller"
      class="time-wheel-scroll"
      :class="{ dragging }"
      role="listbox"
      :aria-label="label"
      tabindex="0"
      @scroll.passive="onScroll"
      @keydown="onKeydown"
      @pointerdown="startDrag"
      @pointermove="moveDrag"
      @pointerup="stopDrag"
      @pointercancel="stopDrag"
    >
      <div
        v-for="value in values"
        :key="value"
        class="time-wheel-option"
        :data-value="value"
        role="option"
        :aria-selected="modelValue === value"
        :class="{ selected: modelValue === value, nearby: Math.abs(modelValue - value) === 1 }"
        @click="selectValue(value)"
      >{{ String(value).padStart(2, "0") }}</div>
    </div>
  </div>
</template>
