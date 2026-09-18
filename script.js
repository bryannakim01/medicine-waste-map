
function categoryOf(type) {
  if (type === "있음") return "dedicated";
  if (type.includes("폐기물조례")) return "waste";
  if (type.includes("제한적")) return "limited";
  return "none";
}

const counts = {
  dedicated: MUNICIPAL_DATA.filter(d => categoryOf(d.type) === "dedicated").length,
  waste: MUNICIPAL_DATA.filter(d => categoryOf(d.type) === "waste").length,
  limited: MUNICIPAL_DATA.filter(d => categoryOf(d.type) === "limited").length,
  none: MUNICIPAL_DATA.filter(d => categoryOf(d.type) === "none").length
};

const summaryMeta = [
  ["dedicated", "전용 조례"],
  ["waste", "폐기물 조례에서 규정"],
  ["limited", "제한적 규정"],
  ["none", "관련 조례 없음"]
];

const summaryCards = document.querySelector("#summaryCards");
summaryMeta.forEach(([key, label]) => {
  const card = document.createElement("div");
  card.className = "summary-card";
  card.innerHTML = `<div class="summary-number">${counts[key]}</div><div class="summary-label">${label}</div>`;
  summaryCards.appendChild(card);
});

function typeClass(type) {
  const c = categoryOf(type);
  if (c === "dedicated") return "type-dedicated";
  if (c === "waste") return "type-waste";
  if (c === "limited") return "type-limited";
  return "type-none";
}

function typeLabel(type) {
  const c = categoryOf(type);
  if (c === "dedicated") return "폐의약품 관련 전용 조례";
  if (c === "waste") return "폐기물 조례에서 규정";
  if (c === "limited") return "제한적 규정";
  return "관련 조례 없음";
}

function yesNo(value) {
  if (!value || value === "-") return "명시 없음";
  return value;
}

function detailHTML(d) {
  return `
    <span class="badge">${typeLabel(d.type)}</span>
    <h3>${d.sido} ${d.sigungu}</h3>
    <dl class="info-grid">
      <dt>조례명</dt><dd>${d.ordinance || "관련 조례 없음"}</dd>
      <dt>배출방법</dt><dd>${yesNo(d.disposal)}</dd>
      <dt>수거장소</dt><dd>${d.collection || "명시 없음"}</dd>
      <dt>약국 수거</dt><dd>${yesNo(d.pharmacy)}</dd>
      <dt>우체통</dt><dd>${yesNo(d.postbox)}</dd>
      <dt>종량제</dt><dd>${yesNo(d.trashbag)}</dd>
      <dt>근거 조문</dt><dd>${d.article || "—"}</dd>
      <dt>담당 부서</dt><dd>${d.department || "—"}</dd>
      <dt>확인일</dt><dd>${d.checked || "—"}</dd>
      <dt>비고</dt><dd>${d.note || "—"}</dd>
    </dl>`;
}

const tileMap = document.querySelector("#tileMap");
const tileDetail = document.querySelector("#tileDetail");
const bySido = Object.groupBy
  ? Object.groupBy(MUNICIPAL_DATA, d => d.sido)
  : MUNICIPAL_DATA.reduce((acc, d) => ((acc[d.sido] ||= []).push(d), acc), {});

Object.keys(bySido).sort((a,b) => a.localeCompare(b, "ko")).forEach(sido => {
  const group = document.createElement("section");
  group.className = "region-group";
  group.innerHTML = `<h3 class="region-title">${sido} <span class="muted">${bySido[sido].length}곳</span></h3>`;
  const tiles = document.createElement("div");
  tiles.className = "tiles";
  bySido[sido].forEach(d => {
    const b = document.createElement("button");
    b.className = `tile ${typeClass(d.type)}`;
    b.title = `${d.sido} ${d.sigungu} · ${typeLabel(d.type)}`;
    b.setAttribute("aria-label", b.title);
    b.dataset.type = categoryOf(d.type);
    b.dataset.postbox = d.postbox === "O" ? "true" : "false";
    b.dataset.pharmacy = d.pharmacy === "O" ? "true" : "false";
    b.addEventListener("click", () => tileDetail.innerHTML = detailHTML(d));
    tiles.appendChild(b);
  });
  group.appendChild(tiles);
  tileMap.appendChild(group);
});

