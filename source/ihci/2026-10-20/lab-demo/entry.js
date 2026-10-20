import {venueIdFromURL,requireVenue,sessionKey} from '../venues/registry.js';
export const SCAN_RESULT_KEY='fieldnotes-lab-scan-result-v1';
// Defaults keep the original links/API usable; callers pass the loaded catalogue.
export const POSTER_IDS=['P-01','P-02','P-03'];
const views=['overview','explore','map'];
export function isLANHTTP(value){
  const url=new URL(value),parts=url.hostname.split('.').map(Number);
  return url.protocol==='http:'&&!url.username&&!url.password&&parts.length===4&&parts.every(n=>Number.isInteger(n)&&n>=0&&n<=255)&&
    (parts[0]===10||(parts[0]===172&&parts[1]>=16&&parts[1]<=31)||(parts[0]===192&&parts[1]===168));
}
function copyVenue(from,to){const params=new URL(from).searchParams;if(params.has('venue'))to.searchParams.set('venue',venueIdFromURL(from));if(params.has('exhibition'))to.searchParams.set('exhibition',params.get('exhibition'));}
export function scanResultKey(scope){return scope?.venueId?`${sessionKey(scope)}:scan`:SCAN_RESULT_KEY;}

export function returnToVenue(scanURL,{posterIds=POSTER_IDS}={}){
  const url=new URL('./',scanURL),params=new URL(scanURL).searchParams;
  copyVenue(scanURL,url);
  url.searchParams.set('view',views.includes(params.get('returnView'))?params.get('returnView'):'overview');
  if(posterIds.includes(params.get('returnPoster')))url.searchParams.set('poster',params.get('returnPoster'));
  return url;
}
export function scanURL(venueURL,{posterIds=POSTER_IDS}={}){
  const url=new URL('./scan.html',venueURL),params=new URL(venueURL).searchParams;
  copyVenue(venueURL,url);
  url.searchParams.set('returnView',views.includes(params.get('view'))?params.get('view'):'overview');
  if(posterIds.includes(params.get('poster')))url.searchParams.set('returnPoster',params.get('poster'));
  return url;
}
export function posterURL(base,id,{posterIds=POSTER_IDS,venueId,exhibitionId}={}){
  if(!posterIds.includes(id))throw Error('未知展位');
  const url=new URL(base);
  if((url.protocol!=='https:'&&!isLANHTTP(url))||url.username||url.password)throw Error('请填写 HTTPS 展厅地址，或同 Wi-Fi 的局域网 HTTP 地址');
  const selectedVenue=venueId||(url.searchParams.has('venue')?venueIdFromURL(url):null);
  url.hash='';url.search='';
  if(selectedVenue)url.searchParams.set('venue',requireVenue(selectedVenue).id);
  if(exhibitionId)url.searchParams.set('exhibition',exhibitionId);
  if(url.pathname.endsWith('/index.html'))url.pathname=url.pathname.slice(0,-10);
  if(!url.pathname.endsWith('/'))url.pathname+='/';
  url.searchParams.set('view','explore');url.searchParams.set('poster',id);url.searchParams.set('entry','qr-or-link');
  return url;
}
export function consumeScanResult(storage,{posterId,exhibitionId,now=Date.now(),packId='lab-p01-v1',...scope}){
  try{
    const key=scanResultKey({...scope,exhibitionId}),result=JSON.parse(storage.getItem(key));storage.removeItem(key);
    if(result?.posterId!==posterId||result?.exhibitionId!==exhibitionId||result?.packId!==packId||!Number.isFinite(result?.at)||now-result.at<0||now-result.at>120000)return null;
    if(scope.venueId&&['venueId','layoutVersion','contentId','contentVersion'].some(k=>result[k]!==scope[k]))return null;
    return result;
  }catch{return null;}
}
