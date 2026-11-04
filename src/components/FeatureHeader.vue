<script setup lang="ts">
defineProps<{ title: string; description: string }>()
</script>
<template>
  <header class="feature-header"><div><h1>{{ title }}</h1><p>{{ description }}</p></div><slot /></header>
</template>