let activeOrdinanceFilter = "all";
let activeCollectionFilter = "all";

const postboxCount = MUNICIPAL_DATA.filter(d => d.postbox === "O").length;
const pharmacyCount = MUNICIPAL_DATA.filter(d => d.pharmacy === "O").length;
document.querySelector("#postboxCount").textContent = `(${postboxCount})`;
document.querySelector("#pharmacyCount").textContent = `(${pharmacyCount})`;

function applyFilters() {
  document.querySelectorAll(".tile").forEach(tile => {
    const ordinanceMatch = activeOrdinanceFilter === "all" || tile.dataset.type === activeOrdinanceFilter;
    const collectionMatch = activeCollectionFilter === "all" || tile.dataset[activeCollectionFilter] === "true";
    tile.classList.toggle("hidden", !(ordinanceMatch && collectionMatch));
  });
}

document.querySelectorAll(".ordinance-filter").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".ordinance-filter").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    const filterMap = {"있음":"dedicated","있음(폐기물조례)":"waste","있음(제한적)":"limited","없음":"none"};
    activeOrdinanceFilter = filterMap[btn.dataset.filter] || "all";
    applyFilters();
  });
});

document.querySelectorAll(".collection-filter").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".collection-filter").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    activeCollectionFilter = btn.dataset.collection || "all";
    applyFilters();
  });
});

const pairNames = [
  ["강원특별자치도", "속초시"],
  ["강원특별자치도", "양양군"]
];
const pair = pairNames.map(([sido, sigungu]) => MUNICIPAL_DATA.find(d => d.sido === sido && d.sigungu === sigungu));
const comparison = document.querySelector("#comparison");
if (pair.every(Boolean)) {
  comparison.innerHTML = `
    <article class="compare-card">${detailHTML(pair[0])}</article>
    <div class="compare-arrow" aria-hidden="true">→</div>
    <article class="compare-card">${detailHTML(pair[1])}</article>`;
}

const sidoSelect = document.querySelector("#sidoSelect");
const sigunguSelect = document.querySelector("#sigunguSelect");
const searchButton = document.querySelector("#searchButton");
const searchResult = document.querySelector("#searchResult");

[...new Set(MUNICIPAL_DATA.map(d => d.sido))].sort((a,b) => a.localeCompare(b, "ko")).forEach(sido => {
  const opt = document.createElement("option");
  opt.value = opt.textContent = sido;
  sidoSelect.appendChild(opt);
});

sidoSelect.addEventListener("change", () => {
  const sido = sidoSelect.value;
  sigunguSelect.innerHTML = `<option value="">${sido ? "선택하세요" : "먼저 시·도를 선택하세요"}</option>`;
  sigunguSelect.disabled = !sido;
  searchButton.disabled = true;
  if (!sido) return;
  MUNICIPAL_DATA.filter(d => d.sido === sido)
    .sort((a,b) => a.sigungu.localeCompare(b.sigungu, "ko"))
    .forEach(d => {
      const opt = document.createElement("option");
      opt.value = opt.textContent = d.sigungu;
      sigunguSelect.appendChild(opt);
    });
});

sigunguSelect.addEventListener("change", () => {
  searchButton.disabled = !sigunguSelect.value;
});

searchButton.addEventListener("click", () => {
  const d = MUNICIPAL_DATA.find(d => d.sido === sidoSelect.value && d.sigungu === sigunguSelect.value);
  searchResult.innerHTML = d ? `<div class="result-card">${detailHTML(d)}</div>` : "";
  if (d) searchResult.scrollIntoView({behavior: "smooth", block: "nearest"});
});
