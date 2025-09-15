const screens = {
  home: document.getElementById('screen-home'),
  match: document.getElementById('screen-match'),
  result: document.getElementById('screen-result')
};
const arena = document.getElementById('arena');
const scoreEl = document.getElementById('score');
const roundEl = document.getElementById('round');
const finalScoreEl = document.getElementById('finalScore');
const rankEl = document.getElementById('rank');
const badgeEl = document.getElementById('badge');

document.getElementById('btn-start').addEventListener('click', startMatch);
document.getElementById('btn-exit').addEventListener('click', () => goto('home'));
document.getElementById('btn-home').addEventListener('click', () => goto('home'));
document.getElementById('btn-restart').addEventListener('click', startMatch);

const themeSel = document.getElementById('theme');
themeSel.addEventListener('change', ()=>{
  document.documentElement.className = themeSel.value==='light'?'theme-light':(themeSel.value==='neon'?'theme-neon':'');
});

function goto(name){
  Object.values(screens).forEach(s=>s.classList.remove('active'));
  screens[name].classList.add('active');
}

const RoundTypes = ['SYNC','REACT'];
const state = { score:0, round:1, rank:1 };

function startMatch(){
  state.score=0; state.round=1; state.rank = parseInt(rankEl.textContent)||1;
  goto('match'); nextRound();
}

function nextRound(){
  if (state.round>3) return finishMatch();
  arena.innerHTML=''; scoreEl.textContent = state.score; roundEl.textContent = state.round;
  (Math.random()<0.5 ? renderSYNC : renderREACT)();
}

/* ----- SYNC ----- */
function renderSYNC(){
  const poolSets = [
    ['🍎','🍌','🍇','🍑'],
    ['🐶','🐱','🦊','🐼'],
    ['⚽','🏀','🎾','🏈'],
    ['🚗','🚲','🚀','🚁'],
  ];
  const pool = poolSets[Math.floor(Math.random()*poolSets.length)];

  const title = div('sync-title','SYNC — выберите одинаковое!');
  const grid = div('sync-grid');
  const hint = div('sync-hint','Подсказка: ИИ любит 0/1 слот, если «похожи».');
  const flash = div('flash');

  arena.append(title, grid, hint, flash);

  pool.forEach(emo=>{
    const b = button('sync-btn', emo, ()=>{
      const aiPick = aiSyncPick(pool);
      const match = emo===aiPick;
      flash.classList.add('show'); setTimeout(()=>flash.classList.remove('show'), 220);
      toast(match?'+10 очков — синхрон!':'+0 — промах.');
      state.score += match?10:0;
      state.round++; setTimeout(nextRound, 280);
    });
    grid.appendChild(b);
  });
}

function aiSyncPick(pool){
  const score0 = pool[0].codePointAt(0), score1 = pool[1].codePointAt(0);
  const bias = (score0%2 === score1%2) ? 0 : 1;
  const r = Math.random();
  if (r<0.6) return pool[bias];
  if (r<0.8) return pool[0];
  return pool[Math.floor(Math.random()*pool.length)];
}

/* ----- REACT ----- */
function renderREACT(){
  const wrap = div('react-wrap');
  const pad = div('react-pad');
  const status = div('react-status','Ждите сигнал...');
  const go = div('react-go','ТАП!'); pad.append(go, div('react-wait',' '));
  wrap.append(pad, status); arena.append(wrap);

  let armed=false, start=0, tapped=false;
  pad.addEventListener('click', ()=>{
    if (!armed){ toast('Рано! 0 очков'); state.round++; return setTimeout(nextRound, 300); }
    if (tapped) return; tapped = true;
    const dt = performance.now()-start;
    const pts = dt<200?15: dt<300?12: dt<400?10: dt<600?6: 2;
    toast(`Время: ${Math.round(dt)}ms → +${pts}`); state.score+=pts; state.round++; setTimeout(nextRound, 380);
  });

  const delay = 1000 + Math.random()*2000;
  setTimeout(()=>{ armed=true; start=performance.now(); go.style.display='block'; status.textContent='ЖМИ!'; pad.style.background='#102a18'; }, delay);
}

/* ----- Results ----- */
function finishMatch(){
  goto('result'); finalScoreEl.textContent = state.score;
  const before = state.rank; const after = before + Math.floor(state.score/25);
  rankEl.textContent = after; if (after>before) badgeEl.classList.remove('hidden'); else badgeEl.classList.add('hidden');
}

/* ----- helpers ----- */
function div(cls, text){ const d=document.createElement('div'); if(cls) d.className=cls; if(text) d.textContent=text; return d; }
function button(cls, text, on){ const b=document.createElement('button'); b.className=cls; b.textContent=text; b.onclick=on; return b; }
function toast(text){
  const tmp = div(null,text); Object.assign(tmp.style,{
    position:'fixed', top:'8px', left:'50%', transform:'translateX(-50%)',
    background:'rgba(0,0,0,.6)', color:'#fff', padding:'8px 12px', borderRadius:'999px',
    fontSize:'14px', zIndex:999
  });
  document.body.appendChild(tmp); setTimeout(()=>tmp.remove(), 1100);
}
