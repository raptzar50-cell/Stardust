/**
 * E LIT — Clinical Archive
 * Eastbrook Therapeutic Institute
 * script.js
 */

document.addEventListener('DOMContentLoaded', () => {

  // ─── About Overlay ───────────────────────────────────────────
  const aboutBtn    = document.getElementById('about-btn');
  const overlay     = document.getElementById('about-overlay');
  const closeAbout  = document.getElementById('close-about');

  if (aboutBtn && overlay) {
    aboutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  if (closeAbout && overlay) {
    closeAbout.addEventListener('click', () => {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // ─── Locked file click feedback ──────────────────────────────
  const lockedItems = document.querySelectorAll('.file-item.file-locked');

  lockedItems.forEach(item => {
    item.addEventListener('click', () => {
      // Briefly flash red to indicate access denied
      item.style.transition = 'background 0.1s';
      item.style.background = 'rgba(192, 57, 43, 0.06)';
      setTimeout(() => {
        item.style.background = '';
      }, 400);
    });
  });

  // ─── Locked chapter card click feedback ──────────────────────
  const lockedCards = document.querySelectorAll('.chapter-card.locked');

  lockedCards.forEach(card => {
    card.addEventListener('click', () => {
      card.style.transform = 'translateX(-4px)';
      setTimeout(() => { card.style.transform = ''; }, 200);
    });
  });

  // ─── Scroll-triggered fade in for elements ───────────────────
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe cards and folders
  document.querySelectorAll('.chapter-card, .patient-folder, .document-sheet').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });

  // Mark as visible when intersection fires
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    .chapter-card.visible,
    .patient-folder.visible,
    .document-sheet.visible {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
    .chapter-card.accessible.visible:hover {
      transform: translateY(-8px) rotate(-0.5deg) !important;
    }
  `;
  document.head.appendChild(styleTag);

  // ─── Typewriter effect for hero title ────────────────────────
  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle) {
    heroTitle.style.opacity = '0';
    heroTitle.style.transition = 'opacity 0.8s ease';
    setTimeout(() => {
      heroTitle.style.opacity = '1';
    }, 300);
  }

  // ─── Header shrink on scroll ─────────────────────────────────
  const header = document.querySelector('.site-header');
  if (header) {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const currentScroll = window.scrollY;
      if (currentScroll > 80) {
        header.style.boxShadow = '0 2px 20px rgba(0,0,0,0.4)';
      } else {
        header.style.boxShadow = 'none';
      }
      lastScroll = currentScroll;
    }, { passive: true });
  }

  // ─── Redacted text hover reveal effect (visual only) ─────────
  const redactTexts = document.querySelectorAll('.redact-text');
  redactTexts.forEach(el => {
    el.title = '[CONTENT REDACTED — AUTHORIZATION REQUIRED]';
  });

  // ─── Document sheet paper crinkle on load ────────────────────
  const docSheet = document.querySelector('.document-sheet');
  if (docSheet) {
    docSheet.style.opacity = '0';
    docSheet.style.transform = 'translateY(16px) rotate(0.2deg)';
    docSheet.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    setTimeout(() => {
      docSheet.style.opacity = '1';
      docSheet.style.transform = 'translateY(0) rotate(0deg)';
    }, 200);
  }

  // ─── Console easter egg ───────────────────────────────────────
  console.log('%c E.T.I. — EASTBROOK THERAPEUTIC INSTITUTE', 'color: #2035a8; font-size: 14px; font-weight: bold; font-family: monospace;');
  console.log('%c CONFIDENTIAL ARCHIVE — AUTHORIZED ACCESS ONLY', 'color: #c0392b; font-size: 11px; font-family: monospace;');
  console.log('%c ETI-ARCH-2024 | CHAPTER 01 ACTIVE', 'color: #666; font-size: 10px; font-family: monospace;');

});
