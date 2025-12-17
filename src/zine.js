
// src/zine.js
// -----------------------------
// 1. Firebase 초기화
// -----------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAXXGpxXnHjeuWcNlKEsJjnsP7yzcJ9T1w",
  authDomain: "saturi-project.firebaseapp.com",
  projectId: "saturi-project",
  storageBucket: "saturi-project.firebasestorage.app",
  messagingSenderId: "132957287766",
  appId: "1:132957287766:web:431ec968d24ba16c6112f7",
  measurementId: "G-3GD7BD4D6M",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function getRegion() {
  const canvas2 = document.querySelector(".canvas2");
  return canvas2?.dataset?.region || "ks";
}

function getInputsCollectionName() {
  return `inputs_${getRegion()}`;
}

// -----------------------------
// 2. 전역 변수
// -----------------------------
let engine;
let world;
let render;
let runner;
let matterWidth = 0;
let matterHeight = 0;

let bodyToElement = new Map();
let inputEl;
let isSaving = false;


// -----------------------------
// 3. Matter.js 세팅 (canvas2 / matter-container 기준)
// -----------------------------
function initMatter() {
  if (window.__matterInitialized) {
    console.log("[Matter] already initialized");
    return false;
  }
  window.__matterInitialized = true;

  const matterContainer = document.getElementById("matter-container");
  if (!matterContainer || !window.Matter) {
    console.warn("[Matter] container or Matter.js not found");
    return false;
  }

  const { Engine, Render, Runner, Bodies, Composite, Events } = window.Matter;

  // ✅ matter-container 크기 기준
  matterWidth = matterContainer.clientWidth;
  matterHeight = matterContainer.clientHeight;

  console.log("[Matter] size", matterWidth, matterHeight);

  if (!matterWidth || !matterHeight) {
    // 혹시 0 나오면 대충이라도 값 넣기
    matterWidth = window.innerWidth;
    matterHeight = 900;
    console.warn("[Matter] fallback size", matterWidth, matterHeight);
  }

  engine = Engine.create();
  world = engine.world;

  render = Render.create({
    element: matterContainer,
    engine,
    options: {
      width: matterWidth,
      height: matterHeight,
      wireframes: false,
      background: "transparent",
    },
  });

  Render.run(render);
  runner = Runner.create();
  Runner.run(runner, engine);

  // 🔻 바닥 + 양 옆 벽
  const floorHeight = 40;
  const floorY = matterHeight - floorHeight / 2;

  const floor = Bodies.rectangle(
    matterWidth / 2,
    floorY,
    matterWidth,
    floorHeight,
    {
      isStatic: true,
      render: { visible: false },
    }
  );

  const wallThickness = 60;
  const leftWall = Bodies.rectangle(
    -wallThickness / 2,
    matterHeight / 2,
    wallThickness,
    matterHeight,
    {
      isStatic: true,
      render: { visible: false },
    }
  );
  const rightWall = Bodies.rectangle(
    matterWidth + wallThickness / 2,
    matterHeight / 2,
    wallThickness,
    matterHeight,
    {
      isStatic: true,
      render: { visible: false },
    }
  );

  Composite.add(world, [floor, leftWall, rightWall]);

  bodyToElement = new Map();

  // 🔻 물리 위치 → DOM 위치
  Events.on(engine, "afterUpdate", () => {
    bodyToElement.forEach((el, body) => {
      const x = body.position.x;
      const y = body.position.y;
      const angle = body.angle;

      const w = el.offsetWidth || 0;
      const h = el.offsetHeight || 0;

      el.style.transform = `translate(${x - w / 2}px, ${
        y - h / 2
      }px) rotate(${angle}rad)`;
    });
  });

  return true;
}

// -----------------------------
// 4. 글자 하나 떨어뜨리기
// -----------------------------


function spawnFallingText(text) {
  if (!text || !engine || !world) return;

  const matterContainer = document.getElementById("matter-container");
  if (!matterContainer) return;

  const { Bodies, Composite } = window.Matter;

  const el = document.createElement("div");
  el.className = "falling-text";
  el.textContent = text;
  matterContainer.appendChild(el);

  // 초기 위치는 화면 바깥
  el.style.transform = "translate(-9999px, -9999px)";
  const bbox = el.getBoundingClientRect();
  const w = bbox.width || 80;
  const h = bbox.height || 30;

  // 🔻 canvas2(=matter-container) 맨 위, 왼쪽 10~35% 범위에서 스폰
  const x = matterWidth * (0.1 + 0.25 * Math.random());
  const y = -h; // 섹션 맨 위에서 살짝 위

  console.log("[spawnFallingText]", text, "→", x, y);

  const body = Bodies.rectangle(x, y, w, h, {
    restitution: 0.2,
    friction: 0.8,
    density: 0.001,
  });

  body.render.visible = false;
  body.isStatic = true;
  bodyToElement.set(body, el);
  Composite.add(world, body);

  setTimeout(() => {
    body.isStatic = false;
  }, 2000);
}

