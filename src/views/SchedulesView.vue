<script setup lang="ts">
import { reactive, ref } from 'vue'
import { CalendarClock, Pencil, Play, Trash2 } from '@lucide/vue'
import { roomDetails, roomIds, sceneIds, scenePresets, type RoomId, type SceneId } from '../stores/dashboard'
import { useControlCenterStore, type Schedule, type ScheduleAction } from '../stores/controlCenter'
import FeatureHeader from '../components/FeatureHeader.vue'
import DeviceToggle from '../components/DeviceToggle.vue'
import RoutineTimePicker from '../components/RoutineTimePicker.vue'
import GlassSelect from '../components/GlassSelect.vue'

withDefaults(defineProps<{ embedded?: boolean }>(), { embedded: false })
const emit = defineEmits<{ timeEditing: [open: boolean] }>()
const center = useControlCenterStore()
const editingId = ref<string | null>(null)
const error = ref('')
const form = reactive({ room: 'living' as RoomId, action: 'lighting' as ScheduleAction, scene: 'home' as SceneId, value: 80, time: '07:30', enabled: true })
const actionLabels: Record<ScheduleAction, string> = { lighting: '燈光亮度', curtain: '窗簾開度', climate: '目標溫度', scene: '氛圍' }
const roomOptions = roomIds.map(id => ({ value: id, label: roomDetails[id].name }))
const actionOptions = ([ 'lighting', 'curtain', 'climate', 'scene' ] as ScheduleAction[]).map(value => ({ value, label: value === 'scene' ? '氛圍情境' : actionLabels[value] }))
const sceneOptions = sceneIds.map(id => ({ value: id, label: scenePresets[id].label }))
function edit(item: Schedule) {
  editingId.value = item.id
  Object.assign(form, { room: item.room, action: item.action, scene: item.scene ?? 'home', value: item.value, time: item.time, enabled: item.enabled })
  error.value = ''
}
function clearForm() {
  editingId.value = null
  Object.assign(form, { room: 'living', action: 'lighting', scene: 'home', value: 80, time: '07:30', enabled: true })
  error.value = ''
}
function save() {
  if (!center.saveSchedule({ ...form }, editingId.value ?? undefined)) {
    error.value = '請輸入有效時間與數值，最多可建立 30 筆排程。'
    return
  }
  clearForm()
}
function changeAction() { form.value = form.action === 'climate' ? 24 : form.action === 'scene' ? 0 : 80 }
function description(item: Schedule) {
  return item.action === 'scene' && item.scene
    ? `${roomDetails[item.room].name} · ${scenePresets[item.scene].label}氛圍`
    : `${roomDetails[item.room].name} · ${actionLabels[item.action]} ${item.value}${item.action === 'climate' ? '°C' : '%'}`
}
</script>

<template>
  <div :class="embedded ? 'schedule-embedded' : 'feature-page'">
    <FeatureHeader v-if="!embedded" title="排程" description="指定房間與裝置或氛圍，每天在設定時間執行一次。" />
    <div class="feature-grid feature-grid--schedule">
      <section class="feature-card">
        <div class="feature-card__heading"><div><h2>{{ editingId ? '編輯排程' : '新增排程' }}</h2><p>時間採台北時區</p></div><CalendarClock :size="24" /></div>
        <form class="schedule-form" @submit.prevent="save">
          <div class="schedule-time-field"><span>執行時間</span><RoutineTimePicker v-model="form.time" label="執行" @update:open="emit('timeEditing', $event)" /></div>
          <div class="schedule-choice-field"><span>房間</span><GlassSelect v-model="form.room" label="房間" :options="roomOptions" /></div>
          <div class="schedule-choice-field"><span>動作</span><GlassSelect v-model="form.action" label="動作" :options="actionOptions" @update:model-value="changeAction" /></div>
          <div v-if="form.action === 'scene'" class="schedule-choice-field"><span>氛圍</span><GlassSelect v-model="form.scene" label="氛圍" :options="sceneOptions" /></div>
          <label v-else>{{ form.action === 'climate' ? '溫度（16–30°C）' : '百分比（0–100%）' }}<input v-model.number="form.value" type="number" step="1" :min="form.action === 'climate' ? 16 : 0" :max="form.action === 'climate' ? 30 : 100" required /></label>
          <p v-if="error" class="form-error" role="alert">{{ error }}</p>
          <div class="form-actions"><button type="submit" class="primary-button">{{ editingId ? '儲存變更' : '新增排程' }}</button><button v-if="editingId" type="button" @click="clearForm">取消編輯</button></div>
        </form>
      </section>
      <section class="feature-card">
        <div class="feature-card__heading"><div><h2>每日排程</h2><p>{{ center.state.schedules.length }} 筆排程</p></div></div>
        <div v-if="!center.state.schedules.length" class="feature-empty"><CalendarClock :size="32" /><strong>尚未建立排程</strong><span>設定時間、房間與要執行的操作。</span></div>
        <div v-else class="schedule-list"><article v-for="item in center.state.schedules" :key="item.id"><div class="schedule-list__top"><strong>{{ item.time }}</strong><DeviceToggle :checked="item.enabled" :label-on="`停用 ${item.time} 排程`" :label-off="`啟用 ${item.time} 排程`" @toggle="center.toggleSchedule(item.id)" /></div><p>{{ description(item) }}</p><div class="schedule-list__actions"><button type="button" @click="center.runSchedule(item.id)"><Play :size="15" />立即執行</button><button type="button" @click="edit(item)"><Pencil :size="15" />編輯</button><button type="button" @click="center.removeSchedule(item.id)"><Trash2 :size="15" />刪除</button></div></article></div>
      </section>
    </div>
    <p class="feature-note">排程只在網站開啟時檢查；關閉網頁後沒有背景服務。</p>
  </div>
</template>
