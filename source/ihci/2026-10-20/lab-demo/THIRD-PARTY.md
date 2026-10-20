# Bundled dependencies and source assets

- Three.js 0.180.0 and OrbitControls: MIT, existing project dependency. License: `../vendor/THREE-LICENSE.txt`.
- MindAR 1.2.5: MIT, https://github.com/hiukim/mind-ar-js/tree/v1.2.5 . Vendored unchanged from https://registry.npmjs.org/mind-ar/-/mind-ar-1.2.5.tgz after verifying its npm SHA-512 integrity. Files: `mindar-image.prod.js`, `controller-mGt1s8dJ.js`, `ui-fBadYuor.js`. License: `../vendor/mindar-1.2.5/LICENSE`. The published browser bundle includes its TensorFlow.js and matching dependencies and inline workers; their included notices are retained.
- QR Code Generator 1.4.4 by Kazuhiko Arase: MIT, https://github.com/kazuhikoarase/qrcode-generator . Vendored unchanged from https://registry.npmjs.org/qrcode-generator/-/qrcode-generator-1.4.4.tgz after verifying npm SHA-512 integrity. Copyright/license header retained in `../vendor/qrcode-generator-1.4.4.js`.
- `@avenra/liquid-glass` 1.2.0 by DevSam7t3: MIT, https://github.com/DevSam7t3/liquid-glass . ESM bundle and source map vendored unchanged from the fixed npm tarball after SHA-512 verification. License and package provenance: `../vendor/liquid-glass-1.2.0/`. Only its low-level displacement-map/filter APIs are called, on small navigation controls; no runtime CDN or content cloning. CSS supplies the baseline appearance when refraction is unavailable or disabled.
- `assets/spatial-learning.png`: original image supplied by the user in this project; used as a demo Poster and the source of the compiled recognition target. Research claims in the image are not verified by this project.
- `assets/p01.mind`: compiled locally from that image with MindAR 1.2.5 at 683 × 1024; target index 0 maps explicitly to P-01 in `scan-targets.json`.

No camera frames are transmitted to a recognition service. Loading the scanner fetches the bundled script, target manifest and target binary from the same site.
