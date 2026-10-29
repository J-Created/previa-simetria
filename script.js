(() => {
  const WA = '5527995770668';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Entrada do hero
  setTimeout(() => document.documentElement.classList.add('is-loaded'), 60);

  // Links "Quero saber mais" com mensagem pronta por tratamento
  document.querySelectorAll('[data-wa]').forEach((a) => {
    const msg = `Olá! Vi o site e quero saber mais sobre ${a.dataset.wa}.`;
    a.href = `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
  });

  // Header fica sólido ao rolar
  const header = document.querySelector('.header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Menu mobile em tela cheia
  const burger = document.getElementById('burger');
  const menu = document.getElementById('menu');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('menu-open', open);
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

  // Animações ao rolar
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const sibs = [...e.target.parentElement.children].filter((el) => el.classList.contains('reveal'));
        e.target.style.transitionDelay = `${Math.min(sibs.indexOf(e.target), 4) * 90}ms`;
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  // ===== Comparador antes/depois =====
  const cmp = document.getElementById('compare');
  const handle = cmp.querySelector('.compare__handle');
  const after = cmp.querySelector('.compare__after');
  const before = cmp.querySelector('.compare__before img');
  let pos = 50;

  const setPos = (p) => {
    pos = Math.max(0, Math.min(100, p));
    cmp.style.setProperty('--pos', pos + '%');
    handle.setAttribute('aria-valuenow', Math.round(pos));
  };
  const fromEvent = (x) => {
    const r = cmp.getBoundingClientRect();
    setPos(((x - r.left) / r.width) * 100);
  };

  // Arrastar só no eixo horizontal; rolagem vertical do celular continua livre
  let dragging = false, startX = 0, startY = 0, decided = false;
  cmp.addEventListener('pointerdown', (e) => {
    dragging = true; decided = e.pointerType === 'mouse';
    startX = e.clientX; startY = e.clientY;
    if (decided) { cmp.setPointerCapture(e.pointerId); fromEvent(e.clientX); }
  });
  cmp.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    if (!decided) {
      const dx = Math.abs(e.clientX - startX), dy = Math.abs(e.clientY - startY);
      if (dx < 6 && dy < 6) return;
      if (dy > dx) { dragging = false; return; }
      decided = true; cmp.setPointerCapture(e.pointerId);
    }
    fromEvent(e.clientX);
  });
  const end = (e) => {
    if (dragging && !decided && e.type === 'pointerup') fromEvent(e.clientX); // toque simples
    dragging = false;
  };
  cmp.addEventListener('pointerup', end);
  cmp.addEventListener('pointercancel', end);
  handle.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { setPos(pos - 5); e.preventDefault(); }
    if (e.key === 'ArrowRight') { setPos(pos + 5); e.preventDefault(); }
  });

  // Ajusta a proporção do quadro à foto de cada caso
  const fitRatio = () => {
    if (after.naturalWidth) cmp.style.aspectRatio = `${after.naturalWidth} / ${after.naturalHeight}`;
  };
  after.addEventListener('load', fitRatio);
  fitRatio();

  // Abas de tratamentos
  const tabs = document.querySelectorAll('.tabs [data-case]');
  tabs.forEach((t) => t.addEventListener('click', () => {
    if (t.getAttribute('aria-selected') === 'true') return;
    tabs.forEach((x) => x.setAttribute('aria-selected', String(x === t)));
    const c = t.dataset.case;
    cmp.classList.add('is-switching');
    setTimeout(() => {
      const next = new Image();
      next.onload = () => {
        after.src = `img/${c}-depois.jpg`;
        before.src = `img/${c}-antes.jpg`;
        after.alt = `${t.textContent} — depois`;
        before.alt = `${t.textContent} — antes`;
        setPos(50);
        setTimeout(() => cmp.classList.remove('is-switching'), 30);
      };
      next.src = `img/${c}-depois.jpg`;
    }, 250);
  }));
  // pré-carrega os outros casos
  window.addEventListener('load', () => {
    tabs.forEach((t) => ['antes', 'depois'].forEach((k) => { new Image().src = `img/${t.dataset.case}-${k}.jpg`; }));
  });

  // Ao aparecer na tela, o divisor "respira" para mostrar que dá para arrastar
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const hint = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      hint.disconnect();
      const frames = [[0, 50], [700, 22], [1500, 78], [2200, 50]];
      const t0 = performance.now() + 500;
      const ease = (k) => 0.5 - Math.cos(Math.PI * k) / 2;
      const tick = (now) => {
        if (dragging) return;
        const t = now - t0;
        if (t < 0) return requestAnimationFrame(tick);
        for (let i = 1; i < frames.length; i++) {
          if (t <= frames[i][0]) {
            const [ta, pa] = frames[i - 1], [tb, pb] = frames[i];
            setPos(pa + (pb - pa) * ease((t - ta) / (tb - ta)));
            return requestAnimationFrame(tick);
          }
        }
        setPos(50);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    hint.observe(cmp);
  }
})();
