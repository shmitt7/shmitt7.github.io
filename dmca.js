(function () {  
    var cardPathRe = /\/3\/(movie|tv)\/(\d+)(?:\/|$|\?)/;  
    var subPathRe = /\/3\/(?:movie|tv)\/\d+\/([^\/\?]+)/;  
    var seasonNumRe = /\/season\/(\d+)(?:\/|$|\?)/;  
    var collectionPathRe = /\/3\/collection\/(\d+)(?:\/|$|\?)/;  
    var cardCache = {};  
    var cardCacheSize = 0;  
    function getLang() {  
        return Lampa.Storage.field('tmdb_lang') || 'ru';  
    }  
    function httpGet(url) {  
        return new Promise(function (resolve, reject) {  
            var xhr = new XMLHttpRequest();  
            xhr.open('GET', url, true);  
            xhr.timeout = 10000;  
            xhr.ontimeout = reject;  
            xhr.onreadystatechange = function () {  
                if (xhr.readyState !== 4) return;  
                try { resolve(JSON.parse(xhr.responseText)); } catch (parseError) { reject(parseError); }  
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
        }, function (requestError) {  
            delete cardCache[cacheKey];  
            return Promise.reject(requestError);  
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
            else resume(fallbackData);  
        });  
    }  
    function start() {  
        if (window.anti_dmca_simple) return;  
        window.anti_dmca_simple = true;  
        window.lampa_settings.disable_features = window.lampa_settings.disable_features || {};  
        window.lampa_settings.disable_features.dmca = true;  
        try {  
            Object.defineProperty(window.lampa_settings, 'dcma', {  
                get: function () { return []; },  
                set: function () {},  
                configurable: true  
            });  
        } catch (defineError) { window.lampa_settings.dcma = []; }  
        Lampa.Utils.dcma = function () { return undefined; };  
        Lampa.Listener.follow('request_secuses', function (event) {  
            if (!event || !event.data || typeof event.abort !== 'function') return;  
            var data = event.data;  
            var blocked = data.blocked === true || (data.movie && data.movie.blocked === true);  
            if (!blocked) return;  
            var url = (event.params && event.params.url) || '';  
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
    if (window.appready) {  
        start();  
    } else {  
        Lampa.Listener.follow('app', function (event) {  
            if (event.type === 'ready') start();  
        });  
    }  
})();
