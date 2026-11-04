<script setup lang="ts">
import { Bell, CheckCheck, Trash2 } from '@lucide/vue'
import { useControlCenterStore } from '../stores/controlCenter'
import FeatureHeader from '../components/FeatureHeader.vue'
const center = useControlCenterStore()
</script>

<template>
  <div class="feature-page">
    <FeatureHeader title="通知中心" :description="`${center.unreadCount} 則未讀 · 僅在此網站內顯示`"><div class="feature-header__actions"><button type="button" :disabled="!center.unreadCount" @click="center.markAllRead()"><CheckCheck :size="17" />全部已讀</button><button type="button" :disabled="!center.state.notifications.length" @click="center.clearNotifications()"><Trash2 :size="17" />清除全部</button></div></FeatureHeader>
    <section class="feature-card"><div v-if="!center.state.notifications.length" class="feature-empty"><Bell :size="32" /><strong>目前沒有通知</strong><span>排程執行或安全狀態變更後，會在這裡顯示。</span></div><div v-else class="notification-list"><button v-for="notice in center.state.notifications" :key="notice.id" type="button" :class="{ 'is-unread': !notice.read }" :aria-label="`${notice.read ? '已讀' : '未讀'}：${notice.message}，點擊標記已讀`" @click="center.markRead(notice.id)"><span class="notification-list__dot"></span><span><strong>{{ notice.message }}</strong><small>{{ new Date(notice.createdAt).toLocaleString('zh-TW') }}</small></span></button></div></section>
    <p class="feature-note">通知使用 localStorage 保存；網站關閉時不會收到推播。</p>
  </div>
</template>
