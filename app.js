const KEY="fg-record-v5";
const INITIAL=["アレックス","ダッドリー","エレナ","ヒューゴー","いぶき","ケン","まこと","ネクロ","オロ","Q","リュウ","ショーン","トゥエルヴ","ユリアン","ヤン","ユン","春麗","豪鬼","レミー"];
const defaults={players:["不明"],records:[],reports:[]};
let state=load();const $=s=>document.querySelector(s);

function load(){
 try{
  const x=JSON.parse(localStorage.getItem(KEY));
  if(!x)return structuredClone(defaults);
  let p=Array.isArray(x.players)&&x.players.length?x.players:["不明"];
  if(!p.includes("不明"))p.unshift("不明");
  return {players:p,records:Array.isArray(x.records)?x.records:[],reports:Array.isArray(x.reports)?x.reports:[]};
 }catch{return structuredClone(defaults)}
}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function toast(s){let e=$("#toast");e.textContent=s;e.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove("show"),1800)}
function opts(a,v){return a.map(x=>`<option value="${esc(x)}" ${x===v?"selected":""}>${esc(x)}</option>`).join("")}
function rate(w,l){return w+l?Math.round(w/(w+l)*100)+"%":"—"}
function battles(w,l){return (w+l)+"戦"}

function addRow(character){
 const r=document.createElement("div");r.className="match-row";r.dataset.w=0;r.dataset.l=0;
 r.innerHTML=`<label>相手キャラ<select class="opponent-character">${opts(INITIAL,character||INITIAL[0])}</select></label>
 <div class="count-buttons"><button type="button" class="count-button win">勝<span class="count-value">0</span></button><button type="button" class="count-button loss">負<span class="count-value">0</span></button></div>
 <button type="button" class="remove-row" title="リセット / 削除">×</button>`;
 r.querySelector(".win").onclick=()=>{r.dataset.w++;r.querySelector(".win .count-value").textContent=r.dataset.w};
 r.querySelector(".loss").onclick=()=>{r.dataset.l++;r.querySelector(".loss .count-value").textContent=r.dataset.l};
 r.querySelector(".remove-row").onclick=()=>{
   if($("#matchRows").firstElementChild===r){
     r.dataset.w=0;r.dataset.l=0;r.querySelector(".win .count-value").textContent="0";r.querySelector(".loss .count-value").textContent="0";
   }else r.remove();
 };
 $("#matchRows").appendChild(r);
}

function renderSelects(){
 let m=$("#myCharacter").value,p=$("#opponentPlayer").value;
 $("#myCharacter").innerHTML=opts(INITIAL,INITIAL.includes(m)?m:INITIAL[0]);
 $("#opponentPlayer").innerHTML=opts(state.players,state.players.includes(p)?p:"不明");
 document.querySelectorAll(".opponent-character").forEach(s=>{let v=s.value;s.innerHTML=opts(INITIAL,INITIAL.includes(v)?v:INITIAL[0])});
}

function normalize(){
 let map=new Map();
 state.records.forEach(r=>{
  if(r.matches)r.matches.forEach(m=>addAgg(r.myCharacter,r.player,m.character,m.result==="win"?1:0,m.result==="loss"?1:0));
  else addAgg(r.myCharacter,r.player,r.opponentCharacter,r.wins,r.losses);
 });
 state.records=[...map.values()];
 function addAgg(a,b,c,w,l){
  const k=[a,b,c].join("\\1"),o=map.get(k)||{myCharacter:a,player:b,opponentCharacter:c,wins:0,losses:0};
  o.wins+=+w||0;o.losses+=+l||0;map.set(k,o);
 }
}
normalize();

