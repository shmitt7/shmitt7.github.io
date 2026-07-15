(function() {  
    if (window.qualityPlugin) return;  
    window.qualityPlugin = true;  
  
    var LOG = '[QualityPlugin]';  
  
    var SERVERS = ['https://jac.red', 'https://jr.maxvol.pro'];  
    var KP_API  = 'https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword';  
    var KP_KEY  = '2d55adfd-019d-4567-bbf7-67d503f61b5a'; // замените на свой ключ  
  
    var RE_TS  = /\b(ts|telesync|telecine|cam|camrip|workprint|wp|scr|screener|dvdscr)\b/i;  
    var RE_TS2 = /звук\s*с\s*ts|sound\s*ts|audio\s*ts|dub\s*ts/i;  
    var RE_4K  = /\b(2160p|2160р|4k|uhd|4к)\b/i;  
    var RE_HD  = /\b(1080p|1080р|720p|720р|blu\-ray|bdrip|bdremux|web\-dl|webdl|web\-dlrip|webrip|hdtv|hdtvrip|hddvd|hddvdrip|fullhd|fhd|hd|hdrip)\b/i;  
  
    var qualityCache = {};  
    var qualityCacheSize = 0;  
    var intersectionObserver = null;  
  
    console.log(LOG, 'Plugin initialized');  
  
    // ─── helpers ────────────────────────────────────────────────────────────  
  
    function getQuality(t) {  
        if (!t) return null;  
        if (RE_TS.test(t) || RE_TS2.test(t)) return 'TS';  
        if (RE_4K.test(t)) return '4K';  
        if (RE_HD.test(t)) return 'HD';  
        return null;  
    }  
  
    function setQualityCache(key, value) {  
        if (qualityCacheSize > 200) {  
            console.log(LOG, 'Cache cleared (limit 200)');  
            qualityCache = {};  
            qualityCacheSize = 0;  
        }  
        qualityCache[key] = value;  
        qualityCacheSize++;  
    }  
  
    // ─── поиск по KP ID на jac.red ──────────────────────────────────────────  
  
    function searchByKpId(kpId, cacheKey, callback) {  
        console.log(LOG, 'searchByKpId: kpId=' + kpId);  
        var i = 0;  
        var titles = [];  
        var network = new Lampa.Reguest();  
  
        function done() {  
            console.log(LOG, 'searchByKpId done: titles collected=' + titles.length, titles);  
            if (!titles.length) {  
                if (cacheKey) setQualityCache(cacheKey, null);  
                return callback(null);  
            }  
            var ts = 0, has4K = false, hasHD = false;  
            for (var ti = 0; ti < titles.length; ti++) {  
                var q = getQuality(titles[ti]);  
                console.log(LOG, '  title:', titles[ti], '→', q);  
                if (q === 'TS') ts++;  
                else if (q === '4K') has4K = true;  
                else if (q === 'HD') hasHD = true;  
            }  
            var r = ts / titles.length >= 0.5 ? 'TS' : has4K ? '4K' : hasHD ? 'HD' : null;  
            console.log(LOG, 'searchByKpId result: ' + r + ' (ts=' + ts + ', 4K=' + has4K + ', HD=' + hasHD + ')');  
            if (cacheKey) setQualityCache(cacheKey, r);  
            callback(r);  
        }  
  
        function next() {  
            if (i >= SERVERS.length) return done();  
            var url = SERVERS[i] + '/api/v2.0/indexers/all/results?apikey=&kp_id=' + kpId;  
            console.log(LOG, 'searchByKpId: requesting server[' + i + ']', url);  
            network.silent(url, function(res) {  
                var results = (res && res.Results) || [];  
                console.log(LOG, 'searchByKpId: server[' + i + '] returned ' + results.length + ' results');  
                for (var ri = 0; ri < results.length; ri++) {  
                    titles.push(results[ri].Title);  
                }  
                i++; next();  
            }, function(err) {  
                console.warn(LOG, 'searchByKpId: server[' + i + '] error', err);  
                i++; next();  
            });  
        }  
  
        next();  
    }  
  
    // ─── поиск по названию + год ±1 (fallback) ──────────────────────────────  
  
    function searchByTitle(title, targetYear, cacheKey, callback) {  
        console.log(LOG, 'searchByTitle: title="' + title + '" year=' + targetYear);  
        var i = 0;  
        var titles = [];  
        var network = new Lampa.Reguest();  
  
        function done() {  
            console.log(LOG, 'searchByTitle done: titles collected=' + titles.length, titles);  
            if (!titles.length) {  
                if (cacheKey) setQualityCache(cacheKey, null);  
                return callback(null);  
            }  
            var ts = 0, has4K = false, hasHD = false;  
            for (var ti = 0; ti < titles.length; ti++) {  
                var q = getQuality(titles[ti]);  
                console.log(LOG, '  title:', titles[ti], '→', q);  
                if (q === 'TS') ts++;  
                else if (q === '4K') has4K = true;  
                else if (q === 'HD') hasHD = true;  
            }  
            var r = ts / titles.length >= 0.5 ? 'TS' : has4K ? '4K' : hasHD ? 'HD' : null;  
            console.log(LOG, 'searchByTitle result: ' + r + ' (ts=' + ts + ', 4K=' + has4K + ', HD=' + hasHD + ')');  
            if (cacheKey) setQualityCache(cacheKey, r);  
            callback(r);  
        }  
  
        function next() {  
            if (i >= SERVERS.length) return done();  
            var url = SERVERS[i] + '/api/v2.0/indexers/all/results?apikey=&Query='  
                + encodeURIComponent(title) + (targetYear ? '&year=' + targetYear : '');  
            console.log(LOG, 'searchByTitle: requesting server[' + i + ']', url);  
            network.silent(url, function(res) {  
                var results = (res && res.Results) || [];  
                console.log(LOG, 'searchByTitle: server[' + i + '] returned ' + results.length + ' results');  
                for (var ri = 0; ri < results.length; ri++) {  
                    var r = results[ri];  
                    var y = parseInt((r.info && r.info.released) || r.year);  
                    // ±1 год  
                    var yearMatch = !targetYear || (y && Math.abs(y - targetYear) <= 1);  
                    var inTitle = !targetYear || (r.Title && (  
                        r.Title.includes(String(targetYear)) ||  
                        r.Title.includes(String(targetYear - 1)) ||  
                        r.Title.includes(String(targetYear + 1))  
                    ));  
                    if (yearMatch || (!y && inTitle)) {  
                        console.log(LOG, '  accepted: "' + r.Title + '" year=' + y);  
                        titles.push(r.Title);  
                    } else {  
                        console.log(LOG, '  skipped:  "' + r.Title + '" year=' + y + ' (target=' + targetYear + ')');  
                    }  
                }  
                i++; next();  
            }, function(err) {  
                console.warn(LOG, 'searchByTitle: server[' + i + '] error', err);  
                i++; next();  
            });  
        }  
  
        next();  
    }  
  
    // ─── главная функция ─────────────────────────────────────────────────────  
  
    function fetchQuality(data, callback) {  
        var key = data.id;  
        if (key && qualityCache[key] !== undefined) {  
            console.log(LOG, 'fetchQuality: cache hit id=' + key + ' → ' + qualityCache[key]);  
            return callback(qualityCache[key]);  
        }  
  
        var title = data.title || data.name;  
        var targetYear = parseInt((data.release_date || data.first_air_date || '').substring(0, 4)) || null;  
        console.log(LOG, 'fetchQuality: id=' + key + ' title="' + title + '" year=' + targetYear  
            + ' kp_id=' + (data.kinopoisk_id || 'none'));  
  
        // 1. Уже есть KP ID в данных карточки  
        if (data.kinopoisk_id) {  
            console.log(LOG, 'fetchQuality: using existing kinopoisk_id=' + data.kinopoisk_id);  
            return searchByKpId(data.kinopoisk_id, key, function(q) {  
                if (q !== null) return callback(q);  
                // KP ID ничего не дал — fallback на поиск по названию  
                console.log(LOG, 'fetchQuality: kp_id search empty, falling back to title search');  
                searchByTitle(title, targetYear, key, callback);  
            });  
        }  
  
        // 2. Запрашиваем KP ID через API  
        if (!title) {  
            console.warn(LOG, 'fetchQuality: no title, skipping');  
            return callback(null);  
        }  
  
        var kpNetwork = new Lampa.Reguest();  
        var kpUrl = KP_API + '?keyword=' + encodeURIComponent(title);  
        console.log(LOG, 'fetchQuality: requesting KP API', kpUrl);  
  
        kpNetwork.silent(kpUrl, function(json) {  
            var films = (json && json.films) || [];  
            console.log(LOG, 'fetchQuality: KP API returned ' + films.length + ' films');  
  
            var kpId = null;  
            for (var fi = 0; fi < films.length; fi++) {  
                var f = films[fi];  
                var fy = parseInt(f.year);  
                // Ищем совпадение по году ±1  
                if (!targetYear || Math.abs(fy - targetYear) <= 1) {  
                    kpId = f.filmId;  
                    console.log(LOG, 'fetchQuality: KP match: filmId=' + kpId  
                        + ' "' + (f.nameRu || f.nameEn) + '" year=' + fy);  
                    break;  
                }  
                console.log(LOG, 'fetchQuality: KP skip: filmId=' + f.filmId  
                    + ' "' + (f.nameRu || f.nameEn) + '" year=' + fy);  
            }  
  
            if (kpId) {  
                searchByKpId(kpId, key, function(q) {  
                    if (q !== null) return callback(q);  
                    console.log(LOG, 'fetchQuality: kp_id search empty, falling back to title search');  
                    searchByTitle(title, targetYear, key, callback);  
                });  
            } else {  
                console.log(LOG, 'fetchQuality: no KP match, falling back to title search');  
                searchByTitle(title, targetYear, key, callback);  
            }  
        }, function(err) {  
            console.warn(LOG, 'fetchQuality: KP API error, falling back to title search', err);  
            searchByTitle(title, targetYear, key, callback);  
        }, false, {  
            headers: { 'X-API-KEY': KP_KEY }  
        });  
    }  
  
    // ─── карточка в списке ───────────────────────────────────────────────────  
  
    function processCardQuality(card) {  
        if (!Lampa.Storage.field('card_quality')) return;  
        var d = card.card_data;  
        if (!d || !d.id) return;  
        console.log(LOG, 'processCardQuality: id=' + d.id + ' "' + (d.title || d.name) + '"');  
        fetchQuality(d, function(q) {  
            if (!q) {  
                console.log(LOG, 'processCardQuality: no quality for id=' + d.id);  
                return;  
            }  
            console.log(LOG, 'processCardQuality: id=' + d.id + ' → ' + q);  
            var view = card.querySelector('.card__view');  
            if (!view) return;  
            var existing = view.querySelector('.card__quality');  
            if (existing) {  
                var inner = existing.querySelector('div');  
                if (inner) inner.textContent = q;  
            } else {  
                var quality = document.createElement('div');  
                quality.className = 'card__quality';  
                var quality_inner = document.createElement('div');  
                quality_inner.textContent = q;  
                quality.appendChild(quality_inner);  
                view.appendChild(quality);  
            }  
        });  
    }  
  
    function observeCard(card) {  
        if (!card.card_data || !card.card_data.id || card.dataset.qlty) return;  
        card.dataset.qlty = '1';  
        if (intersectionObserver) intersectionObserver.observe(card);  
        else processCardQuality(card);  
    }  
  
    if (typeof IntersectionObserver !== 'undefined') {  
        intersectionObserver = new IntersectionObserver(function(entries) {  
            for (var ei = 0; ei < entries.length; ei++) {  
                var entry = entries[ei];  
                if (!entry.isIntersecting) continue;  
                intersectionObserver.unobserve(entry.target);  
                processCardQuality(entry.target);  
            }  
        }, { rootMargin: '100px' });  
    }  
  
    var cardObserver = new MutationObserver(function(mutations) {  
        for (var mi = 0; mi < mutations.length; mi++) {  
            var addedNodes = mutations[mi].addedNodes;  
            for (var ni = 0; ni < addedNodes.length; ni++) {  
                var node = addedNodes[ni];  
                if (node.nodeType !== 1) continue;  
                if (node.classList && node.classList.contains('card')) observeCard(node);  
                [].forEach.call(node.querySelectorAll('.card'), observeCard);  
            }  
        }  
    });  
  
    cardObserver.observe(document.body, { childList: true, subtree: true });  
  
    // ─── полная карточка ─────────────────────────────────────────────────────  
  
    Lampa.Listener.follow('full', function(e) {  
        if (e.type !== 'complite' || !e.data || !e.data.movie) return;  
        var movie = e.data.movie;  
        console.log(LOG, 'full card: id=' + movie.id + ' "' + (movie.title || movie.name) + '"');  
        fetchQuality(movie, function(q) {  
            if (!q) {  
                console.log(LOG, 'full card: no quality for id=' + movie.id);  
                return;  
            }  
            console.log(LOG, 'full card: id=' + movie.id + ' → ' + q);  
            var html = e.object.activity.render();  
            var details = html.find('.full-start-new__details');  
            if (!details.length) return;  
  
            var label = Lampa.Lang.translate('player_quality');  
            var qualityText = label + ': ' + q.toUpperCase();  
  
            var found = false;  
            details.find('span').not('.full-start-new__split').each(function() {  
                if (this.textContent.indexOf(label + ':') === 0) {  
                    this.textContent = qualityText;  
                    found = true;  
                    return false;  
                }  
            });  
  
            if (!found) {  
                var split = document.createElement('span');  
                split.className = 'full-start-new__split';  
                split.textContent = '●';  
                var span = document.createElement('span');  
                span.textContent = qualityText;  
                details[0].appendChild(split);  
                details[0].appendChild(span);  
            }  
        });  
    });  
  
    // ─── app events ──────────────────────────────────────────────────────────  
  
    Lampa.Listener.follow('app', function(e) {  
        if (e.type === 'ready') {  
            console.log(LOG, 'app ready: scanning existing cards');  
            [].forEach.call(document.querySelectorAll('.card'), observeCard);  
        }  
        if (e.type === 'destroy') {  
            console.log(LOG, 'app destroy: disconnecting observers');  
            if (intersectionObserver) intersectionObserver.disconnect();  
            cardObserver.disconnect();  
        }  
    });  
  
    if (window.appready) {  
        console.log(LOG, 'appready already set: scanning existing cards');  
        [].forEach.call(document.querySelectorAll('.card'), observeCard);  
    }  
})();
