(function(){  
var API_URL='https://kinopoiskapiunofficial.tech';  
var API_KEY='14342b35-714b-449d-bf10-30d0d9ac22e6';  
var CACHE_NAME='kp_tmdb_resolve_cache';  
var CACHE_MAX=800;  
var network=new Lampa.Reguest();  
var lines=[  
{type:'TOP_POPULAR_ALL',title:'Популярное'}  
];  
function kpHeader(){  
return {headers:{'X-API-KEY':API_KEY},cache:{life:180},timeout:15000};  
}  
function loadKpCollection(type,page,oncomplite,onerror){  
var url=API_URL+'/api/v2.2/films/collections?type='+type+'&page='+(page||1);  
network.silent(url,function(json){  
var items=json&&json.items?json.items:[];  
oncomplite({items:items,page:page||1,total_pages:json&&json.totalPages?json.totalPages:1,total_results:json&&json.total?json.total:items.length});  
},onerror,false,kpHeader());  
}  
function getResolveCache(){  
return Lampa.Storage.cache(CACHE_NAME,CACHE_MAX,{});  
}  
function setResolveCache(key,value){  
var cache=getResolveCache();  
cache[key]=value;  
Lampa.Storage.set(CACHE_NAME,cache);  
}  
function pickBestResult(results,year){  
if(!results||!results.length)return null;  
if(year){  
for(var i=0;i<results.length;i++){  
var date=results[i].release_date||results[i].first_air_date||'';  
var y=parseInt((date+'').slice(0,4));  
if(y&&Math.abs(y-year)<=1)return results[i];  
}  
}  
return results[0];  
}  
function tmdbSearch(method,query,year,cb,errcb){  
var url=Lampa.TMDB.api('search/'+method+'?query='+encodeURIComponent(query)+'&api_key='+Lampa.TMDB.key()+'&language='+Lampa.Storage.field('language'));  
if(year)url+='&'+(method==='movie'?'year=':'first_air_date_year=')+year;  
network.silent(url,function(json){  
cb(json&&json.results?json.results:[]);  
},errcb,false,{cache:{life:1440},timeout:8000});  
}  
function resolveTmdb(kpItem,cb){  
var method=(!kpItem.type||kpItem.type==='FILM')?'movie':'tv';  
var year=kpItem.year||kpItem.startYear||0;  
var cacheKey=method+'_'+(kpItem.kinopoiskId||kpItem.filmId);  
var cached=getResolveCache();  
if(cached[cacheKey]!==undefined){  
cb(cached[cacheKey]);  
return;  
}  
var queryOriginal=kpItem.nameOriginal||'';  
var queryFallback=kpItem.nameRu||kpItem.nameEn||'';  
function finish(card){  
setResolveCache(cacheKey,card);  
cb(card);  
}  
function tryFallback(){  
if(!queryFallback){  
finish(null);  
return;  
}  
tmdbSearch(method,queryFallback,year,function(results){  
var best=pickBestResult(results,year);  
if(!best){  
finish(null);  
return;  
}  
best.method=method;  
finish(Lampa.Utils.addSource(best,'tmdb'));  
},function(){finish(null);});  
}  
if(queryOriginal){  
tmdbSearch(method,queryOriginal,year,function(results){  
var best=pickBestResult(results,year);  
if(best){  
best.method=method;  
finish(Lampa.Utils.addSource(best,'tmdb'));  
}  
else tryFallback();  
},tryFallback);  
}  
else tryFallback();  
}  
function loadCollectionResolved(type,page,oncomplite,onerror){  
loadKpCollection(type,page,function(data){  
var items=data.items;  
if(!items.length){  
oncomplite({results:[],page:data.page,total_pages:data.total_pages,total_results:data.total_results});  
return;  
}  
var status=new Lampa.Status(items.length);  
var resolved=new Array(items.length);  
status.onComplite=function(){  
var results=[];  
for(var i=0;i<resolved.length;i++){  
if(resolved[i])results.push(resolved[i]);  
}  
oncomplite({results:results,page:data.page,total_pages:data.total_pages,total_results:data.total_results});  
};  
items.forEach(function(item,index){  
resolveTmdb(item,function(card){  
resolved[index]=card;  
status.append('i'+index,card);  
});  
});  
},onerror);  
}  
function apiMain(params,oncomplite,onerror){  
var status=new Lampa.Status(lines.length);  
status.onComplite=function(){  
var fulldata=[];  
for(var i=0;i<lines.length;i++){  
var data=status.data[lines[i].type];  
if(!data||!data.results||!data.results.length)continue;  
data.title=lines[i].title;  
data.url=lines[i].type;  
fulldata.push(data);  
}  
if(!fulldata.length){  
onerror();  
return;  
}  
oncomplite(fulldata);  
};  
lines.forEach(function(line){  
loadCollectionResolved(line.type,1,function(data){  
status.append(line.type,data);  
},status.error.bind(status));  
});  
}  
function apiCollection(params,oncomplite,onerror){  
loadCollectionResolved(params.url,params.page||1,oncomplite,onerror);  
}  
function MainComponent(object){  
var comp=new Lampa.InteractionMain(object);  
comp.create=function(){  
comp.activity.loader(true);  
apiMain(object,function(data){  
comp.build(data);  
},comp.empty.bind(comp));  
return comp.render();  
};  
comp.onMore=function(data){  
Lampa.Activity.push({url:data.url,title:data.title,component:'kinopoisk_category',page:1});  
};  
return comp;  
}  
function CategoryComponent(object){  
var comp=new Lampa.InteractionCategory(object);  
comp.create=function(){  
apiCollection(object,comp.build.bind(comp),comp.empty.bind(comp));  
};  
comp.nextPageReuest=function(obj,resolve,reject){  
apiCollection(obj,resolve.bind(comp),reject.bind(comp));  
};  
comp.cardRender=function(obj,element,card){  
card.onEnter=function(){  
Lampa.Activity.push({url:element.id,title:element.title||element.name,component:'full',source:'tmdb',method:element.method,id:element.id});  
};  
};  
return comp;  
}  
function addMenuButton(manifest){  
var button=$('<li class="menu__item selector"><div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle><text x="12" y="16" font-size="9" text-anchor="middle" fill="currentColor">KP</text></svg></div><div class="menu__text">'+manifest.name+'</div></li>');  
button.on('hover:enter',function(){  
Lampa.Activity.push({url:'',title:manifest.name,component:'kinopoisk_main',page:1});  
});  
$('.menu .menu__list').eq(0).append(button);  
}  
function initPlugin(){  
var manifest={type:'video',version:'2.1.0',name:'Кинопоиск',description:'Популярное с Кинопоиска, карточки из TMDB',component:'kinopoisk_main'};  
Lampa.Manifest.plugins=manifest;  
Lampa.Component.add('kinopoisk_main',MainComponent);  
Lampa.Component.add('kinopoisk_category',CategoryComponent);  
addMenuButton(manifest);  
}  
if(!window.kinopoisk_plugin_installed){  
window.kinopoisk_plugin_installed=true;  
if(window.appready)initPlugin();  
else Lampa.Listener.follow('app',function(e){if(e.type==='ready')initPlugin();});  
}  
})();
