const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

// Navigation works as ordinary anchors even before JavaScript loads.
const menuToggle = $('.menu-toggle');
const nav = $('#main-nav');
function closeMenu() {
  nav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Мәзірді ашу');
}
menuToggle.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(expanded));
  menuToggle.setAttribute('aria-label', expanded ? 'Мәзірді жабу' : 'Мәзірді ашу');
  nav.classList.toggle('open', expanded);
});
nav.addEventListener('click', (event) => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); menuToggle.focus(); }
});
document.addEventListener('click', (event) => { if (!event.target.closest('.header-inner')) closeMenu(); });
const sections = ['home', 'processor', 'architectures', 'compare', 'interactive', 'video', 'quiz'];
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) if (entry.isIntersecting) {
    $$('#main-nav a').forEach((link) => {
      const active = link.hash === '#' + entry.target.id;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
  }
}, { rootMargin: '-10% 0px -65% 0px', threshold: 0 });
sections.forEach((id) => observer.observe(document.getElementById(id)));

// Respect the OS preference until the visitor explicitly chooses a setting.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let motionChoice = null;
try { motionChoice = localStorage.getItem('chip-atlas-motion'); } catch { /* storage is optional */ }
let motionOff = motionChoice === 'off' || (motionChoice === null && reducedMotion.matches);
const motionButton = $('#motion-toggle');
function applyMotion() {
  document.documentElement.classList.toggle('motion-off', motionOff);
  motionButton.setAttribute('aria-pressed', String(motionOff));
  motionButton.textContent = motionOff ? 'Анимация: өшірулі ◯' : 'Анимация: қосулы ◉';
  if (motionOff) { $('.hero-art').style.removeProperty('--pointer-x'); $('.hero-art').style.removeProperty('--pointer-y'); }
}
applyMotion();
motionButton.addEventListener('click', () => {
  motionOff = !motionOff; motionChoice = motionOff ? 'off' : 'on';
  try { localStorage.setItem('chip-atlas-motion', motionChoice); } catch { /* optional */ }
  applyMotion();
});
reducedMotion.addEventListener('change', () => { if (motionChoice === null) { motionOff = reducedMotion.matches; applyMotion(); } });
const heroArt = $('.hero-art');
heroArt.addEventListener('pointermove', (event) => {
  if (motionOff || reducedMotion.matches || event.pointerType === 'touch') return;
  const rect = heroArt.getBoundingClientRect();
  heroArt.style.setProperty('--pointer-x', `${((event.clientX - rect.left) / rect.width - .5) * 12}px`);
  heroArt.style.setProperty('--pointer-y', `${((event.clientY - rect.top) / rect.height - .5) * 8}px`);
});
heroArt.addEventListener('pointerleave', () => { heroArt.style.setProperty('--pointer-x', '0px'); heroArt.style.setProperty('--pointer-y', '0px'); });

$$('.compare-switch button').forEach((button) => button.addEventListener('click', () => {
  $$('.compare-switch button').forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
  $('.comparison-table').dataset.highlight = button.dataset.column;
}));

