<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import { X } from "@lucide/vue";
import TimeWheelColumn from "./TimeWheelColumn.vue";

const props = defineProps<{ label: string; modelValue: string }>();
const emit = defineEmits<{
  "update:modelValue": [value: string];
  "update:open": [value: boolean];
}>();
const editing = ref(false);
const trigger = ref<HTMLButtonElement | null>(null);
const sheet = ref<HTMLElement | null>(null);
let previousOverflow = "";
const draftHour = ref(Number(props.modelValue.slice(0, 2)));
const draftMinute = ref(Number(props.modelValue.slice(3, 5)));

watch(() => props.modelValue, (value) => {
  if (editing.value) return;
  draftHour.value = Number(value.slice(0, 2));
  draftMinute.value = Number(value.slice(3, 5));
});

function openPicker() {
  draftHour.value = Number(props.modelValue.slice(0, 2));
  draftMinute.value = Number(props.modelValue.slice(3, 5));
  editing.value = true;
  emit("update:open", true);
}

function closePicker() {
  editing.value = false;
  emit("update:open", false);
  nextTick(() => trigger.value?.focus());
}

function saveTime() {
  const hour = String(draftHour.value).padStart(2, "0");
  const minute = String(draftMinute.value).padStart(2, "0");
  emit("update:modelValue", `${hour}:${minute}`);
  closePicker();
}

function trapFocus(event: KeyboardEvent) {
  if (event.key !== "Tab" || !sheet.value) return;
  const focusable = [...sheet.value.querySelectorAll<HTMLElement>('button, [tabindex="0"]')];
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) return;
  if (event.shiftKey && (document.activeElement === first || document.activeElement === sheet.value)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

watch(editing, async (open) => {
  if (open) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    await nextTick();
    sheet.value?.focus();
  } else {
    document.body.style.overflow = previousOverflow;
  }
});
onBeforeUnmount(() => {
  if (editing.value) document.body.style.overflow = previousOverflow;
});
</script>

<template>
  <div class="routine-time-picker">
    <button
      ref="trigger"
      class="routine-time-trigger alarm-time-trigger"
      type="button"
      :aria-label="`${label}時間 ${modelValue}，調整時間`"
      :aria-expanded="editing"
      @click="openPicker"
    >
      <strong>{{ modelValue }}</strong>
    </button>
    <Teleport to="body">
      <Transition name="time-sheet">
        <div v-if="editing" class="time-sheet-layer">
          <div class="time-sheet-backdrop" aria-hidden="true" @click="closePicker"></div>
          <section
            ref="sheet"
            class="time-sheet-panel"
            role="dialog"
            aria-modal="true"
            :aria-label="`${label}時間選擇器`"
            tabindex="-1"
            @keydown.esc.prevent.stop="closePicker"
            @keydown="trapFocus"
          >
            <div class="time-sheet-handle" aria-hidden="true"></div>
            <div class="time-sheet-heading">
              <div><p>鬧鐘</p><h2>設定{{ label }}時間</h2></div>
              <button type="button" aria-label="關閉時間選擇器" @click="closePicker"><X :size="20" /></button>
            </div>
            <div class="routine-wheel-editor">
              <div class="routine-wheel-heading"><span>小時</span><span>分鐘</span></div>
              <div class="routine-wheel-pair">
                <TimeWheelColumn v-model="draftHour" :max="23" :label="`${label}小時`" />
                <span class="routine-wheel-separator" aria-hidden="true">:</span>
                <TimeWheelColumn v-model="draftMinute" :max="59" :label="`${label}分鐘`" />
              </div>
            </div>
            <div class="routine-wheel-actions">
              <button type="button" @click="closePicker">取消</button>
              <button type="button" class="routine-wheel-save" @click="saveTime">確定</button>
            </div>
          </section>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
