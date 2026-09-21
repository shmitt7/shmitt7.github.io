(function(){  
var API_URL='https://kinopoiskapiunofficial.tech';  
var API_KEY='14342b35-714b-449d-bf10-30d0d9ac22e6';  
var CACHE_NAME='kp_tmdb_resolve_cache';  
var CACHE_MAX=800;  
var DEBUG=true;  
var network=new Lampa.Reguest();  
var lines=[{type:'TOP_POPULAR_ALL',title:'Популярное'}];  
  
function log(){  
    if(!DEBUG) return;  
    var args=['[KP]'].concat([].slice.call(arguments));  
    console.log.apply(console,args);  
}  
  
function kpHeader(){  
    return {headers:{'X-API-KEY':API_KEY},cache:{life:180},timeout:15000};  
}  
  
function loadKpCollection(type,page,oncomplite,onerror){  
    var url=API_URL+'/api/v2.2/films/collections?type='+type+'&page='+(page||1);  
    log('kp request',url);  
    network.silent(url,function(json){  
        var items=json&&json.items?json.items:[];  
        log('kp response items',items.length,'total',json&&json.total);  
        oncomplite({items:items,page:page||1,total_pages:json&&json.totalPages?json.totalPages:1,total_results:json&&json.total?json.total:items.length});  
    },function(a,c){  
        log('kp error',a,c);  
        onerror(a,c);  
    },false,kpHeader());  
}  
  
function kpMethod(item){  
    return (!item.type||item.type==='FILM')?'movie':'tv';  
}  
  
function mapKpCard(item){  
    var method=kpMethod(item);  
    var kpId=item.kinopoiskId||item.filmId;  
    var card={  
        source:'kp',  
        kp_source:true,  
        id:'kp_'+kpId,  
        kinopoisk_id:kpId,  
        imdb_id:item.imdbId||'',  
        method:method,  
        title:item.nameRu||item.nameOriginal||item.nameEn||'',  
        original_title:item.nameOriginal||item.nameEn||'',  
        overview:item.description||'',  
        img:item.posterUrlPreview||item.posterUrl||'',  
        poster:item.posterUrlPreview||item.posterUrl||'',  
        background_image:item.coverUrl||item.posterUrl||'',  
        vote_average:parseFloat(item.ratingKinopoisk||item.ratingImdb)||0,  
        kp_rating:parseFloat(item.ratingKinopoisk)||0,  
        imdb_rating:parseFloat(item.ratingImdb)||0,  
        kp_year:item.year||0,  
        kp_query_original:item.nameOriginal||'',  
        kp_query_fallback:item.nameRu||item.nameEn||''  
    };  
    if(method==='tv'){  
        card.name=card.title;  
        card.original_name=card.original_title;  
        card.first_air_date=item.year?item.year+'-01-01':'';  
    }  
    else{  
        card.release_date=item.year?item.year+'-01-01':'';  
    }  
    return card;  
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
  
function tmdbSearch(method,query,cb,errcb){  
    if(!query){  
        cb([]);  
        return;  
    }  
    var url=Lampa.TMDB.api('search/'+method+'?query='+encodeURIComponent(query)+'&api_key='+Lampa.TMDB.key()+'&language='+Lampa.Storage.field('tmdb_lang'));  
    log('tmdb search request',url);  
    network.silent(url,function(json){  
        var results=json&&json.results?json.results:[];  
        log('tmdb search results for',query,'->',results.length);  
        cb(results);  
    },function(a,c){  
        log('tmdb search error',a,c);  
        errcb&&errcb(a,c);  
    },false,{cache:{life:1440},timeout:8000});  
}  
  
function resolveTmdbCard(kpCard,cb){  
    var cacheKey=kpCard.method+'_'+kpCard.kinopoisk_id;  
    var cache=getResolveCache();  
    if(cache[cacheKey]!==undefined){  
        log('resolve cache hit',cacheKey,cache[cacheKey]);  
        cb(cache[cacheKey]);  
        return;  
    }  
    function finish(result){  
        setResolveCache(cacheKey,result);  
        cb(result);  
    }  
    function tryFallback(){  
        if(!kpCard.kp_query_fallback){  
            log('resolve no fallback query for',kpCard.title);  
            finish(null);  
            return;  
        }  
        tmdbSearch(kpCard.method,kpCard.kp_query_fallback,function(results){  
            var best=pickBestResult(results,kpCard.kp_year);  
            if(!best){  
                log('resolve fallback no match for',kpCard.title);  
                finish(null);  
                return;  
            }  
            best.method=kpCard.method;  
            finish(Lampa.Utils.addSource(best,'tmdb'));  
        });  
    }  
    if(kpCard.kp_query_original){  
        tmdbSearch(kpCard.method,kpCard.kp_query_original,function(results){  
            var best=pickBestResult(results,kpCard.kp_year);  
            if(best){  
                best.method=kpCard.method;  
                finish(Lampa.Utils.addSource(best,'tmdb'));  
            }  
            else tryFallback();  
        });  
    }  
    else tryFallback();  
}  
  
function openCard(kpCard){  
    log('open card clicked',kpCard.title,kpCard.id);  
    if(!kpCard.kp_source){  
        Lampa.Activity.push({url:kpCard.id,title:kpCard.title||kpCard.name,component:'full',source:'tmdb',method:kpCard.method,id:kpCard.id});  
        return;  
    }  
    Lampa.Loading.start(function(){  
        log('resolve aborted by user');  
    });  
    resolveTmdbCard(kpCard,function(tmdbCard){  
        Lampa.Loading.stop();  
        if(!tmdbCard){  
            log('resolve failed, showing noty');  
            Lampa.Noty.show('Не удалось найти этот тайтл в TMDB');  
            return;  
        }  
        log('resolve success, opening full',tmdbCard.id);  
        Lampa.Activity.push({  
            url:tmdbCard.id,  
            title:tmdbCard.title||tmdbCard.name,  
            component:'full',  
            source:'tmdb',  
            method:tmdbCard.method,  
            id:tmdbCard.id  
        });  
    });  
}  
  
function apiMain(params,oncomplite,onerror){  
    var fulldata=[];  
    var need=lines.length;  
    var done=0;  
    function checkDone(){  
        done++;  
        if(done>=need){  
            log('main build done, lines with data:',fulldata.length);  
            oncomplite({results:fulldata,page:1,total_pages:1});  
        }  
    }  
    lines.forEach(function(line){  
        loadKpCollection(line.type,1,function(data){  
            var cards=[];  
            for(var i=0;i<data.items.length;i++){  
                cards.push(mapKpCard(data.items[i]));  
            }  
            if(!cards.length){  
                log('line empty, skipping',line.title);  
                checkDone();  
                return;  
            }  
            fulldata.push({  
                title:line.title,  
                results:cards,  
                url:line.type,  
                total_pages:data.total_pages,  
                page:1,  
                card_events:{  
                    onEnter:function(target,card_data){  
                        log('line onEnter fired for',card_data.title);  
                        openCard(card_data);  
                    }  
                }  
            });  
            checkDone();  
        },function(){  
            log('line load error',line.title);  
            checkDone();  
        });  
    });  
}  
  
function apiCollection(object,oncomplite,onerror){  
    var line=null;  
    for(var i=0;i<lines.length;i++){  
        if(lines[i].type===object.url){line=lines[i];break;}  
    }  
    if(!line){  
        log('collection: unknown line for url',object.url);  
        onerror();  
        return;  
    }  
    loadKpCollection(line.type,object.page||1,function(data){  
        var cards=[];  
        for(var i=0;i<data.items.length;i++){  
            cards.push(mapKpCard(data.items[i]));  
        }  
        log('collection page',object.page,'cards',cards.length);  
        oncomplite({  
            results:cards,  
            page:object.page||1,  
            total_pages:data.total_pages,  
            total_results:data.total_results  
        });  
    },onerror);  
}  
  
function MainComponent(object){  
    var comp=new Lampa.InteractionMain(object);  
    comp.create=function(){  
        comp.activity.loader(true);  
        apiMain(object,function(data){  
            log('main comp.build called with',data.results.length,'lines');  
            comp.build(data);  
        },comp.empty.bind(comp));  
        return comp.render();  
    };  
    comp.onMore=function(data){  
        log('onMore clicked for line',data.url);  
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
            log('category card clicked',element.title);  
            openCard(element);  
        };  
    };  
    return comp;  
}  
  
function addMenuButton(manifest){  
    var button=$('<li class="menu__item selector"><div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle><text x="12" y="16" font-size="9" text-anchor="middle" fill="currentColor">KP</text></svg></div><div class="menu__text">'+manifest.name+'</div></li>');  
    button.on('hover:enter',function(){  
        log('menu button clicked');  
        Lampa.Activity.push({url:'',title:manifest.name,component:'kinopoisk_main',page:1});  
    });  
    $('.menu .menu__list').eq(0).append(button);  
}  
  
function initPlugin(){  
    var manifest={type:'video',version:'3.1.0',name:'Кинопоиск',description:'Популярное с Кинопоиска',component:'kinopoisk_main'};  
    Lampa.Manifest.plugins=manifest;  
    Lampa.Component.add('kinopoisk_main',MainComponent);  
    Lampa.Component.add('kinopoisk_category',CategoryComponent);  
    addMenuButton(manifest);  
    log('plugin initialized');  
}  
  
if(!window.kinopoisk_plugin_installed){  
    window.kinopoisk_plugin_installed=true;  
    if(window.appready)initPlugin();  
    else Lampa.Listener.follow('app',function(e){if(e.type==='ready')initPlugin();});  
}  
})();
