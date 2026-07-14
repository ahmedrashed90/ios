/* MZJ CRM v21 - open each customer conversation at the newest message.
   UI behavior only. No Firebase paths, customer data, statuses, or send logic are changed. */
(() => {
  'use strict';

  const SELECTOR = '.messages-list';
  const initialized = new WeakSet();
  const state = new WeakMap();

  function isNearBottom(element, threshold = 120) {
    return element.scrollHeight - element.scrollTop - element.clientHeight <= threshold;
  }

  function scrollToBottom(element, behavior = 'auto') {
    if (!element || !element.isConnected) return;
    try {
      element.scrollTo({ top: element.scrollHeight, behavior });
    } catch {
      element.scrollTop = element.scrollHeight;
    }
  }

  function settleAtBottom(element) {
    const delays = [0, 50, 140, 320, 700];
    delays.forEach((delay) => {
      window.setTimeout(() => {
        window.requestAnimationFrame(() => scrollToBottom(element, 'auto'));
      }, delay);
    });
  }

  function bindMedia(element) {
    element.querySelectorAll('img, video, audio').forEach((media) => {
      if (media.dataset.mzjChatScrollBound === '1') return;
      media.dataset.mzjChatScrollBound = '1';
      const eventName = media.tagName === 'IMG' ? 'load' : 'loadedmetadata';
      media.addEventListener(eventName, () => {
        const current = state.get(element);
        if (!current || current.keepAtBottom || isNearBottom(element)) {
          scrollToBottom(element, 'auto');
        }
      }, { once: true });
    });
  }

  function initializeMessagesList(element) {
    if (initialized.has(element)) return;
    initialized.add(element);

    const current = { keepAtBottom: true, initialDone: false };
    state.set(element, current);

    const performInitialScroll = () => {
      const hasMessages = Boolean(element.querySelector('.message-bubble'));
      if (!hasMessages) return false;
      settleAtBottom(element);
      bindMedia(element);
      current.initialDone = true;
      window.setTimeout(() => {
        current.keepAtBottom = isNearBottom(element, 160);
      }, 850);
      return true;
    };

    element.addEventListener('scroll', () => {
      if (!current.initialDone) return;
      current.keepAtBottom = isNearBottom(element, 120);
    }, { passive: true });

    const messagesObserver = new MutationObserver((mutations) => {
      bindMedia(element);

      if (!current.initialDone) {
        performInitialScroll();
        return;
      }

      const addedMessage = mutations.some((mutation) =>
        Array.from(mutation.addedNodes).some((node) =>
          node.nodeType === Node.ELEMENT_NODE &&
          (node.matches?.('.message-bubble') || node.querySelector?.('.message-bubble'))
        )
      );

      if (addedMessage && current.keepAtBottom) {
        window.requestAnimationFrame(() => scrollToBottom(element, 'smooth'));
      }
    });

    messagesObserver.observe(element, { childList: true, subtree: true });

    if (!performInitialScroll()) {
      window.setTimeout(performInitialScroll, 80);
      window.setTimeout(performInitialScroll, 250);
    }
  }

  function scan(root = document) {
    if (root instanceof Element && root.matches(SELECTOR)) {
      initializeMessagesList(root);
    }
    root.querySelectorAll?.(SELECTOR).forEach(initializeMessagesList);
  }

  function start() {
    scan();
    const pageObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) scan(node);
        }
      }
    });
    pageObserver.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
