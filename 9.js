(function() {  
    if (window.qualityPlugin) return;  
    window.qualityPlugin = true;  
    var BAN_DURATION = 24 * 60 * 60 * 1000;  
    var PRIMARY_KEY = 'jac_red';  
    var PRIMARY_URL = 'http://jac.red/api/v2.0/indexers/all/results?apikey=';  
    var FALLBACK_URL = 'https://jr.maxvol.pro/api/v2.0/indexers/all/results?apikey=';  
    var RE_TS = /\b(tsrip|ts|telesync|telecine|cam|camrip|workprint|wp|scr|screener|dvdscr)\b/i;  
    var RE_TS2 = /звук\s*с\s*ts|sound\s*ts|audio\s*ts|dub\s*ts/i;  
    var RE_4K = /\b(2160p|2160р|4k|uhd|4к)\b/i;  
    var RE_HD = /\b(1080p|1080р|720p|720р|blu\-ray|bdrip|bdremux|web\-dl|webdl|web\-dlrip|webrip|hdtv|hdtvrip|hddvd|hddvdrip|fullhd|fhd|hd|hdrip)\b/i;  
    var intersectionObserver = null;  
    var cardObserver = null;  
    function getQuality(title) {  
        if (!title) return null;  
        if (RE_TS.test(title) || RE_TS2.test(title)) return 'TS';  
        if (RE_4K.test(title)) return '4K';  
        if (RE_HD.test(title)) return 'HD';  
        return null;  
    }  
    function aggregate(titles) {  
        if (!titles.length) return null;  
        var ts = 0, has4K = false, hasHD = false;  
        for (var i = 0; i < titles.length; i++) {  
            var q = getQuality(titles[i]);  
            if (q === 'TS') ts++;  
            else if (q === '4K') has4K = true;  
            else if (q === 'HD') hasHD = true;  
        }  
        return ts / titles.length >= 0.5 ? 'TS' : has4K ? '4K' : hasHD ? 'HD' : null;  
    }  
    function getCached(key) {  
        var cache = Lampa.Storage.cache('quality_plugin', 200, {});  
        return cache.hasOwnProperty(key) ? cache[key] : undefined;  
    }  
    function setCached(key, value) {  
        var cache = Lampa.Storage.cache('quality_plugin', 200, {});  
        cache[key] = value;  
        Lampa.Storage.set('quality_plugin', cache);  
    }  
    function isServerBanned(serverKey) {  
        var bans = Lampa.Storage.cache('quality_ban', 10, {});  
        var banTime = bans[serverKey];  
        if (!banTime) return false;  
        return (Date.now() - banTime) < BAN_DURATION;  
    }  
    function banServer(serverKey) {  
        var bans = Lampa.Storage.cache('quality_ban', 10, {});  
        bans[serverKey] = Date.now();  
        Lampa.Storage.set('quality_ban', bans);  
    }  
    function buildUrl(baseUrl, title, year) {  
        var url = baseUrl + '&Query=' + encodeURIComponent(title);  
        if (year) url += '&year=' + year;  
        return url;  
    }  
    function filterResults(results, targetYear) {  
        var titles = [];  
        for (var i = 0; i < results.length; i++) {  
            var r = results[i];  
            var y = parseInt((r.info && r.info.released) || r.year);  
            var yearMatch = !targetYear || (y && y === targetYear);  
            var inTitle = !targetYear || (r.Title && r.Title.indexOf(String(targetYear)) !== -1);  
            if (yearMatch || (!y && inTitle)) titles.push(r.Title);  
        }  
        return titles;  
    }  
    function fetchQuality(data, callback) {  
        var key = String(data.id);  
        var cached = getCached(key);  
        if (cached !== undefined) return callback(cached);  
        var title = data.title || data.name;  
        var targetYear = parseInt((data.release_date || data.first_air_date || '').substring(0, 4)) || null;  
        if (!title) return callback(null);  
        function onResult(titles) {  
            var result = aggregate(titles);  
            setCached(key, result);  
            callback(result);  
        }  
        function tryFallback() {  
            var network = new Lampa.Reguest();  
            network.silent(buildUrl(FALLBACK_URL, title, targetYear), function(res) {  
                onResult(filterResults((res && res.Results) || [], targetYear));  
            }, function() {  
                setCached(key, null);  
                callback(null);  
            }, false);  
        }  
        if (isServerBanned(PRIMARY_KEY)) {  
            tryFallback();  
        } else {  
            var network = new Lampa.Reguest();  
            network.silent(buildUrl(PRIMARY_URL, title, targetYear), function(res) {  
                onResult(filterResults((res && res.Results) || [], targetYear));  
            }, function() {  
                banServer(PRIMARY_KEY);  
                tryFallback();  
            }, false);  
        }  
    }  
    function processCardQuality(card) {  
        if (!Lampa.Storage.field('card_quality')) return;  
        var cardData = card.card_data;  
        if (!cardData || !cardData.id) return;  
        fetchQuality(cardData, function(quality) {  
            if (!quality) return;  
            var view = card.querySelector('.card__view');  
            if (!view) return;  
            var existing = view.querySelector('.card__quality');  
            if (existing) {  
                var inner = existing.querySelector('div');  
                if (inner) inner.textContent = quality;  
            } else {  
                var qualityEl = document.createElement('div');  
                qualityEl.className = 'card__quality';  
                var qualityInner = document.createElement('div');  
                qualityInner.textContent = quality;  
                qualityEl.appendChild(qualityInner);  
                view.appendChild(qualityEl);  
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
    cardObserver = new MutationObserver(function(mutations) {  
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
    Lampa.Listener.follow('full', function(e) {  
        if (e.type !== 'complite' || !e.data || !e.data.movie) return;  
        if (!Lampa.Storage.field('card_quality')) return;  
        fetchQuality(e.data.movie, function(quality) {  
            if (!quality) return;  
            var html = e.object.activity.render();  
            var details = html.find('.full-start-new__details');  
            if (!details.length) return;  
            var label = Lampa.Lang.translate('player_quality');  
            var qualityText = label + ': ' + quality.toUpperCase();  
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
    Lampa.Listener.follow('app', function(e) {  
        if (e.type === 'ready') [].forEach.call(document.querySelectorAll('.card'), observeCard);  
        if (e.type === 'destroy') {  
            if (intersectionObserver) intersectionObserver.disconnect();  
            if (cardObserver) cardObserver.disconnect();  
        }  
    });  
    if (window.appready) [].forEach.call(document.querySelectorAll('.card'), observeCard);  
})();
