import {bounds, polygonArea, buildFloorSVG} from './geometry.js';

const $ = id => document.getElementById(id);
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let model, svg, view, baseView, selectedId = null, filter = 'all', toastTimer;
const pointers = new Map();
let gesture = null;

function notify(message) {
  $('toast').textContent = message;
  $('toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 2800);
}

function setView(next) {
  view = next;
  svg.setAttribute('viewBox', `${view.x} ${view.y} ${view.w} ${view.h}`);
  $('zoom-value').value = `${Math.round(baseView.w / view.w * 100)}%`;
}

function svgPoint(clientX, clientY) {
  return new DOMPoint(clientX, clientY).matrixTransform(svg.getScreenCTM().inverse());
}

function zoom(factor, center = null) {
  const point = center || {x:view.x+view.w/2, y:view.y+view.h/2};
  const w = Math.min(baseView.w * 1.6, Math.max(baseView.w / 9, view.w * factor));
  const f = w / view.w;
  setView({x:point.x-(point.x-view.x)*f, y:point.y-(point.y-view.y)*f, w, h:view.h*f});
}

function focusRegion(region) {
  const b = bounds(region.polygon), ratio = baseView.w / baseView.h;
  const w = Math.max(340, b.width * 1.8, b.height * 1.8 * ratio), h = w / ratio;
  setView({x:b.x+b.width/2-w/2, y:b.y+b.height/2-h/2, w, h});
}

function renderSelection() {
  const region = model.regions.find(r => r.id === selectedId);
  if (!region) {
    const labs = model.regions.filter(r => r.category === 'lab').length;
    const stairs = model.regions.filter(r => r.kind === 'stairs').length;
    $('selection').innerHTML = `<p class="eyebrow">FLOOR OVERVIEW / 全层概览</p><div class="overview-stats"><div><strong>${labs}</strong><span>实验空间</span></div><div><strong>${stairs}</strong><span>楼梯核</span></div><div><strong>01</strong><span>中央院落</span></div></div><p class="selection-note">楼层编号待核对 · 比例按图纸估算</p>`;
    return;
  }
  const area = polygonArea(region.polygon) * model.coordinates.metersPerPixel ** 2;
  const anchorCount = model.posterAnchors.filter(p => p.roomId === region.id).length;
  $('selection').innerHTML = `<div class="selection-title"><span class="selected-code">${escapeHTML(region.id.toUpperCase())}</span><button id="clear-selection" aria-label="取消空间选择">×</button></div><h2>${escapeHTML(region.name)}</h2><p class="source-name">${escapeHTML(region.sourceLabel || model.categories[region.category].label)}</p><p class="selection-meta">描摹面积约 ${Math.round(area)} m²${anchorCount ? ` · ${anchorCount} 个示例海报位` : ''}</p><p class="selection-note">${escapeHTML(region.note || '面积由截图比例和区域轮廓估算，非原图标注面积。')}</p>`;
  $('clear-selection').addEventListener('click', () => selectRegion(null));
}

function selectRegion(id, focus = false) {
  const region = model.regions.find(r => r.id === id);
  selectedId = region?.id || null;
  for (const el of svg.querySelectorAll('[data-region]')) {
    const active = el.dataset.region === selectedId;
    el.classList.toggle('is-selected', active);
    el.setAttribute('aria-pressed', String(active));
  }
  for (const el of $('room-list').querySelectorAll('[data-room]')) el.setAttribute('aria-pressed', String(el.dataset.room === selectedId));
  renderSelection();
  const url = new URL(location.href);
  selectedId ? url.searchParams.set('room', selectedId) : url.searchParams.delete('room');
  history.replaceState(null, '', url);
  if (focus && region) focusRegion(region);
  if (region && window.matchMedia('(max-width:680px)').matches) {
    $('map-help').textContent = `已选：${region.name} · 下方查看详情`;
    notify(`${region.name} · 详情在图下方`);
  } else $('map-help').textContent = '拖动平移 · 滚轮缩放 · 点击空间查看详情';
}

function renderDirectory() {
  const query = $('room-search').value.trim().toLocaleLowerCase();
  const matches = model.regions.filter(r => (filter === 'all' || r.category === filter) && `${r.name} ${r.id} ${r.sourceLabel || ''}`.toLocaleLowerCase().includes(query));
  const ids = new Set(matches.map(r => r.id));
  $('room-count').textContent = `${matches.length} / ${model.regions.length}`;
  $('room-list').innerHTML = matches.length ? matches.map(region => `<button class="room-entry" data-room="${region.id}" aria-pressed="${region.id === selectedId}"><i class="room-swatch" style="background:${model.categories[region.category].color}"></i><span><span class="room-entry-name">${escapeHTML(region.name)}</span><span class="room-entry-code">${escapeHTML(region.id.toUpperCase())}</span></span><span class="room-entry-arrow" aria-hidden="true">↗</span></button>`).join('') : '<p class="empty-list">没有匹配空间，试试其他名称。</p>';
  for (const el of svg.querySelectorAll('[data-region]')) el.classList.toggle('is-dimmed', !ids.has(el.dataset.region));
}

function pickTarget(target) {
  const room = target.closest('[data-region]');
  const anchorEl = target.closest('[data-anchor]');
  if (room) selectRegion(room.dataset.region);
  if (anchorEl) {
    const anchor = model.posterAnchors.find(p => p.id === anchorEl.dataset.anchor);
    selectRegion(anchor.roomId);
    notify(`${anchor.id} · ${anchor.label}，实际位置待确认`);
  }
}

function beginGesture() {
  const pts = [...pointers.values()];
  if (!pts.length) { gesture = null; return; }
  const centroid = {x:pts.reduce((s,p)=>s+p.x,0)/pts.length, y:pts.reduce((s,p)=>s+p.y,0)/pts.length};
  gesture = {view:{...view}, start:centroid, anchor:svgPoint(centroid.x,centroid.y), count:pts.length,
    distance:pts.length > 1 ? Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y) : 0};
}

