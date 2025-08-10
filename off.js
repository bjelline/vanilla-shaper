(() => {
  // Respect user perference
  const isReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const $nav = document.querySelector('.Nav');
  const $links = [...$nav.querySelectorAll('.Nav__link')];
  const $popovers = [...$nav.querySelectorAll('[popover]')];

  const $toggles = new Set([
    ...document.querySelectorAll('[popovertarget="nav"]'),
    ...document.querySelectorAll('[href="#nav"]')
  ]);

  $nav.addEventListener('click', (ev) => {
    // Close nav when clicking outside
    if (ev.target === $nav) {
      closeNav();
      return;
    }
    // Play closing animation before popover is hidden
    const $button = ev.target.closest('[popovertargetaction="close"]');
    if ($button && !isReducedMotion) {
      ev.preventDefault();
      const $popover = $button.closest('[popover]');
      $popover.classList.add('popover-close');
      $popover.addEventListener('animationend', () => {
          $popover.classList.remove('popover-close');
          $popover.hidePopover();
        },
        {once: true}
      );
    }
  });

  $popovers.forEach(($popover) => {
    $popover.addEventListener('toggle', (ev) => {
      if (ev.target !== $popover) {
        return;
      }
      // Ensure hidden links are not focusable
      $links.forEach(($link) => {
        $link.tabIndex = $link
          .closest('[popover]')
          ?.querySelector(':popover-open')
          ? -1
          : 0;
      });
      if (ev.newState === 'open') {
        // Focus first button or link
        $popover.querySelector('button,[href]')?.focus();
      }
      if (ev.newState === 'closed') {
        // Return focus to parent toggle
        $popover.parentNode
          .querySelector(`[popovertarget="${$popover.id}"]`)
          ?.focus();
      }
    });
  });
  
  const openNav = () => {
    document.body.style.overflow = 'hidden';
    $nav.showModal();
  };

  const closeNav = () => {
    document.body.style.removeProperty('overflow');
    if (isReducedMotion) {
      $nav.close();
      return;
    }
    // Play animation before dialog is closed
    $nav.classList.add('nav-close');
    $nav.addEventListener('animationend', () => {
        $nav.classList.remove('nav-close');
        $nav.close();
      },
      {once: true}
    );
  };
  
  const toggleNav = () => ($nav.open ? closeNav() : openNav());

  $nav.addEventListener('cancel', (ev) => {
    ev.preventDefault();
    closeNav();
  });

  $nav.addEventListener('close', () => {
    // Ensure all nested popovers are reset
    $popovers.forEach(($popover) => $popover.hidePopover());
  });

  $toggles.forEach(($toggle) => {
    $toggle.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      toggleNav();
    });
  });
})();


// Optional sticky header
(() => {
  const $top = document.querySelector('.Top');
  const $header = document.querySelector('.Header--sticky');

  if ($header) {
    let observeFrame;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (observeFrame) {
            window.cancelAnimationFrame(observeFrame);
          }
          observeFrame = window.requestAnimationFrame(() => {
            $header.style.setProperty(
              '--header-opacity',
              1 - entry.intersectionRatio
            );
          });
        });
      },
      {threshold: [...Array(101).keys()].map((x) => x / 100)}
    );
    observer.observe($top);

    let wScrollFrame;
    let wScrollOffset = $top.offsetHeight;
    let wScrollY = window.scrollY;

    const onWindowScrollQueue = [
      () => {
        const scrollY = window.scrollY;
        if (scrollY > wScrollOffset) {
          $header.style.setProperty(
            '--header-visible',
            scrollY > wScrollY ? 0 : 1
          );
        }
        wScrollY = scrollY;
      }
    ];

    window.addEventListener(
      'scroll',
      () => {
        if (wScrollFrame) {
          window.cancelAnimationFrame(wScrollFrame);
        }
        wScrollFrame = window.requestAnimationFrame(() =>
          onWindowScrollQueue.forEach((fn) => fn())
        );
      },
      {passive: true}
    );
  }
})();



(() => {
  // Toggle right-to-left for demo purposes
  document.querySelector('#toggle-rtl')?.addEventListener('change', (ev) => {
    document.dir = ev.target.checked ? 'rtl' : 'ltr';
  });
  // https://github.com/oddbird/popover-polyfill
  if (!('popover' in HTMLElement.prototype)) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@oddbird/popover-polyfill@latest';
    script.crossOrigin = 'anonymous';
    script.defer = true;
    document.head.appendChild(script);
    const style = document.createElement('style');
    style.innerHTML = `
[popover] {
  position: fixed;
  z-index: 2147483647;
}

[popover]:not(.\\:popover-open) {
  display: none;
}

[popover]:is(dialog[open]) {
  display: revert;
}

[anchor].\\:popover-open {
  inset: auto;
}

@supports selector([popover]:popover-open) {
  [popover]:not(.\\:popover-open, dialog[open]) {
    display: revert;
  }

  [anchor]:is(:popover-open) {
    inset: auto;
  }
}
    `;
    document.head.appendChild(style);
  }
})();