# 宁诺校园 3D 导览

公开页面：`https://www.mikusc.top/campus/`。项目页和工具页提供入口，导览页可返回博客。

`source/campus/` 是校园项目 `campus-site` 导出的完整静态版本，包含同源的界面、Three.js 和模型文件；不依赖原有 Sites 地址、第三方 iframe 或服务端运行时。Hexo 通过 `_config.yml` 中的 `skip_render: campus/**` 原样复制，沿用当前 GitHub → Azure Static Web Apps 发布流程。

## 更新导览

1. 在校园项目的 `campus-site` 目录运行 `npm run build:blog`。
2. 将 `dist-blog/` 的完整内容同步到本仓库 `source/campus/`，移除被新版替代的旧哈希资源。不要手改编译后的 JavaScript。
3. 运行本仓库 `npm run build`，确认 `public/campus/index.html` 及其引用资源齐全。检查 `/campus/`、视角切换、返回博客、资料说明以及博客中的两个入口。
4. 按博客发布流程提交并推送，等待 Azure 工作流成功，再检查公开地址与模型清单。

导览保留对数深度缓冲以减少屋顶、水面、操场和绿地的闪烁。模型按哈希命名并分块传输；首次下载约 37 MB。2026-09-09 模型 SHA-256：`c2b11e0709b0b405a8197a1adda8033885b90b61e5b9993b5f7208f5cf5bad33`。

`source/campus/sources.html` 保留参考资料、估建限制和 OpenStreetMap/ODbL 来源说明；更新时必须一起保留。