// An intentionally simplified instruction cycle. Timers never duplicate.
let cycleStep = -1;
let cycleTimer = null;
const cycleMessages = [
  '1 / 3 · Алу: «5 пен 3-ті қос» нұсқауы жадтан алынды.',
  '2 / 3 · Түсіндіру: қосу әрекеті және 5, 3 операндтары анықталды.',
  '3 / 3 · Орындау: 5 + 3 = 8. Нәтиже дайын.'
];
function stopCycle() {
  clearInterval(cycleTimer); cycleTimer = null;
  $('#cycle-pause').disabled = true;
  $('#cycle-start').disabled = cycleStep === 2;
}
function renderCycle() {
  $$('.cycle-steps li').forEach((item, index) => {
    item.classList.toggle('current', index === cycleStep);
    item.classList.toggle('done', index < cycleStep);
    if (index === cycleStep) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current');
  });
  $('#cycle-result').textContent = cycleStep === 2 ? '8' : '?';
  $('#cycle-result').classList.toggle('complete', cycleStep === 2);
  $('#cycle-status').textContent = cycleStep < 0 ? 'Дайын. Циклді бастау үшін батырманы басыңыз.' : cycleMessages[cycleStep];
  $('#cycle-next').disabled = cycleStep === 2;
}
function advanceCycle() {
  if (cycleStep < 2) cycleStep++;
  renderCycle();
  if (cycleStep === 2) stopCycle();
}
$('#cycle-start').addEventListener('click', () => {
  if (cycleTimer || cycleStep === 2) return;
  advanceCycle();
  if (cycleStep < 2) {
    cycleTimer = setInterval(advanceCycle, 2200);
    $('#cycle-start').disabled = true;
    $('#cycle-pause').disabled = false;
  }
});
$('#cycle-pause').addEventListener('click', () => { stopCycle(); $('#cycle-status').textContent += ' Кідіртілді.'; });
$('#cycle-next').addEventListener('click', () => { stopCycle(); advanceCycle(); });
$('#cycle-reset').addEventListener('click', () => { stopCycle(); cycleStep = -1; renderCycle(); $('#cycle-start').disabled = false; });
document.addEventListener('visibilitychange', () => { if (document.hidden && cycleTimer) { stopCycle(); $('#cycle-status').textContent += ' Кідіртілді.'; } });

function setCache(hit) {
  $('#cache-hit').setAttribute('aria-pressed', String(hit));
  $('#cache-miss').setAttribute('aria-pressed', String(!hit));
  $('.memory-path').classList.toggle('hit', hit);
  $('.memory-path').classList.toggle('miss', !hit);
  $('#cache-status').replaceChildren();
  const strong = document.createElement('strong');
  strong.textContent = hit ? 'Кэшке түсті. ' : 'Кэште табылмады. ';
  $('#cache-status').append(strong, hit ? 'Дерек жақыннан табылды: CPU ↔ кэш.' : 'Сұраныс келесі жад деңгейіне өтті. Бұл үлгіде: CPU → кэш → RAM → CPU; алынған дерек кэшке де көшіріледі.');
}
$('#cache-hit').addEventListener('click', () => setCache(true));
$('#cache-miss').addEventListener('click', () => setCache(false));

