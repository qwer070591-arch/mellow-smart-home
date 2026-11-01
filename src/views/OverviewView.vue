<script setup lang="ts">
import LivingRoomExperience from "../components/LivingRoomExperience.vue";
import ClimateControl from "../components/ClimateControl.vue";
import EnvironmentTrend from "../components/EnvironmentTrend.vue";
</script>

<template>
  <div class="overview-view">
    <div class="living-intro"><p>讓家，照你的節奏生活。</p></div>
    <div class="living-layout"><LivingRoomExperience /><ClimateControl /></div>
    <EnvironmentTrend />
  </div>
</template>
