(function(){  
  var API_URL='https://kinopoiskapiunofficial.tech';  
  var API_KEY='14342b35-714b-449d-bf10-30d0d9ac22e6';  
  var CACHE_NAME='kp_tmdb_resolve_cache';  
  var CACHE_MAX=800;  
  var network=new Lampa.Reguest();  
  var LINE_TYPE='TOP_POPULAR_ALL';  
  var LINE_TITLE='Популярное (Кинопоиск)';  
  
  // core-строки, которые пользователь может включать/выключать в Настройки -> Каналы  
  var CORE_TOGGLE_ROWS=['continue_watch','recomend_watch','timetable_lately','timetable_recently'];  
  
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
      method:method,  
      title:item.nameRu||item.nameOriginal||item.nameEn||'',  
      original_title:item.nameOriginal||item.nameEn||'',  
      overview:item.description||'',  
      img:item.posterUrlPreview||item.posterUrl||'',  
      poster:item.posterUrlPreview||item.posterUrl||'',  
      vote_average:parseFloat(item.ratingKinopoisk||item.ratingImdb)||0,  
      kp_rating:parseFloat(item.ratingKinopoisk)||0,  
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
    if(!query){cb([]);return;}  
    var url=Lampa.TMDB.api('search/'+method+'?query='+encodeURIComponent(query)+'&api_key='+Lampa.TMDB.key()+'&language='+Lampa.Storage.field('tmdb_lang'));  
    network.silent(url,function(json){  
      cb(json&&json.results?json.results:[]);  
    },errcb,false,{cache:{life:1440},timeout:8000});  
  }  
  
  // Резолвит одну KP-карточку в TMDB-карточку (с кэшем).  
  function resolveTmdbByCard(card,cb){  
    if(!card.kp_source){cb(card);return;}  
  
    var cacheKey=card.method+'_'+card.kinopoisk_id;  
    var cached=getResolveCache();  
    if(cached[cacheKey]!==undefined){  
      cb(cached[cacheKey]);  
      return;  
    }  
    var queryOriginal=card.kp_query_original;  
    var queryFallback=card.kp_query_fallback;  
    var year=card.kp_year;  
    function finish(result){  
      setResolveCache(cacheKey,result);  
      cb(result);  
    }  
    function tryFallback(){  
      if(!queryFallback){finish(null);return;}  
      tmdbSearch(card.method,queryFallback,function(results){  
        var best=pickBestResult(results,year);  
        if(!best){finish(null);return;}  
        best.method=card.method;  
        finish(Lampa.Utils.addSource(best,'tmdb'));  
      },function(){finish(null);});  
    }  
    if(queryOriginal){  
      tmdbSearch(card.method,queryOriginal,function(results){  
        var best=pickBestResult(results,year);  
        if(best){  
          best.method=card.method;  
          finish(Lampa.Utils.addSource(best,'tmdb'));  
        }  
        else tryFallback();  
      },tryFallback);  
    }  
    else tryFallback();  
  }  
  
  // Резолвит СПИСОК KP-карточек в TMDB параллельно, отдаёт только успешно найденные.  
  function resolveTmdbByList(cards, cb){  
    if(!cards.length){ cb([]); return; }  
  
    var status=new Lampa.Status(cards.length);  
    var resolved=new Array(cards.length);  
  
    cards.forEach(function(card, idx){  
      resolveTmdbByCard(card, function(tmdbCard){  
        resolved[idx]=tmdbCard;  
        status.append('i'+idx, true);  
      });  
    });  
  
    status.onComplite=function(){  
      var results=[];  
      for(var i=0;i<resolved.length;i++) if(resolved[i]) results.push(resolved[i]);  
      cb(results);  
    };  
  }  
  
  function loadKpMapped(type,page,oncomplite,onerror){  
    loadKpCollection(type,page,function(data){  
      var results=[];  
      for(var i=0;i<data.items.length;i++)results.push(mapKpCard(data.items[i]));  
      oncomplite({results:results,page:data.page,total_pages:data.total_pages,total_results:data.total_results});  
    },onerror);  
  }  
  
  // ВАЖНО: отдаём наружу уже резолвленные в TMDB карточки.  
  // Это устраняет двойной Activity.push, потому что дефолтные хардкодные  
  // обработчики main.js/category/full.js (Router.call('full', data) / Router.call('category_full', data))  
  // получают карточки с корректным source:'tmdb' и работают правильно с первого раза.  
  function loadCollectionResolved(type,page,oncomplite,onerror){  
    loadKpMapped(type,page,function(data){  
      resolveTmdbByList(data.results,function(resolved){  
        oncomplite({  
          results:resolved,  
          page:data.page,  
          total_pages:data.total_pages,  
          total_results:resolved.length  
        });  
      });  
    },onerror);  
  }  
  
  // Категория "Ещё" — обычный core-компонент 'category_full' не подойдёт (он не знает про наш API),  
  // поэтому используем свой компонент, но карточки в нём уже полноценные TMDB-карточки,  
  // поэтому дефолтный onEnter отработает верно без дублирования.  
  function CategoryComponent(object){  
    var comp=Lampa.Maker.make('Category',object);  
  
    comp.use({  
      onCreate: function(){  
        loadCollectionResolved(object.url,object.page||1,this.build.bind(this),this.empty.bind(this));  
      },  
      onNext: function(resolve, reject){  
        loadCollectionResolved(object.url,object.page||1,resolve,reject);  
      },  
      onInstance: function(card, data){  
        card.use({  
          onEnter: function(){  
            Lampa.Activity.push({  
              url: data.id,  
              title: data.title||data.name,  
              component: 'full',  
              source: 'tmdb',  
              method: data.method,  
              id: data.id,  
              card: data  
            });  
          },  
          onFocus: function(){ Lampa.Background.change(Lampa.Utils.cardImgBackground(data)); }  
        });  
      }  
    });  
  
    return comp;  
  }  
  
  // Считает индекс строки так, чтобы она встала сразу после всех  
  // ВКЛЮЧЁННЫХ переключаемых строк (Настройки -> Каналы), и перед  
  // жёстко закодированной "Сегодня в тренде".  
  // now_playing всегда первая (индекс 0 в исходном массиве), поэтому +1.  
  function computeDynamicIndex(){  
    var enabled=0;  
    CORE_TOGGLE_ROWS.forEach(function(name){  
      var val=Lampa.Storage.get('content_rows_'+name,'true');  
      if(val===true||val==='true') enabled++;  
    });  
    return 1+enabled;  
  }  
  
  function initPlugin(){  
    var manifest={type:'video',version:'5.0.0',name:'Кинопоиск',description:'Линия Кинопоиска на главной'};  
    Lampa.Manifest.plugins=manifest;  
  
    Lampa.Component.add('kinopoisk_category', CategoryComponent);  
  
    var row={  
      name: 'kinopoisk_popular',  
      title: LINE_TITLE,  
      screen: ['main'],  
      call: function(params, screen){  
        return function(call){  
          loadCollectionResolved(LINE_TYPE,1,function(data){  
            if(!data.results.length){ call({results:[]}); return; }  
  
            call({  
              title: LINE_TITLE,  
              url: LINE_TYPE,  
              results: data.results,  
              total_pages: 2 // гарантирует появление кнопки "Ещё" в модуле More  
            });  
          },function(){ call({results:[]}); });  
        };  
      }  
    };  
  
    // index вычисляется динамически на каждый вызов content_rows.call(),  
    // а не фиксируется один раз - так строка всегда окажется сразу после  
    // включённых сейчас каналов, независимо от того, сколько их включено.  
    Object.defineProperty(row, 'index', { get: computeDynamicIndex });  
  
    Lampa.ContentRows.add(row);  
  }  
  
  if(!window.kinopoisk_plugin_installed){  
    window.kinopoisk_plugin_installed=true;  
    if(window.appready)initPlugin();  
    else Lampa.Listener.follow('app',function(e){if(e.type==='ready')initPlugin();});  
  }  
})();
