(function() {  
    if (window.qualityPlugin) return;  
    window.qualityPlugin = true;  
    var JAC_URL = 'http://jac.red/api/v2.0/indexers/all/results?apikey=';  
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
        var tsCount = 0, has4K = false, hasHD = false;  
        for (var i = 0; i < titles.length; i++) {  
            var quality = getQuality(titles[i]);  
            if (quality === 'TS') tsCount++;  
            else if (quality === '4K') has4K = true;  
            else if (quality === 'HD') hasHD = true;  
        }  
        if (tsCount / titles.length >= 0.5) return 'TS';  
        if (has4K) return '4K';  
        if (hasHD) return 'HD';  
        return null;  
    }  
    function isMediaCard(data) {  
        return !!(data && (data.release_date || data.first_air_date));  
    }  
    function collectTitles(results, expectedYear) {  
        var titles = [];  
        for (var i = 0; i < results.length; i++) {  
            var result = results[i];  
            if (!result.Title) continue;  
            var resultYear = parseInt((result.info && result.info.released) || result.year);  
            var inTitle = !expectedYear || (result.Title.indexOf(String(expectedYear)) !== -1);  
            if ((resultYear && resultYear === expectedYear) || (!resultYear && inTitle)) {  
                titles.push(result.Title);  
            }  
        }  
        return titles;  
    }  
    function fetchQuality(data, callback) {  
        var title = data.title || data.name;  
        var year = parseInt((data.release_date || data.first_air_date || '').substring(0, 4)) || null;  
        if (!title) return callback(null);  
        var pending = year ? 2 : 1;  
        var allTitles = [];  
        function onDone() {  
            pending--;  
            if (pending > 0) return;  
            callback(aggregate(allTitles));  
        }  
        var query = encodeURIComponent(title);  
        var network1 = new Lampa.Reguest();  
        network1.silent(  
            JAC_URL + '&Query=' + query + (year ? '&year=' + year : ''),  
            function(res) {  
                var results = (res && res.Results) || [];  
                var found = collectTitles(results, year);  
                for (var i = 0; i < found.length; i++) allTitles.push(found[i]);  
                onDone();  
            },  
            function() { onDone(); },  
            false  
        );  
        if (year) {  
            var network2 = new Lampa.Reguest();  
            network2.silent(  
                JAC_URL + '&Query=' + query + '&year=' + (year - 1),  
                function(res) {  
                    var results = (res && res.Results) || [];  
                    var found = collectTitles(results, year - 1);  
                    for (var i = 0; i < found.length; i++) allTitles.push(found[i]);  
                    onDone();  
                },  
                function() { onDone(); },  
                false  
            );  
        }  
    }  
    function processCardQuality(card) {  
        if (!Lampa.Storage.field('card_quality')) return;  
        var cardData = card.card_data;  
        if (!cardData || !isMediaCard(cardData)) return;  
        fetchQuality(cardData, function(quality) {  
            if (!quality) return;  
            var view = card.querySelector('.card__view');  
            if (!view) return;  
            var existing = view.querySelector('.card__quality');  
            if (existing) {  
                var inner = existing.querySelector('div');  
                if (inner) inner.innerText = quality;  
                return;  
            }  
            var badge = document.createElement('div');  
            badge.classList.add('card__quality');  
            var badgeInner = document.createElement('div');  
            badgeInner.innerText = quality;  
            badge.appendChild(badgeInner);  
            view.appendChild(badge);  
        });  
    }  
    function observeCard(card) {  
        if (!card.card_data || !isMediaCard(card.card_data)) return;  
        if (intersectionObserver) {  
            intersectionObserver.observe(card);  
        } else {  
            processCardQuality(card);  
        }  
    }  
    if (typeof IntersectionObserver !== 'undefined') {  
        intersectionObserver = new IntersectionObserver(function(entries) {  
            for (var i = 0; i < entries.length; i++) {  
                var entry = entries[i];  
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
        var movie = e.data.movie;  
        if (!isMediaCard(movie)) return;  
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
