// Share one set of controls and listeners across phone and desktop. Only the
// shell changes at the breakpoint; directory state, roles and drafts stay put.
export function mountVenueShell({observer=false,getView,onMenuChange=()=>{},onStopWalking=()=>{}}={}){
  if(observer)return {sync(){},isMenuOpen:()=>false};
  const $=id=>document.getElementById(id),body=document.body;
  const media=matchMedia('(max-width:720px)'),menu=$('mobile-menu'),menuButton=$('mobile-menu-toggle');
  const walkButton=$('mobile-walk-toggle'),detailsButton=$('mobile-reactions-toggle'),footer=$('poster-footer');
  const sidebar=document.querySelector('.sidebar'),toolbar=document.querySelector('.stage-toolbar');
  let mobile=null,walking=false,details=false,lastPoster=null,lastMode=null;
  body.classList.add('venue-shell');
  $('mobile-tools').append(toolbar);$('mobile-directory').append(sidebar);
  for(const id of ['access-link','plan-link'])$('mobile-utility-links').append($(id));
  function setWalking(value){walking=Boolean(value);body.dataset.mobileWalking=String(walking);walkButton.setAttribute('aria-expanded',String(walking));walkButton.querySelector('span').textContent=walking?'完成走动':'走动';if(!walking)onStopWalking();syncHint();}
  function setDetails(value){details=Boolean(value);footer.classList.toggle('mobile-details-open',details);detailsButton.setAttribute('aria-expanded',String(details));detailsButton.setAttribute('aria-label',details?'收起表情与海报详情':'展开表情与海报详情');}
  function syncHint(){const {mode}=getView();$('view-caption').textContent=mode==='explore'?(walking?(mobile?'按住方向移动 · 拖动环顾':'WASD / 方向键移动 · 拖动环顾'):(mobile?'拖动环顾 · 轻点海报查看':'拖动环顾 · 点击海报阅读全文')):mode==='map'?'点选展位，阅读海报':'拖动浏览 · 点选海报';if(body.dataset.modelRevision==='R18')$('view-caption').textContent=mode==='overview'?'R18 · 范围 / 门位待核':mode==='map'?'R18 · 尺寸待核 · 点选展位':walking?'模型内走动 · 现场通行待核':'R18 · 示例展位 / 位置待核';$('interaction-help').textContent=mode==='map'?'点选编号进入海报':mobile?'拖动旋转 · 双指缩放':'拖动旋转 · 滚轮缩放';}
  function closeMenu(){if(menu.open)menu.close();}
  function sync(){const {mode,posterId}=getView();
    if(mode!==lastMode||posterId!==lastPoster){setWalking(false);setDetails(false);lastMode=mode;lastPoster=posterId;}
    walkButton.hidden=mode!=='explore';detailsButton.hidden=!posterId||mode==='overview';
    body.dataset.mobileView=mode;syncHint();
  }
  function adapt(){const next=media.matches;if(next===mobile)return;setWalking(false);setDetails(false);mobile=next;
    body.classList.toggle('mobile-venue',mobile);
    body.classList.toggle('desktop-venue',!mobile);
    sync();
  }
  menuButton.addEventListener('click',()=>{setWalking(false);menu.showModal();menuButton.setAttribute('aria-expanded','true');onMenuChange(true);});
  $('mobile-menu-close').addEventListener('click',closeMenu);
  menu.addEventListener('close',()=>{menuButton.setAttribute('aria-expanded','false');onMenuChange(false);});
  menu.addEventListener('click',event=>{
    if(event.target===menu){const r=menu.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeMenu();}
  });
  // Close before invoking the original handlers so a reader/workspace never
  // opens behind this modal, and navigation restores the interactive venue.
  menu.addEventListener('click',event=>{
    if(event.target.closest('[data-poster],[data-mode],#reset-view,#open-schedule,#restart-tour'))closeMenu();
  },true);
  walkButton.addEventListener('click',()=>{setDetails(false);setWalking(!walking);});
  detailsButton.addEventListener('click',()=>{setWalking(false);setDetails(!details);});
  for(const dialog of document.querySelectorAll('dialog'))if(dialog!==menu)dialog.addEventListener('close',()=>{
    onMenuChange(menu.open);
    if(!document.querySelector('dialog[open]')&&(menu.contains(document.activeElement)||document.activeElement===body))menuButton.focus({preventScroll:true});
  });
  media.addEventListener('change',adapt);adapt();sync();
  return {sync,isMenuOpen:()=>menu.open};
}
