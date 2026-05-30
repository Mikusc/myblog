(function(){
  'use strict';

  var storageKey = 'mikusc.site.lang';
  var defaultLang = 'zh';

  var dictionary = {
    zh: {
      'site.name': 'Mikusc的小站',
      'site.tagline': 'Course Notes · Projects · Tech Notes',
      'site.dropdownCurrent': 'Mikusc 的小站',
      'site.arcaeaChannel': '韵律源点 Arcaea 腾讯频道',
      'language.toggle': 'English',
      'language.aria': 'Switch site language to English',
      'nav.home': '首页',
      'nav.courseNotes': '课程笔记',
      'nav.projects': '项目',
      'nav.about': '关于',
      'nav.contact': '联系',
      'nav.archives': '归档',
      'nav.tools': '工具',
      'hero.cta': '了解更多',
      'search.placeholder': '搜索',
      'home.overview.title': '课程复习、项目实践与技术笔记',
      'home.overview.text': '这里记录课程复习、项目实践、开发过程和工具整理，方便之后按主题回看，也方便从一处进入常用内容。',
      'home.stats.posts.label': '篇文章',
      'home.stats.posts.desc': '当前博客已发布的学习记录与技术笔记。',
      'home.stats.course.label': '篇课程笔记',
      'home.stats.course.desc': '围绕 COMP4133AADS 的复习、练习与模拟题。',
      'home.stats.categories.label': '个分类',
      'home.stats.categories.desc': '通过分类和归档快速跳转到相关主题。',
      'home.news.title': '最新文章与课程笔记',
      'home.news.note': '最近更新的学习记录和课程复习材料会集中展示在这里，适合快速浏览和继续阅读。',
      'home.news.allPosts': '全部文章',
      'home.news.latestPosts': '最新文章',
      'home.news.morePosts': '更多文章',
      'home.news.enterDirectory': '进入目录',
      'home.explore.title': '内容入口',
      'home.explore.viewContent': '查看内容',
      'home.pathways.course.title': '课程笔记',
      'home.pathways.course.desc': '按课程、lecture 和 week 整理复习材料，适合考前快速定位知识点。',
      'home.pathways.projects.title': '项目实践',
      'home.pathways.projects.desc': '集中展示博客、Web、XR 和 Unity 相关项目，把实践过程留下可回溯记录。',
      'home.pathways.tools.title': '工具箱',
      'home.pathways.tools.desc': '收集学习、开发与写作中常用的工具入口，减少重复查找成本。',
      'article.readMore': '阅读全文',
      'article.share': '分享',
      'article.newer': '前一篇',
      'article.older': '后一篇',
      'widget.categories': '分类',
      'widget.tags': '标签',
      'widget.tagCloud': '标签云',
      'widget.recentPosts': '最新文章',
      'footer.contactAndSites': '联系与站点',
      'footer.contactMe': '联系我',
      'footer.aboutSite': '关于小站',
      'footer.quickLinks': '快捷链接',
      'footer.socialMedia': '社交媒体'
    },
    en: {
      'site.name': "Mikusc's Site",
      'site.tagline': 'Course Notes · Projects · Tech Notes',
      'site.dropdownCurrent': "Mikusc's Site",
      'site.arcaeaChannel': 'Arcaea Tencent Channel',
      'language.toggle': '中文',
      'language.aria': '切换网站语言为中文',
      'nav.home': 'Home',
      'nav.courseNotes': 'Course Notes',
      'nav.projects': 'Projects',
      'nav.about': 'About',
      'nav.contact': 'Contact',
      'nav.archives': 'Archives',
      'nav.tools': 'Tools',
      'hero.cta': 'Learn more',
      'search.placeholder': 'Search',
      'home.overview.title': 'Course Review, Projects, and Technical Notes',
      'home.overview.text': 'This site collects course review materials, project notes, development logs, and useful tools so they can be revisited by topic from one place.',
      'home.stats.posts.label': 'posts',
      'home.stats.posts.desc': 'Published learning records and technical notes on this blog.',
      'home.stats.course.label': 'course notes',
      'home.stats.course.desc': 'Review guides, exercises, and mock questions around COMP4133AADS.',
      'home.stats.categories.label': 'categories',
      'home.stats.categories.desc': 'Use categories and archives to jump to related topics quickly.',
      'home.news.title': 'Latest Posts and Course Notes',
      'home.news.note': 'Recent learning records and course review materials are collected here for quick reading and continuation.',
      'home.news.allPosts': 'All posts',
      'home.news.latestPosts': 'Latest posts',
      'home.news.morePosts': 'More posts',
      'home.news.enterDirectory': 'Open directory',
      'home.explore.title': 'Explore',
      'home.explore.viewContent': 'View content',
      'home.pathways.course.title': 'Course Notes',
      'home.pathways.course.desc': 'Review materials organized by course, lecture, and week for fast exam preparation.',
      'home.pathways.projects.title': 'Projects',
      'home.pathways.projects.desc': 'Public notes and entry points for blog, web, XR, and Unity projects.',
      'home.pathways.tools.title': 'Toolbox',
      'home.pathways.tools.desc': 'Useful tools and standalone pages for study, development, and writing workflows.',
      'article.readMore': 'Read more',
      'article.share': 'Share',
      'article.newer': 'Newer',
      'article.older': 'Older',
      'widget.categories': 'Categories',
      'widget.tags': 'Tags',
      'widget.tagCloud': 'Tag Cloud',
      'widget.recentPosts': 'Recent Posts',
      'footer.contactAndSites': 'Contact and Sites',
      'footer.contactMe': 'Contact me',
      'footer.aboutSite': 'About this site',
      'footer.quickLinks': 'Quick links',
      'footer.socialMedia': 'Social media'
    }
  };

  var pageTranslations = {
    '/about/': {
      title: 'About',
      html: [
        "<p>This is Mikusc's personal blog.</p>",
        '<p>I mainly use this site to organize course review materials, project practice notes, and technical writing. The current content focuses on algorithm course review, Hexo site maintenance, and mixed-reality project records related to SceneShift Discussion Room.</p>',
        '<h2 id="focus">Focus</h2>',
        '<ul>',
        '<li>XR / MR prototypes and Unity project practice</li>',
        '<li>AI-assisted spatial computing and interaction systems</li>',
        '<li>Course review, algorithm exercises, and study notes</li>',
        '<li>Personal tools, deployment workflows, and engineering records</li>',
        '</ul>',
        '<h2 id="this-site">This Site</h2>',
        '<p>This site currently includes:</p>',
        '<ul>',
        '<li><a href="/course-notes/">Course Notes</a>: course review materials and exercises.</li>',
        '<li><a href="/projects/">Projects</a>: project pages and public prototype entry points.</li>',
        '<li><a href="/tools/">Tools</a>: small tools and standalone pages.</li>',
        '<li><a href="/archives/">Archives</a>: browse all posts by time.</li>',
        '</ul>',
        '<p>More project processes, experiment records, and technical notes will be organized here over time.</p>'
      ].join('')
    },
    '/contact/': {
      title: 'Contact',
      html: [
        '<p>These are the public contact and follow-up channels for this site. For course notes, project practice, or blog issues, GitHub is preferred. For general updates, you can also find me on Bilibili or Xiaohongshu.</p>',
        '<h2 id="main-links">Main Links</h2>',
        '<ul>',
        '<li>GitHub: <a href="https://github.com/Mikusc">Mikusc</a></li>',
        '<li>Blog repository: <a href="https://github.com/Mikusc/myblog">Mikusc/myblog</a></li>',
        '<li>Bilibili: <a href="https://space.bilibili.com/13401732">Mikusc</a></li>',
        '<li>Xiaohongshu: <a href="https://xhslink.com/m/oAu1JuHb85">Mikusc</a></li>',
        '<li>Arcaea Tencent Channel: <a href="https://pd.qq.com/s/frdj4o2cl?b=9">韵律源点 Arcaea 更新情报</a></li>',
        '</ul>',
        '<h2 id="suitable-topics">Suitable Topics</h2>',
        '<ul>',
        '<li>Corrections or additions to course notes</li>',
        '<li>Questions about SceneShift Discussion Room</li>',
        '<li>XR / MR, Unity, or AI-assisted spatial computing project discussion</li>',
        '<li>Bugs or improvement suggestions for this blog</li>',
        '</ul>',
        '<h2 id="feedback">Feedback</h2>',
        '<p>For feedback on a specific post, open an issue in <a href="https://github.com/Mikusc/myblog">Mikusc/myblog</a> and include the post link, the relevant section, and the suggested change.</p>',
        '<p>For general discussion, GitHub, Bilibili, Xiaohongshu, or the Arcaea Tencent Channel are all fine. Please mention that you came from this blog so I can understand the context more quickly.</p>'
      ].join('')
    },
    '/projects/': {
      title: 'Projects',
      html: [
        '<p>This page collects public project and prototype entry points currently available on the site.</p>',
        '<h2 id="sceneshift-discussion-room">SceneShift Discussion Room</h2>',
        '<p><a href="/scene-shift/">SceneShift Discussion Room</a> is a mixed-reality coursework prototype. It reads real room structure on Meta Quest and previews themed room decoration and spatial style changes.</p>',
        '<p>The site currently includes:</p>',
        '<ul>',
        '<li><a href="/scene-shift/">Project introduction</a></li>',
        '<li><a href="/scene-shift/privacy/">Privacy policy</a></li>',
        '<li>Example generated images for SceneShift</li>',
        '<li>Backend APIs related to SceneShift upload and runtime generation</li>',
        '</ul>',
        '<h2 id="course-notes">Course Notes</h2>',
        '<p><a href="/course-notes/">Course Notes</a> contains the course review posts already organized on the blog, mainly around COMP4133AADS algorithms and data structures.</p>',
        '<h2 id="tools">Tools</h2>',
        '<p><a href="/tools/">Tools</a> contains small tools and standalone pages. It currently includes:</p>',
        '<ul><li><a href="/bus/">Bus</a></li></ul>',
        '<p>More projects will be added here after they are ready to be organized publicly.</p>'
      ].join('')
    },
    '/tools/': {
      title: 'Tools',
      html: '<ul><li><a href="/bus/">Bus</a></li></ul>'
    },
    '/course-notes/': {
      title: 'Course Notes',
      html: [
        '<p>This page organizes the course review posts currently available on the blog. At this stage, the main focus is COMP4133AADS algorithms and data structures review.</p>',
        '<h2 id="comp4133aads">COMP4133AADS</h2>',
        '<h3 id="overview">Overview</h3>',
        '<ul>',
        '<li><a href="/2026/01/08/comp4133aads-final-exam-master-review/">Final review master guide: all modules and practice-oriented study route</a></li>',
        '<li><a href="/2026/01/08/comp4133aads-final-mock-exam-4q/">Final mock paper: the four most likely major questions</a></li>',
        '</ul>',
        '<h3 id="lecture-exercises">Lecture Exercises</h3>',
        '<ul>',
        '<li><a href="/2026/01/08/comp4133aads-lecture1-exercises/">Lecture 1 Algorithm Complexity</a></li>',
        '<li><a href="/2026/01/08/comp4133aads-lecture2-exercises/">Lecture 2 Maps &amp; Hash Tables</a></li>',
        '<li><a href="/2026/01/08/comp4133aads-lecture3-exercises/">Lecture 3 Binary Search Trees</a></li>',
        '<li><a href="/2026/01/08/comp4133aads-lecture4-exercises/">Lecture 4 AVL Trees</a></li>',
        '</ul>',
        '<h3 id="weekly-topics">Weekly Topics</h3>',
        '<ul>',
        '<li><a href="/2026/01/08/comp4133aads-week6-graph-algorithms-1-exercises/">Week 6 Graph Algorithms 1</a></li>',
        '<li><a href="/2026/01/08/comp4133aads-week7-graph-algorithms-2-exercises/">Week 7 Graph Algorithms 2</a></li>',
        '<li><a href="/2026/01/08/comp4133aads-week8-dp1-exercises/">Week 8 Dynamic Programming 1</a></li>',
        '<li><a href="/2026/01/08/comp4133aads-week9-dp2-exercises/">Week 9 Dynamic Programming 2</a></li>',
        '<li><a href="/2026/01/08/comp4133aads-week10-pattern-matching-exercises/">Week 10 Pattern-Matching Algorithms</a></li>',
        '<li><a href="/2026/01/08/comp4133aads-week11-trie-exercises/">Week 11 Trie</a></li>',
        '</ul>',
        '<h2 id="categories">Categories</h2>',
        '<ul>',
        '<li><a href="/categories/COMP4133AADS/">COMP4133AADS</a></li>',
        '<li><a href="/categories/COMP4133AADS/%E6%9C%9F%E6%9C%AB%E5%A4%8D%E4%B9%A0/">Final Review</a></li>',
        '<li><a href="/categories/COMP4133AADS/%E7%BB%83%E4%B9%A0%E5%A4%8D%E4%B9%A0/">Exercise Review</a></li>',
        '</ul>'
      ].join('')
    }
  };

  var originalPageContent = null;

  function normalizePath(pathname) {
    var path = pathname || '/';
    path = path.replace(/\/index\.html$/, '/');
    if (path.charAt(path.length - 1) !== '/') path += '/';
    return path;
  }

  function getStoredLanguage() {
    try {
      var stored = window.localStorage && window.localStorage.getItem(storageKey);
      return stored === 'en' || stored === 'zh' ? stored : defaultLang;
    } catch (e) {
      return defaultLang;
    }
  }

  function storeLanguage(lang) {
    try {
      if (window.localStorage) window.localStorage.setItem(storageKey, lang);
    } catch (e) {}
  }

  function translate(lang, key) {
    return (dictionary[lang] && dictionary[lang][key]) || (dictionary.zh && dictionary.zh[key]) || '';
  }

  function applyTextTranslations(lang) {
    document.querySelectorAll('[data-i18n]').forEach(function(element){
      var key = element.getAttribute('data-i18n');
      var value = translate(lang, key);
      if (value) element.textContent = value;
    });
  }

  function applyDateTranslations(lang) {
    document.querySelectorAll('[data-i18n-date]').forEach(function(element){
      var value = element.getAttribute('data-i18n-date');
      var format = element.getAttribute('data-i18n-date-format');
      var date = new Date(value);
      if (Number.isNaN(date.getTime())) return;
      if (format === 'monthDay') {
        element.textContent = lang === 'en'
          ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : (date.getMonth() + 1) + '月' + date.getDate() + '日';
      }
      if (format === 'year') {
        element.textContent = lang === 'en'
          ? String(date.getFullYear())
          : date.getFullYear() + '年';
      }
    });
  }

  function applySearchTranslations(lang) {
    var text = translate(lang, 'search.placeholder');
    document.querySelectorAll('.search-form-input').forEach(function(input){
      input.setAttribute('placeholder', text);
      input.setAttribute('aria-label', text);
    });
  }

  function captureOriginalPageContent() {
    if (originalPageContent) return;
    var title = document.querySelector('.article-title');
    var entry = document.querySelector('.article-entry');
    if (!title || !entry) return;
    originalPageContent = {
      title: title.innerHTML,
      entry: entry.innerHTML
    };
  }

  function applyPageTranslation(lang) {
    var pageKey = normalizePath(window.location.pathname);
    var page = pageTranslations[pageKey];
    if (!page) return null;

    var title = document.querySelector('.article-title');
    var entry = document.querySelector('.article-entry');
    if (!title || !entry) return page.title;

    captureOriginalPageContent();

    if (lang === 'en') {
      title.textContent = page.title;
      entry.innerHTML = page.html;
      return page.title;
    }

    if (originalPageContent) {
      title.innerHTML = originalPageContent.title;
      entry.innerHTML = originalPageContent.entry;
    }
    return title.textContent.trim();
  }

  function getDocumentTitlePrefix(lang, translatedPageTitle) {
    if (translatedPageTitle) return translatedPageTitle;
    if (normalizePath(window.location.pathname) === '/') return '';
    var articleTitle = document.querySelector('.article-title');
    if (articleTitle) return articleTitle.textContent.trim();
    return '';
  }

  function applyDocumentTitle(lang, translatedPageTitle) {
    var siteName = translate(lang, 'site.name');
    var prefix = getDocumentTitlePrefix(lang, translatedPageTitle);
    document.title = prefix ? prefix + ' | ' + siteName : siteName;
  }

  function applyLanguage(lang, shouldStore) {
    var safeLang = lang === 'en' ? 'en' : 'zh';
    document.documentElement.setAttribute('lang', safeLang === 'en' ? 'en' : 'zh-CN');
    document.body.setAttribute('data-site-lang', safeLang);
    if (shouldStore) storeLanguage(safeLang);

    applyTextTranslations(safeLang);
    applyDateTranslations(safeLang);
    applySearchTranslations(safeLang);

    var translatedPageTitle = applyPageTranslation(safeLang);
    applyDocumentTitle(safeLang, translatedPageTitle);

    document.querySelectorAll('.js-language-toggle').forEach(function(button){
      button.setAttribute('aria-label', translate(safeLang, 'language.aria'));
    });
  }

  function bindLanguageToggles() {
    document.querySelectorAll('.js-language-toggle').forEach(function(button){
      button.addEventListener('click', function(event){
        event.preventDefault();
        var current = document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'zh';
        applyLanguage(current === 'en' ? 'zh' : 'en', true);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    bindLanguageToggles();
    applyLanguage(getStoredLanguage(), false);
  });
})();
