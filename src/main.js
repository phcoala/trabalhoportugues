import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/fraunces/opsz-italic.css";
import "@fontsource-variable/instrument-sans/index.css";
import "@fontsource-variable/newsreader/opsz.css";
import "@fontsource-variable/newsreader/opsz-italic.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import gsap from "gsap";
import mapSvg from "./assets/atlantic-map.svg?raw";
import "./style.css";
import "./chapters.css";
import "./chapters-responsive.css";

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
const pad = (value) => String(value).padStart(2, "0");

const root = document.documentElement;
const app = document.getElementById("app");
const stage = document.getElementById("stage");
const scenes = $$(".scene");
const TOTAL_CHAPTERS = $$(".scene[data-num]").length;
const OUTRO_INDEX = scenes.length - 1;
const hud = document.getElementById("hud");
const hudChapter = $(".hud__chapter");
const hudCurrent = $("[data-nav-current]");
const hudTotal = $("[data-nav-total]");
const hudLabel = $("[data-nav-label]");
const statusEl = document.getElementById("status");
const fx = $("[data-fx]");
const fxUnder = $("[data-fx-under]");
const fxSheet = $("[data-fx-sheet]");
const fxWord = $("[data-fx-word]");
const fxKicker = $("[data-fx-kicker]");
const fxChapter = $("[data-fx-chapter]");
const fxRule = $("[data-fx-rule]");
const indexEl = document.getElementById("index");
const indexItems = $$(".index__item");
const themeLabel = $("[data-theme-label]");
const themeButton = $('[data-action="theme"]');
const readerEl = document.getElementById("reader");
const mediaScene = $(".scene--media");
const mediaPlayer = $("[data-media-player]", mediaScene);
const mediaVideo = $("[data-media-video]", mediaScene);
const mediaFullButton = $("[data-media-full]", mediaScene);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const state = {
  current: 0,
  booted: false,
  transitioning: false,
  indexOpen: false,
  readerOpen: false,
  readerIndex: 3,
  workIndex: 3,
  themeIndex: 0,
  savedFocus: null,
  savedReaderFocus: null,
  hudTimer: null,
  idleTimer: null,
  wheelLock: 0,
  touchStart: null,
};

let activeAmbient = [];
let activeSceneTl = null;
let readerTl = null;
let readerContentTl = null;
let workTl = null;
let readerFlight = null;
let resizeTimer = null;

/* -------------------------------------------------------------------------
   conteúdo — obras: sinopses breves; temas (Igor) ainda aguardam pesquisa
   ------------------------------------------------------------------------- */

const works = [
  {
    year: "2001",
    title: "Campo de Sangue",
    note: "Quatro mulheres depõem sobre um homem acusado.",
    reader: {
      kind: "Romance",
      summary:
        "Quatro mulheres que não se conhecem depõem sobre um homem acusado. Escrita com uma bolsa de criação literária, esta estreia recebeu o Grande Prémio Acontece de Romance.",
      prize: "Grande Prémio Acontece de Romance",
      themes: "Comportamento humano · conflitos psicológicos · violência · ambiguidades morais",
    },
  },
  {
    year: "2005",
    title: "Os Meus Sentimentos",
    note: "Violeta recorda a vida depois de um acidente.",
    reader: {
      kind: "Romance psicológico",
      summary:
        "Violeta, uma mulher obesa que sofre com a rejeição social, recorda a vida depois de um acidente. A narrativa avança em ordem inversa e revela conflitos familiares e afetivos.",
      prize: "Prémio da União Europeia para a Literatura, 2009",
      themes: "Padrões de beleza · solidão e rejeição · memória e identidade · relações humanas",
    },
  },
  {
    year: "2009",
    title: "O Chão dos Pardais",
    note: "Afonso reúne a família na festa dos seus sessenta anos.",
    reader: {
      kind: "Romance",
      summary:
        "Afonso, um homem poderoso perto dos sessenta anos, reúne a família para celebrar o aniversário. A festa expõe tensões e uma tragédia desfaz a aparência de normalidade.",
      prize: "Prémio PEN Clube Português e Prémio Ciranda",
      themes: "Aparências sociais · relações familiares · envelhecimento · amor e poder · solidão",
    },
  },
  {
    year: "2011",
    title: "O Retorno",
    note: "Rui regressa de Angola em 1975.",
    reader: {
      kind: "Romance histórico e social",
      summary:
        "Em 1975, Rui, adolescente português que vive em Angola, regressa com a família a Portugal depois da descolonização. A adaptação envolve dificuldades materiais, preconceito e a perda de referências.",
      prize: "Livro do Ano (Público e Expresso) e Prémio Especial da Crítica",
      themes: "Identidade · exílio e deslocamento · preconceito · memória · história e política",
    },
  },
  {
    year: "2018",
    title: "Eliete",
    note: "Aos 42 anos, Eliete questiona o casamento, a maternidade e a vida que julgava querer.",
    reader: {
      kind: "Romance",
      summary:
        "Eliete, 42 anos, casada e mãe de duas filhas, questiona a vida que julgava ter conquistado quando a avó é hospitalizada. As redes sociais e o Tinder levam-na a rever o casamento, a maternidade e o passado.",
      prize: "2.º lugar no Prémio Oceanos, 2019",
      themes: "Vida cotidiana · identidade feminina · tecnologia e relacionamentos · memória familiar · passagem do tempo",
    },
  },
];

const themes = [
  {
    name: "Incomunicabilidade e Solidão",
    text: "Relações marcadas pelo distanciamento e pela incapacidade de conexão real com o outro.",
    color: "#8fa8bb",
    field: "#1f2c36",
  },
  {
    name: "Autoengano e Fabulação",
    text: "A criação de mentiras e fantasias mentais como fuga da realidade sufocante.",
    color: "#c06b92",
    field: "#2c141d",
  },
  {
    name: "Tédio Existencial",
    text: "A rotina medíocre e a opressão do cotidiano como propulsoras do ato violento.",
    color: "#c9a06a",
    field: "#2e2416",
  },
  {
    name: "Espaço Claustrofóbico",
    text: "Ambientes decadentes e sufocantes que espelham o estado psicológico dos personagens.",
    color: "#a8b880",
    field: "#2b3621",
  },
  {
    name: "Culpa e Simbolismo Religioso",
    text: "Alusões à traição e à queda moral (remetendo ao mito de Judas e Eva).",
    color: "#c45d45",
    field: "#331b16",
  },
  {
    name: "Verdade Fragmentada",
    text: "A construção da identidade do protagonista através do olhar e depoimento de quatro mulheres distintas.",
    color: "#9b8fc4",
    field: "#241f33",
  },
];

const fxChapters = {
  0: { kicker: "Abertura", word: "Vozes e resistência", accent: "var(--accent)" },
  1: { kicker: "01 / Contexto", word: "Um país em mudança", accent: "var(--olive)", number: 1 },
  2: { kicker: "02 / Literatura", word: "Uma literatura em mudança", accent: "var(--accent)", number: 2 },
  3: { kicker: "03 / Autora", word: "Quem é Dulce Maria Cardoso", accent: "var(--rose)", number: 3 },
  4: { kicker: "04 / Obras", word: "Uma obra feita de partidas", accent: "var(--ochre)", number: 4 },
  5: { kicker: "05 / Temas", word: "Análise temática", accent: "var(--accent)", number: 5 },
  6: { kicker: "06 / Forma", word: "A forma do delírio", accent: "var(--slate)", number: 6 },
  7: { kicker: "07 / Trecho", word: "A cena da partida", accent: "var(--olive)", number: 7 },
  8: { kicker: "08 / Resistência", word: "Escrever é resistir", accent: "var(--accent-deep)", number: 8 },
  9: { kicker: "09 / Presente", word: "Os ecos de 1975", accent: "var(--slate)", number: 9 },
  10: { kicker: "10 / Conclusão", word: "Voltar é uma forma de continuar", accent: "var(--ochre)", number: 10 },
  11: { kicker: "11 / Voz", word: "A voz da autora", accent: "var(--rose)", number: 11 },
  12: { kicker: "12 / Perguntas", word: "Perguntas", accent: "var(--slate)", number: 12 },
  13: { kicker: "13 / Frase", word: "A última palavra", accent: "var(--rose)", number: 13 },
  14: { kicker: "Fim / Apresentação", word: "Obrigado pela atenção", accent: "var(--accent)" },
};

/* -------------------------------------------------------------------------
   preparação
   ------------------------------------------------------------------------- */

function splitChars() {
  $$("[data-split]").forEach((element) => {
    if (element.dataset.splitReady === "true") return;
    const text = element.textContent.replace(/\s+/g, " ").trim();
    const fragment = document.createDocumentFragment();
    const chars = [];

    Array.from(text).forEach((character) => {
      const span = document.createElement("span");
      span.className = character === " " ? "char char--space" : "char";
      span.textContent = character === " " ? "\u00a0" : character;
      span.setAttribute("aria-hidden", "true");
      fragment.appendChild(span);
      chars.push(span);
    });

    const accessible = document.createElement("span");
    accessible.className = "sr-only";
    accessible.textContent = text;
    fragment.appendChild(accessible);

    element.replaceChildren(fragment);
    element.dataset.splitReady = "true";
    element._chars = chars;
  });
}

function charsOf(scene, selector) {
  const element = $(selector, scene);
  return element && element._chars ? element._chars : [];
}

function charsIn(scene, selector) {
  return $$(selector, scene).flatMap((element) => element._chars || []);
}

function injectMap() {
  const host = $("[data-map]");
  if (!host) return;
  host.innerHTML = mapSvg;
}

function setRoutePath(path, startHidden = true) {
  if (!path) return 0;
  path.setAttribute("pathLength", "1");
  gsap.set(path, {
    strokeDasharray: 1,
    strokeDashoffset: startHidden ? 1 : 0,
  });
  return 1;
}

function readAccent() {
  return getComputedStyle(root).getPropertyValue("--accent").trim() || "#e23a1c";
}