const scenarios = [
  { title: 'Бір браузер. Ондаған бет.', description: 'CPU беттегі JavaScript кодын орындайды, интерфейс әрекеттерін өңдейді. Бірнеше бет пен бейнеқоңырау қатар жұмыс істесе, тапсырмалар арасында ресурстар бөлінеді.', other: 'RAM ашық беттердің деректерін ұстайды. Желі жүктеуге, GPU бейнені көрсетуге, SSD файлдар мен кэшті оқуға әсер етеді.', takeaway: 'Таңдау өлшемі: жұмысқа жеткілікті RAM және нақты жүктемедегі өнімділік.', figure: 'MULTITASKING' },
  { title: 'Ойын — ортақ жұмыс.', description: 'CPU ойын логикасын, физиканың бір бөлігін және GPU-ға берілетін командаларды өңдейді. Кей ойынға бір ағынның жылдамдығы, кейбіріне бірнеше ядро маңызды.', other: 'GPU кадрды сызады, RAM ойын деректерін ұстайды, SSD деңгейлерді жүктейді. Экран ажыратымдылығы мен графика баптауы да нәтижені өзгертеді.', takeaway: 'Бренд бойынша емес, нақты ойын мен CPU–GPU үйлесімі бойынша салыстырыңыз.', figure: 'GAME LOGIC' },
  { title: 'Кадрдан дайын видеоға.', description: 'CPU монтаж бағдарламасының логикасын, кей эффектілерді және кодтаудың бір бөлігін орындайды. Бірнеше ядро тек бағдарлама жұмысты бөле алғанда пайдалы.', other: 'GPU және арнайы медиа блоктар кей кодектерді үдетеді. RAM үлкен жобаларды ұстайды, жылдам сақтау құрылғысы бастапқы материалды оқиды. Қолдау кодек пен бағдарламаға тәуелді.', takeaway: 'Нақты редактордағы, кодектегі және жоба түріндегі нәтижеге қараңыз.', figure: 'VIDEO WORKFLOW' },
  { title: 'Розеткасыз жұмыс күні.', description: 'CPU бос кезде қуатын азайтып, жүктеме кезінде жиілігін және қуат тұтынуын өзгерте алады. Қысқа тапсырманы орындау уақыты да жалпы энергияға әсер етеді.', other: 'Экран жарықтығы, батарея сыйымдылығы, GPU, сымсыз желі, ОЖ және фондық бағдарламалар автономдыққа әсер етеді. ISA атауы батарея уақытын жалғыз анықтамайды.', takeaway: 'Бірдей шарттағы тұтас ноутбук сынағын және өз бағдарламаларыңыздың үйлесімділігін тексеріңіз.', figure: 'MOBILE COMPUTING' },
  { title: 'Бір сервер. Көп сұраныс.', description: 'CPU сұраныстарды өңдейді, деректерді түрлендіреді және қызметтердің кодын орындайды. Көп ядро тәуелсіз сұраныстарды қатар орындауға көмектесе алады.', other: 'RAM көлемі мен өткізу қабілеті, желі, сақтау құрылғысы және дерекқор баптауы тар орынға айналуы мүмкін. Бағдарламаның ISA және ОЖ үйлесімділігі маңызды.', takeaway: 'Өз жүктемеңіздегі жауап беру уақыты, өткізу қабілеті және тұтас жүйе шығынын бірге бағалаңыз.', figure: 'SERVER REQUESTS' }
];
const scenarioTabs = $$('[role=tab][data-scenario]');
function chooseScenario(index, focus = false) {
  const scenario = scenarios[index];
  scenarioTabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; });
  $('#scenario-panel').setAttribute('aria-labelledby', scenarioTabs[index].id);
  $('#scenario-number').textContent = `0${index + 1} / 05`;
  $('#scenario-title').textContent = scenario.title;
  $('#scenario-description').textContent = scenario.description;
  const strong = document.createElement('strong'); strong.textContent = 'CPU-дан бөлек: ';
  $('#scenario-other').replaceChildren(strong, scenario.other);
  $('#scenario-takeaway').textContent = scenario.takeaway;
  $('#scenario-figure').textContent = `FIG. 00${index + 2} / ${scenario.figure}`;
  if (focus) scenarioTabs[index].focus();
}
scenarioTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => chooseScenario(index));
  tab.addEventListener('keydown', (event) => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % scenarioTabs.length;
    if (event.key === 'ArrowLeft') next = (index + scenarioTabs.length - 1) % scenarioTabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = scenarioTabs.length - 1;
    if (next !== undefined) { event.preventDefault(); chooseScenario(next, true); }
  });
});

