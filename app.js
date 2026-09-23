const KEY="fg-record-v3";
const INITIAL=["アレックス","ダッドリー","エレナ","ヒューゴー","いぶき","ケン","まこと","ネクロ","オロ","Q","リュウ","ショーン","トゥエルヴ","ユリアン","ヤン","ユン","春麗","豪鬼","レミー"];
const defaults={players:["不明"],records:[]};
let state=load();
const $=s=>document.querySelector(s);

function load(){
 try{
  let x=JSON.parse(localStorage.getItem(KEY));
  if(!x)return structuredClone(defaults);
  let p=Array.isArray(x.players)&&x.players.length?x.players:["不明"];
  if(!p.includes("不明"))p.unshift("不明");
  return {players:p,records:Array.isArray(x.records)?x.records:[]};
 }catch{return structuredClone(defaults)}
}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function toast(s){let e=$("#toast");e.textContent=s;e.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove("show"),1800)}
function opts(a,v){return a.map(x=>`<option value="${esc(x)}" ${x===v?"selected":""}>${esc(x)}</option>`).join("")}

function addRow(character){
 let r=document.createElement("div");r.className="match-row";r.dataset.w=0;r.dataset.l=0;
 r.innerHTML=`<label>相手キャラ<select class="opponent-character">${opts(INITIAL,character||INITIAL[0])}</select></label>
 <div class="count-buttons"><button type="button" class="count-button win">勝<span class="count-value">0</span></button><button type="button" class="count-button loss">負<span class="count-value">0</span></button></div>
 <button type="button" class="remove-row">×</button>`;
 r.querySelector(".win").onclick=()=>{r.dataset.w++;r.querySelector(".win .count-value").textContent=r.dataset.w};
 r.querySelector(".loss").onclick=()=>{r.dataset.l++;r.querySelector(".loss .count-value").textContent=r.dataset.l};
 r.querySelector(".remove-row").onclick=()=>$("#matchRows").children.length>1?r.remove():toast("最低1件は入力してください");
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
  if(r.matches){
   r.matches.forEach(m=>addAgg(r.myCharacter,r.player,m.character,m.result==="win"?1:0,m.result==="loss"?1:0))
  }else{
   addAgg(r.myCharacter,r.player,r.opponentCharacter,r.wins,r.losses)
  }
 });
 state.records=[...map.values()];
 function addAgg(a,b,c,w,l){
  let k=[a,b,c].join("\1"),o=map.get(k)||{myCharacter:a,player:b,opponentCharacter:c,wins:0,losses:0};
  o.wins+=+w||0;o.losses+=+l||0;map.set(k,o);
 }
}
normalize();

function renderHistory(){
 let wins=0,losses=0;
 state.records.forEach(r=>{wins+=+r.wins||0;losses+=+r.losses||0});
 $("#recordCount").textContent=`${state.records.length}組み合わせ`;
 $("#summary").innerHTML=`<div class="summary-grid"><div class="stat">勝利<strong>${wins}</strong></div><div class="stat">敗北<strong>${losses}</strong></div><div class="stat">勝率<strong>${wins+losses?Math.round(wins/(wins+losses)*100):0}%</strong></div></div>`;

 let groups={};
 state.records.forEach((r,i)=>(groups[r.player]??=[]).push({...r,index:i}));
 let html=Object.keys(groups).length?Object.entries(groups).map(([player,rows])=>`
 <div class="player-group">
  <div class="player-title">vs ${esc(player)}</div>
  ${rows.map(r=>`<div class="record-row">
   <span class="character-name">${esc(r.myCharacter)}　/　${esc(r.opponentCharacter)}</span>
   <span class="count">${r.wins}</span><span class="count">${r.losses}</span>
   <button type="button" class="delete-record" data-delete="${r.index}">削除</button>
  </div>`).join("")}
 </div>`).join(""):"<p class='muted'>まだ記録がありません。</p>";
 $("#history").innerHTML=html;
}

function renderPlayers(){
 $("#playerList").innerHTML=state.players.map((n,i)=>`<div class="setting-item"><span>${esc(n)}</span><div class="setting-actions">${i?`<button data-ep="${i}">編集</button><button class="delete" data-dp="${i}">削除</button>`:""}</div></div>`).join("");
}
function render(){renderSelects();renderPlayers();renderHistory()}

$("#addMatchRow").onclick=()=>addRow();
$("#battleForm").onsubmit=e=>{
 e.preventDefault();
 let added=0;
 document.querySelectorAll(".match-row").forEach(r=>{
  let w=+r.dataset.w,l=+r.dataset.l;if(!w&&!l)return;
  let a=$("#myCharacter").value,b=$("#opponentPlayer").value,c=r.querySelector("select").value;
  let o=state.records.find(x=>x.myCharacter===a&&x.player===b&&x.opponentCharacter===c);
  if(o){o.wins+=w;o.losses+=l}else state.records.push({myCharacter:a,player:b,opponentCharacter:c,wins:w,losses:l});
  added+=w+l;
 });
 if(!added)return toast("「勝」または「負」を1回以上押してください");
 save();renderHistory();
 // 入力欄は初期化するが、最後に選択した相手キャラを次の行へ引き継ぐ
 let selected=[...document.querySelectorAll(".match-row")].map(r=>r.querySelector("select").value);
 $("#matchRows").innerHTML="";
 addRow(selected[0]||INITIAL[0]);
 selected.slice(1).forEach(c=>addRow(c));
 toast(`${added}戦を記録しました`);
};

$("#playerForm").onsubmit=e=>{
 e.preventDefault();let i=$("#playerName"),n=i.value.trim();if(!n)return;
 if(state.players.includes(n))return toast("同じ名前が既にあります");
 state.players.push(n);save();i.value="";render();toast("追加しました");
};

function replacePlayer(a,b){state.records.forEach(r=>{if(r.player===a)r.player=b})}

document.addEventListener("click",e=>{
 let t=e.target;
 if(t.dataset.delete!==undefined){
  let i=+t.dataset.delete;
  if(confirm(`「${state.records[i].myCharacter} / ${state.records[i].player} / ${state.records[i].opponentCharacter}」を削除しますか？`)){
   state.records.splice(i,1);save();renderHistory();toast("組み合わせを削除しました");
  }
 }
 if(t.dataset.ep){
  let i=+t.dataset.ep,n=prompt("新しいプレイヤー名",state.players[i])?.trim();
  if(n&&!state.players.includes(n)){replacePlayer(state.players[i],n);state.players[i]=n;save();render();toast("変更しました")}
 }
 if(t.dataset.dp){
  let i=+t.dataset.dp;
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