function routeOverlay(scene, path) {
  const layer = $("[data-route-layer]", scene);
  if (!layer || !path) return null;

  layer.replaceChildren();

  const layerRect = layer.getBoundingClientRect();
  const matrix = path.getScreenCTM();
  if (!matrix || layerRect.width < 2) return null;

  const total = path.getTotalLength();
  if (!total) return null;

  const count = 96;
  const points = [];
  for (let index = 0; index <= count; index += 1) {
    const point = path.getPointAtLength((total * index) / count).matrixTransform(matrix);
    points.push({ x: point.x - layerRect.left, y: point.y - layerRect.top });
  }

  const addPoint = (className, point) => {
    const marker = document.createElement("span");
    marker.className = `context__map-point ${className}`;
    marker.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
    layer.appendChild(marker);
  };

  addPoint("context__map-point--luanda", points[0]);
  addPoint("context__map-point--lisbon", points[count]);

  const dot = document.createElement("span");
  dot.className = "context__route-follower";
  layer.appendChild(dot);

  const duration = 9.5;
  const fade = 0.55;
  const transit = duration - fade;
  const hold = 0.9;
  const cycle = duration + hold;

  const keyframes = [
    { offset: 0, transform: `translate3d(${points[0].x}px, ${points[0].y}px, 0)`, opacity: 0 },
    {
      offset: fade / cycle,
      transform: `translate3d(${points[0].x}px, ${points[0].y}px, 0)`,
      opacity: 1,
    },
  ];

  for (let index = 1; index <= count; index += 1) {
    const time = fade + (index * transit) / count;
    const fadeOut = Math.max(0, (time - (duration - fade)) / fade);
    keyframes.push({
      offset: time / cycle,
      transform: `translate3d(${points[index].x}px, ${points[index].y}px, 0)`,
      opacity: 1 - fadeOut,
    });
  }

  keyframes.push({
    offset: 1,
    transform: `translate3d(${points[count].x}px, ${points[count].y}px, 0)`,
    opacity: 0,
  });

  const animation = dot.animate(keyframes, {
    duration: cycle * 1000,
    iterations: Infinity,
    easing: "linear",
  });
  return {
    kill: () => animation.cancel(),
    pause: () => animation.pause(),
    resume: () => animation.play(),
  };
}

function resetExcerptNotes() {
  const scene = scenes[7];
  const quote = $(".excerpt__quote", scene);
  if (!quote) return;
  quote.classList.remove("has-focus");
  $$("[data-excerpt-note]", scene).forEach((button) => button.setAttribute("aria-pressed", "false"));
  $$("[data-excerpt-note-item]", scene).forEach((item) => item.classList.remove("is-lit"));
  $$("[data-excerpt-ref]", scene).forEach((mark) => {
    mark.classList.remove("is-lit");
    $$(".excerpt__word", mark).forEach((word) => {
      word.style.transitionDelay = "";
    });
  });
}

function toggleExcerptNote(index) {
  const scene = scenes[7];
  const buttons = $$("[data-excerpt-note]", scene);
  const button = buttons[index];
  if (!button) return;

  const nextActive = button.getAttribute("aria-pressed") !== "true";
  const quote = $(".excerpt__quote", scene);
  const items = $$("[data-excerpt-note-item]", scene);
  const marks = $$("[data-excerpt-ref]", scene);

  buttons.forEach((entry, position) => {
    entry.setAttribute("aria-pressed", nextActive && position === index ? "true" : "false");
  });
  items.forEach((item, position) => {
    item.classList.toggle("is-lit", nextActive && position === index);
  });
  marks.forEach((mark, position) => {
    const active = nextActive && position === index;
    $$(".excerpt__word", mark).forEach((word, wordIndex) => {
      word.style.transitionDelay = active ? `${wordIndex * 0.085}s` : "0s";
    });
    mark.classList.toggle("is-lit", active);
  });
  quote.classList.toggle("has-focus", nextActive);

  if (nextActive) {
    announce(`Nota ${pad(index + 1)} iluminada no trecho.`);
  }
}

/* -------------------------------------------------------------------------
   ambiente
   ------------------------------------------------------------------------- */

function addAmbient(tween) {
  if (!tween) return tween;
  activeAmbient.push(tween);
  return tween;
}

function killAmbient() {
  activeAmbient.forEach((tween) => tween.kill());
  activeAmbient = [];
}

function loopTween(target, vars) {
  return addAmbient(
    gsap.to(target, {
      ...vars,
      repeat: -1,
      yoyo: true,
      ease: vars.ease || "sine.inOut",
    })
  );
}

function startAmbient(index) {
  killAmbient();

  if (reduceMotion) return;

  const scene = scenes[index];

  if (index === 1) {
    const path = $(".map__route-dash", scene);
    const follower = routeOverlay(scene, path);

    if (follower) addAmbient(follower);
  }

  if (index === 2) {
    const stamp = $(".literature__stamp", scene);

    if (stamp) loopTween(stamp, { rotate: -5.2, y: -3, duration: 5.6 });
  }

  if (index === 3) {
    const year = $(".author__year", scene);
    const photo = $(".author__photo-frame img", scene);

    loopTween(year, { y: -26, x: 14, duration: 16 });
    loopTween(photo, { scale: 1.11, duration: 12 });
  }

  if (index === 7) {
    const recede = $(".excerpt__recede", scene);

    if (recede) loopTween(recede, { x: -26, scale: 0.5, opacity: 0.25, duration: 4.4 });
  }

  if (index === 9) {
    const board = $(".present__board", scene);
    const spark = $(".present__spark", scene);

    if (board && spark) {
      const travel = board.clientHeight * 0.84;

      gsap.set(spark, { y: -18, opacity: 0 });
      addAmbient(
        gsap
          .timeline({ repeat: -1, repeatDelay: 0.8, defaults: { ease: "sine.inOut" } })
          .to(spark, { opacity: 0.9, duration: 0.5 }, 0)
          .to(spark, { y: travel, duration: 4.4 }, 0)
          .to(spark, { opacity: 0, duration: 0.6 }, 4)
      );
    }
  }

  if (index === 10) {
    const orbit = $(".closing__orbit", scene);

    if (orbit) {
      addAmbient(
        gsap.to(orbit, {
          rotation: 360,
          duration: 80,
          repeat: -1,
          ease: "none",
          transformOrigin: "50% 50%",
        })
      );
    }
  }

  if (index === 12) {
    const orbit = $(".questions__orbit", scene);

    if (orbit) {
      addAmbient(
        gsap.to(orbit, {
          rotation: 360,
          duration: 90,
          repeat: -1,
          ease: "none",
          transformOrigin: "50% 50%",
        })
      );
    }
  }

  if (index === 13) {
    const orbit = $(".mariana__orbit", scene);

    if (orbit) {
      addAmbient(
        gsap.to(orbit, {
          rotation: -360,
          duration: 120,
          repeat: -1,
          ease: "none",
          transformOrigin: "50% 50%",
        })
      );
    }
  }

  if (index === OUTRO_INDEX) {
    const dot = $(".outro__rule-dot", scene);

    if (dot) loopTween(dot, { opacity: 0.45, duration: 3.4 });
  }
}

/* -------------------------------------------------------------------------
   cenas — entradas
   ------------------------------------------------------------------------- */

function enterTitle() {
  const tl = gsap.timeline();
  tl.to({}, { duration: 0.01 });
  return tl;
}

function enterContext() {
  const scene = scenes[1];
  const map = $(".context__map", scene);
  const routeDraw = $(".map__route-draw", scene);
  const routeArrow = $(".map__route-arrow", scene);
  const titleChars = $$(".context__title [data-split]", scene).flatMap((el) => el._chars || []);
  const sub = $(".context__sub", scene);
  const photo = $(".context__photo", scene);
  const frame = $(".context__photo-frame", scene);
  const image = $(".context__photo-frame img", scene);
  const facts = $$(".fact", scene);
  const meta = $(".context__head .meta", scene);
  const mapDetails = $(".map__details", scene);

  setRoutePath(routeDraw);

  gsap.set(map, { opacity: 0, clipPath: "inset(0% 100% 0% 0%)" });
  if (routeArrow) gsap.set(routeArrow, { opacity: 0 });
  if (mapDetails) gsap.set(mapDetails, { opacity: 0 });
  gsap.set(meta, { opacity: 0, y: -8 });
  gsap.set(titleChars, { yPercent: 120, rotate: 2 });
  gsap.set(sub, { opacity: 0, y: 26, rotate: -5, transformOrigin: "left center" });
  gsap.set(photo, { opacity: 0, y: 26 });
  gsap.set(frame, { clipPath: "inset(100% 0% 0% 0%)" });
  gsap.set(image, { scale: 1.18 });
  gsap.set(facts, { opacity: 0, y: 18 });

  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

  tl.to(map, { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 1.35, ease: "expo.inOut" }, 0.1)
    .to(meta, { opacity: 0.56, y: 0, duration: 0.7 }, 0.28)
    .to(titleChars, { yPercent: 0, rotate: 0, duration: 1.1, stagger: 0.035, ease: "expo.out" }, 0.3)
    .to(sub, { opacity: 1, y: 0, rotate: -1.6, duration: 1, ease: "expo.out" }, 0.68)
    .to(photo, { opacity: 1, y: 0, duration: 0.9 }, 0.75)
    .to(frame, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "expo.inOut" }, 0.8)
    .to(image, { scale: 1.05, duration: 1.4 }, 0.8)
    .to(facts, { opacity: 1, y: 0, duration: 0.8, stagger: 0.13 }, 1)
    .to(routeDraw, { strokeDashoffset: 0, duration: 1.9, ease: "power2.inOut" }, 0.55)
    .to(routeArrow, { opacity: 1, duration: 0.5, ease: "power2.out" }, 2.42)
    .to(mapDetails, { opacity: 1, duration: 0.9 }, 1.75);

  return tl;
}

