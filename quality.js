(function() {  
    if (window.qualityPlugin) return;  
    window.qualityPlugin = true;  
    var JAC_URL = 'http://jac.red/api/v2.0/indexers/all/results?apikey=&Query=';  
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
            var q = getQuality(titles[i]);  
            if (q === 'TS') tsCount++;  
            else if (q === '4K') has4K = true;  
            else if (q === 'HD') hasHD = true;  
        }  
        return tsCount / titles.length >= 0.5 ? 'TS' : has4K ? '4K' : hasHD ? 'HD' : null;  
    }  
    function fetchQuality(title, year, callback) {  
        if (!title) return callback(null);  
        var pending = year ? 2 : 1;  
        var allTitles = [];  
        function onDone(results) {  
            for (var i = 0; i < results.length; i++) {  
                if (results[i].Title) allTitles.push(results[i].Title);  
            }  
            pending--;  
            if (pending > 0) return;  
            callback(aggregate(allTitles));  
        }  
        var net1 = new Lampa.Reguest();  
        net1.silent(  
            JAC_URL + encodeURIComponent(title) + (year ? '&year=' + year : ''),  
            function(res) { onDone((res && res.Results) || []); },  
            function() { onDone([]); },  
            false  
        );  
        if (year) {  
            var net2 = new Lampa.Reguest();  
            net2.silent(  
                JAC_URL + encodeURIComponent(title) + '&year=' + (year - 1),  
                function(res) { onDone((res && res.Results) || []); },  
                function() { onDone([]); },  
                false  
            );  
        }  
    }  
    function getCardInfo(card) {  
        var titleElem = card.querySelector('.card__title');  
        var yearElem = card.querySelector('.card__age');  
        if (!titleElem || !titleElem.innerText) return null;  
        var year = yearElem ? parseInt(yearElem.innerText) || null : null;  
        if (year && (year < 1900 || year > 2030)) year = null;  
        return { title: titleElem.innerText, year: year };  
    }  
    function processCardQuality(card, info) {  
        if (!Lampa.Storage.field('card_quality')) return;  
        if (card.querySelector('.card__quality')) return;  
        fetchQuality(info.title, info.year, function(quality) {  
            if (!quality) return;  
            if (card.querySelector('.card__quality')) return;  
            var cardView = card.querySelector('.card__view');  
            if (!cardView) return;  
            var badge = document.createElement('div');  
            badge.className = 'card__quality';  
            var inner = document.createElement('div');  
            inner.innerText = quality;  
            badge.appendChild(inner);  
            cardView.appendChild(badge);  
        });  
    }  
    function observeCard(card) {  
        if (card._qualityObserved) return;  
        card._qualityObserved = true;  
        if (intersectionObserver) {  
            intersectionObserver.observe(card);  
        } else {  
            var info = getCardInfo(card);  
            if (info) processCardQuality(card, info);  
        }  
    }  
    if (typeof IntersectionObserver !== 'undefined') {  
        intersectionObserver = new IntersectionObserver(function(entries) {  
            for (var i = 0; i < entries.length; i++) {  
                if (entries[i].isIntersecting) {  
                    var card = entries[i].target;  
                    intersectionObserver.unobserve(card);  
                    var info = getCardInfo(card);  
                    if (info) processCardQuality(card, info);  
                }  
            }  
        }, { threshold: 0.1 });  
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
