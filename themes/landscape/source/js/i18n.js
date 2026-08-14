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
      'theme.toggle': '主题',
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
      'article.toc': '文章目录',
      'article.share': '分享',
      'article.newer': '前一篇',
      'article.older': '后一篇',
      'course.series': 'COMP4133AADS 系列',
      'course.directory': '返回课程目录',
      'course.previous': '上一篇',
      'course.next': '下一篇',
      'course.first': '已经是第一篇',
      'course.last': '已经是最后一篇',
      'widget.categories': '分类',
      'widget.tags': '标签',
      'widget.tagCloud': '标签云',
      'widget.recentPosts': '最新文章',
      'search.results': '{count} 条结果',
      'search.noResults': '没有找到匹配的文章。',
      'search.error': '搜索索引加载失败。',
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
      'theme.toggle': 'Theme',
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
      'article.toc': 'Table of contents',
      'article.share': 'Share',
      'article.newer': 'Newer',
      'article.older': 'Older',
      'course.series': 'COMP4133AADS Series',
      'course.directory': 'Back to course directory',
      'course.previous': 'Previous',
      'course.next': 'Next',
      'course.first': 'This is the first post',
      'course.last': 'This is the last post',
      'widget.categories': 'Categories',
      'widget.tags': 'Tags',
      'widget.tagCloud': 'Tag Cloud',
      'widget.recentPosts': 'Recent Posts',
      'search.results': '{count} results',
      'search.noResults': 'No matching posts found.',
      'search.error': 'Failed to load search index.',
      'footer.contactAndSites': 'Contact and Sites',
      'footer.contactMe': 'Contact me',
      'footer.aboutSite': 'About this site',
      'footer.quickLinks': 'Quick links',
      'footer.socialMedia': 'Social media'
    }
  };

  // Page translations are text-only maps keyed by CSS selectors. The Chinese
  // markup in source/*/index.md remains the single source of truth, so changing
  // page structure/content no longer requires maintaining duplicate HTML here.
  var pageTranslations = {
    '/about/': {
      title: "About",
      texts: {
        ".article-entry .content-hub.content-hub-about > :nth-child(1) > :nth-child(2)": "About this personal blog",
        ".article-entry .content-hub.content-hub-about > :nth-child(1) > :nth-child(3)": "This is Mikusc’s personal blog. I mainly use this site to organize course review materials, project practice notes, and technical writing. The current content focuses on algorithm course review, Hexo site maintenance, and mixed-reality project records related to SceneShift Discussion Room.",
        ".article-entry .content-hub.content-hub-about > :nth-child(2) > :nth-child(1) > :nth-child(2)": "Current focus areas",
        ".article-entry .content-hub.content-hub-about > :nth-child(2) > :nth-child(2) > :nth-child(1) > :nth-child(2)": "Spatial interaction prototypes",
        ".article-entry .content-hub.content-hub-about > :nth-child(2) > :nth-child(2) > :nth-child(1) > :nth-child(3)": "Project practice and interaction experiments around Unity, Meta Quest, and mixed reality.",
        ".article-entry .content-hub.content-hub-about > :nth-child(2) > :nth-child(2) > :nth-child(2) > :nth-child(3)": "Exploring how AI, spatial computing, room understanding, and generative workflows can fit together.",
        ".article-entry .content-hub.content-hub-about > :nth-child(2) > :nth-child(2) > :nth-child(3) > :nth-child(2)": "Course review and algorithm exercises",
        ".article-entry .content-hub.content-hub-about > :nth-child(2) > :nth-child(2) > :nth-child(3) > :nth-child(3)": "Review materials organized by course, lecture, and week for quick revisiting.",
        ".article-entry .content-hub.content-hub-about > :nth-child(2) > :nth-child(2) > :nth-child(4) > :nth-child(2)": "Tools, deployment, and engineering notes",
        ".article-entry .content-hub.content-hub-about > :nth-child(2) > :nth-child(2) > :nth-child(4) > :nth-child(3)": "Notes on blog maintenance, backend deployment, useful tools, and project debugging.",
        ".article-entry .content-hub.content-hub-about > :nth-child(3) > :nth-child(1) > :nth-child(2)": "Site entry points"
      }
    },
    '/contact/': {
      title: "Contact",
      texts: {
        ".article-entry .content-hub.content-hub-contact > :nth-child(1) > :nth-child(2)": "Contact and public links",
        ".article-entry .content-hub.content-hub-contact > :nth-child(1) > :nth-child(3)": "These are the public contact and follow-up channels for this site. For course notes, project practice, or blog issues, GitHub is preferred. For general updates, you can also find me on Bilibili or RedNote.",
        ".article-entry .content-hub.content-hub-contact > :nth-child(2) > :nth-child(1) > :nth-child(2)": "Main entry points",
        ".article-entry .content-hub.content-hub-contact > :nth-child(2) > :nth-child(2) > :nth-child(1) > :nth-child(3)": "Preferred contact route for course notes, project issues, and blog feedback.",
        ".article-entry .content-hub.content-hub-contact > :nth-child(2) > :nth-child(2) > :nth-child(2) > :nth-child(3)": "GitHub repository for this blog project, suitable for issues or source inspection.",
        ".article-entry .content-hub.content-hub-contact > :nth-child(2) > :nth-child(2) > :nth-child(3) > :nth-child(3)": "For public updates and video content.",
        ".article-entry .content-hub.content-hub-contact > :nth-child(2) > :nth-child(2) > :nth-child(4) > :nth-child(3)": "For daily content and public updates.",
        ".article-entry .content-hub.content-hub-contact > :nth-child(3) > :nth-child(1) > :nth-child(1) > :nth-child(2)": "Arcaea Tencent Channel",
        ".article-entry .content-hub.content-hub-contact > :nth-child(3) > :nth-child(1) > :nth-child(1) > :nth-child(3)": "Arcaea-related content is kept in a separate channel for update news, pack information, and channel-organized posts.",
        ".article-entry .content-hub.content-hub-contact > :nth-child(3) > :nth-child(1) > :nth-child(2) > :nth-child(1) > :nth-child(1)": "Open channel",
        ".article-entry .content-hub.content-hub-contact > :nth-child(4) > :nth-child(1) > :nth-child(2)": "Suitable topics",
        ".article-entry .content-hub.content-hub-contact > :nth-child(4) > :nth-child(2) > :nth-child(1)": "You can send corrections or additions for course notes, questions about SceneShift Discussion Room, XR / MR / Unity / AI-assisted spatial computing project discussion, or bugs and improvement suggestions for this blog.",
        ".article-entry .content-hub.content-hub-contact > :nth-child(4) > :nth-child(2) > :nth-child(2)": "For feedback on a specific post, open an issue in the GitHub repository and include the post link, the relevant section, and the suggested change."
      }
    },
    '/projects/': {
      title: "Projects",
      texts: {
        ".article-entry .content-hub.content-hub-projects > :nth-child(1) > :nth-child(2)": "Project Practice and Prototype Entries",
        ".article-entry .content-hub.content-hub-projects > :nth-child(1) > :nth-child(3)": "This page collects the main projects, prototypes, and tool entry points currently available through GitHub and this site. It is designed as a set of routes you can continue into, not just a text index.",
        ".article-entry .content-hub.content-hub-projects > :nth-child(2) > :nth-child(1) > :nth-child(2)": "MR / Unity prototypes",
        ".article-entry .content-hub.content-hub-projects > :nth-child(2) > :nth-child(2) > :nth-child(2)": "pinned GitHub repos",
        ".article-entry .content-hub.content-hub-projects > :nth-child(2) > :nth-child(3) > :nth-child(2)": "project entries",
        ".article-entry .content-hub.content-hub-projects > :nth-child(3) > :nth-child(1) > :nth-child(2)": "Featured projects",
        ".article-entry .content-hub.content-hub-projects > :nth-child(3) > :nth-child(2) > :nth-child(1) > :nth-child(2)": "Spatial style preview driven by real room structure",
        ".article-entry .content-hub.content-hub-projects > :nth-child(3) > :nth-child(2) > :nth-child(1) > :nth-child(3)": "SceneShift Discussion Room is a mixed-reality coursework prototype. It reads real room structure on Meta Quest and previews themed room decoration and spatial style changes.",
        ".article-entry .content-hub.content-hub-projects > :nth-child(3) > :nth-child(2) > :nth-child(2) > :nth-child(1) > :nth-child(1)": "Project introduction",
        ".article-entry .content-hub.content-hub-projects > :nth-child(3) > :nth-child(2) > :nth-child(2) > :nth-child(2) > :nth-child(1)": "GitHub repository",
        ".article-entry .content-hub.content-hub-projects > :nth-child(3) > :nth-child(2) > :nth-child(2) > :nth-child(3) > :nth-child(1)": "Privacy policy",
        ".article-entry .content-hub.content-hub-projects > :nth-child(3) > :nth-child(3) > :nth-child(1) > :nth-child(3)": "A Unity MR smart home prototype exploring mixed-reality spatial interfaces for Home Assistant device control. The repository is private, so this card records the project entry without a public link.",
        ".article-entry .content-hub.content-hub-projects > :nth-child(3) > :nth-child(3) > :nth-child(2) > :nth-child(2)": "Tools and standalone pages",
        ".article-entry .content-hub.content-hub-projects > :nth-child(3) > :nth-child(3) > :nth-child(2) > :nth-child(3)": "Site tools are collected under the Tools page. The current entry is the UNNC-style Bus tool, with room for study, development, and campus utilities later.",
        ".article-entry .content-hub.content-hub-projects > :nth-child(4) > :nth-child(1) > :nth-child(2)": "Main GitHub repositories",
        ".article-entry .content-hub.content-hub-projects > :nth-child(4) > :nth-child(2) > :nth-child(1) > :nth-child(3)": "A scene-aware mixed-reality room stylization prototype for Meta Quest, built around MRUK room structure, semantic objects, themed materials, and a runtime control panel.",
        ".article-entry .content-hub.content-hub-projects > :nth-child(4) > :nth-child(2) > :nth-child(2) > :nth-child(3)": "The source repository for this personal website, covering course notes, project pages, tool entries, and the current Nottingham-inspired visual system.",
        ".article-entry .content-hub.content-hub-projects > :nth-child(4) > :nth-child(2) > :nth-child(3) > :nth-child(3)": "A Codex skill for composing Meta XR Interaction SDK UISet panels in Unity, with emphasis on official prefabs, layout rules, and Quest-ready UI validation.",
        ".article-entry .content-hub.content-hub-projects > :nth-child(4) > :nth-child(2) > :nth-child(4) > :nth-child(3)": "An automation skill repository for organizing Arcaea content, update notes, and Tencent Channel publishing workflows.",
        ".article-entry .content-hub.content-hub-projects > :nth-child(5) > :nth-child(1) > :nth-child(2)": "Recent project repositories",
        ".article-entry .content-hub.content-hub-projects > :nth-child(5) > :nth-child(2) > :nth-child(1) > :nth-child(3)": "A public SurVis literature collection for COMP4126 Research Methods Coursework 3, showing the literature structure behind the XR rhythm game direction.",
        ".article-entry .content-hub.content-hub-projects > :nth-child(5) > :nth-child(2) > :nth-child(2) > :nth-child(3)": "A NapCat / OneBot v11 group-message code extraction validation tool, with code extraction, de-duplication, queueing, logging, and a local dashboard.",
        ".article-entry .content-hub.content-hub-projects > :nth-child(6) > :nth-child(1) > :nth-child(2)": "Public content routes",
        ".article-entry .content-hub.content-hub-projects > :nth-child(6) > :nth-child(2) > :nth-child(1) > :nth-child(2)": "Course Notes",
        ".article-entry .content-hub.content-hub-projects > :nth-child(6) > :nth-child(2) > :nth-child(1) > :nth-child(3)": "Course review posts already organized on the blog, mainly around COMP4133AADS algorithms and data structures.",
        ".article-entry .content-hub.content-hub-projects > :nth-child(6) > :nth-child(2) > :nth-child(2) > :nth-child(2)": "Toolbox",
        ".article-entry .content-hub.content-hub-projects > :nth-child(6) > :nth-child(2) > :nth-child(2) > :nth-child(3)": "Small tools and standalone pages. The current entry is the UNNC-style Bus tool."
      }
    },
    '/tools/': {
      title: "Tools",
      texts: {
        ".article-entry .content-hub.content-hub-tools > :nth-child(1) > :nth-child(2)": "Study, Development, and Daily Utilities",
        ".article-entry .content-hub.content-hub-tools > :nth-child(1) > :nth-child(3)": "This page keeps standalone tools in one place. The goal is to make common utilities easy to enter directly instead of mixing them into the normal post list.",
        ".article-entry .content-hub.content-hub-tools > :nth-child(2) > :nth-child(1) > :nth-child(2)": "Current tools",
        ".article-entry .content-hub.content-hub-tools > :nth-child(2) > :nth-child(2) > :nth-child(1) > :nth-child(1) > :nth-child(3)": "UNNC-related bus lookup entry with next departure information and full timetable views, optimized for quick mobile checks.",
        ".article-entry .content-hub.content-hub-tools > :nth-child(2) > :nth-child(2) > :nth-child(1) > :nth-child(2) > :nth-child(1)": "Open tool",
        ".article-entry .content-hub.content-hub-tools > :nth-child(3) > :nth-child(1) > :nth-child(2)": "Good candidates for later",
        ".article-entry .content-hub.content-hub-tools > :nth-child(3) > :nth-child(2) > :nth-child(1)": "Future entries could include a course review index tool, project resource navigation, common link collections, or small query pages related to blog maintenance."
      }
    },
    '/course-notes/': {
      title: "Course Notes",
      texts: {
        ".article-entry .content-hub.content-hub-course > :nth-child(1) > :nth-child(2)": "Course Notes Hub",
        ".article-entry .content-hub.content-hub-course > :nth-child(1) > :nth-child(3)": "This page is organized by course and review path instead of acting as a plain post list. The current completed series is COMP4133AADS algorithms and data structures.",
        ".article-entry .content-hub.content-hub-course > :nth-child(2) > :nth-child(1) > :nth-child(2)": "course series",
        ".article-entry .content-hub.content-hub-course > :nth-child(2) > :nth-child(2) > :nth-child(2)": "review posts",
        ".article-entry .content-hub.content-hub-course > :nth-child(2) > :nth-child(3) > :nth-child(2)": "study stages",
        ".article-entry .content-hub.content-hub-course > :nth-child(3) > :nth-child(1) > :nth-child(2)": "Current course series",
        ".article-entry .content-hub.content-hub-course > :nth-child(3) > :nth-child(2) > :nth-child(1) > :nth-child(2)": "Algorithms and Data Structures Review Directory",
        ".article-entry .content-hub.content-hub-course > :nth-child(3) > :nth-child(2) > :nth-child(1) > :nth-child(3)": "A continuous review path covering the final review map, lecture exercises, weekly topics, and mock paper. Individual posts now include previous/next navigation and a return link to the course directory.",
        ".article-entry .content-hub.content-hub-course > :nth-child(3) > :nth-child(2) > :nth-child(2) > :nth-child(1) > :nth-child(1)": "Open course directory",
        ".article-entry .content-hub.content-hub-course > :nth-child(3) > :nth-child(2) > :nth-child(2) > :nth-child(2) > :nth-child(1)": "Start with master review",
        ".article-entry .content-hub.content-hub-course > :nth-child(4) > :nth-child(1) > :nth-child(2)": "Browse by category",
        ".article-entry .content-hub.content-hub-course > :nth-child(4) > :nth-child(2) > :nth-child(2)": "Final Review",
        ".article-entry .content-hub.content-hub-course > :nth-child(4) > :nth-child(2) > :nth-child(3)": "Exercise Review",
        ".article-entry .content-hub.content-hub-course > :nth-child(4) > :nth-child(2) > :nth-child(4)": "All archives"
      }
    },
    '/course-notes/comp4133aads/': {
      title: "COMP4133AADS Review Directory",
      texts: {
        ".article-entry .content-hub.content-hub-course.content-hub-course-series > :nth-child(1) > :nth-child(2)": "Algorithms and Data Structures Review Route",
        ".article-entry .content-hub.content-hub-course.content-hub-course-series > :nth-child(1) > :nth-child(3)": "A focused exam review path: build the map first, fill in lecture exercises, then work through weekly topics and check output ability with the mock paper.",
        ".article-entry .content-hub.content-hub-course.content-hub-course-series > :nth-child(2) > :nth-child(1) > :nth-child(2)": "overview and mock",
        ".article-entry .content-hub.content-hub-course.content-hub-course-series > :nth-child(2) > :nth-child(2) > :nth-child(2)": "lecture exercises",
        ".article-entry .content-hub.content-hub-course.content-hub-course-series > :nth-child(2) > :nth-child(3) > :nth-child(2)": "weekly topics",
        ".article-entry .content-hub.content-hub-course.content-hub-course-series > :nth-child(3) > :nth-child(1) > :nth-child(2)": "Suggested reading order",
        ".article-entry .content-hub.content-hub-course.content-hub-course-series > :nth-child(3) > :nth-child(2) > :nth-child(1) > :nth-child(2)": "Build the exam map",
        ".article-entry .content-hub.content-hub-course.content-hub-course-series > :nth-child(3) > :nth-child(2) > :nth-child(1) > :nth-child(3)": "Start with the master guide and mock expectations",
        ".article-entry .content-hub.content-hub-course.content-hub-course-series > :nth-child(3) > :nth-child(2) > :nth-child(2) > :nth-child(2)": "Fill core exercises",
        ".article-entry .content-hub.content-hub-course.content-hub-course-series > :nth-child(3) > :nth-child(2) > :nth-child(2) > :nth-child(3)": "Complexity, Map, BST, AVL",
        ".article-entry .content-hub.content-hub-course.content-hub-course-series > :nth-child(3) > :nth-child(2) > :nth-child(3) > :nth-child(2)": "Work through major modules",
        ".article-entry .content-hub.content-hub-course.content-hub-course-series > :nth-child(3) > :nth-child(2) > :nth-child(3) > :nth-child(3)": "Graph, DP, Pattern, Trie",
        ".article-entry .content-hub.content-hub-course.content-hub-course-series > :nth-child(4) > :nth-child(1) > :nth-child(2)": "Build the exam map first",
        ".article-entry .content-hub.content-hub-course.content-hub-course-series > :nth-child(4) > :nth-child(2) > :nth-child(1) > :nth-child(2)": "Final review master guide",
        ".article-entry .content-hub.content-hub-course.content-hub-course-series > :nth-child(4) > :nth-child(2) > :nth-child(1) > :nth-child(3)": "All module checkpoints, a practice-oriented study route, and suggested review order.",
        ".article-entry .content-hub.content-hub-course.content-hub-course-series > :nth-child(4) > :nth-child(2) > :nth-child(2) > :nth-child(2)": "Final mock paper",
        ".article-entry .content-hub.content-hub-course.content-hub-course-series > :nth-child(4) > :nth-child(2) > :nth-child(2) > :nth-child(3)": "The four most likely major questions, with templates, simulated questions, and reference answers.",
        ".article-entry .content-hub.content-hub-course.content-hub-course-series > :nth-child(5) > :nth-child(1) > :nth-child(2)": "Complexity and core data structures",
        ".article-entry .content-hub.content-hub-course.content-hub-course-series > :nth-child(5) > :nth-child(2) > :nth-child(1) > :nth-child(2)": "Algorithm Complexity",
        ".article-entry .content-hub.content-hub-course.content-hub-course-series > :nth-child(5) > :nth-child(2) > :nth-child(1) > :nth-child(3)": "Big-O, growth rates, and complexity analysis exercises.",
        ".article-entry .content-hub.content-hub-course.content-hub-course-series > :nth-child(5) > :nth-child(2) > :nth-child(2) > :nth-child(3)": "Hash tables, map structures, and collision handling.",
        ".article-entry .content-hub.content-hub-course.content-hub-course-series > :nth-child(5) > :nth-child(2) > :nth-child(3) > :nth-child(3)": "BST operations, traversals, and property checks.",
        ".article-entry .content-hub.content-hub-course.content-hub-course-series > :nth-child(5) > :nth-child(2) > :nth-child(4) > :nth-child(3)": "Balance factors, rotations, insertion, and deletion traces.",
        ".article-entry .content-hub.content-hub-course.content-hub-course-series > :nth-child(6) > :nth-child(1) > :nth-child(2)": "Graphs, dynamic programming, and strings",
        ".article-entry .content-hub.content-hub-course.content-hub-course-series > :nth-child(7) > :nth-child(1) > :nth-child(2)": "Browse by category",
        ".article-entry .content-hub.content-hub-course.content-hub-course-series > :nth-child(7) > :nth-child(2) > :nth-child(2)": "Final Review",
        ".article-entry .content-hub.content-hub-course.content-hub-course-series > :nth-child(7) > :nth-child(2) > :nth-child(3)": "Exercise Review",
        ".article-entry .content-hub.content-hub-course.content-hub-course-series > :nth-child(7) > :nth-child(2) > :nth-child(4)": "Back to Course Notes"
      }
    }
  };

  var originalPageTexts = {};

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

  function captureOriginalPageTexts(pageKey) {
    if (!originalPageTexts[pageKey]) {
      originalPageTexts[pageKey] = { texts: {} };
    }

    var stored = originalPageTexts[pageKey];
    var title = document.querySelector('.article-title');

    if (title && stored.title === undefined) {
      stored.title = title.textContent;
    }

    Object.keys(pageTranslations[pageKey].texts).forEach(function(selector){
      var element = document.querySelector(selector);
      if (element && !Object.prototype.hasOwnProperty.call(stored.texts, selector)) {
        stored.texts[selector] = element.textContent;
      }
    });
  }

  function applyPageTranslation(lang) {
    var pageKey = normalizePath(window.location.pathname);
    var page = pageTranslations[pageKey];
    if (!page) return null;

    captureOriginalPageTexts(pageKey);

    var title = document.querySelector('.article-title');

    if (lang === 'en') {
      if (title) title.textContent = page.title;
      Object.keys(page.texts).forEach(function(selector){
        var element = document.querySelector(selector);
        if (element) element.textContent = page.texts[selector];
      });
      return page.title;
    }

    var original = originalPageTexts[pageKey];
    if (original) {
      if (title && original.title) title.textContent = original.title;
      Object.keys(original.texts).forEach(function(selector){
        var element = document.querySelector(selector);
        if (element) element.textContent = original.texts[selector];
      });
    }

    return title ? title.textContent.trim() : '';
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

  function notifyLanguageApplied(lang) {
    var event;
    if (typeof window.CustomEvent === 'function') {
      event = new CustomEvent('mikusc:language-applied', { detail: { lang: lang } });
    } else {
      event = document.createEvent('CustomEvent');
      event.initCustomEvent('mikusc:language-applied', false, false, { lang: lang });
    }
    document.dispatchEvent(event);
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
    notifyLanguageApplied(safeLang);
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

  window.MikuscI18n = {
    translate: translate,
    getLanguage: function(){
      return document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'zh';
    }
  };
})();