function enterLiterature() {
  const scene = scenes[2];
  const head = $(".chapter-head", scene);
  const titleChars = charsIn(scene, ".literature__title [data-split]");
  const serif = $(".literature__title-line em", scene);
  const lead = $(".literature__lead", scene);
  const moments = $$(".literature__moment", scene);
  const board = $(".literature__board", scene);
  const kicker = $(".literature__board-kicker", scene);
  const boardTitle = $(".literature__board-title", scene);
  const rows = $$(".literature__theme", scene);
  const nums = $$(".literature__theme-num", scene);
  const bars = $$(".literature__redact", scene);
  const foot = $(".literature__board-foot", scene);
  const stamp = $(".literature__stamp", scene);

  gsap.set(head, { opacity: 0, y: -10 });
  gsap.set(titleChars, { yPercent: 122, rotate: 2 });
  gsap.set(serif, { opacity: 0, y: 24, rotate: -2, transformOrigin: "left center" });
  gsap.set(lead, { opacity: 0, y: 16 });
  gsap.set(moments, { opacity: 0, x: -22 });
  gsap.set(board, { opacity: 0, clipPath: "inset(0% 0% 100% 0%)" });
  gsap.set(kicker, { opacity: 0, y: -8 });
  gsap.set(boardTitle, { opacity: 0, y: 14 });
  gsap.set(rows, { opacity: 0, y: 18 });
  gsap.set(nums, { opacity: 0 });
  gsap.set(bars, { scaleX: 1, transformOrigin: "right center" });
  gsap.set(foot, { opacity: 0 });
  gsap.set(stamp, { opacity: 0, scale: 1.5, rotate: -18 });

  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

  tl.to(head, { opacity: 1, y: 0, duration: 0.7 }, 0.05)
    .to(titleChars, { yPercent: 0, rotate: 0, duration: 1.15, stagger: 0.035, ease: "expo.out" }, 0.12)
    .to(serif, { opacity: 1, y: 0, rotate: -1.4, duration: 0.95, ease: "expo.out" }, 0.6)
    .to(lead, { opacity: 0.72, y: 0, duration: 0.85 }, 0.66)
    .to(moments, { opacity: 1, x: 0, duration: 0.85, stagger: 0.12 }, 0.86)
    .to(board, { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 1.05, ease: "expo.inOut" }, 0.34)
    .to(kicker, { opacity: 1, y: 0, duration: 0.6 }, 0.7)
    .to(boardTitle, { opacity: 1, y: 0, duration: 0.75 }, 0.8)
    .to(rows, { opacity: 1, y: 0, duration: 0.8, stagger: 0.09 }, 0.94)
    .to(nums, { opacity: 0.46, duration: 0.5, stagger: 0.09 }, 1.02)
    .to(bars, { scaleX: 0, duration: 0.8, stagger: 0.1, ease: "expo.inOut" }, 1.38)
    .to(foot, { opacity: 1, duration: 0.55 }, 1.75)
    .to(stamp, { opacity: 0.9, scale: 1, rotate: -7, duration: 0.75, ease: "back.out(2.2)" }, 1.92);

  return tl;
}

function enterAuthor() {
  const scene = scenes[3];
  const lines = $$(".author__name [data-split]", scene);
  const allChars = lines.flatMap((line) => line._chars || []);
  const photo = $(".author__photo", scene);
  const frame = $(".author__photo-frame", scene);
  const image = $(".author__photo-frame img", scene);
  const year = $(".author__year", scene);
  const head = $(".author__head", scene);
  const aside = $(".author__aside", scene);
  const facts = $(".author__facts", scene);
  const factRows = facts ? $$("dl > div", facts) : [];

  gsap.set(head, { opacity: 0, y: -10 });
  gsap.set(allChars, { yPercent: 122, rotate: 2 });
  gsap.set(photo, { opacity: 0, x: 38 });
  gsap.set(frame, { clipPath: "inset(0% 0% 0% 100%)" });
  gsap.set(image, { scale: 1.2 });
  gsap.set(year, { opacity: 0, y: 44, x: 0 });
  gsap.set(aside, { opacity: 0, y: 24 });
  gsap.set(facts, { opacity: 0, y: 16 });
  gsap.set(factRows, { opacity: 0, y: 8 });

  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

  tl.to(head, { opacity: 0.56, y: 0, duration: 0.7 }, 0.1)
    .to(allChars, { yPercent: 0, rotate: 0, duration: 1.25, stagger: 0.032, ease: "expo.out" }, 0.16)
    .to(photo, { opacity: 1, x: 0, duration: 1.1 }, 0.45)
    .to(frame, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "expo.inOut" }, 0.5)
    .to(image, { scale: 1.04, duration: 1.5 }, 0.5)
    .to(year, { opacity: 0.09, y: 0, duration: 1.5, ease: "expo.out" }, 0.3)
    .to(aside, { opacity: 1, y: 0, duration: 0.9 }, 0.95)
    .to(facts, { opacity: 1, y: 0, duration: 0.8 }, 1.05)
    .to(factRows, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }, 1.15);

  return tl;
}

const fanMode = window.matchMedia("(min-width: 901px)");

function bookTargets() {
  const scene = scenes[4];
  const stack = $("[data-stack]", scene);
  const books = $$(".book", scene);
  const width = stack?.clientWidth || 800;
  const bookWidth = books[0]?.offsetWidth || 240;
  const farthest = Math.max(state.workIndex, books.length - 1 - state.workIndex, 1);
  const step = Math.min(bookWidth * 0.62, (width * 0.5 - bookWidth * 0.5 - 12) / farthest);

  return books.map((book, index) => {
    const distance = index - state.workIndex;
    const depth = Math.abs(distance);

    return {
      x: distance * step,
      xPercent: -50,
      yPercent: -50,
      y: depth * Math.min(14, window.innerHeight * 0.014),
      z: 0,
      rotation: distance * 4.5 + (depth === 0 ? -2.6 : 0),
      rotationY: distance * -6,
      scale: depth === 0 ? 1.05 : Math.max(0.86, 0.96 - depth * 0.012),
      opacity: 1,
      zIndex: 30 - depth,
    };
  });
}

function applyBookLayout(animate = false) {
  const books = $$(".book", scenes[4]);
  if (!books.length) return;

  if (!fanMode.matches) {
    gsap.killTweensOf(books);
    gsap.set(books, { clearProps: "transform,opacity,zIndex" });
    return;
  }

  const targets = bookTargets();

  books.forEach((book, index) => {
    if (animate && !reduceMotion) {
      gsap.to(book, {
        ...targets[index],
        duration: 0.9,
        delay: Math.abs(index - state.workIndex) * 0.025,
        ease: "power3.out",
        overwrite: "auto",
      });
    } else {
      gsap.set(book, targets[index]);
    }
  });
}

function syncBookState() {
  $$(".book", scenes[4]).forEach((book, index) => {
    const active = index === state.workIndex;
    book.classList.toggle("is-current", active);
    if (active) book.setAttribute("aria-current", "true");
    else book.removeAttribute("aria-current");
  });
}

function syncWorkInfo() {
  const scene = scenes[4];
  const data = works[state.workIndex];
  if (!scene || !data) return;

  $("[data-work-year]", scene).textContent = data.year;
  $("[data-work-title]", scene).textContent = data.title;
  $("[data-work-note]", scene).textContent = data.note;
  $("[data-work-count]", scene).textContent = pad(state.workIndex + 1);
  syncBookState();
}

function updateWork(index, { announceChange = true } = {}) {
  const scene = scenes[4];
  const next = Math.max(0, Math.min(works.length - 1, index));

  if (workTl) workTl.kill();

  if (next === state.workIndex) {
    if (announceChange) applyBookLayout(true);
    return;
  }

  state.workIndex = next;
  const data = works[next];
  const year = $("[data-work-year]", scene);
  const title = $("[data-work-title]", scene);
  const note = $("[data-work-note]", scene);
  const count = $("[data-work-count]", scene);

  syncBookState();
  applyBookLayout(true);

  if (reduceMotion) {
    syncWorkInfo();
  } else {
    workTl = gsap
      .timeline()
      .to(year, { yPercent: -105, opacity: 0, duration: 0.22, ease: "power2.in" })
      .call(() => {
        year.textContent = data.year;
        title.textContent = data.title;
        note.textContent = data.note;
        count.textContent = pad(next + 1);
      })
      .fromTo(
        year,
        { yPercent: 105, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.5, ease: "power4.out" }
      )
      .fromTo(
        title,
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.42, ease: "power3.out" },
        "<"
      )
      .fromTo(note, { y: 10, opacity: 0 }, { y: 0, opacity: 0.76, duration: 0.42, ease: "power3.out" }, "<0.06");
  }

  if (announceChange) announce(`${data.year} · ${data.title}`);
}

function enterWorks() {
  const scene = scenes[4];
  const head = $(".works__head", scene);
  const ghost = $(".works__ghost", scene);
  const current = $(".works__current", scene);
  const hint = $(".works__hint", scene);
  const books = $$(".book", scene);

  syncWorkInfo();
  applyBookLayout(false);

  gsap.set(head, { opacity: 0, y: -14 });
  gsap.set(ghost, { opacity: 0, x: 50 });
  gsap.set(current, { opacity: 0, y: 30 });
  gsap.set(hint, { opacity: 0 });

  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

  tl.to(head, { opacity: 1, y: 0, duration: 0.8 }, 0.1)
    .to(ghost, { opacity: 0.06, x: 0, duration: 1.3, ease: "expo.out" }, 0.2)
    .to(current, { opacity: 1, y: 0, duration: 0.9 }, 0.5)
    .to(hint, { opacity: 0.46, duration: 0.6 }, 0.9);

  if (!fanMode.matches) {
    gsap.set(books, { opacity: 0, y: 28 });
    tl.to(books, { opacity: 1, y: 0, duration: 0.75, stagger: 0.07, ease: "expo.out" }, 0.32);
    return tl;
  }

  const targets = bookTargets();
  const order = books
    .map((book, index) => index)
    .sort((a, b) => Math.abs(a - state.workIndex) - Math.abs(b - state.workIndex));

  gsap.set(books, {
    x: 0,
    y: 70,
    z: -60,
    xPercent: -50,
    yPercent: -50,
    rotation: 0,
    rotationY: 0,
    scale: 0.8,
    opacity: 0,
  });

  order.forEach((bookIndex, orderIndex) => {
    tl.to(
      books[bookIndex],
      {
        ...targets[bookIndex],
        duration: 1.15,
        ease: "expo.out",
      },
      0.35 + orderIndex * 0.08
    );
  });

  return tl;
}

