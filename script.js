/* =================================================================
   Juan Alfonso T. Agay — Portfolio interactions
   ================================================================= */
(function () {
    'use strict';

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const $ = (sel, ctx) => (ctx || document).querySelector(sel);
    const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

    /* ---------------------------------------------------------------
       Page load / preloader cleanup
    --------------------------------------------------------------- */
    function markLoaded() {
        document.body.classList.add('is-loaded');
        const pre = $('.preloader');
        if (pre) setTimeout(() => pre.remove(), reduce ? 0 : 2200);
    }
    if (document.readyState === 'complete') markLoaded();
    else window.addEventListener('load', markLoaded);
    // safety net so nothing stays hidden if `load` is slow/blocked
    setTimeout(() => document.body.classList.add('is-loaded'), 1500);

    /* ---------------------------------------------------------------
       Custom cursor (fine pointer only)
    --------------------------------------------------------------- */
    if (finePointer && !reduce) {
        const dot = $('.cursor-dot');
        const ring = $('.cursor-ring');
        if (dot && ring) {
            document.body.classList.add('cursor-on');
            let mx = window.innerWidth / 2, my = window.innerHeight / 2;
            let rx = mx, ry = my;

            window.addEventListener('mousemove', (e) => {
                mx = e.clientX; my = e.clientY;
                dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
            }, { passive: true });

            (function loop() {
                rx += (mx - rx) * 0.2;
                ry += (my - ry) * 0.2;
                ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
                requestAnimationFrame(loop);
            })();

            const HOVER = 'a, button, input, textarea, label, .showcase-frame, [data-cursor]';
            document.addEventListener('mouseover', (e) => {
                if (e.target.closest && e.target.closest(HOVER)) ring.classList.add('is-hover');
            });
            document.addEventListener('mouseout', (e) => {
                if (e.target.closest && e.target.closest(HOVER)) ring.classList.remove('is-hover');
            });
            document.addEventListener('mousedown', () => ring.classList.add('is-down'));
            document.addEventListener('mouseup', () => ring.classList.remove('is-down'));
            document.documentElement.addEventListener('mouseleave', () => {
                dot.style.opacity = '0'; ring.style.opacity = '0';
            });
            document.documentElement.addEventListener('mouseenter', () => {
                dot.style.opacity = '1'; ring.style.opacity = '1';
            });
        }
    }

    /* ---------------------------------------------------------------
       Magnetic elements
    --------------------------------------------------------------- */
    if (finePointer && !reduce) {
        $$('.btn, .pill, .nav-toggle, .footer-socials a, .submit-btn').forEach((el) => {
            const strength = el.classList.contains('btn') || el.classList.contains('submit-btn') ? 0.28 : 0.2;
            el.addEventListener('mousemove', (e) => {
                const r = el.getBoundingClientRect();
                const x = e.clientX - (r.left + r.width / 2);
                const y = e.clientY - (r.top + r.height / 2);
                el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
            });
            el.addEventListener('mouseleave', () => { el.style.transform = ''; });
        });
    }

    /* ---------------------------------------------------------------
       Hero parallax
    --------------------------------------------------------------- */
    if (finePointer && !reduce) {
        const hero = $('.hero');
        const layers = $$('[data-parallax]');
        if (hero && layers.length) {
            let ticking = false, lastX = 0, lastY = 0;
            hero.addEventListener('mousemove', (e) => {
                lastX = e.clientX - window.innerWidth / 2;
                lastY = e.clientY - window.innerHeight / 2;
                if (!ticking) {
                    ticking = true;
                    requestAnimationFrame(() => {
                        layers.forEach((l) => {
                            const s = parseFloat(l.dataset.parallax) || 0;
                            l.style.transform = `translate(${lastX * s}px, ${lastY * s}px)`;
                        });
                        ticking = false;
                    });
                }
            }, { passive: true });
            hero.addEventListener('mouseleave', () => {
                layers.forEach((l) => { l.style.transform = ''; });
            });
        }
    }

    /* ---------------------------------------------------------------
       Header scroll state
    --------------------------------------------------------------- */
    const header = $('#siteHeader');
    if (header) {
        const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* ---------------------------------------------------------------
       Mobile menu
    --------------------------------------------------------------- */
    const navToggle = $('#navToggle');
    const mobileMenu = $('#mobileMenu');
    function closeMenu() {
        document.body.classList.remove('menu-open');
        if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
        if (mobileMenu) mobileMenu.setAttribute('aria-hidden', 'true');
    }
    if (navToggle && mobileMenu) {
        navToggle.addEventListener('click', () => {
            const open = document.body.classList.toggle('menu-open');
            navToggle.setAttribute('aria-expanded', String(open));
            mobileMenu.setAttribute('aria-hidden', String(!open));
        });
        $$('a', mobileMenu).forEach((a) => a.addEventListener('click', closeMenu));
    }

    /* ---------------------------------------------------------------
       Smooth scroll for in-page links
    --------------------------------------------------------------- */
    $$('a[href^="#"]').forEach((a) => {
        a.addEventListener('click', function (e) {
            const id = this.getAttribute('href');
            if (id === '#' || id.length < 2) return;
            const target = document.querySelector(id);
            if (!target) return;
            e.preventDefault();
            closeMenu();
            target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        });
    });

    /* ---------------------------------------------------------------
       Reveal on scroll (sections + staggered grids)
    --------------------------------------------------------------- */
    const revealEls = $$('.reveal, .stagger');
    if ('IntersectionObserver' in window && !reduce) {
        const io = new IntersectionObserver((entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
        revealEls.forEach((el) => io.observe(el));
    } else {
        revealEls.forEach((el) => el.classList.add('visible'));
    }

    /* ---------------------------------------------------------------
       Active nav link tracking
    --------------------------------------------------------------- */
    const navLinks = $$('.nav-desktop a');
    const sections = navLinks
        .map((a) => document.querySelector(a.getAttribute('href')))
        .filter(Boolean);
    if ('IntersectionObserver' in window && sections.length) {
        const spy = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const id = '#' + entry.target.id;
                    navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === id));
                }
            });
        }, { threshold: 0.4, rootMargin: '-30% 0px -55% 0px' });
        sections.forEach((s) => spy.observe(s));
    }

    /* ---------------------------------------------------------------
       SAP project showcase — tabbed dashboards
    --------------------------------------------------------------- */
    const showcaseData = [
        { src: 'images/sap-financial-overview.png', alt: 'SAP Analytics Cloud — Financial Overview dashboard', caption: 'KPI summary of income, expenditure and net income, with household income by region and an interactive Philippine geo-map.' },
        { src: 'images/sap-income-analysis.png', alt: 'SAP Analytics Cloud — Income Analysis dashboard', caption: 'Household income broken down by region, education level, source (wage / business / other) and occupation.' },
        { src: 'images/sap-expenditure-analysis.png', alt: 'SAP Analytics Cloud — Expenditure Analysis dashboard', caption: 'Spending patterns across regions, household types and housing categories, totalling ₱6 Billion.' },
        { src: 'images/sap-savings.png', alt: 'SAP Analytics Cloud — Savings and Financial Health dashboard', caption: 'Net income and savings of ₱3.36 Billion analysed by region, occupation and household size.' },
        { src: 'images/sap-gender-demographics.png', alt: 'SAP Analytics Cloud — Gender Demographics dashboard', caption: 'Income distribution by gender (76.7% / 23.3%), household size and occupation across 176K respondents.' }
    ];
    const showcaseImg = $('#showcaseImg');
    const showcaseCaption = $('#showcaseCaption');
    const showcaseTabs = $$('.showcase-tab');
    showcaseTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const data = showcaseData[Number(tab.dataset.index)];
            if (!data || !showcaseImg) return;
            showcaseImg.src = data.src;
            showcaseImg.alt = data.alt;
            if (showcaseCaption) showcaseCaption.textContent = data.caption;
            showcaseTabs.forEach((t) => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
        });
    });

    /* ---------------------------------------------------------------
       Lightbox
    --------------------------------------------------------------- */
    const lightbox = $('#lightbox');
    const lightboxImg = $('#lightboxImg');
    const lightboxClose = $('#lightboxClose');
    const showcaseFrame = $('#showcaseFrame');
    function openLightbox(src, alt) {
        if (!lightbox || !lightboxImg) return;
        lightboxImg.src = src;
        lightboxImg.alt = alt || '';
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.classList.add('no-scroll');
    }
    function closeLightbox() {
        if (!lightbox) return;
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('no-scroll');
    }
    if (showcaseFrame) showcaseFrame.addEventListener('click', () => openLightbox(showcaseImg.src, showcaseImg.alt));

    // Project screenshot grids → lightbox
    $$('.shot').forEach((btn) => {
        const img = btn.querySelector('img');
        if (!img) return;
        btn.addEventListener('click', () => openLightbox(img.src, img.alt));
    });
    // Collapse galleries whose images all failed to load (e.g. not added yet)
    window.addEventListener('load', () => {
        $$('.shot-grid').forEach((grid) => {
            if (!grid.querySelector('.shot')) grid.style.display = 'none';
        });
    });
    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightbox) lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { closeLightbox(); closeMenu(); }
    });

    /* ---------------------------------------------------------------
       Contact form
    --------------------------------------------------------------- */
    const contactForm = $('#contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Thanks for reaching out! Your message has been received.');
            contactForm.reset();
        });
    }
})();