function groupedRecords(records){
 const groups={};records.forEach((r,i)=>(groups[r.player]??=[]).push({...r,index:i}));return groups;
}
function renderHistory(){
 let wins=0,losses=0;state.records.forEach(r=>{wins+=+r.wins||0;losses+=+r.losses||0});
 $("#summary").innerHTML=`<div class="summary-grid"><div class="stat">勝利<strong>${wins}</strong></div><div class="stat">敗北<strong>${losses}</strong></div><div class="stat">勝率<strong>${rate(wins,losses)}</strong></div></div>`;
 const groups=groupedRecords(state.records);
 if(!Object.keys(groups).length){$("#history").innerHTML="<p class='muted empty'>まだ記録がありません。</p>";return}
 $("#history").innerHTML=Object.entries(groups).map(([player,rows])=>{
   const pw=rows.reduce((n,r)=>n+(+r.wins||0),0),pl=rows.reduce((n,r)=>n+(+r.losses||0),0);
   return `<div class="player-group">
    <div class="player-title"><span>${esc(player)}</span><span class="rate">勝率 ${rate(pw,pl)}</span></div>
    <div class="player-stats"><span>勝 ${pw}</span><span>負 ${pl}</span></div>
    <div class="column-labels"><span>自分のキャラ / 相手キャラ</span><span>勝</span><span>負</span><span>勝率</span><span></span></div>
    ${rows.map(r=>`<div class="record-row">
      <span class="character-name">${esc(r.myCharacter)} / ${esc(r.opponentCharacter)}</span>
      <span class="count">${r.wins}</span><span class="count">${r.losses}</span><span class="count">${rate(r.wins,r.losses)}</span>
      <button type="button" class="delete-record" data-delete="${r.index}" title="削除">×</button>
    </div>`).join("")}
   </div>`;
 }).join("");
}

function snapshot(){return JSON.parse(JSON.stringify(state.records))}
function renderReports(){
 if(!state.reports.length){$("#reports").innerHTML="<p class='muted empty'>まだレポートがありません。</p>";return}
 $("#reports").innerHTML=state.reports.map((rep,ri)=>{
  const groups=groupedRecords(rep.records);
  let totalW=0,totalL=0;rep.records.forEach(r=>{totalW+=+r.wins||0;totalL+=+r.losses||0});
  const editing=rep.editing===true;
  const title=rep.title||`レポート ${ri+1}`;
  return `<div class="report-card">
   <div class="report-head"><div><h3>${esc(title)}</h3><div class="report-meta">${esc(rep.createdAt)}</div></div>
   <div class="report-actions"><button data-report-edit="${ri}" title="編集">✎</button><button class="report-delete" data-report-delete="${ri}" title="削除">×</button></div></div>
   ${editing?`<div class="edit-form"><label>タイトル<input data-edit-title="${ri}" maxlength="100" value="${esc(title)}"></label><label>メモ<textarea data-edit-note="${ri}" maxlength="1000">${esc(rep.note||"")}</textarea></label><div class="edit-actions"><button class="save-edit" data-edit-save="${ri}">保存</button><button data-edit-cancel="${ri}">キャンセル</button></div></div>`:""}
   <div class="summary-grid report-summary"><div class="stat">勝利<strong>${totalW}</strong></div><div class="stat">敗北<strong>${totalL}</strong></div><div class="stat">勝率<strong>${rate(totalW,totalL)}</strong></div></div>
   ${Object.entries(groups).map(([player,rows])=>{
    const pw=rows.reduce((n,r)=>n+(+r.wins||0),0),pl=rows.reduce((n,r)=>n+(+r.losses||0),0);
    return `<div class="player-group">
      <div class="player-title"><span>${esc(player)}</span><span class="rate">勝率 ${rate(pw,pl)}</span></div>
      <div class="player-stats"><span>勝 ${pw}</span><span>負 ${pl}</span></div>
      <div class="column-labels"><span>自分のキャラ / 相手キャラ</span><span>勝</span><span>負</span><span>勝率</span><span></span></div>
      ${rows.map(r=>`<div class="record-row">
       <span class="character-name">${esc(r.myCharacter)} / ${esc(r.opponentCharacter)}</span>
       <span class="count">${r.wins}</span><span class="count">${r.losses}</span><span class="count">${rate(r.wins,r.losses)}</span><span></span>
      </div>`).join("")}
      <div class="record-row player-total-row">
       <span class="character-name">合計</span>
       <span class="count">${pw}</span><span class="count">${pl}</span><span class="count">${rate(pw,pl)}</span><span></span>
      </div>
    </div>`
   }).join("")}
   ${!editing?`<div class="report-note-view"><div class="report-note-label">メモ</div><div class="report-note-text">${rep.note?esc(rep.note):"メモはありません。"}</div></div>`:""}
  </div>`;
 }).join("");
}
function renderPlayers(){
 $("#playerList").innerHTML=state.players.map((n,i)=>`<div class="setting-item"><span>${esc(n)}</span><div class="setting-actions">${i?`<button class="delete" data-dp="${i}">×</button>`:""}</div></div>`).join("");
}
function render(){renderSelects();renderPlayers();renderHistory();renderReports()}

