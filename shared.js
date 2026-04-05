/* ============================================================
   EASYFIN — SHARED JAVASCRIPT
   Used by: index.html, agent-demo.html, sme-demo.html
   ============================================================ */

'use strict';

/* ------------------------------------------------------------
   HAMBURGER / MOBILE NAV
   ------------------------------------------------------------ */
function initMobileNav() {
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');
  if (!hamburger || !mobileNav) return;

  hamburger.addEventListener('click', function () {
    const isOpen = mobileNav.classList.toggle('is-open');
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  // Close when any link inside mobile nav is clicked
  mobileNav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      mobileNav.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  // Close on outside click
  document.addEventListener('click', function (e) {
    if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
      mobileNav.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ------------------------------------------------------------
   LOGO FALLBACK
   Replaces broken img with text fallback
   ------------------------------------------------------------ */
function initLogoFallback() {
  document.querySelectorAll('.logo-link img').forEach(function (img) {
    img.addEventListener('error', function () {
      img.style.display = 'none';
      var fallback = img.nextElementSibling;
      if (fallback && fallback.classList.contains('logo-fallback')) {
        fallback.style.display = 'block';
      }
    });
  });
}

/* ------------------------------------------------------------
   FADE-IN ON SCROLL
   Adds .is-visible to elements with [data-reveal] when they
   enter the viewport.
   ------------------------------------------------------------ */
function initScrollReveal() {
  var elements = document.querySelectorAll('[data-reveal]');
  if (!elements.length) return;

  // Apply initial hidden state
  elements.forEach(function (el) {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(24px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var el    = entry.target;
        var delay = el.dataset.revealDelay || '0';
        setTimeout(function () {
          el.style.opacity   = '1';
          el.style.transform = 'translateY(0)';
        }, parseInt(delay, 10));
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.15 });

  elements.forEach(function (el) { observer.observe(el); });
}

/* ------------------------------------------------------------
   ACTIVE NAV LINK
   Marks the current page's nav link as active based on filename
   ------------------------------------------------------------ */
function initActiveNav() {
  var currentFile = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.site-nav a, .mobile-nav a').forEach(function (link) {
    var href = link.getAttribute('href');
    if (href && href.split('/').pop() === currentFile) {
      link.classList.add('active');
    }
  });
}

/* ------------------------------------------------------------
   MODAL HELPERS
   Generic open/close for any modal-overlay + modal pair
   ------------------------------------------------------------ */
function openModal(overlayId) {
  var overlay = document.getElementById(overlayId);
  if (!overlay) return;
  overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeModal(overlayId) {
  var overlay = document.getElementById(overlayId);
  if (!overlay) return;
  overlay.classList.remove('is-open');
  document.body.style.overflow = '';
}

function initModalCloseTriggers() {
  // Close button inside modal
  document.querySelectorAll('[data-close-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.dataset.closeModal;
      closeModal(id);
    });
  });

  // Click on overlay backdrop (not modal itself)
  document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.is-open').forEach(function (overlay) {
        closeModal(overlay.id);
      });
    }
  });
}

/* ------------------------------------------------------------
   FORMAT HELPERS
   ------------------------------------------------------------ */
var EasyFin = window.EasyFin || {};

EasyFin.fmt = {
  /** Format a number as Thai Baht: 1234567 → "฿1,234,567" */
  baht: function (n) {
    return '\u0E3F' + Number(n).toLocaleString('en-US');
  },

  /** Format with 1 decimal: 8.5 → "8.5%" */
  pct: function (n, decimals) {
    return Number(n).toFixed(decimals !== undefined ? decimals : 1) + '%';
  },

  /** Compact: 1500000 → "1.5M" */
  compact: function (n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
    return String(n);
  }
};

window.EasyFin = EasyFin;

/* ------------------------------------------------------------
   TOAST NOTIFICATION
   A lightweight toast used across all pages.
   ------------------------------------------------------------ */
function showToast(message, type) {
  var existing = document.getElementById('toastNotif');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.id = 'toastNotif';
  var bgColor = type === 'error' ? 'var(--color-error)' : type === 'success' ? '#276749' : 'var(--color-dark-bg)';
  toast.style.cssText = [
    'position:fixed; bottom:24px; right:24px; z-index:1000;',
    'background:' + bgColor + ';',
    'color:#fff; padding:14px 20px; border-radius:6px;',
    'font-size:14px; font-family:var(--font-body, sans-serif);',
    'box-shadow:0 4px 20px rgba(0,0,0,0.3);',
    'transform:translateY(60px); opacity:0;',
    'transition:transform 0.3s ease, opacity 0.3s ease;',
    'max-width:360px; line-height:1.5;'
  ].join('');
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity   = '1';
    });
  });

  setTimeout(function () {
    toast.style.transform = 'translateY(60px)';
    toast.style.opacity   = '0';
    setTimeout(function () { toast.remove(); }, 350);
  }, 3500);
}

/* Expose globally for inline onclick attributes across all pages */
window.showToast   = showToast;
window.openModal   = openModal;
window.closeModal  = closeModal;

/* ------------------------------------------------------------
   INIT
   ------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', function () {
  initMobileNav();
  initLogoFallback();
  initScrollReveal();
  initActiveNav();
  initModalCloseTriggers();
});
