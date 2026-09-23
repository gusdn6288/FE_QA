(() => {
  'use strict';
  const routes = ['university', 'bootcamp', 'career'];
  const content = window.portfolioContent;
  const links = [...document.querySelectorAll('.timeline-stop')];
  const chapter = document.querySelector('.chapter');
  const stage = document.querySelector('.chapter-stage');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let transition = null;
  let activeRoute = null;
  const setText = (id, value) => { document.getElementById(id).textContent = value; };

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
    const distance = window.innerWidth * direction;
    const options = { duration: 620, easing: 'cubic-bezier(.22,.68,0,1)' };
    const animations = [
      outgoing.animate([
        { transform: 'translate3d(0,0,0)' },
        { transform: `translate3d(${-distance}px,0,0)` }
      ], options),
      chapter.animate([
        { transform: `translate3d(${distance}px,0,0)` },
        { transform: 'translate3d(0,0,0)' }
      ], options)
    ];
    const current = { outgoing, animations };
    transition = current;
    Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
      if (transition === current) clearTransition();
    });
  }

  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) clearTransition();
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
    container.replaceChildren();
    container.hidden = entries.length === 0;
    document.getElementById('empty-story').hidden = entries.length > 0;
    entries.forEach(entry => {
      const article = document.createElement('section');
      article.className = 'entry';
      if (entry.meta) {
        const meta = document.createElement('p');
        meta.className = 'entry-meta';
        meta.textContent = entry.meta;
        article.append(meta);
      }
      const title = document.createElement('h3');
      title.textContent = entry.title;
      const description = document.createElement('p');
      description.textContent = entry.description;
      article.append(title, description);
      if (entry.url) {
        try {
          const url = new URL(entry.url);
          if (['https:', 'http:'].includes(url.protocol)) {
            const link = document.createElement('a');
            link.href = url.href;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = '프로젝트 보기 ↗';
            link.setAttribute('aria-label', `${entry.title} 프로젝트 보기 (새 탭)`);
            article.append(link);
          }
        } catch { /* 올바르지 않은 링크는 표시하지 않습니다. */ }
      }
      container.append(article);
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
    document.documentElement.style.setProperty('--accent', page.accent);
    document.documentElement.style.setProperty('--accent-rgb', page.accentRgb);
    document.title = `${page.title} — 나의 포트폴리오`;
    document.querySelector('meta[name="description"]').content = `${page.title} — ${page.description.replace(/\n/g, ' ')}`;
    setText('counter', number);
    setText('chapter-number', `CHAPTER ${number}`);
    setText('chapter-english', page.english);
    const heading = document.getElementById('chapter-title');
    heading.textContent = page.title;
    const dot = document.createElement('span');
    dot.className = 'title-dot';
    dot.setAttribute('aria-hidden', 'true');
    dot.textContent = '.';
    heading.append(dot);
    setText('chapter-tagline', page.tagline);
    setText('chapter-description', page.description);
    setText('large-number', number);
    document.querySelector('.chapter-index>div>span').textContent = page.indexLabel;
    setText('overview-title', page.overviewTitle);
    setText('story-eyebrow', page.storyEyebrow);
    setText('story-title', page.storyTitle);
    setText('empty-title', page.emptyTitle);
    setText('empty-description', page.emptyDescription);
    setText('footnote', page.footnote);
    document.querySelector('.footnote-number').textContent = `${number} — 03`;
    renderFields(page.fields);
    renderEntries(page.entries);
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
  }

  document.querySelector('.timeline').addEventListener('keydown', event => {
    const index = links.indexOf(document.activeElement);
    if (index < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
    links[next].focus({ preventScroll: true });
    location.hash = routes[next];
  });
  window.addEventListener('hashchange', renderRoute);
  renderRoute();
})();
