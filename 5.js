(function(){
'use strict';
var _logoCache={};
var GENRE_LABELS={28:'Боевик',12:'Приключения',35:'Комедия',80:'Криминал',18:'Драма',10751:'Семейный',14:'Фэнтези',36:'История',27:'Ужасы',10402:'Музыка',9648:'Детектив',10749:'Мелодрама',878:'Фантастика',10770:'Телефильм',53:'Триллер',10752:'Военный',37:'Вестерн',10759:'Экшен',10762:'Детский',10765:'НФ и Фэнтези',10768:'Война и Политика'};
function fmtTime(m){if(!m||m<=0)return '';var h=Math.floor(m/60),r=m%60;return h>0?(h+'ч'+(r>0?' '+r+'м':'')):r+'м';}
function getGenreLabels(movie,max){
var isTv=!!movie.name,genres=movie.genres||[],ids=genres.map(function(g){return typeof g==='object'?g.id:g;}),priority=null;
if(ids.indexOf(16)!==-1&&movie.original_language==='ja')priority='Аниме';
else if(ids.indexOf(10763)!==-1)priority='Новости';
else if(ids.indexOf(10767)!==-1)priority='Ток-шоу';
else if(ids.indexOf(10764)!==-1)priority='Реалити-шоу';
else if(ids.indexOf(99)!==-1)priority='Документальный';
else if(ids.indexOf(10766)!==-1)priority='Мыльная опера';
else if(ids.indexOf(16)!==-1)priority=isTv?'Мультсериал':'Мультфильм';
var result=[];
if(priority)result.push(priority);
for(var i=0;i<ids.length&&result.length<(max||2);i++){
var label=GENRE_LABELS[ids[i]];
if(!label){var n=genres[i]&&(genres[i].name||'');label=n?(n.charAt(0).toUpperCase()+n.slice(1)):null;}
if(label&&result.indexOf(label)===-1)result.push(label);
}
return result;
}
function parseCountry(iso){
if(!iso)return '';
var key='country_'+iso.toLowerCase(),t=Lampa.Lang.translate(key);
return(t&&t!==key)?t:iso;
}
var style=document.createElement('style');
style.textContent='body.fsc--open .full-start__background{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:0!important;object-fit:cover!important;mask-image:none!important;-webkit-mask-image:none!important;pointer-events:none!important;filter:brightness(0.85)!important;opacity:0;transition:opacity 0.5s ease-in-out;}body.fsc--open .full-start__background.loaded{opacity:1!important;}body.fsc--open .full-start__background.dim{opacity:0!important;transition:opacity 0s!important;}body.fsc--open:not(.fsc--scrolled) .background{opacity:0!important;transition:none!important;}body.fsc--open.fsc--scrolled .background{opacity:1!important;transition:opacity 0.4s!important;}body.fsc--open:not(.fsc--scrolled) .head{background:transparent!important;}body.fsc--open .full-start-new{position:relative!important;}body.fsc--open .full-start-new__body{min-height:calc(100vh - 6em)!important;align-items:stretch!important;justify-content:center!important;}body.fsc--open .full-start-new__right{display:flex!important;flex-direction:column!important;min-height:calc(100vh - 6em)!important;justify-content:flex-end!important;align-items:center!important;text-align:center!important;padding-bottom:0.8em!important;}body.fsc--open .full-start-new__left{display:none!important;}body.fsc--open .full-start-new__right>*:not(.fsc-main){display:none!important;}.fsc-main{display:flex!important;flex-direction:column!important;align-items:center!important;text-align:center!important;margin-bottom:0.2em!important;}body.fsc--open .full-start-new__title{text-align:center!important;max-width:100%!important;text-shadow:0 2px 12px rgba(0,0,0,0.95)!important;margin-bottom:0.15em!important;display:block!important;overflow:visible!important;-webkit-line-clamp:unset!important;line-clamp:unset!important;}.fsc-logo{max-width:18em!important;max-height:5em!important;object-fit:contain!important;margin-bottom:0.15em!important;}.fsc-center-row{display:flex!important;flex-wrap:wrap!important;align-items:center!important;justify-content:center!important;gap:0.35em!important;margin-bottom:0.2em!important;}.fsc-serial-badge{display:inline-flex!important;align-items:center!important;height:1.5em!important;padding:0 0.5em!important;background:rgba(0,0,0,0.6)!important;color:#fff!important;font-size:1.25em!important;font-weight:550!important;border-radius:0.35em!important;white-space:nowrap!important;box-sizing:border-box!important;backdrop-filter:blur(20px) saturate(180%)!important;-webkit-backdrop-filter:blur(20px) saturate(180%)!important;border:1px solid rgba(255,255,255,0.25)!important;margin:0!important;text-shadow:none!important;}';
document.head.appendChild(style);
function init(){
var currentToken=null,currentFullComp=null;
Lampa.Listener.follow('full',function(e){
if(e.type!=='complite')return;
var fullComp=e.link,token={};
currentToken=token;
currentFullComp=fullComp;
$('body').addClass('fsc--open').removeClass('fsc--scrolled');
if(!Lampa.Storage.field('card_interfice_cover'))$('body').removeClass('card--no-cover');
setTimeout(function(){
if(currentToken!==token)return;
var render=$(fullComp.render());
var movie=e.data&&e.data.movie;
if(!movie)return;
var right=render.find('.full-start-new__right');
var title=render.find('.full-start-new__title');
var buttons=render.find('.full-start-new__buttons');
var relDate=movie.release_date||movie.first_air_date||'';
var year=relDate?relDate.slice(0,4):'';
var runtime=movie.first_air_date?fmtTime((movie.episode_run_time||[])[0]):fmtTime(movie.runtime);
var countries=(movie.production_countries||[]).slice(0,2).map(function(c){return parseCountry(c.iso_3166_1||'');}).filter(Boolean);
var genreLabels=getGenreLabels(movie,2);
var pg=render.find('.full-start__pg').not('.hide').text().trim();
var tmdbRating=movie.vote_average?parseFloat(movie.vote_average):0;
var currentKP=movie.kp_rating?parseFloat(movie.kp_rating):0;
var currentQuality='';
var infoParts=[];
if(year)infoParts.push(year);
if(runtime)infoParts.push(runtime);
if(countries.length)infoParts.push(countries.join(', '));
if(genreLabels.length)infoParts.push(genreLabels.join(', '));
var infoEl=$('<span class="fsc-serial-badge"></span>');
function rebuildInfo(){
var p=infoParts.slice();
if(currentKP>0)p.push(currentKP.toFixed(1)+' KP');
else if(tmdbRating>0)p.push(tmdbRating.toFixed(1)+' TMDB');
if(pg)p.push(pg);
if(currentQuality)p.push(currentQuality);
infoEl.text(p.join(' \u2022 '));
}
rebuildInfo();
var kpEl=render.find('.rate--kp')[0];
function checkKP(n){
if(currentToken!==token||n>12)return;
if(kpEl&&!$(kpEl).hasClass('hide')){
var v=parseFloat($(kpEl).find('> div').eq(0).text());
if(v>0){currentKP=v;rebuildInfo();}
}else{setTimeout(function(){checkKP(n+1);},500);}
}
checkKP(0);
function checkQual(n){
if(currentToken!==token||n>12)return;
var qb=render.find('.quality-badge-custom').first();
if(qb.length){currentQuality=qb.text().trim();rebuildInfo();}
else{setTimeout(function(){checkQual(n+1);},500);}
}
setTimeout(function(){checkQual(0);},300);
var serialEl=null;
if(movie.first_air_date){
var last=movie.last_episode_to_air;
var curSeas=last?last.season_number:0;
var totSeas=movie.number_of_seasons||0;
var totEps=movie.number_of_episodes||0;
var curEps=last?last.episode_number:0;
var airedTotal=0;
if(movie.seasons&&last){
for(var si=0;si<movie.seasons.length;si++){
var s=movie.seasons[si];
if(s.season_number>0&&s.season_number<curSeas)airedTotal+=s.episode_count||0;
}
airedTotal+=curEps;
}
var tvStatus=movie.status||'';
var hasNextEp=false;
var nextEpStr='';
var nextEp=movie.next_episode_to_air;
if(nextEp&&nextEp.air_date){
var daysLeft=Math.ceil((Lampa.Utils.parseToDate(nextEp.air_date).getTime()-Date.now())/86400000);
if(daysLeft>0){
hasNextEp=true;
nextEpStr=Lampa.Lang.translate('full_next_episode')+': '+Lampa.Utils.parseTime(nextEp.air_date).short+' / '+Lampa.Lang.translate('full_episode_days_left')+': '+daysLeft;
}
}
var sp=[];
if(tvStatus&&!(tvStatus==='Returning Series'&&hasNextEp)){
sp.push(Lampa.Lang.translate('tv_status_'+tvStatus.toLowerCase().replace(/ /g,'_')));
}
if(totSeas>0)sp.push(Lampa.Lang.translate('title_seasons')+': '+(curSeas<totSeas?curSeas+'/'+totSeas:totSeas));
if(totEps>0)sp.push(Lampa.Lang.translate('title_episodes')+': '+((airedTotal>0&&airedTotal<totEps)?airedTotal+'/'+totEps:totEps));
if(hasNextEp)sp.push(nextEpStr);
if(sp.length)serialEl=$('<span class="fsc-serial-badge"></span>').text(sp.join(' \u2022 '));
}
var movieStatusEl=null;
if(!movie.first_air_date){
var fStatus=movie.status||'';
if(fStatus&&fStatus.toLowerCase()!=='released'){
var fParts=[Lampa.Lang.translate('tv_status_'+fStatus.toLowerCase().replace(/ /g,'_'))];
if(movie.release_date)fParts.push(Lampa.Utils.parseTime(movie.release_date).short);
movieStatusEl=$('<span class="fsc-serial-badge"></span>').text(fParts.join(' \u2022 '));
}
}
var main=$('<div class="fsc-main"></div>');
main.append(title);
if(movie.first_air_date&&serialEl)main.append($('<div class="fsc-center-row"></div>').append(serialEl));
else if(!movie.first_air_date&&movieStatusEl)main.append($('<div class="fsc-center-row"></div>').append(movieStatusEl));
main.append($('<div class="fsc-center-row"></div>').append(infoEl));
main.append(buttons);
right.find('.fsc-main').remove();
right.append(main);
if(movie.id){
var origHtml=title.html();
var mediaType=movie.name?'tv':'movie';
var cacheKey=mediaType+'_'+movie.id;
var applyLogo=function(src){
var img=document.createElement('img');
img.className='fsc-logo';
img.onerror=function(){title.html(origHtml);};
img.src=src;
title.empty().append(img);
};
if(cacheKey in _logoCache){
if(_logoCache[cacheKey])applyLogo(_logoCache[cacheKey]);
}else{
$.get(
Lampa.TMDB.api(mediaType+'/'+movie.id+'/images?api_key='+Lampa.TMDB.key()+'&language=ru&include_image_language=ru'),
function(data){
if(currentToken!==token)return;
var logos=(data.logos||[]).filter(function(l){return l.file_path&&!l.file_path.endsWith('.svg')&&l.iso_639_1==='ru';});
logos.sort(function(a,b){return b.vote_average-a.vote_average;});
if(Object.keys(_logoCache).length>200)_logoCache={};
_logoCache[cacheKey]=logos.length?Lampa.TMDB.image('t/p/original'+logos[0].file_path):null;
if(_logoCache[cacheKey])applyLogo(_logoCache[cacheKey]);
}
);
}
}
if(fullComp.scroll&&!fullComp.scroll._fscWrapped){
fullComp.scroll._fscWrapped=true;
var _orig=fullComp.scroll.onScroll;
fullComp.scroll.onScroll=function(pos){
if(_orig)_orig(pos);
$('body').toggleClass('fsc--scrolled',pos>30);
};
}
},0);
});
Lampa.Listener.follow('activity',function(e){
if(e.type==='archive'&&e.component==='full'){
$('body').addClass('fsc--open').removeClass('fsc--scrolled');
if(!Lampa.Storage.field('card_interfice_cover'))$('body').removeClass('card--no-cover');
currentFullComp=e.object.activity.component;
}
if(e.type==='destroy'&&e.component==='full'){
var destroyedComp=e.object&&e.object.activity&&e.object.activity.component;
if(destroyedComp&&destroyedComp.scroll)destroyedComp.scroll._fscWrapped=false;
if(destroyedComp===currentFullComp){
currentToken=null;
currentFullComp=null;
$('body').removeClass('fsc--open fsc--scrolled');
if(!Lampa.Storage.field('card_interfice_cover'))$('body').addClass('card--no-cover');
}
}
});
}
if(window.appready)init();
else Lampa.Listener.follow('app',function(e){if(e.type==='ready')init();});
})();