$("#addMatchRow").onclick=()=>{
 const rows=[...document.querySelectorAll(".opponent-character")];addRow(rows.length?rows[rows.length-1].value:INITIAL[0]);
};

$("#battleForm").onsubmit=e=>{
 e.preventDefault();let added=0;
 const selected=[...document.querySelectorAll(".match-row")].map(r=>({character:r.querySelector("select").value,w:+r.dataset.w,l:+r.dataset.l}));
 selected.forEach(x=>{
  if(!x.w&&!x.l)return;
  const a=$("#myCharacter").value,b=$("#opponentPlayer").value,c=x.character;
  const o=state.records.find(r=>r.myCharacter===a&&r.player===b&&r.opponentCharacter===c);
  if(o){o.wins+=x.w;o.losses+=x.l}else state.records.push({myCharacter:a,player:b,opponentCharacter:c,wins:x.w,losses:x.l});
  added+=x.w+x.l;
 });
 if(!added)return toast("「勝」または「負」を1回以上押してください");
 save();renderHistory();
 const selectedChars=selected.map(x=>x.character);
 $("#matchRows").innerHTML="";addRow(selectedChars[0]||INITIAL[0]);selectedChars.slice(1).forEach(c=>addRow(c));
 toast(`${added}戦を記録しました`);
};

$("#saveReport").onclick=()=>{
 if(!state.records.length)return toast("記録する戦績がありません");
 state.reports.push({title:`レポート ${state.reports.length+1}`,createdAt:new Date().toLocaleString("ja-JP"),records:snapshot(),note:"",editing:false});
 save();renderReports();toast("レポートを記録しました");
};

$("#playerForm").onsubmit=e=>{
 e.preventDefault();let i=$("#playerName"),n=i.value.trim();if(!n)return;
 if(state.players.includes(n))return toast("同じ名前が既にあります");
 state.players.push(n);save();i.value="";render();toast("追加しました");
};
function replacePlayer(a,b){state.records.forEach(r=>{if(r.player===a)r.player=b})}

document.addEventListener("click",e=>{
 const t=e.target;
 if(t.dataset.delete!==undefined){
  const i=+t.dataset.delete;
  if(confirm(`「${state.records[i].myCharacter} / ${state.records[i].player} / ${state.records[i].opponentCharacter}」を削除しますか？`)){state.records.splice(i,1);save();renderHistory();toast("組み合わせを削除しました")}
 }
 if(t.dataset.reportDelete!==undefined){
  const i=+t.dataset.reportDelete;
  if(confirm(`「${state.reports[i].title||"レポート"}」を削除しますか？`)){state.reports.splice(i,1);save();renderReports();toast("レポートを削除しました")}
 }
 if(t.dataset.reportEdit!==undefined){state.reports[+t.dataset.reportEdit].editing=true;renderReports()}
 if(t.dataset.editCancel!==undefined){state.reports[+t.dataset.editCancel].editing=false;save();renderReports()}
 if(t.dataset.editSave!==undefined){
  const i=+t.dataset.editSave;
  const title=document.querySelector(`[data-edit-title="${i}"]`).value.trim()||`レポート ${i+1}`;
  const note=document.querySelector(`[data-edit-note="${i}"]`).value;
  state.reports[i].title=title;state.reports[i].note=note;state.reports[i].editing=false;save();renderReports();toast("レポートを更新しました");
 }
 if(t.dataset.dp!==undefined){
  const i=+t.dataset.dp;
  if(confirm(`「${state.players[i]}」を削除しますか？`)){replacePlayer(state.players[i],"不明");state.players.splice(i,1);save();render();toast("削除しました")}
 }
});

$("#deleteRecords").onclick=()=>{
 if(confirm("戦績をすべて削除しますか？")){state.records=[];save();renderHistory();toast("戦績を削除しました")}
};
$("#resetPlayers").onclick=()=>{
 if(confirm("プレイヤー設定を初期化しますか？")){state.records.forEach(r=>r.player="不明");state.players=["不明"];save();render();toast("初期化しました")}
};

document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>{
 document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));b.classList.add("active");
 document.querySelectorAll(".tab-panel").forEach(x=>x.classList.add("hidden"));$("#"+b.dataset.tab).classList.remove("hidden");
});

$("#matchRows").innerHTML="";addRow();render();
