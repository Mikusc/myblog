(() => {
  const config = JSON.parse(document.querySelector('#pet-config').textContent);
  const states = [
    {id: 'idle', label: '待机', row: 0, durations: [280,110,110,140,140,320], hint: '待机 · 轻轻眨眼'},
    {id: 'running-right', label: '向右跑', row: 1, durations: [120,120,120,120,120,120,120,220], hint: '向右小跑'},
    {id: 'running-left', label: '向左跑', row: 2, durations: [120,120,120,120,120,120,120,220], hint: '向左小跑'},
    {id: 'waving', label: '挥手', row: 3, durations: [140,140,140,280], hint: '嗨，又见面啦'},
    {id: 'jumping', label: '跳跃', row: 4, durations: [140,140,140,140,280], hint: '开心地跳一下'},
    {id: 'failed', label: '委屈', row: 5, durations: [140,140,140,140,140,140,140,240], hint: config.failedHint || '有一点点失落'},
    {id: 'waiting', label: '等你', row: 6, durations: [150,150,150,150,150,260], hint: '正在等你的回应'},
    {id: 'running', label: '思考', row: 7, durations: [120,120,120,120,120,220], hint: '认真想办法'},
    {id: 'review', label: '检查', row: 8, durations: [150,150,150,150,150,280], hint: '让我再仔细看看'}
  ];
  const pet = document.querySelector('.pet');
  const stage = document.querySelector('.stage');
  const actions = document.querySelector('#actions');
  const status = document.querySelector('#status');
  const follow = document.querySelector('#follow');
  const compare = document.querySelector('#compare');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let state = states[0], frame = 0, timer, gazing = false;
  let assetState = 'loading', assetRequest = 0;

  function cell(row, column) {
    pet.style.backgroundPosition = `${-column * 192}px ${-row * 208}px`;
    pet.dataset.row = row;
    pet.dataset.frame = column;
  }

  function tick() {
    clearTimeout(timer);
    if (gazing || document.hidden || assetState !== 'ready') return;
    cell(state.row, frame);
    if (!reducedMotion.matches) {
      timer = setTimeout(() => {
        frame = (frame + 1) % state.durations.length;
        tick();
      }, state.durations[frame]);
    }
  }

  function resume() {
    gazing = false;
    status.textContent = assetState === 'loading' ? `正在加载 ${config.name}…`
      : assetState === 'error' ? '素材暂时未能载入，请刷新页面重试。' : state.hint;
    tick();
  }

  function choose(next) {
    state = next;
    frame = 0;
    follow.checked = false;
    actions.querySelectorAll('button').forEach(button => {
      button.setAttribute('aria-pressed', button.dataset.state === state.id);
    });
    resume();
  }

  states.forEach(item => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = item.label;
    button.dataset.state = item.id;
    button.setAttribute('aria-pressed', item === state);
    button.addEventListener('click', () => choose(item));
    actions.append(button);
  });

  function lookAtPointer(event) {
    if (!follow.checked || follow.disabled || assetState !== 'ready') return;
    const bounds = pet.getBoundingClientRect();
    const dx = event.clientX - (bounds.left + bounds.width / 2);
    const dy = event.clientY - (bounds.top + bounds.height * .38);
    if (Math.hypot(dx, dy) < 55) {
      resume();
      return;
    }
    gazing = true;
    clearTimeout(timer);
    const angle = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
    const index = Math.round(angle / 22.5) % 16;
    cell(9 + Math.floor(index / 8), index % 8);
    status.textContent = '正在看向你';
  }

  function setVariant() {
    const variant = compare.checked ? config.original : config.current;
    const request = ++assetRequest;
    assetState = 'loading';
    stage.setAttribute('aria-busy', 'true');
    pet.dataset.assetState = assetState;
    follow.disabled = variant.rows < 11;
    if (follow.disabled) follow.checked = false;
    pet.style.backgroundImage = `url("${variant.src}")`;
    pet.style.backgroundSize = `1536px ${variant.rows * 208}px`;
    document.querySelector('#version-note').textContent = variant.note;
    document.querySelector('#follow-hint').textContent = follow.disabled
      ? '原版保留九种动作，切回新版即可体验方向跟随。'
      : '勾选跟随后，移动鼠标或轻触舞台，和小伙伴打个招呼。';
    resume();
    const image = new Image();
    image.onload = () => {
      if (request !== assetRequest) return;
      assetState = 'ready';
      pet.dataset.assetState = assetState;
      stage.setAttribute('aria-busy', 'false');
      resume();
    };
    image.onerror = () => {
      if (request !== assetRequest) return;
      assetState = 'error';
      pet.dataset.assetState = assetState;
      stage.setAttribute('aria-busy', 'false');
      resume();
    };
    image.src = variant.src;
  }

  document.addEventListener('pointermove', lookAtPointer, {passive: true});
  stage.addEventListener('pointerdown', lookAtPointer, {passive: true});
  document.documentElement.addEventListener('pointerleave', resume);
  follow.addEventListener('change', () => {
    resume();
    if (follow.checked && assetState === 'ready') status.textContent = '移动鼠标，或轻触舞台';
  });
  compare.addEventListener('change', setVariant);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearTimeout(timer);
    else tick();
  });
  reducedMotion.addEventListener('change', tick);
  setVariant();
})();
