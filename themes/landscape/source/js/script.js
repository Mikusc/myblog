(function($){
  // Search
  var $searchWrap = $('#search-form-wrap'),
    $container = $('#container'),
    isSearchAnim = false,
    searchAnimDuration = 200;

  var startSearchAnim = function(){
    isSearchAnim = true;
  };

  var stopSearchAnim = function(callback){
    setTimeout(function(){
      isSearchAnim = false;
      callback && callback();
    }, searchAnimDuration);
  };

  var mobileNavScrollTop = 0;

  var getPageScrollTop = function(){
    return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  };

  var setPageScrollTop = function(scrollTop){
    document.documentElement.scrollTop = scrollTop;
    document.body.scrollTop = scrollTop;
    if (window.scrollTo) window.scrollTo(0, scrollTop);
  };

  var restoreMobileNavScroll = function(scrollTop){
    setPageScrollTop(scrollTop);
    setTimeout(function(){
      setPageScrollTop(scrollTop);
    }, 0);
  };

  var raf = window.requestAnimationFrame || function(callback){
    return setTimeout(callback, 16);
  };

  var themeStorageKey = 'mikusc.site.theme';
  var systemThemeQuery = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
  var getStoredTheme = function(){
    try {
      var stored = window.localStorage && window.localStorage.getItem(themeStorageKey);
      return stored === 'dark' || stored === 'light' ? stored : null;
    } catch (e) {
      return null;
    }
  };
  var getSystemTheme = function(){
    return systemThemeQuery && systemThemeQuery.matches ? 'dark' : 'light';
  };
  var getCurrentTheme = function(){
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  };
  var updateThemeControls = function(theme){
    var isDark = theme === 'dark';
    var isEnglish = document.documentElement.getAttribute('lang') === 'en';
    var label = isDark
      ? (isEnglish ? 'Switch to light mode' : '切换到浅色模式')
      : (isEnglish ? 'Switch to dark mode' : '切换到深色模式');
    $('.js-theme-toggle').each(function(){
      this.setAttribute('aria-label', label);
      this.setAttribute('title', label);
      this.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    });
  };
  var applySiteTheme = function(theme, shouldStore){
    var safeTheme = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', safeTheme);
    document.documentElement.style.colorScheme = safeTheme;
    var themeColor = document.querySelector('meta[data-site-theme-color]');
    if (themeColor) themeColor.setAttribute('content', safeTheme === 'dark' ? '#07111c' : '#ffffff');
    if (shouldStore) {
      try {
        if (window.localStorage) window.localStorage.setItem(themeStorageKey, safeTheme);
      } catch (e) {}
    }
    updateThemeControls(safeTheme);
  };

  applySiteTheme(document.documentElement.getAttribute('data-theme') || getStoredTheme() || getSystemTheme(), false);

  $('.js-theme-toggle').on('click', function(){
    applySiteTheme(getCurrentTheme() === 'dark' ? 'light' : 'dark', true);
  });
  document.addEventListener('mikusc:language-applied', function(){
    updateThemeControls(getCurrentTheme());
  });
  if (systemThemeQuery) {
    var syncSystemTheme = function(){
      if (!getStoredTheme()) applySiteTheme(getSystemTheme(), false);
    };
    if (systemThemeQuery.addEventListener) {
      systemThemeQuery.addEventListener('change', syncSystemTheme);
    } else if (systemThemeQuery.addListener) {
      systemThemeQuery.addListener(syncSystemTheme);
    }
  }

  var headerScrollQueued = false;
  var updateHeaderScrollState = function(){
    $('#header-inner').toggleClass('is-scrolled', getPageScrollTop() > 8);
  };
  var queueHeaderScrollState = function(){
    if (headerScrollQueued) return;
    headerScrollQueued = true;
    raf(function(){
      headerScrollQueued = false;
      updateHeaderScrollState();
    });
  };

  updateHeaderScrollState();
  window.addEventListener('scroll', queueHeaderScrollState, { passive: true });
  window.addEventListener('resize', queueHeaderScrollState);

  var openMobileNav = function(){
    mobileNavScrollTop = getPageScrollTop();
    $container.addClass('mobile-nav-on');
    restoreMobileNavScroll(mobileNavScrollTop);
  };

  var closeMobileNav = function(){
    $container.removeClass('mobile-nav-on');
    restoreMobileNavScroll(mobileNavScrollTop);
  };

  $('.nav-search-btn').on('click', function(){
    if (isSearchAnim) return;

    if ($container.hasClass('mobile-nav-on')) closeMobileNav();
    startSearchAnim();
    $searchWrap.addClass('on');
    stopSearchAnim(function(){
      $('.search-form-input').focus();
    });
  });

  $('.search-form-input').on('blur', function(){
    setTimeout(function(){
      // Check if we just clicked on a search result
      if ($('#local-search-result:hover').length > 0) {
          return;
      }
      startSearchAnim();
      $searchWrap.removeClass('on');
      stopSearchAnim();
    }, 100);
  });

  // Share
  $('body').on('click', function(){
    $('.article-share-box.on').removeClass('on');
  }).on('click', '.article-share-link', function(e){
    e.stopPropagation();

    var $this = $(this),
      url = $this.attr('data-url'),
      encodedUrl = encodeURIComponent(url),
      id = 'article-share-box-' + $this.attr('data-id'),
      title = $this.attr('data-title'),
      offset = $this.offset();

    if ($('#' + id).length){
      var box = $('#' + id);

      if (box.hasClass('on')){
        box.removeClass('on');
        return;
      }
    } else {
      var html = [
        '<div id="' + id + '" class="article-share-box">',
          '<input class="article-share-input" value="' + url + '">',
          '<div class="article-share-links">',
            '<a href="https://twitter.com/intent/tweet?text=' + encodeURIComponent(title) + '&url=' + encodedUrl + '" class="article-share-twitter" target="_blank" title="Twitter"><span class="fa fa-twitter"></span></a>',
            '<a href="https://www.facebook.com/sharer.php?u=' + encodedUrl + '" class="article-share-facebook" target="_blank" title="Facebook"><span class="fa fa-facebook"></span></a>',
            '<a href="http://pinterest.com/pin/create/button/?url=' + encodedUrl + '" class="article-share-pinterest" target="_blank" title="Pinterest"><span class="fa fa-pinterest"></span></a>',
            '<a href="https://www.linkedin.com/shareArticle?mini=true&url=' + encodedUrl + '" class="article-share-linkedin" target="_blank" title="LinkedIn"><span class="fa fa-linkedin"></span></a>',
          '</div>',
        '</div>'
      ].join('');

      var box = $(html);

      $('body').append(box);
    }

    $('.article-share-box.on').hide();

    box.css({
      top: offset.top + 25,
      left: offset.left
    }).addClass('on');
  }).on('click', '.article-share-box', function(e){
    e.stopPropagation();
  }).on('click', '.article-share-box-input', function(){
    $(this).select();
  }).on('click', '.article-share-box-link', function(e){
    e.preventDefault();
    e.stopPropagation();

    window.open(this.href, 'article-share-box-window-' + Date.now(), 'width=500,height=450');
  });

  // Caption
  $('.article-entry').each(function(i){
    $(this).find('table').filter(function(){
      return !$(this).closest('.highlight, .article-table-scroll').length;
    }).wrap('<div class="article-table-scroll"></div>');

    $(this).find('img').each(function(){
      if ($(this).parent().hasClass('fancybox') || $(this).parent().is('a')) return;

      var alt = this.alt;

      if (alt) $(this).after('<span class="caption">' + alt + '</span>');

      $(this).wrap('<a href="' + this.src + '" data-fancybox=\"gallery\" data-caption="' + alt + '"></a>')
    });

    $(this).find('.fancybox').each(function(){
      $(this).attr('rel', 'article' + i);
    });
  });

  if ($.fancybox){
    $('.fancybox').fancybox();
  }

  // Article TOC active section
  $('[data-article-toc]').each(function(){
    var toc = this;
    var links = Array.prototype.slice.call(toc.querySelectorAll('a[href^="#"]'));
    var items = links.map(function(link){
      var id = '';
      try {
        id = decodeURIComponent(link.hash.slice(1));
      } catch (e) {
        id = link.hash.slice(1);
      }
      var heading = id ? document.getElementById(id) : null;
      return heading ? { id: id, link: link, heading: heading } : null;
    }).filter(Boolean);

    if (!items.length) return;

    var activeId = '';
    var setActive = function(id){
      if (!id || id === activeId) return;
      activeId = id;
      items.forEach(function(item){
        if (item.id === id) {
          item.link.classList.add('is-active');
          item.link.setAttribute('aria-current', 'true');
        } else {
          item.link.classList.remove('is-active');
          item.link.removeAttribute('aria-current');
        }
      });
    };

    var updateActiveToc = function(){
      var offset = 150;
      var current = items[0];
      items.forEach(function(item){
        if (item.heading.getBoundingClientRect().top <= offset) current = item;
      });
      setActive(current.id);
    };

    var tocQueued = false;
    var queueActiveToc = function(){
      if (tocQueued) return;
      tocQueued = true;
      raf(function(){
        tocQueued = false;
        updateActiveToc();
      });
    };

    links.forEach(function(link){
      link.addEventListener('click', function(){
        var id = '';
        try {
          id = decodeURIComponent(link.hash.slice(1));
        } catch (e) {
          id = link.hash.slice(1);
        }
        setActive(id);
      });
    });

    updateActiveToc();
    window.addEventListener('scroll', queueActiveToc, { passive: true });
    window.addEventListener('resize', queueActiveToc);
  });

  // Lightweight reveal for entry pages. Keep article body, code and tables stable.
  var motionRevealObserver = null;
  var initMotionReveal = function(){
    var selectors = [
      '.home-section',
      '.home-overview-panel',
      '.home-news-card',
      '.home-event-card',
      '.home-pathway-card',
      '.content-hub .content-stat',
      '.content-hub .content-card',
      '.content-hub .content-feature-card',
      '.content-hub .content-tool-card',
      '.content-hub .content-link-row',
      '.content-hub .course-flow-item',
      '.content-hub .content-note-panel'
    ];
    var nodes = Array.prototype.slice.call(document.querySelectorAll(selectors.join(',')));
    if (motionRevealObserver) {
      motionRevealObserver.disconnect();
      motionRevealObserver = null;
    }
    if (!nodes.length) return;

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    nodes.forEach(function(node, index){
      if (!node.classList.contains('motion-reveal')) {
        node.classList.add('motion-reveal');
      }
      if (!node.classList.contains('is-visible')) {
        node.style.transitionDelay = (Math.min(index % 6, 3) * 40) + 'ms';
      }
    });

    if (reduceMotion || !('IntersectionObserver' in window)) {
      nodes.forEach(function(node){
        node.classList.add('is-visible');
        node.style.transitionDelay = '';
      });
      return;
    }

    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (!entry.isIntersecting && entry.intersectionRatio <= 0) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
        setTimeout(function(){
          entry.target.style.transitionDelay = '';
        }, 520);
      });
    }, {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.12
    });
    motionRevealObserver = observer;

    nodes.forEach(function(node){
      if (node.classList.contains('is-visible')) return;
      observer.observe(node);
    });
  };

  initMotionReveal();
  window.addEventListener('load', initMotionReveal);
  document.addEventListener('mikusc:language-applied', initMotionReveal);

  // Mobile nav
  var isMobileNavAnim = false,
    mobileNavAnimDuration = 200;

  var startMobileNavAnim = function(){
    isMobileNavAnim = true;
  };

  var stopMobileNavAnim = function(){
    setTimeout(function(){
      isMobileNavAnim = false;
    }, mobileNavAnimDuration);
  }

  $('#main-nav-toggle').on('click', function(e){
    e.preventDefault();
    e.stopPropagation();
    if (isMobileNavAnim) return;

    $searchWrap.removeClass('on');
    startMobileNavAnim();
    if ($container.hasClass('mobile-nav-on')) {
      closeMobileNav();
    } else {
      openMobileNav();
    }
    stopMobileNavAnim();
  });

  $('#wrap').on('click', function(){
    if (isMobileNavAnim || !$container.hasClass('mobile-nav-on')) return;

    closeMobileNav();
  });
})(jQuery);
