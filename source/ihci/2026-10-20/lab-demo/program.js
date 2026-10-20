const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function validateProgram(program){
  if(program.schemaVersion!==1||!Array.isArray(program.keynotes)||typeof program.timezone!=='string'||!program.timezone.trim())throw Error('议程格式无效');
  try{new Intl.DateTimeFormat('zh-CN',{timeZone:program.timezone}).format();}catch{throw Error('议程时区无效');}
  const ids=new Set();
  for(const talk of program.keynotes){
    if(['id','title','speaker','location'].some(k=>typeof talk[k]!=='string'||!talk[k].trim())||ids.has(talk.id))throw Error('议程条目缺少必填信息或编号重复');ids.add(talk.id);
    if(!Number.isFinite(Date.parse(talk.startAt))||!/(Z|[+-]\d\d:\d\d)$/.test(talk.startAt))throw Error('议程时间必须带时区');
    if(talk.url&&!['https:','http:'].includes(new URL(talk.url).protocol))throw Error('议程链接无效');
  }
  return program;
}
export function mountProgram(context){
  const dialog=document.getElementById('schedule-dialog'),content=document.getElementById('schedule-content');
  document.getElementById('close-schedule').onclick=()=>dialog.close();
  document.getElementById('open-schedule').onclick=async()=>{
    dialog.showModal();content.innerHTML='<p class="empty-state">正在载入议程…</p>';
    try{const url=new URL(context.profile.program||`./program-${context.profile.id}.json`,new URL('../venues/',import.meta.url));const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw Error('议程暂时无法载入，请稍后重试');
      const program=validateProgram(await response.json());
      content.innerHTML=program.keynotes.length?`<p>会场时间 · ${esc(program.timezone)}${program.updatedAt?` · 更新于 ${esc(program.updatedAt)}`:''}</p>`+program.keynotes.slice().sort((a,b)=>Date.parse(a.startAt)-Date.parse(b.startAt)).map(t=>`<article class="schedule-card"><time datetime="${esc(t.startAt)}">${new Date(t.startAt).toLocaleString('zh-CN',{timeZone:program.timezone,month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'})}</time><h3>${esc(t.title)}</h3><p>${esc(t.speaker)} · ${esc(t.location)}</p>${t.summary?`<p>${esc(t.summary)}</p>`:''}${t.url?`<a href="${esc(t.url)}" target="_blank" rel="noopener noreferrer">查看详情 ↗</a>`:''}</article>`).join(''):'<p class="empty-state">这份 2026-10-20 存档未收录正式 Keynote 议程，不会自动同步后续会议安排。</p>';
    }catch(e){content.textContent=e.message;}
  };
}
