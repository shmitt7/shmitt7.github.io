(function(){  
var API_URL='https://kinopoiskapiunofficial.tech';  
var API_KEY='14342b35-714b-449d-bf10-30d0d9ac22e6';  
var network=new Lampa.Reguest();  
var lines=[{type:'TOP_POPULAR_ALL',title:'Сейчас смотрят'},{type:'TOP_250_MOVIES',title:'Топ 250 фильмов'},{type:'TOP_250_TV_SHOWS',title:'Топ 250 сериалов'},{type:'TOP_POPULAR_MOVIES',title:'Популярные фильмы'},{type:'POPULAR_SERIES',title:'Популярные сериалы'},{type:'TOP_100_GREATEST_MOVIES_XXI',title:'Топ 100 величайших фильмов XXI века'},{type:'KIDS_ANIMATION_THEME',title:'Мультфильмы'},{type:'CLOSES_RELEASES',title:'Скоро в кино'}];  
function requestParams(extra){  
var params={headers:{'X-API-KEY':API_KEY},cache:{life:180},timeout:15000};  
if(extra){for(var k in extra){if(extra.hasOwnProperty(k))params[k]=extra[k];}}  
return params;  
}  
function mapCard(film){  
if(!film)return null;  
var isTv=film.type==='TV_SERIES'||film.type==='MINI_SERIES'||film.type==='TV_SHOW';  
var kpId=film.kinopoiskId||film.filmId;  
var card={source:'kp',id:'kp_'+kpId,kinopoisk_id:kpId,imdb_id:film.imdbId||'',title:film.nameRu||film.nameEn||film.nameOriginal||'',original_title:film.nameOriginal||film.nameEn||'',overview:film.description||film.shortDescription||'',img:film.posterUrlPreview||film.posterUrl||'',poster:film.posterUrlPreview||film.posterUrl||'',background_image:film.coverUrl||film.posterUrl||film.posterUrlPreview||'',vote_average:parseFloat(film.ratingKinopoisk||film.rating)||0,kp_rating:parseFloat(film.ratingKinopoisk||film.rating)||0,imdb_rating:parseFloat(film.ratingImdb)||0,vote_count:film.ratingKinopoiskVoteCount||film.ratingVoteCount||0,genres:[],production_countries:[]};  
if(film.genres){for(var i=0;i<film.genres.length;i++)card.genres.push({id:0,name:film.genres[i].genre});}  
if(film.countries){for(var j=0;j<film.countries.length;j++)card.production_countries.push({name:film.countries[j].country});}  
if(isTv){card.name=card.title;card.original_name=card.original_title;card.first_air_date=film.startYear?film.startYear+'-01-01':(film.year?film.year+'-01-01':'');if(film.endYear)card.last_air_date=film.endYear+'-01-01';}  
else card.release_date=film.year?film.year+'-01-01':'';  
return card;  
}  
function loadCollection(type,page,oncomplite,onerror){  
var url=API_URL+'/api/v2.2/films/collections?type='+type+'&page='+(page||1);  
network.silent(url,function(json){  
var results=[];  
var items=json&&json.items?json.items:[];  
for(var i=0;i<items.length;i++){var c=mapCard(items[i]);if(c)results.push(c);}  
oncomplite({results:results,page:page||1,total_pages:json&&json.totalPages?json.totalPages:1,total_results:json&&json.total?json.total:results.length});  
},onerror,false,requestParams());  
}  
function apiMain(params,oncomplite,onerror){  
var status=new Lampa.Status(lines.length);  
status.onComplite=function(){  
var fulldata=[];  
for(var i=0;i<lines.length;i++){  
var data=status.data[lines[i].type];  
if(!data)continue;  
data.title=lines[i].title;  
data.type=lines[i].type;  
fulldata.push(data);  
}  
if(!fulldata.length)return onerror();  
oncomplite(fulldata);  
};  
lines.forEach(function(line){  
loadCollection(line.type,1,function(data){status.append(line.type,data);},status.error.bind(status));  
});  
}  
function apiCollection(params,oncomplite,onerror){  
loadCollection(params.url,params.page||1,oncomplite,onerror);  
}  
function apiFull(params,oncomplite,onerror){  
var kpId=params.kinopoisk_id||String(params.id||'').replace('kp_','');  
if(!kpId)return onerror();  
var status=new Lampa.Status(3);  
status.onComplite=function(){  
var card=status.data.card;  
if(!card)return onerror();  
oncomplite({movie:card,cast:status.data.cast||{cast:[],crew:[]},similar:status.data.similar||{results:[]}});  
};  
network.silent(API_URL+'/api/v2.2/films/'+kpId,function(film){status.append('card',mapCard(film));},status.error.bind(status),false,requestParams());  
network.silent(API_URL+'/api/v2.2/films/'+kpId+'/staff',function(staff){  
var cast=[];  
var crew=[];  
var list=staff||[];  
for(var i=0;i<list.length;i++){  
var person=list[i];  
var item={id:person.staffId,name:person.nameRu||person.nameEn||'',url:'',img:person.posterUrl||'',character:person.description||'',job:Lampa.Utils.capitalizeFirstLetter((person.professionKey||'').toLowerCase())};  
if(person.professionKey==='ACTOR')cast.push(item);  
else crew.push(item);  
}  
status.append('cast',{cast:cast,crew:crew});  
},status.error.bind(status),false,requestParams());  
network.silent(API_URL+'/api/v2.2/films/'+kpId+'/similars',function(json){  
var results=[];  
var items=json&&json.items?json.items:[];  
for(var i=0;i<items.length;i++){var c=mapCard(items[i]);if(c)results.push(c);}  
status.append('similar',{results:results});  
},status.error.bind(status),false,requestParams());  
}  
function apiClear(){network.clear();}  
var Api={main:apiMain,collection:apiCollection,full:apiFull,clear:apiClear};  
function MainComponent(object){  
var comp=new Lampa.InteractionMain(object);  
comp.create=function(){  
comp.activity.loader(true);  
Api.main(object,function(data){comp.build(data);},comp.empty.bind(comp));  
return comp.render();  
};  
comp.onMore=function(data){  
Lampa.Activity.push({url:data.type,title:data.title,component:'kinopoisk_category',page:1});  
};  
return comp;  
}  
function CategoryComponent(object){  
var comp=new Lampa.InteractionCategory(object);  
comp.create=function(){  
Api.collection(object,comp.build.bind(comp),comp.empty.bind(comp));  
};  
comp.nextPageReuest=function(obj,resolve,reject){  
Api.collection(obj,resolve.bind(comp),reject.bind(comp));  
};  
comp.cardRender=function(obj,element,card){  
card.onEnter=function(){  
Lampa.Activity.push({url:element.id,title:element.title,component:'full',source:'kp',id:element.id,kinopoisk_id:element.kinopoisk_id});  
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
var manifest={type:'video',version:'1.0.0',name:'Кинопоиск',description:'Топы и коллекции Кинопоиска',component:'kinopoisk_main'};  
Lampa.Manifest.plugins=manifest;  
Lampa.Api.sources.kp=Api;  
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