function selectAxis(index, { animate = true } = {}) {
  const scene = scenes[5];
  if (!scene) return;

  const next = ((index % themes.length) + themes.length) % themes.length;
  const changed = next !== state.themeIndex;
  const active = themes[next];
  const number = $("[data-axis-number]", scene);
  const count = $("[data-axis-count]", scene);
  const figure = $(".axes__figure", scene);

  state.themeIndex = next;

  $$("[data-axis]", scene).forEach((row, rowIndex) => {
    const current = rowIndex === next;
    row.classList.toggle("is-current", current);
    row.setAttribute("aria-pressed", current ? "true" : "false");
  });

  if (number) number.textContent = pad(next + 1);
  if (count) count.textContent = pad(next + 1);
  if (figure) figure.style.setProperty("--axis", active.color);

  if (!changed || !animate || reduceMotion) return;

  const desc = $(".axis.is-current .axis__desc-inner", scene);

  if (number) {
    gsap.killTweensOf(number);
    gsap.fromTo(
      number,
      { clipPath: "inset(100% 0 0 0)", yPercent: 16 },
      { clipPath: "inset(0% 0 0 0)", yPercent: 0, duration: 0.8, ease: "expo.out", overwrite: true, clearProps: "clipPath,transform" }
    );
  }

  if (desc) {
    gsap.killTweensOf(desc);
    gsap.fromTo(
      desc,
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", overwrite: true, clearProps: "transform,opacity" }
    );
  }
}

function enterThemes() {
  const scene = scenes[5];
  const head = $(".chapter-head", scene);
  const titleChars = charsIn(scene, ".axes__title .line__inner[data-split]");
  const titleEm = $(".axes__title-line em", scene);
  const lead = $(".axes__lead", scene);
  const figure = $(".axes__figure", scene);
  const number = $("[data-axis-number]", scene);
  const rows = $$(".axis", scene);
  const nums = $$(".axis__num", scene);
  const names = $$(".axis__name", scene);

  selectAxis(state.themeIndex, { animate: false });

  gsap.set(head, { opacity: 0, y: -10 });
  gsap.set(titleChars, { yPercent: 122, rotate: 2 });
  gsap.set(titleEm, { opacity: 0, y: 14 });
  gsap.set(lead, { opacity: 0, y: 14 });
  if (figure) gsap.set(figure, { opacity: 0, y: 24 });
  if (number) gsap.set(number, { clipPath: "inset(100% 0 0 0)" });
  gsap.set(rows, { y: 24 });
  gsap.set([...nums, ...names], { opacity: 0 });

  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

  tl.to(head, { opacity: 1, y: 0, duration: 0.7 }, 0.05)
    .to(titleChars, { yPercent: 0, rotate: 0, duration: 1.1, stagger: 0.028, ease: "expo.out" }, 0.12)
    .to(titleEm, { opacity: 1, y: 0, duration: 0.8 }, 0.5)
    .to(lead, { opacity: 0.7, y: 0, duration: 0.7 }, 0.55)
    .to(rows, { y: 0, duration: 0.85, stagger: 0.055, clearProps: "transform" }, 0.48)
    .to(nums, { opacity: 1, duration: 0.5, stagger: 0.055, clearProps: "opacity" }, 0.6)
    .to(names, { opacity: 1, duration: 0.55, stagger: 0.055, clearProps: "opacity" }, 0.64)
    .to(figure, { opacity: 1, y: 0, duration: 0.9 }, 0.5)
    .to(number, { clipPath: "inset(0% 0 0 0)", duration: 1, ease: "expo.out" }, 0.6);

  return tl;
}

function enterForm() {
  const scene = scenes[6];
  const head = $(".chapter-head", scene);
  const titleChars = charsIn(scene, ".form__title [data-split]");
  const serif = $(".form__title-serif em", scene);
  const lead = $(".form__lead", scene);
  const source = $(".form__source", scene);
  const traits = $$(".form__traits li", scene);

  gsap.set(head, { opacity: 0, y: -10 });
  gsap.set(titleChars, { yPercent: 122, rotate: 2 });
  gsap.set(serif, { opacity: 0, y: 20 });
  gsap.set(lead, { opacity: 0, y: 16 });
  gsap.set(source, { opacity: 0, y: 20 });
  gsap.set(traits, { opacity: 0, x: 34 });

  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

  tl.to(head, { opacity: 1, y: 0, duration: 0.7 }, 0.05)
    .to(titleChars, { yPercent: 0, rotate: 0, duration: 1.15, stagger: 0.035, ease: "expo.out" }, 0.12)
    .to(serif, { opacity: 1, y: 0, duration: 0.95 }, 0.58)
    .to(lead, { opacity: 1, y: 0, duration: 0.85 }, 0.62)
    .to(source, { opacity: 1, y: 0, duration: 0.9 }, 0.56)
    .to(traits, { opacity: 1, x: 0, duration: 0.9, stagger: 0.09 }, 0.72);

  return tl;
}

function enterExcerpt() {
  const scene = scenes[7];
  const head = $(".chapter-head", scene);
  const titleChars = charsIn(scene, ".excerpt__title [data-split]");
  const lead = $(".excerpt__lead", scene);
  const shrink = $(".excerpt__shrink", scene);
  const shrinkWords = $$(".excerpt__shrink-stack span", scene);
  const quote = $(".excerpt__quote", scene);
  const mark = $(".excerpt__mark", scene);
  const paragraphs = $$(".excerpt__quote blockquote p", scene);
  const notes = $(".excerpt__notes", scene);
  const noteItems = $$(".excerpt__notes li", scene);
  const recede = $(".excerpt__recede", scene);

  resetExcerptNotes();
  gsap.set(recede, { x: 0, scale: 1, opacity: 0.7 });
  gsap.set(head, { opacity: 0, y: -10 });
  gsap.set(titleChars, { yPercent: 122, rotate: 2 });
  gsap.set(lead, { opacity: 0, y: 16 });
  gsap.set(shrink, { opacity: 0, y: 14 });
  gsap.set(shrinkWords, { y: 9 });
  gsap.set(quote, { opacity: 0, y: 26, clipPath: "inset(0 0 100% 0)" });
  gsap.set(mark, { opacity: 0 });
  gsap.set(paragraphs, { opacity: 0, y: 18 });
  gsap.set(notes, { opacity: 0, y: 14 });
  gsap.set(noteItems, { opacity: 0, y: 10 });

  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

  tl.to(head, { opacity: 1, y: 0, duration: 0.7 }, 0.05)
    .to(titleChars, { yPercent: 0, rotate: 0, duration: 1.05, stagger: 0.03, ease: "expo.out" }, 0.12)
    .to(lead, { opacity: 1, y: 0, duration: 0.85 }, 0.5)
    .to(shrink, { opacity: 1, y: 0, duration: 0.7 }, 0.62)
    .to(shrinkWords, { y: 0, duration: 0.65, stagger: 0.07, ease: "power3.out" }, 0.7)
    .to(quote, { opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)", duration: 1.2, ease: "expo.inOut" }, 0.38)
    .to(mark, { opacity: 0.92, duration: 0.75 }, 0.82)
    .to(paragraphs, { opacity: 1, y: 0, duration: 0.85, stagger: 0.12 }, 0.85)
    .to(notes, { opacity: 1, y: 0, duration: 0.7 }, 1)
    .to(noteItems, { opacity: 1, y: 0, duration: 0.55, stagger: 0.09 }, 1.12);

  return tl;
}

function enterResist() {
  const scene = scenes[8];
  const head = $(".chapter-head", scene);
  const titleChars = charsIn(scene, ".resist__title [data-split]");
  const lead = $(".resist__lead", scene);
  const glyph = $$(".resist__glyph span", scene);
  const card = $(".resist__card", scene);
  const acts = $$(".resist__acts li", scene);

  gsap.set(head, { opacity: 0, y: -10 });
  gsap.set(titleChars, { yPercent: 122, rotate: 2 });
  gsap.set(lead, { opacity: 0, y: 16 });
  gsap.set(glyph, { scaleY: 0, opacity: 0, transformOrigin: "50% 100%" });
  gsap.set(card, { opacity: 0, y: 30, rotate: 1.4 });
  gsap.set(acts, { opacity: 0, y: 24 });

  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

  tl.to(head, { opacity: 1, y: 0, duration: 0.7 }, 0.05)
    .to(titleChars, { yPercent: 0, rotate: 0, duration: 1.2, stagger: 0.035, ease: "expo.out" }, 0.12)
    .to(lead, { opacity: 0.82, y: 0, duration: 0.85 }, 0.55)
    .to(glyph, { scaleY: 1, opacity: 1, duration: 0.7, stagger: 0.09, ease: "expo.out" }, 0.6)
    .to(card, { opacity: 1, y: 0, rotate: 0.7, duration: 1, ease: "expo.out" }, 0.34)
    .to(acts, { opacity: 1, y: 0, duration: 0.85, stagger: 0.11 }, 0.72);

  return tl;
}

function enterPresent() {
  const scene = scenes[9];
  const head = $(".chapter-head", scene);
  const titleChars = charsIn(scene, ".present__title [data-split]");
  const lead = $(".present__lead", scene);
  const board = $(".present__board", scene);
  const boardHead = $(".present__board-head", scene);
  const rows = $$(".present__row", scene);
  const pastItems = $$(".present__row p:first-child", scene);
  const nowItems = $$(".present__row p:last-child", scene);
  const marks = $$(".present__mark", scene);
  const spark = $(".present__spark", scene);

  gsap.set(head, { opacity: 0, y: -10 });
  gsap.set(titleChars, { yPercent: 122, rotate: 2 });
  gsap.set(lead, { opacity: 0, y: 16 });
  gsap.set(board, { clipPath: "inset(0% 0% 100% 0%)" });
  gsap.set(boardHead, { opacity: 0, y: -10 });
  gsap.set(pastItems, { opacity: 0, x: -24 });
  gsap.set(nowItems, { opacity: 0, x: 24 });
  gsap.set(marks, { scale: 0, opacity: 0 });
  if (spark) gsap.set(spark, { opacity: 0, y: 0 });

  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

  tl.to(head, { opacity: 1, y: 0, duration: 0.7 }, 0.05)
    .to(titleChars, { yPercent: 0, rotate: 0, duration: 1.1, stagger: 0.032, ease: "expo.out" }, 0.12)
    .to(lead, { opacity: 1, y: 0, duration: 0.85 }, 0.55)
    .to(board, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.05, ease: "expo.inOut" }, 0.32)
    .to(boardHead, { opacity: 1, y: 0, duration: 0.7 }, 0.62)
    .to(pastItems, { opacity: 1, x: 0, duration: 0.9, stagger: 0.13 }, 0.78)
    .to(nowItems, { opacity: 1, x: 0, duration: 0.9, stagger: 0.13 }, 0.86)
    .to(marks, { scale: 1, opacity: 1, duration: 0.6, stagger: 0.13, ease: "back.out(2.4)" }, 0.94);

  return tl;
}

