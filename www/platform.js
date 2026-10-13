/**
 * platform.js — Platform, Audio, PWA & Touch Helper for E LIT / Angel's Stardust
 * Handles:
 *  1. Audio autoplay unlock on touch/click (Android WebView & mobile browsers)
 *  2. Multi-touch & long-press alternative for desktop dblclick secret triggers
 *  3. Safe LocalStorage wrapper
 *  4. Dynamic viewport height calculation (--vh)
 *  5. Fullscreen Toggle API (window.toggleFullscreen)
 *  6. PWA Install Prompt Banner & lifecycle
 *  7. Touch ergonomics & manipulation optimization
 */

(function () {
  'use strict';

  // 1. Dynamic viewport height fix
  function setViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
  setViewportHeight();
  window.addEventListener('resize', setViewportHeight, { passive: true });
  window.addEventListener('orientationchange', () => {
    setTimeout(setViewportHeight, 100);
  });

  // 2. Safe Storage Wrapper
  window.AppStorage = {
    getItem(key) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return window.__memStorage ? window.__memStorage[key] : null;
      }
    },
    setItem(key, val) {
      try {
        localStorage.setItem(key, val);
      } catch (e) {
        if (!window.__memStorage) window.__memStorage = {};
        window.__memStorage[key] = String(val);
      }
    },
    removeItem(key) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        if (window.__memStorage) delete window.__memStorage[key];
      }
    }
  };

  // 3. Audio Autoplay Unlocker
  let audioUnlocked = false;
  function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;

    // Find all audio elements on page
    const mediaEls = document.querySelectorAll('audio, video');
    mediaEls.forEach((media) => {
      if (media.autoplay && media.paused) {
        media.play().catch(() => {});
      }
    });

    ['click', 'touchstart', 'touchend', 'keydown'].forEach((evt) => {
      window.removeEventListener(evt, unlockAudio, true);
    });
  }

  ['click', 'touchstart', 'touchend', 'keydown'].forEach((evt) => {
    window.addEventListener(evt, unlockAudio, { capture: true, once: false, passive: true });
  });

  // 4. Secret Route Touch Helper (Long-press / Triple-tap for DR. MARY CLARK & landing screen)
  document.addEventListener('DOMContentLoaded', () => {
    const drClarkTriggers = document.querySelectorAll(
      '#dr-clark-trigger, [id*="dr-clark"], [class*="dr-clark"], #titleText, .window-title, .active-app'
    );

    function triggerSecret() {
      const isInSm = window.location.pathname.includes('/sm/');
      window.location.href = isInSm ? '../login.html' : 'login.html';
    }

    drClarkTriggers.forEach((el) => {
      let pressTimer = null;
      let tapCount = 0;
      let tapTimer = null;

      el.addEventListener('touchstart', () => {
        pressTimer = setTimeout(() => {
          if (navigator.vibrate) navigator.vibrate(50);
          triggerSecret();
        }, 650);
      }, { passive: true });

      el.addEventListener('touchend', () => {
        clearTimeout(pressTimer);
        tapCount++;
        clearTimeout(tapTimer);
        if (tapCount >= 3) {
          tapCount = 0;
          triggerSecret();
        } else {
          tapTimer = setTimeout(() => { tapCount = 0; }, 500);
        }
      }, { passive: true });

      el.addEventListener('touchmove', () => {
        clearTimeout(pressTimer);
      }, { passive: true });
    });

    // Landing page special: 3-finger tap or long press anywhere on video to access secret login
    if (window.location.pathname.endsWith('landing.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
      let landingPressTimer = null;
      window.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length >= 3) {
          triggerSecret();
          return;
        }
        landingPressTimer = setTimeout(() => {
          if (navigator.vibrate) navigator.vibrate(60);
          triggerSecret();
        }, 900);
      }, { passive: true });

      window.addEventListener('touchend', () => {
        clearTimeout(landingPressTimer);
      }, { passive: true });

      window.addEventListener('touchmove', () => {
        clearTimeout(landingPressTimer);
      }, { passive: true });
    }
  });

  // 5. Fullscreen Toggle API
  window.toggleFullscreen = function () {
    const doc = window.document;
    const docEl = doc.documentElement;
    const requestFullScreen = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
    const cancelFullScreen = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;

    if (!doc.fullscreenElement && !doc.webkitFullscreenElement && !doc.mozFullScreenElement && !doc.msFullscreenElement) {
      if (requestFullScreen) {
        requestFullScreen.call(docEl).catch(() => {});
      }
    } else {
      if (cancelFullScreen) {
        cancelFullScreen.call(doc).catch(() => {});
      }
    }
  };

  // 6. Touch Ergonomics: style injection
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    button, a, input, select, textarea, [role="button"], .clickable {
      touch-action: manipulation;
    }
    #pwa-install-badge {
      position: fixed;
      top: 14px;
      right: 18px;
      z-index: 999999;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(10, 10, 10, 0.92);
      border: 1px solid rgba(212, 168, 67, 0.5);
      border-radius: 4px;
      padding: 6px 12px;
      color: #d4a843;
      font-family: 'Space Grotesk', -apple-system, monospace;
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      cursor: pointer;
      user-select: none;
      animation: pwaBadgeFadeIn 0.4s ease;
      transition: background 0.2s, border-color 0.2s, transform 0.2s;
    }
    #pwa-install-badge:hover {
      background: rgba(26, 26, 26, 0.96);
      border-color: #d4a843;
      transform: translateY(-1px);
    }
    #pwa-install-badge .pwa-badge-star {
      font-size: 13px;
      color: #fff8e7;
    }
    #pwa-install-badge .pwa-badge-close {
      margin-left: 4px;
      padding: 0 4px;
      background: none;
      border: none;
      color: rgba(212, 168, 67, 0.6);
      font-size: 14px;
      line-height: 1;
      cursor: pointer;
    }
    #pwa-install-badge .pwa-badge-close:hover {
      color: #fff;
    }
    @keyframes pwaBadgeFadeIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 600px) {
      #pwa-install-badge {
        top: 8px;
        right: 8px;
        padding: 5px 9px;
        font-size: 10px;
      }
    }
  `;
  if (document.head) {
    document.head.appendChild(styleEl);
  } else {
    document.addEventListener('DOMContentLoaded', () => document.head.appendChild(styleEl));
  }

  // 7. PWA Install Prompt Handler
  let deferredInstallPrompt = null;
  window.deferredInstallPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    window.deferredInstallPrompt = e;

    if (sessionStorage.getItem('pwa_prompt_dismissed')) return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) return;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showInstallBadge);
    } else {
      showInstallBadge();
    }
  });

  function showInstallBadge() {
    if (document.getElementById('pwa-install-badge') || !deferredInstallPrompt) return;

    const badge = document.createElement('div');
    badge.id = 'pwa-install-badge';
    badge.setAttribute('role', 'button');
    badge.setAttribute('aria-label', 'Install application');
    badge.innerHTML = `
      <span class="pwa-badge-star">✦</span>
      <span>Install App</span>
      <button class="pwa-badge-close" title="Dismiss">×</button>
    `;

    badge.addEventListener('click', async (evt) => {
      if (evt.target.classList.contains('pwa-badge-close')) {
        evt.stopPropagation();
        badge.remove();
        sessionStorage.setItem('pwa_prompt_dismissed', '1');
        return;
      }
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const outcome = await deferredInstallPrompt.userChoice;
        if (outcome && outcome.outcome === 'accepted') {
          badge.remove();
        }
        deferredInstallPrompt = null;
      }
    });

    document.body.appendChild(badge);
  }

  window.addEventListener('appinstalled', () => {
    const badge = document.getElementById('pwa-install-badge');
    if (badge) badge.remove();
    deferredInstallPrompt = null;
    window.deferredInstallPrompt = null;
  });
})();
