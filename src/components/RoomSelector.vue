<script setup lang="ts">
import { roomDetails, roomIds, useDashboardStore } from '../stores/dashboard'
const dashboard = useDashboardStore()
</script>

<template>
  <div class="feature-room-selector" role="group" aria-label="選擇房間">
    <button v-for="id in roomIds" :key="id" type="button" :aria-pressed="dashboard.state.selectedRoom === id" @click="dashboard.selectRoom(id)">{{ roomDetails[id].name }}</button>
  </div>
</template>
