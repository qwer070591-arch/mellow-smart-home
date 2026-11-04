<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { Pause, Play, SkipBack, SkipForward, Volume2, Music2 } from '@lucide/vue'
import { useControlCenterStore } from '../stores/controlCenter'
import FeatureHeader from '../components/FeatureHeader.vue'

const center = useControlCenterStore()
const tracks = [
  { name: '暮色', description: '柔和的夜間旋律', notes: [261.63, 329.63, 392, 329.63, 293.66, 349.23, 392, 349.23] },
  { name: '靜謐', description: '適合放鬆的節奏', notes: [220, 261.63, 329.63, 261.63, 196, 246.94, 293.66, 246.94] },
  { name: '晨光', description: '輕盈明亮的音色', notes: [293.66, 369.99, 440, 369.99, 329.63, 392, 493.88, 392] },
]
const trackIndex = ref(0)
const playing = ref(false)
const error = ref('')
let audio: AudioContext | null = null
let master: GainNode | null = null
let timer: ReturnType<typeof setInterval> | undefined
let voices: OscillatorNode[] = []

function scheduleBar() {
  if (!audio || !master) return
  const start = audio.currentTime + .03
  tracks[trackIndex.value]!.notes.forEach((frequency, index) => {
    const voice = audio!.createOscillator()
    const envelope = audio!.createGain()
    voice.type = 'sine'
    voice.frequency.value = frequency
    const at = start + index * .48
    envelope.gain.setValueAtTime(0, at)
    envelope.gain.linearRampToValueAtTime(.65, at + .04)
    envelope.gain.exponentialRampToValueAtTime(.001, at + .42)
    voice.connect(envelope).connect(master!)
    voice.start(at)
    voice.stop(at + .44)
    voices.push(voice)
    voice.onended = () => { voices = voices.filter(item => item !== voice) }
  })
}
async function play() {
  try {
    audio = new AudioContext()
    master = audio.createGain()
    master.gain.value = center.state.musicVolume / 100 * .12
    master.connect(audio.destination)
    await audio.resume()
    scheduleBar()
    timer = setInterval(scheduleBar, 4000)
    playing.value = true
    error.value = ''
  } catch { error.value = '此瀏覽器無法啟動示範音效。'; stop() }
}
function stop() {
  clearInterval(timer)
  timer = undefined
  voices.forEach(voice => { try { voice.stop() } catch { /* 已結束的音符。 */ } })
  voices = []
  void audio?.close()
  audio = null
  master = null
  playing.value = false
}
function changeTrack(direction: number) {
  trackIndex.value = (trackIndex.value + direction + tracks.length) % tracks.length
  if (playing.value) { stop(); void play() }
}
function selectTrack(index: number) {
  trackIndex.value = index
  if (playing.value) { stop(); void play() }
}
watch(() => center.state.musicVolume, value => { if (master) master.gain.value = value / 100 * .12 })
onBeforeUnmount(stop)
</script>

<template>
  <div class="feature-page">
    <FeatureHeader title="音樂" description="原創合成示範音效；播放需由你手動啟動。" />
    <div class="music-layout">
      <section class="feature-card music-player"><div class="music-art" aria-hidden="true"><Music2 :size="72" :stroke-width="1.1" /><span v-for="index in 7" :key="index" :style="{ height: `${15 + (index * 17) % 65}%` }"></span></div><div class="music-player__info"><span>MELLOW. ORIGINAL DEMO</span><h2>{{ tracks[trackIndex]!.name }}</h2><p>{{ tracks[trackIndex]!.description }}</p></div><div class="music-controls"><button type="button" aria-label="上一段示範音效" @click="changeTrack(-1)"><SkipBack :size="23" /></button><button type="button" class="music-controls__play" :aria-label="playing ? '暫停播放' : '開始播放'" @click="playing ? stop() : play()"><Pause v-if="playing" :size="25" fill="currentColor" /><Play v-else :size="25" fill="currentColor" /></button><button type="button" aria-label="下一段示範音效" @click="changeTrack(1)"><SkipForward :size="23" /></button></div><label class="music-volume"><Volume2 :size="19" /><span>音量 {{ center.state.musicVolume }}%</span><input type="range" min="0" max="100" step="1" :value="center.state.musicVolume" aria-label="示範音效音量" @input="center.setVolume(Number(($event.target as HTMLInputElement).value))" /></label><p v-if="error" role="alert">{{ error }}</p></section>
      <section class="feature-card"><h2>播放說明</h2><p class="feature-note">這是瀏覽器即時合成的原創示範音效，不含串流音樂或第三方錄音。離開此頁即停止播放；不會在背景持續運作。</p><div class="track-list"><button v-for="(track, index) in tracks" :key="track.name" type="button" :aria-pressed="trackIndex === index" @click="selectTrack(index)"><Music2 :size="18" /><span><strong>{{ track.name }}</strong><small>{{ track.description }}</small></span></button></div></section>
    </div>
  </div>
</template>