const questions = [
  { question: 'CPU-дың негізгі міндеті қандай?', answers: ['Бағдарлама нұсқауларын орындау', 'Файлдарды қуатсыз да мәңгі сақтау', 'Экрандағы барлық пиксельді жалғыз өзі сызу'], correct: 0, explanation: 'CPU — нұсқауларды орындайтын орталық процессор. Ұзақ сақтау — SSD сияқты құрылғылардың, графиканы сызу көбіне GPU-дың міндеті.' },
  { question: 'Неге ГГц саны өнімділікті жалғыз анықтамайды?', answers: ['Жиілік ештеңеге әсер етпейді', 'Бір тактідегі жұмыс, жад және қуат шектеуі де әсер етеді', 'Жоғары жиілік тек серверде болады'], correct: 1, explanation: 'Жиілік маңызды, бірақ бір тактідегі пайдалы жұмыс микроархитектура мен тапсырмаға тәуелді. Кэш, RAM және салқындату да нәтиже береді.' },
  { question: 'Intel, AMD және Arm туралы қай тұжырым дұрыс?', answers: ['Үшеуі — бір процессордың модельдері', 'Arm тек смартфон құрастырады', 'Intel мен AMD чип әзірлейді; Arm ISA мен процессор IP-ін лицензиялайды'], correct: 2, explanation: 'Компанияны, архитектураны және дайын өнімді ажырату керек. Arm лицензияларын пайдаланған әртүрлі өндірушілер өз чиптерін жасайды.' },
  { question: 'Кэште қажетті дерек табылса, не болады?', answers: ['CPU оны кэштен ала алады', 'Дерек міндетті түрде SSD-ден қайта жүктеледі', 'RAM біржола қажет болмай қалады'], correct: 0, explanation: 'Кэш дерекке жақыннан қол жеткізуге көмектеседі. Бірақ көлемі шектеулі, сондықтан RAM мен жадтың басқа деңгейлерін алмастырмайды.' },
  { question: 'Көп ядро қай кезде көбірек көмектеседі?', answers: ['Кез келген бағдарламада міндетті түрде', 'Жұмысты тәуелсіз бөліктерге бөлуге болғанда', 'Тек компьютер интернетке қосылғанда'], correct: 1, explanation: 'Бағдарлама параллель жұмысты пайдалана алуы керек. Бірізді бөлік пен ортақ ресурстар шектеу болып қала береді.' },
  { question: 'x86-64 бағдарламасын Arm жүйесінде іске қосу үшін не қажет болуы мүмкін?', answers: ['Тек экран ажыратымдылығын өзгерту', 'Кез келген жағдайда ештеңе қажет емес', 'Arm нұсқасы немесе қолдау көрсетілетін аудару/эмуляция қабаты'], correct: 2, explanation: 'ISA әртүрлі болғандықтан, бағдарламаның үйлесімді нұсқасы не арнайы қабат керек болуы мүмкін. Драйвер мен плагинді де тексеру қажет.' },
  { question: 'ISA мен микроархитектураның айырмасы қандай?', answers: ['ISA — бағдарламаның нұсқаулар ережесі, микроархитектура — ішкі іске асырылуы', 'ISA — RAM көлемі, микроархитектура — экран өлшемі', 'Екеуі де тек маркетинг атауы'], correct: 0, explanation: 'Бір ISA-ны қолдайтын процессорлардың ішкі құрылымы әртүрлі бола алады. Сондықтан ISA бірдей болуы өнімділік те бірдей деген сөз емес.' },
  { question: 'Ноутбуктың батарея уақытын қалай бағалаған дұрыс?', answers: ['Тек RISC не CISC атауына қарап', 'Тұтас жүйені бірдей жұмыс шартында тексеріп', 'Тек CPU ядросының санын есептеп'], correct: 1, explanation: 'CPU мен SoC-тан бөлек, экран, батарея, ОЖ және бағдарлама әсер етеді. Әмбебап бренд жеңімпазы болмайды.' }
];
let questionIndex = 0, score = 0, answered = false;
function renderQuestion(focus = false) {
  answered = false;
  const item = questions[questionIndex];
  $('#quiz-progress').textContent = `СҰРАҚ ${String(questionIndex + 1).padStart(2, '0')} / 08`;
  $('#quiz-score').textContent = `${score} дұрыс жауап`;
  $('#quiz-progress-bar').style.width = `${questionIndex / questions.length * 100}%`;
  $('#quiz-question').textContent = item.question;
  $('#quiz-feedback').textContent = '';
  $('#quiz-next').hidden = true;
  $('#quiz-next').textContent = questionIndex === questions.length - 1 ? 'Нәтижені көру →' : 'Келесі сұрақ →';
  $('#quiz-answers').replaceChildren();
  item.answers.forEach((answer, index) => {
    const button = document.createElement('button');
    const marker = document.createElement('span'); marker.textContent = String.fromCharCode(65 + index);
    button.append(marker, answer);
    button.addEventListener('click', () => {
      if (answered) return; answered = true;
      const correct = index === item.correct;
      if (correct) score++;
      $$('#quiz-answers button').forEach((option, i) => {
        option.disabled = true;
        if (i === item.correct) { option.classList.add('correct'); option.setAttribute('aria-label', item.answers[i] + ' — дұрыс жауап'); }
        if (i === index && !correct) { option.classList.add('incorrect'); option.setAttribute('aria-label', answer + ' — қате жауап'); }
      });
      $('#quiz-score').textContent = `${score} дұрыс жауап`;
      $('#quiz-feedback').textContent = `${correct ? 'Дұрыс! ' : 'Бұл жолы қате. '}${item.explanation}`;
      $('#quiz-next').hidden = false;
      $('#quiz-next').focus({ preventScroll: true });
    });
    $('#quiz-answers').append(button);
  });
  if (focus) $('#quiz-question').focus({ preventScroll: true });
}
$('#quiz-next').addEventListener('click', () => {
  if (!answered) return;
  if (questionIndex < questions.length - 1) { questionIndex++; renderQuestion(true); }
  else {
    $('#quiz-question-area').hidden = true; $('#quiz-result').hidden = false;
    $('#quiz-progress').textContent = 'НӘТИЖЕ / 08 СҰРАҚ';
    $('#quiz-progress-bar').style.width = '100%';
    $('#quiz-final-score').textContent = `${score} / ${questions.length}`;
    $('#quiz-result-text').textContent = score >= 7 ? 'Негізгі ұғымдарды жақсы меңгердіңіз. Енді құрылғыны нақты жұмысыңызға қарай салыстыра аласыз.' : score >= 4 ? 'Негіз қалыптасты. Қиын болған бөлімдерді қайта ашып, тестті тағы байқап көріңіз.' : 'Алғашқы қадам жасалды. Процессор, архитектура және кэш бөлімдерін қайта қарап шығу көмектеседі.';
    $('#quiz-final-score').focus({ preventScroll: true });
  }
});
$('#quiz-restart').addEventListener('click', () => {
  questionIndex = 0; score = 0; $('#quiz-result').hidden = true; $('#quiz-question-area').hidden = false; renderQuestion(true);
});
renderQuestion();

