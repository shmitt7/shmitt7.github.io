(function () {  
    'use strict';  
  
    var API_KEY = '4ef0d7355d9ffb5151e987764708ce96';  
    var cardPathRe = /\/3\/(movie|tv)\/(\d+)(?:\/|$|\?)/;  
  
    function getLang() {  
        try { return Lampa.Storage.get('language') || 'ru'; } catch (e) {}  
        return 'ru';  
    }  
  
    function getApiKey() {  
        try { if (Lampa.TMDB && typeof Lampa.TMDB.key === 'function') return Lampa.TMDB.key(); } catch (e) {}  
        return API_KEY;  
    }  
  
    function fetchDirect(type, id) {  
        var lang = getLang();  
        var append = type === 'tv'  
            ? 'credits,external_ids,videos,recommendations,similar,content_ratings'  
            : 'credits,external_ids,videos,recommendations,similar';  
        var url = 'https://api.themoviedb.org/3/' + type + '/' + id  
            + '?api_key=' + getApiKey() + '&language=' + lang  
            + '&append_to_response=' + append;  
  
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
  
    function tryFetch(type, id, altType, resume, fallbackData) {  
        fetchDirect(type, id).then(function (card) {  
            if (card && card.id) {  
                delete card.blocked;  
                resume(card);  
                return;  
            }  
            if (altType) tryFetch(altType, id, null, resume, fallbackData);  
            else resume(fallbackData);  
        }).catch(function () {  
            if (altType) tryFetch(altType, id, null, resume, fallbackData);  
            else resume(fallbackData);  
        });  
    }  
  
    function start() {  
        if (window.anti_dmca_simple) return;  
        if (typeof Lampa === 'undefined' || !window.lampa_settings) return;  
        window.anti_dmca_simple = true;  
  
        // Отключаем загрузку списка заблокированных с сервера  
        window.lampa_settings.disable_features = window.lampa_settings.disable_features || {};  
        window.lampa_settings.disable_features.dmca = true;  
  
        // Обнуляем список заблокированных ID (предотвращаем предварительную блокировку)  
        try {  
            Object.defineProperty(window.lampa_settings, 'dcma', {  
                get: function () { return []; },  
                set: function () {},  
                configurable: true  
            });  
        } catch (e) { window.lampa_settings.dcma = []; }  
  
        // Заглушаем Utils.dcma — проверка по списку всегда возвращает false  
        Lampa.Utils.dcma = function () { return undefined; };  
  
        // Перехватываем request_secuses:  
        // если ответ заблокирован — делаем повторный запрос напрямую к TMDB  
        Lampa.Listener.follow('request_secuses', function (event) {  
            if (!event || !event.data || typeof event.abort !== 'function') return;  
  
            var data = event.data;  
            var blocked = data.blocked === true || (data.movie && data.movie.blocked === true);  
            if (!blocked) return;  
  
            var url = (event.params && event.params.url) || '';  
            var match = url.match(cardPathRe);  
            if (!match) return;  
  
            var resume = event.abort(); // прерываем стандартную обработку  
            var type = match[1], id = match[2];  
            var altType = type === 'tv' ? 'movie' : 'tv';  
  
            // Пробуем основной тип, при неудаче — альтернативный  
            tryFetch(type, id, altType, resume, data);  
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
