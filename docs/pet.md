# 瑶妹动画页面

公开路径：`https://www.mikusc.top/pet/`，博客工具页提供入口。

`source/pet/` 是独立静态页面，使用同源 HTML、WebP 和 ZIP，不需要后端服务或图像生成 API。Hexo 通过 `_config.yml` 的 `skip_render: pet/**` 原样复制，沿用 GitHub → Azure Static Web Apps 部署流程。

页面提供九种动作、十六个指针朝向、原版对照和宠物包下载。鼠标跟随默认关闭；启用后移动鼠标或轻触舞台，回到脸部附近或移出页面恢复原动作。选择动作会退出跟随。动画遵循系统的减少动态效果设置，后台标签页暂停播放。

## 更新素材

1. 使用已经完成视觉检查的 v2 素材：1536 × 2288，192 × 208 单元格，8 列、11 行。前九行是动作，后两行是从正上方开始顺时针排列的十六个朝向。
2. 将新 WebP 复制到 `source/pet/assets/`，使用内容哈希命名，并更新 `index.html` 中的预加载、背景、对照和下载路径。原版对照素材只在切换时加载。
3. 同步 `downloads/yaomei-wanxiangqi.zip` 中的 `pet.json` 和 `spritesheet.webp`；元数据须保留 `spriteVersionNumber: 2`。
4. 运行 `npm ci`、`npm run build`，检查 `public/pet/` 的文件与源文件一致，并验证工具页入口、九个动作、四个主要跟随方向、手机布局及两个下载链接。
5. 提交并按现有流程发布，等待 Azure 部署成功后回读公开页面与素材。

当前新版素材 SHA-256：`3af48a284f4fff76cd549ecfee4e742d22ed8b29d912b1cfed066effe2ba5c64`。

原版对照 SHA-256：`c2e17375035eb5b70c8b01cc15e473632985f584fc5be89ee5aa41276d3e6c7f`。
