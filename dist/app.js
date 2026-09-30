(() => {
  'use strict';
  const routes = ['university', 'bootcamp', 'career'];
  const content = window.portfolioContent;
  const links = [...document.querySelectorAll('.timeline-stop')];
  const skyScenes = [...document.querySelectorAll('.sky-scene')];
  const skyBackground = document.querySelector('.scene-background');
  const skyRanges = { university: [.22, .60], bootcamp: [.60, 1.02], career: [1.02, 1.18] };
  const skyPalette = [
    { phase: -.08, top: [19,30,56], middle: [117,94,128], bottom: [223,160,118], sun: [255,195,127], glow: [251,173,111] },
    { phase: .22, top: [40,98,143], middle: [96,155,194], bottom: [181,211,223], sun: [255,242,210], glow: [255,219,165] },
    { phase: .44, top: [40,98,143], middle: [96,155,194], bottom: [181,211,223], sun: [255,248,228], glow: [239,230,200] },
    { phase: .60, top: [48,83,130], middle: [143,145,165], bottom: [230,191,158], sun: [255,232,185], glow: [244,210,160] },
    { phase: .87, top: [40,43,80], middle: [181,108,111], bottom: [207,146,109], sun: [255,198,140], glow: [250,159,92] },
    { phase: 1.02, top: [7,16,34], middle: [17,27,53], bottom: [30,37,65], sun: [232,126,93], glow: [76,94,156] },
    { phase: 1.18, top: [5,11,27], middle: [12,20,43], bottom: [24,30,55], sun: [232,126,93], glow: [76,94,156] }
  ];
  let skyPhase = null;
  let skyTarget = null;
  let skyVelocity = 0;
  let skyPreviousTime = null;
  let skyFrame = null;
  let skyIntro = false;
  const chapter = document.querySelector('.chapter');
  const stage = document.querySelector('.chapter-stage');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const historyList = document.getElementById('entries');
  const footer = document.querySelector('.journey-footer');
  const header = document.querySelector('.site-header');
  const journeyClock = document.getElementById('journey-clock');
  const clockDisplay = document.getElementById('journey-date');
  const clockTime = document.getElementById('journey-time');
  const clockLabel = document.querySelector('.clock-label');
  const DAY_MS = 86400000;
  const CLOCK_RESPONSE = 22;
  const CLOCK_DIGIT_DURATION = 120;
  let clockValue = null;
  let clockSlots = [];
  let clockAnchors = [];
  let clockTarget = null;
  let clockDay = null;
  let clockVelocity = 0;
  let clockTravel = null;
  let clockFrame = null;
  let clockTimer = null;
  let clockLive = false;
  const welcome = document.getElementById('welcome');
  const welcomeLines = [...welcome.querySelectorAll('.welcome-line')];
  let welcomeTimer = null;
  let welcomePlayed = false;
  let welcomeLetters = [];
  let historyNodes = [];
  let historyFrame = null;
  let transition = null;
  let activeRoute = null;
  const setText = (id, value) => { document.getElementById(id).textContent = value; };

  function skyBlend(start, end, value) {
    const amount = Math.max(0, Math.min(1, (value - start) / (end - start)));
    return amount * amount * (3 - 2 * amount);
  }

  function drawSky(phase) {
    const bounded = Math.max(skyPalette[0].phase, Math.min(skyPalette[skyPalette.length - 1].phase, phase));
    let nextIndex = skyPalette.findIndex(stop => stop.phase >= bounded);
    nextIndex = Math.max(1, nextIndex);
    const previous = skyPalette[nextIndex - 1];
    const next = skyPalette[nextIndex];
    const fraction = (bounded - previous.phase) / (next.phase - previous.phase);
    const color = name => previous[name].map((value, index) => Math.round(value + (next[name][index] - value) * fraction)).join(',');
    ['top', 'middle', 'bottom'].forEach(name => skyBackground.style.setProperty(`--sky-${name}`, `rgb(${color(name)})`));
    skyBackground.style.setProperty('--sun-color', `rgb(${color('sun')})`);
    skyBackground.style.setProperty('--sun-rgb', color('sun'));
    skyBackground.style.setProperty('--sky-glow', color('glow'));
    const dawn = skyBlend(-.06, .14, bounded);
    const night = skyBlend(.87, 1.02, bounded);
    const sunset = skyBlend(.48, .84, bounded);
    skyBackground.style.setProperty('--sky-glow-opacity', String((.20 + .22 * dawn) * (1 - night)));
    skyBackground.style.setProperty('--sun-x', `${12 + bounded * 76}%`);
    skyBackground.style.setProperty('--sun-y', `${92 - Math.sin(bounded * Math.PI) * 65}%`);
    skyBackground.style.setProperty('--sun-opacity', String(dawn * (1 - skyBlend(.90, 1.02, bounded))));
    skyBackground.style.setProperty('--sun-scale', String(1 + sunset * .18));
    const layers = { university: (1 - sunset) * (1 - night), bootcamp: sunset * (1 - night), career: night };
    skyScenes.forEach(scene => {
      const opacity = layers[scene.dataset.chapter];
      scene.style.opacity = String(opacity);
      scene.classList.toggle('is-active', opacity > .001);
    });
  }

  function finishSkyJourney() {
    if (skyFrame !== null) window.cancelAnimationFrame(skyFrame);
    skyFrame = null;
    skyPreviousTime = null;
    skyVelocity = 0;
    skyIntro = false;
    if (skyTarget === null) return;
    skyPhase = skyTarget;
    drawSky(skyPhase);
  }

  function advanceSky(timestamp) {
    skyFrame = null;
    if (reducedMotion.matches || document.hidden) {
      finishSkyJourney();
      return;
    }
    const dt = Math.max(0, (timestamp - skyPreviousTime) / 1000);
    skyPreviousTime = timestamp;
    const offset = skyPhase - skyTarget;
    const response = skyIntro ? 3.8 : 6.5;
    const momentum = skyVelocity + response * offset;
    const decay = Math.exp(-response * dt);
    skyPhase = skyTarget + (offset + momentum * dt) * decay;
    skyVelocity = (skyVelocity - response * momentum * dt) * decay;
    if (offset * (skyPhase - skyTarget) < 0) {
      skyPhase = skyTarget;
      skyVelocity = 0;
    }
    if (Math.abs(skyPhase - skyTarget) < .0003 && Math.abs(skyVelocity) < .002) {
      finishSkyJourney();
      return;
    }
    drawSky(skyPhase);
    skyFrame = window.requestAnimationFrame(advanceSky);
  }

  function setSkyScene(route, progress = 0, initial = false) {
    const [start, end] = skyRanges[route];
    const target = start + (end - start) * Math.max(0, Math.min(1, progress));
    if (target === skyTarget && !initial) return;
    skyTarget = target;
    skyIntro = initial && route === 'university' && window.scrollY < 2 &&
      !reducedMotion.matches && !document.hidden;
    if (skyIntro) {
      skyPhase = skyPalette[0].phase;
      skyVelocity = 0;
      drawSky(skyPhase);
    } else if (initial || skyPhase === null || reducedMotion.matches || document.hidden) {
      finishSkyJourney();
      return;
    }
    if (skyPreviousTime === null) skyPreviousTime = performance.now();
    if (skyFrame === null) skyFrame = window.requestAnimationFrame(advanceSky);
  }

  function updateSkyProgress(positions, readingLine, atBottom) {
    const first = positions[0].y;
    const last = positions[positions.length - 1].y;
    // Use the date clock's reading line, including resized or expanded timeline entries.
    const progress = atBottom ? 1 : (readingLine - first) / Math.max(1, last - first);
    setSkyScene(activeRoute, progress);
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function formatHistoryDate(entry) {
    const date = entry.date || {};
    const parts = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(date.iso || '');
    if (!parts) return { value: date.year || '기록', label: date.year || '날짜 미정', iso: '' };
    const [, year, month, day] = parts;
    return {
      value: `${year}:${month || '00'}${day || '00'}`,
      label: `${year}년${month ? ` ${Number(month)}월` : ''}${day ? ` ${Number(day)}일` : ''}`,
      iso: date.iso
    };
  }

  function settleClockDigit(reel, character) {
    reel.current = character;
    reel.incoming = null;
    reel.glyph.textContent = character;
    reel.glyph.style.transform = 'translateY(0)';
    reel.nextGlyph.textContent = '';
    reel.nextGlyph.style.transform = 'translateY(100%)';
  }

  function settleClockDigits() {
    clockSlots.forEach(reel => {
      if (reel) settleClockDigit(reel, reel.target);
    });
  }

  function startClockDigit(reel, timestamp) {
    reel.incoming = reel.target;
    reel.started = timestamp;
    reel.direction = reel.nextDirection;
    reel.nextGlyph.textContent = reel.incoming;
    reel.nextGlyph.style.transform = `translateY(${reel.direction * 100}%)`;
  }

  function advanceClockDigits(timestamp) {
    let moving = false;
    clockSlots.forEach(reel => {
      if (!reel) return;
      if (reel.incoming === null && reel.current !== reel.target) startClockDigit(reel, timestamp);
      if (reel.incoming === null) return;
      const progress = Math.min(1, (timestamp - reel.started) / CLOCK_DIGIT_DURATION);
      const eased = .5 - Math.cos(progress * Math.PI) / 2;
      reel.glyph.style.transform = `translateY(${-reel.direction * eased * 100}%)`;
      reel.nextGlyph.style.transform = `translateY(${reel.direction * (1 - eased) * 100}%)`;
      if (progress >= 1) {
        settleClockDigit(reel, reel.incoming);
        // Finish the current roll, then pick up only the latest requested digit.
        if (reel.current !== reel.target) startClockDigit(reel, timestamp);
      }
      moving = moving || reel.incoming !== null;
    });
    return moving;
  }

  // Calendar arithmetic uses UTC day numbers; the live clock uses the visitor's local date.
  function calendarDay(iso) {
    const [year, month = 1, day = 1] = iso.split('-').map(Number);
    return Date.UTC(year, month - 1, day) / DAY_MS;
  }

  function localToday(now = new Date()) {
    return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY_MS;
  }

  function formatCalendarDay(day) {
    const iso = new Date(Math.round(day) * DAY_MS).toISOString().slice(0, 10);
    return formatHistoryDate({ date: { iso } });
  }

  function paintClock(date, description, direction = 1, motion = true) {
    setText('clock-description', `${date.label} · ${description}`);
    journeyClock.title = `${date.label} · ${description}`;
    if (date.iso) clockDisplay.setAttribute('datetime', date.iso);
    else clockDisplay.removeAttribute('datetime');
    if (clockValue === date.value && motion) {
      clockSlots.forEach(reel => { if (reel) reel.nextDirection = direction; });
      return;
    }
    const animate = motion && clockValue !== null && !reducedMotion.matches;
    const numeric = /^\d{4}:\d{4}$/.test(date.value);

    if (numeric && clockSlots.length === date.value.length) {
      Array.from(date.value).forEach((character, digitIndex) => {
        const reel = clockSlots[digitIndex];
        if (!reel) return;
        reel.target = character;
        reel.nextDirection = direction;
        if (!animate) settleClockDigit(reel, character);
      });
    } else {
      clockSlots = [];
      clockDisplay.replaceChildren();
      if (numeric) {
        clockSlots = Array.from(date.value).map(character => {
          const slot = element('span', character === ':' ? 'clock-separator' : 'clock-digit');
          const glyph = element('span', 'clock-glyph', character);
          slot.append(glyph);
          clockDisplay.append(slot);
          if (character === ':') return null;
          const nextGlyph = element('span', 'clock-glyph clock-glyph--next');
          slot.append(nextGlyph);
          return { glyph, nextGlyph, current: character, target: character, incoming: null, direction, nextDirection: direction, started: 0 };
        });
      } else {
        clockDisplay.append(element('span', 'clock-state', date.value));
      }
    }
    clockValue = date.value;
  }

  function stopLiveClock() {
    window.clearTimeout(clockTimer);
    clockTimer = null;
    clockLive = false;
    journeyClock.classList.remove('is-live');
    clockLabel.textContent = 'JOURNEY DATE';
  }

  function tickLiveClock() {
    window.clearTimeout(clockTimer);
    clockTimer = null;
    if (!clockLive || document.hidden) return;
    const now = new Date();
    const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map(value => String(value).padStart(2, '0')).join(':');
    clockTime.textContent = time;
    clockTime.setAttribute('datetime', time);
    clockDay = localToday(now);
    paintClock(formatCalendarDay(clockDay), `현재 시각 ${time}`, 1, false);
    // Re-read the real clock on every tick, including midnight and tab restoration.
    clockTimer = window.setTimeout(tickLiveClock, 1000 - now.getMilliseconds() + 5);
  }

  function finishClockTravel() {
    if (clockFrame !== null) window.cancelAnimationFrame(clockFrame);
    clockFrame = null;
    clockTravel = null;
    clockVelocity = 0;
    if (!clockTarget) return;
    clockDay = clockTarget.day;
    paintClock(clockTarget.date, clockTarget.description, 1, false);
    if (clockTarget.live) {
      clockLive = true;
      clockLabel.textContent = 'PRESENT · LOCAL TIME';
      tickLiveClock();
      journeyClock.classList.add('is-live');
    }
  }

  function travelClock(timestamp) {
    clockFrame = null;
    if (!clockTravel) return;
    if (reducedMotion.matches || document.hidden) {
      finishClockTravel();
      return;
    }
    const dt = Math.max(0, (timestamp - clockTravel.previousTime) / 1000);
    clockTravel.previousTime = timestamp;
    if (!clockTravel.settled) {
      const previousDay = clockDay;
      const offset = clockDay - clockTarget.day;
      const momentum = clockVelocity + CLOCK_RESPONSE * offset;
      const decay = Math.exp(-CLOCK_RESPONSE * dt);
      // An exact critically damped step preserves position and velocity when the target moves.
      clockDay = clockTarget.day + (offset + momentum * dt) * decay;
      clockVelocity = (clockVelocity - CLOCK_RESPONSE * momentum * dt) * decay;
      if (offset * (clockDay - clockTarget.day) < 0) {
        clockDay = clockTarget.day;
        clockVelocity = 0;
      }
      const direction = clockDay >= previousDay ? 1 : -1;
      const settled = Math.abs(clockTarget.day - clockDay) < .015 && Math.abs(clockVelocity) < .3;
      if (settled) {
        clockDay = clockTarget.day;
        clockVelocity = 0;
        clockTravel.settled = true;
        paintClock(clockTarget.date, clockTarget.description, direction);
      } else {
        paintClock(formatCalendarDay(clockDay), '연혁 사이의 시간', direction);
      }
    }
    const rolling = advanceClockDigits(timestamp);
    if (clockTravel.settled && !rolling) {
      finishClockTravel();
      return;
    }
    clockFrame = window.requestAnimationFrame(travelClock);
  }

  function setClockTarget(target, immediate = false) {
    const same = clockTarget && target.day === clockTarget.day &&
      target.date.value === clockTarget.date.value && target.live === clockTarget.live;
    clockTarget = target;
    if (same && !immediate) return;
    stopLiveClock();
    if (immediate || clockDay === null || target.day === null || reducedMotion.matches || document.hidden) {
      finishClockTravel();
      return;
    }
    if (!clockTravel) clockTravel = { previousTime: performance.now(), settled: false };
    else clockTravel.settled = false;
    if (clockFrame === null) clockFrame = window.requestAnimationFrame(travelClock);
  }

  function prepareJourneyClock(entries) {
    clockAnchors = entries.flatMap((entry, index) => {
      const date = formatHistoryDate(entry);
      return date.iso ? [{ index, day: calendarDay(date.iso), date, description: entry.title, live: false }] : [];
    });
    if (activeRoute === 'career' && entries.length) {
      const day = localToday();
      clockAnchors.push({ index: entries.length - 1, day, date: formatCalendarDay(day), description: '현재', live: true });
    }
    journeyClock.hidden = !entries.length;
    if (!entries.length) {
      stopLiveClock();
      if (clockFrame !== null) window.cancelAnimationFrame(clockFrame);
      clockFrame = null;
      clockTravel = null;
      clockTarget = null;
      clockDay = null;
      clockVelocity = 0;
      settleClockDigits();
      return;
    }
    const first = clockAnchors[0] || {
      day: null, date: formatHistoryDate(entries[0]), description: entries[0].title, live: false
    };
    setClockTarget(first);
  }

  function updateJourneyClock(positions, readingLine, atBottom) {
    if (!clockAnchors.length) return;
    const last = clockAnchors[clockAnchors.length - 1];
    if (last.live) {
      last.day = localToday();
      last.date = formatCalendarDay(last.day);
    }
    if (atBottom || readingLine >= positions[last.index].y) {
      setClockTarget({ ...last });
      return;
    }
    if (readingLine <= positions[clockAnchors[0].index].y) {
      setClockTarget({ ...clockAnchors[0] });
      return;
    }
    for (let index = 1; index < clockAnchors.length; index++) {
      const next = clockAnchors[index];
      if (readingLine > positions[next.index].y) continue;
      const previous = clockAnchors[index - 1];
      const start = positions[previous.index].y;
      const span = Math.max(1, positions[next.index].y - start);
      const fraction = Math.max(0, Math.min(1, (readingLine - start) / span));
      const day = Math.round(previous.day + (next.day - previous.day) * fraction);
      // Preserve month-only precision at each milestone instead of inventing an event day.
      const anchor = day === previous.day ? previous : day === next.day && !next.live ? next : null;
      setClockTarget(anchor ? { ...anchor } : {
        day, date: formatCalendarDay(day), description: '연혁 사이의 시간', live: false
      });
      return;
    }
  }

  function finishWelcome() {
    window.clearTimeout(welcomeTimer);
    welcomeTimer = null;
    welcome.classList.remove('is-typing');
    welcomeLetters.forEach(letter => letter.classList.remove('is-cursor'));
  }

  function renderWelcome(route) {
    welcome.hidden = route !== 'university';
    if (welcome.hidden) {
      finishWelcome();
      return;
    }
    if (welcomePlayed) return;
    welcomePlayed = true;
    if (reducedMotion.matches) return;

    // Keep the complete text in the layout; only reveal each syllable as it is typed.
    const lineEnds = [];
    welcomeLines.forEach(line => {
      const letters = Array.from(line.textContent).map(char => element('span', 'welcome-letter', char));
      line.replaceChildren(...letters);
      welcomeLetters.push(...letters);
      lineEnds.push(welcomeLetters.length);
    });
    welcome.classList.add('is-typing');
    let index = 0;
    function typeNextLetter() {
      if (welcome.hidden || reducedMotion.matches) {
        finishWelcome();
        return;
      }
      if (index > 0) welcomeLetters[index - 1].classList.remove('is-cursor');
      if (index === welcomeLetters.length) {
        finishWelcome();
        return;
      }
      const letter = welcomeLetters[index++];
      letter.classList.add('is-visible', 'is-cursor');
      const delay = lineEnds.includes(index) ? 360 : letter.textContent === ',' ? 190 : 85;
      welcomeTimer = window.setTimeout(typeNextLetter, delay);
    }
    welcomeTimer = window.setTimeout(typeNextLetter, 180);
  }

  function updateHistoryProgress() {
    historyFrame = null;
    if (!historyNodes.length || historyList.hidden) return;

    // Read geometry together before updating styles. Expanded details can change every later date.
    const listRect = historyList.getBoundingClientRect();
    const positions = historyNodes.map(node => {
      const rect = node.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    });
    const first = positions[0];
    const last = positions[positions.length - 1];
    const length = Math.max(0, last.y - first.y);
    const readingLine = Math.max(header.getBoundingClientRect().bottom + 24,
      Math.min(window.innerHeight * .58, footer.getBoundingClientRect().top - 24));
    const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    const complete = reducedMotion.matches || atBottom;
    const fill = complete ? length : Math.max(0, Math.min(length, readingLine - first.y));
    // Motion preferences affect the rail, while the date always follows the reading position.
    const reached = positions.map(position => atBottom || position.y <= readingLine);
    const current = reached.lastIndexOf(true);

    historyList.style.setProperty('--history-rail-left', `${first.x - listRect.left}px`);
    historyList.style.setProperty('--history-rail-top', `${first.y - listRect.top}px`);
    historyList.style.setProperty('--history-rail-height', `${length}px`);
    historyList.style.setProperty('--history-fill', `${fill}px`);
    historyList.classList.add('is-scroll-tracked');
    historyNodes.forEach((node, index) => {
      const row = node.closest('.entry');
      row.classList.toggle('is-reached', complete || reached[index]);
      row.classList.toggle('is-current', !reducedMotion.matches && index === current);
    });
    updateJourneyClock(positions, readingLine, atBottom);
    updateSkyProgress(positions, readingLine, atBottom);
  }

  function scheduleHistoryProgress() {
    if (historyFrame === null) historyFrame = window.requestAnimationFrame(updateHistoryProgress);
  }

  function renderHighlights(items = []) {
    const list = document.getElementById('chapter-highlights');
    list.replaceChildren();
    list.hidden = items.length === 0;
    items.forEach(item => {
      const row = element('li');
      row.append(element('strong', '', item.value), element('span', '', item.label));
      list.append(row);
    });
  }

  function renderCredentials(credentials) {
    const card = document.getElementById('credentials-card');
    const list = document.getElementById('credentials-list');
    list.replaceChildren();
    card.hidden = !credentials?.items?.length;
    if (card.hidden) return;
    setText('credentials-title', credentials.title);
    credentials.items.forEach(item => {
      const row = element('li', 'credential');
      row.append(element('h3', '', item.title), element('p', 'credential-meta', item.meta));
      if (item.description) row.append(element('p', '', item.description));
      list.append(row);
    });
  }

  function clearTransition() {
    if (!transition) return;
    const previous = transition;
    transition = null;
    previous.animations.forEach(animation => animation.cancel());
    previous.outgoing.remove();
  }

  function snapshotChapter() {
    const outgoing = chapter.cloneNode(true);
    outgoing.classList.add('chapter--outgoing');
    outgoing.removeAttribute('aria-labelledby');
    outgoing.setAttribute('aria-hidden', 'true');
    outgoing.inert = true;
    outgoing.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
    stage.append(outgoing);
    return outgoing;
  }

  function slideChapter(outgoing, direction) {
    if (!outgoing) return;
    const distance = document.documentElement.clientWidth * direction;
    const options = { duration: 620, easing: 'cubic-bezier(.22,.68,0,1)', fill: 'both' };
    const leavingFrames = [
      { transform: 'translate3d(0,0,0)' },
      { transform: `translate3d(${-distance}px,0,0)` }
    ];
    const enteringFrames = [
      { transform: `translate3d(${distance}px,0,0)` },
      { transform: 'translate3d(0,0,0)' }
    ];
    const animations = [
      outgoing.animate(leavingFrames, options),
      chapter.animate(enteringFrames, options)
    ];
    const current = { outgoing, animations };
    transition = current;
    Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
      if (transition === current) clearTransition();
    });
  }

  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      clearTransition();
      finishSkyJourney();
      finishWelcome();
      settleClockDigits();
      finishClockTravel();
    }
    scheduleHistoryProgress();
  });

  function renderFields(fields) {
    const list = document.getElementById('overview-fields');
    list.replaceChildren();
    fields.forEach(field => {
      const row = document.createElement('div');
      row.className = 'field-row';
      const label = document.createElement('dt');
      label.textContent = field.label;
      const value = document.createElement('dd');
      value.textContent = field.value || '등록 예정';
      if (!field.value) value.className = 'is-empty';
      row.append(label, value);
      list.append(row);
    });
    document.querySelector('.empty-badge').hidden = fields.every(field => Boolean(field.value));
  }

  function renderEntries(entries) {
    const container = document.getElementById('entries');
    historyNodes = [];
    container.classList.remove('is-scroll-tracked');
    container.style.setProperty('--history-fill', '0px');
    container.replaceChildren();
    container.hidden = entries.length === 0;
    document.getElementById('empty-story').hidden = entries.length > 0;
    entries.forEach(entry => {
      const row = element('li', 'entry');
      const date = element('div', 'history-date');
      if (entry.date) {
        const year = element(entry.date.iso ? 'time' : 'span', 'history-year', entry.date.year);
        if (entry.date.iso) year.dateTime = entry.date.iso;
        date.append(year, element('span', 'history-period', entry.date.label));
      }
      const marker = element('span', 'history-marker');
      marker.setAttribute('aria-hidden', 'true');
      const node = element('span', 'history-node');
      marker.append(node);
      historyNodes.push(node);
      const article = element('div', 'entry-content');
      row.append(date, marker, article);
      if (entry.meta) {
        const meta = document.createElement('p');
        meta.className = 'entry-meta';
        meta.textContent = entry.meta;
        article.append(meta);
      }
      const title = document.createElement('h3');
      title.textContent = entry.title;
      article.append(title);
      if (entry.subtitle) article.append(element('p', 'entry-subtitle', entry.subtitle));
      const description = document.createElement('p');
      description.textContent = entry.description;
      article.append(description);
      if (entry.bullets?.length) {
        const bullets = element('ul', 'entry-bullets');
        entry.bullets.forEach(text => bullets.append(element('li', '', text)));
        article.append(bullets);
      }
      if (entry.outcome) article.append(element('p', 'entry-outcome', entry.outcome));
      if (entry.tags?.length) {
        const tags = element('ul', 'entry-tags');
        tags.setAttribute('aria-label', '관련 기술과 역량');
        entry.tags.forEach(text => tags.append(element('li', '', text)));
        article.append(tags);
      }
      if (entry.details?.length) {
        const details = element('details', 'entry-details');
        const summary = element('summary', '', '자세히 보기');
        summary.append(element('span', 'sr-only', `: ${entry.title}`));
        details.append(summary);
        entry.details.forEach(item => {
          const section = element('div', 'detail-section');
          section.append(element('h4', '', item.title), element('p', '', item.text));
          details.append(section);
        });
        article.append(details);
      }
      const entryLinks = entry.links || (entry.url ? [{ label: '프로젝트 보기', url: entry.url }] : []);
      const linkList = element('div', 'entry-links');
      entryLinks.forEach(item => {
        try {
          const url = new URL(item.url);
          if (['https:', 'http:'].includes(url.protocol)) {
            const link = document.createElement('a');
            link.href = url.href;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = `${item.label} ↗`;
            link.setAttribute('aria-label', `${entry.title} ${item.label} (새 탭)`);
            linkList.append(link);
          }
        } catch { /* 올바르지 않은 링크는 표시하지 않습니다. */ }
      });
      if (linkList.childElementCount) article.append(linkList);
      container.append(row);
    });
  }

  function renderRoute() {
    if (location.hash === '#main' && activeRoute) return;
    const hash = location.hash.slice(1);
    const route = routes.includes(hash) ? hash : 'university';
    if (!routes.includes(hash)) history.replaceState(null, '', `#${route}`);
    if (activeRoute === route) return;
    const firstRender = activeRoute === null;
    const previousIndex = routes.indexOf(activeRoute);
    clearTransition();
    const outgoing = !firstRender && !reducedMotion.matches && typeof chapter.animate === 'function'
      ? snapshotChapter() : null;
    activeRoute = route;
    setSkyScene(route, 0, firstRender);
    const index = routes.indexOf(route);
    const number = String(index + 1).padStart(2, '0');
    const page = content[route];
    document.documentElement.style.setProperty('--accent', page.accent);
    document.documentElement.style.setProperty('--accent-rgb', page.accentRgb);
    document.title = `${page.title} — 김현우 포트폴리오`;
    document.querySelector('meta[name="description"]').content = `김현우 포트폴리오 · ${page.title} — ${page.description.replace(/\n/g, ' ')}`;
    setText('counter', number);
    setText('chapter-number', `CHAPTER ${number}`);
    setText('chapter-english', page.english);
    renderWelcome(route);
    let heading = document.getElementById('chapter-title');
    const headingTag = route === 'university' ? 'h2' : 'h1';
    if (heading.tagName.toLowerCase() !== headingTag) {
      const replacement = element(headingTag, 'chapter-title');
      replacement.id = 'chapter-title';
      replacement.tabIndex = -1;
      heading.replaceWith(replacement);
      heading = replacement;
    }
    heading.textContent = page.title;
    const dot = document.createElement('span');
    dot.className = 'title-dot';
    dot.setAttribute('aria-hidden', 'true');
    dot.textContent = '.';
    heading.append(dot);
    setText('chapter-tagline', page.tagline);
    setText('chapter-description', page.description);
    setText('history-range', page.historyRange || '');
    setText('overview-title', page.overviewTitle);
    setText('story-eyebrow', page.storyEyebrow);
    setText('story-title', page.storyTitle);
    setText('empty-title', page.emptyTitle);
    setText('empty-description', page.emptyDescription);
    setText('footnote', page.footnote);
    document.querySelector('.footnote-number').textContent = `${number} — 03`;
    renderFields(page.fields);
    renderEntries(page.entries);
    renderHighlights(page.highlights);
    renderCredentials(page.credentials);
    prepareJourneyClock(page.entries);
    links.forEach((link, i) => {
      link.classList.toggle('is-active', i === index);
      link.classList.toggle('is-visited', i < index);
      if (i === index) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    document.getElementById('timeline-progress').style.width = `${index * 50}%`;
    if (!firstRender) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      slideChapter(outgoing, index > previousIndex ? 1 : -1);
      setText('route-announcement', `${page.title} 화면, ${index + 1} / 3`);
    }
    scheduleHistoryProgress();
  }

  document.querySelector('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    // Keep the chapter hash so refresh and browser history retain the current screen.
    const main = document.getElementById('main');
    main.focus({ preventScroll: true });
    main.scrollIntoView({ block: 'start', behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  });

  document.getElementById('welcome-continue').addEventListener('click', () => {
    finishWelcome();
    document.getElementById('chapter-title').focus({ preventScroll: true });
    document.querySelector('.chapter-lead').scrollIntoView({ block: 'start', behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  });

  document.querySelector('.timeline').addEventListener('keydown', event => {
    const index = links.indexOf(document.activeElement);
    if (index < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
    links[next].focus({ preventScroll: true });
    location.hash = routes[next];
  });
  window.addEventListener('hashchange', renderRoute);
  window.addEventListener('scroll', scheduleHistoryProgress, { passive: true });
  window.addEventListener('resize', scheduleHistoryProgress, { passive: true });
  document.addEventListener('visibilitychange', () => {
    skyBackground.classList.toggle('is-paused', document.hidden);
    if (document.hidden) {
      finishSkyJourney();
      window.clearTimeout(clockTimer);
      clockTimer = null;
    } else {
      if (clockLive) tickLiveClock();
      scheduleHistoryProgress();
    }
  });
  historyList.addEventListener('toggle', scheduleHistoryProgress, { capture: true });
  if (typeof ResizeObserver === 'function') {
    const historyObserver = new ResizeObserver(scheduleHistoryProgress);
    historyObserver.observe(chapter);
  }
  if (document.fonts) document.fonts.ready.then(scheduleHistoryProgress);
  skyBackground.classList.toggle('is-paused', document.hidden);
  renderRoute();
})();