function enterClosing() {
  const scene = scenes[10];
  const head = $(".chapter-head", scene);
  const orbit = $(".closing__orbit", scene);
  const titleChars = charsIn(scene, ".closing__title [data-split]");
  const serif = $(".closing__serif em", scene);
  const lead = $(".closing__lead", scene);
  const points = $$(".closing__points li", scene);
  const final = $(".closing__final", scene);
  const foot = $(".closing__foot", scene);

  if (orbit) gsap.set(orbit, { clearProps: "transform" });
  gsap.set(head, { opacity: 0, y: -10 });
  gsap.set(orbit, { opacity: 0, scale: 0.86, rotate: -24 });
  gsap.set(titleChars, { yPercent: 122, rotate: 2 });
  gsap.set(serif, { opacity: 0, y: 18 });
  gsap.set(lead, { opacity: 0, y: 16 });
  gsap.set(points, { opacity: 0, y: 20 });
  gsap.set(final, { opacity: 0, y: 14 });
  gsap.set(foot, { opacity: 0, y: 10 });

  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

  tl.to(head, { opacity: 1, y: 0, duration: 0.7 }, 0.05)
    .to(titleChars, { yPercent: 0, rotate: 0, duration: 1.15, stagger: 0.032, ease: "expo.out" }, 0.12)
    .to(serif, { opacity: 1, y: 0, duration: 0.9 }, 0.62)
    .to(lead, { opacity: 1, y: 0, duration: 0.85 }, 0.55)
    .to(orbit, { opacity: 0.8, scale: 1, rotate: 0, duration: 1.4, ease: "expo.out" }, 0.25)
    .to(points, { opacity: 1, y: 0, duration: 0.8, stagger: 0.12 }, 0.72)
    .to(final, { opacity: 0.82, y: 0, duration: 0.8 }, 1.05)
    .to(foot, { opacity: 1, y: 0, duration: 0.6 }, 1.2);

  return tl;
}

function enterMedia() {
  const scene = scenes[11];
  const head = $(".chapter-head", scene);
  const frame = $(".media__frame", scene);
  const player = $(".media__player", scene);
  const video = $(".media__video", scene);
  const caption = $(".media__screen figcaption", scene);
  const titleChars = charsIn(scene, ".media__title [data-split]");

  gsap.set(head, { opacity: 0, y: -10 });
  gsap.set(player, { opacity: 0, y: 16 });
  gsap.set(frame, { clipPath: "inset(0 0 0 100%)" });
  gsap.set(video, { scale: 1.08 });
  gsap.set(caption, { opacity: 0 });
  gsap.set(titleChars, { yPercent: 122, rotate: 2 });

  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

  tl.to(head, { opacity: 1, y: 0, duration: 0.7 }, 0.05)
    .to(titleChars, { yPercent: 0, rotate: 0, duration: 1.05, stagger: 0.032, ease: "expo.out" }, 0.12)
    .to(player, { opacity: 1, y: 0, duration: 0.75 }, 0.24)
    .to(frame, { clipPath: "inset(0 0 0% 0)", duration: 1.1, ease: "expo.inOut" }, 0.32)
    .to(video, { scale: 1.02, duration: 1.4 }, 0.32)
    .to(caption, { opacity: 0.66, duration: 0.7 }, 1.05);

  return tl;
}

function enterQuestions() {
  const scene = scenes[12];
  const head = $(".chapter-head", scene);
  const titleChars = charsIn(scene, ".questions__title [data-split]");
  const board = $(".questions__board", scene);
  const glyph = $(".questions__glyph", scene);
  const orbit = $(".questions__orbit", scene);
  const list = $(".questions__list", scene);
  const items = $$(".questions__item", scene);
  const dots = $$(".questions__dot", scene);

  items.forEach((item, i) => {
    item.classList.toggle("is-current", i === 0);
    item.setAttribute("aria-hidden", i === 0 ? "false" : "true");
  });
  dots.forEach((dot, i) => dot.classList.toggle("is-current", i === 0));

  if (orbit) gsap.set(orbit, { clearProps: "transform" });
  gsap.set(head, { opacity: 0, y: -10 });
  gsap.set(titleChars, { yPercent: 122, rotate: 2 });
  gsap.set(board, { opacity: 0, clipPath: "inset(0% 0% 100% 0%)" });
  gsap.set(glyph, { opacity: 0, scale: 0.78, rotate: -8 });
  gsap.set(orbit, { opacity: 0, scale: 0.86 });
  gsap.set(list, { opacity: 0, y: 18 });
  gsap.set(dots, { opacity: 0, y: 8 });

  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

  tl.to(head, { opacity: 1, y: 0, duration: 0.7 }, 0.05)
    .to(titleChars, { yPercent: 0, rotate: 0, duration: 1.1, stagger: 0.032, ease: "expo.out" }, 0.12)
    .to(board, { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 1.05, ease: "expo.inOut" }, 0.34)
    .to(glyph, { opacity: 0.14, scale: 1, rotate: 0, duration: 1.2, ease: "expo.out" }, 0.52)
    .to(orbit, { opacity: 0.5, scale: 1, duration: 1.1, ease: "expo.out" }, 0.6)
    .to(list, { opacity: 1, y: 0, duration: 0.7 }, 0.86)
    .to(dots, { opacity: 1, y: 0, duration: 0.6 }, 1.0);

  return tl;
}

function questionsSwap() {
  const scene = scenes[12];
  const list = $(".questions__list", scene);
  const items = $$(".questions__item", scene);
  const dots = $$(".questions__dot", scene);
  const glyph = $(".questions__glyph", scene);
  const index = items.findIndex((item) => item.classList.contains("is-current"));
  const next = (index + 1) % items.length;

  if (reduceMotion) {
    items.forEach((item, i) => {
      item.classList.toggle("is-current", i === next);
      item.setAttribute("aria-hidden", i === next ? "false" : "true");
    });
    dots.forEach((dot, i) => dot.classList.toggle("is-current", i === next));
    return;
  }

  gsap.to(list, {
    opacity: 0,
    y: -10,
    duration: 0.28,
    ease: "power2.in",
    overwrite: "auto",
    onComplete: () => {
      items.forEach((item, i) => {
        item.classList.toggle("is-current", i === next);
        item.setAttribute("aria-hidden", i === next ? "false" : "true");
      });
      dots.forEach((dot, i) => dot.classList.toggle("is-current", i === next));
      gsap.fromTo(list, { y: 10 }, { opacity: 1, y: 0, duration: 0.42, ease: "power2.out" });
      if (glyph) {
        gsap.fromTo(glyph, { scale: 1 }, { scale: 1.06, duration: 0.32, ease: "power2.out", yoyo: true, repeat: 1, overwrite: "auto" });
      }
    },
  });
}

function enterMariana() {
  const scene = scenes[13];
  const head = $(".chapter-head", scene);
  const glyph = $(".mariana__glyph", scene);
  const orbit = $(".mariana__orbit", scene);
  const note = $(".mariana__placeholder", scene);
  const rule = $(".mariana__rule", scene);
  const credit = $(".mariana__credit", scene);

  if (orbit) gsap.set(orbit, { clearProps: "transform" });
  gsap.set(head, { opacity: 0, y: -10 });
  gsap.set(glyph, { opacity: 0, scale: 0.72, rotate: -8 });
  gsap.set(orbit, { opacity: 0, scale: 0.84, rotate: -18 });
  gsap.set(note, { opacity: 0, y: 24 });
  gsap.set(rule, { scaleX: 0, transformOrigin: "center center" });
  if (credit) gsap.set(credit, { opacity: 0, y: 10 });

  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

  tl.to(head, { opacity: 1, y: 0, duration: 0.7 }, 0.05)
    .to(glyph, { opacity: 0.22, scale: 1, rotate: 0, duration: 1.15, ease: "expo.out" }, 0.12)
    .to(orbit, { opacity: 0.7, scale: 1, rotate: 0, duration: 1.35, ease: "expo.out" }, 0.26)
    .to(note, { opacity: 1, y: 0, duration: 0.95, ease: "expo.out" }, 0.48)
    .to(rule, { scaleX: 1, duration: 0.9, ease: "expo.inOut" }, 0.82);

  if (credit) tl.to(credit, { opacity: 0.62, y: 0, duration: 0.6 }, 1.02);

  return tl;
}

function enterOutro() {
  const scene = scenes[OUTRO_INDEX];
  const meta = $(".outro__meta", scene);
  const titleChars = charsIn(scene, ".outro__title [data-split]");
  const em = $(".outro__line--2 em", scene);
  const rule = $(".outro__rule", scene);
  const dot = $(".outro__rule-dot", scene);
  const actions = $$(".outro__actions .text-link", scene);

  gsap.set(meta, { opacity: 0, y: -8 });
  gsap.set(titleChars, { yPercent: 122, rotate: 2 });
  gsap.set(em, { opacity: 0, y: 18 });
  gsap.set(rule, { scaleX: 0, transformOrigin: "center center" });
  gsap.set(dot, { scale: 0, transformOrigin: "center center" });
  gsap.set(actions, { opacity: 0, y: 12 });

  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

  tl.to(meta, { opacity: 0.62, y: 0, duration: 0.7 }, 0.05)
    .to(titleChars, { yPercent: 0, rotate: 0, duration: 1.15, stagger: 0.035, ease: "expo.out" }, 0.14)
    .to(em, { opacity: 1, y: 0, duration: 0.8 }, 0.7)
    .to(rule, { scaleX: 1, duration: 1.05, ease: "expo.inOut" }, 0.82)
    .to(dot, { scale: 1, duration: 0.45, ease: "back.out(2.2)" }, 1.3)
    .to(actions, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }, 1.05);

  return tl;
}

