(function() {  
    if (window.qualityPlugin) return;  
    window.qualityPlugin = true;  
    var JAC_URL = 'http://jac.red/api/v2.0/indexers/all/results?apikey=&Query=';  
    var RE_TS = /\b(tsrip|ts|telesync|telecine|cam|camrip|workprint|wp|scr|screener|dvdscr)\b/i;  
    var RE_TS2 = /звук\s*с\s*ts|sound\s*ts|audio\s*ts|dub\s*ts/i;  
    var RE_4K = /\b(2160p|2160р|4k|uhd|4к)\b/i;  
    var RE_HD = /\b(1080p|1080р|720p|720р|blu\-ray|bdrip|bdremux|web\-dl|webdl|web\-dlrip|webrip|hdtv|hdtvrip|hddvd|hddvdrip|fullhd|fhd|hd|hdrip)\b/i;  
    var qualityCache = Lampa.Storage.cache('quality_plugin', 200, {});  
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
        var tsCount = 0, has4K = false, hasHD = false;  
        for (var i = 0; i < titles.length; i++) {  
            var qual = getQuality(titles[i]);  
            if (qual === 'TS') tsCount++;  
            else if (qual === '4K') has4K = true;  
            else if (qual === 'HD') hasHD = true;  
        }  
        return tsCount / titles.length >= 0.5 ? 'TS' : has4K ? '4K' : hasHD ? 'HD' : null;  
    }  
    function queryJac(title, year, callback) {  
        var url = JAC_URL + encodeURIComponent(title) + (year ? '&year=' + year : '');  
        var network = new Lampa.Reguest();  
        network.silent(url, function(res) {  
            callback((res && res.Results) || []);  
        }, function() {  
            callback([]);  
        }, false);  
    }  
    function saveCache(key, value) {  
        qualityCache[key] = value;  
        Lampa.Storage.set('quality_plugin', qualityCache);  
    }  
    function fetchQuality(title, year, callback) {  
        var cacheKey = title + '|' + year;  
        if (qualityCache[cacheKey] !== undefined) return callback(qualityCache[cacheKey]);  
        queryJac(title, year, function(results) {  
            if (results.length) {  
                var titles = [];  
                for (var i = 0; i < results.length; i++) titles.push(results[i].Title);  
                var result = aggregate(titles);  
                saveCache(cacheKey, result);  
                return callback(result);  
            }  
            if (!year) {  
                saveCache(cacheKey, null);  
                return callback(null);  
            }  
            var pending = 2;  
            var allTitles = [];  
            function onFallback(res) {  
                for (var i = 0; i < res.length; i++) allTitles.push(res[i].Title);  
                pending--;  
                if (pending > 0) return;  
                var result = aggregate(allTitles);  
                saveCache(cacheKey, result);  
                callback(result);  
            }  
            queryJac(title, year - 1, onFallback);  
            queryJac(title, year + 1, onFallback);  
        });  
    }  
    function getCardInfo(card) {  
        var titleElem = card.querySelector('.card__title');  
        var yearElem = card.querySelector('.card__age');  
        if (!titleElem || !titleElem.innerText) return null;  
        var year = yearElem ? parseInt(yearElem.innerText) : null;  
        if (year && (year < 1900 || year > 2030)) return null;  
        return { title: titleElem.innerText, year: year || null };  
    }  
    function addCardBadge(card, quality) {  
        if (!Lampa.Storage.field('card_quality')) return;  
        var view = card.querySelector('.card__view');  
        if (!view) return;  
        var existing = view.querySelector('.card__quality');  
        if (existing) {  
            existing.querySelector('div').innerText = quality;  
            return;  
        }  
        var badge = document.createElement('div');  
        badge.className = 'card__quality';  
        var inner = document.createElement('div');  
        inner.innerText = quality;  
        badge.appendChild(inner);  
        view.appendChild(badge);  
    }  
    function processCard(card) {  
        var info = getCardInfo(card);  
        if (!info) return;  
        fetchQuality(info.title, info.year, function(quality) {  
            if (quality) addCardBadge(card, quality);  
        });  
    }  
    function observeCard(card) {  
        if (card._qualityObserved) return;  
        card._qualityObserved = true;  
        if (intersectionObserver) intersectionObserver.observe(card);  
        else processCard(card);  
    }  
    if (typeof IntersectionObserver !== 'undefined') {  
        intersectionObserver = new IntersectionObserver(function(entries) {  
            for (var i = 0; i < entries.length; i++) {  
                if (!entries[i].isIntersecting) continue;  
                intersectionObserver.unobserve(entries[i].target);  
                processCard(entries[i].target);  
            }  
        }, { rootMargin: '100px' });  
    }  
    cardObserver = new MutationObserver(function(mutations) {  
        for (var i = 0; i < mutations.length; i++) {  
            var nodes = mutations[i].addedNodes;  
            for (var j = 0; j < nodes.length; j++) {  
                var node = nodes[j];  
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
        var movie = e.data.movie;  
        var title = movie.title || movie.name;  
        var year = parseInt((movie.release_date || movie.first_air_date || '').substring(0, 4)) || null;  
        if (!title) return;  
        fetchQuality(title, year, function(quality) {  
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
