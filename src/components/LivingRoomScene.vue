<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  theme: "light" | "dark";
  brightness: number;
  colorTemp: number;
  curtainPosition: number;
}>();

const lampPower = computed(() => Math.pow(props.brightness / 100, 1.12));
const curtainOpen = computed(() => props.curtainPosition / 100);
const panelWidth = computed(() => 9 + 74 * (1 - curtainOpen.value));
const rightPanelX = computed(() => 731 - panelWidth.value);
const moonlight = computed(() => props.theme === "dark"
  ? Number((curtainOpen.value * 0.38).toFixed(3)) : 0);
const daylight = computed(() => props.theme === "light"
  ? Number((curtainOpen.value * 0.82).toFixed(3)) : 0);
const isDay = computed(() => props.theme === "light");
const lampColor = computed(() => {
  const cool = (props.colorTemp - 2700) / 3800;
  return `rgb(${Math.round(255 - 34 * cool)} ${Math.round(220 + 21 * cool)} ${Math.round(169 + 78 * cool)})`;
});
</script>

<template>
  <svg class="living-room-illustration" data-testid="living-room-scene" viewBox="0 0 800 500"
    preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="room-wall" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#3e4849" />
        <stop offset="0.56" stop-color="#465355" />
        <stop offset="1" stop-color="#53656a" />
      </linearGradient>
      <linearGradient id="room-floor" x1="0" y1="0" x2="0.8" y2="1">
        <stop offset="0" stop-color="#303632" />
        <stop offset="1" stop-color="#1c2423" />
      </linearGradient>
      <linearGradient id="day-wall" x1="0" y1="0" x2="1" y2="0.3">
        <stop offset="0" stop-color="#cdcac3" />
        <stop offset=".54" stop-color="#d8d5cd" />
        <stop offset="1" stop-color="#dcd9d1" />
      </linearGradient>
      <linearGradient id="day-floor" x1="0" y1="0" x2="0.9" y2="1">
        <stop offset="0" stop-color="#a9a69e" />
        <stop offset="1" stop-color="#bbb4a9" />
      </linearGradient>
      <pattern id="concrete-grain" width="29" height="23" patternUnits="userSpaceOnUse">
        <path d="M4 6h2M19 15h1M25 3h2" stroke="#696d67" stroke-opacity=".1" stroke-width=".6" />
        <path d="M12 19h2M23 10h1" stroke="#fff" stroke-opacity=".16" stroke-width=".6" />
      </pattern>
      <linearGradient id="day-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#8ebfce" />
        <stop offset="0.62" stop-color="#c5dfe0" />
        <stop offset="1" stop-color="#f1e6cf" />
      </linearGradient>
      <linearGradient id="night-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#172d45" />
        <stop offset="0.58" stop-color="#2f4859" />
        <stop offset="1" stop-color="#536b6b" />
      </linearGradient>
      <linearGradient id="curtain-fabric" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#727c72" />
        <stop offset="0.19" stop-color="#91998b" />
        <stop offset="0.43" stop-color="#657368" />
        <stop offset="0.69" stop-color="#969e90" />
        <stop offset="1" stop-color="#738075" />
      </linearGradient>
      <linearGradient id="curtain-fabric-day" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#a8aa9d" />
        <stop offset=".47" stop-color="#cbcbb9" />
        <stop offset="1" stop-color="#aeb2a5" />
      </linearGradient>
      <pattern id="curtain-folds" width="16" height="12" patternUnits="userSpaceOnUse">
        <path d="M3 0V12M12 0V12" stroke="#26312d" stroke-opacity=".06" stroke-width="1.5" />
      </pattern>
      <linearGradient id="sofa-back" x1="0" y1="0" x2="0.8" y2="1">
        <stop offset="0" stop-color="#9eaf9e" />
        <stop offset="0.65" stop-color="#7e9684" />
        <stop offset="1" stop-color="#526e60" />
      </linearGradient>
      <linearGradient id="sofa-seat" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stop-color="#96aa95" />
        <stop offset="1" stop-color="#627f6d" />
      </linearGradient>
      <linearGradient id="table-top" x1="0" y1="0" x2="0.7" y2="1">
        <stop offset="0" stop-color="#94a99d" />
        <stop offset="1" stop-color="#587569" />
      </linearGradient>
      <radialGradient id="wall-sunlight">
        <stop offset="0" stop-color="#fff4df" stop-opacity=".48" />
        <stop offset=".57" stop-color="#fff4df" stop-opacity=".17" />
        <stop offset="1" stop-color="#fff4df" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="wall-moonlight">
        <stop offset="0" stop-color="#b9d1d9" stop-opacity=".3" />
        <stop offset=".6" stop-color="#b9d1d9" stop-opacity=".1" />
        <stop offset="1" stop-color="#b9d1d9" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="lamp-halo">
        <stop offset="0" :stop-color="lampColor" stop-opacity=".68" data-testid="lamp-halo-color" />
        <stop offset=".38" :stop-color="lampColor" stop-opacity=".26" />
        <stop offset="1" :stop-color="lampColor" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="moon-beam">
        <stop offset="0" stop-color="#c5d9df" stop-opacity=".24" />
        <stop offset=".55" stop-color="#a6bec8" stop-opacity=".08" />
        <stop offset="1" stop-color="#a6bec8" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="day-beam">
        <stop offset="0" stop-color="#fff3d9" stop-opacity=".72" />
        <stop offset=".55" stop-color="#f9e8c3" stop-opacity=".25" />
        <stop offset="1" stop-color="#f9e8c3" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="window-bounce">
        <stop offset="0" stop-color="#fff4dc" stop-opacity=".35" />
        <stop offset="1" stop-color="#fff4dc" stop-opacity="0" />
      </radialGradient>
      <clipPath id="window-glass">
        <path d="M575 162Q575 85 650 82Q725 85 725 162V333L575 343Z" />
      </clipPath>
      <clipPath id="wall-surface">
        <path d="M0 0H800V309L0 355Z" />
      </clipPath>
      <mask id="indoor-light-mask" maskUnits="userSpaceOnUse">
        <rect width="800" height="500" fill="#fff" />
        <path d="M561 162Q561 70 650 68Q739 70 739 162V343L561 356Z" fill="#000" />
      </mask>
      <filter id="room-soft-shadow" x="-30%" y="-40%" width="160%" height="190%">
        <feGaussianBlur stdDeviation="13" />
      </filter>
    </defs>

    <rect width="800" height="500" fill="url(#room-wall)" />
    <path d="M0 355 800 309V500H0Z" fill="url(#room-floor)" />
    <g data-testid="day-room" :style="{ opacity: isDay ? 1 : 0 }">
      <rect width="800" height="500" fill="url(#day-wall)" />
      <path d="M0 355 800 309V500H0Z" fill="url(#day-floor)" />
    </g>
    <g clip-path="url(#wall-surface)">
      <rect width="800" height="355" fill="url(#concrete-grain)" :opacity="isDay ? 0.28 : 0.12" />
      <ellipse cx="665" cy="179" rx="230" ry="206" fill="url(#wall-sunlight)"
        data-testid="wall-daylight" :style="{ opacity: daylight }" />
      <ellipse cx="655" cy="183" rx="198" ry="185" fill="url(#wall-moonlight)"
        data-testid="wall-moonlight" :style="{ opacity: moonlight }" />
    </g>
    <path d="M0 359 800 312" stroke="#6a7467" stroke-opacity=".17" stroke-width="2" />

    <g class="wall-details">
      <path d="M82 99V358M102 96V358M122 94V358M142 92V358" stroke="#a7b09a" stroke-opacity=".12" stroke-width="3" />
      <circle cx="351" cy="143" r="55" fill="#131f22" opacity=".42" />
      <circle cx="351" cy="140" r="49" fill="#526b69" stroke="#a6ad98" stroke-opacity=".62" stroke-width="3" data-testid="wall-art" />
      <path d="M308 157Q336 110 375 124T397 163Q371 197 326 167Z" fill="#9b8c71" opacity=".53" />
      <path d="M315 158Q346 149 376 164T395 169" stroke="#d0bb91" stroke-opacity=".43" stroke-width="3" fill="none" />
    </g>

    <g class="window-scene">
      <path d="M561 162Q561 70 650 68Q739 70 739 162V343L561 356Z" fill="#141f21" data-testid="arched-window" />
      <path d="M575 162Q575 85 650 82Q725 85 725 162V333L575 343Z" fill="url(#night-sky)" />
      <g clip-path="url(#window-glass)">
        <rect x="570" y="75" width="160" height="270" fill="url(#night-sky)" />
        <path d="M558 226Q600 203 636 221T735 205V350H558Z" fill="#3e5861" opacity=".86" />
        <path d="M558 273Q591 232 613 260T664 238Q690 219 714 248L743 223V353H558Z" fill="#2a4750" />
        <path d="M557 302Q593 259 619 285T669 271Q699 256 739 281V354H557Z" fill="#233b45" />
        <path d="M567 330Q580 302 594 310T613 295Q627 286 637 311T662 300Q683 285 693 316T730 297V356H567Z" fill="#1a313b" />
        <circle cx="682" cy="142" r="8" fill="#e3e9df" opacity=".76" />
        <circle cx="686" cy="139" r="8" fill="#263f52" />
        <circle cx="701" cy="179" r="1.4" fill="#d9d9c2" opacity=".38" />
        <g data-testid="day-window" :style="{ opacity: isDay ? 1 : 0 }">
          <rect x="570" y="75" width="160" height="270" fill="url(#day-sky)" />
          <circle cx="676" cy="146" r="18" fill="#f7f1d9" opacity=".62" />
          <path d="M565 253Q615 211 653 245T735 228V350H565Z" fill="#9eb8a8" />
          <path d="M565 287Q614 256 649 278T735 259V350H565Z" fill="#769c88" />
          <path d="M565 318Q616 292 658 306T735 289V350H565Z" fill="#5f8676" />
        </g>
        <path d="M650 82V340" stroke="#243433" stroke-opacity=".7" stroke-width="5" />
        <path d="M652 84V339" stroke="#b2baaa" stroke-opacity=".19" stroke-width="2" />
        <rect x="565" y="65" :width="panelWidth" height="284" :fill="isDay ? 'url(#curtain-fabric-day)' : 'url(#curtain-fabric)'" data-testid="curtain-panel-left" />
        <rect x="565" y="65" :width="panelWidth" height="284" fill="url(#curtain-folds)" opacity=".45" />
        <rect :x="rightPanelX" y="65" :width="panelWidth" height="284" :fill="isDay ? 'url(#curtain-fabric-day)' : 'url(#curtain-fabric)'" data-testid="curtain-panel-right" />
        <rect :x="rightPanelX" y="65" :width="panelWidth" height="284" fill="url(#curtain-folds)" opacity=".45" />
      </g>
      <path d="M561 162Q561 70 650 68Q739 70 739 162V343L561 356Z" stroke="#a9b9aa" stroke-opacity=".4" stroke-width="7" fill="none" />
      <path d="M572 348 731 337" stroke="#b7c2af" stroke-opacity=".28" stroke-width="3" />
    </g>

    <ellipse cx="393" cy="439" rx="258" ry="45" transform="rotate(-6 393 439)" fill="#17211d" opacity=".24" filter="url(#room-soft-shadow)" />
    <ellipse cx="389" cy="432" rx="242" ry="39" transform="rotate(-6 389 432)" fill="#9a9e8e" opacity=".33" />
    <ellipse cx="389" cy="428" rx="228" ry="32" transform="rotate(-6 389 428)" fill="#d0cbb8" opacity=".1" />

    <g class="sofa-scene">
      <ellipse cx="319" cy="425" rx="181" ry="24" fill="#26352e" opacity=".27" />
      <path d="M162 261Q162 239 184 239H433Q456 239 456 262V365H162Z" fill="url(#sofa-back)" />
      <path d="M174 260Q177 250 187 250H433Q442 250 445 260" stroke="#dfd6bd" stroke-opacity=".31" stroke-width="3" fill="none" />
      <path d="M181 270Q181 256 194 256H294Q307 256 307 270V336Q304 345 294 345H194Q184 345 181 336Z" fill="#8ea28e" />
      <path d="M315 270Q315 256 328 256H424Q438 256 438 270V336Q435 345 424 345H328Q318 345 315 336Z" fill="#839987" />
      <path d="M189 272Q192 262 202 262H297M324 272Q327 262 337 262H426" stroke="#d6d3bf" stroke-opacity=".2" stroke-width="2" fill="none" />
      <path d="M309 267V341" stroke="#576c62" stroke-opacity=".46" stroke-width="3" />
      <path d="M174 336Q174 326 185 326H306V371Q302 378 293 379H185Q175 378 174 370Z" fill="url(#sofa-seat)" />
      <path d="M312 326H436Q449 326 449 337V370Q447 378 437 379H324Q315 378 312 371Z" fill="url(#sofa-seat)" />
      <path d="M183 341H305M316 341H439" stroke="#d2d2bb" stroke-opacity=".3" stroke-width="2" />
      <path d="M167 371H452V407Q451 417 440 417H177Q167 417 167 407Z" fill="#526b62" />
      <path d="M177 381H441" stroke="#c6cbb6" stroke-opacity=".26" stroke-width="2" />
      <rect x="136" y="307" width="53" height="94" rx="18" fill="#96a69a" />
      <rect x="432" y="307" width="52" height="94" rx="18" fill="#8fa196" />
      <path d="M143 327Q146 315 160 315H182M438 315H459Q475 315 477 329" stroke="#d2d3bf" stroke-opacity=".32" stroke-width="3" fill="none" />
      <path d="M177 416H190V440H181ZM432 416H446L440 439H432Z" fill="#24332f" />
      <rect x="215" y="281" width="57" height="55" rx="10" transform="rotate(-8 215 281)" fill="#b9876d" />
      <rect x="222" y="287" width="45" height="43" rx="7" transform="rotate(-8 222 287)" fill="#d9a88b" opacity=".4" />
      <rect x="355" y="283" width="55" height="52" rx="9" transform="rotate(7 355 283)" fill="#526d71" />
    </g>

    <g class="coffee-table">
      <path d="M476 389 481 390 469 441 464 443ZM568 382 574 382 587 430 581 432Z" fill="#394b42" />
      <ellipse cx="520" cy="368" rx="86" ry="24" transform="rotate(-8 520 368)" fill="url(#table-top)" />
      <ellipse cx="520" cy="364" rx="83" ry="20" transform="rotate(-8 520 364)" fill="#bac8b5" opacity=".28" />
      <ellipse cx="472" cy="364" rx="15" ry="6" fill="#34443c" opacity=".56" />
      <ellipse cx="471" cy="362" rx="8" ry="4" fill="#d8cfb6" />
      <path d="M519 348 540 345 544 352 522 355Z" fill="#d4d3c1" opacity=".72" />
      <path d="M553 359 576 356 579 362 556 365Z" fill="#344c43" />
    </g>
    <g class="plant-scene">
      <path d="M68 395 95 395 91 436 72 436Z" fill="#846c56" />
      <path d="M70 396Q82 401 94 396" stroke="#b89a77" stroke-opacity=".5" fill="none" />
      <path d="M82 395Q71 346 66 299M82 395Q91 345 100 310M83 388Q104 356 119 343" stroke="#738979" stroke-width="3" fill="none" />
      <path d="M66 299Q43 295 46 274Q66 278 66 299ZM75 353Q48 347 48 328Q71 330 75 353ZM95 325Q101 296 120 295Q117 316 95 325ZM108 357Q123 332 141 339Q132 355 108 357Z" fill="#496858" />
      <path d="M65 319Q79 295 92 299Q87 316 65 319ZM87 377Q99 355 115 362Q106 376 87 377Z" fill="#6a8168" />
    </g>
    <rect data-testid="room-night-shade" width="800" height="500" fill="#071016"
      :style="{ opacity: isDay ? 0 : 0.28 }" />
    <g data-testid="daylight-spill" :style="{ opacity: daylight }">
      <ellipse cx="611" cy="267" rx="192" ry="194" fill="url(#window-bounce)" />
      <ellipse cx="594" cy="402" rx="260" ry="91" transform="rotate(-17 594 402)" fill="url(#day-beam)" />
      <ellipse cx="467" cy="345" rx="129" ry="88" fill="url(#window-bounce)" opacity=".45" />
    </g>
    <g data-testid="moonlight-spill" :style="{ opacity: moonlight }">
      <ellipse cx="617" cy="408" rx="306" ry="99" transform="rotate(-17 617 408)" fill="url(#moon-beam)" />
      <ellipse cx="605" cy="300" rx="92" ry="123" fill="url(#moon-beam)" opacity=".2" />
    </g>
    <g data-testid="lamp-lit-room" mask="url(#indoor-light-mask)" :style="{ opacity: lampPower }">
      <ellipse cx="490" cy="185" rx="145" ry="122" fill="url(#lamp-halo)" opacity=".32" />
      <ellipse cx="485" cy="260" rx="199" ry="160" fill="url(#lamp-halo)" opacity=".48" data-testid="room-light-wash" />
      <ellipse cx="496" cy="259" rx="103" ry="118" fill="url(#lamp-halo)" opacity=".78" />
      <ellipse cx="432" cy="348" rx="108" ry="68" fill="url(#lamp-halo)" opacity=".26" />
      <ellipse cx="514" cy="382" rx="103" ry="67" fill="url(#lamp-halo)" opacity=".37" />
    </g>
    <g class="pendant-lamp" data-testid="pendant-lamp">
      <path d="M498 0V125" stroke="#a8b1a7" stroke-width="4" />
      <path d="M493 123H503V133H493Z" fill="#788984" />
      <path d="M460 185Q462 145 480 135Q499 124 517 136Q535 148 538 185Z" fill="#a2aaa0" />
      <path d="M464 182Q467 151 484 141Q501 132 516 142Q531 152 534 182Z" :fill="lampColor" :opacity="lampPower * 0.84" />
      <ellipse cx="499" cy="184" rx="39" ry="7" fill="#89978d" />
      <ellipse cx="499" cy="185" rx="31" ry="4" :fill="lampColor" :opacity="lampPower * 0.9" data-testid="pendant-emitter" />
    </g>
  </svg>
</template>