function setupMapInput() {
  const viewport = $('map-viewport');
  viewport.addEventListener('wheel', event => {
    event.preventDefault();
    zoom(Math.exp(Math.max(-120, Math.min(120,event.deltaY)) * .002), svgPoint(event.clientX,event.clientY));
  }, {passive:false});
  viewport.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    pointers.set(event.pointerId, {x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,target:event.target,moved:false});
    if (pointers.size > 1) for (const p of pointers.values()) p.moved = true;
    viewport.setPointerCapture(event.pointerId); beginGesture();
  });
  viewport.addEventListener('pointermove', event => {
    const p = pointers.get(event.pointerId);
    if (!p || !gesture) return;
    p.x = event.clientX; p.y = event.clientY;
    if (Math.hypot(p.x-p.startX,p.y-p.startY)>4) p.moved = true;
    const pts = [...pointers.values()];
    const center = {x:pts.reduce((s,a)=>s+a.x,0)/pts.length,y:pts.reduce((s,a)=>s+a.y,0)/pts.length};
    const rect = svg.getBoundingClientRect();
    const initial = gesture.view;
    if (pts.length === 1) {
      const units = Math.max(initial.w/rect.width,initial.h/rect.height);
      setView({...initial,x:initial.x-(center.x-gesture.start.x)*units,y:initial.y-(center.y-gesture.start.y)*units});
    } else {
      const dist = Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
      const f = Math.min(baseView.w*1.6/initial.w,Math.max(baseView.w/9/initial.w,gesture.distance/Math.max(1,dist)));
      const units = Math.max(initial.w*f/rect.width,initial.h*f/rect.height);
      setView({x:gesture.anchor.x-(gesture.anchor.x-initial.x)*f-(center.x-gesture.start.x)*units,
        y:gesture.anchor.y-(gesture.anchor.y-initial.y)*f-(center.y-gesture.start.y)*units,w:initial.w*f,h:initial.h*f});
    }
    viewport.classList.add('is-dragging');
  });
  const finish = event => {
    const p = pointers.get(event.pointerId);
    if (!p) return;
    const shouldPick = event.type === 'pointerup' && !p.moved && pointers.size === 1;
    pointers.delete(event.pointerId);
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    if (shouldPick) pickTarget(p.target);
    beginGesture();
    if (!pointers.size) viewport.classList.remove('is-dragging');
  };
  viewport.addEventListener('pointerup',finish);
  viewport.addEventListener('pointercancel',finish);
  svg.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {event.preventDefault();pickTarget(event.target);}
  });
}

