(function () {
    if (window.customCardPlugin) return;
    window.customCardPlugin = true;
    var KP_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='white' d='M12.049 0C5.45 0 .104 5.373.104 12S5.45 24 12.049 24c3.928 0 7.414-1.904 9.592-4.844l-9.803-5.174l6.256 6.418h-3.559l-4.373-6.086V20.4h-2.89V3.6h2.89v6.095L14.535 3.6h3.559l-6.422 6.627l9.98-5.368C19.476 1.911 15.984 0 12.05 0zm10.924 7.133l-9.994 4.027l10.917-.713a12 12 0 0 0-.923-3.314m-10.065 5.68l10.065 4.054c.458-1.036.774-2.149.923-3.314z'/%3E%3C/svg%3E";
    document.head.insertAdjacentHTML('beforeend', '<style>' +
        '.card__title{display:none!important}' +
        '.card__age{display:none!important}' +
        '.card__type{display:none!important}' +
        '.card__quality{display:none!important}' +
        '.card__vote{display:none!important}' +
        '.card.focus .card-watched{display:none!important}' +
        '.card__icons{top:0.5em!important;left:auto!important;right:0.5em!important;justify-content:flex-end!important}' +
        '.card__icons-inner{background:none!important;border-radius:0!important;flex-direction:column!important}' +
        '.card__icons-inner>.card__icon{margin-bottom:0.2em}' +
        '.card__icon{filter:drop-shadow(0 1px 4px rgba(0,0,0,1)) drop-shadow(0 0 8px rgba(0,0,0,0.9))!important}' +
        '.card__overlay{position:absolute;left:0;right:0;bottom:0;padding:3em 0.4em 0.25em 0.4em;background:linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,0.9) 100%);border-bottom-left-radius:1em;border-bottom-right-radius:1em;z-index:1;pointer-events:none}' +
        '.card__overlay-title{font-size:1.35em;font-weight:600;line-height:1.1;color:#fff;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical;margin-bottom:0.15em}' +
        '.card__status-row{display:flex;align-items:baseline;margin-bottom:0.15em;line-height:1;overflow:hidden;white-space:nowrap;min-width:0}' +
        '.card__status-row:empty{display:none}' +
        '.card__status-row .tvs-icon{font-size:1.1em;margin-right:0.2em;flex-shrink:0}' +
        '.card__status-row .tvs-main{font-size:0.85em;color:#ccc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex-shrink:1;min-width:0}' +
        '.card__status-row .tvs-suffix{font-size:0.85em;color:#ccc;flex-shrink:0;white-space:nowrap}' +
        '.card__badge{display:flex;align-items:center;width:100%;overflow:hidden}' +
        '.card__badge>*+*{margin-left:0.3em}' +
        '.card__badge-year,.card__badge-sep{font-size:0.85em;color:#ccc;flex-shrink:0;white-space:nowrap}' +
        '.card__badge-genre{font-size:0.85em;color:#ccc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0}' +
        '.card__badge-quality,.card__badge-rating{font-size:1em;font-weight:700;color:#ddd;flex-shrink:0;white-space:nowrap}' +
        '.card__badge-kp-icon{display:inline-block;width:1em;height:1.25em;background-repeat:no-repeat;background-position:center;background-size:contain;margin-left:0.05em;vertical-align:middle;flex-shrink:0}' +
    '</style>');
    var posterCache = {};
    var posterCacheSize = 0;
    function setPosterCache(key, val) {
        if (posterCacheSize > 200) { posterCache = {}; posterCacheSize = 0; }
        posterCache[key] = val;
        posterCacheSize++;
    }
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
        var posterNetwork = new Lampa.Reguest();
        var url = Lampa.TMDB.api(type + '/' + id + '/images?include_image_language=null&api_key=' + tmdbKey());
        posterNetwork.silent(url, function (res) {
            var posters = (res && res.posters) || [];
            posters.sort(function (a, b) { return b.vote_average - a.vote_average; });
            if (posters.length) {
                var src = Lampa.TMDB.image('t/p/w342' + posters[0].file_path);
                setPosterCache(id, src);
                img.src = src;
            } else {
                setPosterCache(id, null);
            }
        }, function () {
            setPosterCache(id, null);
        }, false, { cache: { life: 1440 } });
    }
    function setupPosterReplacement(img, data) {
        if (!data || !data.id) return;
        var done = false;
        function doReplace() {
            if (done) return;
            done = true;
            fetchCleanPoster(data, img);
        }
        var src = img.getAttribute('src') || '';
        if (src && src.indexOf('img_load') === -1 && src.indexOf('img_broken') === -1 && src.length > 1) {
            doReplace();
            return;
        }
        var imgObserver = new MutationObserver(function () {
            var newSrc = img.getAttribute('src') || '';
            if (newSrc && newSrc.indexOf('img_load') === -1 && newSrc.indexOf('img_broken') === -1 && newSrc.length > 1) {
                imgObserver.disconnect();
                doReplace();
            }
        });
        imgObserver.observe(img, { attributes: true, attributeFilter: ['src'] });
    }
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
    var SERVERS = ['http://jac.red', 'https://jr.maxvol.pro'];
    var RE_TS  = /\b(tsrip|ts|telesync|telecine|cam|camrip|workprint|wp|scr|screener|dvdscr|dcprip)\b/i;
    var RE_TS2 = /звук\s*с\s*ts|sound\s*ts|audio\s*ts|dub\s*ts/i;
    var RE_4K  = /\b(2160p|2160р|4k|uhd|4к)\b/i;
    var RE_HD  = /\b(1080p|1080р|720p|720р|blu\-ray|bdrip|bdremux|web\-dl|webdl|web\-dlrip|webrip|hdtv|hdtvrip|hddvd|hddvdrip|fullhd|fhd|hd|hdrip)\b/i;
    var qualityCache = {};
    var qualityCacheSize = 0;
    function qFromStr(t) {
        if (!t) return null;
        if (RE_TS.test(t) || RE_TS2.test(t)) return 'TS';
        if (RE_4K.test(t)) return '4K';
        if (RE_HD.test(t)) return 'HD';
        return null;
    }
    function setQualityCache(key, val) {
        if (qualityCacheSize > 200) { qualityCache = {}; qualityCacheSize = 0; }
        qualityCache[key] = val;
        qualityCacheSize++;
    }
    function fetchQuality(data, cb) {
        var lampaQ = data.quality || data.release_quality;
        var key = data.id;
        if (key && qualityCache[key] !== undefined) return cb(qualityCache[key]);
        var title = data.title || data.name;
        var year = parseInt((data.release_date || data.first_air_date || '').slice(0, 4)) || null;
        var serverIndex = 0;
        var titles = [];
        function done() {
            var result = null;
            if (titles.length) {
                var tsCount = 0, has4K = false, hasHD = false;
                titles.forEach(function (t) {
                    var quality = qFromStr(t);
                    if (quality === 'TS') tsCount++;
                    else if (quality === '4K') has4K = true;
                    else if (quality === 'HD') hasHD = true;
                });
                result = tsCount / titles.length >= 0.5 ? 'TS' : has4K ? '4K' : hasHD ? 'HD' : null;
            }
            if (!result && lampaQ) result = qFromStr(lampaQ) || lampaQ.toUpperCase();
            if (key) setQualityCache(key, result);
            cb(result);
        }
        function next() {
            if (serverIndex >= SERVERS.length) return done();
            var url = SERVERS[serverIndex] + '/api/v2.0/indexers/all/results?apikey=&Query='
                + encodeURIComponent(title) + (year ? '&year=' + year : '');
            var qualityNetwork = new Lampa.Reguest();
            qualityNetwork.silent(url, function (res) {
                (res && res.Results || []).forEach(function (r) {
                    var y = parseInt((r.info && r.info.released) || r.year);
                    var inTitle = !year || (r.Title && (
                        r.Title.indexOf(String(year)) !== -1 ||
                        r.Title.indexOf(String(year - 1)) !== -1 ||
                        r.Title.indexOf(String(year + 1)) !== -1
                    ));
                    if ((y && Math.abs(y - year) <= 1) || (!y && inTitle)) titles.push(r.Title);
                });
                serverIndex++;
                next();
            }, function () { serverIndex++; next(); });
        }
        next();
    }
    var TTL_OK  = 15 * 24 * 60 * 60 * 1000;
    var TTL_ERR =      24 * 60 * 60 * 1000;
    var TTL_SRC =       3 * 60 * 60 * 1000;
    var KP_KEY  = '14342b35-714b-449d-bf10-30d0d9ac22e6';
    var ratingCache = Lampa.Storage.cache('ccp_kp_rating', 500, {});
    function getRatingCache(id, type) {
        var key = type === 'search' ? 'search_' + id : id;
        var item = ratingCache[key];
        if (!item) return null;
        var ttl = type === 'search' ? TTL_SRC : item.kp === 0 ? TTL_ERR : TTL_OK;
        return (Date.now() - item.timestamp) < ttl ? item : null;
    }
    function setRatingCache(id, data, type) {
        var key = type === 'search' ? 'search_' + id : id;
        ratingCache[key] = Object.assign({}, data, { timestamp: Date.now() });
        Lampa.Storage.set('ccp_kp_rating', ratingCache);
    }
    function fromKpApi(kpId, card, cb) {
        var tmdb = card.vote_average || 0;
        var apiNetwork = new Lampa.Reguest();
        apiNetwork.silent('https://kinopoiskapiunofficial.tech/api/v2.2/films/' + kpId,
            function (d) { var kp = d.ratingKinopoisk || 0; setRatingCache(card.id, { kp: kp, tmdb: tmdb }); cb(kp, tmdb); },
            function ()  { setRatingCache(card.id, { kp: 0, tmdb: tmdb }); cb(0, tmdb); },
            false, { timeout: 3000, headers: { 'X-API-KEY': KP_KEY } }
        );
    }
    function fromKpXml(kpId, card, cb) {
        var tmdb = card.vote_average || 0;
        var xmlNetwork = new Lampa.Reguest();
        xmlNetwork.silent('https://rating.kinopoisk.ru/' + kpId + '.xml',
            function (str) {
                if (str && str.indexOf('<rating>') !== -1) {
                    try {
                        var kp = parseFloat($($.parseXML(str)).find('kp_rating').text()) || 0;
                        if (kp > 0) { setRatingCache(card.id, { kp: kp, tmdb: tmdb }); cb(kp, tmdb); return; }
                    } catch (e) {}
                }
                fromKpApi(kpId, card, cb);
            },
            function () { fromKpApi(kpId, card, cb); },
            false, { timeout: 1000, dataType: 'text' }
        );
    }
    function fetchRating(card, cb) {
        var cached = getRatingCache(card.id);
        if (cached) return cb(cached.kp, cached.tmdb);
        var searchCached = getRatingCache(card.id, 'search');
        if (searchCached) return fromKpXml(searchCached.kp_id, card, cb);
        var year = parseInt((card.release_date || card.first_air_date || '').slice(0, 4)) || null;
        var title = card.title || card.name;
        var tmdb = card.vote_average || 0;
        var fail = function () { setRatingCache(card.id, { kp: 0, tmdb: tmdb }); cb(0, tmdb); };
        function byTitle() {
            var query = (title || '').toLowerCase().replace(/[^\wа-яё\s]/gi, ' ').replace(/\s+/g, ' ').trim();
            var searchNetwork = new Lampa.Reguest();
            searchNetwork.silent('https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=' + encodeURIComponent(query),
                function (json) {
                    if (!json.films || !json.films.length) return fail();
                    var best = null;
                    if (year) {
                        best = json.films.find(function (f) { return parseInt((f.year || '').slice(0, 4)) === year; });
                        if (!best) best = json.films.find(function (f) {
                            var y = parseInt((f.year || '').slice(0, 4));
                            return y && y > year - 3 && y < year + 3;
                        });
                    }
                    best = best || json.films[0];
                    if (best) { setRatingCache(card.id, { kp_id: best.filmId }, 'search'); fromKpXml(best.filmId, card, cb); }
                    else fail();
                },
                fail, false, { timeout: 5000, headers: { 'X-API-KEY': KP_KEY } }
            );
        }
        if (card.imdb_id) {
            var imdbNetwork = new Lampa.Reguest();
            imdbNetwork.silent('https://kinopoiskapiunofficial.tech/api/v2.2/films?imdbId=' + encodeURIComponent(card.imdb_id),
                function (d) {
                    var filmItem = d.items && d.items[0];
                    var id = (filmItem && (filmItem.kinopoiskId || filmItem.filmId)) || d.kinopoiskId || d.filmId;
                    if (id) { setRatingCache(card.id, { kp_id: id }, 'search'); fromKpXml(id, card, cb); }
                    else byTitle();
                },
                byTitle, false, { timeout: 5000, headers: { 'X-API-KEY': KP_KEY } }
            );
        } else {
            byTitle();
        }
    }
    function daysUntil(dateStr) {
        if (!dateStr) return -1;
        var today = new Date(); today.setHours(0, 0, 0, 0);
        var target = Lampa.Utils.parseToDate(dateStr);
        return Math.round((target.getTime() - today.getTime()) / 86400000);
    }
    function fmtDate(dateStr) {
        if (!dateStr) return null;
        var parts = dateStr.split('-');
        if (parts.length === 1 && parts[0].length === 4) return parts[0];
        if (parts.length === 2) return parts[1] + '.' + parts[0].slice(2);
        var days = daysUntil(dateStr);
        if (days <= 0) return null;
        if (days <= 30) return 'Премьера ' + days + 'дн.';
        return parts[2] + '.' + parts[1] + '.' + parts[0].slice(2);
    }
    function fmtPremiere(dateStr) {
        if (!dateStr) return 'Премьера';
        var parts = dateStr.split('-');
        if (parts.length === 1 && parts[0].length === 4) return 'Премьера ' + parts[0];
        if (parts.length === 2) return 'Премьера ' + parts[1] + '.' + parts[0].slice(2);
        var days = daysUntil(dateStr);
        if (days > 0 && days <= 30) return 'Премьера ' + days + 'дн.';
        return 'Премьера ' + parts[2] + '.' + parts[1] + '.' + parts[0].slice(2);
    }
    function fmtYear(dateStr) { return dateStr ? dateStr.split('-')[0] : null; }
    function buildEpText(info) {
        var lastEp = info.last_episode_to_air, nextEp = info.next_episode_to_air;
        if (!lastEp) return null;
        var currentSeason = lastEp.season_number, total = 0;
        (info.seasons || []).forEach(function (s) {
            if (s.season_number > 0 && s.season_number < currentSeason) total += s.episode_count;
        });
        total += lastEp.episode_number;
        var seasonPart = 'S' + currentSeason, episodePart = 'E' + total;
        if (nextEp) {
            var totalEpisodes = info.number_of_episodes;
            if (nextEp.season_number > currentSeason) {
                seasonPart += '/S' + nextEp.season_number;
                if (totalEpisodes && totalEpisodes > total) episodePart += '/E' + totalEpisodes;
            } else if (nextEp.season_number === currentSeason && totalEpisodes && totalEpisodes > total) {
                episodePart += '/E' + totalEpisodes;
            }
        }
        return seasonPart + ':' + episodePart;
    }
    function getTVInfo(info) {
        var lastEp = info.last_episode_to_air, nextEp = info.next_episode_to_air;
        var status = info.status, episodeText = buildEpText(info);
        if (!lastEp) {
            if (status === 'Returning Series') { var dateLabel = fmtDate(info.first_air_date); return { text: dateLabel || 'Онгоинг', icon: '▶', color: '#00E676' }; }
            if (status === 'In Production')    return { text: fmtPremiere(info.first_air_date), icon: '✦', color: '#E040FB' };
            if (status === 'Planned')          { var year = fmtYear(info.first_air_date); return { text: 'Запланировано' + (year ? ' ' + year : ''), icon: '❱', color: '#E040FB' }; }
            return null;
        }
        if (status === 'Returning Series') {
            var nextDays = (nextEp && nextEp.air_date) ? daysUntil(nextEp.air_date) : 999;
            return nextDays >= 0 && nextDays <= 8 ? { text: episodeText, icon: '▶', color: '#00E676' } : { text: episodeText, icon: '⏯︎', color: '#40C4FF' };
        }
        if (status === 'Ended')         return { text: episodeText, icon: '✔', color: '#FFD740' };
        if (status === 'Canceled')      return { text: episodeText, icon: '✘', color: '#FF5252' };
        if (status === 'Pilot')         return { text: 'Пилот', icon: '✔', color: '#FFD740' };
        if (status === 'In Production') return { text: fmtPremiere(info.first_air_date), icon: '✦', color: '#E040FB' };
        if (status === 'Planned')       { var year2 = fmtYear(info.first_air_date); return { text: 'Запланировано' + (year2 ? ' ' + year2 : ''), icon: '❱', color: '#E040FB' }; }
        return { text: episodeText, icon: '⏯︎', color: '#40C4FF' };
    }
    function getMovieInfo(info) {
        var status = info.status, releaseDate = info.release_date;
        if (status === 'Rumored')         { var year = fmtYear(releaseDate); return { text: 'По слухам' + (year ? ' ' + year : ''), icon: '❱', color: '#E040FB' }; }
        if (status === 'Planned')         { var year2 = fmtYear(releaseDate); return { text: 'Запланировано' + (year2 ? ' ' + year2 : ''), icon: '❱', color: '#E040FB' }; }
        if (status === 'In Production')   return { text: fmtPremiere(releaseDate), icon: '✦', color: '#E040FB' };
        if (status === 'Post Production') return { text: fmtPremiere(releaseDate), icon: '✦', color: '#E040FB' };
        if (status === 'Canceled')        return { text: 'Отменён', icon: '✘', color: '#FF5252' };
        return null;
    }
    function isPersonCard(data) {
        return !!(data.known_for_department !== undefined || (data.profile_path && !data.poster_path && !data.backdrop_path));
    }
    function splitStatusText(text) {
        var parts = text.split(' ');
        if (parts.length < 2) return { main: text, suffix: '' };
        var last = parts[parts.length - 1];
        if (/^\d{4}$/.test(last) || /^\d{1,2}\.\d{2}\.\d{2}$/.test(last) || /^\d+дн\.$/.test(last)) {
            return { main: parts.slice(0, -1).join(' '), suffix: '\u00a0' + last };
        }
        return { main: text, suffix: '' };
    }
    function loadCardStatus(data, statusRow) {
        if (isPersonCard(data)) return;
        var isTV = !!(data.original_name || data.first_air_date);
        if (!isTV && !data.release_date && !data.original_title) return;
        var network = new Lampa.Reguest();
        var endpoint = isTV
            ? 'tv/' + data.id + '?api_key=' + tmdbKey()
            : 'movie/' + data.id + '?api_key=' + tmdbKey();
        network.silent(
            Lampa.TMDB.api(endpoint),
            function (resp) {
                if (!resp || !resp.id) return;
                var statusInfo = isTV ? getTVInfo(resp) : getMovieInfo(resp);
                if (!statusInfo || !statusInfo.text) return;
                var iconSpan = document.createElement('span');
                iconSpan.className = 'tvs-icon';
                iconSpan.style.color = statusInfo.color;
                iconSpan.textContent = statusInfo.icon;
                var split = splitStatusText(statusInfo.text);
                var mainSpan = document.createElement('span');
                mainSpan.className = 'tvs-main';
                mainSpan.textContent = split.main;
                statusRow.appendChild(iconSpan);
                statusRow.appendChild(mainSpan);
                if (split.suffix) {
                    var suffixSpan = document.createElement('span');
                    suffixSpan.className = 'tvs-suffix';
                    suffixSpan.textContent = split.suffix;
                    statusRow.appendChild(suffixSpan);
                }
            },
            function () {},
            false,
            { cache: { life: 1440 } }
        );
    }
    function processCard(card) {
        if (!card.card_data) return;
        if (card.dataset.ccp) return;
        card.dataset.ccp = '1';
        var data = card.card_data;
        var view = card.querySelector('.card__view');
        if (!view) return;
        var titleEl = card.querySelector('.card__title');
        var ageEl = card.querySelector('.card__age');
        if (titleEl) titleEl.style.display = 'none';
        if (ageEl) ageEl.style.display = 'none';
        var icons = card.querySelector('.card__icons');
        if (icons) {
            icons.style.cssText = 'top:0.5em;left:auto;right:0.5em;justify-content:flex-end;';
            var inner = icons.querySelector('.card__icons-inner');
            if (inner) inner.style.cssText = 'background:none;border-radius:0;flex-direction:column;';
        }
        var img = card.querySelector('.card__img');
        if (img) setupPosterReplacement(img, data);
        var overlay = document.createElement('div');
        overlay.className = 'card__overlay';
        var overlayTitle = document.createElement('div');
        overlayTitle.className = 'card__overlay-title';
        overlayTitle.textContent = data.title || data.name || '';
        overlay.appendChild(overlayTitle);
        var statusRow = document.createElement('div');
        statusRow.className = 'card__status-row';
        overlay.appendChild(statusRow);
        var badge = document.createElement('div');
        badge.className = 'card__badge';
        var year = ((data.release_date || data.first_air_date || '') + '').slice(0, 4);
        var genre = getLabel(data);
        if (year) {
            var yearEl = document.createElement('span');
            yearEl.className = 'card__badge-year';
            yearEl.textContent = year;
            badge.appendChild(yearEl);
        }
        if (year && genre) {
            var sepEl = document.createElement('span');
            sepEl.className = 'card__badge-sep';
            sepEl.textContent = '•';
            badge.appendChild(sepEl);
        }
        if (genre) {
            var genreEl = document.createElement('span');
            genreEl.className = 'card__badge-genre';
            genreEl.textContent = genre;
            badge.appendChild(genreEl);
        }
        var qualityEl = document.createElement('span');
        qualityEl.className = 'card__badge-quality';
        qualityEl.style.display = 'none';
        badge.appendChild(qualityEl);
        var ratingEl = document.createElement('span');
        ratingEl.className = 'card__badge-rating';
        ratingEl.style.display = 'none';
        badge.appendChild(ratingEl);
        var kpIconEl = document.createElement('span');
        kpIconEl.className = 'card__badge-kp-icon';
        kpIconEl.style.cssText = 'display:none;background-image:url("' + KP_SVG + '")';
        badge.appendChild(kpIconEl);
        overlay.appendChild(badge);
        view.appendChild(overlay);
        if (data.id) loadCardStatus(data, statusRow);
        fetchQuality(data, function (quality) {
            if (quality) { qualityEl.textContent = quality; qualityEl.style.display = ''; }
        });
        if (data.id && (data.release_date || data.first_air_date)) {
            fetchRating(data, function (kp, tmdb) {
                var val = kp > 0 ? kp : tmdb;
                if (val > 0) {
                    ratingEl.textContent = parseFloat(val).toFixed(1);
                    ratingEl.style.display = '';
                    if (kp > 0) kpIconEl.style.cssText = 'background-image:url("' + KP_SVG + '")';
                }
            });
        } else {
            var vote = parseFloat(data.vote_average || 0);
            if (vote > 0) { ratingEl.textContent = vote.toFixed(1); ratingEl.style.display = ''; }
        }
    }
    var intersectionObserver = null;
    if (typeof IntersectionObserver !== 'undefined') {
        intersectionObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                intersectionObserver.unobserve(e.target);
                processCard(e.target);
            });
        }, { rootMargin: '200px' });
    }
    function observe(card) {
        if (!card.card_data || card.dataset.ccp) return;
        if (intersectionObserver) intersectionObserver.observe(card);
        else processCard(card);
    }
    var mutationObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
            m.addedNodes.forEach(function (node) {
                if (node.nodeType !== 1) return;
                if (node.classList && node.classList.contains('card')) observe(node);
                if (node.querySelectorAll) [].forEach.call(node.querySelectorAll('.card'), observe);
            });
        });
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    [].forEach.call(document.querySelectorAll('.card'), observe);
    Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') [].forEach.call(document.querySelectorAll('.card'), observe);
        if (e.type === 'destroy') {
            if (intersectionObserver) intersectionObserver.disconnect();
            mutationObserver.disconnect();
        }
    });
})();
