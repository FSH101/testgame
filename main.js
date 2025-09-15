const $ = s => document.querySelector(s);
const out = $('#out');
const statusEl = $('#status');

$('#go').addEventListener('click', async () => {
  const topic = $('#topic').value;
  const style = $('#style').value;
  const count = Math.max(1, Math.min(10, parseInt($('#count').value || '5', 10)));

  statusEl.textContent = 'Генерирую…';
  out.innerHTML = '';

  try {
    const r = await fetch('./api/generate.php', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({topic, style, count})
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json(); // ожидаем {"phrases": ["...","..."]}
    renderList(data.phrases || []);
    statusEl.textContent = data.source ? `Источник: ${data.source}` : 'Готово';
  } catch (e) {
    // Фолбэк: локальные фразы
    const phrases = fallback(topic, style, count);
    renderList(phrases);
    statusEl.textContent = 'Фолбэк без ИИ (проверь API-ключ)';
  }
});

function renderList(phrases){
  if (!phrases.length) { out.innerHTML = '<div class="muted">Пусто</div>'; return; }
  out.innerHTML = '';
  phrases.forEach(text => {
    const card = document.createElement('div'); card.className = 'card';
    const span = document.createElement('span'); span.textContent = text;
    const btn = document.createElement('button'); btn.className='copy'; btn.textContent='Копировать';
    btn.addEventListener('click', async ()=>{
      try { await navigator.clipboard.writeText(text); btn.textContent='Скопировано'; setTimeout(()=>btn.textContent='Копировать',900); }
      catch { /* игнор */ }
    });
    card.append(span, btn);
    out.appendChild(card);
  });
}

function fallback(topic, style, count){
  const pools = {
    neutral: [
      'Берём и делаем.',
      'Коротко и по делу.',
      'Сегодня — лучше, чем завтра.',
      'Фокус — сила.',
      'Не усложняй простое.'
    ],
    motivation: [
      'Дисциплина сильнее мотивации.',
      'Сначала шаг, потом вдохновение.',
      'Слабость — это выбор.',
      'Делай шум делом.',
      'Сомнения молчат, когда начинаешь.'
    ],
    romance: [
      'Мне хватает твоего «да».',
      'Встречаемся в тишине взглядов.',
      'Тепло — это ты рядом.',
      'Сердце знает маршрут.',
      'Обниму твои штормы.'
    ],
    irony: [
      'План на день: не выгореть… снова.',
      'Всё сложно? Ну хотя бы красиво.',
      'Сарказм — мой язык любви.',
      'Идеально — враг сделанного.',
      'Чудо на завтра, дедлайн на сегодня.'
    ]
  };
  let base = pools[topic] || pools.neutral;
  // стиль чуть перемешаем
  if (style === 'punchy') base = base.map(x => x.replace(/\.$/,'!'));
  if (style === 'soft') base = base.map(x => x.replace(/!$/,'…'));
  const res = [];
  for (let i=0;i<count;i++){
    res.push(base[Math.floor(Math.random()*base.length)]);
  }
  return res;
}