const enterBuilders = [
  enterTitle,
  enterContext,
  enterLiterature,
  enterAuthor,
  enterWorks,
  enterThemes,
  enterForm,
  enterExcerpt,
  enterResist,
  enterPresent,
  enterClosing,
  enterMedia,
  enterQuestions,
  enterMariana,
  enterOutro,
];

function enterScene(index) {
  if (activeSceneTl) activeSceneTl.kill();
  activeSceneTl = enterBuilders[index]();

  if (reduceMotion) {
    activeSceneTl.progress(1);
    return;
  }

  activeSceneTl.eventCallback("onComplete", () => {
    startAmbient(index);
  });
}

/* -------------------------------------------------------------------------
   troca de cena
   ------------------------------------------------------------------------- */

function updateHud(index) {
  const number = scenes[index].dataset.num || "";
  hudCurrent.textContent = number;
  hudTotal.textContent = String(TOTAL_CHAPTERS);
  hudChapter.classList.toggle("is-unnumbered", !number);
  hudLabel.textContent = scenes[index].dataset.label || "";
  hud.classList.toggle("is-end", index === scenes.length - 1);
  indexItems.forEach((item) => {
    const chapter = item.dataset.chapter;
    item.classList.toggle("is-current", chapter !== undefined && Number(chapter) === index);
  });
}

function announce(message) {
  if (!statusEl) return;
  statusEl.textContent = "";
  window.setTimeout(() => {
    statusEl.textContent = message;
  }, 60);
}

function swapScene(next) {
  if (next === state.current) return;
  const previous = scenes[state.current];
  const incoming = scenes[next];

  if (previous === mediaScene) pauseMediaVideo();

  if (activeSceneTl) activeSceneTl.kill();
  killAmbient();

  if (previous.contains(document.activeElement) && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  previous.classList.remove("is-active");
  previous.setAttribute("aria-hidden", "true");
  $$("svg", previous).forEach((svg) => svg.pauseAnimations?.());

  incoming.classList.add("is-active");
  incoming.setAttribute("aria-hidden", "false");
  if (!reduceMotion && !state.readerOpen) {
    $$("svg", incoming).forEach((svg) => svg.unpauseAnimations?.());
  }

  state.current = next;
  app.dataset.scene = String(next);
  setChapterAccent(next);
  updateHud(next);

  enterScene(next);
  const number = incoming.dataset.num;
  announce(
    number
      ? `Capítulo ${number} de ${TOTAL_CHAPTERS} — ${incoming.dataset.label}`
      : next === OUTRO_INDEX
        ? "Fim da apresentação"
        : "Abertura"
  );
}

function setChapterAccent(index) {
  app.style.setProperty("--chapter", fxChapters[index].accent);
}

function renderFxWord(text) {
  fxWord.textContent = "";

  text.split(" ").forEach((word, index, words) => {
    const group = document.createElement("span");
    group.className = "fx-w";
    Array.from(word).forEach((character) => {
      const char = document.createElement("span");
      char.className = "fx-char";
      char.textContent = character;
      group.appendChild(char);
    });
    fxWord.appendChild(group);
    if (index < words.length - 1) fxWord.appendChild(document.createTextNode(" "));
  });

  fxWord.classList.toggle("is-long", text.length > 26);
  return $$(".fx-char", fxWord);
}

function panelTransition(target, direction) {
  const chapter = fxChapters[target];
  const chars = renderFxWord(chapter.word);
  const stagger = chars.length > 26 ? 0.008 : 0.014;
  const enterClip = direction > 0 ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)";
  const exitClip = direction > 0 ? "inset(0% 100% 0% 0%)" : "inset(0% 0% 0% 100%)";

  fxKicker.textContent = chapter.kicker;
  fxChapter.textContent = chapter.number
    ? `${pad(chapter.number)} / ${TOTAL_CHAPTERS}`
    : target === OUTRO_INDEX
      ? "Fim"
      : "";
  fx.style.setProperty("--fx-accent", chapter.accent);
  app.classList.add("is-transitioning");

  const tl = gsap.timeline({
    defaults: { ease: "power4.out" },
    onComplete: () => {
      state.transitioning = false;
      app.classList.remove("is-transitioning");
      gsap.set([fxUnder, fxSheet], { opacity: 0 });
    },
  });

  gsap.set([fxUnder, fxSheet], { opacity: 1, clipPath: enterClip });
  gsap.set([fxKicker, fxChapter], { opacity: 0, y: 12 });
  gsap.set(chars, { opacity: 0, yPercent: 45 });
  gsap.set(fxRule, { scaleX: 0, transformOrigin: direction > 0 ? "0% 50%" : "100% 50%" });

  tl.to(fxUnder, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.62, ease: "expo.out" }, 0)
    .to(fxSheet, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: "expo.inOut" }, 0.035)
    .to(fxKicker, { opacity: 1, y: 0, duration: 0.4 }, 0.3)
    .to(chars, { opacity: 1, yPercent: 0, duration: 0.72, stagger, ease: "expo.out" }, 0.36)
    .to(fxRule, { scaleX: 1, duration: 0.68, ease: "expo.out" }, 0.44)
    .to(fxChapter, { opacity: 1, y: 0, duration: 0.45 }, 0.54)
    .call(() => swapScene(target), null, 0.72)
    .to([fxKicker, fxChapter], { opacity: 0, y: -6, duration: 0.24, ease: "power2.in" }, 1.02)
    .to(chars, { opacity: 0, yPercent: -32, duration: 0.28, stagger: 0.003, ease: "power2.in" }, 1.04)
    .to(fxRule, { scaleX: 0, duration: 0.3, ease: "power2.in" }, 1.04)
    .to(fxSheet, { clipPath: exitClip, duration: 0.62, ease: "expo.inOut" }, 1.06)
    .to(fxUnder, { clipPath: exitClip, duration: 0.62, ease: "expo.inOut" }, 1.1);

  return tl;
}

function goTo(target) {
  if (!state.booted || state.transitioning) return;
  if (target < 0 || target >= scenes.length || target === state.current) return;

  state.transitioning = true;
  wakeChrome();
  const direction = target > state.current ? 1 : -1;

  if (reduceMotion) {
    swapScene(target);
    state.transitioning = false;
    return;
  }

  panelTransition(target, direction);
}

function nextScene() {
  if (state.current < scenes.length - 1) goTo(state.current + 1);
}

function previousScene() {
  if (state.current > 0) goTo(state.current - 1);
}

/* -------------------------------------------------------------------------
   HUD, pausa, tema, tela cheia
   ------------------------------------------------------------------------- */

function showHud() {
  hud.classList.add("is-visible");
  app.classList.remove("is-idle");
  window.clearTimeout(state.hudTimer);
  window.clearTimeout(state.idleTimer);

  state.hudTimer = window.setTimeout(() => {
    if (state.indexOpen || hud.matches(":focus-within")) return;
    hud.classList.remove("is-visible");
  }, 3200);

  state.idleTimer = window.setTimeout(() => {
    if (!state.indexOpen) app.classList.add("is-idle");
  }, 5200);
}

function wakeChrome() {
  showHud();
}

function currentTheme() {
  return root.dataset.theme === "dark" ? "dark" : "light";
}

function syncThemeUI() {
  const theme = currentTheme();
  if (themeLabel) themeLabel.textContent = theme === "dark" ? "Escuro" : "Claro";
  if (themeButton) {
    themeButton.setAttribute(
      "aria-label",
      theme === "dark" ? "Alternar para tema claro" : "Alternar para tema escuro"
    );
  }
  root.style.colorScheme = theme;
}

function toggleTheme(event) {
  const next = currentTheme() === "dark" ? "light" : "dark";

  const commit = () => {
    root.dataset.theme = next;
    try {
      localStorage.setItem("vr-theme", next);
    } catch (error) {
      /* preferência local indisponível */
    }
    syncThemeUI();
  };

  if (reduceMotion || typeof document.startViewTransition !== "function") {
    commit();
    return;
  }

  const buttonRect = themeButton ? themeButton.getBoundingClientRect() : null;
  const x = event && Number.isFinite(event.clientX) && event.clientX > 0 ? event.clientX : (buttonRect ? buttonRect.left + buttonRect.width / 2 : window.innerWidth / 2);
  const y = event && Number.isFinite(event.clientY) && event.clientY > 0 ? event.clientY : (buttonRect ? buttonRect.top + buttonRect.height / 2 : 40);
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  const transition = document.startViewTransition(commit);
  transition.ready.then(() => {
    root.animate(
      {
        clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
      },
      {
        duration: 720,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        pseudoElement: "::view-transition-new(root)",
      }
    );
  }).catch(() => {});
}

