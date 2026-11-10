/* =========================================================
   NEXUS HUB — Landing Page Interactions
   ========================================================= */
(function () {
  'use strict';

  /* ---------- DOM References ---------- */
  const header = document.getElementById('nx-header');
  const burger = document.getElementById('nx-burger');
  const nav = document.getElementById('nx-nav');
  const announcement = document.getElementById('nx-announcement');
  const announcementClose = document.getElementById('nx-announcement-close');
  const progressBar = document.getElementById('nx-progress-bar');
  const backToTopBtn = document.getElementById('nx-back-to-top');
  const ringFill = document.getElementById('nx-ring-fill');
  const RING_CIRCUMFERENCE = 125.66; // 2 * PI * 20

  const heroMedia = document.getElementById('hero-media');
  const heroBgImg = document.getElementById('hero-bg-img');
  const heroContent = document.getElementById('hero-content');
  const manifesto = document.getElementById('manifesto');
  const manifestoWords = document.querySelectorAll('.m-word');

  const journeyWrap = document.getElementById('journey');
  const journeyTrack = document.getElementById('journey-track');
  const journeySteps = document.querySelectorAll('#journey-steps .j-step');
  const journeyFills = [
    document.getElementById('j-fill-0'),
    document.getElementById('j-fill-1'),
    document.getElementById('j-fill-2'),
    document.getElementById('j-fill-3')
  ];
  const journeyIdxText = document.getElementById('j-current-idx');
  const journeyCards = document.querySelectorAll('.nx-journey-card');

  /* ---------- Announcement Bar & Dynamic Offset ---------- */
  function syncAnnouncementOffset() {
    if (!header) return;
    if (announcement && !announcement.classList.contains('closed')) {
      const h = announcement.offsetHeight || 44;
      document.documentElement.style.setProperty('--announcement-h', `${h + 12}px`);
      header.classList.add('has-announcement');
    } else {
      document.documentElement.style.setProperty('--announcement-h', '16px');
      header.classList.remove('has-announcement');
    }
  }

  if (announcement) {
    syncAnnouncementOffset();
    window.addEventListener('resize', syncAnnouncementOffset, { passive: true });
    window.addEventListener('orientationchange', syncAnnouncementOffset);
    if (announcementClose) {
      announcementClose.addEventListener('click', () => {
        announcement.classList.add('closed');
        syncAnnouncementOffset();
      });
    }
  }

  /* ---------- Mobile Burger Navigation & Touch Accordions ---------- */
  function closeMobileNav() {
    if (!nav || !burger) return;
    nav.classList.remove('open');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    header.classList.remove('menu-open');
    const ecoItem = document.querySelector('.nx-nav-item.has-menu');
    if (ecoItem) ecoItem.classList.remove('open');
  }

  if (burger && nav) {
    burger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = nav.classList.toggle('open');
      burger.classList.toggle('open', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
      header.classList.toggle('menu-open', isOpen);
    });

    // Close when clicking any regular link inside the mobile drawer
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        closeMobileNav();
      });
    });

    // Mobile touch accordion for Ecosystem dropdown
    const ecoBtn = document.getElementById('nav-ecosystem');
    if (ecoBtn) {
      ecoBtn.addEventListener('click', (e) => {
        if (window.innerWidth <= 991) {
          e.preventDefault();
          e.stopPropagation();
          const parent = ecoBtn.closest('.nx-nav-item');
          if (parent) parent.classList.toggle('open');
        }
      });
    }

    // Close drawer when clicking outside the floating header
    document.addEventListener('click', (e) => {
      if (nav.classList.contains('open') && !header.contains(e.target)) {
        closeMobileNav();
      }
    });

    // Close drawer on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        closeMobileNav();
      }
    });
  }

  /* ---------- Scroll Handling: Header Hide/Show, Progress, Parallax ---------- */
  let lastScrollY = window.scrollY;
  let ticking = false;

  function updateScrollState() {
    const currentScrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (currentScrollY / docHeight) * 100 : 0;
    const clampedProgress = Math.max(0, Math.min(progress, 100));

    // 1. Reading Progress Bar
    if (progressBar) {
      progressBar.style.width = `${clampedProgress}%`;
    }

    // 2. Circular Back-to-Top Ring
    if (ringFill) {
      const offset = RING_CIRCUMFERENCE - (clampedProgress / 100) * RING_CIRCUMFERENCE;
      ringFill.style.strokeDashoffset = `${offset}`;
    }
    if (backToTopBtn) {
      backToTopBtn.classList.toggle('visible', currentScrollY > 380);
    }

    // 3. Floating Pill Header (scrolled state & hide on scroll down)
    const isScrolledPast = currentScrollY > 40;
    header.classList.toggle('scrolled', isScrolledPast);

    // Hide if scrolling down past 160px; show immediately on scroll up
    if (currentScrollY > 160 && currentScrollY > lastScrollY + 6) {
      if (!nav.classList.contains('open')) {
        header.classList.add('nav-hidden');
      }
    } else if (currentScrollY < lastScrollY - 6 || currentScrollY <= 80) {
      header.classList.remove('nav-hidden');
    }
    lastScrollY = currentScrollY;

    // 4. Hero Parallax
    if (heroBgImg && currentScrollY < window.innerHeight * 1.2) {
      heroBgImg.style.transform = `translate3d(0, ${currentScrollY * 0.28}px, 0)`;
      if (heroContent) {
        heroContent.style.transform = `translate3d(0, ${currentScrollY * -0.16}px, 0)`;
        heroContent.style.opacity = Math.max(1 - currentScrollY / 720, 0);
      }
    }

    // 5. Scroll-Driven Text Reveal (The NEXUS Manifesto)
    if (manifesto && manifestoWords.length > 0) {
      const mRect = manifesto.getBoundingClientRect();
      const vh = window.innerHeight;
      const mStart = vh * 0.85;
      const mEnd = -mRect.height * 0.2;
      const mScrolled = mStart - mRect.top;
      const mTotal = mStart - mEnd;
      const mProgress = Math.max(0, Math.min(mScrolled / mTotal, 1));
      
      const wordsToLight = Math.floor(mProgress * (manifestoWords.length + 3));
      manifestoWords.forEach((word, idx) => {
        const isLit = idx < wordsToLight;
        if (isLit) {
          if (idx >= manifestoWords.length - 3) {
            word.classList.add('flame-lit');
            word.classList.remove('lit');
          } else {
            word.classList.add('lit');
            word.classList.remove('flame-lit');
          }
        } else {
          word.classList.remove('lit', 'flame-lit');
        }
      });
    }

    // 6. Pinned Horizontal "Founder Journey"
    if (journeyWrap && journeyTrack) {
      const jRect = journeyWrap.getBoundingClientRect();
      const jTotalScroll = journeyWrap.offsetHeight - window.innerHeight;
      if (jTotalScroll > 0) {
        const jScrolled = -jRect.top;
        const jProgress = Math.max(0, Math.min(jScrolled / jTotalScroll, 1));
        
        // Compute translation
        const trackWidth = journeyTrack.scrollWidth;
        const viewportWidth = window.innerWidth;
        const maxTranslate = Math.max(0, trackWidth - viewportWidth + (viewportWidth * 0.08));
        const translateX = -jProgress * maxTranslate;
        journeyTrack.style.transform = `translate3d(${translateX}px, 0, 0)`;

        // Compute active step index (0 to 4)
        const totalSteps = 5;
        const activeStep = Math.min(Math.floor(jProgress * totalSteps), totalSteps - 1);
        
        journeySteps.forEach((st, idx) => {
          st.classList.toggle('active', idx === activeStep);
        });

        // Update progress line fills
        journeyFills.forEach((fill, idx) => {
          if (!fill) return;
          const stepSegmentStart = idx / (totalSteps - 1);
          const stepSegmentEnd = (idx + 1) / (totalSteps - 1);
          if (jProgress <= stepSegmentStart) {
            fill.style.width = '0%';
          } else if (jProgress >= stepSegmentEnd) {
            fill.style.width = '100%';
          } else {
            const segP = (jProgress - stepSegmentStart) / (stepSegmentEnd - stepSegmentStart);
            fill.style.width = `${segP * 100}%`;
          }
        });

        // Update step counter text
        if (journeyIdxText) {
          journeyIdxText.textContent = `0${activeStep + 1}`;
        }

        // Highlight active card
        journeyCards.forEach((c, idx) => {
          c.classList.toggle('highlight', idx === activeStep);
        });
      }
    }

    ticking = false;
  }

  function requestScrollTick() {
    if (!ticking) {
      requestAnimationFrame(updateScrollState);
      ticking = true;
    }
  }

  window.addEventListener('scroll', requestScrollTick, { passive: true });
  window.addEventListener('resize', requestScrollTick);
  updateScrollState();

  /* ---------- Journey Steps Click to Scroll ---------- */
  journeySteps.forEach((stepEl, idx) => {
    stepEl.addEventListener('click', () => {
      if (!journeyWrap) return;
      const jOffsetTop = journeyWrap.offsetTop;
      const jTotalScroll = journeyWrap.offsetHeight - window.innerHeight;
      const targetScroll = jOffsetTop + (idx / 4) * jTotalScroll;
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    });
  });

  /* ---------- Back to Top Click ---------- */
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Active Section Navigation Indicator ---------- */
  const trackedSections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nx-nav-link[data-target]');

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.toggle('active', link.dataset.target === id);
        });
      }
    });
  }, {
    rootMargin: '-20% 0px -55% 0px',
    threshold: 0
  });

  trackedSections.forEach(sec => navObserver.observe(sec));

  /* ---------- Mobile Navigation ---------- */
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      burger.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Mobile: tap to expand mega menus
    nav.querySelectorAll('.has-menu > .nx-nav-link').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (window.matchMedia('(max-width: 991px)').matches) {
          e.preventDefault();
          btn.parentElement.classList.toggle('open');
        }
      });
    });

    // Close menu after picking a link
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      burger.classList.remove('open');
      nav.classList.remove('open');
      document.body.style.overflow = '';
    }));
  }

  /* ---------- Hero Word Rotator ---------- */
  const words = document.querySelectorAll('.word-rotator .word');
  if (words.length > 0) {
    let wi = 0;
    setInterval(() => {
      const cur = words[wi];
      cur.classList.remove('active');
      cur.classList.add('out');
      setTimeout(() => cur.classList.remove('out'), 800);
      wi = (wi + 1) % words.length;
      words[wi].classList.add('active');
    }, 2800);
  }

  /* ---------- Scroll Reveal for Elements ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  
  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 5) * 80}ms`;
    io.observe(el);
  });

  /* ---------- Stat Counters ---------- */
  const counterIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = +el.dataset.count;
      const dur = 1800;
      const start = performance.now();
      const tick = now => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(target * eased).toLocaleString('en-IN');
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      counterIO.unobserve(el);
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('[data-count]').forEach(el => counterIO.observe(el));

  /* ---------- Founders Carousel (center-focus, infinite) ---------- */
  const track = document.getElementById('founder-track');
  const dotsWrap = document.getElementById('founder-dots');

  if (track && dotsWrap) {
    const originals = Array.from(track.children);
    const n = originals.length;

    // Build 3 sets so there is always content on both sides
    originals.forEach(c => track.appendChild(c.cloneNode(true)));
    originals.forEach(c => track.appendChild(c.cloneNode(true)));
    const cards = Array.from(track.children);

    let active = n + 1; // start in middle set
    originals.forEach((_, i) => {
      const d = document.createElement('button');
      d.setAttribute('aria-label', `Go to founder ${i + 1}`);
      d.id = `founder-dot-${i + 1}`;
      d.addEventListener('click', () => go(n + i));
      dotsWrap.appendChild(d);
    });
    const dots = Array.from(dotsWrap.children);

    function sizes() {
      const small = window.matchMedia('(max-width: 680px)').matches;
      return small ? { w: 220, aw: 280, gap: 28 } : { w: 260, aw: 320, gap: 28 };
    }

    function layout(animate = true) {
      const { w, aw, gap } = sizes();
      const wrapW = track.parentElement.clientWidth;
      const left = active * (w + gap);
      const offset = wrapW / 2 - (left + aw / 2);
      track.style.transition = animate ? 'transform .7s cubic-bezier(.22,1,.36,1)' : 'none';
      track.style.transform = `translateX(${offset}px)`;
      cards.forEach((c, i) => {
        if (!animate) c.style.transition = 'none';
        c.classList.toggle('active', i === active);
        if (!animate) { void c.offsetWidth; c.style.transition = ''; }
      });
      dots.forEach((d, i) => d.classList.toggle('active', i === active % n));
    }

    function go(i) {
      active = i;
      layout(true);
      clearTimeout(go._t);
      go._t = setTimeout(() => {
        if (active < n || active >= 2 * n) {
          active = n + (active % n);
          layout(false);
        }
      }, 720);
    }

    cards.forEach((c, i) => c.addEventListener('click', () => go(i)));
    const nextBtn = document.getElementById('founder-next');
    const prevBtn = document.getElementById('founder-prev');
    if (nextBtn) nextBtn.addEventListener('click', () => { go(active + 1); resetAuto(); });
    if (prevBtn) prevBtn.addEventListener('click', () => { go(active - 1); resetAuto(); });

    let auto = setInterval(() => go(active + 1), 4500);
    function resetAuto() { clearInterval(auto); auto = setInterval(() => go(active + 1), 4500); }
    track.addEventListener('mouseenter', () => clearInterval(auto));
    track.addEventListener('mouseleave', resetAuto);

    // Touch swipe
    let sx = null;
    track.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) { go(active + (dx < 0 ? 1 : -1)); resetAuto(); }
      sx = null;
    });

    window.addEventListener('resize', () => layout(false));
    layout(false);
  }

  /* ---------- Program Tabs ---------- */
  const tabs = document.querySelectorAll('.nx-tab');
  const panels = document.querySelectorAll('.nx-tab-panel');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.toggle('active', x === t));
    panels.forEach(p => p.classList.toggle('active', p.dataset.panel === t.dataset.tab));
  }));

  /* ---------- Campus Events Filtering & RSVP ---------- */
  const eventPills = document.querySelectorAll('.nx-event-pill');
  const eventCards = document.querySelectorAll('.nx-event-card');
  eventPills.forEach(pill => {
    pill.addEventListener('click', () => {
      eventPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const filter = pill.dataset.filter;
      eventCards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });

  document.querySelectorAll('.event-rsvp-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.textContent = '✓ Reserved!';
      btn.style.background = '#15803d';
      btn.style.color = '#fff';
      btn.disabled = true;
    });
  });

  /* ---------- Voices Quotes ---------- */
  const chips = document.querySelectorAll('.nx-chip');
  const voices = document.querySelectorAll('.nx-voice');
  if (chips.length > 0 && voices.length > 0) {
    let vi = 0;
    function showVoice(i) {
      vi = i;
      chips.forEach((c, k) => c.classList.toggle('active', k === i));
      voices.forEach((v, k) => v.classList.toggle('active', k === i));
    }
    chips.forEach((c, i) => c.addEventListener('click', () => { showVoice(i); clearInterval(vAuto); }));
    const vAuto = setInterval(() => showVoice((vi + 1) % voices.length), 6000);
  }

  /* ---------- FAQ Accordion ---------- */
  const faqItems = document.querySelectorAll('.nx-faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.nx-faq-question');
    const answer = item.querySelector('.nx-faq-answer');
    if (!questionBtn || !answer) return;

    questionBtn.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');
      faqItems.forEach(other => {
        if (other !== item) {
          other.classList.remove('active');
          const otherBtn = other.querySelector('.nx-faq-question');
          const otherAns = other.querySelector('.nx-faq-answer');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          if (otherAns) otherAns.style.maxHeight = null;
        }
      });

      if (isOpen) {
        item.classList.remove('active');
        questionBtn.setAttribute('aria-expanded', 'false');
        answer.style.maxHeight = null;
      } else {
        item.classList.add('active');
        questionBtn.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  /* ---------- CTA Form Submit Feedback ---------- */
  const ctaForm = document.getElementById('cta-form');
  if (ctaForm) {
    ctaForm.addEventListener('submit', e => {
      e.preventDefault();
      const email = document.getElementById('cta-email');
      const note = document.getElementById('cta-note');
      if (note && email) {
        const val = email.value;
        note.textContent = `🎉 Welcome aboard! We'll reach out to ${val} within 48 hours.`;
        note.style.color = '#ffb39a';
        email.value = '';
        fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: val, source: 'cta_application', timestamp: new Date() })
        }).catch(() => {});
      }
    });
  }

  /* ---------- Newsletter Form Submit Feedback ---------- */
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', e => {
      e.preventDefault();
      const input = document.getElementById('fn-email');
      const submitBtn = document.getElementById('fn-submit-btn');
      if (input && submitBtn) {
        const email = input.value;
        submitBtn.innerHTML = '✓ Subscribed!';
        submitBtn.style.background = '#15803d';
        submitBtn.style.borderColor = '#15803d';
        input.value = '';
        input.placeholder = `Subscribed as ${email}!`;
        input.disabled = true;
        fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, source: 'weekly_dispatch', timestamp: new Date() })
        }).catch(() => {});
      }
    });
  }

  /* ---------- Footer Year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* ---------- Handle Logout Notification Toast ---------- */
  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('logged_out') === '1') {
      const toast = document.createElement('div');
      toast.id = 'nx-logout-toast';
      toast.innerHTML = `
        <div style="position: fixed; bottom: 28px; right: 28px; z-index: 99999; display: flex; align-items: center; gap: 12px; background: #0f172a; color: #f8fafc; border: 1px solid rgba(255,255,255,0.18); box-shadow: 0 12px 36px rgba(0,0,0,0.4); padding: 14px 22px; border-radius: 12px; font-family: inherit; font-size: 13.5px; font-weight: 600;">
          <span style="font-size: 18px;">🔒</span>
          <span>You have been logged out successfully.</span>
        </div>
      `;
      document.body.appendChild(toast);
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      setTimeout(() => {
        toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 400);
      }, 4000);
    }
  } catch (e) {}
})();
