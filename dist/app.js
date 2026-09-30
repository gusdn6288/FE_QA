(() => {
  'use strict';
  const routes = ['university', 'bootcamp', 'career'];
  const content = window.portfolioContent;
  const links = [...document.querySelectorAll('.timeline-stop')];
  const skyScenes = [...document.querySelectorAll('.sky-scene')];
  const skyBackground = document.querySelector('.scene-background');
  const themeStyle = document.documentElement.style;
  let themeTargets = [];
  let currentSkyTheme = null;
  const skyPalette = [
    { phase: -.18, top: [5,11,27], middle: [12,20,43], bottom: [24,30,55], sun: [232,126,93], glow: [76,94,156] },
    { phase: -.08, top: [19,30,56], middle: [117,94,128], bottom: [223,160,118], sun: [255,195,127], glow: [251,173,111] },
    { phase: .22, top: [118,180,220], middle: [157,204,231], bottom: [217,236,246], sun: [255,242,210], glow: [255,219,165] },
    { phase: .44, top: [112,174,215], middle: [151,198,229], bottom: [210,230,242], sun: [255,248,228], glow: [239,230,200] },
    { phase: .60, top: [108,167,211], middle: [151,198,227], bottom: [214,230,237], sun: [255,244,216], glow: [255,225,178] },
    { phase: .75, top: [64,106,151], middle: [172,170,176], bottom: [241,201,165], sun: [255,232,185], glow: [244,210,160] },
    { phase: .87, top: [40,43,80], middle: [181,108,111], bottom: [207,146,109], sun: [255,198,140], glow: [250,159,92] },
    { phase: 1.10, top: [7,16,34], middle: [17,27,53], bottom: [30,37,65], sun: [232,126,93], glow: [76,94,156] },
    { phase: 1.18, top: [5,11,27], middle: [12,20,43], bottom: [24,30,55], sun: [232,126,93], glow: [76,94,156] }
  ];
  // Local wall-clock hours, not geographic sunrise/sunset estimates.
  const skyHours = [[0,-.18], [5,-.18], [6,-.08], [8,.22], [12,.5], [16,.72], [18,.92], [20,1.18], [24,1.18]];
  let skyTimer = null;
  const scrollViewport = document.getElementById('main');
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

  function mixColor(start, end, amount) {
    return start.map((value, index) => Math.round(value + (end[index] - value) * amount));
  }

  function luminance(color) {
    const linear = color.map(value => {
      const channel = value / 255;
      return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
    });
    return linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722;
  }

  function colorContrast(foreground, background) {
    const first = luminance(foreground);
    const second = luminance(background);
    return (Math.max(first, second) + .05) / (Math.min(first, second) + .05);
  }

  function themeForBackground(background, warmth) {
    const dark = mixColor([4,13,22], [22,8,3], warmth);
    const light = mixColor([250,253,255], [255,253,247], warmth);
    let darkInk = colorContrast(dark, background) > colorContrast(light, background);
    let text = darkInk ? dark : light;
    if (colorContrast(text, background) < 4.5) {
      darkInk = colorContrast([0,0,0], background) > colorContrast([255,255,255], background);
      text = darkInk ? [0,0,0] : [255,255,255];
    }
    // Keep secondary text readable without placing a dark layer over the sky.
    const readable = color => {
      for (let step = 0; step <= 10; step++) {
        const candidate = mixColor(color, text, step / 10);
        if (colorContrast(candidate, background) >= 4.5) return candidate;
      }
      return text;
    };
    return {
      darkInk, text,
      muted: readable(darkInk ? mixColor([25,47,65], [61,36,27], warmth) : mixColor([221,235,250], [248,232,213], warmth)),
      faint: readable(darkInk ? mixColor([38,60,78], [75,47,35], warmth) : mixColor([205,225,245], [237,217,193], warmth)),
      accent: readable(darkInk ? mixColor([20,66,98], [93,45,25], warmth) : mixColor([175,218,252], [255,207,149], warmth)),
      surface: darkInk ? mixColor([233,245,252], [255,235,215], warmth) : mixColor([12,28,48], [50,28,36], warmth),
      status: readable(darkInk ? [20,89,69] : [157,231,196]),
      inverse: darkInk ? light : dark
    };
  }

  function paintTheme(style, palette) {
    const rgb = name => palette[name].join(',');
    const properties = {
      '--text': `rgb(${rgb('text')})`, '--muted': `rgb(${rgb('muted')})`,
      '--faint': `rgb(${rgb('faint')})`, '--accent': `rgb(${rgb('accent')})`,
      '--accent-rgb': rgb('accent'), '--surface': `rgba(${rgb('surface')},.84)`,
      '--on-accent': `rgb(${rgb('inverse')})`,
      '--border': `rgba(${rgb('accent')},.28)`, '--line': `rgba(${rgb('accent')},.4)`,
      '--status': `rgb(${rgb('status')})`, '--status-rgb': rgb('status'),
      '--label-shadow': `0 1px 8px rgba(${rgb('inverse')},.28)`
    };
    Object.entries(properties).forEach(([name, value]) => {
      if (style.getPropertyValue(name) !== value) style.setProperty(name, value);
    });
  }

  function drawTheme(sky, phase) {
    currentSkyTheme = { sky, phase };
    const warmth = skyBlend(.65, .88, phase) * (1 - skyBlend(.90, 1.10, phase));
    const base = themeForBackground(sky.middle, warmth);
    paintTheme(themeStyle, base);
    themeStyle.colorScheme = base.darkInk ? 'light' : 'dark';
    themeStyle.setProperty('--background', `rgb(${sky.bottom.join(',')})`);
    themeTargets.forEach(target => {
      if (!target.visible) return;
      const background = target.y <= .55
        ? mixColor(sky.top, sky.middle, target.y / .55)
        : mixColor(sky.middle, sky.bottom, (target.y - .55) / .45);
      paintTheme(target.node.style, themeForBackground(background, warmth));
    });
  }

  function measureThemeTargets() {
    const height = Math.max(1, window.innerHeight);
    const viewport = scrollViewport.getBoundingClientRect();
    themeTargets.forEach(target => {
      const rect = target.node.getBoundingClientRect();
      const fixed = target.node === header || target.node === footer || target.node === journeyClock;
      const visibleTop = fixed ? 0 : Math.max(0, viewport.top);
      const visibleBottom = fixed ? height : Math.min(height, viewport.bottom);
      target.visible = rect.bottom > visibleTop && rect.top < visibleBottom;
      const top = Math.max(visibleTop, rect.top);
      const bottom = Math.min(visibleBottom, rect.bottom);
      target.y = Math.max(0, Math.min(1, (top + bottom) / 2 / height));
    });
  }

  function prepareThemeTargets() {
    const cards = '.overview-card, .credentials-card, .entry-outcome, .entry-tags';
    const text = 'h1, h2, h3, h4, p, summary, .entry-bullets li, .entry-links a, .history-date, .history-node, .eyebrow, .chapter-highlights li, .section-label, .history-range, .content-footnote, .welcome-continue';
    const nodes = [header, footer, journeyClock, ...chapter.querySelectorAll(cards),
      ...[...chapter.querySelectorAll(text)].filter(node => !node.closest(cards))];
    themeTargets = [...new Set(nodes)].map(node => {
      node.classList.add('sky-toned');
      return { node, y: .5, visible: true };
    });
    measureThemeTargets();
    if (currentSkyTheme) drawTheme(currentSkyTheme.sky, currentSkyTheme.phase);
  }

  function drawSky(phase) {
    const bounded = Math.max(skyPalette[0].phase, Math.min(skyPalette[skyPalette.length - 1].phase, phase));
    let nextIndex = skyPalette.findIndex(stop => stop.phase >= bounded);
    nextIndex = Math.max(1, nextIndex);
    const previous = skyPalette[nextIndex - 1];
    const next = skyPalette[nextIndex];
    const fraction = (bounded - previous.phase) / (next.phase - previous.phase);
    const sky = Object.fromEntries(['top', 'middle', 'bottom', 'sun', 'glow']
      .map(name => [name, mixColor(previous[name], next[name], fraction)]));
    const color = name => sky[name].join(',');
    ['top', 'middle', 'bottom'].forEach(name => skyBackground.style.setProperty(`--sky-${name}`, `rgb(${color(name)})`));
    skyBackground.style.setProperty('--sun-color', `rgb(${color('sun')})`);
    skyBackground.style.setProperty('--sun-rgb', color('sun'));
    skyBackground.style.setProperty('--sky-glow', color('glow'));
    const dawn = skyBlend(-.06, .14, bounded);
    const night = Math.max(1 - skyBlend(-.18, -.04, bounded), skyBlend(.90, 1.10, bounded));
    const sunset = skyBlend(.65, .88, bounded);
    skyBackground.style.setProperty('--sky-glow-opacity', String((.20 + .22 * dawn) * (1 - night)));
    skyBackground.style.setProperty('--sun-x', `${12 + bounded * 76}%`);
    skyBackground.style.setProperty('--sun-y', `${92 - Math.sin(bounded * Math.PI) * 65}%`);
    const sunOpacity = dawn * (1 - skyBlend(.90, 1.10, bounded));
    skyBackground.style.setProperty('--sun-opacity', String(sunOpacity));
    skyBackground.style.setProperty('--sun-scale', String(1 + sunset * .18));
    const layers = { day: (1 - sunset) * (1 - night), sunset: sunset * (1 - night), night };
    skyScenes.forEach(scene => {
      const opacity = layers[scene.dataset.sky];
      scene.style.opacity = String(opacity);
      scene.classList.toggle('is-active', opacity > .001);
    });
    drawTheme(sky, bounded);
  }

  function skyPhaseForTime(now) {
    const hour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600 + now.getMilliseconds() / 3600000;
    const nextIndex = skyHours.findIndex(stop => stop[0] > hour);
    const [startHour, startPhase] = skyHours[nextIndex - 1];
    const [endHour, endPhase] = skyHours[nextIndex];
    return startPhase + (endPhase - startPhase) * (hour - startHour) / (endHour - startHour);
  }

  function stopRealtimeSky() {
    window.clearTimeout(skyTimer);
    skyTimer = null;
  }

  function updateRealtimeSky() {
    stopRealtimeSky();
    const now = new Date();
    drawSky(skyPhaseForTime(now));
    // Read Date on each tick so sleep, clock changes and midnight do not accumulate drift.
    if (!document.hidden) skyTimer = window.setTimeout(updateRealtimeSky, 1000 - now.getMilliseconds());
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
    measureThemeTargets();
    if (!historyNodes.length || historyList.hidden) {
      if (currentSkyTheme) drawTheme(currentSkyTheme.sky, currentSkyTheme.phase);
      return;
    }

    // Read geometry together before updating styles. Expanded details can change every later date.
    const listRect = historyList.getBoundingClientRect();
    const positions = historyNodes.map(node => {
      const rect = node.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    });
    const first = positions[0];
    const last = positions[positions.length - 1];
    const length = Math.max(0, last.y - first.y);
    const viewport = scrollViewport.getBoundingClientRect();
    const readingLine = viewport.top + scrollViewport.clientHeight * .58;
    const atBottom = scrollViewport.scrollTop + scrollViewport.clientHeight >= scrollViewport.scrollHeight - 2;
    const complete = reducedMotion.matches || atBottom;
    const fill = complete ? length : Math.max(0, Math.min(length, readingLine - first.y));
    // Motion preferences affect the rail, while the date always follows the reading position.
    const reached = positions.map(position => atBottom || position.y <= readingLine);
    const current = reached.lastIndexOf(true);

    if (currentSkyTheme) drawTheme(currentSkyTheme.sky, currentSkyTheme.phase);
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
    const distance = scrollViewport.clientWidth * direction;
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
    const index = routes.indexOf(route);
    const number = String(index + 1).padStart(2, '0');
    const page = content[route];
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
      scrollViewport.scrollTo({ top: 0, behavior: 'instant' });
      slideChapter(outgoing, index > previousIndex ? 1 : -1);
      setText('route-announcement', `${page.title} 화면, ${index + 1} / 3`);
    }
    prepareThemeTargets();
    scheduleHistoryProgress();
  }

  document.querySelector('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    // Keep the chapter hash so refresh and browser history retain the current screen.
    scrollViewport.focus({ preventScroll: true });
    scrollViewport.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  });

  document.getElementById('welcome-continue').addEventListener('click', () => {
    finishWelcome();
    document.getElementById('chapter-title').focus({ preventScroll: true });
    const top = document.querySelector('.chapter-lead').getBoundingClientRect().top -
      scrollViewport.getBoundingClientRect().top + scrollViewport.scrollTop - 24;
    scrollViewport.scrollTo({ top: Math.max(0, top), behavior: reducedMotion.matches ? 'instant' : 'smooth' });
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
  scrollViewport.addEventListener('scroll', scheduleHistoryProgress, { passive: true });
  window.addEventListener('resize', scheduleHistoryProgress, { passive: true });
  document.addEventListener('visibilitychange', () => {
    skyBackground.classList.toggle('is-paused', document.hidden);
    if (document.hidden) {
      stopRealtimeSky();
      window.clearTimeout(clockTimer);
      clockTimer = null;
    } else {
      updateRealtimeSky();
      if (clockLive) tickLiveClock();
      scheduleHistoryProgress();
    }
  });
  historyList.addEventListener('toggle', scheduleHistoryProgress, { capture: true });
  if (typeof ResizeObserver === 'function') {
    const historyObserver = new ResizeObserver(scheduleHistoryProgress);
    historyObserver.observe(chapter);
    historyObserver.observe(scrollViewport);
  }
  if (document.fonts) document.fonts.ready.then(scheduleHistoryProgress);
  skyBackground.classList.toggle('is-paused', document.hidden);
  updateRealtimeSky();
  renderRoute();
})();
