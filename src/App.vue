<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useHomeStore } from "./stores/home";
import AlarmCenter from "./components/AlarmCenter.vue";

const store = useHomeStore();
const now = ref(new Date());
let timer: ReturnType<typeof setInterval> | undefined;

function tick() {
  now.value = new Date();
  store.checkRoutines(now.value);
}

const time = computed(() =>
  new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now.value),
);
onMounted(() => {
  tick();
  timer = setInterval(tick, 30_000);
  document.addEventListener("visibilitychange", tick);
});
onBeforeUnmount(() => {
  clearInterval(timer);
  document.removeEventListener("visibilitychange", tick);
});
</script>

<template>
  <div class="living-page">
    <header class="living-header">
      <RouterLink to="/" class="living-brand" aria-label="Mellow 首頁">
        <span class="brand-mark">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M3 10L12 3L21 10V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V10Z"
              stroke="#E2E8F0"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M9 14C9.55228 13.4477 10.7312 13 12 13C13.2688 13 14.4477 13.4477 15 14"
              stroke="#38BDF8"
              stroke-width="2"
              stroke-linecap="round"
            />
            <path
              d="M7 11.5C8.125 10.375 9.97917 9.5 12 9.5C14.0208 9.5 15.875 10.375 17 11.5"
              stroke="#38BDF8"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </span>
        <span
          >mellow<span class="brand-period">.</span
          ><small>智慧生活</small></span
        >
      </RouterLink>
      <div class="header-clock">
        <AlarmCenter />
        <time :datetime="now.toISOString()">{{ time }}</time>
      </div>
    </header>

    <main class="living-main"><RouterView /></main>
    <div v-if="store.toast" class="toast" role="status">{{ store.toast }}</div>
    <div v-if="store.storageError" class="storage-error" role="alert">
      瀏覽器無法儲存目前的設定。
    </div>
  </div>
</template>
