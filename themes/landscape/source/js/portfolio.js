(function () {
  'use strict';

  var page = document.querySelector('.portfolio-page');
  if (!page) return;
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var animations = new Set();
  var revealObserver;
  var isEnglish = function () {
    return document.documentElement.lang === 'en';
  };

  // Content is visible by default; an interrupted script never hides the work.
  if (!motion.matches && 'IntersectionObserver' in window && Element.prototype.animate) {
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, index) {
        if (!entry.isIntersecting) return;
        revealObserver.unobserve(entry.target);
        if (motion.matches) return;
        var animation = entry.target.animate([
          { opacity: 0, transform: 'translateY(14px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], {
          duration: 460,
          delay: Math.min(index, 3) * 35,
          easing: 'cubic-bezier(.22,.61,.36,1)',
          fill: 'backwards'
        });
        animations.add(animation);
        animation.onfinish = animation.oncancel = function () {
          animations.delete(animation);
        };
      });
    }, { threshold: 0.06 });
    page.querySelectorAll('.portfolio-intro-copy, .portfolio-feature, .portfolio-section-head, .portfolio-card, .portfolio-method-grid article, .portfolio-detail-heading, .portfolio-next').forEach(function (element) {
      revealObserver.observe(element);
    });
  }

  var stopMotion = function () {
    if (!motion.matches) return;
    if (revealObserver) revealObserver.disconnect();
    animations.forEach(function (animation) { animation.cancel(); });
  };
  if (motion.addEventListener) motion.addEventListener('change', stopMotion);

  var filters = page.querySelector('.portfolio-filter-bar');
  if (filters) {
    var buttons = Array.from(filters.querySelectorAll('[data-project-filter]'));
    var cards = Array.from(page.querySelectorAll('.portfolio-card'));
    var groups = Array.from(page.querySelectorAll('.portfolio-project-group'));
    var status = filters.querySelector('.portfolio-filter-result');
    var activeFilter = 'all';
    var updateFilter = function () {
      page.classList.toggle('is-filtered', activeFilter !== 'all');
      var visible = 0;
      cards.forEach(function (card) {
        var topics = (card.dataset.projectTopics || '').split(' ');
        card.hidden = activeFilter !== 'all' && topics.indexOf(activeFilter) < 0;
        if (!card.hidden) visible += 1;
      });
      buttons.forEach(function (button) {
        button.setAttribute('aria-pressed', String(button.dataset.projectFilter === activeFilter));
      });
      groups.forEach(function (group) {
        var count = group.querySelectorAll('.portfolio-card:not([hidden])').length;
        group.hidden = !count;
        group.querySelector('.portfolio-count').textContent = String(count).padStart(2, '0');
      });
      status.textContent = isEnglish()
        ? visible + ' of ' + cards.length + ' projects'
        : '显示 ' + visible + ' / ' + cards.length + ' 个项目';
    };
    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        activeFilter = button.dataset.projectFilter;
        updateFilter();
      });
    });
    filters.hidden = false;
    updateFilter();
    document.addEventListener('mikusc:language-applied', updateFilter);
  }

  var dialog = page.querySelector('.portfolio-lightbox');
  var imageLink = page.querySelector('.portfolio-image-open');
  if (dialog && imageLink && typeof dialog.showModal === 'function') {
    imageLink.addEventListener('click', function (event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      dialog.showModal();
      document.documentElement.classList.add('has-portfolio-lightbox');
    });
    dialog.querySelector('.portfolio-lightbox-close').addEventListener('click', function () {
      dialog.close();
    });
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) {
        var rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right ||
            event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
      }
    });
    dialog.addEventListener('close', function () {
      document.documentElement.classList.remove('has-portfolio-lightbox');
      imageLink.focus({ preventScroll: true });
    });
  }

  // Native anchors remain available without JavaScript.
  page.querySelectorAll('a[href^="#"]').forEach(function (link) {
    var target = document.getElementById(link.getAttribute('href').slice(1));
    if (!target) return;
    link.addEventListener('click', function (event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: motion.matches ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', link.getAttribute('href'));
      if (target.hasAttribute('tabindex')) target.focus({ preventScroll: true });
    });
  });

  var contents = page.querySelector('.portfolio-case-nav');
  if (contents) {
    var sections = Array.from(page.querySelectorAll('.portfolio-case-section'));
    var links = Array.from(contents.querySelectorAll('a'));
    var frame = 0;
    var updateContents = function () {
      frame = 0;
      var header = document.getElementById('header-inner');
      var offset = (header ? header.getBoundingClientRect().height : 100) + 48;
      var current = sections[0];
      sections.forEach(function (section) {
        if (section.getBoundingClientRect().top <= offset) current = section;
      });
      if (!current) return;
      links.forEach(function (link) {
        if (link.hash === '#' + current.id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    };
    var queueContents = function () {
      if (!frame) frame = requestAnimationFrame(updateContents);
    };
    window.addEventListener('scroll', queueContents, { passive: true });
    window.addEventListener('resize', queueContents);
    document.addEventListener('mikusc:language-applied', queueContents);
    updateContents();
  }
}());