// -----------------------------
// 5. Firestore 저장 / 불러오기
// -----------------------------
async function saveText() {
  if (!inputEl) return;

  const value = inputEl.innerText.trim();
  if (!value) return;

  if (isSaving) return;
  isSaving = true;

  try {
    await addDoc(collection(db, getInputsCollectionName()), {
  text: value,
  created: Date.now(),
});


    spawnFallingText(value);
    inputEl.innerHTML = "";
  } finally {
    setTimeout(() => {
      isSaving = false;
    }, 50);
  }
}


async function loadExistingTexts() {
const inputsCol = collection(db, getInputsCollectionName());
  const q = query(inputsCol, orderBy("created", "asc"));
  const snapshot = await getDocs(q);

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data && data.text) {
      spawnFallingText(data.text);
    }
  });
}

// -----------------------------
// 6. 입력 이벤트
// -----------------------------
function setupInput() {
  inputEl = document.getElementById("dialectInput");
  if (!inputEl) return;

  if (window.__dialectInputBound) return;
  window.__dialectInputBound = true;

  inputEl.addEventListener("keydown", (e) => {
    if (e.isComposing) return;
    if (e.key === "Enter") {
      e.preventDefault();
      saveText();
    }
  });
}

// -----------------------------
// 7. 초기화 (Matter + Firestore) → 스크롤 시 시작
// -----------------------------
let canvas2EffectStarted = false;

async function startCanvas2Effects() {
  if (canvas2EffectStarted) return;   // 중복 방지
  canvas2EffectStarted = true;

  const hasHay = document.getElementById("hay");
  const hasDialect = document.getElementById("dialectInput");
  const hasMatterContainer = document.getElementById("matter-container");

  if (!hasHay || !hasDialect || !hasMatterContainer) {
    console.warn("[init] required elements not found");
    return;
  }

  const ok = initMatter();
  if (!ok) return;

  setupInput();


  await loadExistingTexts();
}












window.addEventListener("load", () => {
  const explainBox = document.getElementById("floating-explain");
  const explainImg = document.getElementById("explainImg");
  const lines = document.querySelectorAll(".line"); // 클래스 이름 일치 확인!

  let lastHoveredLine = null;

  function positionExplainBox() {
    if (!lastHoveredLine || !explainBox || !explainImg) return;

    const rectLine    = lastHoveredLine.getBoundingClientRect();
    const rectExplain = explainBox.getBoundingClientRect();

    // line 기준으로 왼쪽 20px
    const left = rectLine.left + window.scrollX - rectExplain.width - 20;

    // 세로는 같은 선상(가운데 정렬)
    const top  = rectLine.top + window.scrollY
               + rectLine.height / 2
               - rectExplain.height / 2;

    explainBox.style.left = left + "px";
    explainBox.style.top  = top + "px";
  }

  lines.forEach(line => {
    line.addEventListener("mouseenter", () => {
      const key = line.dataset.explain;
      if (!key || !explainImg || !explainBox) return;

      lastHoveredLine = line;
const region = getRegion();
explainImg.src = `./zine/${region}/${key}.svg`;
      explainBox.style.display = "block";

      if (explainImg.complete) {
        positionExplainBox();
      } else {
        explainImg.onload = positionExplainBox;
      }
    });

    line.addEventListener("mouseleave", () => {
      explainBox.style.display = "none";
      lastHoveredLine = null;
    });
  });
});





let canvas2Started = false;  // 한 번만 시작하게 플래그

function handleCanvas2Scroll() {
  const canvas2 = document.querySelector(".canvas2");
  if (!canvas2) return;

  const rect = canvas2.getBoundingClientRect();
  const triggerPoint = window.innerHeight * 0.7;

  if (rect.top < triggerPoint && !canvas2Started) {
    canvas2Started = true;
    canvas2.classList.add("active");

    startCanvas2Effects();   // ✨ 여기서 아래쪽 이벤트 시작

    window.removeEventListener("scroll", handleCanvas2Scroll);
  }
}

window.addEventListener("scroll", handleCanvas2Scroll);
window.addEventListener("load", handleCanvas2Scroll);


const PAGE_ORDER = ["ks", "jr", "cc", "kw", "jj"];

function goToNextPage() {
  const current = getRegion();
  const idx = PAGE_ORDER.indexOf(current);

  if (idx === -1) return;

  // 🔥 마지막(jj)에서 인터랙티브 페이지로
  if (idx === PAGE_ORDER.length - 1) {
    window.location.href = "./interactive.html";
    return;
  }

  const next = PAGE_ORDER[idx + 1];
  window.location.href = `./${next}_zine.html`;
}


function goToPrevPage() {
  const current = getRegion();
  const idx = PAGE_ORDER.indexOf(current);

  if (idx <= 0) return; // ks면 멈춤

  const prev = PAGE_ORDER[idx - 1];
  window.location.href = `./${prev}_zine.html`;
}

window.addEventListener("keydown", (e) => {
  // 입력 중이면 막기 (contenteditable + input/textarea)
  const active = document.activeElement;
  const isTyping =
    (active && active.isContentEditable) ||
    (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA"));

  if (isTyping) return;

  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
    e.preventDefault();
    goToNextPage();
  }

  if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
    e.preventDefault();
    goToPrevPage();
  }
});

