(function () {  
    'use strict';  
  
    var API_KEY = '4ef0d7355d9ffb5151e987764708ce96';  
    var cardPathRe  = /\/3\/(movie|tv)\/(\d+)(?:\/|$|\?)/;  
    var subPathRe   = /\/3\/(?:movie|tv)\/\d+\/([^\/\?]+)/;  
    var seasonNumRe = /\/season\/(\d+)(?:\/|$|\?)/;  
  
    function getLang() {  
        try { return Lampa.Storage.get('language') || 'ru'; } catch (e) {}  
        return 'ru';  
    }  
  
    function getApiKey() {  
        try { if (Lampa.TMDB && typeof Lampa.TMDB.key === 'function') return Lampa.TMDB.key(); } catch (e) {}  
        return API_KEY;  
    }  
  
    var cardCache = {};  
  
    function httpGet(url) {  
        if (typeof window.fetch === 'function') {  
            return window.fetch(url).then(function (r) { return r.json(); });  
        }  
        return new Promise(function (resolve, reject) {  
            var xhr = new XMLHttpRequest();  
            xhr.open('GET', url, true);  
            xhr.onreadystatechange = function () {  
                if (xhr.readyState !== 4) return;  
                try { resolve(JSON.parse(xhr.responseText)); } catch (e) { reject(e); }  
            };  
            xhr.onerror = reject;  
            xhr.send();  
        });  
    }  
  
    function fetchDirect(type, id) {  
        var key = type + '_' + id;  
        if (cardCache[key]) return cardCache[key];  
  
        var lang = getLang();  
        var append = type === 'tv'  
            ? 'credits,external_ids,videos,recommendations,similar,content_ratings'  
            : 'credits,external_ids,videos,recommendations,similar';  
        var url = 'https://api.themoviedb.org/3/' + type + '/' + id  
            + '?api_key=' + getApiKey() + '&language=' + lang  
            + '&append_to_response=' + append;  
  
        cardCache[key] = httpGet(url).then(function (card) {  
            if (card && card.id) { delete card.blocked; return card; }  
            delete cardCache[key];  
            return Promise.reject(new Error('invalid'));  
        }).catch(function (e) {  
            delete cardCache[key];  
            return Promise.reject(e);  
        });  
  
        return cardCache[key];  
    }  
  
    function fetchSeason(id, seasonNum) {  
        var lang = getLang();  
        var url = 'https://api.themoviedb.org/3/tv/' + id + '/season/' + seasonNum  
            + '?api_key=' + getApiKey() + '&language=' + lang;  
        return httpGet(url);  
    }  
  
    function tryFetch(type, id, altType, resume, fallbackData, sub) {  
        fetchDirect(type, id).then(function (card) {  
            var out = (sub && card[sub] !== undefined) ? card[sub] : card;  
            resume(out);  
        }).catch(function () {  
            if (altType) tryFetch(altType, id, null, resume, fallbackData, sub);  
            else resume(fallbackData);  
        });  
    }  
  
    function start() {  
        if (window.anti_dmca_simple) return;  
        if (typeof Lampa === 'undefined' || !window.lampa_settings) return;  
        window.anti_dmca_simple = true;  
  
        window.lampa_settings.disable_features = window.lampa_settings.disable_features || {};  
        window.lampa_settings.disable_features.dmca = true;  
        window.lampa_settings.disable_features.metadata = true;  
  
        try {  
            Object.defineProperty(window.lampa_settings, 'dcma', {  
                get: function () { return []; },  
                set: function () {},  
                configurable: true  
            });  
        } catch (e) { window.lampa_settings.dcma = []; }  
  
        Lampa.Utils.dcma = function () { return undefined; };  
  
        Lampa.Listener.follow('request_secuses', function (event) {  
            if (!event || !event.data || typeof event.abort !== 'function') return;  
  
            var data = event.data;  
            var blocked = data.blocked === true || (data.movie && data.movie.blocked === true);  
            if (!blocked) return;  
  
            var url = (event.params && event.params.url) || '';  
            var match = url.match(cardPathRe);  
            if (!match) return;  
  
            var type = match[1], id = match[2];  
            var subMatch = url.match(subPathRe);  
            var sub = subMatch ? subMatch[1] : null;  
  
            // Запрос сезона — отдельный endpoint, не входит в append_to_response  
            if (sub === 'season') {  
                var snMatch = url.match(seasonNumRe);  
                var seasonNum = snMatch ? parseInt(snMatch[1], 10) : 1;  
                var resumeSeason = event.abort();  
  
                fetchSeason(id, seasonNum).then(function (ep) {  
                    if (ep && (ep.id !== undefined || ep.episodes)) resumeSeason(ep);  
                    else resumeSeason({ episodes: [], id: parseInt(id, 10) });  
                }).catch(function () {  
                    resumeSeason({ episodes: [], id: parseInt(id, 10) });  
                });  
                return;  
            }  
  
            // Основная карточка и под-запросы (credits, recommendations, similar, videos)  
            var resumeCard = event.abort();  
            var altType = type === 'tv' ? 'movie' : 'tv';  
            tryFetch(type, id, altType, resumeCard, data, sub);  
        });  
  
        console.log('[anti-dmca-simple] active');  
    }  
  
    if (window.appready) {  
        start();  
    } else if (typeof Lampa !== 'undefined' && Lampa.Listener) {  
        Lampa.Listener.follow('app', function (event) {  
            if (event.type === 'ready') start();  
        });  
    }  
})();
