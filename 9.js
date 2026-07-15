(function() {
    if (window.qualityPlugin) return;
    window.qualityPlugin = true;

    var LOG = '[QualityPlugin]';

    // Только рабочие серверы, отсортированы: сначала с большим индексом, потом быстрые
    var SERVERS = [
        { url: 'https://jacred.stream/api/v2.0',  apikey: 'pp' },  // 397ms, 511 results
        { url: 'http://jacred.stream/api/v2.0',   apikey: 'pp' },  // 419ms, 511 results (http fallback)
        { url: 'http://jacred.pro/api/v2.0',      apikey: ''   },  // 343ms, 239 results
        { url: 'http://jac.red/api/v2.0',         apikey: ''   },  // 390ms, 239 results
        { url: 'https://jr.maxvol.pro/api/v2.0',  apikey: ''   },  // 872ms, 239 results
    ];

    var RE_TS  = /\b(tsrip|ts|telesync|telecine|cam|camrip|workprint|wp|scr|screener|dvdscr)\b/i;
    var RE_TS2 = /звук\s*с\s*ts|sound\s*ts|audio\s*ts|dub\s*ts/i;
    var RE_4K  = /\b(2160p|2160р|4k|uhd|4к)\b/i;
    var RE_HD  = /\b(1080p|1080р|720p|720р|blu\-ray|bdrip|bdremux|web\-dl|webdl|web\-dlrip|webrip|hdtv|hdtvrip|hddvd|hddvdrip|fullhd|fhd|hd|hdrip)\b/i;

    var qualityCache     = {};
    var qualityCacheSize = 0;
    var cacheHits        = 0;
    var cacheMisses      = 0;
    var intersectionObserver = null;

    console.log(LOG, 'Plugin initialized. Servers:', SERVERS.map(function(s) { return s.url; }));

    // ─── helpers ────────────────────────────────────────────────────────────

    function getQuality(t) {
        if (!t) return null;
        if (RE_TS.test(t) || RE_TS2.test(t)) return 'TS';
        if (RE_4K.test(t)) return '4K';
        if (RE_HD.test(t)) return 'HD';
        return null;
    }

    function aggregate(titles, label) {
        var ts = 0, k4 = 0, hd = 0, none = 0;
        for (var i = 0; i < titles.length; i++) {
            var q = getQuality(titles[i]);
            if      (q === 'TS') ts++;
            else if (q === '4K') k4++;
            else if (q === 'HD') hd++;
            else                 none++;
            console.log(LOG, '  [' + label + '] "' + titles[i] + '" → ' + (q || 'null'));
        }
        var total  = titles.length;
        var tsPct  = total ? Math.round(ts / total * 100) : 0;
        var result = tsPct >= 50 ? 'TS' : k4 ? '4K' : hd ? 'HD' : null;
        console.log(LOG, '  [' + label + '] STATS total=' + total
            + ' TS=' + ts + '(' + tsPct + '%) 4K=' + k4 + ' HD=' + hd + ' none=' + none
            + ' → RESULT: ' + result);
        return result;
    }

    function setQualityCache(key, value) {
        if (qualityCacheSize > 200) {
            console.log(LOG, 'Cache cleared (limit 200). Hits so far: ' + cacheHits);
            qualityCache = {};
            qualityCacheSize = 0;
        }
        qualityCache[key] = value;
        qualityCacheSize++;
    }

    // ─── поиск по названию + год ±1 ─────────────────────────────────────────

    function searchByTitle(title, targetYear, cacheKey, callback) {
        console.log(LOG, '── searchByTitle START title="' + title + '" year=' + targetYear + ' ──');
        var i = 0;
        var titles = [];
        var serverStats = [];
        var network = new Lampa.Reguest();

        function done() {
            console.log(LOG, '── searchByTitle DONE title="' + title
                + '" total titles=' + titles.length
                + ' servers: ' + JSON.stringify(serverStats) + ' ──');
            var result = aggregate(titles, 'title');
            if (cacheKey) setQualityCache(cacheKey, result);
            callback(result);
        }

        function next() {
            if (i >= SERVERS.length) return done();
            var srv = SERVERS[i];
            var url = srv.url + '/indexers/all/results'
                + '?apikey=' + encodeURIComponent(srv.apikey)
                + '&Query=' + encodeURIComponent(title)
                + (targetYear ? '&year=' + targetYear : '');
            var serverIdx = i;
            console.log(LOG, 'searchByTitle: → server[' + serverIdx + '] ' + url);
            network.silent(url, function(res) {
                var results = (res && res.Results) || [];
                var accepted = 0, skipped = 0;
                serverStats.push({ server: srv.url, count: results.length, ok: true });
                console.log(LOG, 'searchByTitle: ← server[' + serverIdx + '] '
                    + results.length + ' raw results');
                for (var ri = 0; ri < results.length; ri++) {
                    var r = results[ri];
                    var y = parseInt((r.info && r.info.released) || r.year);
                    var yearMatch = !targetYear || (y && Math.abs(y - targetYear) <= 1);
                    var inTitle   = !targetYear || (r.Title && (
                        r.Title.includes(String(targetYear)) ||
                        r.Title.includes(String(targetYear - 1)) ||
                        r.Title.includes(String(targetYear + 1))
                    ));
                    if (yearMatch || (!y && inTitle)) {
                        console.log(LOG, '  ✓ accepted [s' + serverIdx + ']: "'
                            + r.Title + '" year=' + (isNaN(y) ? 'NaN' : y));
                        titles.push(r.Title);
                        accepted++;
                    } else {
                        console.log(LOG, '  ✗ skipped  [s' + serverIdx + ']: "'
                            + r.Title + '" year=' + y + ' (target=' + targetYear + ')');
                        skipped++;
                    }
                }
                console.log(LOG, 'searchByTitle: server[' + serverIdx + '] accepted='
                    + accepted + ' skipped=' + skipped);
                i++; next();
            }, function(err) {
                serverStats.push({ server: srv.url, count: 0, ok: false,
                    error: (err && err.decode_error) || 'unknown' });
                console.warn(LOG, 'searchByTitle: ✗ server[' + serverIdx + '] error: '
                    + ((err && err.decode_error) || JSON.stringify(err)));
                i++; next();
            });
        }

        next();
    }

    // ─── главная функция ─────────────────────────────────────────────────────

    function fetchQuality(data, callback) {
        var key = data.id;
        if (key && qualityCache[key] !== undefined) {
            cacheHits++;
            console.log(LOG, 'CACHE HIT id=' + key + ' → ' + qualityCache[key]
                + ' (hits=' + cacheHits + ' misses=' + cacheMisses
                + ' size=' + qualityCacheSize + ')');
            return callback(qualityCache[key]);
        }
        cacheMisses++;

        var title      = data.title || data.name;
        var targetYear = parseInt((data.release_date || data.first_air_date || '').substring(0, 4)) || null;

        console.log(LOG, '════ fetchQuality id=' + key
            + ' title="' + title + '" year=' + targetYear
            + ' [hits=' + cacheHits + ' misses=' + cacheMisses + '] ════');

        if (!title) {
            console.warn(LOG, 'fetchQuality: no title, skipping id=' + key);
            return callback(null);
        }

        searchByTitle(title, targetYear, key, callback);
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
            var html    = e.object.activity.render();
            var details = html.find('.full-start-new__details');
            if (!details.length) return;

            var label       = Lampa.Lang.translate('player_quality');
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
            console.log(LOG, 'app destroy: disconnecting. Final stats: hits='
                + cacheHits + ' misses=' + cacheMisses + ' cacheSize=' + qualityCacheSize);
            if (intersectionObserver) intersectionObserver.disconnect();
            cardObserver.disconnect();
        }
    });

    if (window.appready) {
        console.log(LOG, 'appready already set: scanning existing cards');
        [].forEach.call(document.querySelectorAll('.card'), observeCard);
    }
})();
