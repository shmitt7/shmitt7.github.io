(function () {  
    if (window.__anti_dmca_patched) return;  
    window.__anti_dmca_patched = true;  
  
    // ============================================================  
    // Часть 1. Раннее патчинг lampa_settings — ДО appready/app-ready.  
    // Критично: старый скрипт делал это внутри start(), привязанного  
    // к window.appready, и по логам это оказывалось СЛИШКОМ ПОЗДНО —  
    // ServiceDMCA.init() успевал заполнить window.lampa_settings.dcma  
    // 186-ю реальными записями раньше, чем скрипт выставлял флаг.  
    // ============================================================  
  
    window.lampa_settings = window.lampa_settings || {};  
    window.lampa_settings.disable_features = window.lampa_settings.disable_features || {};  
    window.lampa_settings.disable_features.dmca = true;  
    console.log('[anti-dmca] disable_features.dmca = true patched at', Date.now());  
  
    (function lockDcma() {  
        var value = [];  
        try {  
            Object.defineProperty(window.lampa_settings, 'dcma', {  
                get: function () { return value; },  
                set: function (val) {  
                    console.log('[anti-dmca] blocked attempt to fill dcma list, incoming length =',  
                        val && val.length);  
                    value = [];  
                },  
                configurable: true  
            });  
        } catch (e) {  
            console.warn('[anti-dmca] cannot lock lampa_settings.dcma', e);  
            window.lampa_settings.dcma = [];  
        }  
    })();  
  
    (function lockSettings() {  
        var settings = window.lampa_settings;  
        try {  
            Object.defineProperty(window, 'lampa_settings', {  
                get: function () { return settings; },  
                set: function (val) {  
                    settings = val || {};  
                    settings.disable_features = settings.disable_features || {};  
                    settings.disable_features.dmca = true;  
                    settings.dcma = [];  
                    console.log('[anti-dmca] lampa_settings was reassigned, re-patched');  
                },  
                configurable: true  
            });  
        } catch (e) {  
            console.warn('[anti-dmca] cannot lock window.lampa_settings', e);  
        }  
    })();  
  
    // ============================================================  
    // Часть 2. Диагностика сети (можно оставить или убрать позже)  
    // ============================================================  
    function attachNetworkDebug() {  
        Lampa.Listener.follow('request_before', function (e) {  
            if (/\/(movie|tv)\/\d+/.test((e.params && e.params.url) || '')) {  
                console.log('[dmca-debug] request_before:', e.params.url);  
            }  
        });  
        Lampa.Listener.follow('request_error', function (e) {  
            if (/\/(movie|tv)\/\d+/.test((e.params && e.params.url) || '')) {  
                console.log('[dmca-debug] request_error:', e.params.url, e.error && e.error.status);  
            }  
        });  
    }  
  
    // ============================================================  
    // Часть 3. Fallback на серверный blocked:true в теле ответа.  
    // Срабатывает уже ПОСЛЕ того, как запрос дошёл до cub.best  
    // и вернул blocked=true прямо в JSON (это отдельный механизм  
    // от локального dcma-списка, который патчим в Части 1).  
    // ============================================================  
    var cardPathRe       = /\/3\/(movie|tv)\/(\d+)(?:\/|$|\?)/;  
    var subPathRe        = /\/3\/(?:movie|tv)\/\d+\/([^\/\?]+)/;  
    var seasonNumRe      = /\/season\/(\d+)(?:\/|$|\?)/;  
    var collectionPathRe = /\/3\/collection\/(\d+)(?:\/|$|\?)/;  
    var cardCache = {};  
    var cardCacheSize = 0;  
  
    function getLang() { return Lampa.Storage.field('tmdb_lang') || 'ru'; }  
  
    function httpGet(url) {  
        return new Promise(function (resolve, reject) {  
            var xhr = new XMLHttpRequest();  
            xhr.open('GET', url, true);  
            xhr.timeout = 10000;  
            xhr.ontimeout = function () { reject(new Error('timeout')); };  
            xhr.onreadystatechange = function () {  
                if (xhr.readyState !== 4) return;  
                if (xhr.status < 200 || xhr.status >= 300) {  
                    reject(new Error('http_' + xhr.status));  
                    return;  
                }  
                try { resolve(JSON.parse(xhr.responseText)); }  
                catch (e) { reject(e); }  
            };  
            xhr.onerror = function () { reject(new Error('network_error')); };  
            xhr.send();  
        });  
    }  
  
    function fetchDirect(type, id) {  
        var cacheKey = type + '_' + id;  
        if (cardCache[cacheKey]) return cardCache[cacheKey];  
        if (cardCacheSize > 200) { cardCache = {}; cardCacheSize = 0; }  
        cardCacheSize++;  
  
        var url = 'https://api.themoviedb.org/3/' + type + '/' + id  
            + '?api_key=' + Lampa.TMDB.key()  
            + '&language=' + getLang()  
            + '&append_to_response=' + (type === 'tv'  
                ? 'credits,external_ids,videos,recommendations,similar,content_ratings'  
                : 'credits,external_ids,videos,recommendations,similar');  
  
        console.log('[anti-dmca] fetchDirect ->', url);  
  
        cardCache[cacheKey] = httpGet(url).then(function (card) {  
            console.log('[anti-dmca] fetchDirect OK, id =', card && card.id);  
            if (card && card.id) { delete card.blocked; return card; }  
            delete cardCache[cacheKey];  
            return Promise.reject(new Error('invalid'));  
        }, function (err) {  
            console.warn('[anti-dmca] fetchDirect FAILED for', url, err && err.message);  
            delete cardCache[cacheKey];  
            return Promise.reject(err);  
        });  
  
        return cardCache[cacheKey];  
    }  
  
    function fetchSeason(tvId, seasonNum) {  
        var url = 'https://api.themoviedb.org/3/tv/' + tvId + '/season/' + seasonNum  
            + '?api_key=' + Lampa.TMDB.key()  
            + '&language=' + getLang();  
        return httpGet(url);  
    }  
  
    function fetchCollection(collectionId) {  
        var url = 'https://api.themoviedb.org/3/collection/' + collectionId  
            + '?api_key=' + Lampa.TMDB.key()  
            + '&language=' + getLang();  
        return httpGet(url);  
    }  
  
    function tryFetch(type, id, altType, resume, fallbackData, subPath) {  
        fetchDirect(type, id).then(function (card) {  
            var out = (subPath && card[subPath] !== undefined) ? card[subPath] : card;  
            resume(out);  
        }, function () {  
            if (altType) tryFetch(altType, id, null, resume, fallbackData, subPath);  
            else {  
                console.warn('[anti-dmca] all direct TMDB attempts failed, falling back to original (blocked) data');  
                resume(fallbackData);  
            }  
        });  
    }  
  
    function startNetworkHooks() {  
        Lampa.Listener.follow('request_secuses', function (event) {  
            if (!event || !event.data || typeof event.abort !== 'function') return;  
  
            var data = event.data;  
            var blocked = data.blocked === true || (data.movie && data.movie.blocked === true);  
            if (!blocked) return;  
  
            var url = (event.params && event.params.url) || '';  
            console.log('[anti-dmca] server blocked=true intercepted for', url);  
  
            var collectionMatch = url.match(collectionPathRe);  
            if (collectionMatch) {  
                var resumeCollection = event.abort();  
                fetchCollection(collectionMatch[1]).then(function (collection) {  
                    if (collection && collection.id) resumeCollection(collection);  
                    else resumeCollection({ parts: [], results: [] });  
                }, function () {  
                    resumeCollection({ parts: [], results: [] });  
                });  
                return;  
            }  
  
            var cardMatch = url.match(cardPathRe);  
            if (!cardMatch) return;  
  
            var type = cardMatch[1];  
            var id = cardMatch[2];  
            var subMatch = url.match(subPathRe);  
            var subPath = subMatch ? subMatch[1] : null;  
  
            if (subPath === 'season') {  
                var seasonNumMatch = url.match(seasonNumRe);  
                var seasonNum = seasonNumMatch ? parseInt(seasonNumMatch[1], 10) : 1;  
                var resumeSeason = event.abort();  
                fetchSeason(id, seasonNum).then(function (seasonData) {  
                    if (seasonData && (seasonData.id !== undefined || seasonData.episodes)) resumeSeason(seasonData);  
                    else resumeSeason({ episodes: [], id: parseInt(id, 10) });  
                }, function () {  
                    resumeSeason({ episodes: [], id: parseInt(id, 10) });  
                });  
                return;  
            }  
  
            var resumeCard = event.abort();  
            var altType = type === 'tv' ? 'movie' : 'tv';  
            tryFetch(type, id, altType, resumeCard, data, subPath);  
        });  
    }  
  
    function start() {  
        attachNetworkDebug();  
        startNetworkHooks();  
    }  
  
    if (window.appready) {  
        start();  
    } else {  
        Lampa.Listener.follow('app', function (event) {  
            if (event.type === 'ready') start();  
        });  
    }  
})();
