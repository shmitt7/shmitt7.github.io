(function() {  
    if (window.qualityPlugin) return;  
    window.qualityPlugin = true;  
  
    var SERVER = 'http://jac.red';  
    var RE_TS  = /\b(tsrip|ts|telesync|telecine|cam|camrip|workprint|wp|scr|screener|dvdscr)\b/i;  
    var RE_TS2 = /звук\s*с\s*ts|sound\s*ts|audio\s*ts|dub\s*ts/i;  
    var RE_4K  = /\b(2160p|2160р|4k|uhd|4к)\b/i;  
    var RE_HD  = /\b(1080p|1080р|720p|720р|blu\-ray|bdrip|bdremux|web\-dl|webdl|web\-dlrip|webrip|hdtv|hdtvrip|hddvd|hddvdrip|fullhd|fhd|hd|hdrip)\b/i;  
  
    var network          = new Lampa.Reguest();  
    var qualityCache     = {};  
    var qualityCacheSize = 0;  
    var intersectionObserver = null;  
  
    function isEnabled() {  
        return Lampa.Storage.field('card_quality');  
    }  
  
    function getQuality(t) {  
        if (!t) return null;  
        if (RE_TS.test(t) || RE_TS2.test(t)) return 'TS';  
        if (RE_4K.test(t)) return '4K';  
        if (RE_HD.test(t)) return 'HD';  
        return null;  
    }  
  
    function setQualityCache(key, value) {  
        if (qualityCacheSize > 200) { qualityCache = {}; qualityCacheSize = 0; }  
        qualityCache[key] = value;  
        qualityCacheSize++;  
    }  
  
    function fetchQuality(data, callback) {  
        var key = data.id;  
        if (key && qualityCache[key] !== undefined) return callback(qualityCache[key]);  
  
        var title      = data.title || data.name;  
        var targetYear = parseInt((data.release_date || data.first_air_date || '').substring(0, 4)) || null;  
        var titles     = [];  
  
        var url = SERVER + '/api/v2.0/indexers/all/results?apikey=&Query='  
            + encodeURIComponent(title)  
            + (targetYear ? '&year=' + targetYear : '');  
  
        network.silent(url, function(res) {  
            var results = (res && res.Results) || [];  
            for (var ri = 0; ri < results.length; ri++) {  
                var r      = results[ri];  
                var y      = parseInt((r.info && r.info.released) || r.year);  
                var inTitle = !targetYear || (r.Title && (  
                    r.Title.includes(String(targetYear)) ||  
                    r.Title.includes(String(targetYear - 1)) ||  
                    r.Title.includes(String(targetYear + 1))  
                ));  
                if ((y && Math.abs(y - targetYear) <= 1) || (!y && inTitle)) titles.push(r.Title);  
            }  
            done();  
        }, function() { done(); });  
  
        function done() {  
            if (!titles.length) {  
                if (key) setQualityCache(key, null);  
                return callback(null);  
            }  
            var ts = 0, has4K = false, hasHD = false;  
            for (var ti = 0; ti < titles.length; ti++) {  
                var q = getQuality(titles[ti]);  
                if (q === 'TS')      ts++;  
                else if (q === '4K') has4K = true;  
                else if (q === 'HD') hasHD = true;  
            }  
            var result = ts / titles.length >= 0.5 ? 'TS' : has4K ? '4K' : hasHD ? 'HD' : null;  
            if (key) setQualityCache(key, result);  
            callback(result);  
        }  
    }  
  
    // --- Карточка в списке ---  
    function processCardQuality(card) {  
        if (!isEnabled()) return;  
        var d = card.card_data;  
        if (!d || !d.id) return;  
        fetchQuality(d, function(q) {  
            if (!q) return;  
            var view = card.querySelector('.card__view');  
            if (!view) return;  
            [].forEach.call(view.querySelectorAll('.card__quality'), function(el) { el.remove(); });  
            var badge = document.createElement('div');  
            badge.className = 'card__quality';  
            var inner = document.createElement('div');  
            inner.textContent = q;  
            badge.appendChild(inner);  
            view.appendChild(badge);  
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
  
    // --- Полная карточка ---  
    Lampa.Listener.follow('full', function(e) {  
        if (e.type !== 'complite' || !e.data || !e.data.movie) return;  
        if (!isEnabled()) return;  
  
        fetchQuality(e.data.movie, function(q) {  
            if (!q) return;  
            var html = e.object.activity.render();  
  
            // 1. Жёлтый бейдж в строке рейтингов (новый шаблон full_start_new)  
            var rateLine = html.find('.full-start-new__rate-line');  
            if (rateLine.length) {  
                rateLine.find('.tag--quality').remove();  
                var badge = document.createElement('div');  
                badge.className = 'full-start__tag tag--quality';  
                var inner = document.createElement('div');  
                inner.textContent = q;  
                badge.appendChild(inner);  
                rateLine[0].appendChild(badge);  
            }  
  
            // 2. Текст "Качество: TS" в строке деталей после жанров  
            var details = html.find('.full-start-new__details');  
            if (details.length) {  
                details.find('.plugin--quality-text').remove();  
                var span = document.createElement('span');  
                span.className = 'plugin--quality-text';  
                // добавляем разделитель ● как в стандартном коде  
                span.innerHTML = '<span class="full-start-new__split">\u25CF</span>Качество: ' + q;  
                details[0].appendChild(span);  
            }  
  
            // 3. Старый шаблон full_start — бейдж в .full-start__tags  
            var tags = html.find('.full-start__tags');  
            if (tags.length) {  
                tags.find('.tag--quality').remove();  
                var badge2 = document.createElement('div');  
                badge2.className = 'full-start__tag tag--quality';  
                var inner2 = document.createElement('div');  
                inner2.textContent = q;  
                badge2.appendChild(inner2);  
                tags[0].appendChild(badge2);  
            }  
        });  
    });  
  
    Lampa.Listener.follow('app', function(e) {  
        if (e.type === 'ready')   [].forEach.call(document.querySelectorAll('.card'), observeCard);  
        if (e.type === 'destroy') {  
            if (intersectionObserver) intersectionObserver.disconnect();  
            cardObserver.disconnect();  
        }  
    });  
  
    if (window.appready) [].forEach.call(document.querySelectorAll('.card'), observeCard);  
})();
