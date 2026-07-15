(function() {  
    if (window.qualityPlugin) return;  
    window.qualityPlugin = true;  
  
    var SERVERS = ['https://jac.red', 'https://jr.maxvol.pro'];  
    var RE_TS  = /\b(ts|telesync|telecine|cam|camrip|workprint|wp|scr|screener|dvdscr)\b/i;  
    var RE_TS2 = /звук\s*с\s*ts|sound\s*ts|audio\s*ts|dub\s*ts/i;  
    var RE_4K  = /\b(2160p|2160р|4k|uhd|4к)\b/i;  
    var RE_HD  = /\b(1080p|1080р|720p|720р|blu\-ray|bdrip|bdremux|web\-dl|webdl|web\-dlrip|webrip|hdtv|hdtvrip|hddvd|hddvdrip|fullhd|fhd|hd|hdrip)\b/i;  
  
    var qualityCache = {};  
    var qualityCacheSize = 0;  
    var intersectionObserver = null;  
  
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
  
    // ИСПРАВЛЕНИЕ 1: новый Reguest для каждого запроса — не прерывает параллельные  
    function fetchQuality(data, callback) {  
        var key = data.id;  
        if (key && qualityCache[key] !== undefined) return callback(qualityCache[key]);  
  
        var title = data.title || data.name;  
        var targetYear = parseInt((data.release_date || data.first_air_date || '').substring(0, 4)) || null;  
        var i = 0, titles = [];  
        var network = new Lampa.Reguest(); // отдельный экземпляр на каждый вызов  
  
        function done() {  
            if (!titles.length) { if (key) setQualityCache(key, null); return callback(null); }  
            var ts = 0, has4K = false, hasHD = false;  
            for (var ti = 0; ti < titles.length; ti++) {  
                var q = getQuality(titles[ti]);  
                if (q === 'TS') ts++;  
                else if (q === '4K') has4K = true;  
                else if (q === 'HD') hasHD = true;  
            }  
            var r = ts / titles.length >= 0.5 ? 'TS' : has4K ? '4K' : hasHD ? 'HD' : null;  
            if (key) setQualityCache(key, r);  
            callback(r);  
        }  
  
        function next() {  
            if (i >= SERVERS.length) return done();  
            var url = SERVERS[i] + '/api/v2.0/indexers/all/results?apikey=&Query='  
                + encodeURIComponent(title) + (targetYear ? '&year=' + targetYear : '');  
            network.silent(url, function(res) {  
                var results = (res && res.Results) || [];  
                for (var ri = 0; ri < results.length; ri++) {  
                    var r = results[ri];  
                    var y = parseInt((r.info && r.info.released) || r.year);  
                    var inTitle = !targetYear || (r.Title && r.Title.includes(String(targetYear)));  
                    if ((y && y === targetYear) || (!y && inTitle)) titles.push(r.Title);  
                }  
                i++; next();  
            }, function() { i++; next(); });  
        }  
  
        next();  
    }  
  
    // КАРТОЧКА В СПИСКЕ  
    // ИСПРАВЛЕНИЕ 2: проверяем настройку card_quality  
    // ИСПРАВЛЕНИЕ 3: убрана проверка !d.original_name — работает и для сериалов  
    // Обновляем существующий .card__quality или создаём новый (точно как Lampa)  
    function processCardQuality(card) {  
        if (!Lampa.Storage.field('card_quality')) return;  
        var d = card.card_data;  
        if (!d || !d.id) return;  
        fetchQuality(d, function(q) {  
            if (!q) return;  
            var view = card.querySelector('.card__view');  
            if (!view) return;  
            var existing = view.querySelector('.card__quality');  
            if (existing) {  
                // Обновляем текст в уже существующем стандартном элементе  
                var inner = existing.querySelector('div');  
                if (inner) inner.textContent = q;  
            } else {  
                // Создаём точно так же как Lampa (icons.js)  
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
  
    // ПОЛНАЯ КАРТОЧКА  
    // ИСПРАВЛЕНИЕ 4: обновляем .full-start-new__details как стандартный Lampa (start.js строка 133)  
    // Убрана проверка first_air_date — работает и для сериалов  
    // Убран жёлтый бейдж — используем текстовую строку деталей  
    Lampa.Listener.follow('full', function(e) {  
        if (e.type !== 'complite' || !e.data || !e.data.movie) return;  
        fetchQuality(e.data.movie, function(q) {  
            if (!q) return;  
            var html = e.object.activity.render();  
            var details = html.find('.full-start-new__details');  
            if (!details.length) return;  
  
            // Используем тот же ключ перевода что и Lampa (start.js строка 133)  
            var label = Lampa.Lang.translate('player_quality');  
            var qualityText = label + ': ' + q.toUpperCase();  
  
            // Ищем уже существующий span с качеством (добавленный Lampa или нами ранее)  
            var found = false;  
            details.find('span').not('.full-start-new__split').each(function() {  
                if (this.textContent.indexOf(label + ':') === 0) {  
                    this.textContent = qualityText;  
                    found = true;  
                    return false; // break  
                }  
            });  
  
            if (!found) {  
                // Добавляем разделитель и span — точно как Lampa формирует info (start.js строка 155)  
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
            cardObserver.disconnect();  
        }  
    });  
  
    if (window.appready) [].forEach.call(document.querySelectorAll('.card'), observeCard);  
})();
