(function(){  
    if(window.lineKpCub) return;  
    window.lineKpCub = true;  
    var KP_API_URL = 'https://kinopoiskapiunofficial.tech';  
    var KP_API_KEY = '14342b35-714b-449d-bf10-30d0d9ac22e6';  
    var KP_LINE_TYPE = 'TOP_POPULAR_ALL';  
    var KP_LINE_TITLE = 'Сейчас смотрят Кинопоиск';  
    var CUB_LINE_TITLE = 'Сейчас смотрят CUB';  
    var CACHE_LIFE = 1000 * 60 * 30;  
    var network = new Lampa.Reguest();  
    var KP_HEADER = {headers: {'X-API-KEY': KP_API_KEY}, cache: {life: 180}, timeout: 15000};  
    var mainHandled = false;  
    var scrollHandler = null;  
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
            var results = data.results || [];  
            oncomplite({  
                results: results,  
                page: page || 1,  
                total_pages: json && json.total_pages ? json.total_pages : (results.length ? (page || 1) + 1 : (page || 1))  
            });  
        }, onerror, false, {cache: {life: 180}, timeout: 15000});  
    }  
    function lineParams(url, title, component){  
        return {emit: {onlyMore: function(){  
            Lampa.Activity.push({url: url, title: title, component: component, page: 1});  
        }}};  
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
    Lampa.Component.add('kinopoisk_category', KpCategoryComponent);  
    Lampa.Component.add('cub_now_watching_category', CubCategoryComponent);  
    function kpLine(results){  
        return {  
            title: KP_LINE_TITLE,  
            results: results,  
            params: lineParams(KP_LINE_TYPE, KP_LINE_TITLE, 'kinopoisk_category')  
        };  
    }  
    function cubLine(results){  
        return {  
            title: CUB_LINE_TITLE,  
            results: results,  
            params: lineParams('cub_now_watching', CUB_LINE_TITLE, 'cub_now_watching_category')  
        };  
    }  
    Lampa.ContentRows.add({  
        name: 'kp_now_watching',  
        title: KP_LINE_TITLE,  
        index: 3,  
        screen: ['main'],  
        call: function(){  
            var cached = getCache('kp_line_cache');  
            return function(call){  
                if(cached && cached.length){  
                    call(kpLine(cached));  
                    return;  
                }  
                loadCollectionResolved(KP_LINE_TYPE, 1, function(data){  
                    if(!data.results.length){  
                        call();  
                        return;  
                    }  
                    setCache('kp_line_cache', data.results);  
                    var line = kpLine(data.results);  
                    line.total_pages = 2;  
                    call(line);  
                }, function(){ call(); });  
            };  
        }  
    });  
    Lampa.ContentRows.add({  
        name: 'cub_now_watching',  
        title: CUB_LINE_TITLE,  
        index: 4,  
        screen: ['main'],  
        call: function(){  
            if(Lampa.Storage.field('source') === 'cub') return;  
            var cached = getCache('cub_line_cache');  
            return function(call){  
                if(cached && cached.length){  
                    call(cubLine(cached));  
                    return;  
                }  
                loadCubNowWatching(1, function(data){  
                    if(!data.results.length){  
                        call();  
                        return;  
                    }  
                    setCache('cub_line_cache', data.results);  
                    var line = cubLine(data.results);  
                    line.total_pages = 2;  
                    call(line);  
                }, function(){ call(); });  
            };  
        }  
    });  
    function getMainInstance(){  
        var activity = Lampa.Activity.active();  
        if(!activity || activity.component !== 'main') return null;  
        var instance = typeof activity.activity === 'function' ? activity.activity() : activity.activity;  
        if(!instance) return null;  
        return instance;  
    }  
    function mainAlreadyRendered(instance){  
        var rendered = instance && instance.render ? instance.render() : null;  
        if(!rendered) return false;  
        if(rendered.find) return rendered.find('.items-line, .items__line').length > 0;  
        if(rendered.querySelectorAll) return rendered.querySelectorAll('.items-line, .items__line').length > 0;  
        return false;  
    }  
    function injectLines(instance){  
        var lines = [];  
        var kpCached = getCache('kp_line_cache');  
        var cubCached = getCache('cub_line_cache');  
        if(kpCached && kpCached.length) lines.push(kpLine(kpCached));  
        if(Lampa.Storage.field('source') !== 'cub' && cubCached && cubCached.length) lines.push(cubLine(cubCached));  
        if(lines.length && typeof instance.build === 'function'){  
            try{  
                instance.build(lines);  
                return true;  
            }  
            catch(e){}  
        }  
        return false;  
    }  
    function getScrollNode(rendered){  
        if(!rendered) return null;  
        var node = null;  
        if(rendered.find){  
            var found = rendered.find('.scroll__body');  
            node = found && found.length ? found[0] : null;  
        }  
        else if(rendered.querySelector){  
            node = rendered.querySelector('.scroll__body');  
        }  
        return node;  
    }  
    function bindScrollInject(instance, scrollNode){  
        if(scrollHandler) return;  
        scrollHandler = function(){  
            if(mainHandled) return;  
            var nearBottom = scrollNode.scrollTop + scrollNode.clientHeight > scrollNode.scrollHeight - scrollNode.clientHeight * 2;  
            if(nearBottom || scrollNode.scrollTop > 0){  
                mainHandled = true;  
                scrollNode.removeEventListener('scroll', scrollHandler);  
                scrollHandler = null;  
                injectLines(instance);  
            }  
        };  
        scrollNode.addEventListener('scroll', scrollHandler);  
    }  
    function handleLateMain(){  
        if(mainHandled) return;  
        var instance = getMainInstance();  
        if(!instance) return;  
        if(!mainAlreadyRendered(instance)) return;  
        var scrollNode = getScrollNode(instance.render ? instance.render() : null);  
        if(scrollNode){  
            bindScrollInject(instance, scrollNode);  
        }  
        else {  
            mainHandled = true;  
            injectLines(instance);  
        }  
    }  
    function refreshCache(){  
        loadCollectionResolved(KP_LINE_TYPE, 1, function(data){  
            if(data.results.length){  
                setCache('kp_line_cache', data.results);  
                handleLateMain();  
            }  
        }, function(){});  
        if(Lampa.Storage.field('source') !== 'cub'){  
            loadCubNowWatching(1, function(data){  
                if(data.results.length){  
                    setCache('cub_line_cache', data.results);  
                    handleLateMain();  
                }  
            }, function(){});  
        }  
    }  
    if(window.appready) refreshCache();  
    else Lampa.Listener.follow('app', function(event){  
        if(event.type === 'ready') refreshCache();  
    });  
})();
