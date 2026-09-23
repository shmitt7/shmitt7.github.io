(function(){  
    if(window.lineKpCub) return;  
    window.lineKpCub = true;  
    var KP_API_URL = 'https://kinopoiskapiunofficial.tech';  
    var KP_API_KEY = '14342b35-714b-449d-bf10-30d0d9ac22e6';  
    var CACHE_NAME = 'kp_tmdb_resolve_cache';  
    var CACHE_MAX = 800;  
    var network = new Lampa.Reguest();  
    var KP_LINE_TYPE = 'TOP_POPULAR_ALL';  
    var KP_LINE_TITLE = 'Сейчас смотрят Кинопоиск';  
    var CUB_LINE_TITLE = 'Сейчас смотрят CUB';  
    var kpHeader = function(){  
        return {headers: {'X-API-KEY': KP_API_KEY}, cache: {life: 180}, timeout: 15000};  
    };  
    var loadKpCollection = function(type, page, oncomplite, onerror){  
        var url = KP_API_URL + '/api/v2.2/films/collections?type=' + type + '&page=' + (page || 1);  
        network.silent(url, function(json){  
            var items = json && json.items ? json.items : [];  
            oncomplite({  
                items: items,  
                page: page || 1,  
                total_pages: json && json.totalPages ? json.totalPages : 1,  
                total_results: json && json.total ? json.total : items.length  
            });  
        }, onerror, false, kpHeader());  
    };  
    var kpMethod = function(item){  
        return (!item.type || item.type === 'FILM') ? 'movie' : 'tv';  
    };  
    var mapKpCard = function(item){  
        var method = kpMethod(item);  
        var kpId = item.kinopoiskId || item.filmId;  
        var card = {  
            source: 'kp',  
            kp_source: true,  
            id: 'kp_' + kpId,  
            kinopoisk_id: kpId,  
            method: method,  
            title: item.nameRu || item.nameOriginal || item.nameEn || '',  
            original_title: item.nameOriginal || item.nameEn || '',  
            overview: item.description || '',  
            img: item.posterUrlPreview || item.posterUrl || '',  
            poster: item.posterUrlPreview || item.posterUrl || '',  
            vote_average: parseFloat(item.ratingKinopoisk || item.ratingImdb) || 0,  
            kp_rating: parseFloat(item.ratingKinopoisk) || 0,  
            kp_year: item.year || 0,  
            kp_query_original: item.nameOriginal || '',  
            kp_query_fallback: item.nameRu || item.nameEn || ''  
        };  
        if(method === 'tv'){  
            card.name = card.title;  
            card.original_name = card.original_title;  
            card.first_air_date = item.year ? item.year + '-01-01' : '';  
        } else {  
            card.release_date = item.year ? item.year + '-01-01' : '';  
        }  
        return card;  
    };  
    var getResolveCache = function(){  
        return Lampa.Storage.cache(CACHE_NAME, CACHE_MAX, {});  
    };  
    var setResolveCache = function(key, value){  
        var cache = getResolveCache();  
        cache[key] = value;  
        Lampa.Storage.set(CACHE_NAME, cache);  
    };  
    var pickBestResult = function(results, year){  
        if(!results || !results.length) return null;  
        if(year){  
            for(var i = 0; i < results.length; i++){  
                var date = results[i].release_date || results[i].first_air_date || '';  
                var y = parseInt((date + '').slice(0, 4));  
                if(y && Math.abs(y - year) <= 1) return results[i];  
            }  
        }  
        return results[0];  
    };  
    var tmdbSearch = function(method, query, cb, errcb){  
        if(!query){ cb([]); return; }  
        var url = Lampa.TMDB.api('search/' + method + '?query=' + encodeURIComponent(query) + '&api_key=' + Lampa.TMDB.key() + '&language=' + Lampa.Storage.field('tmdb_lang'));  
        network.silent(url, function(json){  
            cb(json && json.results ? json.results : []);  
        }, errcb, false, {cache: {life: 1440}, timeout: 8000});  
    };  
    var resolveTmdbByCard = function(card, cb){  
        var cacheKey = card.method + '_' + card.kinopoisk_id;  
        var cached = getResolveCache();  
        if(cached[cacheKey] !== undefined){ cb(cached[cacheKey]); return; }  
        var queryOriginal = card.kp_query_original;  
        var queryFallback = card.kp_query_fallback;  
        var year = card.kp_year;  
        var finish = function(result){  
            setResolveCache(cacheKey, result);  
            cb(result);  
        };  
        tmdbSearch(card.method, queryOriginal, function(results){  
            var best = pickBestResult(results, year);  
            if(best){  
                best.method = card.method;  
                Lampa.Utils.addSource(best, 'tmdb');  
                finish(best);  
                return;  
            }  
            tmdbSearch(card.method, queryFallback, function(results2){  
                var best2 = pickBestResult(results2, year);  
                if(best2){  
                    best2.method = card.method;  
                    Lampa.Utils.addSource(best2, 'tmdb');  
                    finish(best2);  
                    return;  
                }  
                finish(null);  
            }, function(){ finish(null); });  
        }, function(){ finish(null); });  
    };  
    var resolveTmdbByList = function(cards, cb){  
        if(!cards.length){ cb([]); return; }  
        var status = new Lampa.Status(cards.length);  
        var resolved = new Array(cards.length);  
        status.onComplite = function(){  
            var results = [];  
            for(var i = 0; i < resolved.length; i++) if(resolved[i]) results.push(resolved[i]);  
            cb(results);  
        };  
        cards.forEach(function(card, idx){  
            resolveTmdbByCard(card, function(tmdbCard){  
                resolved[idx] = tmdbCard;  
                status.append('i' + idx, true);  
            });  
        });  
    };  
    var loadKpMapped = function(type, page, oncomplite, onerror){  
        loadKpCollection(type, page, function(data){  
            oncomplite({  
                results: data.items.map(mapKpCard),  
                page: data.page,  
                total_pages: data.total_pages,  
                total_results: data.total_results  
            });  
        }, onerror);  
    };  
    var loadCollectionResolved = function(type, page, oncomplite, onerror){  
        loadKpMapped(type, page, function(data){  
            resolveTmdbByList(data.results, function(resolved){  
                oncomplite({  
                    results: resolved,  
                    page: data.page,  
                    total_pages: data.total_pages,  
                    total_results: resolved.length  
                });  
            });  
        }, onerror);  
    };  
    var KpCategoryComponent = function(object){  
        var comp = Lampa.Maker.make('Category', object);  
        comp.use({  
            onCreate: function(){  
                loadCollectionResolved(object.url, object.page || 1, this.build.bind(this), this.empty.bind(this));  
            },  
            onNext: function(resolve, reject){  
                loadCollectionResolved(object.url, object.page || 1, resolve, reject);  
            },  
            onInstance: function(card, data){  
                card.use({  
                    onEnter: function(){ Lampa.Router.call('full', data); },  
                    onFocus: function(){ Lampa.Background.change(Lampa.Utils.cardImgBackground(data)); }  
                });  
            }  
        });  
        return comp;  
    };  
    var loadCubNowWatching = function(page, oncomplite, onerror){  
        var email = Lampa.Storage.get('account', '{}').email || '';  
        var url = Lampa.Utils.protocol() + 'tmdb.' + Lampa.Manifest.cub_domain + '/?sort=now_playing';  
        if(page && page > 1) url += '&page=' + page;  
        url = Lampa.Utils.addUrlComponent(url, 'email=' + encodeURIComponent(email));  
        network.silent(url, function(json){  
            var data = Lampa.Utils.addSource(json || {}, 'cub');  
            var results = data.results || [];  
            oncomplite({  
                results: results,  
                page: page || 1,  
                total_pages: json && json.total_pages ? json.total_pages : (results.length ? (page || 1) + 1 : (page || 1))  
            });  
        }, onerror, false, {cache: {life: 180}});  
    };  
    var CubCategoryComponent = function(object){  
        var comp = Lampa.Maker.make('Category', object);  
        comp.use({  
            onCreate: function(){  
                loadCubNowWatching(object.page || 1, this.build.bind(this), this.empty.bind(this));  
            },  
            onNext: function(resolve, reject){  
                loadCubNowWatching(object.page || 1, resolve, reject);  
            },  
            onInstance: function(card, data){  
                card.use({  
                    onEnter: function(){ Lampa.Router.call('full', data); },  
                    onFocus: function(){ Lampa.Background.change(Lampa.Utils.cardImgBackground(data)); }  
                });  
            }  
        });  
        return comp;  
    };  
    var buildKpLine = function(cb){  
        loadCollectionResolved(KP_LINE_TYPE, 1, function(data){  
            if(!data.results.length){ cb(null); return; }  
            cb({  
                title: KP_LINE_TITLE,  
                url: KP_LINE_TYPE,  
                results: data.results,  
                total_pages: 2,  
                params: {emit: {onlyMore: function(){  
                    Lampa.Activity.push({url: KP_LINE_TYPE, title: KP_LINE_TITLE, component: 'kinopoisk_category', page: 1});  
                }}}  
            });  
        }, function(){ cb(null); });  
    };  
    var buildCubLine = function(cb){  
        loadCubNowWatching(1, function(data){  
            if(!data.results.length){ cb(null); return; }  
            cb({  
                title: CUB_LINE_TITLE,  
                url: 'cub_now_watching',  
                results: data.results,  
                total_pages: 2,  
                params: {emit: {onlyMore: function(){  
                    Lampa.Activity.push({url: 'cub_now_watching', title: CUB_LINE_TITLE, component: 'cub_now_watching_category', page: 1});  
                }}}  
            });  
        }, function(){ cb(null); });  
    };  
    var patchMain = function(){  
        var original_main = Lampa.Api.main;  
        Lampa.Api.main = function(params, oncomplite, onerror){  
            return original_main(params, function(results){  
                var now_watch_title = Lampa.Lang.translate('title_now_watch');  
                var trend_week_title = Lampa.Lang.translate('title_trend_week');  
                var trend_day_title = Lampa.Lang.translate('title_trend_day');  
                var filtered = (results || []).filter(function(line){  
                    return line.title !== now_watch_title && line.title !== trend_week_title;  
                });  
                var insertAt = filtered.findIndex(function(line){ return line.title === trend_day_title; });  
                insertAt = insertAt === -1 ? 0 : insertAt + 1;  
                buildKpLine(function(kpLine){  
                    buildCubLine(function(cubLine){  
                        var toInsert = [];  
                        if(kpLine) toInsert.push(kpLine);  
                        if(cubLine) toInsert.push(cubLine);  
                        filtered.splice.apply(filtered, [insertAt, 0].concat(toInsert));  
                        oncomplite(filtered);  
                    });  
                });  
            }, onerror);  
        };  
    };  
    var initPlugin = function(){  
        var manifest = {type: 'video', version: '5.4.0', name: 'Кинопоиск', description: 'Линии Кинопоиска и CUB вместо трендов недели и кинотеатров'};  
        Lampa.Manifest.plugins = manifest;  
        Lampa.Component.add('kinopoisk_category', KpCategoryComponent);  
        Lampa.Component.add('cub_now_watching_category', CubCategoryComponent);  
        patchMain();  
    };  
    if(window.appready) initPlugin();  
    else Lampa.Listener.follow('app', function(e){ if(e.type === 'ready') initPlugin(); });  
})();
