# Mikusc · 项目作品集

个人网站：[www.mikusc.top](https://www.mikusc.top/)

以 AI 应用、空间交互、研究评测和内容工作流为主线，展示项目问题、个人推进方式、可查看成果与当前边界。保留原有课程笔记、文章、校园导览及独立工具。

- [项目目录](https://www.mikusc.top/projects/)：12 个双语案例，首页精选 6 项。
- [IHCI 数字会场存档](https://www.mikusc.top/ihci/)：2026-10-20 的独立只读快照，含 IEB 和实验室场馆、模型、地图及示例海报。
- [关于与联系方式](https://www.mikusc.top/about/)：背景、工作方式与公开入口。

## 维护

基于 Hexo 8、EJS 和 Stylus；保留现有 Azure Static Web Apps 部署流程。

```sh
npm ci
npm run clean
npm run build
npm run server
```

- 项目文案：`source/_data/portfolio.json`。每个项目有中英文的问题、方法、成果与边界。
- 项目页面：`source/projects/<id>/index.md`，使用 `layout: project` 与 `project_id`。
- 首页与项目模板：`themes/landscape/layout/`。
- 作品集样式：`themes/landscape/source/css/_partial/portfolio.styl`。
- 会场归档：`source/ihci/`，由 `skip_render` 原样输出；不要连接实时讨论、后台或上传接口。
- 修改已有快照文件后，需同步更新 `archive-manifest.json` 的哈希；新的项目阶段宜另建日期快照。

向 `main` 推送会触发现有 Azure 自动构建和发布。不要将本地配置、凭证、访客数据或内部研究材料放入仓库。

项目叙述借鉴 [ASu-skills](https://github.com/Hisn00w/ASu-skills) 的事实与证据组织方式；项目内容与实现来自本人的实际工作，数据规模和验证边界分别注明。
