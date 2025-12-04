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

const TYPE_DELAY = 1300;

// 폰트 적용 완료까지 기다렸다가 시작
window.addEventListener("load", async () => {
  const target = document.getElementById("typed-3p");
  if (!target) return;

  try {
    // 폰트 다운로드 + 렌더 적용까지
    if (document.fonts) {
      await document.fonts.ready;
      await document.fonts.load("1em rixsingose-pro");
    }
  } catch (e) {
    console.warn("폰트 로드 중 이슈", e);
  }

  setTimeout(startTyped, TYPE_DELAY);
});
