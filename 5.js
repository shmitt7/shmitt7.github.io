(function(){  
  var API_URL='https://kinopoiskapiunofficial.tech';  
  var API_KEY='14342b35-714b-449d-bf10-30d0d9ac22e6';  
  var CACHE_NAME='kp_tmdb_resolve_cache';  
  var CACHE_MAX=800;  
  var RESOLVE_MODE='lazy_tmdb';  
  var network=new Lampa.Reguest();  
  var lines=[{type:'TOP_POPULAR_ALL',title:'Популярное'}];  
  
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
    if(!query){cb([]);return;}  
    var url=Lampa.TMDB.api('search/'+method+'?query='+encodeURIComponent(query)+'&api_key='+Lampa.TMDB.key()+'&language='+Lampa.Storage.field('tmdb_lang'));  
    network.silent(url,function(json){  
      cb(json&&json.results?json.results:[]);  
    },errcb,false,{cache:{life:1440},timeout:8000});  
  }  
  
  // Ключевая точка: если карточка уже "kp", в момент клика мы ОБЯЗАТЕЛЬНО должны  
  // подменить source/id/method на tmdb ДО Activity.push, иначе получаем source:'kp'.  
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
  
  function loadCollection_kpOnly(type,page,oncomplite,onerror){  
    loadKpCollection(type,page,function(data){  
      var results=[];  
      for(var i=0;i<data.items.length;i++)results.push(mapKpCard(data.items[i]));  
      oncomplite({results:results,page:data.page,total_pages:data.total_pages,total_results:data.total_results});  
    },onerror);  
  }  
  
  function loadCollection_eagerTmdb(type,page,oncomplite,onerror){  
    loadKpCollection(type,page,function(data){  
      var kpCards=[];  
      for(var i=0;i<data.items.length;i++)kpCards.push(mapKpCard(data.items[i]));  
      if(!kpCards.length){  
        oncomplite({results:[],page:data.page,total_pages:data.total_pages,total_results:data.total_results});  
        return;  
      }  
      var status=new Lampa.Status(kpCards.length);  
      var resolved=new Array(kpCards.length);  
      kpCards.forEach(function(card,idx){  
        resolveTmdbByCard(card,function(tmdbCard){  
          resolved[idx]=tmdbCard;  
          status.append('i'+idx,true);  
        });  
      });  
      status.onComplite=function(){  
        var results=[];  
        for(var i=0;i<resolved.length;i++)if(resolved[i])results.push(resolved[i]);  
        oncomplite({results:results,page:data.page,total_pages:data.total_pages,total_results:data.total_results});  
      };  
    },onerror);  
  }  
  
  function loadCollection_lazyTmdb(type,page,oncomplite,onerror){  
    loadCollection_kpOnly(type,page,oncomplite,onerror);  
  }  
  
  function loadCollectionResolved(type,page,oncomplite,onerror){  
    if(RESOLVE_MODE==='eager_tmdb')loadCollection_eagerTmdb(type,page,oncomplite,onerror);  
    else if(RESOLVE_MODE==='kp_only')loadCollection_kpOnly(type,page,oncomplite,onerror);  
    else loadCollection_lazyTmdb(type,page,oncomplite,onerror);  
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
      if(!fulldata.length){onerror();return;}  
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
  
  // Единая точка обработки клика — работает и для главной линии, и для категории.  
  function openCard(card){  
    Lampa.Loading.start(function(){});  
    resolveTmdbByCard(card,function(tmdbCard){  
      Lampa.Loading.stop();  
      if(tmdbCard){  
        Lampa.Activity.push({  
          url: tmdbCard.id,  
          title: tmdbCard.title||tmdbCard.name,  
          component: 'full',  
          source: 'tmdb',  
          method: tmdbCard.method,  
          id: tmdbCard.id,  
          card: tmdbCard  
        });  
      }  
      else{  
        Lampa.Noty.show('Не найдено соответствие в TMDB для этого тайтла');  
      }  
    });  
  }  
  
  // ---- Современный Maker API вместо устаревших InteractionMain/InteractionCategory ----  
  
  function MainComponent(object){  
    var comp=Lampa.Maker.make('Main',object);  
  
    comp.use({  
      onCreate: function(){  
        apiMain(object,(data)=>{  
          this.build(data);  
        },this.empty.bind(this));  
      },  
      onInstance: function(item, data){  
        item.use({  
          onMore: function(){  
            Lampa.Activity.push({url:data.url,title:data.title,component:'kinopoisk_category',page:1});  
          },  
          onInstance: function(card, cardData){  
            card.use({  
              onEnter: function(){  
                openCard(cardData);  
              },  
              onFocus: function(){  
                Lampa.Background.change(Lampa.Utils.cardImgBackground(cardData));  
              }  
            });  
          }  
        });  
      }  
    });  
  
    return comp;  
  }  
  
  function CategoryComponent(object){  
    var comp=Lampa.Maker.make('Category',object);  
  
    comp.use({  
      onCreate: function(){  
        apiCollection(object,this.build.bind(this),this.empty.bind(this));  
      },  
      onNext: function(resolve, reject){  
        apiCollection(object, resolve, reject);  
      },  
      onInstance: function(card, data){  
        card.use({  
          onEnter: function(){  
            openCard(data);  
          },  
          onFocus: function(){  
            Lampa.Background.change(Lampa.Utils.cardImgBackground(data));  
          }  
        });  
      }  
    });  
  
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
    var manifest={type:'video',version:'3.1.0',name:'Кинопоиск',description:'Популярное с Кинопоиска',component:'kinopoisk_main'};  
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
