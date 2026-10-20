import {posterURL,isLANHTTP} from './entry.js';
import {venueIdFromURL,loadVenueProfile,scopedURL} from '../venues/registry.js';
const $=id=>document.getElementById(id);
async function startPage(){
const context=await loadVenueProfile(venueIdFromURL(location.href));
const names=Object.fromEntries(context.content.posters.map(p=>[p.id,p.title]));
const base=scopedURL('./',location.href,context.profile.id);
$('access-context').textContent=`${context.profile.title} · ${context.profile.purpose}`;
for(const link of document.querySelectorAll('a[href]')){const url=new URL(link.getAttribute('href'),location.href);if(url.origin===location.origin){url.searchParams.set('venue',context.profile.id);link.href=url.href;}}
if(base.protocol==='https:'||isLANHTTP(base))$('venue-address').value=base.href;
else $('address-help').textContent='当前是本机预览地址，手机不能用它访问此电脑。部署到 HTTPS 站点后，在这里填写展厅地址。';
if(isLANHTTP(base)){
  document.querySelector('label[for="venue-address"]').textContent='同 Wi-Fi 的展厅地址';
  $('address-help').textContent='手机与电脑需连接同一个 Wi-Fi。可浏览展厅和参与讨论；网页内相机扫描需要 HTTPS。';
}
$('device-info').textContent=`当前页面：${window.isSecureContext?'安全上下文':'非安全上下文'}；相机 API：${navigator.mediaDevices?.getUserMedia?'可用（仍需授权）':'不可用'}。实际识别与流畅度需要在设备上测试。`;
function generate(){
  try{
    const urls=Object.keys(names).map(id=>[id,posterURL($('venue-address').value.trim(),id,{posterIds:Object.keys(names),venueId:context.profile.id,exhibitionId:context.scope.exhibitionId})]);
    const hostname=urls[0][1].hostname;
    if(hostname==='localhost'||hostname==='127.0.0.1'||hostname==='[::1]')throw Error('请使用手机可访问的地址；localhost 和 127.0.0.1 只指向访问设备自身。');
    $('qr-cards').replaceChildren();
    for(const [id,url] of urls){
      const card=document.createElement('article');card.className='qr-card';
      const heading=document.createElement('h2');heading.textContent=id;
      const name=document.createElement('p');name.textContent=`${context.profile.title} · ${names[id]}`;
      const code=qrcode(0,'M');code.addData(url.href,'Byte');code.make();
      const svg=document.createElement('div');svg.innerHTML=code.createSvgTag({cellSize:4,margin:16,scalable:true});svg.firstElementChild.setAttribute('aria-label',`${id} 手机入口二维码`);svg.firstElementChild.setAttribute('role','img');
      const link=document.createElement('a');link.href=url.href;link.textContent=url.href;link.className='qr-url';
      const copy=document.createElement('button');copy.textContent='复制展位链接';copy.className='button secondary';copy.setAttribute('aria-label',`复制 ${id} 链接`);
      const feedback=document.createElement('p');feedback.className='copy-status';feedback.setAttribute('role','status');
      copy.onclick=async()=>{try{await navigator.clipboard.writeText(url.href);feedback.textContent='链接已复制';}catch{feedback.textContent='请长按上方地址复制';}};
      card.append(heading,name,svg,copy,link,feedback);$('qr-cards').append(card);
    }
    $('print-actions').hidden=false;$('share-feedback').textContent=`已生成 ${context.profile.title} 的 ${Object.keys(names).length} 个入口。请确认地址已部署，生成二维码本身不会发布网站。`;
  }catch(error){$('qr-cards').replaceChildren();$('print-actions').hidden=true;$('share-feedback').textContent=error.message||'地址无法使用';}
}
$('address-form').addEventListener('submit',event=>{event.preventDefault();generate();});$('print-cards').addEventListener('click',()=>window.print());
if($('venue-address').value)generate();

}
startPage().catch(error=>{$('share-feedback').textContent=error.message;});
