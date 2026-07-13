/* MZJ CRM mobile/iOS presentation enhancements.
   This file does not read or write CRM/Firebase data. */
(() => {
  'use strict';

  const MOBILE_BREAKPOINT = 900;

  const menuIcon = `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`;

  function closeMenu() {
    document.body.classList.remove('mobile-nav-open');
    const toggle = document.querySelector('.mobile-menu-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  function openMenu() {
    document.body.classList.add('mobile-nav-open');
    const toggle = document.querySelector('.mobile-menu-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
  }

  function ensureOverlay() {
    if (document.querySelector('.mobile-nav-overlay')) return;
    const overlay = document.createElement('button');
    overlay.type = 'button';
    overlay.className = 'mobile-nav-overlay';
    overlay.setAttribute('aria-label', 'إغلاق القائمة');
    overlay.addEventListener('click', closeMenu);
    document.body.appendChild(overlay);
  }

  function enhanceShell() {
    const sidebar = document.querySelector('.sidebar');
    const topbar = document.querySelector('.topbar');
    if (!sidebar || !topbar) return;

    ensureOverlay();

    if (!topbar.querySelector('.mobile-menu-toggle')) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'mobile-menu-toggle';
      toggle.setAttribute('aria-label', 'فتح القائمة الرئيسية');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = menuIcon;
      toggle.addEventListener('click', () => {
        if (document.body.classList.contains('mobile-nav-open')) closeMenu();
        else openMenu();
      });
      topbar.insertBefore(toggle, topbar.firstChild);
    }

    if (!sidebar.querySelector('.mobile-sidebar-close')) {
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'mobile-sidebar-close';
      close.setAttribute('aria-label', 'إغلاق القائمة');
      close.textContent = '×';
      close.addEventListener('click', closeMenu);
      sidebar.insertBefore(close, sidebar.firstChild);
    }

    if (!sidebar.dataset.mobileBound) {
      sidebar.dataset.mobileBound = 'true';
      sidebar.addEventListener('click', (event) => {
        if (event.target.closest('nav button')) closeMenu();
      });
    }
  }

  function getHeaderLabels(table) {
    const headerRows = Array.from(table.querySelectorAll('thead tr'));
    if (!headerRows.length) return [];
    const row = headerRows[headerRows.length - 1];
    return Array.from(row.children).map((cell) =>
      String(cell.textContent || '').replace(/\s+/g, ' ').trim()
    );
  }

  function enhanceTable(table) {
    if (!(table instanceof HTMLTableElement)) return;
    const shell = table.closest('.table-shell');
    if (!shell) return;

    const labels = getHeaderLabels(table);
    if (!labels.length) return;

    shell.classList.add('mzj-card-table');
    Array.from(table.tBodies).forEach((tbody) => {
      Array.from(tbody.rows).forEach((row) => {
        const cells = Array.from(row.cells);
        const isSummary = cells.length !== labels.length || cells.some((cell) => cell.colSpan > 1);
        row.classList.toggle('mzj-summary-row', isSummary);
        cells.forEach((cell, index) => {
          cell.dataset.label = isSummary ? '' : (labels[index] || 'بيانات');
        });
      });
    });
  }

  function enhanceTables(root = document) {
    if (root instanceof HTMLTableElement) enhanceTable(root);
    root.querySelectorAll?.('.table-shell table').forEach(enhanceTable);
  }

  function applyStandaloneClass() {
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
    document.documentElement.classList.toggle('mzj-standalone', Boolean(standalone));
  }

  function initialEnhance() {
    enhanceShell();
    enhanceTables();
    applyStandaloneClass();
  }

  let scheduled = false;
  const observer = new MutationObserver((mutations) => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      enhanceShell();
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) enhanceTables(node);
        }
      }
    });
  });

  function start() {
    initialEnhance();
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('resize', () => {
      if (window.innerWidth > MOBILE_BREAKPOINT) closeMenu();
    }, { passive: true });

    window.addEventListener('orientationchange', closeMenu, { passive: true });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });

    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch((error) => {
          console.warn('MZJ service worker registration skipped:', error);
        });
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
