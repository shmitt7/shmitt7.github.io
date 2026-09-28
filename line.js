(function(){  
    if(window.lineKpCub) return;  
    window.lineKpCub = true;  
    var KP_API_URL = 'https://kinopoiskapiunofficial.tech';  
    var KP_API_KEY = '14342b35-714b-449d-bf10-30d0d9ac22e6';  
    var KP_LINE_TYPE = 'TOP_POPULAR_ALL';  
    var KP_LINE_TITLE = 'Сейчас смотрят Кинопоиск';  
    var CUB_LINE_TITLE = 'Сейчас смотрят CUB';  
    var MENU_TITLE = 'Популярное';  
    var CACHE_LIFE = 1000 * 60 * 30;  
    var network = new Lampa.Reguest();  
    var KP_HEADER = {headers: {'X-API-KEY': KP_API_KEY}, cache: {life: 180}, timeout: 15000};  
    function getCache(key){  
        var stored = Lampa.Storage.get(key, '{}');  
        if(stored && stored.time && Date.now() - stored.time < CACHE_LIFE && stored.data) return stored.data;  
        return null;  
    }  
    function setCache(key, data){  
        Lampa.Storage.set(key, {time: Date.now(), data: data});  
    }  
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
        else card.release_date = item.year ? item.year + '-01-01' : '';  
        return card;  
    }  
    function pickBestResult(results, year){  
        if(!results || !results.length) return null;  
        if(year){  
            for(var i = 0; i < results.length; i++){  
                var date = results[i].release_date || results[i].first_air_date || '';  
                var resultYear = parseInt((date + '').slice(0, 4));  
                if(resultYear && Math.abs(resultYear - year) <= 1) return results[i];  
            }  
        }  
        return results[0];  
    }  
    function tmdbSearch(method, query, oncomplite, onerror){  
        if(!query){  
            oncomplite([]);  
            return;  
        }  
        var url = Lampa.TMDB.api('search/' + method + '?query=' + encodeURIComponent(query) + '&api_key=' + Lampa.TMDB.key() + '&language=' + Lampa.Storage.field('tmdb_lang'));  
        network.silent(url, function(json){  
            oncomplite(json && json.results ? json.results : []);  
        }, onerror, false, {cache: {life: 1440}, timeout: 8000});  
    }  
    function resolveTmdbByCard(card, oncomplite){  
        tmdbSearch(card.method, card.kp_query_original, function(results){  
            var best = pickBestResult(results, card.kp_year);  
            if(best){  
                best.method = card.method;  
                Lampa.Utils.addSource(best, 'tmdb');  
                oncomplite(best);  
                return;  
            }  
            tmdbSearch(card.method, card.kp_query_fallback, function(fallbackResults){  
                var fallbackBest = pickBestResult(fallbackResults, card.kp_year);  
                if(fallbackBest){  
                    fallbackBest.method = card.method;  
                    Lampa.Utils.addSource(fallbackBest, 'tmdb');  
                    oncomplite(fallbackBest);  
                    return;  
                }  
                oncomplite(null);  
            }, function(){ oncomplite(null); });  
        }, function(){ oncomplite(null); });  
    }  
    function resolveTmdbByList(cards, oncomplite){  
        if(!cards.length){  
            oncomplite([]);  
            return;  
        }  
        var status = new Lampa.Status(cards.length);  
        var resolved = new Array(cards.length);  
        status.onComplite = function(){  
            var results = [];  
            for(var i = 0; i < resolved.length; i++) if(resolved[i]) results.push(resolved[i]);  
            oncomplite(results);  
        };  
        cards.forEach(function(card, index){  
            resolveTmdbByCard(card, function(tmdbCard){  
                resolved[index] = tmdbCard;  
                status.append('i' + index, true);  
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
    function loadCubNowWatching(page, oncomplite, onerror){  
        var account = Lampa.Storage.get('account', '{}');  
        var email = account && account.email ? account.email : '';  
        var url = Lampa.Utils.protocol() + 'tmdb.' + Lampa.Manifest.cub_domain + '/?sort=now_playing';  
        if(page && page > 1) url += '&page=' + page;  
        url = Lampa.Utils.addUrlComponent(url, 'email=' + encodeURIComponent(email));  
        network.silent(url, function(json){  
            var data = Lampa.Utils.addSource(json || {}, 'cub');  
            oncomplite(data.results || []);  
        }, onerror, false, {cache: {life: 180}, timeout: 15000});  
    }  
    function lineParams(url, title, component){  
        return {emit: {onlyMore: function(){  
            Lampa.Activity.push({url: url, title: title, component: component, page: 1});  
        }}};  
    }  
    function kpLine(results){  
        return {  
            title: KP_LINE_TITLE,  
            results: results,  
            page: 1,  
            total_pages: 2,  
            url: KP_LINE_TYPE,  
            component: 'kinopoisk_category',  
            params: lineParams(KP_LINE_TYPE, KP_LINE_TITLE, 'kinopoisk_category')  
        };  
    }  
    function cubLine(results){  
        return {  
            title: CUB_LINE_TITLE,  
            results: results,  
            page: 1,  
            total_pages: 2,  
            url: 'cub_now_watching',  
            component: 'cub_now_watching_category',  
            params: lineParams('cub_now_watching', CUB_LINE_TITLE, 'cub_now_watching_category')  
        };  
    }  
    function KpCategoryComponent(object){  
        var comp = Lampa.Maker.make('Category', object);  
        comp.use({  
            onCreate: function(){  
                loadCollectionResolved(object.url, object.page || 1, this.build.bind(this), this.empty.bind(this));  
            },  
            onNext: function(resolve, reject){  
                loadCollectionResolved(object.url, object.page, resolve, reject);  
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
    function CubCategoryComponent(object){  
        var comp = Lampa.Maker.make('Category', object);  
        comp.use({  
            onCreate: function(){  
                loadCubNowWatching(object.page || 1, this.build.bind(this), this.empty.bind(this));  
            },  
            onNext: function(resolve, reject){  
                loadCubNowWatching(object.page, resolve, reject);  
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
    function NowWatchingComponent(object){  
        var comp = Lampa.Maker.make('Main', object);  
        comp.use({  
            onCreate: function(){  
                var self = this;  
                var lines = [];  
                var status = new Lampa.Status(2);  
                status.onComplite = function(){  
                    if(lines.length) self.build(lines);  
                    else self.empty();  
                };  
                var kpCached = getCache('kp_line_cache');  
                if(kpCached && kpCached.length){  
                    lines.push(kpLine(kpCached));  
                    status.append('kp', true);  
                }  
                else {  
                    loadCollectionResolved(KP_LINE_TYPE, 1, function(data){  
                        if(data.results.length){  
                            setCache('kp_line_cache', data.results);  
                            lines.push(kpLine(data.results));  
                        }  
                        status.append('kp', true);  
                    }, function(){ status.append('kp', true); });  
                }  
                if(Lampa.Storage.field('source') === 'cub'){  
                    status.append('cub', true);  
                }  
                else {  
                    var cubCached = getCache('cub_line_cache');  
                    if(cubCached && cubCached.length){  
                        lines.push(cubLine(cubCached));  
                        status.append('cub', true);  
                    }  
                    else {  
                        loadCubNowWatching(1, function(data){  
                            if(data.results.length){  
                                setCache('cub_line_cache', data.results);  
                                lines.push(cubLine(data.results));  
                            }  
                            status.append('cub', true);  
                        }, function(){ status.append('cub', true); });  
                    }  
                }  
            },  
            onInstance: function(item, data){  
                item.use({  
                    onMore: function(){  
                        var lineData = data || {};  
                        var url = lineData.url || '';  
                        var component = lineData.component || 'kinopoisk_category';  
                        var title = lineData.title || MENU_TITLE;  
                        Lampa.Activity.push({url: url, title: title, component: component, page: 1});  
                    },  
                    onInstance: function(card, cardData){  
                        card.use({  
                            onEnter: function(){ Lampa.Router.call('full', cardData); },  
                            onFocus: function(){ Lampa.Background.change(Lampa.Utils.cardImgBackground(cardData)); }  
                        });  
                    }  
                });  
            }  
        });  
        return comp;  
    }  
    Lampa.Component.add('kinopoisk_category', KpCategoryComponent);  
    Lampa.Component.add('cub_now_watching_category', CubCategoryComponent);  
    Lampa.Component.add('now_watching_main', NowWatchingComponent);  
    function addMenuItem(){  
        if($('.menu .menu__list .menu__item[data-line_kp_cub]').length) return;  
        var button = $('<li class="menu__item selector" data-line_kp_cub="1"><div class="menu__ico"><svg><use xlink:href="#sprite-fire"></use></svg></div><div class="menu__text">' + MENU_TITLE + '</div></li>');  
        button.on('hover:enter', function(){  
            Lampa.Activity.push({  
                url: '',  
                title: MENU_TITLE,  
                component: 'now_watching_main',  
                page: 1  
            });  
        });  
        $('.menu .menu__list').eq(0).append(button);  
    }  
    if(window.appready) addMenuItem();  
    else Lampa.Listener.follow('app', function(event){  
        if(event.type === 'ready') addMenuItem();  
    });  
})();
