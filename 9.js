(function () {  
    // === Часть 1: работает СРАЗУ, без ожидания appready/app-ready ===  
    // Это критично: судя по логам, старый скрипт патчил lampa_settings  
    // ПОСЛЕ появления события app/ready, а сервис DMCA успевал выполниться раньше.  
    if (window.__anti_dmca_patched) return;  
    window.__anti_dmca_patched = true;  
  
    window.lampa_settings = window.lampa_settings || {};  
    window.lampa_settings.disable_features = window.lampa_settings.disable_features || {};  
    window.lampa_settings.disable_features.dmca = true;  
    console.log('[anti-dmca] patched disable_features.dmca = true at', Date.now());  
  
    (function lockDcma() {  
        var value = [];  
        try {  
            Object.defineProperty(window.lampa_settings, 'dcma', {  
                get: function () { return value; },  
                set: function (val) {  
                    // Кто-то (например ServiceDMCA) пытается заполнить список — блокируем  
                    console.log('[anti-dmca] blocked attempt to set dcma, incoming length =',  
                        val && val.length, 'stack:', new Error().stack);  
                    value = [];  
                },  
                configurable: true  
            });  
        } catch (e) {  
            console.warn('[anti-dmca] cannot lock lampa_settings.dcma', e);  
        }  
    })();  
  
    // Защита на случай, если весь lampa_settings будет переприсвоен новым объектом  
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
  
    // === Часть 2: обработка серверного blocked (старый механизм) ===  
    // Оставляем как fallback — если карточка блокируется не локальным списком,  
    // а флагом blocked прямо в ответе API, перехватываем через request_secuses.  
    var cardPathRe    = /\/3\/(movie|tv)\/(\d+)(?:\/|$|\?)/;  
    var subPathRe     = /\/3\/(?:movie|tv)\/\d+\/([^\/\?]+)/;  
    var seasonNumRe   = /\/season\/(\d+)(?:\/|$|\?)/;  
    var collectionPathRe = /\/3\/collection\/(\d+)(?:\/|$|\?)/;  
    var cardCache = {};  
    var cardCacheSize = 0;  
  
    function getLang() { return Lampa.Storage.field('tmdb_lang') || 'ru'; }  
  
    function httpGet(url) {  
        return new Promise(function (resolve, reject) {  
            var xhr = new XMLHttpRequest();  
            xhr.open('GET', url, true);  
            xhr.timeout = 10000;  
            xhr.ontimeout = reject;  
            xhr.onreadystatechange = function () {  
                if (xhr.readyState !== 4) return;  
                try { resolve(JSON.parse(xhr.responseText)); } catch (e) { reject(e); }  
            };  
            xhr.onerror = reject;  
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
        cardCache[cacheKey] = httpGet(url).then(function (card) {  
            if (card && card.id) { delete card.blocked; return card; }  
            delete cardCache[cacheKey];  
            return Promise.reject(new Error('invalid'));  
        }, function (err) {  
            delete cardCache[cacheKey];  
            return Promise.reject(err);  
        });  
        return cardCache[cacheKey];  
    }  
  
    function fetchSeason(tvId, seasonNum) {  
        var url = 'https://api.themoviedb.org/3/tv/' + tvId + '/season/' + seasonNum  
            + '?api_key=' + Lampa.TMDB.key() + '&language=' + getLang();  
        return httpGet(url);  
    }  
  
    function fetchCollection(collectionId) {  
        var url = 'https://api.themoviedb.org/3/collection/' + collectionId  
            + '?api_key=' + Lampa.TMDB.key() + '&language=' + getLang();  
        return httpGet(url);  
    }  
  
    function tryFetch(type, id, altType, resume, fallbackData, subPath) {  
        fetchDirect(type, id).then(function (card) {  
            var out = (subPath && card[subPath] !== undefined) ? card[subPath] : card;  
            resume(out);  
        }, function () {  
            if (altType) tryFetch(altType, id, null, resume, fallbackData, subPath);  
            else resume(fallbackData);  
        });  
    }  
  
    function startNetworkHooks() {  
        Lampa.Listener.follow('request_secuses', function (event) {  
            if (!event || !event.data || typeof event.abort !== 'function') return;  
            var data = event.data;  
            var blocked = data.blocked === true || (data.movie && data.movie.blocked === true);  
            if (!blocked) return;  
            console.log('[anti-dmca] server blocked=true fallback triggered for', event.params && event.params.url);  
            var url = (event.params && event.params.url) || '';  
  
            var collectionMatch = url.match(collectionPathRe);  
            if (collectionMatch) {  
                var resumeCollection = event.abort();  
                fetchCollection(collectionMatch[1]).then(function (collection) {  
                    if (collection && collection.id) resumeCollection(collection);  
                    else resumeCollection({ parts: [], results: [] });  
                }, function () { resumeCollection({ parts: [], results: [] }); });  
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
                }, function () { resumeSeason({ episodes: [], id: parseInt(id, 10) }); });  
                return;  
            }  
  
            var resumeCard = event.abort();  
            var altType = type === 'tv' ? 'movie' : 'tv';  
            tryFetch(type, id, altType, resumeCard, data, subPath);  
        });  
    }  
  
    if (window.appready && window.Lampa) startNetworkHooks();  
    else Lampa && Lampa.Listener  
        ? Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') startNetworkHooks(); })  
        : document.addEventListener('DOMContentLoaded', function () {  
              if (window.Lampa) window.Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') startNetworkHooks(); });  
          });  
})();