function toggleFullscreen() {
  const fullscreenElement = document.fullscreenElement;
  if (!fullscreenElement) {
    if (root.requestFullscreen) {
      root.requestFullscreen().catch(() => {
        announce("Tela cheia indisponível neste navegador");
      });
    }
  } else if (document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
}

function isMediaFullscreen() {
  return Boolean(mediaPlayer && document.fullscreenElement === mediaPlayer);
}

function pauseMediaVideo() {
  if (mediaVideo && !mediaVideo.paused) mediaVideo.pause();
}

function toggleMediaFullscreen() {
  if (!mediaPlayer) return;

  if (isMediaFullscreen()) {
    document.exitFullscreen?.().catch(() => {});
    return;
  }

  const request = mediaPlayer.requestFullscreen
    ? mediaPlayer.requestFullscreen.bind(mediaPlayer)
    : mediaVideo?.webkitEnterFullscreen?.bind(mediaVideo);

  if (!request) {
    announce("Tela cheia indisponível neste navegador");
    return;
  }

  try {
    const result = request();
    if (result && typeof result.catch === "function") {
      result.catch(() => announce("Tela cheia indisponível neste navegador"));
    }
  } catch (error) {
    announce("Tela cheia indisponível neste navegador");
  }
}

function syncFullscreenLabel() {
  const button = $('[data-action="fullscreen"]');
  if (!button) return;
  button.setAttribute("aria-label", document.fullscreenElement ? "Sair da tela cheia" : "Entrar em tela cheia");

  if (mediaFullButton) {
    const active = isMediaFullscreen();
    mediaFullButton.setAttribute("aria-label", active ? "Sair da tela cheia" : "Ver o vídeo em tela cheia");
    mediaFullButton.setAttribute("aria-pressed", String(active));
  }
}

/* -------------------------------------------------------------------------
   índice
   ------------------------------------------------------------------------- */

function indexFocusables() {
  return $$("button:not([disabled])", indexEl).filter((el) => el.offsetParent !== null);
}

function openIndex() {
  if (state.indexOpen) return;
  pauseMediaVideo();
  state.savedFocus = document.activeElement;
  state.indexOpen = true;
  indexEl.classList.add("is-open");
  indexEl.setAttribute("aria-hidden", "false");
  app.classList.add("is-index-open");

  const currentItem = $('.index__item[data-chapter="' + state.current + '"] button', indexEl);
  const firstAvailable = $(".index__item.is-available button", indexEl);
  const closeButton = $('[data-action="close-index"]', indexEl);
  const target = currentItem || firstAvailable || closeButton;

  window.setTimeout(() => {
    if (target) target.focus({ preventScroll: true });
  }, 60);
}

function closeIndex({ restoreFocus = true } = {}) {
  if (!state.indexOpen) return;
  state.indexOpen = false;

  if (restoreFocus && state.savedFocus && typeof state.savedFocus.focus === "function") {
    state.savedFocus.focus({ preventScroll: true });
  }
  state.savedFocus = null;

  indexEl.classList.remove("is-open");
  indexEl.setAttribute("aria-hidden", "true");
  app.classList.remove("is-index-open");
  showHud();
}

function trapIndexFocus(event) {
  const focusables = indexFocusables();
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (!indexEl.contains(document.activeElement)) {
    event.preventDefault();
    first.focus();
    return;
  }

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/* -------------------------------------------------------------------------
   leitor de trechos
   ------------------------------------------------------------------------- */

function readerMarkup(data) {
  const reader = data.reader;
  const parts = [];

  if (reader.summary) parts.push(`<p class="reader__summary">${reader.summary}</p>`);

  const facts = [];
  if (reader.prize) facts.push(`<div><dt>Prémios</dt><dd>${reader.prize}</dd></div>`);
  if (reader.themes) facts.push(`<div><dt>Temas</dt><dd>${reader.themes}</dd></div>`);
  if (facts.length) parts.push(`<dl class="reader__facts">${facts.join("")}</dl>`);

  return parts.join("");
}

function renderReader(index) {
  const data = works[index];
  state.readerIndex = index;

  $("[data-reader-year]", readerEl).textContent = data.year;
  $("[data-reader-kind]", readerEl).textContent = data.reader.kind;
  $("[data-reader-title]", readerEl).textContent = data.title;
  $("[data-reader-count]", readerEl).textContent = `${pad(index + 1)} / ${pad(works.length)}`;

  const cover = $("[data-reader-cover]", readerEl);
  const bookCover = $$(".book", scenes[4])[index]?.querySelector(".book__cover");
  if (bookCover && cover) {
    cover.src = bookCover.currentSrc || bookCover.src;
    cover.alt = `Capa de ${data.title}`;
  }

  $("[data-reader-body]", readerEl).innerHTML = readerMarkup(data);
  $("[data-reader-content]", readerEl).scrollTop = 0;

  $("[data-reader-prev]", readerEl).disabled = index === 0;
  $("[data-reader-next]", readerEl).disabled = index === works.length - 1;
}

function pauseUnderlay() {
  if (activeSceneTl) activeSceneTl.pause();
  activeAmbient.forEach((tween) => tween.pause());
  $$("svg", stage).forEach((svg) => svg.pauseAnimations?.());
}

function resumeUnderlay() {
  if (activeSceneTl) activeSceneTl.resume();
  activeAmbient.forEach((tween) => tween.resume());
  $$("svg", stage).forEach((svg) => svg.unpauseAnimations?.());
}

function openReader(index, trigger) {
  if (state.readerOpen || state.transitioning) return;
  pauseMediaVideo();

  state.readerOpen = true;
  state.savedReaderFocus = trigger || document.activeElement;
  updateWork(index, { announceChange: false });
  renderReader(index);

  readerEl.style.pointerEvents = "";
  readerEl.classList.add("is-open");
  readerEl.setAttribute("aria-hidden", "false");
  app.classList.add("is-reader-open");
  pauseUnderlay();

  const scrim = $(".reader__scrim", readerEl);
  const panel = $(".reader__panel", readerEl);
  const coverCol = $(".reader__cover-col", readerEl);
  const page = $(".reader__page", readerEl);
  const cover = $(".reader__cover", readerEl);
  const coverImage = $("[data-reader-cover]", readerEl);
  const blocks = $$(".reader__content > *", readerEl);

  if (readerTl) readerTl.kill();
  if (readerFlight) {
    readerFlight.remove();
    readerFlight = null;
  }

  if (reduceMotion) {
    gsap.set([scrim, panel, coverCol, cover, page, blocks], { clearProps: "all" });
    gsap.set(scrim, { opacity: 1 });
    window.setTimeout(() => $(".reader__close", readerEl).focus({ preventScroll: true }), 60);
    return;
  }

  const startFace = trigger ? trigger.querySelector(".book__face") || trigger : null;
  const startRect = startFace ? startFace.getBoundingClientRect() : null;
  const targetRect = cover ? cover.getBoundingClientRect() : null;
  const hasTarget = targetRect && targetRect.width > 1 && targetRect.height > 1;
  const startRotation = trigger ? Number(gsap.getProperty(trigger, "rotation")) || 0 : 0;

  if (startRect && hasTarget && coverImage) {
    readerFlight = document.createElement("div");
    readerFlight.className = "reader__flight";
    const flightImage = document.createElement("img");
    flightImage.src = coverImage.currentSrc || coverImage.src;
    flightImage.alt = "";
    readerFlight.appendChild(flightImage);
    readerEl.appendChild(readerFlight);

    gsap.set(readerFlight, {
      position: "fixed",
      left: 0,
      top: 0,
      width: startRect.width,
      height: startRect.height,
      x: startRect.left,
      y: startRect.top,
      rotation: startRotation,
      transformOrigin: "50% 50%",
    });

    gsap.set(scrim, { opacity: 0 });
    gsap.set(panel, { opacity: 0, y: 0, scale: 1 });
    gsap.set(coverCol, { opacity: 0 });
    gsap.set(cover, { opacity: 0, rotate: 0, y: 0 });
    gsap.set(page, { opacity: 0, rotateY: -94, transformOrigin: "0% 50%", transformPerspective: 1600 });
    gsap.set(blocks, { opacity: 0, y: 14 });

    readerTl = gsap
      .timeline({
        onComplete: () => {
          if (readerFlight) {
            readerFlight.remove();
            readerFlight = null;
          }
        },
      })
      .to(scrim, { opacity: 1, duration: 0.38, ease: "power2.out" }, 0)
      .to(panel, { opacity: 1, duration: 0.4, ease: "power2.out" }, 0.18)
      .to(
        readerFlight,
        {
          x: targetRect.left,
          y: targetRect.top,
          width: targetRect.width,
          height: targetRect.height,
          rotation: -1.4,
          duration: 0.84,
          ease: "expo.inOut",
        },
        0.05
      )
      .to(coverCol, { opacity: 1, duration: 0.34, ease: "power2.out" }, 0.48)
      .to(page, { opacity: 1, rotateY: 0, duration: 0.92, ease: "expo.out" }, 0.7)
      .to(cover, { opacity: 1, duration: 0.22 }, 0.82)
      .to(readerFlight, { opacity: 0, duration: 0.2 }, 0.84)
      .to(blocks, { opacity: 1, y: 0, duration: 0.55, stagger: 0.05, ease: "power3.out" }, 0.98);

    window.setTimeout(() => {
      if (state.readerOpen) $(".reader__close", readerEl).focus({ preventScroll: true });
    }, 520);
    return;
  }

  gsap.set(scrim, { opacity: 0 });
  gsap.set(panel, { opacity: 0, y: 34, scale: 0.965 });
  gsap.set(coverCol, { opacity: 1 });
  gsap.set(page, { opacity: 1, rotateY: -22, transformOrigin: "0% 50%" });
  gsap.set(cover, { opacity: 0, y: 16, rotate: -4 });
  gsap.set(blocks, { opacity: 0, y: 14 });

  readerTl = gsap
    .timeline()
    .to(scrim, { opacity: 1, duration: 0.4, ease: "power2.out" }, 0)
    .to(panel, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "expo.out" }, 0.05)
    .to(page, { rotateY: 0, duration: 0.9, ease: "expo.out" }, 0.14)
    .to(cover, { opacity: 1, y: 0, rotate: -1.4, duration: 0.8, ease: "expo.out" }, 0.18)
    .to(blocks, { opacity: 1, y: 0, duration: 0.55, stagger: 0.05, ease: "power3.out" }, 0.3);

  window.setTimeout(() => {
    if (state.readerOpen) $(".reader__close", readerEl).focus({ preventScroll: true });
  }, 90);
}

function closeReader({ restoreFocus = true } = {}) {
  if (!state.readerOpen) return;
  state.readerOpen = false;
  readerEl.style.pointerEvents = "none";
  app.classList.remove("is-reader-open");

  if (readerTl) readerTl.kill();
  if (readerContentTl) readerContentTl.kill();
  if (readerFlight) {
    readerFlight.remove();
    readerFlight = null;
  }

  const scrim = $(".reader__scrim", readerEl);
  const panel = $(".reader__panel", readerEl);

  const finish = () => {
    readerEl.classList.remove("is-open");
    readerEl.setAttribute("aria-hidden", "true");
    readerEl.style.pointerEvents = "";
    if (restoreFocus && state.savedReaderFocus && typeof state.savedReaderFocus.focus === "function") {
      state.savedReaderFocus.focus({ preventScroll: true });
    }
    state.savedReaderFocus = null;
    resumeUnderlay();
    showHud();
  };

  if (reduceMotion) {
    gsap.set([scrim, panel], { clearProps: "all" });
    finish();
    return;
  }

  readerTl = gsap
    .timeline({ onComplete: finish })
    .to(panel, { opacity: 0, y: 26, scale: 0.98, duration: 0.35, ease: "power2.in" }, 0)
    .to(scrim, { opacity: 0, duration: 0.3, ease: "power2.in" }, 0.02);
}

function readerStep(delta) {
  if (!state.readerOpen) return;
  const next = Math.max(0, Math.min(works.length - 1, state.readerIndex + delta));
  if (next === state.readerIndex) return;

  updateWork(next, { announceChange: false });
  renderReader(next);

  if (reduceMotion) return;

  if (readerContentTl) readerContentTl.kill();

  const page = $(".reader__page", readerEl);
  const blocks = $$(".reader__content > *", readerEl);
  const cover = $("[data-reader-cover]", readerEl);

  readerContentTl = gsap
    .timeline()
    .fromTo(page, { rotateY: delta > 0 ? -8 : 8 }, { rotateY: 0, duration: 0.55, ease: "expo.out" }, 0)
    .fromTo(cover, { opacity: 0.25 }, { opacity: 1, duration: 0.45, ease: "power2.out" }, 0)
    .fromTo(
      blocks,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: "power2.out" },
      0.05
    );
}

