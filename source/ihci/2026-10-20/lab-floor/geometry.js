export function polygonArea(points) {
  return Math.abs(points.reduce((sum, p, i) => {
    const q = points[(i + 1) % points.length];
    return sum + p[0] * q[1] - q[0] * p[1];
  }, 0)) / 2;
}

export function bounds(points) {
  const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

export function toWorld(point, coordinates, height = 0) {
  return [(point[0] - coordinates.originPx[0]) * coordinates.metersPerPixel,
    height, (point[1] - coordinates.originPx[1]) * coordinates.metersPerPixel];
}

export function pointInPolygon([x, y], polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const points = values => values.map(p => p.join(',')).join(' ');

function doorSVG(door) {
  const [x, y] = door.at, w = door.width, s = door.opens;
  const end = door.axis === 'v' ? [x, y + w] : [x + w, y];
  const leaf = door.axis === 'v' ? [x + s * w, y] : [x, y + s * w];
  const sweep = door.axis === 'v' ? (s === 1 ? 0 : 1) : (s === 1 ? 1 : 0);
  return `<g class="door"><path d="M${x} ${y}L${end.join(' ')}" class="door-gap"/><path d="M${x} ${y}L${leaf.join(' ')}M${end.join(' ')}A${w} ${w} 0 0 ${sweep} ${leaf.join(' ')}" class="door-swing"/></g>`;
}

function fixtureSVG(region) {
  if (region.stairs) {
    const {box:[x,y,w,h], axis, steps} = region.stairs;
    let lines = `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`;
    for (let i = 1; i < steps; i++) {
      const f = i / steps;
      lines += axis === 'y' ? `<path d="M${x} ${y+h*f}h${w}"/>` : `<path d="M${x+w*f} ${y}v${h}"/>`;
    }
    lines += axis === 'y' ? `<path d="M${x+w/2} ${y+3}v${h-6}"/>` : `<path d="M${x+3} ${y+h/2}h${w-6}"/>`;
    return `<g class="fixture">${lines}</g>`;
  }
  if (region.lift) {
    const [x,y,w,h] = region.lift.box, half = w/2-4;
    return `<g class="fixture">${[x,x+w/2+4].map(left => `<rect x="${left}" y="${y}" width="${half}" height="${h}"/><path d="M${left+3} ${y+3}l${half-6} ${h-6}m0 ${-h+6}l${-half+6} ${h-6}"/>`).join('')}</g>`;
  }
  return '';
}

export function buildFloorSVG(model, {interactive = false, reference = false} = {}) {
  const rooms = model.regions.map(region => {
    const cat = model.categories[region.category];
    return `<g class="region${region.openEdges ? ' open-region' : ''}" data-region="${esc(region.id)}" data-category="${region.category}" ${interactive ? `role="button" tabindex="0" aria-label="${esc(region.name)}" aria-pressed="false"` : ''}><title>${esc(region.name)} · ${esc(cat.label)}</title><polygon points="${points(region.polygon)}" fill="${cat.color}" stroke="${cat.stroke}"/>${region.category === 'outdoor' ? `<polygon class="hatch" points="${points(region.polygon)}" fill="url(#outdoor-lines)"/>` : ''}</g>`;
  }).join('');
  const labels = model.regions.filter(r => r.kind !== 'lift').map(region => {
    const [x,y] = region.label;
    const short = region.compact ? region.name.replace(/ [WE]\d$/, '').replace(/西侧|西南|南侧/, '') : region.name;
    const size = region.kind === 'courtyard' ? 24 : region.compact ? 10 : region.category === 'circulation' ? 13 : 16;
    const transform = region.labelVertical ? ` transform="rotate(-90 ${x} ${y})"` : '';
    return `<text x="${x}" y="${y}" font-size="${size}"${transform}>${esc(short)}</text>`;
  }).join('');
  const scale = 10 / model.coordinates.metersPerPixel;
  const anchors = model.posterAnchors.map(anchor => `<g class="poster-anchor" data-anchor="${esc(anchor.id)}" ${interactive ? `role="button" tabindex="0" aria-label="${esc(anchor.id)} ${esc(anchor.label)}，示例位置"` : ''} transform="translate(${anchor.position.join(' ')})"><circle r="14"/><text y="5">P</text><text class="anchor-code" x="22" y="5">${esc(anchor.id)}</text></g>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${model.viewBox.join(' ')}" class="floor-svg" ${interactive ? 'role="group" aria-label="实验室楼层平面，点击空间查看详情"' : 'role="img" aria-label="实验室楼层平面孪生初版"'}>
    <title>${esc(model.title)} · 平面孪生初版</title><desc>依据平面截图描摹。比例估算，楼层编号和图纸版本待确认。示例海报位不代表已安装。</desc>
    <defs><pattern id="outdoor-lines" patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(45)"><path d="M0 0v12" stroke="#bec8b0" stroke-width="1"/></pattern></defs>
    <style>
      .floor-svg{font-family:Inter,-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif}
      .footprint{fill:#fcfbf7;stroke:#344f46;stroke-width:5;stroke-linejoin:round}
      .region polygon{stroke-width:2.2;stroke-linejoin:round;transition:fill .12s,opacity .12s}
      .open-region polygon{stroke-width:.7;stroke-dasharray:3 4}
      .region .hatch{stroke:none;pointer-events:none;opacity:.5}
      .region.is-selected>polygon:first-of-type,.region:focus>polygon:first-of-type{fill:#98c7b7;stroke:#176553;stroke-width:5}
      .region.is-dimmed{opacity:.24}
      .region:focus{outline:none}
      .region[role=button]{cursor:pointer}
      .region[role=button]:hover>polygon:first-of-type{stroke:#176553;stroke-width:4}
      .labels{fill:#344e43;text-anchor:middle;font-weight:550;pointer-events:none}
      .fixture{stroke:#6b7d76;fill:none;stroke-width:1.3;pointer-events:none}
      .columns{fill:#475c52;pointer-events:none}
      .door-gap{stroke:#fcfbf7;stroke-width:8;fill:none}
      .door-swing{fill:none;stroke:#7b8d82;stroke-width:1.4}
      .doors{pointer-events:none}
      .poster-anchor{cursor:pointer}.poster-anchor circle{fill:#bd6b43;stroke:white;stroke-width:3}
      .poster-anchor text{fill:white;text-anchor:middle;font-size:14px;font-weight:700;pointer-events:none}
      .poster-anchor .anchor-code{text-anchor:start;fill:#895337;font-size:14px;paint-order:stroke;stroke:#fcfbf7;stroke-width:4px}
      .poster-anchor:focus{outline:none}.poster-anchor:focus circle{stroke:#234b3e;stroke-width:5}
      .annotations{pointer-events:none;fill:#52675b;font-size:15px}.annotation-small{font-size:12px;fill:#89958a}
      .source-image{display:none}
    </style>
    ${reference ? `<image class="source-image" href="./source-plan.jpg" x="0" y="0" width="${model.source.width}" height="${model.source.height}" aria-hidden="true"/>` : ''}
    <g class="model-layer"><polygon class="footprint" points="${points(model.footprint)}"/><g class="regions">${rooms}</g><g class="fixtures">${model.regions.map(fixtureSVG).join('')}</g><g class="doors">${model.doors.map(doorSVG).join('')}</g><g class="columns">${model.columns.map(([x,y]) => `<rect x="${x-7}" y="${y-7}" width="14" height="14"/>`).join('')}</g><g class="labels">${labels}</g></g>
    <g class="poster-anchors" style="display:none">${anchors}</g>
    <g class="annotations"><path d="M1306 150v-64m-8 10 8-10 8 10" fill="none" stroke="#52675b" stroke-width="1.8"/><text x="1306" y="173" text-anchor="middle">图纸上方</text><text x="1306" y="193" text-anchor="middle" class="annotation-small">非地理北向</text><g transform="translate(157 1100)"><path d="M0 0v8h${scale}v-8m${-scale/2} 8v-8" stroke="#52675b" stroke-width="2" fill="none"/><text y="32">0</text><text x="${scale/2}" y="32" text-anchor="middle">5</text><text x="${scale}" y="32" text-anchor="end">约 10 m</text><text y="58" class="annotation-small">按图纸 8400 mm 标注估算</text><text y="78" class="annotation-small">人工描摹 · 楼层与尺寸待核对</text></g></g>
  </svg>`;
}
