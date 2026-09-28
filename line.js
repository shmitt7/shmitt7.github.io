(function(){  
    if(window.lineKpCub) return;  
    window.lineKpCub = true;  
    var KP_API_URL = 'https://kinopoiskapiunofficial.tech';  
    var KP_API_KEY = '14342b35-714b-449d-bf10-30d0d9ac22e6';  
    var network = new Lampa.Reguest();  
    var KP_LINE_TYPE = 'TOP_POPULAR_ALL';  
    var KP_LINE_TITLE = 'Сейчас смотрят Кинопоиск';  
    var CUB_LINE_TITLE = 'Сейчас смотрят CUB';  
    var KP_HEADER = {headers: {'X-API-KEY': KP_API_KEY}, cache: {life: 180}, timeout: 15000};  
    function loadKpCollection(type, page, oncomplite, onerror){  
        var url = KP_API_URL + '/api/v2.2/films/collections?type=' + type + '&page=' + (page || 1);  
        network.silent(url, function(json){  
            var items = json && json.items ? json.items : [];  
            oncomplite({  
                items: items,  
                page: page || 1,  
                total_pages: json && json.totalPages ? json.totalPages : 1,  
                total_results: json && json.total ? json.total : items.length  
            });  
        }, onerror, false, KP_HEADER);  
    }  
    function kpMethod(item){  
        return (!item.type || item.type === 'FILM') ? 'movie' : 'tv';  
    }  
    function mapKpCard(item){  
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
        }  
        else{  
            card.release_date = item.year ? item.year + '-01-01' : '';  
        }  
        return card;  
    }  
    function pickBestResult(results, year){  
        if(!results || !results.length) return null;  
        if(year){  
            for(var i = 0; i < results.length; i++){  
                var date = results[i].release_date || results[i].first_air_date || '';  
                var y = parseInt((date + '').slice(0, 4));  
                if(y && Math.abs(y - year) <= 1) return results[i];  
            }  
        }  
        return results[0];  
    }  
    function tmdbSearch(method, query, cb, errcb){  
        if(!query){ cb([]); return; }  
        var url = Lampa.TMDB.api('search/' + method + '?query=' + encodeURIComponent(query) + '&api_key=' + Lampa.TMDB.key() + '&language=' + Lampa.Storage.field('tmdb_lang'));  
        network.silent(url, function(json){  
            cb(json && json.results ? json.results : []);  
        }, errcb, false, {cache: {life: 1440}, timeout: 8000});  
    }  
    function resolveTmdbByCard(card, cb){  
        var queryOriginal = card.kp_query_original;  
        var queryFallback = card.kp_query_fallback;  
        var year = card.kp_year;  
        tmdbSearch(card.method, queryOriginal, function(results){  
            var best = pickBestResult(results, year);  
            if(best){  
                best.method = card.method;  
                Lampa.Utils.addSource(best, 'tmdb');  
                cb(best);  
                return;  
            }  
            tmdbSearch(card.method, queryFallback, function(results2){  
                var best2 = pickBestResult(results2, year);  
                if(best2){  
                    best2.method = card.method;  
                    Lampa.Utils.addSource(best2, 'tmdb');  
                    cb(best2);  
                    return;  
                }  
                cb(null);  
            }, function(){ cb(null); });  
        }, function(){ cb(null); });  
    }  
    function resolveTmdbByList(cards, cb){  
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
    }  
    function loadKpMapped(type, page, oncomplite, onerror){  
        loadKpCollection(type, page, function(data){  
            oncomplite({  
                results: data.items.map(mapKpCard),  
                page: data.page,  
                total_pages: data.total_pages,  
                total_results: data.total_results  
            });  
        }, onerror);  
    }  
    function loadCollectionResolved(type, page, oncomplite, onerror){  
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
    }  
    function KpCategoryComponent(object){  
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
    }  
    function loadCubNowWatching(page, oncomplite, onerror){  
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
    }  
    function CubCategoryComponent(object){  
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
    }  
    function buildKpLine(cb){  
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
    }  
    function buildCubLine(cb){  
        if(Lampa.Storage.field('source') === 'cub'){ cb(null); return; }  
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
    }  
    function patchMain(){  
        var original_main = Lampa.Api.main;  
        Lampa.Api.main = function(params, oncomplite, onerror){  
            return original_main(params, function(results){  
                var now_watch_title = Lampa.Lang.translate('title_now_watch');  
                var trend_week_title = Lampa.Lang.translate('title_trend_week');  
                var upcoming_title = Lampa.Lang.translate('title_upcoming_episodes');  
                results = results || [];  
                var filtered = results.filter(function(line){  
                    return line.title !== trend_week_title;  
                });  
                var anchorIndex = filtered.findIndex(function(line){ return line.title === upcoming_title; });  
                if(anchorIndex === -1) anchorIndex = filtered.findIndex(function(line){ return line.title === now_watch_title; });  
                var insertAt = anchorIndex === -1 ? 0 : anchorIndex + 1;  
                var status = new Lampa.Status(2);  
                var lines = {};  
                status.onComplite = function(){  
                    var toInsert = [];  
                    if(lines.kp) toInsert.push(lines.kp);  
                    if(lines.cub) toInsert.push(lines.cub);  
                    filtered.splice.apply(filtered, [insertAt, 0].concat(toInsert));  
                    oncomplite(filtered);  
                };  
                buildKpLine(function(line){ lines.kp = line; status.append('kp', true); });  
                buildCubLine(function(line){ lines.cub = line; status.append('cub', true); });  
            }, onerror);  
        };  
    }  
    function initPlugin(){  
        Lampa.Component.add('kinopoisk_category', KpCategoryComponent);  
        Lampa.Component.add('cub_now_watching_category', CubCategoryComponent);  
        patchMain();  
    }  
    if(window.appready) initPlugin();  
    else Lampa.Listener.follow('app', function(e){ if(e.type === 'ready') initPlugin(); });  
})();
