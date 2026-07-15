(function() {  
    if (window.qualityPlugin) return;  
    window.qualityPlugin = true;  
    var SERVERS = [  
        { url: 'http://jac.red/api/v2.0', apikey: '' },  
        { url: 'https://jr.maxvol.pro/api/v2.0', apikey: '' }  
    ];  
    var RE_TS = /\b(tsrip|ts|telesync|telecine|cam|camrip|workprint|wp|scr|screener|dvdscr)\b/i;  
    var RE_TS2 = /звук\s*с\s*ts|sound\s*ts|audio\s*ts|dub\s*ts/i;  
    var RE_4K = /\b(2160p|2160р|4k|uhd|4к)\b/i;  
    var RE_HD = /\b(1080p|1080р|720p|720р|blu\-ray|bdrip|bdremux|web\-dl|webdl|web\-dlrip|webrip|hdtv|hdtvrip|hddvd|hddvdrip|fullhd|fhd|hd|hdrip)\b/i;  
    var qualityCache = {};  
    var qualityCacheSize = 0;  
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
        var ts = 0, has4K = false, hasHD = false;  
        for (var i = 0; i < titles.length; i++) {  
            var q = getQuality(titles[i]);  
            if (q === 'TS') ts++;  
            else if (q === '4K') has4K = true;  
            else if (q === 'HD') hasHD = true;  
        }  
        if (!titles.length) return null;  
        return ts / titles.length >= 0.5 ? 'TS' : has4K ? '4K' : hasHD ? 'HD' : null;  
    }  
    function setQualityCache(key, value) {  
        if (qualityCacheSize > 200) {  
            qualityCache = {};  
            qualityCacheSize = 0;  
        }  
        qualityCache[key] = value;  
        qualityCacheSize++;  
    }  
    function fetchQuality(data, callback) {  
        var key = data.id;  
        if (key && qualityCache[key] !== undefined) return callback(qualityCache[key]);  
        var title = data.title || data.name;  
        var targetYear = parseInt((data.release_date || data.first_air_date || '').substring(0, 4)) || null;  
        if (!title) return callback(null);  
        var pending = SERVERS.length;  
        var allTitles = [];  
        function onServerDone() {  
            pending--;  
            if (pending > 0) return;  
            var result = aggregate(allTitles);  
            if (key) setQualityCache(key, result);  
            callback(result);  
        }  
        SERVERS.forEach(function(srv) {  
            var network = new Lampa.Reguest();  
            var url = srv.url + '/indexers/all/results'  
                + '?apikey=' + encodeURIComponent(srv.apikey)  
                + '&Query=' + encodeURIComponent(title)  
                + (targetYear ? '&year=' + targetYear : '');  
            network.silent(url, function(res) {  
                var results = (res && res.Results) || [];  
                for (var ri = 0; ri < results.length; ri++) {  
                    var r = results[ri];  
                    var y = parseInt((r.info && r.info.released) || r.year);  
                    var yearMatch = !targetYear || (y && y === targetYear);  
                    var inTitle = !targetYear || (r.Title && r.Title.indexOf(String(targetYear)) !== -1);  
                    if (yearMatch || (!y && inTitle)) allTitles.push(r.Title);  
                }  
                onServerDone();  
            }, function() {  
                onServerDone();  
            });  
        });  
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
        var movie = e.data.movie;  
        fetchQuality(movie, function(quality) {  
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
