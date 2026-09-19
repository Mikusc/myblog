# 自定义宠物页面

博客工具页提供“宠物小屋”入口，四个独立页面通过顶部导航相互切换：

| 宠物 | 公开路径 |
| --- | --- |
| 瑶妹 · 万象棋 | https://www.mikusc.top/pet/ |
| Miku · 初音未来 | https://www.mikusc.top/pet/miku/ |
| Ribbonbun | https://www.mikusc.top/pet/ribbonbun/ |
| Derakkuma | https://www.mikusc.top/pet/derakkuma/ |

`source/pet/` 使用同源 HTML、CSS、JavaScript、WebP 和 ZIP，不需要后端服务或图像生成 API。Hexo 通过 `_config.yml` 的 `skip_render: pet/**` 原样复制，沿用 GitHub → Azure Static Web Apps 部署流程。

每页只加载当前宠物的素材，原版对照在切换时加载。页面共享 `pet.css` 和 `pet.js`，各自的 `#pet-config` 声明名称、素材地址、行数和说明。原有瑶妹链接保持可用。

## 互动和版本

四只宠物的展示和下载均使用已经生成并检查的 v2 素材：1536 × 2288，192 × 208 单元格，8 列、11 行。前九行是动作，后两行是从正上方开始顺时针排列的十六个朝向。ZIP 保留宠物 ID、描述和 `spriteVersionNumber: 2`，仅包含 `pet.json` 和 `spritesheet.webp`。

鼠标跟随默认关闭；启用后移动鼠标或轻触舞台，回到脸部附近或移出页面恢复原动作。选择动作会退出跟随。动画遵循系统的减少动态效果设置，后台标签页暂停播放。

瑶妹的原版也是 11 行，可以跟随方向。其余三只的原版是 9 行；对照时按原尺寸显示并停用跟随，切回新版恢复可选的跟随功能，避免读取不存在的方向行。对照不改变下载链接，下载始终提供新版。

Derakkuma 的网页采用已完成格式、动作与方向检查的 v2 成品。网页发布与本机宠物安装相互独立，不修改本机安装目录。

## 更新与验证

1. 将已检查的素材复制到 `source/pet/assets/`，以内容 SHA-256 的前 12 位命名，并更新对应 HTML 中的预加载、初始背景、配置和下载路径。
2. 同步 `downloads/` 中对应的 ZIP。不要将参考截图、生成提示词或内部 QA 文件发布到站点。
3. 修改共享 CSS 或 JavaScript 后，更新四个 HTML 引用中的 `v` 查询值为该文件 SHA-256 的前 12 位，避免浏览器使用旧缓存。
4. 运行 `npm ci`、`npm run build`，检查 `public/pet/` 与源文件一致，以及 ZIP 中的元数据和素材哈希。
5. 浏览器验证四页导航、九个动作、四个主要跟随方向、原版切换与手机布局；特别检查 9 行原版不会启用跟随。
6. 提交发布，等待 Azure 部署成功，再回读公开页面、共享文件、各素材与下载包。

## 当前展示素材

| 宠物 | SHA-256 |
| --- | --- |
| 瑶妹 | `3af48a284f4fff76cd549ecfee4e742d22ed8b29d912b1cfed066effe2ba5c64` |
| Miku | `5f8f76037771d98f6bb7a595dc5963f45d114377acef0c9446c7bdcb885247b6` |
| Ribbonbun | `a25d05da277040a9d429d259f4bef548d5290736c79f62a8dab8155d1b83c0ff` |
| Derakkuma | `48d25233986d4184399862fa106123b1f6b33d88bebd1c1bf7cbc48f13f047a2` |
