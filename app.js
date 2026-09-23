const KEY = "fg-record-v1";
const defaultState = {
  characters: ["不明"],
  players: ["不明"],
  records: []
};
let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(defaultState);
    const x = JSON.parse(raw);
    return {
      characters: Array.isArray(x.characters) && x.characters.length ? x.characters : ["不明"],
      players: Array.isArray(x.players) && x.players.length ? x.players : ["不明"],
      records: Array.isArray(x.records) ? x.records : []
    };
  } catch { return structuredClone(defaultState); }
}
function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
const $ = s => document.querySelector(s);
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function toast(msg) {
  const el = $("#toast"); el.textContent = msg; el.classList.add("show");
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("show"), 1800);
}
function options(list, selected) {
  return list.map(v => `<option value="${escapeHtml(v)}" ${v===selected?'selected':''}>${escapeHtml(v)}</option>`).join("");
}
function renderSelects() {
  const my = $("#myCharacter").value, op = $("#opponentPlayer").value;
  $("#myCharacter").innerHTML = options(state.characters, state.characters.includes(my) ? my : state.characters[0]);
  $("#opponentPlayer").innerHTML = options(state.players, state.players.includes(op) ? op : state.players[0]);
  document.querySelectorAll(".opponent-character").forEach(sel => {
    const v = sel.value;
    sel.innerHTML = options(state.characters, state.characters.includes(v) ? v : state.characters[0]);
  });
}
function addRow(result="win", character="不明") {
  const row = document.createElement("div");
  row.className = "match-row";
  row.innerHTML = `
    <label>相手キャラ
      <select class="opponent-character">${options(state.characters, state.characters.includes(character) ? character : state.characters[0])}</select>
    </label>
    <label>結果
      <div class="result">
        <button type="button" class="win ${result==='win'?'selected':''}" data-result="win">勝</button>
        <button type="button" class="loss ${result==='loss'?'selected':''}" data-result="loss">負</button>
      </div>
    </label>
    <button type="button" class="remove-row" aria-label="行を削除">×</button>`;
  row.querySelectorAll(".result button").forEach(b => b.onclick = () => {
    row.querySelectorAll(".result button").forEach(x => x.classList.remove("selected"));
    b.classList.add("selected");
  });
  row.querySelector(".remove-row").onclick = () => {
    if ($("#matchRows").children.length > 1) row.remove();
    else toast("最低1件は入力してください");
  };
  $("#matchRows").appendChild(row);
}
function renderSettings() {
  $("#playerList").innerHTML = state.players.map((name,i) => `
    <div class="setting-item">
      <span>${escapeHtml(name)}</span>
      <div class="setting-actions">
        ${i===0 ? "" : `<button data-edit-player="${i}">編集</button><button class="delete" data-del-player="${i}">削除</button>`}
      </div>
    </div>`).join("");
  $("#characterList").innerHTML = state.characters.map((name,i) => `
    <div class="setting-item">
      <span>${escapeHtml(name)}</span>
      <div class="setting-actions">
        ${i===0 ? "" : `<button data-edit-char="${i}">編集</button><button class="delete" data-del-char="${i}">削除</button>`}
      </div>
    </div>`).join("");
}
function renderHistory() {
  let wins=0, losses=0;
  state.records.forEach(r => r.matches.forEach(m => m.result==="win" ? wins++ : losses++));
  $("#recordCount").textContent = `${state.records.length}セット`;
  $("#summary").innerHTML = `<div class="summary-grid">
    <div class="stat">勝利<strong>${wins}</strong></div>
    <div class="stat">敗北<strong>${losses}</strong></div>
    <div class="stat">勝率<strong>${wins+losses ? Math.round(wins/(wins+losses)*100) : 0}%</strong></div>
  </div>`;
  $("#history").innerHTML = state.records.length ? state.records.slice().reverse().map(r => `
    <div class="history-item">
      <div class="history-head"><span>${escapeHtml(r.myCharacter)} vs ${escapeHtml(r.player)}</span><span class="muted">${new Date(r.date).toLocaleString("ja-JP")}</span></div>
      ${r.matches.map(m => `<div>${escapeHtml(m.character)}　<span class="badge ${m.result}">${m.result==="win"?"勝":"負"}</span></div>`).join("")}
    </div>`).join("") : `<p class="muted">まだ記録がありません。</p>`;
}
function render() { renderSelects(); renderSettings(); renderHistory(); }
$("#addMatchRow").onclick = () => addRow();
$("#battleForm").onsubmit = e => {
  e.preventDefault();
  const rows = [...document.querySelectorAll(".match-row")];
  const matches = rows.map(row => ({
    character: row.querySelector(".opponent-character").value,
    result: row.querySelector(".result button.selected")?.dataset.result || "win"
  }));
  state.records.push({
    date: new Date().toISOString(),
    myCharacter: $("#myCharacter").value,
    player: $("#opponentPlayer").value,
    matches
  });
  save(); renderHistory(); toast("戦績を記録しました");
  $("#matchRows").innerHTML = ""; addRow();
};
$("#playerForm").onsubmit = e => {
  e.preventDefault();
  const input=$("#playerName"), name=input.value.trim();
  if (!name) return;
  if (state.players.includes(name)) return toast("同じ名前が既にあります");
  state.players.push(name); save(); input.value=""; render(); toast("プレイヤーを追加しました");
};
$("#characterForm").onsubmit = e => {
  e.preventDefault();
  const input=$("#characterName"), name=input.value.trim();
  if (!name) return;
  if (state.characters.includes(name)) return toast("同じ名前が既にあります");
  state.characters.push(name); save(); input.value=""; render(); toast("キャラを追加しました");
};
document.addEventListener("click", e => {
  const t=e.target;
  if (t.dataset.editPlayer) {
    const i=+t.dataset.editPlayer, next=prompt("新しいプレイヤー名", state.players[i]);
    if (next?.trim() && !state.players.includes(next.trim())) { replaceReferences("player", state.players[i], next.trim()); state.players[i]=next.trim(); save(); render(); }
  }
  if (t.dataset.delPlayer) {
    const i=+t.dataset.delPlayer;
    if (confirm(`「${state.players[i]}」を削除しますか？\n過去の戦績は「不明」に置き換えます。`)) { replaceReferences("player", state.players[i], "不明"); state.players.splice(i,1); save(); render(); }
  }
  if (t.dataset.editChar) {
    const i=+t.dataset.editChar, next=prompt("新しいキャラクター名", state.characters[i]);
    if (next?.trim() && !state.characters.includes(next.trim())) { replaceReferences("character", state.characters[i], next.trim()); state.characters[i]=next.trim(); save(); render(); }
  }
  if (t.dataset.delChar) {
    const i=+t.dataset.delChar;
    if (confirm(`「${state.characters[i]}」を削除しますか？\n過去の戦績は「不明」に置き換えます。`)) { replaceReferences("character", state.characters[i], "不明"); state.characters.splice(i,1); save(); render(); }
  }
});
function replaceReferences(type, oldName, newName) {
  state.records.forEach(r => {
    if (type==="player" && r.player===oldName) r.player=newName;
    if (type==="character") {
      if (r.myCharacter===oldName) r.myCharacter=newName;
      r.matches.forEach(m => { if (m.character===oldName) m.character=newName; });
    }
  });
}
document.querySelectorAll(".nav-item").forEach(btn => btn.onclick=()=>{
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active")); btn.classList.add("active");
  document.querySelectorAll(".tab-panel").forEach(x=>x.classList.add("hidden")); $("#"+btn.dataset.tab).classList.remove("hidden");
});
$("#resetAll").onclick = () => {
  if (confirm("すべてのキャラ・プレイヤー・戦績を初期化しますか？")) {
    state=structuredClone(defaultState); save(); $("#matchRows").innerHTML=""; addRow(); render(); toast("初期化しました");
  }
};
$("#matchRows").innerHTML=""; addRow(); render();
