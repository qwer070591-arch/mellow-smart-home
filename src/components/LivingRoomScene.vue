<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  brightness: number;
  colorTemp: number;
  curtainPosition: number;
}>();

const lampPower = computed(() => Math.pow(props.brightness / 100, 1.12));
const curtainOpen = computed(() => props.curtainPosition / 100);
const panelWidth = computed(() => 9 + 74 * (1 - curtainOpen.value));
const rightPanelX = computed(() => 731 - panelWidth.value);
const moonlight = computed(() => Number((curtainOpen.value * (0.55 - 0.4 * lampPower.value)).toFixed(3)));
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
        <stop offset="0" stop-color="#353a38" />
        <stop offset="0.52" stop-color="#252f31" />
        <stop offset="1" stop-color="#1c292e" />
      </linearGradient>
      <linearGradient id="room-floor" x1="0" y1="0" x2="0.8" y2="1">
        <stop offset="0" stop-color="#303632" />
        <stop offset="1" stop-color="#1c2423" />
      </linearGradient>
      <linearGradient id="night-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#374b50" />
        <stop offset="0.58" stop-color="#526e69" />
        <stop offset="1" stop-color="#708173" />
      </linearGradient>
      <linearGradient id="curtain-fabric" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#727c72" />
        <stop offset="0.19" stop-color="#91998b" />
        <stop offset="0.43" stop-color="#657368" />
        <stop offset="0.69" stop-color="#969e90" />
        <stop offset="1" stop-color="#738075" />
      </linearGradient>
      <pattern id="curtain-folds" width="16" height="12" patternUnits="userSpaceOnUse">
        <path d="M3 0V12M12 0V12" stroke="#26312d" stroke-opacity=".15" stroke-width="2" />
      </pattern>
      <linearGradient id="sofa-back" x1="0" y1="0" x2="0.8" y2="1">
        <stop offset="0" stop-color="#b3aa99" />
        <stop offset="0.65" stop-color="#868f85" />
        <stop offset="1" stop-color="#566d69" />
      </linearGradient>
      <linearGradient id="sofa-seat" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stop-color="#a6ab9c" />
        <stop offset="1" stop-color="#62796f" />
      </linearGradient>
      <linearGradient id="table-top" x1="0" y1="0" x2="0.7" y2="1">
        <stop offset="0" stop-color="#a5afa1" />
        <stop offset="1" stop-color="#6e8176" />
      </linearGradient>
      <radialGradient id="lamp-halo">
        <stop offset="0" :stop-color="lampColor" stop-opacity=".53" />
        <stop offset=".48" :stop-color="lampColor" stop-opacity=".2" />
        <stop offset="1" :stop-color="lampColor" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="moon-beam" x1="0" y1="0" x2=".5" y2="1">
        <stop offset="0" stop-color="#d4e1d3" stop-opacity=".32" />
        <stop offset="1" stop-color="#aabfaf" stop-opacity="0" />
      </linearGradient>
      <clipPath id="window-glass">
        <path d="M575 162Q575 85 650 82Q725 85 725 162V333L575 343Z" />
      </clipPath>
      <filter id="room-soft-shadow" x="-30%" y="-40%" width="160%" height="190%">
        <feGaussianBlur stdDeviation="13" />
      </filter>
    </defs>

    <rect width="800" height="500" fill="url(#room-wall)" />
    <path d="M0 355 800 309V500H0Z" fill="url(#room-floor)" />
    <path d="M0 359 800 312" stroke="#6a7467" stroke-opacity=".17" stroke-width="2" />
    <path d="M112 490 512 366 722 422 341 500Z" fill="#a6a799" opacity=".12" />
    <path d="M307 488 565 375 733 424 469 500Z" fill="#1a2420" opacity=".32" />

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
        <path d="M558 226Q600 203 636 221T735 205V350H558Z" fill="#435e54" opacity=".86" />
        <path d="M558 273Q591 232 613 260T664 238Q690 219 714 248L743 223V353H558Z" fill="#344c45" />
        <path d="M557 302Q593 259 619 285T669 271Q699 256 739 281V354H557Z" fill="#273d38" />
        <path d="M567 330Q580 302 594 310T613 295Q627 286 637 311T662 300Q683 285 693 316T730 297V356H567Z" fill="#20332f" />
        <circle cx="681" cy="145" r="3" fill="#d1d8bd" opacity=".55" />
        <circle cx="701" cy="179" r="1.4" fill="#d9d9c2" opacity=".38" />
        <path d="M650 82V340" stroke="#243433" stroke-opacity=".7" stroke-width="5" />
        <path d="M652 84V339" stroke="#b2baaa" stroke-opacity=".19" stroke-width="2" />
        <rect x="565" y="65" :width="panelWidth" height="284" fill="url(#curtain-fabric)" data-testid="curtain-panel-left" />
        <rect x="565" y="65" :width="panelWidth" height="284" fill="url(#curtain-folds)" opacity=".7" />
        <rect :x="rightPanelX" y="65" :width="panelWidth" height="284" fill="url(#curtain-fabric)" data-testid="curtain-panel-right" />
        <rect :x="rightPanelX" y="65" :width="panelWidth" height="284" fill="url(#curtain-folds)" opacity=".7" />
      </g>
      <path d="M561 162Q561 70 650 68Q739 70 739 162V343L561 356Z" stroke="#a9b9aa" stroke-opacity=".4" stroke-width="7" fill="none" />
      <path d="M572 348 731 337" stroke="#b7c2af" stroke-opacity=".28" stroke-width="3" />
    </g>

    <g data-testid="moonlight-spill" :style="{ opacity: moonlight }">
      <path d="M592 332 718 317 792 474 405 492Z" fill="url(#moon-beam)" />
      <path d="M507 393 735 339 782 434 552 495Z" fill="#b6c9b8" opacity=".12" />
    </g>

    <path d="M129 387 470 340 684 419 347 489Z" fill="#0e1614" opacity=".47" filter="url(#room-soft-shadow)" />
    <path d="M164 379 464 338 654 419 338 466Z" fill="#6c746b" opacity=".48" />
    <path d="M185 382 469 348 619 416 332 452Z" fill="#b9bbab" opacity=".15" />
    <path d="M183 396 434 366 515 397 270 434Z" fill="#151d1a" opacity=".21" />

    <g class="sofa-scene">
      <path d="M143 367 452 328 503 389 185 430Z" fill="#111916" opacity=".45" />
      <path d="M143 277Q139 264 154 259L433 218Q450 215 455 228L468 333 160 374Z" fill="url(#sofa-back)" />
      <path d="M151 267 436 226 449 252 162 294Z" fill="#d7d3bf" opacity=".33" />
      <path d="M163 299 457 264 472 334 178 374Z" fill="#89978b" opacity=".54" />
      <path d="M176 343 458 310 502 359 212 397Z" fill="url(#sofa-seat)" />
      <path d="M183 338 456 306 475 326 199 363Z" fill="#d0cdbc" opacity=".22" />
      <path d="M212 394 501 357 497 402 211 438Z" fill="#5b6b62" />
      <path d="M212 397 501 359" stroke="#d5d6c4" stroke-opacity=".25" stroke-width="2" />
      <path d="M132 318Q128 305 141 300L171 294Q180 294 184 307L195 370Q197 383 183 387L149 387Q137 386 135 374Z" fill="#a7b0a2" />
      <path d="M137 306 162 302Q171 301 174 313L183 365Q184 374 175 377L145 375Z" fill="#b9bcae" opacity=".52" />
      <path d="M441 304 466 297Q477 295 483 306L510 350Q518 365 505 373L481 384 458 335Z" fill="#a7b1a4" />
      <path d="M463 311 482 308 503 351Q509 360 499 365L480 373Z" fill="#c1c8b8" opacity=".3" />
      <path d="M167 390 173 390 173 419 168 420ZM463 413 469 412 469 437 465 439Z" fill="#202a25" />
      <path d="M209 293 252 280Q260 279 265 287L282 335Q283 344 275 345L228 352Q218 354 215 346L199 306Q198 298 209 293Z" fill="#bb866a" />
      <path d="M210 303 251 292 270 334 228 343Z" fill="#e2b797" opacity=".34" />
      <path d="M365 266 400 260 412 305 372 312Z" fill="#455d62" />
      <path d="M344 275 363 271 368 311 343 316Z" fill="#d4d2bc" opacity=".4" />
      <path d="M214 360 247 357 286 394 247 401Z" fill="#b8bba8" opacity=".17" />
    </g>

    <g data-testid="lamp-lit-room" :style="{ opacity: lampPower }">
      <ellipse cx="516" cy="166" rx="167" ry="172" fill="url(#lamp-halo)" />
      <path d="M498 181 538 181 643 420 407 413Z" :fill="lampColor" opacity=".11" />
    </g>
    <g class="floor-lamp">
      <path d="M514 194 520 194 520 354 515 355Z" fill="#b6b6a5" />
      <ellipse cx="519" cy="358" rx="26" ry="6" fill="#36453d" />
      <circle cx="517" cy="160" r="35" fill="#9c9b8d" opacity=".56" />
      <circle cx="517" cy="157" r="31" :fill="lampColor" :opacity="0.22 + lampPower * 0.68" />
      <path d="M495 178Q517 190 539 178" stroke="#d7d2b5" stroke-opacity=".64" stroke-width="4" fill="none" />
    </g>

    <g class="coffee-table">
      <path d="M476 389 481 390 469 441 464 443ZM568 382 574 382 587 430 581 432Z" fill="#394b42" />
      <ellipse cx="520" cy="368" rx="86" ry="24" transform="rotate(-8 520 368)" fill="url(#table-top)" />
      <ellipse cx="520" cy="364" rx="83" ry="20" transform="rotate(-8 520 364)" fill="#a7b4a3" opacity=".4" />
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
    <path d="M0 478Q238 447 426 500H0Z" fill="#131d1a" opacity=".2" />
  </svg>
</template>