function readerFocusables() {
  return $$("button:not([disabled]), [href], input, [tabindex]:not([tabindex='-1'])", readerEl).filter(
    (element) => element.offsetParent !== null
  );
}

function trapReaderFocus(event) {
  const focusables = readerFocusables();
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (!readerEl.contains(document.activeElement)) {
    event.preventDefault();
    first.focus();
    return;
  }

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/* -------------------------------------------------------------------------
   eventos
   ------------------------------------------------------------------------- */

function bindEvents() {
  document.addEventListener("pointermove", (event) => {
    if (event.pointerType === "mouse") wakeChrome();
  }, { passive: true });

  document.addEventListener("pointerdown", () => wakeChrome(), { passive: true });

  $$('[data-action="theme"]').forEach((button) => {
    button.addEventListener("click", toggleTheme);
  });

  if (mediaFullButton) {
    mediaFullButton.addEventListener("click", toggleMediaFullscreen);
  }

  $$("[data-axis]", scenes[5]).forEach((row) => {
    row.addEventListener("click", () => selectAxis(Number(row.dataset.axis)));
  });

  $$('[data-action="open-index"]').forEach((button) => {
    button.addEventListener("click", openIndex);
  });

  $$('[data-action="close-index"]').forEach((button) => {
    button.addEventListener("click", () => closeIndex());
  });

  $$('[data-action="fullscreen"]').forEach((button) => {
    button.addEventListener("click", toggleFullscreen);
  });

  $$('[data-action="restart"]').forEach((button) => {
    button.addEventListener("click", () => goTo(0));
  });

  scenes[0].addEventListener("click", () => {
    if (!state.booted || state.current !== 0 || state.transitioning || state.indexOpen || state.readerOpen) return;
    nextScene();
  });

  $$("[data-go]", indexEl).forEach((button) => {
    button.addEventListener("click", () => {
      const target = Number(button.dataset.go);
      closeIndex();
      goTo(target);
    });
  });

  $$(".book", scenes[4]).forEach((book, index) => {
    book.addEventListener("focus", () => {
      if (state.current !== 4 || state.transitioning || state.readerOpen) return;
      if (state.workIndex !== index) updateWork(index, { announceChange: false });
    });

    book.addEventListener("click", () => {
      if (state.current !== 4 || state.transitioning) return;
      openReader(index, book);
      showHud();
    });

    book.addEventListener("pointerenter", () => {
      if (state.current !== 4 || state.transitioning || !fanMode.matches) return;
      gsap.set(book, { zIndex: 60 });
    });

    book.addEventListener("pointerleave", () => {
      if (state.current !== 4 || !fanMode.matches) return;
      gsap.set(book, { zIndex: 30 - Math.abs(index - state.workIndex) });
    });
  });

  $$("[data-excerpt-note]", scenes[7]).forEach((button) => {
    button.addEventListener("click", () => {
      if (state.current !== 7 || state.transitioning) return;
      toggleExcerptNote(Number(button.dataset.excerptNote));
      showHud();
    });
  });

  const questionsBoard = $(".questions__board", scenes[12]);
  if (questionsBoard) {
    questionsBoard.addEventListener("click", () => {
      if (state.current !== 12 || state.transitioning) return;
      questionsSwap();
    });
    questionsBoard.addEventListener("keydown", (event) => {
      if ((event.key === "Enter" || event.key === " ") && state.current === 12 && !state.transitioning) {
        event.preventDefault();
        questionsSwap();
      }
    });
  }

  $$("[data-reader-close]", readerEl).forEach((button) => {
    button.addEventListener("click", () => closeReader());
  });

  const readerPrev = $("[data-reader-prev]", readerEl);
  const readerNext = $("[data-reader-next]", readerEl);
  if (readerPrev) readerPrev.addEventListener("click", () => readerStep(-1));
  if (readerNext) readerNext.addEventListener("click", () => readerStep(1));

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pauseMediaVideo();
      activeAmbient.forEach((tween) => tween.pause());
      $$("svg", stage).forEach((svg) => svg.pauseAnimations?.());
      if (activeSceneTl) activeSceneTl.pause();
      return;
    }

    if (state.readerOpen) return;
    activeAmbient.forEach((tween) => tween.resume());
    $$("svg", stage).forEach((svg) => svg.unpauseAnimations?.());
    if (activeSceneTl) activeSceneTl.resume();
  });

  document.addEventListener("keydown", (event) => {
    if (!state.booted) return;

    const key = event.key;

    if (state.readerOpen) {
      if (key === "Tab") {
        trapReaderFocus(event);
        return;
      }
      if (key === "Escape") {
        event.preventDefault();
        closeReader();
        return;
      }
      if (key === "ArrowRight" || key === "PageDown") {
        event.preventDefault();
        readerStep(1);
        return;
      }
      if (key === "ArrowLeft" || key === "PageUp") {
        event.preventDefault();
        readerStep(-1);
        return;
      }
      return;
    }

    if (state.indexOpen) {
      if (key === "Tab") {
        trapIndexFocus(event);
        return;
      }
      if (key === "Escape") {
        event.preventDefault();
        closeIndex();
        return;
      }
      if (key === "o" || key === "O") {
        event.preventDefault();
        closeIndex();
        return;
      }
      return;
    }

    const mediaFocus = event.target instanceof Element ? event.target.closest(".media__player") : null;
    const videoFocus = event.target === mediaVideo;

    if (isMediaFullscreen()) {
      if (key === "f" || key === "F") {
        event.preventDefault();
        toggleMediaFullscreen();
      }
      return;
    }

    if (mediaFocus && (key === "f" || key === "F")) {
      event.preventDefault();
      toggleMediaFullscreen();
      return;
    }

    if (videoFocus && ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(key)) {
      return;
    }

    if (key === "Escape") return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    const target = event.target instanceof Element ? event.target.closest("button, a, input, [role='button']") : null;
    if (target && (key === " " || key === "Enter")) return;

    switch (key) {
      case "ArrowRight":
      case "PageDown":
        event.preventDefault();
        nextScene();
        break;
      case "ArrowDown":
        event.preventDefault();
        if (state.current === 4 && fanMode.matches) updateWork(state.workIndex + 1);
        else nextScene();
        break;
      case "ArrowLeft":
      case "PageUp":
        event.preventDefault();
        previousScene();
        break;
      case "ArrowUp":
        event.preventDefault();
        if (state.current === 4 && fanMode.matches) updateWork(state.workIndex - 1);
        else previousScene();
        break;
      case "Home":
        event.preventDefault();
        goTo(0);
        break;
      case "End":
        event.preventDefault();
        goTo(scenes.length - 1);
        break;
      case "o":
      case "O":
        event.preventDefault();
        openIndex();
        break;
      case "t":
      case "T":
        event.preventDefault();
        toggleTheme();
        break;
      case "f":
      case "F":
        event.preventDefault();
        toggleFullscreen();
        break;
      case "r":
      case "R":
        event.preventDefault();
        goTo(0);
        break;
      default:
        break;
    }
  });

  document.addEventListener("wheel", (event) => {
    if (!state.booted || state.indexOpen || state.readerOpen || state.transitioning) return;
    if (isMediaFullscreen()) return;
    if (event.target instanceof Element && event.target.closest(".media__player")) return;
    if (event.ctrlKey) return;

    const now = performance.now();
    if (now < state.wheelLock) return;

    const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (Math.abs(delta) < 26) return;

    state.wheelLock = now + 950;
    if (delta > 0) nextScene();
    else previousScene();
  }, { passive: true });

  stage.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 1) return;
    if (event.target instanceof Element && event.target.closest("button, .media__player, video")) return;
    state.touchStart = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  }, { passive: true });

  stage.addEventListener("touchend", (event) => {
    if (!state.touchStart) return;
    if (isMediaFullscreen()) {
      state.touchStart = null;
      return;
    }
    const touch = event.changedTouches[0];
    const dx = touch.clientX - state.touchStart.x;
    const dy = touch.clientY - state.touchStart.y;
    state.touchStart = null;

    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.35) return;
    if (dx < 0) nextScene();
    else previousScene();
  }, { passive: true });

  document.addEventListener("fullscreenchange", syncFullscreenLabel);

  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const animating = activeSceneTl && activeSceneTl.isActive();
      if (!state.readerOpen && !state.transitioning && !animating) {
        if (state.current === 4) applyBookLayout(false);
        startAmbient(state.current);
      }
    }, 160);
  });
}

/* -------------------------------------------------------------------------
   início
   ------------------------------------------------------------------------- */

function start() {
  splitChars();
  injectMap();
  bindEvents();
  syncThemeUI();
  syncFullscreenLabel();
  setChapterAccent(0);
  updateHud(0);
  syncWorkInfo();

  $$("svg").forEach((svg) => {
    if (reduceMotion || !svg.closest(".scene.is-active")) svg.pauseAnimations?.();
  });

  state.booted = true;
  enterScene(0);
  app.classList.add("is-ready");
  showHud();
}

const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
const timeout = new Promise((resolve) => window.setTimeout(resolve, 1200));
Promise.race([fontsReady, timeout]).then(start).catch(start);
