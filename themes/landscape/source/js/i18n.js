(function(){
  'use strict';

  var storageKey = 'mikusc.site.lang';
  var defaultLang = 'zh';

  var dictionary = {
    zh: {
      'site.name': 'Mikusc的小站',
      'site.tagline': 'Course Notes · Projects · Tech Notes',
      'site.heroSubtitle': '课程复习、项目实践与技术笔记',
      'site.dropdownCurrent': 'Mikusc 的小站',
      'site.arcaeaChannel': '韵律源点 Arcaea 腾讯频道',
      'social.github': 'GitHub',
      'social.bilibili': 'B站',
      'social.xiaohongshu': '小红书',
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
      'site.heroSubtitle': 'Course Review, Projects, and Technical Notes',
      'site.dropdownCurrent': "Mikusc's Site",
      'site.arcaeaChannel': 'Arcaea Tencent Channel',
      'social.github': 'GitHub',
      'social.bilibili': 'Bilibili',
      'social.xiaohongshu': 'RedNote',
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
        '<div class="content-hub content-hub-about">',
        '<section class="content-hub-hero">',
        '<p class="content-hub-kicker">About</p>',
        '<h2 class="content-hub-title">About this personal blog</h2>',
        '<p class="content-hub-lede">This is Mikusc&rsquo;s personal blog. I mainly use this site to organize course review materials, project practice notes, and technical writing. The current content focuses on algorithm course review, Hexo site maintenance, and mixed-reality project records related to SceneShift Discussion Room.</p>',
        '</section>',
        '<section class="content-section">',
        '<div class="content-section-head"><div><p class="content-section-kicker">Focus</p><h3 class="content-section-title">Current focus areas</h3></div></div>',
        '<div class="content-card-grid">',
        '<article class="content-card"><span class="content-card-label">XR / MR</span><strong class="content-card-title">Spatial interaction prototypes</strong><span class="content-card-desc">Project practice and interaction experiments around Unity, Meta Quest, and mixed reality.</span></article>',
        '<article class="content-card"><span class="content-card-label">AI Systems</span><strong class="content-card-title">AI-assisted spatial computing</strong><span class="content-card-desc">Exploring how AI, spatial computing, room understanding, and generative workflows can fit together.</span></article>',
        '<article class="content-card"><span class="content-card-label">Course Notes</span><strong class="content-card-title">Course review and algorithm exercises</strong><span class="content-card-desc">Review materials organized by course, lecture, and week for quick revisiting.</span></article>',
        '<article class="content-card"><span class="content-card-label">Engineering</span><strong class="content-card-title">Tools, deployment, and engineering notes</strong><span class="content-card-desc">Notes on blog maintenance, backend deployment, useful tools, and project debugging.</span></article>',
        '</div>',
        '</section>',
        '<section class="content-section content-section-compact">',
        '<div class="content-section-head"><div><p class="content-section-kicker">This Site</p><h3 class="content-section-title">Site entry points</h3></div></div>',
        '<div class="content-link-list">',
        '<a class="content-link-row" href="/course-notes/"><span>Notes</span><strong>Course Notes</strong></a>',
        '<a class="content-link-row" href="/projects/"><span>Work</span><strong>Projects</strong></a>',
        '<a class="content-link-row" href="/tools/"><span>Tools</span><strong>Tools</strong></a>',
        '<a class="content-link-row" href="/archives/"><span>Archive</span><strong>Archives</strong></a>',
        '</div>',
        '</section>',
        '</div>'
      ].join('')
    },
    '/contact/': {
      title: 'Contact',
      html: [
        '<div class="content-hub content-hub-contact">',
        '<section class="content-hub-hero">',
        '<p class="content-hub-kicker">Contact</p>',
        '<h2 class="content-hub-title">Contact and public links</h2>',
        '<p class="content-hub-lede">These are the public contact and follow-up channels for this site. For course notes, project practice, or blog issues, GitHub is preferred. For general updates, you can also find me on Bilibili or RedNote.</p>',
        '</section>',
        '<section class="content-section">',
        '<div class="content-section-head"><div><p class="content-section-kicker">Main Links</p><h3 class="content-section-title">Main entry points</h3></div></div>',
        '<div class="content-card-grid content-card-grid-two">',
        '<a class="content-card content-card-social content-card-social-github" href="https://github.com/Mikusc" target="_blank" rel="noopener"><span class="content-card-label content-card-label-platform content-card-label-default">GitHub</span><strong class="content-card-title">Mikusc</strong><span class="content-card-desc">Preferred contact route for course notes, project issues, and blog feedback.</span></a>',
        '<a class="content-card content-card-social content-card-social-repository" href="https://github.com/Mikusc/myblog" target="_blank" rel="noopener"><span class="content-card-label content-card-label-platform content-card-label-default">Repository</span><strong class="content-card-title">Mikusc/myblog</strong><span class="content-card-desc">GitHub repository for this blog project, suitable for issues or source inspection.</span></a>',
        '<a class="content-card content-card-social content-card-social-bilibili" href="https://space.bilibili.com/13401732" target="_blank" rel="noopener"><span class="content-card-label content-card-label-platform content-card-label-bilibili">Bilibili</span><strong class="content-card-title">作业姬QwQ</strong><span class="content-card-desc">For public updates and video content.</span></a>',
        '<a class="content-card content-card-social content-card-social-rednote" href="https://xhslink.com/m/oAu1JuHb85" target="_blank" rel="noopener"><span class="content-card-label content-card-label-platform content-card-label-rednote">RedNote</span><strong class="content-card-title">mikusc</strong><span class="content-card-desc">For daily content and public updates.</span></a>',
        '</div>',
        '</section>',
        '<section class="content-section">',
        '<div class="content-feature-card">',
        '<div><p class="content-card-label">Arcaea Tencent Channel</p><h3 class="content-feature-title">Arcaea Tencent Channel</h3><p class="content-card-desc">Arcaea-related content is kept in a separate channel for update news, pack information, and channel-organized posts.</p></div>',
        '<div class="content-action-group"><a class="content-action content-action-primary" href="https://pd.qq.com/s/frdj4o2cl?b=9" target="_blank" rel="noopener"><span>Open channel</span><span class="content-action-icon site-drawn-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M7 17L17 7M9 7h8v8"></path></svg></span></a></div>',
        '</div>',
        '</section>',
        '<section class="content-section content-section-compact">',
        '<div class="content-section-head"><div><p class="content-section-kicker">Feedback</p><h3 class="content-section-title">Suitable topics</h3></div></div>',
        '<div class="content-note-panel"><p>You can send corrections or additions for course notes, questions about SceneShift Discussion Room, XR / MR / Unity / AI-assisted spatial computing project discussion, or bugs and improvement suggestions for this blog.</p><p>For feedback on a specific post, open an issue in the GitHub repository and include the post link, the relevant section, and the suggested change.</p></div>',
        '</section>',
        '</div>'
      ].join('')
    },
    '/projects/': {
      title: 'Projects',
      html: [
        '<div class="content-hub content-hub-projects">',
        '<section class="content-hub-hero">',
        '<p class="content-hub-kicker">Projects</p>',
        '<h2 class="content-hub-title">Project Practice and Prototype Entries</h2>',
        '<p class="content-hub-lede">This page collects the public project, prototype, and tool entry points currently available on the site. It is designed as a set of routes you can continue into, not just a text index.</p>',
        '</section>',
        '<div class="content-stat-grid" aria-label="Project overview">',
        '<div class="content-stat"><span class="content-stat-number">1</span><span class="content-stat-label">MR prototype</span></div>',
        '<div class="content-stat"><span class="content-stat-number">1</span><span class="content-stat-label">course directory</span></div>',
        '<div class="content-stat"><span class="content-stat-number">1</span><span class="content-stat-label">utility tool</span></div>',
        '</div>',
        '<section class="content-section">',
        '<div class="content-section-head"><div><p class="content-section-kicker">Featured Prototype</p><h3 class="content-section-title">SceneShift Discussion Room</h3></div></div>',
        '<div class="content-feature-card">',
        '<div><p class="content-card-label">Mixed Reality · Unity · Meta Quest</p><h3 class="content-feature-title">Spatial style preview driven by real room structure</h3><p class="content-card-desc">SceneShift Discussion Room is a mixed-reality coursework prototype. It reads real room structure on Meta Quest and previews themed room decoration and spatial style changes.</p><div class="content-card-meta"><span>Room understanding</span><span>Runtime generation</span><span>XR interaction</span></div></div>',
        '<div class="content-action-group">',
        '<a class="content-action content-action-primary" href="/scene-shift/"><span>Project introduction</span><span class="content-action-icon site-drawn-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M7 17L17 7M9 7h8v8"></path></svg></span></a>',
        '<a class="content-action" href="/scene-shift/privacy/"><span>Privacy policy</span><span class="content-action-icon site-drawn-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M7 17L17 7M9 7h8v8"></path></svg></span></a>',
        '</div>',
        '</div>',
        '</section>',
        '<section class="content-section">',
        '<div class="content-section-head"><div><p class="content-section-kicker">Site Entries</p><h3 class="content-section-title">Public content routes</h3></div></div>',
        '<div class="content-card-grid content-card-grid-two">',
        '<a class="content-card" href="/course-notes/"><span class="content-card-label">Course Notes</span><strong class="content-card-title">Course Notes</strong><span class="content-card-desc">Course review posts already organized on the blog, mainly around COMP4133AADS algorithms and data structures.</span><span class="content-card-meta"><span>Algorithms</span><span>Exam review</span></span></a>',
        '<a class="content-card" href="/tools/"><span class="content-card-label">Tools</span><strong class="content-card-title">Toolbox</strong><span class="content-card-desc">Small tools and standalone pages. The current entry is the UNNC-style Bus tool.</span><span class="content-card-meta"><span>Bus</span><span>Standalone pages</span></span></a>',
        '</div>',
        '</section>',
        '</div>'
      ].join('')
    },
    '/tools/': {
      title: 'Tools',
      html: [
        '<div class="content-hub content-hub-tools">',
        '<section class="content-hub-hero">',
        '<p class="content-hub-kicker">Tools</p>',
        '<h2 class="content-hub-title">Study, Development, and Daily Utilities</h2>',
        '<p class="content-hub-lede">This page keeps standalone tools in one place. The goal is to make common utilities easy to enter directly instead of mixing them into the normal post list.</p>',
        '</section>',
        '<section class="content-section">',
        '<div class="content-section-head"><div><p class="content-section-kicker">Available</p><h3 class="content-section-title">Current tools</h3></div></div>',
        '<div class="content-tool-grid">',
        '<article class="content-tool-card">',
        '<div><span class="content-tool-status">Available</span><h3 class="content-feature-title">Bus</h3><p class="content-card-desc">UNNC-related bus lookup entry with next departure information and full timetable views, optimized for quick mobile checks.</p><div class="content-card-meta"><span>UNNC shuttle</span><span>Timetable</span><span>Mobile friendly</span></div></div>',
        '<a class="content-action content-action-primary" href="/bus/"><span>Open tool</span><span class="content-action-icon site-drawn-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M7 17L17 7M9 7h8v8"></path></svg></span></a>',
        '</article>',
        '</div>',
        '</section>',
        '<section class="content-section content-section-compact">',
        '<div class="content-section-head"><div><p class="content-section-kicker">Next</p><h3 class="content-section-title">Good candidates for later</h3></div></div>',
        '<div class="content-note-panel"><p>Future entries could include a course review index tool, project resource navigation, common link collections, or small query pages related to blog maintenance.</p></div>',
        '</section>',
        '</div>'
      ].join('')
    },
    '/course-notes/': {
      title: 'Course Notes',
      html: [
        '<div class="content-hub content-hub-course">',
        '<section class="content-hub-hero">',
        '<p class="content-hub-kicker">Course Notes</p>',
        '<h2 class="content-hub-title">COMP4133AADS Review Directory</h2>',
        '<p class="content-hub-lede">This page organizes the course review posts currently available on the blog. At this stage, it focuses on algorithms and data structures, with overview guides, lecture exercises, and weekly topics in one place.</p>',
        '</section>',
        '<div class="content-stat-grid" aria-label="Course notes overview">',
        '<div class="content-stat"><span class="content-stat-number">2</span><span class="content-stat-label">overview guides</span></div>',
        '<div class="content-stat"><span class="content-stat-number">4</span><span class="content-stat-label">lecture exercises</span></div>',
        '<div class="content-stat"><span class="content-stat-number">6</span><span class="content-stat-label">weekly topics</span></div>',
        '</div>',
        '<section class="content-section">',
        '<div class="content-section-head"><div><p class="content-section-kicker">Overview</p><h3 class="content-section-title">Build the exam map first</h3></div></div>',
        '<div class="content-card-grid content-card-grid-two">',
        '<a class="content-card" href="/2026/01/08/comp4133aads-final-exam-master-review/"><span class="content-card-label">Final Review</span><strong class="content-card-title">Final review master guide</strong><span class="content-card-desc">All module checkpoints, a practice-oriented study route, and suggested review order.</span></a>',
        '<a class="content-card" href="/2026/01/08/comp4133aads-final-mock-exam-4q/"><span class="content-card-label">Mock Exam</span><strong class="content-card-title">Final mock paper</strong><span class="content-card-desc">The four most likely major questions, with templates, simulated questions, and reference answers.</span></a>',
        '</div>',
        '</section>',
        '<section class="content-section">',
        '<div class="content-section-head"><div><p class="content-section-kicker">Lecture Exercises</p><h3 class="content-section-title">Complexity and core data structures</h3></div></div>',
        '<div class="content-card-grid">',
        '<a class="content-card" href="/2026/01/08/comp4133aads-lecture1-exercises/"><span class="content-card-label">Lecture 1</span><strong class="content-card-title">Algorithm Complexity</strong><span class="content-card-desc">Big-O, growth rates, and complexity analysis exercises.</span></a>',
        '<a class="content-card" href="/2026/01/08/comp4133aads-lecture2-exercises/"><span class="content-card-label">Lecture 2</span><strong class="content-card-title">Maps &amp; Hash Tables</strong><span class="content-card-desc">Hash tables, map structures, and collision handling.</span></a>',
        '<a class="content-card" href="/2026/01/08/comp4133aads-lecture3-exercises/"><span class="content-card-label">Lecture 3</span><strong class="content-card-title">Binary Search Trees</strong><span class="content-card-desc">BST operations, traversals, and property checks.</span></a>',
        '<a class="content-card" href="/2026/01/08/comp4133aads-lecture4-exercises/"><span class="content-card-label">Lecture 4</span><strong class="content-card-title">AVL Trees</strong><span class="content-card-desc">Balance factors, rotations, insertion, and deletion traces.</span></a>',
        '</div>',
        '</section>',
        '<section class="content-section">',
        '<div class="content-section-head"><div><p class="content-section-kicker">Weekly Topics</p><h3 class="content-section-title">Graphs, dynamic programming, and strings</h3></div></div>',
        '<div class="content-link-list">',
        '<a class="content-link-row" href="/2026/01/08/comp4133aads-week6-graph-algorithms-1-exercises/"><span>Week 6</span><strong>Graph Algorithms 1</strong></a>',
        '<a class="content-link-row" href="/2026/01/08/comp4133aads-week7-graph-algorithms-2-exercises/"><span>Week 7</span><strong>Graph Algorithms 2</strong></a>',
        '<a class="content-link-row" href="/2026/01/08/comp4133aads-week8-dp1-exercises/"><span>Week 8</span><strong>Dynamic Programming 1</strong></a>',
        '<a class="content-link-row" href="/2026/01/08/comp4133aads-week9-dp2-exercises/"><span>Week 9</span><strong>Dynamic Programming 2</strong></a>',
        '<a class="content-link-row" href="/2026/01/08/comp4133aads-week10-pattern-matching-exercises/"><span>Week 10</span><strong>Pattern-Matching Algorithms</strong></a>',
        '<a class="content-link-row" href="/2026/01/08/comp4133aads-week11-trie-exercises/"><span>Week 11</span><strong>Trie</strong></a>',
        '</div>',
        '</section>',
        '<section class="content-section content-section-compact">',
        '<div class="content-section-head"><div><p class="content-section-kicker">Categories</p><h3 class="content-section-title">Browse by category</h3></div></div>',
        '<div class="content-chip-row"><a href="/categories/COMP4133AADS/">COMP4133AADS</a><a href="/categories/COMP4133AADS/%E6%9C%9F%E6%9C%AB%E5%A4%8D%E4%B9%A0/">Final Review</a><a href="/categories/COMP4133AADS/%E7%BB%83%E4%B9%A0%E5%A4%8D%E4%B9%A0/">Exercise Review</a></div>',
        '</section>',
        '</div>'
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
    document.querySelectorAll('[data-i18n-title]').forEach(function(element){
      var key = element.getAttribute('data-i18n-title');
      var value = translate(lang, key);
      if (value) element.setAttribute('title', value);
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(function(element){
      var key = element.getAttribute('data-i18n-aria-label');
      var value = translate(lang, key);
      if (value) element.setAttribute('aria-label', value);
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