async function start() {
  const response = await fetch('./model.json');
  if (!response.ok) throw new Error(`模型载入失败 (${response.status})`);
  model = await response.json();
  $('map-viewport').innerHTML = buildFloorSVG(model, {interactive:true, reference:true});
  svg = $('map-viewport').querySelector('svg');
  const [x,y,w,h] = model.viewBox;
  baseView = {x,y,w,h}; setView({...baseView});
  $('legend').innerHTML = Object.values(model.categories).map(c => `<span class="legend-item"><i style="background:${c.color}"></i>${escapeHTML(c.label)}</span>`).join('');
  const filters = [['all','全部'],['lab','实验'],['shared','共享'],['office','办公'],['service','服务'],['outdoor','室外']];
  $('category-filters').innerHTML = filters.map(([id,name]) => `<button data-filter="${id}" aria-pressed="${id===filter}">${name}</button>`).join('');
  $('category-filters').addEventListener('click', event => {
    const button = event.target.closest('[data-filter]'); if (!button) return;
    filter = button.dataset.filter;
    for (const b of $('category-filters').children) b.setAttribute('aria-pressed',String(b === button));
    renderDirectory();
  });
  $('room-search').addEventListener('input',renderDirectory);
  $('room-list').addEventListener('click',event => {const button = event.target.closest('[data-room]');if(button) selectRegion(button.dataset.room,true);});
  $('show-labels').addEventListener('change',event => {svg.querySelector('.labels').style.display=event.target.checked?'':'none';});
  $('show-doors').addEventListener('change',event => {svg.querySelector('.doors').style.display=event.target.checked?'':'none';});
  $('show-posters').addEventListener('change',event => {
    svg.querySelector('.poster-anchors').style.display=event.target.checked?'':'none';
    if(event.target.checked) notify('3 个海报位仅作布展预留，实际位置待确认');
  });
  const updateReference = () => {
    const active = $('show-source').checked;
    svg.querySelector('.source-image').style.display=active?'inline':'none';
    svg.querySelector('.model-layer').style.opacity=active?Number($('model-opacity').value)/100:1;
    svg.querySelector('.annotations').style.display=active?'none':'';
    $('opacity-control').hidden=!active;
  };
  $('show-source').addEventListener('change',updateReference);
  $('model-opacity').addEventListener('input',updateReference);
  $('zoom-in').addEventListener('click',()=>zoom(1/1.35));
  $('zoom-out').addEventListener('click',()=>zoom(1.35));
  $('fit-floor').addEventListener('click',()=>{setView({...baseView});selectRegion(null);});
  $('about-toggle').addEventListener('click',()=>{
    $('model-notes').hidden=!$('model-notes').hidden;
    $('about-toggle').setAttribute('aria-expanded',String(!$('model-notes').hidden));
  });
  setupMapInput();renderDirectory();
  const requestedRoom = new URL(location.href).searchParams.get('room');
  const roomParam = model.regionAliases?.[requestedRoom] || requestedRoom;
  if (roomParam && !model.regions.some(r=>r.id === roomParam)) notify('未找到该空间，已显示全层');
  selectRegion(roomParam,Boolean(roomParam));
}

start().catch(error => {
  console.error(error);
  $('map-viewport').innerHTML = '<div class="loading-message" role="alert">暂时无法载入交互模型。<br>请通过本地服务器打开此页。<a href="./model.svg">打开静态平面图 ↗</a></div>';
  $('selection').textContent = '空间数据尚未载入';
});