$('#glossary-search').addEventListener('input', (event) => {
  const term = event.target.value.trim().toLocaleLowerCase('kk');
  let count = 0;
  $$('.glossary-grid details').forEach((item) => {
    const matches = item.textContent.toLocaleLowerCase('kk').includes(term);
    item.hidden = !matches; if (matches) count++;
  });
  $('#glossary-empty').hidden = count > 0;
});

// The media manifest is added only after the supplied video has been transferred
// and probed. No fabricated duration, subtitles or chapters are displayed.
async function loadVideo() {
  try {
    const response = await fetch('./assets/media.json');
    if (!response.ok) return;
    const media = await response.json();
    if (!media.src) return;
    const video = $('#atlas-video');
    video.addEventListener('loadedmetadata', () => {
      $('.video-shell').classList.toggle('is-portrait', video.videoHeight > video.videoWidth);
      if (Number.isFinite(video.duration)) {
        const seconds = Math.floor(video.duration);
        $('#video-duration').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')} · ${media.label || 'MP4'}`;
      }
    });
    video.addEventListener('error', () => {
      video.hidden = true; $('#video-pending').hidden = false;
      $('#video-pending p').textContent = 'Видео жүктелмеді.';
      $('#video-pending>div>span:last-child').textContent = 'Қосылымды тексеріп, бетті жаңартыңыз.';
      $('#video-duration').textContent = 'Ойнату қатесі';
    });
    video.src = new URL(media.src, document.baseURI).href;
    video.hidden = false; $('#video-pending').hidden = true;
  } catch { /* The explicitly labelled pending state remains visible. */ }
}
loadVideo();
