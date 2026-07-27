(function () {  
    if (window.customCardPlugin) return;  
    window.customCardPlugin = true;  
  
    var KP_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='white' d='M12.049 0C5.45 0 .104 5.373.104 12S5.45 24 12.049 24c3.928 0 7.414-1.904 9.592-4.844l-9.803-5.174l6.256 6.418h-3.559l-4.373-6.086V20.4h-2.89V3.6h2.89v6.095L14.535 3.6h3.559l-6.422 6.627l9.98-5.368C19.476 1.911 15.984 0 12.05 0zm10.924 7.133l-9.994 4.027l10.917-.713a12 12 0 0 0-.923-3.314m-10.065 5.68l10.065 4.054c.458-1.036.774-2.149.923-3.314z'/%3E%3C/svg%3E";  
  
    // ─── CSS ────────────────────────────────────────────────────────────────  
    document.head.insertAdjacentHTML('beforeend', '<style>' +  
        '.card__title{display:none!important}' +  
        '.card__age{display:none!important}' +  
        '.card__type{display:none!important}' +  
        '.card__quality{display:none!important}' +  
        '.card__vote{display:none!important}' +  
        '.card.focus .card-watched{display:none!important}' +  
        '.card__icons{top:0.5em!important;left:auto!important;right:0.5em!important;justify-content:flex-end!important}' +  
        '.card__icons-inner{background:none!important;border-radius:0!important;flex-direction:column!important;gap:0.2em}' +  
        '.card__icon{filter:drop-shadow(0 1px 4px rgba(0,0,0,1)) drop-shadow(0 0 8px rgba(0,0,0,0.9))!important}' +  
        '.card__overlay{position:absolute;left:0;right:0;bottom:0;padding:3em 0.7em 0.6em 0.7em;background:linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,0.9) 100%);border-bottom-left-radius:1em;border-bottom-right-radius:1em;z-index:1;pointer-events:none}' +  
        '.card__overlay-title{font-size:1.2em;font-weight:700;line-height:1.3;color:#fff;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical;margin-bottom:0.3em}' +  
        '.card__status-row{display:flex;align-items:baseline;margin-bottom:0.3em;line-height:1;overflow:hidden;white-space:nowrap}' +  
        '.card__status-row:empty{display:none}' +  
        '.card__status-row .tvs-icon{font-size:1.1em;margin-right:0.2em;flex-shrink:0}' +  
        '.card__status-row .tvs-text{font-size:0.85em;color:#aaa;overflow:hidden;text-overflow:ellipsis}' +  
        '.card__badge{display:flex;align-items:center;width:100%;gap:0.3em;overflow:hidden}' +  
        '.card__badge-year,.card__badge-sep{font-size:0.85em;color:#aaa;flex-shrink:0;white-space:nowrap}' +  
        '.card__badge-genre{font-size:0.85em;color:#aaa;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0}' +  
        '.card__badge-quality,.card__badge-rating{font-size:1em;font-weight:700;color:#ddd;flex-shrink:0;white-space:nowrap}' +  
        '.card__badge-kp-icon{display:inline-block;width:0.8em;height:1em;background-repeat:no-repeat;background-position:center;background-size:contain;margin-left:0.1em;vertical-align:middle;flex-shrink:0}' +  
    '</style>');  
  
    // ─── Постер без надписей ─────────────────────────────────────────────────  
    var posterCache = {};  
    var posterNet = new Lampa.Reguest();  
  
    function tmdbKey() {  
        return (Lampa.TMDB && Lampa.TMDB.key && typeof Lampa.TMDB.key === 'function')  
            ? Lampa.TMDB.key()  
            : '4ef0d7355d9ffb5151e987764708ce96';  
    }  
  
    function fetchCleanPoster(data, img) {  
        var id = data.id;  
        var type = data.name ? 'tv' : 'movie';  
        if (!id) return;  
        if (posterCache[id] === null) return;  
        if (posterCache[id]) { img.src = posterCache[id]; return; }  
  
        var url = Lampa.TMDB.api(type + '/' + id + '/images?include_image_language=null&api_key=' + tmdbKey());  
        posterNet.silent(url, function (res) {  
            var posters = (res && res.posters) || [];  
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
  
    function setupPosterReplacement(img, data) {  
        if (!data || !data.id) return;  
        var done = false;  
        function doReplace() {  
            if (done) return;  
            done = true;  
            fetchCleanPoster(data, img);  
        }  
        // Если src уже реальный постер — заменяем сразу  
        var src = img.getAttribute('src') || '';  
        if (src && src.indexOf('img_load') === -1 && src.indexOf('img_broken') === -1 && src.length > 1) {  
            doReplace();  
            return;  
        }  
        // Иначе ждём установки src  
        var obs = new MutationObserver(function () {  
            var newSrc = img.getAttribute('src') || '';  
            if (newSrc && newSrc.indexOf('img_load') === -1 && newSrc.indexOf('img_broken') === -1 && newSrc.length > 1) {  
                obs.disconnect();  
                doReplace();  
            }  
        });  
        obs.observe(img, { attributes: true, attributeFilter: ['src'] });  
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
        var ids = Array.isArray(d.genres)  
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
    var RE_TS  = /\b(tsrip|ts|telesync|telecine|cam|camrip|workprint|wp|scr|screener|dvdscr|dcprip)\b/i;  
    var RE_TS2 = /звук\s*с\s*ts|sound\s*ts|audio\s*ts|dub\s*ts/i;  
    var RE_4K  = /\b(2160p|2160р|4k|uhd|4к)\b/i;  
    var RE_HD  = /\b(1080p|1080р|720p|720р|blu\-ray|bdrip|bdremux|web\-dl|webdl|web\-dlrip|webrip|hdtv|hdtvrip|hddvd|hddvdrip|fullhd|fhd|hd|hdrip)\b/i;  
    var qNet = new Lampa.Reguest();  
    var qCache = {}, qCacheSize = 0;  
  
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
        var key = data.id;  
        if (key && qCache[key] !== undefined) return cb(qCache[key]);  
        var title = data.title || data.name;  
        var yr = parseInt((data.release_date || data.first_air_date || '').slice(0, 4)) || null;  
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
                    var y = parseInt((r.info && r.info.released) || r.year);  
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
    var rNet = new Lampa.Reguest();  
    var rCache = Lampa.Storage.cache('ccp_kp_rating', 500, {});  
  
    function getRCache(id, type) {  
        var key = type === 'search' ? 'search_' + id : id;  
        var item = rCache[key];  
        if (!item) return null;  
        var ttl = type === 'search' ? TTL_SRC : item.kp === 0 ? TTL_ERR : TTL_OK;  
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
        var yr = parseInt((card.release_date || card.first_air_date || '').slice(0, 4)) || null;  
        var title = card.title || card.name;  
        var tmdb = card.vote_average || 0;  
        var fail = function () { setRCache(card.id, { kp: 0, tmdb: tmdb }); cb(0, tmdb); };  
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
  
    // ─── Статус ─────────────────────────────────────────────────────────────  
    function daysUntil(dateStr) {  
        if (!dateStr) return -1;  
        var today = new Date(); today.setHours(0, 0, 0, 0);  
        var target = Lampa.Utils.parseToDate(dateStr);  
        return Math.round((target.getTime() - today.getTime()) / 86400000);  
    }  
    function fmtDate(dateStr) {  
        if (!dateStr) return null;  
        var p = dateStr.split('-');  
        if (p.length === 1 && p[0].length === 4) return p[0];  
        if (p.length === 2) return p[1] + '.' + p[0].slice(2);  
        var d = daysUntil(dateStr);  
        if (d <= 0) return null;  
        if (d <= 30) return 'Премьера ' + d + 'дн.';  
        return p[2] + '.' + p[1] + '.' + p[0].slice(2);  
    }  
    function fmtPremiere(dateStr) {  
        if (!dateStr) return 'Премьера';  
        var p = dateStr.split('-');  
        if (p.length === 1 && p[0].length === 4) return 'Премьера ' + p[0];  
        if (p.length === 2) return 'Премьера ' + p[1] + '.' + p[0].slice(2);  
        var d = daysUntil(dateStr);  
        if (d > 0 && d <= 30) return 'Премьера ' + d + 'дн.';  
        return 'Премьера ' + p[2] + '.' + p[1] + '.' + p[0].slice(2);  
    }  
    function fmtYear(dateStr) { return dateStr ? dateStr.split('-')[0] : null; }  
  
    function buildEpText(info) {  
        var last = info.last_episode_to_air, next = info.next_episode_to_air;  
        if (!last) return null;  
        var cs = last.season_number, total = 0;  
        (info.seasons || []).forEach(function (s) {  
            if (s.season_number > 0 && s.season_number < cs) total += s.episode_count;  
        });  
        total += last.episode_number;  
        var sp = 'S' + cs, ep = 'E' + total;  
        if (next) {  
            var te = info.number_of_episodes;  
            if (next.season_number > cs) {  
                sp += '/S' + next.season_number;  
                if (te && te > total) ep += '/E' + te;  
            } else if (next.season_number === cs && te && te > total) {  
                ep += '/E' + te;  
            }  
        }  
        return sp + ':' + ep;  
    }  
  
    function getTVInfo(info) {  
        var last = info.last_episode_to_air, next = info.next_episode_to_air;  
        var st = info.status, ep = buildEpText(info);  
        if (!last) {  
            if (st === 'Returning Series') { var dl = fmtDate(info.first_air_date); return { text: dl || 'Онгоинг', icon: '▶', color: '#00E676' }; }  
            if (st === 'In Production')    return { text: fmtPremiere(info.first_air_date), icon: '✦', color: '#E040FB' };  
            if (st === 'Planned')          return { text: 'Запланировано' + (fmtYear(info.first_air_date) ? ' ' + fmtYear(info.first_air_date) : ''), icon: '❱', color: '#E040FB' };  
            return null;  
        }  
        if (st === 'Returning Series') {  
            var nd = (next && next.air_date) ? daysUntil(next.air_date) : 999;  
            return nd >= 0 && nd <= 8 ? { text: ep, icon: '▶', color: '#00E676' } : { text: ep, icon: '⏯︎', color: '#40C4FF' };  
        }  
        if (st === 'Ended')          return { text: ep, icon: '✔', color: '#FFD740' };  
        if (st === 'Canceled')       return { text: ep, icon: '✘', color: '#FF5252' };  
        if (st === 'Pilot')          return { text: 'Пилот', icon: '✔', color: '#FFD740' };  
        if (st === 'In Production')  return { text: fmtPremiere(info.first_air_date), icon: '✦', color: '#E040FB' };  
        if (st === 'Planned')        return { text: 'Запланировано' + (fmtYear(info.first_air_date) ? ' ' + fmtYear(info.first_air_date) : ''), icon: '❱', color: '#E040FB' };  
        return { text: ep, icon: '⏯︎', color: '#40C4FF' };  
    }  
  
    function getMovieInfo(info) {  
        var st = info.status, rd = info.release_date;  
        if (st === 'Rumored')          return { text: 'По слухам' + (fmtYear(rd) ? ' ' + fmtYear(rd) : ''), icon: '❱', color: '#E040FB' };  
        if (st === 'Planned')          return { text: 'Запланировано' + (fmtYear(rd) ? ' ' + fmtYear(rd) : ''), icon: '❱', color: '#E040FB' };  
        if (st === 'In Production')    return { text: fmtPremiere(rd), icon: '✦', color: '#E040FB' };  
        if (st === 'Post Production')  return { text: fmtPremiere(rd), icon: '✦', color: '#E040FB' };  
        if (st === 'Canceled')         return { text: 'Отменён', icon: '✘', color: '#FF5252' };  
        return null;  
    }  
  
    function isPersonCard(data) {  
        return !!(data.known_for_department !== undefined || (data.profile_path && !data.poster_path && !data.backdrop_path));  
    }  
  
    function loadCardStatus(data, statusRow) {  
        if (isPersonCard(data)) return;  
        var isTV = !!(data.original_name || data.first_air_date);  
        var net = new Lampa.Reguest();  
        var endpoint = isTV  
            ? 'tv/' + data.id + '?api_key=' + tmdbKey()  
            : 'movie/' + data.id + '?api_key=' + tmdbKey();  
        if (!isTV && !data.release_date && !data.original_title) return;  
        net.silent(  
            Lampa.TMDB.api(endpoint),  
            function (resp) {  
                if (!resp || !resp.id) return;  
                var li = isTV ? getTVInfo(resp) : getMovieInfo(resp);  
                if (!li || !li.text) return;  
                var iconSpan = document.createElement('span');  
                iconSpan.className = 'tvs-icon';  
                iconSpan.style.color = li.color;  
                iconSpan.textContent = li.icon;  
                var textSpan = document.createElement('span');  
                textSpan.className = 'tvs-text';  
                textSpan.textContent = li.text;  
                statusRow.appendChild(iconSpan);  
                statusRow.appendChild(textSpan);  
            },  
            function () {},  
            false,  
            { cache: { life: 1440 } }  
        );  
    }  
  
    // ─── Обработка карточки ─────────────────────────────────────────────────  
    function processCard(card) {  
        if (!card.card_data) return;  
        if (card.dataset.ccp) return;  
        card.dataset.ccp = '1';  
  
        var data = card.card_data;  
        var view = card.querySelector('.card__view');  
        if (!view) return;  
  
        // Скрываем стандартные элементы под постером  
        var tEl = card.querySelector('.card__title');  
        var aEl = card.querySelector('.card__age');  
        if (tEl) tEl.style.display = 'none';  
        if (aEl) aEl.style.display = 'none';  
  
        // Иконки — правый верх, без фона  
        var icons = card.querySelector('.card__icons');  
        if (icons) {  
            icons.style.cssText = 'top:0.5em;left:auto;right:0.5em;justify-content:flex-end;';  
            var inner = icons.querySelector('.card__icons-inner');  
            if (inner) inner.style.cssText = 'background:none;border-radius:0;flex-direction:column;gap:0.2em;';  
        }  
  
        // Постер без надписей  
        var img = card.querySelector('.card__img');  
        if (img) setupPosterReplacement(img, data);  
  
        // Оверлей  
        var overlay = document.createElement('div');  
        overlay.className = 'card__overlay';  
  
        // Название (жирное, макс 2 строки)  
        var titleEl = document.createElement('div');  
        titleEl.className = 'card__overlay-title';  
        titleEl.textContent = data.title || data.name || '';  
        overlay.appendChild(titleEl);  
  
        // Строка статуса (заполняется асинхронно)  
        var statusRow = document.createElement('div');  
        statusRow.className = 'card__status-row';  
        overlay.appendChild(statusRow);  
  
        // Бейдж: год • жанр  качество  рейтинг  
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
  
        // Иконка KP (показывается только если рейтинг от KP)  
        var kpEl = document.createElement('span');  
        kpEl.className = 'card__badge-kp-icon';  
        kpEl.style.cssText = 'display:none;background-image:url("' + KP_SVG + '")';  
        badge.appendChild(kpEl);  
  
        overlay.appendChild(badge);  
        view.appendChild(overlay);  
  
        // Загружаем статус  
        if (data.id) loadCardStatus(data, statusRow);  
  
        // Загружаем качество  
        fetchQuality(data, function (q) {  
            if (q) { qEl.textContent = q; qEl.style.display = ''; }  
        });  
  
        // Загружаем рейтинг  
        if (data.id && (data.release_date || data.first_air_date)) {  
            fetchRating(data, function (kp, tmdb) {  
                var val = kp > 0 ? kp : tmdb;  
                if (val > 0) {  
                    rEl.textContent = parseFloat(val).toFixed(1);  
                    rEl.style.display = '';  
                    if (kp > 0) kpEl.style.cssText = 'background-image:url("' + KP_SVG + '")';  
                }  
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
