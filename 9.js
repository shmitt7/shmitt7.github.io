(function () {  
    if (window.customCardPlugin) return;  
    window.customCardPlugin = true;  
  
    // ─── CSS ────────────────────────────────────────────────────────────────  
    document.head.insertAdjacentHTML('beforeend', `<style>  
        /* Скрываем стандартные элементы под постером */  
        .card__title { display: none !important; }  
        .card__age   { display: none !important; }  
  
        /* Скрываем стандартные бейджи */  
        .card__type    { display: none !important; }  
        .card__quality { display: none !important; }  
        .card__vote    { display: none !important; }  
  
        /* Убираем список эпизодов при фокусе */  
        .card.focus .card-watched { display: none !important; }  
  
        /* Иконки — правый верх, без фона */  
        .card__icons {  
            top: 0.5em !important;  
            left: auto !important;  
            right: 0.5em !important;  
            justify-content: flex-end !important;  
        }  
        .card__icons-inner {  
            background: none !important;  
            border-radius: 0 !important;  
            flex-direction: column !important;  
            gap: 0.2em;  
        }  
        /* Затемнение ТОЛЬКО когда есть иконки */  
        .card__icons-inner:not(:empty) {  
            background: rgba(0,0,0,0.55) !important;  
            border-radius: 0.5em !important;  
            padding: 0.15em 0.2em !important;  
        }  
  
        /* Оверлей поверх постера */  
        .card__overlay {  
            position: absolute;  
            left: 0; right: 0; bottom: 0;  
            padding: 3em 0.7em 0.6em 0.7em;  
            background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.9) 100%);  
            border-bottom-left-radius: 1em;  
            border-bottom-right-radius: 1em;  
            z-index: 1;  
            pointer-events: none;  
        }  
  
        /* Название — макс 2 строки, увеличенный размер */  
        .card__overlay-title {  
            font-size: 1.25em;  
            line-height: 1.3;  
            color: #fff;  
            overflow: hidden;  
            text-overflow: ellipsis;  
            display: -webkit-box;  
            -webkit-line-clamp: 2;  
                    line-clamp: 2;  
            -webkit-box-orient: vertical;  
            margin-bottom: 0.35em;  
        }  
  
        /* Бейдж */  
        .card__badge {  
            display: flex;  
            align-items: center;  
            width: 100%;  
            gap: 0.3em;  
            overflow: hidden;  
        }  
        .card__badge-year,  
        .card__badge-sep {  
            font-size: 0.85em;  
            color: #aaa;  
            flex-shrink: 0;  
            white-space: nowrap;  
        }  
        .card__badge-genre {  
            font-size: 0.85em;  
            color: #aaa;  
            overflow: hidden;  
            text-overflow: ellipsis;  
            white-space: nowrap;  
            flex: 1;  
            min-width: 0;  
        }  
        .card__badge-quality,  
        .card__badge-rating {  
            font-size: 1em;  
            font-weight: 700;  
            color: #ddd;  
            flex-shrink: 0;  
            white-space: nowrap;  
        }  
    </style>`);  
  
    // ─── Постер без надписей с TMDB ─────────────────────────────────────────  
    var posterCache = {};  
    var posterNet   = new Lampa.Reguest();  
  
    function fetchCleanPoster(data, img) {  
        var id   = data.id;  
        var type = data.name ? 'tv' : 'movie';  
        if (!id) return;  
        if (posterCache[id] === null) return;  
        if (posterCache[id]) { img.src = posterCache[id]; return; }  
  
        // Используем Lampa.TMDB.api() — он сам подставит прокси/email  
        // api_key берём из Lampa или используем публичный  
        var key = (Lampa.TMDB && Lampa.TMDB.key && Lampa.TMDB.key()) || '4ef0d7355d9ffb5151e987764708ce96';  
        var url = Lampa.TMDB.api(type + '/' + id + '/images?include_image_language=null&api_key=' + key);  
  
        posterNet.silent(url, function (res) {  
            var posters = (res && res.posters) || [];  
            // Сортируем по рейтингу, берём лучший  
            posters.sort(function (a, b) { return b.vote_average - a.vote_average; });  
            if (posters.length) {  
                var src = Lampa.TMDB.image('t/p/w342' + posters[0].file_path);  
                posterCache[id] = src;  
                img.src = src;  
            } else {  
                posterCache[id] = null;  
            }  
        }, function () {  
            posterCache[id] = null;  
        });  
    }  
  
    // ─── Жанры ──────────────────────────────────────────────────────────────  
    var allGenres = {  
        28:'Боевик', 12:'Приключения', 35:'Комедия', 80:'Криминал',  
        18:'Драма', 10751:'Семейный', 14:'Фэнтези', 36:'История',  
        27:'Ужасы', 10402:'Музыка', 9648:'Детектив', 10749:'Мелодрама',  
        878:'Фантастика', 10770:'Телефильм', 53:'Триллер', 10752:'Военный',  
        37:'Вестерн', 10759:'Экшен', 10762:'Детский',  
        10765:'НФ и Фэнтези', 10768:'Война и Политика'  
    };  
  
    function getLabel(d) {  
        if (!d || d.profile_path !== undefined || d.known_for_department) return '';  
        var isTv = !!d.name;  
        var ids  = Array.isArray(d.genres)  
            ? d.genres.map(function (g) { return (g && typeof g === 'object') ? g.id : g; })  
            : (d.genre_ids || []);  
        var isAnim = ids.indexOf(16) !== -1;  
        if (isAnim && d.original_language === 'ja') return 'Аниме';  
        if (ids.indexOf(10763) !== -1) return 'Новости';  
        if (ids.indexOf(10767) !== -1) return 'Ток-шоу';  
        if (ids.indexOf(10764) !== -1) return 'Реалити-шоу';  
        if (ids.indexOf(99)    !== -1) return 'Документальный';  
        if (ids.indexOf(10766) !== -1) return 'Мыльная опера';  
        if (isAnim) return isTv ? 'Мультсериал' : 'Мультфильм';  
        return allGenres[ids[0]] || (isTv ? 'Сериал' : 'Фильм');  
    }  
  
    // ─── Качество ───────────────────────────────────────────────────────────  
    var SERVERS = ['http://jac.red', 'https://jr.maxvol.pro'];  
    var RE_TS   = /\b(tsrip|ts|telesync|telecine|cam|camrip|workprint|wp|scr|screener|dvdscr|dcprip)\b/i;  
    var RE_TS2  = /звук\s*с\s*ts|sound\s*ts|audio\s*ts|dub\s*ts/i;  
    var RE_4K   = /\b(2160p|2160р|4k|uhd|4к)\b/i;  
    var RE_HD   = /\b(1080p|1080р|720p|720р|blu\-ray|bdrip|bdremux|web\-dl|webdl|web\-dlrip|webrip|hdtv|hdtvrip|hddvd|hddvdrip|fullhd|fhd|hd|hdrip)\b/i;  
    var qNet    = new Lampa.Reguest();  
    var qCache  = {}, qCacheSize = 0;  
  
    function qFromStr(t) {  
        if (!t) return null;  
        if (RE_TS.test(t) || RE_TS2.test(t)) return 'TS';  
        if (RE_4K.test(t)) return '4K';  
        if (RE_HD.test(t)) return 'HD';  
        return null;  
    }  
    function setQCache(key, val) {  
        if (qCacheSize > 200) { qCache = {}; qCacheSize = 0; }  
        qCache[key] = val; qCacheSize++;  
    }  
  
    function fetchQuality(data, cb) {  
        var lampaQ = data.quality || data.release_quality;  
        var key    = data.id;  
        if (key && qCache[key] !== undefined) return cb(qCache[key]);  
  
        var title = data.title || data.name;  
        var yr    = parseInt((data.release_date || data.first_air_date || '').slice(0, 4)) || null;  
        var i = 0, titles = [];  
  
        function done() {  
            var r = null;  
            if (titles.length) {  
                var ts = 0, has4K = false, hasHD = false;  
                titles.forEach(function (t) {  
                    var q = qFromStr(t);  
                    if (q === 'TS') ts++;  
                    else if (q === '4K') has4K = true;  
                    else if (q === 'HD') hasHD = true;  
                });  
                r = ts / titles.length >= 0.5 ? 'TS' : has4K ? '4K' : hasHD ? 'HD' : null;  
            }  
            // Фолбэк на данные Lampa  
            if (!r && lampaQ) r = qFromStr(lampaQ) || lampaQ.toUpperCase();  
            if (key) setQCache(key, r);  
            cb(r);  
        }  
        function next() {  
            if (i >= SERVERS.length) return done();  
            var url = SERVERS[i] + '/api/v2.0/indexers/all/results?apikey=&Query='  
                + encodeURIComponent(title) + (yr ? '&year=' + yr : '');  
            qNet.silent(url, function (res) {  
                (res && res.Results || []).forEach(function (r) {  
                    var y   = parseInt((r.info && r.info.released) || r.year);  
                    var inT = !yr || (r.Title && (  
                        r.Title.includes(String(yr)) ||  
                        r.Title.includes(String(yr - 1)) ||  
                        r.Title.includes(String(yr + 1))  
                    ));  
                    if ((y && Math.abs(y - yr) <= 1) || (!y && inT)) titles.push(r.Title);  
                });  
                i++; next();  
            }, function () { i++; next(); });  
        }  
        next();  
    }  
  
    // ─── Рейтинг ────────────────────────────────────────────────────────────  
    var TTL_OK  = 15 * 24 * 60 * 60 * 1000;  
    var TTL_ERR =      24 * 60 * 60 * 1000;  
    var TTL_SRC =       3 * 60 * 60 * 1000;  
    var KP_KEY  = '14342b35-714b-449d-bf10-30d0d9ac22e6';  
    var rNet    = new Lampa.Reguest();  
    var rCache  = Lampa.Storage.cache('ccp_kp_rating', 500, {});  
  
    function getRCache(id, type) {  
        var key  = type === 'search' ? 'search_' + id : id;  
        var item = rCache[key];  
        if (!item) return null;  
        var ttl  = type === 'search' ? TTL_SRC : item.kp === 0 ? TTL_ERR : TTL_OK;  
        return (Date.now() - item.timestamp) < ttl ? item : null;  
    }  
    function setRCache(id, data, type) {  
        var key = type === 'search' ? 'search_' + id : id;  
        rCache[key] = Object.assign({}, data, { timestamp: Date.now() });  
        Lampa.Storage.set('ccp_kp_rating', rCache);  
    }  
  
    function fromKpApi(id, card, cb) {  
        var tmdb = card.vote_average || 0;  
        rNet.silent('https://kinopoiskapiunofficial.tech/api/v2.2/films/' + id,  
            function (d) { var kp = d.ratingKinopoisk || 0; setRCache(card.id, { kp: kp, tmdb: tmdb }); cb(kp, tmdb); },  
            function ()  { setRCache(card.id, { kp: 0, tmdb: tmdb }); cb(0, tmdb); },  
            false, { timeout: 3000, headers: { 'X-API-KEY': KP_KEY } }  
        );  
    }  
    function fromKpXml(id, card, cb) {  
        var tmdb = card.vote_average || 0;  
        rNet.silent('https://rating.kinopoisk.ru/' + id + '.xml',  
            function (str) {  
                if (str && str.includes('<rating>')) {  
                    try {  
                        var kp = parseFloat($($.parseXML(str)).find('kp_rating').text()) || 0;  
                        if (kp > 0) { setRCache(card.id, { kp: kp, tmdb: tmdb }); cb(kp, tmdb); return; }  
                    } catch (e) {}  
                }  
                fromKpApi(id, card, cb);  
            },  
            function () { fromKpApi(id, card, cb); },  
            false, { timeout: 1000, dataType: 'text' }  
        );  
    }  
  
    function fetchRating(card, cb) {  
        var cached = getRCache(card.id);  
        if (cached) return cb(cached.kp, cached.tmdb);  
        var sc = getRCache(card.id, 'search');  
        if (sc) return fromKpXml(sc.kp_id, card, cb);  
  
        var yr    = parseInt((card.release_date || card.first_air_date || '').slice(0, 4)) || null;  
        var title = card.title || card.name;  
        var tmdb  = card.vote_average || 0;  
        var fail  = function () { setRCache(card.id, { kp: 0, tmdb: tmdb }); cb(0, tmdb); };  
  
        function byTitle() {  
            var q = (title || '').toLowerCase().replace(/[^\wа-яё\s]/gi, ' ').replace(/\s+/g, ' ').trim();  
            rNet.silent('https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=' + encodeURIComponent(q),  
                function (json) {  
                    if (!json.films || !json.films.length) return fail();  
                    var best = null;  
                    if (yr) {  
                        best = json.films.find(function (f) { return parseInt((f.year || '').slice(0, 4)) === yr; });  
                        if (!best) best = json.films.find(function (f) {  
                            var y = parseInt((f.year || '').slice(0, 4));  
                            return y && y > yr - 3 && y < yr + 3;  
                        });  
                    }  
                    best = best || json.films[0];  
                    if (best) { setRCache(card.id, { kp_id: best.filmId }, 'search'); fromKpXml(best.filmId, card, cb); }  
                    else fail();  
                },  
                fail, false, { timeout: 5000, headers: { 'X-API-KEY': KP_KEY } }  
            );  
        }  
  
        if (card.imdb_id) {  
            rNet.silent('https://kinopoiskapiunofficial.tech/api/v2.2/films?imdbId=' + encodeURIComponent(card.imdb_id),  
                function (d) {  
                    var fi = d.items && d.items[0];  
                    var id = (fi && (fi.kinopoiskId || fi.filmId)) || d.kinopoiskId || d.filmId;  
                    if (id) { setRCache(card.id, { kp_id: id }, 'search'); fromKpXml(id, card, cb); }  
                    else byTitle();  
                },  
                byTitle, false, { timeout: 5000, headers: { 'X-API-KEY': KP_KEY } }  
            );  
        } else {  
            byTitle();  
        }  
    }  
  
    // ─── Обработка карточки ─────────────────────────────────────────────────  
    function processCard(card) {  
        if (!card.card_data) return;  
        if (card.dataset.ccp) return;  
        card.dataset.ccp = '1';  
  
        var data = card.card_data;  
        var view = card.querySelector('.card__view');  
        if (!view) return;  
  
        // Скрываем название и год под постером  
        var tEl = card.querySelector('.card__title');  
        var aEl = card.querySelector('.card__age');  
        if (tEl) tEl.style.display = 'none';  
        if (aEl) aEl.style.display = 'none';  
  
        // Перемещаем иконки вправо, убираем фон (фон теперь через :not(:empty))  
        var icons = card.querySelector('.card__icons');  
        if (icons) {  
            icons.style.cssText = 'top:0.5em;left:auto;right:0.5em;justify-content:flex-end;';  
            var inner = icons.querySelector('.card__icons-inner');  
            if (inner) inner.style.cssText = 'flex-direction:column;gap:0.2em;';  
        }  
  
        // Постер без надписей — наблюдаем за установкой src  
        var img = card.querySelector('.card__img');  
        if (img && data.id) {  
            var srcObserver = new MutationObserver(function (mutations) {  
                mutations.forEach(function (m) {  
                    if (m.attributeName !== 'src') return;  
                    var src = img.getAttribute('src') || '';  
                    // Ждём пока Lampa установит реальный постер (не заглушку)  
                    if (src && src.indexOf('img_load') === -1 && src.indexOf('img_broken') === -1 && src !== '') {  
                        srcObserver.disconnect();  
                        fetchCleanPoster(data, img);  
                    }  
                });  
            });  
            srcObserver.observe(img, { attributes: true, attributeFilter: ['src'] });  
        }  
  
        // Оверлей  
        var overlay = document.createElement('div');  
        overlay.className = 'card__overlay';  
  
        // Название (макс 2 строки)  
        var titleEl = document.createElement('div');  
        titleEl.className = 'card__overlay-title';  
        titleEl.textContent = data.title || data.name || '';  
        overlay.appendChild(titleEl);  
  
        // Бейдж  
        var badge = document.createElement('div');  
        badge.className = 'card__badge';  
  
        var year  = ((data.release_date || data.first_air_date || '') + '').slice(0, 4);  
        var genre = getLabel(data);  
  
        if (year) {  
            var yEl = document.createElement('span');  
            yEl.className = 'card__badge-year';  
            yEl.textContent = year;  
            badge.appendChild(yEl);  
        }  
        if (year && genre) {  
            var sEl = document.createElement('span');  
            sEl.className = 'card__badge-sep';  
            sEl.textContent = '•';  
            badge.appendChild(sEl);  
        }  
        if (genre) {  
            var gEl = document.createElement('span');  
            gEl.className = 'card__badge-genre';  
            gEl.textContent = genre;  
            badge.appendChild(gEl);  
        }  
  
        var qEl = document.createElement('span');  
        qEl.className = 'card__badge-quality';  
        qEl.style.display = 'none';  
        badge.appendChild(qEl);  
  
        var rEl = document.createElement('span');  
        rEl.className = 'card__badge-rating';  
        rEl.style.display = 'none';  
        badge.appendChild(rEl);  
  
        overlay.appendChild(badge);  
        view.appendChild(overlay);  
  
        // Качество  
        fetchQuality(data, function (q) {  
            if (q) { qEl.textContent = q; qEl.style.display = ''; }  
        });  
  
        // Рейтинг  
        if (data.id && (data.release_date || data.first_air_date)) {  
            fetchRating(data, function (kp, tmdb) {  
                var val = kp > 0 ? kp : tmdb;  
                if (val > 0) { rEl.textContent = parseFloat(val).toFixed(1); rEl.style.display = ''; }  
            });  
        } else {  
            var v = parseFloat(data.vote_average || 0);  
            if (v > 0) { rEl.textContent = v.toFixed(1); rEl.style.display = ''; }  
        }  
    }  
  
    // ─── Наблюдатели ────────────────────────────────────────────────────────  
    var io = null;  
    if (typeof IntersectionObserver !== 'undefined') {  
        io = new IntersectionObserver(function (entries) {  
            entries.forEach(function (e) {  
                if (!e.isIntersecting) return;  
                io.unobserve(e.target);  
                processCard(e.target);  
            });  
        }, { rootMargin: '200px' });  
    }  
  
    function observe(card) {  
        if (!card.card_data || card.dataset.ccp) return;  
        if (io) io.observe(card);  
        else processCard(card);  
    }  
  
    var mo = new MutationObserver(function (mutations) {  
        mutations.forEach(function (m) {  
            m.addedNodes.forEach(function (node) {  
                if (node.nodeType !== 1) return;  
                if (node.classList && node.classList.contains('card')) observe(node);  
                if (node.querySelectorAll) [].forEach.call(node.querySelectorAll('.card'), observe);  
            });  
        });  
    });  
    mo.observe(document.body, { childList: true, subtree: true });  
  
    [].forEach.call(document.querySelectorAll('.card'), observe);  
  
    Lampa.Listener.follow('app', function (e) {  
        if (e.type === 'ready') [].forEach.call(document.querySelectorAll('.card'), observe);  
        if (e.type === 'destroy') { if (io) io.disconnect(); mo.disconnect(); }  
    });  
})();
