<script setup lang="ts">
defineProps<{ checked: boolean; labelOn: string; labelOff: string }>()
defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    type="button"
    class="device-toggle"
    role="switch"
    :aria-label="checked ? labelOn : labelOff"
    :aria-checked="checked"
    @click="$emit('toggle')"
  >
    <span class="device-toggle__track" aria-hidden="true"><span class="device-toggle__thumb"></span></span>
    <span class="device-toggle__text" aria-hidden="true">{{ checked ? 'ON' : 'OFF' }}</span>
  </button>
</template>
