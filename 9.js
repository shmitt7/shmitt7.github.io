(function () {  
    if (window.crlOverlayPlugin) return;  
    window.crlOverlayPlugin = true;  
  
    /* ═══════════════════════════════════════════════════════  
       CSS  
    ═══════════════════════════════════════════════════════ */  
    document.head.insertAdjacentHTML('beforeend', '<style>' +  
        /* скрываем оригинальные элементы */  
        '.card:not(.card--wide) .card__title,' +  
        '.card:not(.card--wide) .card__age,' +  
        '.card:not(.card--wide) .card__type,' +  
        '.card:not(.card--wide) .card__quality,' +  
        '.card:not(.card--wide) .card__vote,' +  
        '.card:not(.card--wide) .card__new-episode,' +  
        '.card:not(.card--wide) .card__marker,' +  
        '.card:not(.card--wide) .card-watched,' +  
        '.card:not(.card--wide) .card__status{display:none!important}' +  
        '.card:not(.card--wide) .card__view::before{display:none!important}' +  
        /* иконки — правый верхний угол */  
        '.card:not(.card--wide) .card__icons{left:auto;right:0.5em;top:0.5em}' +  
        '.card:not(.card--wide) .card__icons-inner{background:none}' +  
        '.card:not(.card--wide) .card__icon{filter:drop-shadow(0 1px 4px rgba(0,0,0,1)) drop-shadow(0 0 8px rgba(0,0,0,0.9))}' +  
        /* оверлей */  
        '.crl-overlay{position:absolute;bottom:0;left:0;right:0;height:35%;border-radius:0 0 1em 1em;overflow:hidden;background:linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,0.78) 30%,rgba(0,0,0,0.88) 100%);padding:0.4em 0.45em 0.4em;display:flex;flex-direction:column;justify-content:flex-end;z-index:2;box-sizing:border-box}' +  
        /* название — макс. 2 строки, чуть меньше и плотнее */  
        '.crl-title{font-size:1.15em;line-height:1.1;font-weight:700;color:#fff;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical;text-overflow:ellipsis;margin-bottom:0.2em;text-shadow:0 1px 3px rgba(0,0,0,0.9)}' +  
        /* строки метаданных */  
        '.crl-row{display:flex;justify-content:space-between;align-items:baseline;line-height:1.2;margin-top:0.15em}' +  
        '.crl-left{font-size:0.65em;color:rgba(255,255,255,0.82);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0}' +  
        '.crl-right{font-size:0.95em;color:rgba(255,255,255,0.95);white-space:nowrap;margin-left:0.5em;flex-shrink:0;display:flex;align-items:baseline;gap:0.35em;font-weight:700}' +  
        /* статус */  
        '.crl-status-icon{margin-right:0.15em}' +  
        /* рейтинг с иконкой КП */  
        '.crl-vote{display:flex;align-items:center}' +  
        '.crl-vote .source--name{width:0.85em;height:1.1em;background-repeat:no-repeat;background-position:center;background-size:contain;margin-left:0.2em;flex-shrink:0;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'white\' d=\'M12.049 0C5.45 0 .104 5.373.104 12S5.45 24 12.049 24c3.928 0 7.414-1.904 9.592-4.844l-9.803-5.174l6.256 6.418h-3.559l-4.373-6.086V20.4h-2.89V3.6h2.89v6.095L14.535 3.6h3.559l-6.422 6.627l9.98-5.368C19.476 1.911 15.984 0 12.05 0zm10.924 7.133l-9.994 4.027l10.917-.713a12 12 0 0 0-.923-3.314m-10.065 5.68l10.065 4.054c.458-1.036.774-2.149.923-3.314z\'/%3E%3C/svg%3E")}' +  
    '</style>');  
  
    /* ═══════════════════════════════════════════════════════  
       GENRE LOGIC  
    ═══════════════════════════════════════════════════════ */  
    var allGenres = {  
        28:'Боевик', 12:'Приключения', 35:'Комедия', 80:'Криминал',  
        18:'Драма', 10751:'Семейный', 14:'Фэнтези', 36:'История',  
        27:'Ужасы', 10402:'Музыка', 9648:'Детектив', 10749:'Мелодрама',  
        878:'Фантастика', 10770:'Телефильм', 53:'Триллер', 10752:'Военный',  
        37:'Вестерн', 10759:'Экшен', 10762:'Детский',  
        10765:'НФ и Фэнтези', 10768:'Война и Политика'  
    };  
  
    function getGenreLabels(data, max) {  
        var isTv = !!data.original_name;  
        var genreObjs = Array.isArray(data.genres) ? data.genres : [];  
        var ids;  
        if (genreObjs.length) {  
            ids = genreObjs.map(function(g) { return typeof g === 'object' ? g.id : g; });  
        } else {  
            ids = data.genre_ids || [];  
        }  
        var priority = null;  
        var isAnimation = ids.indexOf(16) !== -1;  
        if (isAnimation && data.original_language === 'ja') priority = 'Аниме';  
        else if (ids.indexOf(10763) !== -1) priority = 'Новости';  
        else if (ids.indexOf(10767) !== -1) priority = 'Ток-шоу';  
        else if (ids.indexOf(10764) !== -1) priority = 'Реалити-шоу';  
        else if (ids.indexOf(99) !== -1) priority = 'Документальный';  
        else if (ids.indexOf(10766) !== -1) priority = 'Мыльная опера';  
        else if (isAnimation) priority = isTv ? 'Мультсериал' : 'Мультфильм';  
        var result = [];  
        if (priority) result.push(priority);  
        for (var i = 0; i < ids.length && result.length < (max || 2); i++) {  
            var id = ids[i];  
            if ((priority === 'Аниме' || priority === 'Мультсериал' || priority === 'Мультфильм') && id === 16) continue;  
            var name = allGenres[id];  
            if (!name && genreObjs[i] && typeof genreObjs[i] === 'object') name = genreObjs[i].name;  
            if (name && result.indexOf(name) === -1) result.push(name);  
        }  
        return result;  
    }  
  
    /* ═══════════════════════════════════════════════════════  
       QUALITY LOGIC  
    ═══════════════════════════════════════════════════════ */  
    var SERVERS = ['http://jac.red', 'https://jr.maxvol.pro'];  
    var RE_TS  = /\b(tsrip|ts|telesync|telecine|cam|camrip|workprint|wp|scr|screener|dvdscr|dcprip)\b/i;  
    var RE_TS2 = /звук\s*с\s*ts|sound\s*ts|audio\s*ts|dub\s*ts/i;  
    var RE_4K  = /\b(2160p|2160р|4k|uhd|4к)\b/i;  
    var RE_HD  = /\b(1080p|1080р|720p|720р|blu\-ray|bdrip|bdremux|web\-dl|webdl|web\-dlrip|webrip|hdtv|hdtvrip|hddvd|hddvdrip|fullhd|fhd|hd|hdrip)\b/i;  
    var qualityNetwork = new Lampa.Reguest();  
    var qualityCache = {};  
    var qualityCacheSize = 0;  
  
    function getQualityFromTitle(t) {  
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
        var title = data.title || data.name;  
        var targetYear = parseInt((data.release_date || data.first_air_date || '').substring(0, 4)) || null;  
        var i = 0, titles = [];  
        function done() {  
            if (!titles.length) { if (key) setQualityCache(key, null); return callback(null); }  
            var ts = 0, has4K = false, hasHD = false;  
            for (var ti = 0; ti < titles.length; ti++) {  
                var q = getQualityFromTitle(titles[ti]);  
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
            var url = SERVERS[i] + '/api/v2.0/indexers/all/results?apikey=&Query=' + encodeURIComponent(title) + (targetYear ? '&year=' + targetYear : '');  
            qualityNetwork.silent(url, function(res) {  
                var results = (res && res.Results) || [];  
                for (var ri = 0; ri < results.length; ri++) {  
                    var r = results[ri];  
                    var y = parseInt((r.info && r.info.released) || r.year);  
                    var inTitle = !targetYear || (r.Title && (r.Title.includes(String(targetYear)) || r.Title.includes(String(targetYear - 1)) || r.Title.includes(String(targetYear + 1))));  
                    if ((y && Math.abs(y - targetYear) <= 1) || (!y && inTitle)) titles.push(r.Title);  
                }  
                i++; next();  
            }, function() { i++; next(); });  
        }  
        next();  
    }  
  
    /* ═══════════════════════════════════════════════════════  
       RATING LOGIC  
    ═══════════════════════════════════════════════════════ */  
    var CACHE_SUCCESS = 15 * 24 * 60 * 60 * 1000;  
    var CACHE_ERROR   = 24 * 60 * 60 * 1000;  
    var CACHE_SEARCH  =  3 * 60 * 60 * 1000;  
    var KP_API_KEY = '14342b35-714b-449d-bf10-30d0d9ac22e6';  
    var ratingNetwork = new Lampa.Reguest();  
    var ratingCache = Lampa.Storage.cache('kp_rating', 500, {});  
  
    function getRatingCache(id, type) {  
        var key = type === 'search' ? 'search_' + id : id;  
        var item = ratingCache[key];  
        if (!item) return null;  
        var ttl = type === 'search' ? CACHE_SEARCH : item.kp === 0 ? CACHE_ERROR : CACHE_SUCCESS;  
        return (Date.now() - item.timestamp) < ttl ? item : null;  
    }  
  
    function setRatingCache(id, data, type) {  
        var key = type === 'search' ? 'search_' + id : id;  
        ratingCache[key] = Object.assign({}, data, { timestamp: Date.now() });  
        Lampa.Storage.set('kp_rating', ratingCache);  
    }  
  
    function fetchFromKpApi(id, card, callback) {  
        var tmdb = card.vote_average || 0;  
        ratingNetwork.silent('https://kinopoiskapiunofficial.tech/api/v2.2/films/' + id,  
            function(data) { var kp = data.ratingKinopoisk || 0; setRatingCache(card.id, { kp: kp, tmdb: tmdb }); callback(kp, tmdb); },  
            function() { setRatingCache(card.id, { kp: 0, tmdb: tmdb }); callback(0, tmdb); },  
            false, { timeout: 3000, headers: { 'X-API-KEY': KP_API_KEY } }  
        );  
    }  
  
    function getRatingById(id, card, callback) {  
        var tmdb = card.vote_average || 0;  
        ratingNetwork.silent('https://rating.kinopoisk.ru/' + id + '.xml',  
            function(str) {  
                if (str && str.includes('<rating>')) {  
                    try {  
                        var kp = parseFloat($($.parseXML(str)).find('kp_rating').text()) || 0;  
                        if (kp > 0) { setRatingCache(card.id, { kp: kp, tmdb: tmdb }); callback(kp, tmdb); return; }  
                    } catch(e) {}  
                }  
                fetchFromKpApi(id, card, callback);  
            },  
            function() { fetchFromKpApi(id, card, callback); },  
            false, { timeout: 1000, dataType: 'text' }  
        );  
    }  
  
    function fetchRating(card, callback) {  
        var cached = getRatingCache(card.id);  
        if (cached) { callback(cached.kp, cached.tmdb); return; }  
        var searchCached = getRatingCache(card.id, 'search');  
        if (searchCached) { getRatingById(searchCached.kp_id, card, callback); return; }  
        var year = parseInt((card.release_date || card.first_air_date || '').slice(0, 4)) || null;  
        var title = card.title || card.name;  
        var tmdb = card.vote_average || 0;  
        var processError = function() { setRatingCache(card.id, { kp: 0, tmdb: tmdb }); callback(0, tmdb); };  
        function searchByTitle() {  
            var query = (title || '').toLowerCase().replace(/[^\wа-яё\s]/gi, ' ').replace(/\s+/g, ' ').trim();  
            ratingNetwork.silent('https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=' + encodeURIComponent(query),  
                function(json) {  
                    if (!json.films || !json.films.length) { processError(); return; }  
                    var films = json.films;  
                    var best = null;  
                    if (year) {  
                        best = films.find(function(f) { return parseInt((f.year || '').slice(0, 4)) === year; });  
                        if (!best) best = films.find(function(f) { var y = parseInt((f.year || '').slice(0, 4)); return y && y > year - 3 && y < year + 3; });  
                    }  
                    best = best || films[0];  
                    if (best) { setRatingCache(card.id, { kp_id: best.filmId }, 'search'); getRatingById(best.filmId, card, callback); }  
                    else processError();  
                },  
                processError, false, { timeout: 5000, headers: { 'X-API-KEY': KP_API_KEY } }  
            );  
        }  
        if (card.imdb_id) {  
            ratingNetwork.silent('https://kinopoiskapiunofficial.tech/api/v2.2/films?imdbId=' + encodeURIComponent(card.imdb_id),  
                function(data) {  
                    var firstItem = data.items && data.items[0];  
                    var id = (firstItem && (firstItem.kinopoiskId || firstItem.filmId)) || data.kinopoiskId || data.filmId;  
                    if (id) { setRatingCache(card.id, { kp_id: id }, 'search'); getRatingById(id, card, callback); }  
                    else searchByTitle();  
                },  
                searchByTitle, false, { timeout: 5000, headers: { 'X-API-KEY': KP_API_KEY } }  
            );  
        } else {  
            searchByTitle();  
        }  
    }  
  
    /* ═══════════════════════════════════════════════════════  
       STATUS LOGIC  
    ═══════════════════════════════════════════════════════ */  
    function daysUntil(dateStr) {  
        if (!dateStr) return -1;  
        var today = new Date(); today.setHours(0, 0, 0, 0);  
        var target = Lampa.Utils.parseToDate(dateStr);  
        return Math.round((target.getTime() - today.getTime()) / 86400000);  
    }  
  
    function formatDateLabel(dateStr) {  
        if (!dateStr) return null;  
        var parts = dateStr.split('-');  
        if (parts.length === 1 && parts[0].length === 4) return parts[0];  
        if (parts.length === 2) return parts[1] + '.' + parts[0].slice(2);  
        var days = daysUntil(dateStr);  
        if (days <= 0) return null;  
        if (days <= 30) return 'Премьера ' + days + 'дн.';  
        return parts[2] + '.' + parts[1] + '.' + parts[0].slice(2);  
    }  
  
    function formatPremiereLabel(dateStr) {  
        if (!dateStr) return 'Премьера';  
        var parts = dateStr.split('-');  
        if (parts.length === 1 && parts[0].length === 4) return 'Премьера ' + parts[0];  
        if (parts.length === 2) return 'Премьера ' + parts[1] + '.' + parts[0].slice(2);  
        var days = daysUntil(dateStr);  
        if (days > 0 && days <= 30) return 'Премьера ' + days + 'дн.';  
        return 'Премьера ' + parts[2] + '.' + parts[1] + '.' + parts[0].slice(2);  
    }  
  
    function formatYearLabel(dateStr) {  
        if (!dateStr) return null;  
        return dateStr.split('-')[0];  
    }  
  
    function buildEpisodeText(info) {  
        var last = info.last_episode_to_air;  
        var next = info.next_episode_to_air;  
        var seasons = info.seasons || [];  
        if (!last) return null;  
        var currentSeason = last.season_number;  
        var airedTotal = 0;  
        for (var i = 0; i < seasons.length; i++) {  
            var s = seasons[i];  
            if (s.season_number > 0 && s.season_number < currentSeason) airedTotal += s.episode_count;  
        }  
        airedTotal += last.episode_number;  
        var seasonPart = 'S' + currentSeason;  
        var episodePart = 'E' + airedTotal;  
        if (next) {  
            var totalEpisodes = info.number_of_episodes;  
            if (next.season_number > currentSeason) {  
                seasonPart += '/S' + next.season_number;  
                if (totalEpisodes && totalEpisodes > airedTotal) episodePart += '/E' + totalEpisodes;  
            } else if (next.season_number === currentSeason && totalEpisodes && totalEpisodes > airedTotal) {  
                episodePart += '/E' + totalEpisodes;  
            }  
        }  
        return seasonPart + ':' + episodePart;  
    }  
  
    function getTVLabelInfo(info) {  
        var last = info.last_episode_to_air;  
        var next = info.next_episode_to_air;  
        var status = info.status;  
        var episodeText = buildEpisodeText(info);  
        if (!last) {  
            if (status === 'Returning Series') { var dl = formatDateLabel(info.first_air_date); return { text: dl || 'Онгоинг', icon: '▶', color: '#00E676' }; }  
            if (status === 'In Production')    return { text: formatPremiereLabel(info.first_air_date), icon: '✦', color: '#E040FB' };  
            if (status === 'Planned')          { var yr = formatYearLabel(info.first_air_date); return { text: 'Запланировано' + (yr ? ' ' + yr : ''), icon: '❱', color: '#E040FB' }; }  
            return null;  
        }  
        if (status === 'Returning Series') {  
            var nextDays = (next && next.air_date) ? daysUntil(next.air_date) : 999;  
            return nextDays >= 0 && nextDays <= 8  
                ? { text: episodeText, icon: '▶', color: '#00E676' }  
                : { text: episodeText, icon: '⏯︎', color: '#40C4FF' };  
        }  
        if (status === 'Ended')         return { text: episodeText, icon: '✔', color: '#FFD740' };  
        if (status === 'Canceled')      return { text: episodeText, icon: '✘', color: '#FF5252' };  
        if (status === 'Pilot')         return { text: 'Пилот',     icon: '✔', color: '#FFD740' };  
        if (status === 'In Production') return { text: formatPremiereLabel(info.first_air_date), icon: '✦', color: '#E040FB' };  
        if (status === 'Planned')       { var yr2 = formatYearLabel(info.first_air_date); return { text: 'Запланировано' + (yr2 ? ' ' + yr2 : ''), icon: '❱', color: '#E040FB' }; }  
        return { text: episodeText, icon: '⏯︎', color: '#40C4FF' };  
    }  
  
    function getMovieLabelInfo(info) {  
        var status = info.status;  
        var releaseDate = info.release_date;  
        var yr = formatYearLabel(releaseDate);  
        if (status === 'Rumored')         return { text: 'По слухам' + (yr ? ' ' + yr : ''),     icon: '❱', color: '#E040FB' };  
        if (status === 'Planned')         return { text: 'Запланировано' + (yr ? ' ' + yr : ''), icon: '❱', color: '#E040FB' };  
        if (status === 'In Production')   return { text: formatPremiereLabel(releaseDate),        icon: '✦', color: '#E040FB' };  
        if (status === 'Post Production') return { text: formatPremiereLabel(releaseDate),        icon: '✦', color: '#E040FB' };  
        if (status === 'Released')        return null;  
        if (status === 'Canceled')        return { text: 'Отменён', icon: '✘', color: '#FF5252' };  
        return null;  
    }  
  
    function fetchStatus(data, callback) {  
        var isTV = !!(data.original_name || data.first_air_date);  
        var net = new Lampa.Reguest();  
        if (isTV) {  
            net.silent(  
                Lampa.TMDB.api('tv/' + data.id + '?api_key=' + Lampa.TMDB.key()),  
                function(resp) { callback(resp && resp.id ? getTVLabelInfo(resp) : null); },  
                function() { callback(null); },  
                false, { cache: { life: 1440 } }  
            );  
        } else if (data.release_date || data.original_title) {  
            net.silent(  
                Lampa.TMDB.api('movie/' + data.id + '?api_key=' + Lampa.TMDB.key()),  
                function(resp) { callback(resp && resp.id ? getMovieLabelInfo(resp) : null); },  
                function() { callback(null); },  
                false, { cache: { life: 1440 } }  
            );  
        } else {  
            callback(null);  
        }  
    }  
  
    /* ═══════════════════════════════════════════════════════  
       OVERLAY BUILDING  
    ═══════════════════════════════════════════════════════ */  
    function buildOverlay(card, data) {  
        var genreLabels = getGenreLabels(data, 1);   // только 1 жанр  
        var year = ((data.release_date || data.first_air_date || '') + '').slice(0, 4);  
        if (year === '0000') year = '';  
  
        var overlay = document.createElement('div');  
        overlay.className = 'crl-overlay';  
  
        /* строка 1-2: название */  
        var titleEl = document.createElement('div');  
        titleEl.className = 'crl-title';  
        titleEl.textContent = data.title || data.name || '';  
        overlay.appendChild(titleEl);  
  
        /* строка 2: статус (placeholder, заполняется асинхронно) */  
        var statusRow = document.createElement('div');  
        statusRow.className = 'crl-row';  
        statusRow.style.display = 'none';   // скрыт пока нет данных  
  
        var statusLeft = document.createElement('div');  
        statusLeft.className = 'crl-left';  
        var statusIconEl = document.createElement('span');  
        statusIconEl.className = 'crl-status-icon';  
        var statusTextEl = document.createElement('span');  
        statusLeft.appendChild(statusIconEl);  
        statusLeft.appendChild(statusTextEl);  
        statusRow.appendChild(statusLeft);  
        overlay.appendChild(statusRow);  
  
        card._crlStatusRow    = statusRow;  
        card._crlStatusIconEl = statusIconEl;  
        card._crlStatusTextEl = statusTextEl;  
  
        /* строка 3: год · жанр | качество рейтинг */  
        var metaRow = document.createElement('div');  
        metaRow.className = 'crl-row';  
  
        var metaLeft = document.createElement('div');  
        metaLeft.className = 'crl-left';  
        var leftText = year;  
        if (genreLabels.length) leftText += (year ? ' · ' : '') + genreLabels[0];  
        metaLeft.textContent = leftText;  
  
        var metaRight = document.createElement('div');  
        metaRight.className = 'crl-right';  
  
        /* качество — plain text, скрыт до загрузки */  
        var qEl = document.createElement('span');  
        qEl.className = 'crl-quality-text';  
        qEl.style.display = 'none';  
        metaRight.appendChild(qEl);  
        card._crlQualityEl = qEl;  
  
        /* разделитель между качеством и рейтингом */  
        var sepEl = document.createElement('span');  
        sepEl.className = 'crl-sep';  
        sepEl.textContent = '·';  
        sepEl.style.display = 'none';  
        sepEl.style.opacity = '0.5';  
        metaRight.appendChild(sepEl);  
        card._crlSepEl = sepEl;  
  
        /* рейтинг — скрыт до загрузки */  
        var vEl = document.createElement('span');  
        vEl.className = 'crl-vote';  
        vEl.style.display = 'none';  
        metaRight.appendChild(vEl);  
        card._crlVoteEl = vEl;  
  
        metaRow.appendChild(metaLeft);  
        metaRow.appendChild(metaRight);  
        overlay.appendChild(metaRow);  
  
        return overlay;  
    }  
  
    function processCard(card) {  
        if (card.dataset.crlDone) return;  
        if (card.classList.contains('card--wide')) return;  
        if (!card.card_data) return;  
        card.dataset.crlDone = '1';  
        var view = card.querySelector('.card__view');  
        if (!view) return;  
        view.appendChild(buildOverlay(card, card.card_data));  
    }  
  
    /* ═══════════════════════════════════════════════════════  
       ASYNC UPDATES  
    ═══════════════════════════════════════════════════════ */  
    function updateCardAsync(card) {  
        var data = card.card_data;  
        if (!data || !data.id) return;  
  
        /* качество */  
        fetchQuality(data, function(q) {  
            if (!q || !card._crlQualityEl) return;  
            card._crlQualityEl.textContent = q;  
            card._crlQualityEl.style.display = '';  
            /* показываем разделитель только если есть и качество и рейтинг */  
            if (card._crlVoteEl && card._crlVoteEl.style.display !== 'none') {  
                card._crlSepEl.style.display = '';  
            }  
        });  
  
        /* рейтинг */  
        if (data.release_date || data.first_air_date) {  
            fetchRating(data, function(kp, tmdb) {  
                if (!card._crlVoteEl) return;  
                var rating = kp > 0 ? kp : tmdb;  
                if (rating > 0) {  
                    card._crlVoteEl.innerHTML = rating.toFixed(1) + (kp > 0 ? '<span class="source--name"></span>' : '');  
                    card._crlVoteEl.style.display = '';  
                    if (card._crlQualityEl && card._crlQualityEl.style.display !== 'none') {  
                        card._crlSepEl.style.display = '';  
                    }  
                }  
            });  
        }  
  
        /* статус */  
        fetchStatus(data, function(labelInfo) {  
            if (!labelInfo || !card._crlStatusIconEl) return;  
            card._crlStatusIconEl.textContent = labelInfo.icon + '\u00a0';  
            card._crlStatusIconEl.style.color = labelInfo.color;  
            card._crlStatusTextEl.textContent = labelInfo.text;  
            card._crlStatusRow.style.display = '';  
        });  
    }  
  
    /* ═══════════════════════════════════════════════════════  
       OBSERVERS  
    ═══════════════════════════════════════════════════════ */  
    var intersectionObserver = null;  
  
    function observeCard(card) {  
        if (card.dataset.crlObserved) return;  
        card.dataset.crlObserved = '1';  
        if (intersectionObserver) {  
            intersectionObserver.observe(card);  
        } else {  
            processCard(card);  
            updateCardAsync(card);  
        }  
    }  
  
    if (typeof IntersectionObserver !== 'undefined') {  
        intersectionObserver = new IntersectionObserver(function(entries) {  
            for (var i = 0; i < entries.length; i++) {  
                var entry = entries[i];  
                if (!entry.isIntersecting) continue;  
                intersectionObserver.unobserve(entry.target);  
                processCard(entry.target);  
                updateCardAsync(entry.target);  
            }  
        }, { rootMargin: '100px' });  
    }  
  
    var mutationObserver = new MutationObserver(function(mutations) {  
        for (var mi = 0; mi < mutations.length; mi++) {  
            var nodes = mutations[mi].addedNodes;  
            for (var ni = 0; ni < nodes.length; ni++) {  
                var node = nodes[ni];  
                if (node.nodeType !== 1) continue;  
                if (node.classList && node.classList.contains('card')) {  
                    (function(n) { setTimeout(function() { observeCard(n); }, 0); })(node);  
                } else if (node.querySelectorAll) {  
                    [].forEach.call(node.querySelectorAll('.card'), function(c) {  
                        (function(n) { setTimeout(function() { observeCard(n); }, 0); })(c);  
                    });  
                }  
            }  
        }  
    });  
  
    function scanExisting() {  
        [].forEach.call(document.querySelectorAll('.card'), observeCard);  
    }  
  
    function start() {  
        mutationObserver.observe(document.body, { childList: true, subtree: true });  
        scanExisting();  
    }  
  
    Lampa.Listener.follow('app', function(e) {  
        if (e.type === 'ready') scanExisting();  
        if (e.type === 'destroy') {  
            mutationObserver.disconnect();  
            if (intersectionObserver) intersectionObserver.disconnect();  
        }  
    });  
  
    if (document.body) start();  
    else document.addEventListener('DOMContentLoaded', start);  
})();
