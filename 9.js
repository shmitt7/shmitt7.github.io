(function() {
    if (window.cardInfoOverlay) return;
    window.cardInfoOverlay = true;

    var SERVERS = ['https://jac.red', 'https://jr.maxvol.pro'];
    var RE_TS = /\b(ts|telesync|telecine|cam|camrip|workprint|wp|scr|screener|dvdscr)\b/i;
    var RE_TS2 = /звук\s*с\s*ts|sound\s*ts|audio\s*ts|dub\s*ts/i;
    var RE_4K = /\b(2160p|2160р|4k|uhd|4к)\b/i;
    var RE_HD = /\b(1080p|1080р|720p|720р|blu\-ray|bdrip|bdremux|web\-dl|webdl|web\-dlrip|webrip|hdtv|hdtvrip|hddvd|hddvdrip|fullhd|fhd|hd|hdrip)\b/i;
    var API_KEY_KP = '14342b35-714b-449d-bf10-30d0d9ac22e6';

    var allGenres = {
        28:'Боевик',12:'Приключения',35:'Комедия',80:'Криминал',
        18:'Драма',10751:'Семейный',14:'Фэнтези',36:'История',
        27:'Ужасы',10402:'Музыка',9648:'Детектив',10749:'Мелодрама',
        878:'Фантастика',10770:'Телефильм',53:'Триллер',10752:'Военный',
        37:'Вестерн',10759:'Экшен',10762:'Детский',
        10765:'НФ и Фэнтези',10768:'Война и Политика'
    };

    var tmdbCache = {};
    var tmdbCacheSize = 0;
    var qualityCache = {};
    var qualityCacheSize = 0;
    var kpRatingCache = Lampa.Storage.cache('cio_kp', 500, {});
    var kpSearchCache = Lampa.Storage.cache('cio_kps', 300, {});

    var CACHE_KP_SUCCESS = 15 * 24 * 60 * 60 * 1000;
    var CACHE_KP_ERROR = 24 * 60 * 60 * 1000;
    var CACHE_KP_SEARCH = 3 * 60 * 60 * 1000;

    var intersectionObserver = null;
    var mutationObserver = null;

    function setTmdbCache(key, value) {
        if (tmdbCacheSize > 200) { tmdbCache = {}; tmdbCacheSize = 0; }
        tmdbCache[key] = value;
        tmdbCacheSize++;
    }

    function setQualityCache(key, value) {
        if (qualityCacheSize > 200) { qualityCache = {}; qualityCacheSize = 0; }
        qualityCache[key] = value;
        qualityCacheSize++;
    }

    function getKpRatingCache(id) {
        var item = kpRatingCache[id];
        if (!item) return null;
        var ttl = item.kp === 0 ? CACHE_KP_ERROR : CACHE_KP_SUCCESS;
        return (Date.now() - item.timestamp) < ttl ? item : null;
    }

    function setKpRatingCache(id, kp, tmdb) {
        kpRatingCache[id] = { kp: kp, tmdb: tmdb, timestamp: Date.now() };
        Lampa.Storage.set('cio_kp', kpRatingCache);
    }

    function getKpSearchCacheItem(id) {
        var item = kpSearchCache[id];
        if (!item) return null;
        return (Date.now() - item.timestamp) < CACHE_KP_SEARCH ? item : null;
    }

    function setKpSearchCacheItem(id, kpId) {
        kpSearchCache[id] = { kp_id: kpId, timestamp: Date.now() };
        Lampa.Storage.set('cio_kps', kpSearchCache);
    }

    function daysUntil(dateStr) {
        if (!dateStr) return -1;
        var today = new Date();
        today.setHours(0, 0, 0, 0);
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

    function buildEpisodeText(info) {
        var last = info.last_episode_to_air;
        var next = info.next_episode_to_air;
        var seasons = info.seasons || [];
        if (!last) return null;
        var curS = last.season_number;
        var airedTotal = 0;
        for (var i = 0; i < seasons.length; i++) {
            var s = seasons[i];
            if (s.season_number > 0 && s.season_number < curS) airedTotal += s.episode_count;
        }
        airedTotal += last.episode_number;
        var sPart = 'S' + curS;
        var ePart = 'E' + airedTotal;
        if (next) {
            var totalAll = info.number_of_episodes;
            if (next.season_number > curS) {
                sPart += '/S' + next.season_number;
                if (totalAll && totalAll > airedTotal) ePart += '/E' + totalAll;
            } else if (next.season_number === curS && totalAll && totalAll > airedTotal) {
                ePart += '/E' + totalAll;
            }
        }
        return sPart + ':' + ePart;
    }

    function getTVStatusInfo(info) {
        var last = info.last_episode_to_air;
        var next = info.next_episode_to_air;
        var status = info.status;
        var episodeText = buildEpisodeText(info);
        var dateLabel;
        if (!last) {
            if (status === 'Returning Series') {
                dateLabel = formatDateLabel(info.first_air_date);
                return { text: dateLabel || 'Онгоинг', icon: '‖', color: '#2196F3' };
            }
            if (status === 'In Production') {
                dateLabel = formatDateLabel(info.first_air_date);
                return { text: dateLabel || 'В производстве', icon: '◷', color: '#9C27B0' };
            }
            if (status === 'Planned') {
                dateLabel = formatDateLabel(info.first_air_date);
                return { text: dateLabel || 'Запланировано', icon: '◷', color: '#9C27B0' };
            }
            return null;
        }
        if (status === 'Returning Series') {
            var nextDays = (next && next.air_date) ? daysUntil(next.air_date) : 999;
            if (nextDays >= 0 && nextDays <= 8) return { text: episodeText, icon: '▶', color: '#4CAF50' };
            return { text: episodeText, icon: '‖', color: '#2196F3' };
        }
        if (status === 'Ended') return { text: episodeText, icon: '✔', color: '#FFC107' };
        if (status === 'Canceled') return { text: episodeText, icon: '✘', color: '#f44336' };
        if (status === 'Pilot') return { text: episodeText || 'Пилот', icon: '✔', color: '#FFC107' };
        if (status === 'In Production') {
            dateLabel = formatDateLabel(info.first_air_date);
            return { text: dateLabel || 'В производстве', icon: '◷', color: '#9C27B0' };
        }
        if (status === 'Planned') {
            dateLabel = formatDateLabel(info.first_air_date);
            return { text: dateLabel || 'Запланировано', icon: '◷', color: '#9C27B0' };
        }
        return { text: episodeText, icon: '‖', color: '#2196F3' };
    }

    function getMovieStatusInfo(info) {
        var status = info.status;
        var releaseDate = info.release_date;
        var dateLabel;
        if (status === 'Rumored') {
            dateLabel = formatDateLabel(releaseDate);
            return { text: dateLabel || 'По слухам', icon: '◷', color: '#9C27B0' };
        }
        if (status === 'Planned') {
            dateLabel = formatDateLabel(releaseDate);
            return { text: dateLabel || 'Запланировано', icon: '◷', color: '#9C27B0' };
        }
        if (status === 'In Production') {
            dateLabel = formatDateLabel(releaseDate);
            return { text: dateLabel || 'В производстве', icon: '⚙', color: '#FF9800' };
        }
        if (status === 'Post Production') {
            dateLabel = formatDateLabel(releaseDate);
            return { text: dateLabel || 'Скоро', icon: '◷', color: '#FFC107' };
        }
        if (status === 'Canceled') return { text: 'Отменён', icon: '✘', color: '#f44336' };
        return null;
    }

    function getGenreText(data) {
        if (!data) return '';
        var isTv = !!data.name;
        var ids;
        if (Array.isArray(data.genres)) {
            ids = data.genres.map(function(g) { return (g && typeof g === 'object') ? g.id : g; });
        } else {
            ids = data.genre_ids || [];
        }
        var isAnimation = ids.indexOf(16) !== -1;
        if (isAnimation && data.original_language === 'ja') return 'Аниме';
        if (ids.indexOf(10763) !== -1) return 'Новости';
        if (ids.indexOf(10767) !== -1) return 'Ток-шоу';
        if (ids.indexOf(10764) !== -1) return 'Реалити-шоу';
        if (ids.indexOf(99) !== -1) return 'Документальный';
        if (ids.indexOf(10766) !== -1) return 'Мыльная опера';
        if (isAnimation) return isTv ? 'Мультсериал' : 'Мультфильм';
        if (ids[0] && allGenres[ids[0]]) return allGenres[ids[0]];
        return isTv ? 'Сериал' : 'Фильм';
    }

    function getQualityFromTitle(t) {
        if (!t) return null;
        if (RE_TS.test(t) || RE_TS2.test(t)) return 'TS';
        if (RE_4K.test(t)) return '4K';
        if (RE_HD.test(t)) return 'HD';
        return null;
    }

    function fetchQuality(data, callback) {
        var key = data.id;
        var builtinQuality = data.quality || data.release_quality || null;
        if (key && qualityCache[key] !== undefined) {
            callback(qualityCache[key] !== null ? qualityCache[key] : builtinQuality);
            return;
        }
        var title = data.title || data.name;
        var targetYear = parseInt((data.release_date || data.first_air_date || '').substring(0, 4)) || null;
        var serverIndex = 0;
        var titles = [];
        var network = new Lampa.Reguest();
        function done() {
            var result = null;
            if (titles.length) {
                var tsCount = 0, has4K = false, hasHD = false;
                for (var ti = 0; ti < titles.length; ti++) {
                    var q = getQualityFromTitle(titles[ti]);
                    if (q === 'TS') tsCount++;
                    else if (q === '4K') has4K = true;
                    else if (q === 'HD') hasHD = true;
                }
                result = tsCount / titles.length >= 0.5 ? 'TS' : has4K ? '4K' : hasHD ? 'HD' : null;
            }
            if (key) setQualityCache(key, result);
            callback(result !== null ? result : builtinQuality);
        }
        function next() {
            if (serverIndex >= SERVERS.length) { done(); return; }
            var url = SERVERS[serverIndex] + '/api/v2.0/indexers/all/results?apikey=&Query=' + encodeURIComponent(title) + (targetYear ? '&year=' + targetYear : '');
            network.silent(url, function(res) {
                var results = (res && res.Results) || [];
                for (var ri = 0; ri < results.length; ri++) {
                    var r = results[ri];
                    var y = parseInt((r.info && r.info.released) || r.year);
                    var inTitle = !targetYear || (r.Title && r.Title.indexOf(String(targetYear)) !== -1);
                    if ((y && y === targetYear) || (!y && inTitle)) titles.push(r.Title);
                }
                serverIndex++;
                next();
            }, function() { serverIndex++; next(); });
        }
        next();
    }

    function fetchKpRatingById(kpId, tmdbVote, tmdbId, callback) {
        var network = new Lampa.Reguest();
        network.silent(
            'https://rating.kinopoisk.ru/' + kpId + '.xml',
            function(str) {
                if (str && str.indexOf('<rating>') !== -1) {
                    try {
                        var kp = parseFloat($($.parseXML(str)).find('kp_rating').text()) || 0;
                        if (kp > 0) {
                            setKpRatingCache(tmdbId, kp, tmdbVote);
                            callback(kp, true);
                            return;
                        }
                    } catch(e) {}
                }
                fetchKpFromApi(kpId, tmdbVote, tmdbId, callback);
            },
            function() { fetchKpFromApi(kpId, tmdbVote, tmdbId, callback); },
            false,
            { timeout: 1000, dataType: 'text' }
        );
    }

    function fetchKpFromApi(kpId, tmdbVote, tmdbId, callback) {
        var network = new Lampa.Reguest();
        network.silent(
            'https://kinopoiskapiunofficial.tech/api/v2.2/films/' + kpId,
            function(data) {
                var kp = (data && data.ratingKinopoisk) || 0;
                setKpRatingCache(tmdbId, kp, tmdbVote);
                callback(kp > 0 ? kp : null, kp > 0);
            },
            function() {
                setKpRatingCache(tmdbId, 0, tmdbVote);
                callback(null, false);
            },
            false,
            { timeout: 3000, headers: { 'X-API-KEY': API_KEY_KP } }
        );
    }

    function fetchKpRating(data, callback) {
        var tmdbId = data.id;
        var tmdbVote = data.vote_average || 0;
        var cached = getKpRatingCache(tmdbId);
        if (cached) {
            callback(cached.kp > 0 ? cached.kp : null, cached.kp > 0);
            return;
        }
        var searchCached = getKpSearchCacheItem(tmdbId);
        if (searchCached) {
            fetchKpRatingById(searchCached.kp_id, tmdbVote, tmdbId, callback);
            return;
        }
        var year = parseInt((data.release_date || data.first_air_date || '').slice(0, 4)) || null;
        var title = data.title || data.name;
        function processError() {
            setKpRatingCache(tmdbId, 0, tmdbVote);
            callback(null, false);
        }
        function searchByTitle() {
            var query = (title || '').toLowerCase().replace(/[^\wа-яё\s]/gi, ' ').replace(/\s+/g, ' ').trim();
            var network = new Lampa.Reguest();
            network.silent(
                'https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=' + encodeURIComponent(query),
                function(json) {
                    if (!json.films || !json.films.length) { processError(); return; }
                    var films = json.films;
                    var best = null;
                    if (year) {
                        for (var fi = 0; fi < films.length; fi++) {
                            if (parseInt((films[fi].year || '').slice(0, 4)) === year) { best = films[fi]; break; }
                        }
                        if (!best) {
                            for (var fi = 0; fi < films.length; fi++) {
                                var y = parseInt((films[fi].year || '').slice(0, 4));
                                if (y && y > year - 3 && y < year + 3) { best = films[fi]; break; }
                            }
                        }
                    }
                    best = best || films[0];
                    if (best) {
                        setKpSearchCacheItem(tmdbId, best.filmId);
                        fetchKpRatingById(best.filmId, tmdbVote, tmdbId, callback);
                    } else {
                        processError();
                    }
                },
                processError,
                false,
                { timeout: 5000, headers: { 'X-API-KEY': API_KEY_KP } }
            );
        }
        if (data.imdb_id) {
            var network = new Lampa.Reguest();
            network.silent(
                'https://kinopoiskapiunofficial.tech/api/v2.2/films?imdbId=' + encodeURIComponent(data.imdb_id),
                function(resp) {
                    var firstItem = resp && resp.items && resp.items[0];
                    var kpId = (firstItem && (firstItem.kinopoiskId || firstItem.filmId)) || (resp && resp.kinopoiskId) || (resp && resp.filmId);
                    if (kpId) {
                        setKpSearchCacheItem(tmdbId, kpId);
                        fetchKpRatingById(kpId, tmdbVote, tmdbId, callback);
                    } else {
                        searchByTitle();
                    }
                },
                searchByTitle,
                false,
                { timeout: 5000, headers: { 'X-API-KEY': API_KEY_KP } }
            );
        } else {
            searchByTitle();
        }
    }

    function fetchTmdbInfo(data, callback) {
        var isTV = !!(data.original_name || data.first_air_date);
        var key = (isTV ? 'tv_' : 'mv_') + data.id;
        if (tmdbCache[key] !== undefined) { callback(tmdbCache[key], isTV); return; }
        var type = isTV ? 'tv' : 'movie';
        var network = new Lampa.Reguest();
        network.silent(
            Lampa.TMDB.api(type + '/' + data.id + '?api_key=' + Lampa.TMDB.key()),
            function(resp) {
                if (resp && resp.id) {
                    setTmdbCache(key, resp);
                    callback(resp, isTV);
                } else {
                    setTmdbCache(key, null);
                    callback(null, isTV);
                }
            },
            function() {
                setTmdbCache(key, null);
                callback(null, isTV);
            },
            false,
            { cache: { life: 30 } }
        );
    }

    function renderRow3(row3Elem, genre, quality, rating, isKp, year) {
        row3Elem.innerHTML = '';
        var parts = [];
        if (genre) parts.push({ text: genre, cls: '' });
        if (quality) parts.push({ text: quality, cls: '' });
        for (var pi = 0; pi < parts.length; pi++) {
            if (pi > 0) row3Elem.appendChild(document.createTextNode(' '));
            var span = document.createElement('span');
            span.textContent = parts[pi].text;
            row3Elem.appendChild(span);
        }
        if (rating) {
            if (row3Elem.childNodes.length) row3Elem.appendChild(document.createTextNode(' '));
            var rateSpan = document.createElement('span');
            rateSpan.className = 'cio-rating';
            rateSpan.textContent = parseFloat(rating).toFixed(1);
            if (isKp) {
                var kpIcon = document.createElement('span');
                kpIcon.className = 'cio-kp-icon';
                rateSpan.appendChild(kpIcon);
            }
            row3Elem.appendChild(rateSpan);
        }
        if (year) {
            if (row3Elem.childNodes.length) row3Elem.appendChild(document.createTextNode(' '));
            var yearSpan = document.createElement('span');
            yearSpan.textContent = year;
            row3Elem.appendChild(yearSpan);
        }
    }

    function buildOverlay(cardElem, data) {
        if (cardElem._cioDone) return;
        cardElem._cioDone = true;

        var view = cardElem.querySelector('.card__view');
        if (!view) return;

        cardElem.classList.add('cio-card');

        var box = document.createElement('div');
        box.className = 'cio-box';

        var row1 = document.createElement('div');
        row1.className = 'cio-row cio-status';
        row1.style.display = 'none';

        var row2 = document.createElement('div');
        row2.className = 'cio-row cio-title';
        row2.textContent = data.title || data.name || '';

        var row3 = document.createElement('div');
        row3.className = 'cio-row cio-meta';

        box.appendChild(row1);
        box.appendChild(row2);
        box.appendChild(row3);
        view.appendChild(box);

        var year = ((data.release_date || data.first_air_date || '') + '').slice(0, 4);
        if (year === '0000') year = '';

        var genreText = getGenreText(data);
        var tmdbVote = parseFloat(data.vote_average || 0);
        var fallbackRating = tmdbVote > 0 ? tmdbVote : null;

        renderRow3(row3, genreText, data.quality || data.release_quality || null, fallbackRating, false, year);

        fetchTmdbInfo(data, function(tmdbData, isTV) {
            if (tmdbData) {
                var statusInfo = isTV ? getTVStatusInfo(tmdbData) : getMovieStatusInfo(tmdbData);
                if (statusInfo && statusInfo.text) {
                    var iconSpan = document.createElement('span');
                    iconSpan.className = 'cio-status-icon';
                    iconSpan.style.color = statusInfo.color;
                    iconSpan.textContent = statusInfo.icon;
                    var textSpan = document.createElement('span');
                    textSpan.className = 'cio-status-text';
                    textSpan.textContent = statusInfo.text;
                    row1.appendChild(iconSpan);
                    row1.appendChild(textSpan);
                    row1.style.display = '';
                }
                var refinedGenre = getGenreText(tmdbData);
                if (refinedGenre) genreText = refinedGenre;
            }

            fetchQuality(data, function(quality) {
                fetchKpRating(data, function(kpRating, isKp) {
                    var ratingVal = (kpRating && kpRating > 0) ? kpRating : fallbackRating;
                    renderRow3(row3, genreText, quality, ratingVal, isKp && !!(kpRating && kpRating > 0), year);
                });
            });
        });
    }

    function processCard(cardElem) {
        if (cardElem._cioAttached) return;
        cardElem._cioAttached = true;
        if (intersectionObserver) {
            intersectionObserver.observe(cardElem);
        } else {
            var cardData = cardElem.card_data;
            if (cardData) buildOverlay(cardElem, cardData);
        }
    }

    function addStyles() {
        document.head.insertAdjacentHTML('beforeend', '<style>' +
            '.cio-card .card__title,.cio-card .card__age,.cio-card .card__vote,.cio-card .card__quality,.cio-card .card__type{display:none!important}' +
            '.cio-box{position:absolute;left:0;right:0;bottom:0;top:0;padding:0.5em 0.6em 0.5em;background:-webkit-gradient(linear,left top,left bottom,from(rgba(0,0,0,0)),color-stop(45%,rgba(0,0,0,0.82)),to(rgba(0,0,0,0.9)));background:-webkit-linear-gradient(top,rgba(0,0,0,0) 0%,rgba(0,0,0,0.82) 45%,rgba(0,0,0,0.9) 100%);background:-moz-linear-gradient(top,rgba(0,0,0,0) 0%,rgba(0,0,0,0.82) 45%,rgba(0,0,0,0.9) 100%);background:-o-linear-gradient(top,rgba(0,0,0,0) 0%,rgba(0,0,0,0.82) 45%,rgba(0,0,0,0.9) 100%);background:linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,0.82) 45%,rgba(0,0,0,0.9) 100%);-webkit-border-radius:1em;-moz-border-radius:1em;border-radius:1em;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-orient:vertical;-webkit-flex-direction:column;-moz-box-orient:vertical;-ms-flex-direction:column;flex-direction:column;-webkit-box-pack:end;-webkit-justify-content:flex-end;-moz-box-pack:end;-ms-flex-pack:end;justify-content:flex-end;pointer-events:none;z-index:2;overflow:hidden}' +
            '.cio-row{color:#fff;overflow:hidden}' +
            '.cio-status{font-size:0.68em;font-weight:700;margin-bottom:0.25em;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;white-space:nowrap;line-height:1.2}' +
            '.cio-status-icon{margin-right:0.3em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}' +
            '.cio-status-text{overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;white-space:nowrap}' +
            '.cio-title{font-size:0.9em;font-weight:700;margin-bottom:0.2em;line-height:1.2;display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical;max-height:2.4em;overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis}' +
            '.cio-meta{font-size:0.68em;opacity:0.9;white-space:nowrap;overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;line-height:1.3;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}' +
            '.cio-rating{display:-webkit-inline-box;display:-webkit-inline-flex;display:-moz-inline-box;display:-ms-inline-flexbox;display:inline-flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}' +
            '.cio-kp-icon{display:inline-block;width:9px;height:9px;margin-left:2px;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0;background-repeat:no-repeat;background-position:center;-webkit-background-size:contain;-moz-background-size:contain;background-size:contain;background-image:url("data:image/svg+xml,%3Csvg width=\'300\' height=\'300\' viewBox=\'0 0 300 300\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cmask id=\'m\' style=\'mask-type:alpha\' maskUnits=\'userSpaceOnUse\' x=\'0\' y=\'0\' width=\'300\' height=\'300\'%3E%3Ccircle cx=\'150\' cy=\'150\' r=\'150\' fill=\'white\'/%3E%3C/mask%3E%3Cg mask=\'url(%23m)\'%3E%3Ccircle cx=\'150\' cy=\'150\' r=\'150\' fill=\'black\'/%3E%3Cpath d=\'M300 45L145.26 127.827L225.9 45H181.2L126.3 121.203V45H89.9999V255H126.3V178.92L181.2 255H225.9L147.354 174.777L300 255V216L160.776 160.146L300 169.5V130.5L161.658 139.494L300 84V45Z\' fill=\'url(%23g)\'/%3E%3C/g%3E%3Cdefs%3E%3CradialGradient id=\'g\' cx=\'0\' cy=\'0\' r=\'1\' gradientUnits=\'userSpaceOnUse\' gradientTransform=\'translate(89.9999 45) rotate(45) scale(296.985)\'%3E%3Cstop offset=\'0.5\' stop-color=\'%23FF5500\'/%3E%3Cstop offset=\'1\' stop-color=\'%23BBFF00\'/%3E%3C/radialGradient%3E%3C/defs%3E%3C/svg%3E")}' +
        '</style>');
    }

    function init() {
        addStyles();

        if (typeof IntersectionObserver !== 'undefined') {
            intersectionObserver = new IntersectionObserver(function(entries) {
                for (var i = 0; i < entries.length; i++) {
                    var entry = entries[i];
                    if (!entry.isIntersecting) continue;
                    intersectionObserver.unobserve(entry.target);
                    var cardData = entry.target.card_data;
                    if (cardData) buildOverlay(entry.target, cardData);
                }
            }, { threshold: 0.1 });
        }

        mutationObserver = new MutationObserver(function(mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var nodes = mutations[i].addedNodes;
                for (var j = 0; j < nodes.length; j++) {
                    var node = nodes[j];
                    if (node.nodeType !== 1) continue;
                    if (node.classList && node.classList.contains('card')) processCard(node);
                    if (node.querySelectorAll) {
                        var cards = node.querySelectorAll('.card');
                        for (var k = 0; k < cards.length; k++) processCard(cards[k]);
                    }
                }
            }
        });
        mutationObserver.observe(document.body, { childList: true, subtree: true });

        [].forEach.call(document.querySelectorAll('.card'), processCard);
    }

    function destroy() {
        if (mutationObserver) { mutationObserver.disconnect(); mutationObserver = null; }
        if (intersectionObserver) { intersectionObserver.disconnect(); intersectionObserver = null; }
    }

    Lampa.Listener.follow('app', function(e) {
        if (e.type === 'ready') init();
        if (e.type === 'destroy') destroy();
    });

    if (window.appready) init();
})();
