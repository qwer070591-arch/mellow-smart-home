<script setup lang="ts">
import { computed } from 'vue'
import { Sun } from '@lucide/vue'
import { usePointerRange } from '../composables/usePointerRange'

const props = defineProps<{ modelValue: number; id: string; label: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()
const fill = computed(() => ({ '--bubble-fill': `${30 + props.modelValue * .56}%` }))
const drag = usePointerRange(0, 100, value => emit('update:modelValue', value))
</script>

<template>
  <div class="bubble-slider" :style="fill">
    <div class="bubble-slider__fill" aria-hidden="true"><Sun :size="19" :stroke-width="1.8" /><span class="bubble-slider__mark"></span></div>
    <strong class="bubble-slider__value" aria-hidden="true">{{ modelValue }}%</strong>
    <input
      :id="id"
      type="range"
      min="0"
      max="100"
      step="1"
      :value="modelValue"
      :aria-label="label"
      @input="emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
      @pointerdown="drag.onPointerDown"
      @pointermove="drag.onPointerMove"
      @pointerup="drag.onPointerEnd"
      @pointercancel="drag.onPointerEnd"
    />
  </div>
</template>
