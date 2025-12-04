/* --------- 방향키 이벤트 --------- */
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") window.location.href = "4p.html";
  if (e.key === "ArrowLeft") window.location.href = "2p.html";
});

// 타이핑 내용
const text = `
이처럼 지방에 머물던 사투리가<br>
서울이라는 제3의 공간에서 새로운<br>
변화를 겪는 가운데, 사투리의 미래는<br>
어떤 방향으로 흘러갈까?
`;

function startTyped() {
  if (!window.Typed) return;

  new Typed("#typed-3p", {
    strings: [text],
    typeSpeed: 70,
    backSpeed: 0,
    showCursor: false,
    smartBackspace: false,
    contentType: "html"
  });
}

// 타이핑 요소를 폰트 캐싱용으로 한 번 세팅
const dummyTarget = document.getElementById("typed-3p");
dummyTarget.innerHTML = text;
dummyTarget.style.visibility = "hidden";

const TYPE_DELAY = 1300;

window.addEventListener("load", async () => {
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
      await document.fonts.load("1em rixsingose-pro");
    } catch(e) {
      console.warn("폰트 로드 문제", e);
    }
  }

  // 폰트 적용 끝난 후 타이핑 시작
  setTimeout(() => {
    dummyTarget.innerHTML = "";
    dummyTarget.style.visibility = "visible";
    startTyped();
  }, TYPE_DELAY);
});
