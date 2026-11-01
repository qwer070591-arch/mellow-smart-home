<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import { AlarmClock, X } from "@lucide/vue";
import { useHomeStore } from "../stores/home";
import RoutineTimePicker from "./RoutineTimePicker.vue";
import type { RoutineId } from "../types";

const store = useHomeStore();
const open = ref(false);
const editingTime = ref(false);
const trigger = ref<HTMLButtonElement | null>(null);
const panel = ref<HTMLElement | null>(null);
let previousOverflow = "";

const details: Record<RoutineId, { label: string; action: string }> = {
  morning: { label: "早安排程", action: "回家氛圍・拉開窗簾" },
  night: { label: "晚安排程", action: "睡眠氛圍・關上窗簾" },
};

function closeAlarm() {
  if (editingTime.value) return;
  open.value = false;
  nextTick(() => trigger.value?.focus());
}

function trapFocus(event: KeyboardEvent) {
  if (event.key !== "Tab" || !panel.value || editingTime.value) return;
  const focusable = [...panel.value.querySelectorAll<HTMLElement>('button, [tabindex="0"]')];
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) return;
  if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.value)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

watch(open, async (isOpen) => {
  if (isOpen) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    await nextTick();
    panel.value?.focus();
  } else {
    document.body.style.overflow = previousOverflow;
  }
});
onBeforeUnmount(() => {
  if (open.value) document.body.style.overflow = previousOverflow;
});
</script>

<template>
  <button ref="trigger" class="alarm-trigger" type="button" aria-label="開啟鬧鐘與排程"
    :aria-expanded="open" @click="open = true">
    <AlarmClock :size="20" aria-hidden="true" />
    <span v-if="store.state.routines.some((routine) => routine.enabled)" class="alarm-active-dot"></span>
  </button>
  <Teleport to="body">
    <Transition name="time-sheet">
      <div v-if="open" class="time-sheet-layer alarm-sheet-layer">
        <div class="time-sheet-backdrop" aria-hidden="true" @click="closeAlarm"></div>
        <section ref="panel" class="time-sheet-panel alarm-sheet-panel" role="dialog"
          aria-modal="true" aria-label="鬧鐘與排程" :aria-hidden="editingTime || undefined"
          tabindex="-1" @keydown.esc.prevent.stop="closeAlarm" @keydown="trapFocus">
          <div class="time-sheet-handle" aria-hidden="true"></div>
          <div class="time-sheet-heading">
            <div><p>mellow. 智慧生活</p><h2>鬧鐘</h2></div>
            <button type="button" aria-label="關閉鬧鐘" @click="closeAlarm"><X :size="20" /></button>
          </div>
          <div class="alarm-list">
            <article v-for="routine in store.state.routines" :key="routine.id" class="alarm-item"
              :class="{ disabled: !routine.enabled }">
              <div class="alarm-item-main">
                <RoutineTimePicker :label="details[routine.id].label" :model-value="routine.time"
                  @update:model-value="store.updateRoutine(routine.id, { time: $event })"
                  @update:open="editingTime = $event" />
                <span>{{ details[routine.id].label }}・{{ details[routine.id].action }}</span>
              </div>
              <button class="switch" type="button" role="switch"
                :aria-label="`${details[routine.id].label}啟用`" :aria-checked="routine.enabled"
                @click="store.updateRoutine(routine.id, { enabled: !routine.enabled })"><span></span></button>
            </article>
          </div>
          <p class="alarm-note">排程僅在網頁開啟時執行，不會在背景發出手機鬧鈴。</p>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
