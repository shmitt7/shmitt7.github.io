(function () {
    'use strict';

    if (window.shmitt7) return;
    var S = window.shmitt7 = { version: '2.0.0' };

    // ============================================================
    //  CONFIG
    // ============================================================
    var PREFIX = 'shmitt7_';
    var KEYS = {
        buttons:      'mod_buttons',
        cardMobile:   'mod_cardMobile',
        cardTV:       'mod_cardTV',
        cards:        'mod_cards',
        dmca:         'mod_dmca',
        labels:       'mod_labels',
        lines:        'mod_lines',
        menu:         'mod_menu',
        parser:       'mod_parser',
        quality:      'mod_quality',
        rating:       'mod_rating',
        russian:      'mod_russian',
        status:       'mod_status',
        torrserver:   'mod_torrserver',
        tweaks:       'mod_tweaks',
        kpApiKey:     'kp_api_key',
        logoCacheMax: 'logo_cache_max'
    };
    var DEFAULT_KP_KEY = '14342b35-714b-449d-bf10-30d0d9ac22e6';
    var COMPONENT_NAME = 'shmitt7_settings';

    function isOn(name) {
        var v = Lampa.Storage.get(PREFIX + KEYS[name], 'true');
        return v === true || v === 'true';
    }
    S.isOn = isOn;

    function getKpKey() {
        return Lampa.Storage.get(PREFIX + KEYS.kpApiKey, DEFAULT_KP_KEY) || DEFAULT_KP_KEY;
    }
    S.getKpKey = getKpKey;

    function getLogoCacheMax() {
        return parseInt(Lampa.Storage.get(PREFIX + KEYS.logoCacheMax, '500')) || 500;
    }

    // ============================================================
    //  SHARED NETWORK
    // ============================================================
    S.re = new Lampa.Reguest();

    // ============================================================
    //  SHARED CACHES
    // ============================================================
    S.cache = {
        kp:      Lampa.Storage.cache('shmitt7_kp_rating', 1000, {}),
        quality: Lampa.Storage.cache('shmitt7_quality', 1000, {}),
        logo:    {},
        logoSize: 0,
        dmca:    {},
        dmcaSize: 0
    };

    // ============================================================
    //  SHARED UTILS
    // ============================================================
    var FORMAT_PATTERNS = [
        { sep: ': ',   keep: 1 },
        { sep: ' - ',  keep: 2 },
        { sep: ' \u2013', keep: 2 },
        { sep: ' \u2014', keep: 2 }
    ];

    S.util = {
        escapeHtml: function (s) {
            return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        },
        hashCode: function (str) {
            var h = 0;
            for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
            return (h >>> 0).toString(36);
        },
        protocol: function (url) {
            return /^https?:\/\//i.test(url) ? url : 'https://' + url;
        },
        formatTitle: function (text) {
            if (!text || text.length <= 30) return null;
            for (var pi = 0; pi < FORMAT_PATTERNS.length; pi++) {
                var sep = FORMAT_PATTERNS[pi].sep;
                var keep = FORMAT_PATTERNS[pi].keep;
                var idx = text.indexOf(sep);
                if (idx > 2 && idx + sep.length < text.length - 2) {
                    var p1 = text.slice(0, idx + keep);
                    var p2 = text.slice(idx + keep).replace(/^\s+/, '');
                    if (p2.length >= 3) return S.util.escapeHtml(p1) + '<br>' + S.util.escapeHtml(p2);
                }
            }
            return null;
        },
        formatRuntime: function (minutes) {
            if (!minutes || minutes <= 0) return '';
            var h = Math.floor(minutes / 60);
            var m = minutes % 60;
            return (h > 0 ? h + '\u0447 ' : '') + m + '\u043C';
        },
        formatBudget: function (b) {
            if (!b || b <= 0) return '';
            if (b >= 1000000) return Math.round(b / 1000000) + 'm $';
            return Math.round(b / 1000) + '\u043A $';
        },
        tvStatusLabel: function (s) {
            return Lampa.Lang.translate('tv_status_' + s.toLowerCase().replace(/ /g, '_'));
        },
        getGenreLabels: function (movie, max) {
            var isTv = !!movie.name;
            var genres = movie.genres || [];
            var ids = genres.map(function (g) { return typeof g === 'object' ? g.id : g; });
            var priority = null;
            if (ids.indexOf(16) !== -1 && movie.original_language === 'ja') priority = 'Аниме';
            else if (ids.indexOf(10763) !== -1) priority = 'Новости';
            else if (ids.indexOf(10767) !== -1) priority = 'Ток-шоу';
            else if (ids.indexOf(10764) !== -1) priority = 'Реалити-шоу';
            else if (ids.indexOf(99) !== -1) priority = 'Документальный';
            else if (ids.indexOf(10766) !== -1) priority = 'Мыльная опера';
            else if (ids.indexOf(16) !== -1) priority = isTv ? 'Мультсериал' : 'Мультфильм';

            var result = [];
            if (priority) result.push(priority);
            for (var i = 0; i < genres.length && result.length < (max || 2); i++) {
                var g = genres[i];
                if (!g) continue;
                var gId = typeof g === 'object' ? g.id : g;
                if ((priority === 'Аниме' || priority === 'Мультсериал' || priority === 'Мультфильм') && gId === 16) continue;
                var name = Lampa.Utils.capitalizeFirstLetter(g.name);
                if (name && result.indexOf(name) === -1) result.push(name);
            }
            return result;
        },
        buildReactions: function (data, cls) {
            if (!Lampa.Storage.field('card_interfice_reactions') ||
                (window.lampa_settings && window.lampa_settings.disable_features && window.lampa_settings.disable_features.reactions))
                return null;
            if (!data || !data.result || !data.result.length) return null;
            var map = {};
            data.result.forEach(function (r) { map[r.type] = r.counter || 0; });
            var think = map.think || 0;
            var thinkPos = Math.floor(think / 2);
            var pos = (map.fire || 0) + (map.nice || 0) + thinkPos;
            var neg = (map.bore || 0) + (map.shit || 0) + (think - thinkPos);
            if (!pos && !neg) return null;
            var posStyle = pos > neg ? 'color:#6fcf6f' : 'color:#fff';
            var negStyle = neg > pos ? 'color:#e05555' : 'color:#fff';
            var base = Lampa.Utils.protocol() + Lampa.Manifest.cub_domain + '/img/reactions/';
            var el = $('<span class="' + (cls || 'shm7-badge') + ' shm7-reactions-badge"></span>');
            el.html(
                '<span style="display:inline-flex;align-items:center;' + posStyle + '"><img class="shm7-react-icon" src="' + base + 'fire.svg" style="margin-right:0.2em">' + Lampa.Utils.bigNumberToShort(pos) + '</span>' +
                '<span style="color:#fff;margin:0 0.3em">\u2022</span>' +
                '<span style="display:inline-flex;align-items:center;' + negStyle + '"><img class="shm7-react-icon" src="' + base + 'shit.svg" style="margin-right:0.2em">' + Lampa.Utils.bigNumberToShort(neg) + '</span>'
            );
            return el;
        },
        pollEl: function (render, selector, extract, onFound, attempt, token, currentToken) {
            if (token && token !== currentToken()) return;
            if (attempt > 30) return;
            var el = render.find(selector);
            if (el.length) {
                var val = extract(el);
                if (val !== null && val !== undefined) return onFound(val);
            }
            setTimeout(function () {
                S.util.pollEl(render, selector, extract, onFound, attempt + 1, token, currentToken);
            }, 500);
        }
    };

    // ============================================================
    //  CARD BUS (shared MO + IO)
    // ============================================================
    S.cardBus = (function () {
        var handlers = [];
        var io = null;
        var mo = null;

        function dispatch(card) {
            if (!card || card.nodeType !== 1) return;
            for (var i = 0; i < handlers.length; i++) {
                try { handlers[i](card); } catch (err) { if (window.console) console.warn('[shmitt7 cardBus]', err); }
            }
        }

        function observe(card) {
            if (!card || card._shm7Obs) return;
            card._shm7Obs = true;
            if (io) io.observe(card);
            else dispatch(card);
        }

        function observeAll() {
            var nodes = document.querySelectorAll('.card');
            for (var i = 0; i < nodes.length; i++) observe(nodes[i]);
        }

        function init() {
            if (typeof IntersectionObserver !== 'undefined') {
                io = new IntersectionObserver(function (entries) {
                    for (var i = 0; i < entries.length; i++) {
                        var e = entries[i];
                        if (!e.isIntersecting) continue;
                        io.unobserve(e.target);
                        dispatch(e.target);
                    }
                }, { rootMargin: '150px' });
            }
            mo = new MutationObserver(function (mutations) {
                for (var i = 0; i < mutations.length; i++) {
                    var added = mutations[i].addedNodes;
                    for (var j = 0; j < added.length; j++) {
                        var node = added[j];
                        if (node.nodeType !== 1) continue;
                        if (node.classList && node.classList.contains('card')) observe(node);
                        if (node.querySelectorAll) {
                            var cards = node.querySelectorAll('.card');
                            for (var k = 0; k < cards.length; k++) observe(cards[k]);
                        }
                    }
                }
            });
            mo.observe(document.body, { childList: true, subtree: true });
            observeAll();

            Lampa.Listener.follow('app', function (e) {
                if (e.type === 'ready') observeAll();
                if (e.type === 'destroy') S.cardBus.destroy();
            });
        }

        return {
            init: init,
            onCard: function (fn) { handlers.push(fn); },
            observe: observe,
            destroy: function () {
                if (io) { io.disconnect(); io = null; }
                if (mo) { mo.disconnect(); mo = null; }
                handlers = [];
            }
        };
    })();

    // ============================================================
    //  MODULE: buttons.js  (цветные кнопки в full-карточке)
    // ============================================================
    function mod_buttons() {
        if (!isOn('buttons') || window.shm7Buttons) return;
        window.shm7Buttons = true;
        var BUTTONS = [
            {
                selector: '.view--torrent',
                svg: '<svg width="24" height="24" viewBox="0 0 48 48"><path fill="#4caf50" d="M23.501,44.125c11.016,0,20-8.984,20-20c0-11.015-8.984-20-20-20c-11.016,0-20,8.985-20,20C3.501,35.141,12.485,44.125,23.501,44.125z"/><path fill="#fff" d="M43.252,27.114C39.718,25.992,38.055,19.625,34,11l-7,1.077c1.615,4.905,8.781,16.872,0.728,18.853C20.825,32.722,17.573,20.519,15,14l-8,2l10.178,27.081c1.991,0.67,4.112,1.044,6.323,1.044c0.982,0,1.941-0.094,2.885-0.232l-4.443-8.376c6.868,1.552,12.308-0.869,12.962-6.203c1.727,2.29,4.089,3.183,6.734,3.172C42.419,30.807,42.965,29.006,43.252,27.114z"/></svg><span>Торренты</span>'
            },
            {
                selector: '.view--trailer',
                svg: '<svg width="24" height="24" viewBox="0 0 48 48"><path d="M47.044 12.3709C46.7726 11.3497 46.2378 10.4178 45.493 9.66822C44.7483 8.91869 43.8197 8.37791 42.8003 8.1C39.0476 7.09091 24.0476 7.09091 24.0476 7.09091C24.0476 7.09091 9.04761 7.09091 5.29488 8.1C4.27547 8.37791 3.34693 8.91869 2.60218 9.66822C1.85744 10.4178 1.32262 11.3497 1.05124 12.3709C0.0476075 16.14 0.0476074 24 0.0476074 24C0.0476074 24 0.0476075 31.86 1.05124 35.6291C1.32262 36.6503 1.85744 37.5822 2.60218 38.3318C3.34693 39.0813 4.27547 39.6221 5.29488 39.9C9.04761 40.9091 24.0476 40.9091 24.0476 40.9091C24.0476 40.9091 39.0476 40.9091 42.8003 39.9C43.8197 39.6221 44.7483 39.0813 45.493 38.3318C46.2378 37.5822 46.7726 36.6503 47.044 35.6291C48.0476 31.86 48.0476 24 48.0476 24C48.0476 24 48.0476 16.14 47.044 12.3709Z" fill="#FF0302"/><path d="M19.1385 31.1373V16.8628L31.684 24.0001L19.1385 31.1373Z" fill="#FEFEFE"/></svg><span>Трейлеры</span>'
            }
        ];
        Lampa.Listener.follow('full', function (e) {
            if (e.type !== 'complite') return;
            var $container = e.body.find('.buttons--container');
            var $target = e.body.find('.full-start-new__buttons');
            if (!$container.length || !$target.length) return;
            BUTTONS.forEach(function (btn) { $container.find(btn.selector).html(btn.svg); });
            var $moved = $container.children();
            $moved.prependTo($target);
            var start = e.link && e.link.items && e.link.items[0];
            if (start) {
                $moved.on('hover:focus hover:enter hover:hover hover:touch', function (ev) { start.last = ev.target; });
            }
        });
    }

    // ============================================================
    //  MODULE: cardMobile  (полная карточка на телефоне)
    // ============================================================
    function mod_cardMobile() {
        if (!isOn('cardMobile') || Lampa.Platform.screen('tv') || window.shm7CardMobile) return;
        window.shm7CardMobile = true;

        window.lampa_settings = window.lampa_settings || {};
        window.lampa_settings.blur_poster = false;

        var currentToken = null;
        var currentFullComp = null;
        var fullTimer;

        function getInterfaceRgb() {
            var computed = getComputedStyle(document.body).backgroundColor;
            var match = computed && computed.match(/(\d+),\s*(\d+),\s*(\d+)/);
            if (match) return match[1] + ',' + match[2] + ',' + match[3];
            return Lampa.Storage.field('black_style') ? '0,0,0' : '29,31,32';
        }
        function applyGradient(gp) {
            var baseRgb = getInterfaceRgb();
            var st = document.getElementById('shm7-cm-gradient');
            if (!st) { st = document.createElement('style'); st.id = 'shm7-cm-gradient'; document.head.appendChild(st); }
            st.textContent = 'body.shm7-cm .full-start-new__poster::after{height:' + (gp || 32) + '%!important;background:linear-gradient(to bottom,rgba(' + baseRgb + ',0) 0%,rgba(' + baseRgb + ',1) 100%)!important}';
        }

        Lampa.Storage.listener.follow('change', function (ev) {
            if (ev.name === 'black_style' || ev.name === 'cub_theme') applyGradient(32);
        });

        Lampa.Listener.follow('full', function (e) {
            if (e.type !== 'complite') return;
            var fullComp = e.link;
            var token = {};
            currentToken = token;
            currentFullComp = fullComp;
            $('body').addClass('shm7-cm');
            clearTimeout(fullTimer);
            fullTimer = setTimeout(function () {
                if (currentToken !== token) return;
                var render = fullComp.render ? fullComp.render() : fullComp.activity.render();
                var right = render.find('.full-start-new__right');
                if (!right.length) return;
                var buttons = render.find('.full-start-new__buttons');
                var movie = (e.data && e.data.movie) || {};
                var isTv = !!movie.name;
                var mediaType = isTv ? 'tv' : 'movie';

                var titleEl = render.find('.full-start-new__title');
                var rowTitle = $('<div class="shm7-row shm7-row--title"></div>');
                var titleSpan = $('<span class="shm7-title-text"></span>');
                rowTitle.append(titleSpan);

                var tagline = movie.tagline || '';
                var rowTagline = $('<div class="shm7-row shm7-row--tagline"></div>');
                if (tagline) rowTagline.append($('<span class="shm7-tagline"></span>').text(tagline));
                else rowTagline.hide();

                var rowStatus = $('<div class="shm7-row shm7-row--status"></div>');
                var rowNext = $('<div class="shm7-row shm7-row--next"></div>');

                if (isTv) {
                    var last = movie.last_episode_to_air;
                    var curS = last ? last.season_number : 0;
                    var totS = movie.number_of_seasons || 0;
                    var totE = movie.number_of_episodes || 0;
                    var curE = last ? last.episode_number : 0;
                    var aired = 0;
                    if (movie.seasons && last) {
                        for (var si = 0; si < movie.seasons.length; si++) {
                            var s = movie.seasons[si];
                            if (s.season_number > 0 && s.season_number < curS) aired += s.episode_count || 0;
                        }
                        aired += curE;
                    }
                    var next = movie.next_episode_to_air;
                    var hasNext = false, nextTxt = '';
                    if (next && next.air_date) {
                        var days = Math.ceil((Lampa.Utils.parseToDate(next.air_date).getTime() - Date.now()) / 86400000);
                        if (days > 0) {
                            hasNext = true;
                            nextTxt = Lampa.Lang.translate('full_next_episode') + ': ' + Lampa.Utils.parseTime(next.air_date).short
                                + ' / ' + Lampa.Lang.translate('full_episode_days_left') + ': ' + days;
                        }
                    }
                    var parts = [];
                    if (movie.status && !(movie.status === 'Returning Series' && hasNext))
                        parts.push(S.util.tvStatusLabel(movie.status));
                    if (totS > 0) parts.push(Lampa.Lang.translate('title_seasons') + ': ' + ((curS > 0 && curS < totS) ? curS + '/' + totS : totS));
                    if (totE > 0) parts.push(Lampa.Lang.translate('title_episodes') + ': ' + ((aired > 0 && aired < totE) ? aired + '/' + totE : totE));
                    if (parts.length) rowStatus.append($('<span class="shm7-badge"></span>').text(parts.join(' \u2022 ')));
                    else rowStatus.hide();
                    if (hasNext) rowNext.append($('<span class="shm7-badge"></span>').text(nextTxt));
                    else rowNext.hide();
                } else {
                    rowNext.hide();
                    if (movie.status && movie.status.toLowerCase() !== 'released') {
                        var mparts = [S.util.tvStatusLabel(movie.status)];
                        if (movie.release_date) mparts.push(Lampa.Utils.parseTime(movie.release_date).short);
                        rowStatus.append($('<span class="shm7-badge"></span>').text(mparts.join(' \u2022 ')));
                    } else rowStatus.hide();
                }

                var relDate = (movie.release_date || movie.first_air_date || '').slice(0, 4);
                var year = relDate || '';
                var runtime = movie.runtime > 0 ? S.util.formatRuntime(movie.runtime) : '';
                var countries = (movie.production_countries || []).slice(0, 2).map(function (c) {
                    return Lampa.Lang.translate('country_' + (c.iso_3166_1 || '').toLowerCase()) || c.name;
                }).filter(Boolean);
                var infoParts = [];
                if (year) infoParts.push(year);
                if (runtime) infoParts.push(runtime);
                if (countries.length) infoParts.push(countries.join(', '));
                if (!isTv && movie.status && movie.status.toLowerCase() === 'released')
                    infoParts.push(S.util.tvStatusLabel(movie.status));

                var rowInfo = $('<div class="shm7-row shm7-row--info"></div>');
                var badgeInfo = $('<span class="shm7-badge"></span>');
                rowInfo.append(badgeInfo);
                var currentQuality = null;
                function rebuildInfo() {
                    var p = infoParts.slice();
                    if (currentQuality) p.push(currentQuality);
                    if (p.length) { badgeInfo.text(p.join(' \u2022 ')); rowInfo.show(); }
                    else rowInfo.hide();
                }
                rebuildInfo();

                var tmdb = parseFloat(movie.vote_average || 0);
                var genres = S.util.getGenreLabels(movie, 2);
                var curKP = null, curIMDB = null, curPG = null;
                var rowRate = $('<div class="shm7-row shm7-row--rate"></div>');
                var badgeRate = $('<span class="shm7-badge"></span>');
                rowRate.append(badgeRate);
                function rebuildRate() {
                    var p = [];
                    if (tmdb >= 1) p.push(tmdb.toFixed(1) + ' TMDB');
                    if (curKP !== null && curKP >= 1) p.push(curKP.toFixed(1) + ' KP');
                    if (curIMDB !== null && curIMDB >= 1) p.push(curIMDB.toFixed(1) + ' IMDB');
                    if (genres.length) p.push(genres.join(', '));
                    if (curPG) p.push(curPG);
                    if (p.length) { badgeRate.text(p.join(' \u2022 ')); rowRate.show(); }
                    else rowRate.hide();
                }
                rebuildRate();

                var companies = (movie.production_companies || []).slice(0, 2).map(function (c) { return c.name; }).filter(Boolean);
                var budget = S.util.formatBudget(movie.budget);
                var rowProd = $('<div class="shm7-row shm7-row--prod"></div>');
                var prodParts = [];
                if (companies.length) prodParts.push(companies.join(', '));
                if (budget) prodParts.push('\u0411\u044E\u0434\u0436\u0435\u0442 ' + budget);
                if (prodParts.length) rowProd.append($('<span class="shm7-badge"></span>').text(prodParts.join(' \u2022 ')));
                var react = S.util.buildReactions(e.data && e.data.reactions, 'shm7-badge');
                if (react) rowProd.append(react);

                right.find('.shm7-row').remove();
                right.append(rowTitle).append(rowTagline).append(rowStatus).append(rowNext)
                     .append(rowInfo).append(rowRate).append(rowProd).append(buttons);

                requestAnimationFrame(function () {
                    if (currentToken !== token) return;
                    var poster = render.find('.full-start-new__poster');
                    var ph = poster.outerHeight() || 0;
                    var ch = right.outerHeight() || 0;
                    var lift = Math.min(ch + 12, Math.max(ph * 0.6, 0));
                    right.css('margin-top', -lift + 'px');
                    applyGradient(ph > 0 ? Math.min(78, Math.ceil((lift / ph) * 100) + 12) : 32);
                });

                // Kинопоиск / IMDB / PG / качество
                S.util.pollEl(render, '.rate--kp:not(.hide)', function (el) {
                    var v = parseFloat(el.find('> div').eq(0).text().replace(',', '.'));
                    return (!isNaN(v) && v > 0) ? v : null;
                }, function (v) { curKP = v; rebuildRate(); }, 0);
                S.util.pollEl(render, '.rate--imdb:not(.hide)', function (el) {
                    var v = parseFloat(el.find('> div').eq(0).text().replace(',', '.'));
                    return (!isNaN(v) && v > 0) ? v : null;
                }, function (v) { curIMDB = v; rebuildRate(); }, 0);
                S.util.pollEl(render, '.full-start__pg:not(.hide)', function (el) {
                    return el.first().text().trim() || null;
                }, function (v) { curPG = v; rebuildRate(); }, 0);
                setTimeout(function () {
                    S.util.pollEl(render, '.tag--quality', function (el) {
                        return el.first().text().trim() || null;
                    }, function (v) { currentQuality = v; rebuildInfo(); }, 0);
                }, 300);

                // Логотип
                if (movie.id) {
                    var rawText = titleEl.text().trim();
                    var formatted = S.util.formatTitle(rawText);
                    if (formatted !== null) { titleSpan.html(formatted); titleSpan.addClass('shm7-title-split'); }
                    else titleSpan.text(rawText);

                    var cacheKey = mediaType + '_' + movie.id;
                    function applyLogo(url) {
                        titleSpan.html('<img class="shm7-logo" src="' + url + '" alt="">');
                        titleSpan.removeClass('shm7-title-split');
                    }
                    if (S.cache.logo[cacheKey] !== undefined) {
                        if (S.cache.logo[cacheKey]) applyLogo(S.cache.logo[cacheKey]);
                    } else {
                        var url = Lampa.TMDB.api(mediaType + '/' + movie.id + '/images?api_key=' + Lampa.TMDB.key() + '&language=ru&include_image_language=ru');
                        S.re.silent(url, function (data) {
                            if (currentToken !== token) return;
                            var logos = (data.logos || []).filter(function (l) {
                                return l.file_path && l.file_path.slice(-4) !== '.svg' && l.iso_639_1 === 'ru';
                            });
                            logos.sort(function (a, b) { return b.vote_average - a.vote_average; });
                            if (S.cache.logoSize > getLogoCacheMax()) { S.cache.logo = {}; S.cache.logoSize = 0; }
                            S.cache.logo[cacheKey] = logos.length ? Lampa.TMDB.image('t/p/original' + logos[0].file_path) : null;
                            S.cache.logoSize++;
                            if (S.cache.logo[cacheKey]) applyLogo(S.cache.logo[cacheKey]);
                        }, function () {}, false, { cache: { life: 1440 } });
                    }
                }
            }, 0);
        });

        Lampa.Listener.follow('activity', function (e) {
            if (e.type === 'archive' && e.component === 'full') {
                $('body').addClass('shm7-cm');
                currentFullComp = e.object && e.object.activity && e.object.activity.component;
            }
            if (e.type === 'destroy' && e.component === 'full') {
                clearTimeout(fullTimer);
                var dc = e.object && e.object.activity && e.object.activity.component;
                if (dc === currentFullComp) {
                    currentToken = null; currentFullComp = null;
                    $('body').removeClass('shm7-cm');
                }
            }
        });
    }

    // ============================================================
    //  MODULE: cardTV  (полная карточка на TV)
    // ============================================================
    function mod_cardTV() {
        if (!isOn('cardTV') || !Lampa.Platform.screen('tv') || window.shm7CardTV) return;
        window.shm7CardTV = true;

        var currentToken = null;
        var currentFullComp = null;
        var fullTimer;

        function wrap(fullComp) {
            if (!fullComp.scroll || fullComp.scroll._shm7Wrapped) return;
            fullComp.scroll._shm7Wrapped = true;
            var orig = fullComp.scroll.onScroll;
            fullComp.scroll.onScroll = function (pos) {
                if (orig) orig(pos);
                $('body').toggleClass('shm7-tv-scrolled', pos > 30);
            };
        }

        Lampa.Listener.follow('full', function (e) {
            if (e.type !== 'complite') return;
            var fullComp = e.link;
            var token = {};
            currentToken = token;
            currentFullComp = fullComp;
            $('body').addClass('shm7-tv').removeClass('shm7-tv-scrolled');
            $('body').toggleClass('card--no-cover', !Lampa.Storage.field('card_interfice_cover'));

            clearTimeout(fullTimer);
            fullTimer = setTimeout(function () {
                if (currentToken !== token) return;
                var render = fullComp.render();
                var right = render.find('.full-start-new__right');
                var title = render.find('.full-start-new__title');
                var buttons = render.find('.full-start-new__buttons');
                if (!right.length || !title.length || !buttons.length) return;

                var movie = e.data.movie || {};
                var isTv = !!movie.first_air_date;
                var mediaType = isTv ? 'tv' : 'movie';
                var year = (movie.release_date || movie.first_air_date || '').slice(0, 4);
                var runRaw = (movie.episode_run_time || [])[0] || movie.runtime || 0;
                var runtime = S.util.formatRuntime(runRaw);
                var pg = render.find('.full-start__pg').not('.hide').text().trim();
                var countries = (movie.production_countries || []).slice(0, 2).map(function (c) {
                    var k = 'country_' + (c.iso_3166_1 || '').toLowerCase();
                    var t = Lampa.Lang.translate(k);
                    return (t && t !== k) ? t : (c.iso_3166_1 || '');
                }).filter(Boolean);
                var genres = S.util.getGenreLabels(movie, 2);
                var tmdb = movie.vote_average ? parseFloat(movie.vote_average) : 0;
                var infoParts = [];
                if (year) infoParts.push(year);
                if (runtime) infoParts.push(runtime);
                if (countries.length) infoParts.push(countries.join(', '));
                if (genres.length) infoParts.push(genres.join(', '));
                if (pg) infoParts.push(pg);

                var curKP = null, curQ = null;
                var infoEl = $('<span class="shm7-badge"></span>');
                function rebuildInfo() {
                    var p = infoParts.slice();
                    if (curKP !== null && curKP >= 1) p.push(curKP.toFixed(1) + ' KP');
                    else if (tmdb >= 1) p.push(tmdb.toFixed(1) + ' TMDB');
                    if (curQ) p.push(curQ);
                    infoEl.text(p.join(' \u2022 '));
                }
                rebuildInfo();

                S.util.pollEl(render, '.rate--kp:not(.hide)', function (el) {
                    var v = parseFloat(el.find('> div').eq(0).text().replace(',', '.'));
                    return (!isNaN(v) && v > 0) ? v : null;
                }, function (v) { curKP = v; rebuildInfo(); }, 0);
                setTimeout(function () {
                    S.util.pollEl(render, '.tag--quality', function (el) { return el.first().text().trim() || null; },
                        function (v) { curQ = v; rebuildInfo(); }, 0);
                }, 300);

                var serialEl = null;
                if (isTv) {
                    var last = movie.last_episode_to_air;
                    var curS = last ? last.season_number : 0;
                    var totS = movie.number_of_seasons || 0;
                    var totE = movie.number_of_episodes || 0;
                    var curE = last ? last.episode_number : 0;
                    var aired = 0;
                    if (movie.seasons && last) {
                        for (var si = 0; si < movie.seasons.length; si++) {
                            var s = movie.seasons[si];
                            if (s.season_number > 0 && s.season_number < curS) aired += s.episode_count || 0;
                        }
                        aired += curE;
                    }
                    var next = movie.next_episode_to_air;
                    var hasNext = false, nextTxt = '';
                    if (next && next.air_date) {
                        var days = Math.ceil((Lampa.Utils.parseToDate(next.air_date).getTime() - Date.now()) / 86400000);
                        if (days > 0) {
                            hasNext = true;
                            nextTxt = Lampa.Lang.translate('full_next_episode') + ': ' + Lampa.Utils.parseTime(next.air_date).short
                                + ' / ' + Lampa.Lang.translate('full_episode_days_left') + ': ' + days;
                        }
                    }
                    var parts = [];
                    if (movie.status && !(movie.status === 'Returning Series' && hasNext))
                        parts.push(S.util.tvStatusLabel(movie.status));
                    if (totS > 0) parts.push(Lampa.Lang.translate('title_seasons') + ': ' + ((curS > 0 && curS < totS) ? curS + '/' + totS : totS));
                    if (totE > 0) parts.push(Lampa.Lang.translate('title_episodes') + ': ' + ((aired > 0 && aired < totE) ? aired + '/' + totE : totE));
                    if (hasNext) parts.push(nextTxt);
                    if (parts.length) serialEl = $('<span class="shm7-badge"></span>').text(parts.join(' \u2022 '));
                }

                var movieStatusEl = null;
                if (!isTv && movie.status && movie.status.toLowerCase() !== 'released') {
                    var mp = [S.util.tvStatusLabel(movie.status)];
                    if (movie.release_date) mp.push(Lampa.Utils.parseTime(movie.release_date).short);
                    movieStatusEl = $('<span class="shm7-badge"></span>').text(mp.join(' \u2022 '));
                }

                var react = S.util.buildReactions(e.data && e.data.reactions, 'shm7-badge');
                var main = $('<div class="shm7-tv-main"></div>');
                main.append(title);
                if (isTv && serialEl) main.append($('<div class="shm7-center-row"></div>').append(serialEl));
                else if (!isTv && movieStatusEl) main.append($('<div class="shm7-center-row"></div>').append(movieStatusEl));
                main.append($('<div class="shm7-center-row"></div>').append(infoEl));
                main.append(buttons);

                right.find('.shm7-tv-main, .shm7-reactions-badge, .shm7-poster-fallback').remove();
                right.append(main);
                if (react) right.append(react);
                if (!movie.backdrop_path && movie.poster_path) {
                    right.prepend($('<img class="shm7-poster-fallback">').attr('src', Lampa.TMDB.image('t/p/original' + movie.poster_path)));
                }

                if (movie.id) {
                    var rawHtml = title.html();
                    var titleText = title.text().trim();
                    var formatted = S.util.formatTitle(titleText);
                    var origHtml = formatted !== null ? formatted : rawHtml;
                    if (formatted !== null) { title.html(origHtml); title.addClass('shm7-title-split'); }

                    var cacheKey = mediaType + '_' + movie.id;
                    function applyLogo(url) {
                        title.html('<img class="shm7-logo" src="' + url + '" alt="">');
                        title.removeClass('shm7-title-split');
                    }
                    if (S.cache.logo[cacheKey] !== undefined) {
                        if (S.cache.logo[cacheKey]) applyLogo(S.cache.logo[cacheKey]);
                    } else {
                        var url = Lampa.TMDB.api(mediaType + '/' + movie.id + '/images?api_key=' + Lampa.TMDB.key() + '&language=ru&include_image_language=ru');
                        S.re.silent(url, function (data) {
                            if (currentToken !== token) return;
                            var logos = (data.logos || []).filter(function (l) {
                                return l.file_path && l.file_path.slice(-4) !== '.svg' && l.iso_639_1 === 'ru';
                            });
                            logos.sort(function (a, b) { return b.vote_average - a.vote_average; });
                            if (S.cache.logoSize > getLogoCacheMax()) { S.cache.logo = {}; S.cache.logoSize = 0; }
                            S.cache.logo[cacheKey] = logos.length ? Lampa.TMDB.image('t/p/original' + logos[0].file_path) : null;
                            S.cache.logoSize++;
                            if (S.cache.logo[cacheKey]) applyLogo(S.cache.logo[cacheKey]);
                        }, function () {}, false, { cache: { life: 1440 } });
                    }
                }
                wrap(fullComp);
            }, 0);
        });

        Lampa.Listener.follow('activity', function (e) {
            if (e.type === 'archive' && e.component === 'full') {
                $('body').addClass('shm7-tv').removeClass('shm7-tv-scrolled');
                $('body').toggleClass('card--no-cover', !Lampa.Storage.field('card_interfice_cover'));
                currentFullComp = e.object && e.object.activity && e.object.activity.component;
            }
            if (e.type === 'destroy' && e.component === 'full') {
                clearTimeout(fullTimer);
                var dc = e.object && e.object.activity && e.object.activity.component;
                if (dc && dc.scroll) dc.scroll._shm7Wrapped = false;
                if (dc === currentFullComp) {
                    currentToken = null; currentFullComp = null;
                    $('body').removeClass('shm7-tv shm7-tv-scrolled');
                    $('body').toggleClass('card--no-cover', !Lampa.Storage.field('card_interfice_cover'));
                }
            }
        });
    }

    // ============================================================
    //  MODULE: cards  (карточки в списках)
    // ============================================================
    function mod_cards() {
        if (!isOn('cards') || window.shm7Cards) return;
        window.shm7Cards = true;

        function clampTitle(el, text) {
            text = text || '';
            el.textContent = text;
            if (!text) return;
            el.textContent = 'A';
            var lh = el.scrollHeight;
            el.textContent = text;
            var maxH = lh * 2 + Math.max(4, lh * 0.12);
            if (el.scrollHeight <= maxH) return;
            var lo = 1, hi = text.length, best = 1;
            while (lo <= hi) {
                var mid = (lo + hi) >> 1;
                el.textContent = text.slice(0, mid).replace(/\s+$/, '') + '...';
                if (el.scrollHeight <= maxH) { best = mid; lo = mid + 1; } else hi = mid - 1;
            }
            el.textContent = text.slice(0, best).replace(/\s+$/, '') + '...';
        }

        function relocate(view, statusRow, badge, badgeRight) {
            var status = view.querySelector('.card__status');
            var type = view.querySelector('.card__type');
            var quality = view.querySelector('.card__quality');
            var vote = view.querySelector('.card__vote');
            if (status && status.parentNode !== statusRow) statusRow.appendChild(status);
            if (type && type.parentNode !== badge) badge.insertBefore(type, badgeRight);
            if (quality && (quality.parentNode !== badgeRight || quality.nextSibling !== vote)) {
                badgeRight.insertBefore(quality, vote && vote.parentNode === badgeRight ? vote : null);
            }
            if (vote && vote.parentNode !== badgeRight) badgeRight.appendChild(vote);
            return !!(status && type && quality && vote);
        }

        function watchInjects(view, statusRow, badge, badgeRight) {
            if (relocate(view, statusRow, badge, badgeRight)) return;
            var timer;
            var mo = new MutationObserver(function () {
                if (relocate(view, statusRow, badge, badgeRight)) stop();
            });
            function stop() { clearTimeout(timer); mo.disconnect(); }
            timer = setTimeout(stop, 30000);
            mo.observe(view, { childList: true, subtree: true });
        }

        function process(card) {
            var data = card.card_data;
            if (!data || card.dataset.listCard) return;
            card.dataset.listCard = '1';
            var view = card.querySelector('.card__view');
            if (!view) return;

            var titleEl = card.querySelector('.card__title');
            var ageEl = card.querySelector('.card__age');
            var promoEl = card.querySelector('.card__promo');
            if (titleEl) titleEl.style.display = 'none';
            if (ageEl) ageEl.style.display = 'none';
            if (promoEl) promoEl.style.display = 'none';

            var icons = card.querySelector('.card__icons');
            if (icons) {
                icons.style.cssText = 'top:0.5em;left:auto;right:0.5em;justify-content:flex-end;';
                var ii = icons.querySelector('.card__icons-inner');
                if (ii) ii.style.cssText = 'background:none;border-radius:0;flex-direction:column;';
            }

            var overlay = document.createElement('div');
            overlay.className = 'card__overlay';
            var t = document.createElement('div');
            t.className = 'card__overlay-title';
            overlay.appendChild(t);
            var statusRow = document.createElement('div');
            statusRow.className = 'card__status-row';
            overlay.appendChild(statusRow);
            var badge = document.createElement('div');
            badge.className = 'card__badge';
            var year = ((data.release_date || data.first_air_date || '') + '').slice(0, 4);
            if (year) {
                var ye = document.createElement('span');
                ye.className = 'card__badge-year';
                ye.textContent = year;
                badge.appendChild(ye);
            }
            var badgeRight = document.createElement('div');
            badgeRight.className = 'card__badge-right';
            badge.appendChild(badgeRight);
            overlay.appendChild(badge);
            view.appendChild(overlay);
            clampTitle(t, data.title || data.name || '');
            watchInjects(view, statusRow, badge, badgeRight);
        }

        S.cardBus.onCard(process);
    }

    // ============================================================
    //  MODULE: dmca
    // ============================================================
    function mod_dmca() {
        if (!isOn('dmca') || window.shm7Dmca) return;
        window.shm7Dmca = true;

        window.lampa_settings.disable_features = window.lampa_settings.disable_features || {};
        window.lampa_settings.disable_features.dmca = true;
        try {
            var _dcma = window.lampa_settings.dcma;
            Object.defineProperty(window.lampa_settings, 'dcma', {
                get: function () { return []; },
                set: function (v) { _dcma = v; },
                configurable: true
            });
        } catch (e) { window.lampa_settings.dcma = []; }

        var _origDcma = Lampa.Utils.dcma;
        Lampa.Utils.dcma = function () {
            try { return _origDcma && _origDcma.apply(this, arguments); } catch (e) { return undefined; }
        };

        var cardRe = /\/3\/(movie|tv)\/(\d+)(?:\/|$|\?)/;
        var subRe = /\/3\/(?:movie|tv)\/\d+\/([^\/\?]+)/;
        var seasonRe = /\/season\/(\d+)(?:\/|$|\?)/;
        var collRe = /\/3\/collection\/(\d+)(?:\/|$|\?)/;
        var cache = {};
        var cacheSize = 0;

        function getLang() { return Lampa.Storage.field('tmdb_lang') || 'ru'; }
        function httpGet(url) {
            return new Promise(function (resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, true);
                xhr.timeout = 10000;
                xhr.ontimeout = reject;
                xhr.onreadystatechange = function () {
                    if (xhr.readyState !== 4) return;
                    try { resolve(JSON.parse(xhr.responseText)); } catch (p) { reject(p); }
                };
                xhr.onerror = reject;
                xhr.send();
            });
        }
        function fetchDirect(type, id) {
            var key = type + '_' + id;
            if (cache[key]) return cache[key];
            if (cacheSize > 200) { cache = {}; cacheSize = 0; }
            cacheSize++;
            var url = 'https://api.themoviedb.org/3/' + type + '/' + id + '?api_key=' + Lampa.TMDB.key() +
                '&language=' + getLang() + '&append_to_response=' +
                (type === 'tv' ? 'credits,external_ids,videos,recommendations,similar,content_ratings'
                              : 'credits,external_ids,videos,recommendations,similar');
            cache[key] = httpGet(url).then(function (c) {
                if (c && c.id) { delete c.blocked; return c; }
                delete cache[key]; return Promise.reject(new Error('invalid'));
            }, function (e) { delete cache[key]; return Promise.reject(e); });
            return cache[key];
        }

        function tryFetch(type, id, altType, resume, fallback, subPath) {
            fetchDirect(type, id).then(function (c) {
                var out = (subPath && c[subPath] !== undefined) ? c[subPath] : c;
                resume(out);
            }, function () {
                if (altType) tryFetch(altType, id, null, resume, fallback, subPath);
                else resume(fallback);
            });
        }

        Lampa.Listener.follow('request_secuses', function (event) {
            if (!event || !event.data || typeof event.abort !== 'function') return;
            var data = event.data;
            var blocked = data.blocked === true || (data.movie && data.movie.blocked === true);
            if (!blocked) return;
            var url = (event.params && event.params.url) || '';

            var cm = url.match(collRe);
            if (cm) {
                var r = event.abort();
                httpGet('https://api.themoviedb.org/3/collection/' + cm[1] + '?api_key=' + Lampa.TMDB.key() + '&language=' + getLang())
                    .then(function (c) { r(c && c.id ? c : { parts: [], results: [] }); }, function () { r({ parts: [], results: [] }); });
                return;
            }
            var m = url.match(cardRe);
            if (!m) return;
            var type = m[1], id = m[2];
            var sm = url.match(subRe);
            var subPath = sm ? sm[1] : null;

            if (subPath === 'season') {
                var smN = url.match(seasonRe);
                var seasonNum = smN ? parseInt(smN[1], 10) : 1;
                var rs = event.abort();
                httpGet('https://api.themoviedb.org/3/tv/' + id + '/season/' + seasonNum + '?api_key=' + Lampa.TMDB.key() + '&language=' + getLang())
                    .then(function (s) { rs(s && (s.id !== undefined || s.episodes) ? s : { episodes: [], id: parseInt(id, 10) }); },
                          function () { rs({ episodes: [], id: parseInt(id, 10) }); });
                return;
            }
            var resume = event.abort();
            tryFetch(type, id, type === 'tv' ? 'movie' : 'tv', resume, data, subPath);
        });
    }

    // ============================================================
    //  MODULE: labels  (метки контента)
    // ============================================================
    function mod_labels() {
        if (!isOn('labels') || window.shm7Labels) return;
        window.shm7Labels = true;

        var allGenres = {
            28:'Боевик',12:'Приключения',35:'Комедия',80:'Криминал',18:'Драма',10751:'Семейный',
            14:'Фэнтези',36:'История',27:'Ужасы',10402:'Музыка',9648:'Детектив',10749:'Мелодрама',
            878:'Фантастика',10770:'Телефильм',53:'Триллер',10752:'Военный',37:'Вестерн',
            10759:'Экшен',10762:'Детский',10765:'НФ и Фэнтези',10768:'Война и Политика'
        };
        function getLabel(d) {
            if (!d || d.profile_path !== undefined || d.known_for_department) return '';
            var isTv = !!d.name;
            var ids = Array.isArray(d.genres) ? d.genres.map(function (g) { return (g && typeof g === 'object') ? g.id : g; }) : (d.genre_ids || []);
            var anim = ids.indexOf(16) !== -1;
            if (anim && d.original_language === 'ja') return 'Аниме';
            if (ids.indexOf(10763) !== -1) return 'Новости';
            if (ids.indexOf(10767) !== -1) return 'Ток-шоу';
            if (ids.indexOf(10764) !== -1) return 'Реалити-шоу';
            if (ids.indexOf(99) !== -1) return 'Документальный';
            if (ids.indexOf(10766) !== -1) return 'Мыльная опера';
            if (anim) return isTv ? 'Мультсериал' : 'Мультфильм';
            return allGenres[ids[0]] || (isTv ? 'Сериал' : 'Фильм');
        }
        function createLabel(label, isTv, full) {
            var el = document.createElement('div');
            el.className = (full ? 'shm7-label ' : 'card__type ') + (isTv ? 'card__type--tv' : 'card__type--movie');
            el.textContent = label;
            return el;
        }

        S.cardBus.onCard(function (card) {
            if (!card.card_data) return;
            [].forEach.call(card.querySelectorAll('.card__type'), function (el) { if (el.textContent === 'TV') el.remove(); });
            if (card.querySelector('.card__type')) return;
            var view = card.querySelector('.card__view');
            if (!view) return;
            var label = getLabel(card.card_data);
            if (label) view.appendChild(createLabel(label, !!card.card_data.name, false));
        });

        Lampa.Listener.follow('full', function (e) {
            if (e.type !== 'complite' || !e.data || !e.data.movie) return;
            var poster = e.body.find('.full-start-new__poster, .full-start__poster')[0];
            if (!poster) return;
            var ex = poster.querySelector('.shm7-label');
            if (ex) ex.remove();
            var label = getLabel(e.data.movie);
            if (label) poster.appendChild(createLabel(label, !!e.data.movie.name, true));
        });
    }

    // ============================================================
    //  MODULE: lines  (Кинопоиск и CUB на главной)
    // ============================================================
    function mod_lines() {
        if (!isOn('lines') || window.shm7Lines) return;
        window.shm7Lines = true;

        var KP_URL = 'https://kinopoiskapiunofficial.tech';
        var KP_TYPE = 'TOP_POPULAR_ALL';
        var KP_TITLE = 'Сейчас смотрят Кинопоиск';
        var CUB_TITLE = 'Сейчас смотрят CUB';

        function loadKp(page, onOk, onErr) {
            var url = KP_URL + '/api/v2.2/films/collections?type=' + KP_TYPE + '&page=' + (page || 1);
            S.re.silent(url, function (json) {
                var items = json && json.items ? json.items : [];
                onOk({ items: items, page: page || 1, total_pages: (json && json.totalPages) || 1 });
            }, onErr, false, { headers: { 'X-API-KEY': getKpKey() }, cache: { life: 180 }, timeout: 15000 });
        }

        function pickBest(results, year) {
            if (!results || !results.length) return null;
            if (year) {
                for (var i = 0; i < results.length; i++) {
                    var d = results[i].release_date || results[i].first_air_date || '';
                    var y = parseInt((d + '').slice(0, 4));
                    if (y && Math.abs(y - year) <= 1) return results[i];
                }
            }
            return results[0];
        }

        function tmdbSearch(method, query, cb) {
            if (!query) return cb([]);
            var url = Lampa.TMDB.api('search/' + method + '?query=' + encodeURIComponent(query) +
                '&api_key=' + Lampa.TMDB.key() + '&language=' + Lampa.Storage.field('tmdb_lang'));
            S.re.silent(url, function (j) { cb(j && j.results ? j.results : []); },
                function () { cb([]); }, false, { cache: { life: 1440 }, timeout: 8000 });
        }

        function resolveCard(card) {
            return new Promise(function (resolve) {
                var year = card.kp_year;
                function tryQ(q, done) {
                    if (!q) return done(null);
                    tmdbSearch(card.method, q, function (results) {
                        var best = pickBest(results, year);
                        if (best) { best.method = card.method; Lampa.Utils.addSource(best, 'tmdb'); done(best); }
                        else done(null);
                    });
                }
                tryQ(card.kp_query_original, function (best) {
                    if (best) return resolve(best);
                    tryQ(card.kp_query_fallback, resolve);
                });
            });
        }

        function resolveList(cards, cb) {
            if (!cards.length) return cb([]);
            Promise.all(cards.map(resolveCard)).then(function (all) {
                cb(all.filter(Boolean));
            });
        }

        function mapKpCard(item) {
            var method = (!item.type || item.type === 'FILM') ? 'movie' : 'tv';
            var id = item.kinopoiskId || item.filmId;
            var c = {
                source: 'kp', kp_source: true, id: 'kp_' + id, kinopoisk_id: id, method: method,
                title: item.nameRu || item.nameOriginal || item.nameEn || '',
                original_title: item.nameOriginal || item.nameEn || '',
                overview: item.description || '',
                img: item.posterUrlPreview || item.posterUrl || '',
                poster: item.posterUrlPreview || item.posterUrl || '',
                vote_average: parseFloat(item.ratingKinopoisk || item.ratingImdb) || 0,
                kp_rating: parseFloat(item.ratingKinopoisk) || 0,
                kp_year: item.year || 0,
                kp_query_original: item.nameOriginal || '',
                kp_query_fallback: item.nameRu || item.nameEn || ''
            };
            if (method === 'tv') {
                c.name = c.title;
                c.original_name = c.original_title;
                c.first_air_date = item.year ? item.year + '-01-01' : '';
            } else {
                c.release_date = item.year ? item.year + '-01-01' : '';
            }
            return c;
        }

        function loadKpResolved(page, onOk, onErr) {
            loadKp(page, function (data) {
                resolveList(data.items.map(mapKpCard), function (resolved) {
                    onOk({ results: resolved, page: data.page, total_pages: data.total_pages, total_results: resolved.length });
                });
            }, onErr);
        }

        function loadCub(page, onOk, onErr) {
            var email = Lampa.Storage.get('account', '{}').email || '';
            var url = Lampa.Utils.protocol() + 'tmdb.' + Lampa.Manifest.cub_domain + '/?sort=now_playing';
            if (page && page > 1) url += '&page=' + page;
            url = Lampa.Utils.addUrlComponent(url, 'email=' + encodeURIComponent(email));
            S.re.silent(url, function (json) {
                var data = Lampa.Utils.addSource(json || {}, 'cub');
                var results = data.results || [];
                onOk({
                    results: results,
                    page: page || 1,
                    total_pages: (json && json.total_pages) || ((results.length ? (page || 1) + 1 : (page || 1)))
                });
            }, onErr, false, { cache: { life: 180 } });
        }

        function kpComponent(object) {
            var c = Lampa.Maker.make('Category', object);
            c.use({
                onCreate: function () { loadKpResolved(object.url, this.build.bind(this), this.empty.bind(this)); },
                onNext: function (resolve, reject) { loadKpResolved(object.url, resolve, reject); },
                onInstance: function (card, data) {
                    card.use({
                        onEnter: function () { Lampa.Router.call('full', data); },
                        onFocus: function () { Lampa.Background.change(Lampa.Utils.cardImgBackground(data)); }
                    });
                }
            });
            return c;
        }
        function cubComponent(object) {
            var c = Lampa.Maker.make('Category', object);
            c.use({
                onCreate: function () { loadCub(object.page || 1, this.build.bind(this), this.empty.bind(this)); },
                onNext: function (resolve, reject) { loadCub(object.page || 1, resolve, reject); },
                onInstance: function (card, data) {
                    card.use({
                        onEnter: function () { Lampa.Router.call('full', data); },
                        onFocus: function () { Lampa.Background.change(Lampa.Utils.cardImgBackground(data)); }
                    });
                }
            });
            return c;
        }

        function buildKpLine(cb) {
            loadKpResolved(1, function (data) {
                if (!data.results.length) return cb(null);
                cb({
                    title: KP_TITLE, url: KP_TYPE, results: data.results, total_pages: data.total_pages,
                    params: { emit: { onlyMore: function () {
                        Lampa.Activity.push({ url: KP_TYPE, title: KP_TITLE, component: 'shm7_kp_category', page: 1 });
                    }}}
                });
            }, function () { cb(null); });
        }
        function buildCubLine(cb) {
            if (Lampa.Storage.field('source') === 'cub') return cb(null);
            loadCub(1, function (data) {
                if (!data.results.length) return cb(null);
                cb({
                    title: CUB_TITLE, url: 'cub_now_watching', results: data.results, total_pages: data.total_pages,
                    params: { emit: { onlyMore: function () {
                        Lampa.Activity.push({ url: 'cub_now_watching', title: CUB_TITLE, component: 'shm7_cub_category', page: 1 });
                    }}}
                });
            }, function () { cb(null); });
        }

        var _origMain = Lampa.Api.main;
        Lampa.Api.main = function (params, oncomplite, onerror) {
            return _origMain(params, function (results) {
                var nowTitle = Lampa.Lang.translate('title_now_watch');
                var trendTitle = Lampa.Lang.translate('title_trend_week');
                var upcomingTitle = Lampa.Lang.translate('title_upcoming_episodes');
                results = (results || []).filter(function (l) { return l.title !== trendTitle; });
                var ai = results.findIndex(function (l) { return l.title === upcomingTitle; });
                if (ai === -1) ai = results.findIndex(function (l) { return l.title === nowTitle; });
                var insertAt = ai === -1 ? 0 : ai + 1;
                var status = new Lampa.Status(2);
                var lines = {};
                status.onComplite = function () {
                    var to = [];
                    if (lines.kp) to.push(lines.kp);
                    if (lines.cub) to.push(lines.cub);
                    results.splice.apply(results, [insertAt, 0].concat(to));
                    oncomplite(results);
                };
                buildKpLine(function (l) { lines.kp = l; status.append('kp', true); });
                buildCubLine(function (l) { lines.cub = l; status.append('cub', true); });
            }, onerror);
        };

        Lampa.Component.add('shm7_kp_category', kpComponent);
        Lampa.Component.add('shm7_cub_category', cubComponent);
    }

    // ============================================================
    //  MODULE: menu  (плавающее меню на TV)
    // ============================================================
    function mod_menu() {
        if (!isOn('menu') || !Lampa.Platform.screen('tv') || window.shm7Menu) return;
        window.shm7Menu = true;

        var updateTimer;
        function update() {
            var fs = parseFloat(getComputedStyle(document.body).fontSize);
            var head = document.querySelector('.head');
            var headH = head ? head.getBoundingClientRect().height : 0;
            var leftEl = document.querySelector('.wrap__left');
            if (leftEl) {
                var maxH = window.innerHeight - headH - fs * 0.5;
                leftEl.style.setProperty('top', headH + 'px', 'important');
                leftEl.style.setProperty('left', fs + 'px', 'important');
                leftEl.style.setProperty('max-height', maxH + 'px', 'important');
                var ls = leftEl.querySelector('.scroll');
                if (ls) ls.style.setProperty('max-height', maxH + 'px', 'important');
            }
            var maxHR = window.innerHeight - fs;
            [{ cls: 'settings--open', sel: '.settings__content' }, { cls: 'selectbox--open', sel: '.selectbox__content' }].forEach(function (p) {
                if (!document.body.classList.contains(p.cls)) return;
                var c = document.querySelector(p.sel);
                if (!c) return;
                var s = c.querySelector('.scroll');
                if (!s) return;
                var h = Math.round(maxHR - (s.getBoundingClientRect().top - c.getBoundingClientRect().top));
                if (h > 0 && Math.round(parseFloat(s.style.height)) !== h) s.style.setProperty('height', h + 'px', 'important');
            });
        }
        function schedule(delay) { clearTimeout(updateTimer); updateTimer = setTimeout(update, delay || 100); }

        var bodyObs = new MutationObserver(function (muts) {
            muts.forEach(function (m) { if (m.attributeName === 'class') schedule(100); });
        });
        bodyObs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        Lampa.Listener.follow('resize_end', function () { schedule(50); });
        Lampa.Listener.follow('app', function (e) { if (e.type === 'destroy') bodyObs.disconnect(); });
        update();
    }

    // ============================================================
    //  MODULE: parser  (доп. серверы торрентов)
    // ============================================================
    function mod_parser() {
        if (!isOn('parser') || window.shm7Parser) return;
        window.shm7Parser = true;

        var SERVERS = [
            'jac.red', 'jac.black', 'jacred.stream=pp', 'jr.maxvol.pro',
            '87.120.84.218:8443=777', 'jac-red.ru', 'ru.jac.black', 'ru.jacred.stream=pp',
            'jacred.freebie.tom.ru=1', 'nmjc.duckdns.org'
        ];
        var switchTimer, focusTimer, bmTimer;

        function parseServer(s) {
            var p = s.split('=');
            return { url: S.util.protocol(p[0]), key: p[1] || '' };
        }
        function switchServer(str) {
            var activity = Lampa.Activity.active();
            if (!activity) return;
            var srv = parseServer(str);
            var oUrl = Lampa.Storage.get('jackett_url', '');
            var oKey = Lampa.Storage.get('jackett_key', '');
            Lampa.Storage.set('jackett_url', srv.url);
            Lampa.Storage.set('jackett_key', srv.key);
            Lampa.Storage.set('jackett_interview', 'healthy');
            Lampa.Activity.replace({ url: '', title: 'Торренты - ' + srv.url, component: 'torrents', search: activity.search, movie: activity.movie, page: 1 });
            clearTimeout(switchTimer);
            switchTimer = setTimeout(function () {
                Lampa.Storage.set('jackett_url', oUrl);
                Lampa.Storage.set('jackett_key', oKey);
            }, 1000);
        }
        function showSelector() {
            var main = Lampa.Storage.get('jackett_main_server', '');
            Lampa.Select.show({
                title: '',
                items: [{ title: 'Короткий тап - поиск | Долгий тап - сделать основным', separator: true }]
                    .concat(SERVERS.map(function (s, i) {
                        var srv = parseServer(s);
                        return { title: (i + 1) + '. ' + srv.url + (srv.key ? ' (' + srv.key + ')' : '') + (main === s ? ' ★' : ''), serverString: s };
                    })),
                onSelect: function (sel) { if (sel && sel.serverString) switchServer(sel.serverString); },
                onLong: function (sel) {
                    if (!sel || !sel.serverString) return;
                    var srv = parseServer(sel.serverString);
                    Lampa.Storage.set('jackett_url', srv.url);
                    Lampa.Storage.set('jackett_key', srv.key);
                    Lampa.Storage.set('jackett_main_server', sel.serverString);
                    showSelector();
                },
                onBack: function () { Lampa.Controller.toggle('head'); }
            });
        }

        Lampa.Listener.follow('activity', function (e) {
            if (e.type === 'start') clearTimeout(bmTimer);
            if (e.component !== 'bookmarks' || e.type !== 'start') return;
            bmTimer = setTimeout(function () {
                var line = document.querySelector('.activity--active .items-line');
                if (!line) return;
                var body = line.querySelector('.scroll__body');
                if (!body || body.querySelector('.torrents-btn')) return;
                var btn = document.createElement('div');
                btn.className = 'register layer--render layer--visible register--line selector torrents-btn';
                btn.setAttribute('data-action', 'mytorrents');
                var name = document.createElement('div'); name.className = 'register__name'; name.textContent = 'Торренты';
                var counter = document.createElement('div'); counter.className = 'register__counter';
                btn.appendChild(name); btn.appendChild(counter);
                $(btn).on('hover:enter', function () { Lampa.Router.call('mytorrents', { title: 'Торренты' }); });
                body.appendChild(btn);
                Lampa.Controller.collectionAppend($(btn));
                Lampa.Torserver.my(function (r) { counter.textContent = r.length; }, function () { counter.textContent = 0; });
            }, 0);
        });

        function addHeader() {
            var icon = Lampa.Head.addIcon('<svg><use xlink:href="#sprite-torrent"></use></svg>', showSelector);
            icon.addClass('jackett-servers-selector').hide();
            Lampa.Listener.follow('activity', function (e) {
                if (e.type !== 'start') return;
                var isT = e.component === 'torrents';
                icon[isT ? 'show' : 'hide']();
                if (!isT) return;
                var m = e.object && e.object.movie;
                var el = document.querySelector('.activity--active');
                if (el) el.classList.toggle('torrents--serial', !!(m && m.number_of_seasons));
            });
            Lampa.Listener.follow('torrent', function (e) {
                if (e.type !== 'render') return;
                var act = Lampa.Activity.active();
                var m = act && act.movie;
                if (m && m.number_of_seasons) return;
                clearTimeout(focusTimer);
                focusTimer = setTimeout(function () {
                    var first = $('.activity--active .torrent-item').first();
                    if (first.length) Lampa.Controller.collectionFocus(first[0], $('.activity--active .scroll')[0]);
                }, 0);
            });
        }

        if (Lampa.Manifest && Lampa.Manifest.plugins) {
            Lampa.Manifest.plugins.unshift({
                type: 'video', name: 'Парсер', subtitle: 'Смотреть торрент',
                onContextMenu: function () {},
                onContextLauch: function (obj) { Lampa.Activity.push({ component: 'torrents', search: obj.title, movie: obj, clarification: true }); }
            });
        }
        addHeader();
    }

    // ============================================================
    //  MODULE: quality  (метка качества)
    // ============================================================
    function mod_quality() {
        if (!isOn('quality') || window.shm7Quality) return;
        window.shm7Quality = true;

        var SERVERS = ['https://jac.red', 'https://jr.maxvol.pro'];
        var RE_TS = /(?:^|[^a-zа-яё])(ts|tsrip|telesync|telecine|cam|camrip|workprint|wp|scr|screener|dvdscr|dcprip|hdtc|hdts)(?:[^a-zа-яё]|$)/i;
        var RE_TS2 = /звук\s*с\s*ts|sound\s*ts|audio\s*ts|dub\s*ts/i;
        var RE_4K = /\b(2160p|2160р|4k|uhd|4к)\b/i;
        var RE_HD = /\b(1080p|1080р|720p|720р|blu\-ray|bdrip|bdremux|web\-dl|webdl|web\-dlrip|webrip|hdtv|hdtvrip|hddvd|hddvdrip|fullhd|fhd|hd|hdrip)\b/i;

        var TTL = 7 * 24 * 60 * 60 * 1000;

        function getQ(t) {
            if (!t) return null;
            if (RE_TS.test(t) || RE_TS2.test(t)) return 'TS';
            if (RE_4K.test(t)) return '4K';
            if (RE_HD.test(t)) return 'HD';
            return null;
        }
        function cacheGet(id) {
            var v = S.cache.quality[id];
            if (!v) return undefined;
            if (Date.now() - v.t > TTL) { delete S.cache.quality[id]; return undefined; }
            return v.v;
        }
        function cacheSet(id, v) {
            S.cache.quality[id] = { v: v, t: Date.now() };
            Lampa.Storage.set('shmitt7_quality', S.cache.quality);
        }

        function fetchQ(data, cb) {
            var key = data.id;
            if (key) {
                var cached = cacheGet(key);
                if (cached !== undefined) return cb(cached);
            }
            var title = data.title || data.name;
            var year = parseInt((data.release_date || data.first_air_date || '').slice(0, 4)) || null;
            var i = 0, titles = [];

            function done() {
                if (!titles.length) { if (key) cacheSet(key, null); return cb(null); }
                var ts = 0, has4K = false, hasHD = false;
                for (var ti = 0; ti < titles.length; ti++) {
                    var q = getQ(titles[ti]);
                    if (q === 'TS') ts++;
                    else if (q === '4K') has4K = true;
                    else if (q === 'HD') hasHD = true;
                }
                var r = ts / titles.length >= 0.5 ? 'TS' : has4K ? '4K' : hasHD ? 'HD' : null;
                if (key) cacheSet(key, r);
                cb(r);
            }
            function next() {
                if (i >= SERVERS.length) return done();
                var url = SERVERS[i] + '/api/v2.0/indexers/all/results?apikey=&Query=' + encodeURIComponent(title) + (year ? '&year=' + year : '');
                S.re.silent(url, function (res) {
                    var rs = (res && res.Results) || [];
                    for (var ri = 0; ri < rs.length; ri++) {
                        var r = rs[ri];
                        var y = parseInt((r.info && r.info.released) || r.year);
                        var inTitle = !year || (r.Title && (r.Title.indexOf(String(year)) !== -1 || r.Title.indexOf(String(year - 1)) !== -1 || r.Title.indexOf(String(year + 1)) !== -1));
                        if ((y && Math.abs(y - year) <= 1) || (!y && inTitle)) titles.push(r.Title);
                    }
                    i++; next();
                }, function () { i++; next(); });
            }
            next();
        }

        function makeBadge(q, cls) {
            var b = document.createElement('div');
            b.className = cls;
            var inner = document.createElement('div');
            inner.textContent = q;
            b.appendChild(inner);
            return b;
        }

        S.cardBus.onCard(function (card) {
            var d = card.card_data;
            if (!d || !d.id || card._shm7Q) return;
            card._shm7Q = true;
            fetchQ(d, function (q) {
                if (!q) return;
                var view = card.querySelector('.card__view');
                if (!view) return;
                var ex = card.querySelector('.card__quality');
                if (ex) { var i = ex.querySelector('div'); if (i) i.textContent = q; return; }
                var badge = makeBadge(q, 'card__quality');
                var bottomInfo = view.querySelector('.card__bottom-info');
                if (bottomInfo) bottomInfo.insertBefore(badge, bottomInfo.firstChild);
                else view.appendChild(badge);
            });
        });

        Lampa.Listener.follow('full', function (e) {
            if (e.type !== 'complite' || !e.data || !e.data.movie) return;
            fetchQ(e.data.movie, function (q) {
                if (!q) return;
                var cont = e.object.activity.render().find('.full-start-new__rate-line, .full-start__rate-line, .full-start__tags');
                if (!cont.length) return;
                cont.find('.tag--quality').remove();
                cont[0].appendChild(makeBadge(q, 'full-start__tag tag--quality'));
            });
        });
    }

    // ============================================================
    //  MODULE: rating  (рейтинг Кинопоиск)
    // ============================================================
    function mod_rating() {
        if (!isOn('rating') || window.shm7Rating) return;
        window.shm7Rating = true;

        var CACHE_OK = 15 * 24 * 60 * 60 * 1000;
        var CACHE_ERR = 24 * 60 * 60 * 1000;
        var CACHE_SRCH = 3 * 60 * 60 * 1000;

        function getCache(id, type) {
            var key = type === 'search' ? 'search_' + id : id;
            var item = S.cache.kp[key];
            if (!item) return null;
            var ttl = type === 'search' ? CACHE_SRCH : (item.kp === 0 ? CACHE_ERR : CACHE_OK);
            return (Date.now() - item.timestamp) < ttl ? item : null;
        }
        function setCache(id, data, type) {
            var key = type === 'search' ? 'search_' + id : id;
            S.cache.kp[key] = Object.assign({}, data, { timestamp: Date.now() });
            Lampa.Storage.set('shmitt7_kp_rating', S.cache.kp);
        }
        function showFull(kp, tmdb, render) {
            $('.wait_rating', render).remove();
            if (kp > 0) $('.rate--kp', render).removeClass('hide').find('> div').eq(0).text(kp.toFixed(1));
            if (tmdb > 0) $('.rate--tmdb', render).removeClass('hide').find('> div').eq(0).text(tmdb.toFixed(1));
        }
        function updateVote(card, kp, tmdb) {
            var el = card.querySelector('.card__vote');
            if (!el) {
                el = document.createElement('div');
                el.className = 'card__vote';
                var v = card.querySelector('.card__view');
                if (v) v.appendChild(el);
            }
            var r = kp > 0 ? kp : tmdb;
            if (r > 0) {
                el.innerHTML = '<span style="display:flex;align-items:center">' + r.toFixed(1) + (kp > 0 ? '<span class="source--name"></span>' : '') + '</span>';
                el.style.display = '';
            } else el.style.display = 'none';
        }
        function fromKpApi(id, card, cb) {
            var tmdb = card.vote_average || 0;
            S.re.silent('https://kinopoiskapiunofficial.tech/api/v2.2/films/' + id,
                function (d) { var kp = d.ratingKinopoisk || 0; setCache(card.id, { kp: kp, tmdb: tmdb }); cb(kp, tmdb); },
                function () { setCache(card.id, { kp: 0, tmdb: tmdb }); cb(0, tmdb); },
                false, { timeout: 3000, headers: { 'X-API-KEY': getKpKey() } });
        }
        function byId(id, card, cb) {
            var tmdb = card.vote_average || 0;
            S.re.silent('https://rating.kinopoisk.ru/' + id + '.xml',
                function (str) {
                    if (str && str.indexOf('<rating>') !== -1) {
                        try {
                            var kp = parseFloat($($.parseXML(str)).find('kp_rating').text()) || 0;
                            if (kp > 0) { setCache(card.id, { kp: kp, tmdb: tmdb }); cb(kp, tmdb); return; }
                        } catch (e) {}
                    }
                    fromKpApi(id, card, cb);
                },
                function () { fromKpApi(id, card, cb); },
                false, { timeout: 1000, dataType: 'text' });
        }
        function fetchRating(card, cb) {
            var cached = getCache(card.id);
            if (cached) return cb(cached.kp, cached.tmdb);
            var sc = getCache(card.id, 'search');
            if (sc) return byId(sc.kp_id, card, cb);
            var year = parseInt((card.release_date || card.first_air_date || '').slice(0, 4)) || null;
            var title = card.title || card.name;
            var tmdb = card.vote_average || 0;
            var err = function () { setCache(card.id, { kp: 0, tmdb: tmdb }); cb(0, tmdb); };

            function byTitle() {
                var q = (title || '').toLowerCase().replace(/[^\wа-яё\s]/gi, ' ').replace(/\s+/g, ' ').trim();
                S.re.silent('https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=' + encodeURIComponent(q),
                    function (j) {
                        if (!j.films || !j.films.length) return err();
                        var films = j.films, best = null;
                        if (year) {
                            best = films.find(function (f) { return parseInt((f.year || '').slice(0, 4)) === year; });
                            if (!best) best = films.find(function (f) { var y = parseInt((f.year || '').slice(0, 4)); return y && y > year - 3 && y < year + 3; });
                        }
                        best = best || films[0];
                        if (best) { setCache(card.id, { kp_id: best.filmId }, 'search'); byId(best.filmId, card, cb); }
                        else err();
                    }, err, false, { timeout: 5000, headers: { 'X-API-KEY': getKpKey() } });
            }
            if (card.imdb_id) {
                S.re.silent('https://kinopoiskapiunofficial.tech/api/v2.2/films?imdbId=' + encodeURIComponent(card.imdb_id),
                    function (d) {
                        var first = d.items && d.items[0];
                        var id = (first && (first.kinopoiskId || first.filmId)) || d.kinopoiskId || d.filmId;
                        if (id) { setCache(card.id, { kp_id: id }, 'search'); byId(id, card, cb); }
                        else byTitle();
                    }, byTitle, false, { timeout: 5000, headers: { 'X-API-KEY': getKpKey() } });
            } else byTitle();
        }

        S.cardBus.onCard(function (card) {
            var d = card.card_data;
            if (!d || !d.id || card._shm7KP) return;
            if (!d.release_date && !d.first_air_date) return;
            card._shm7KP = true;
            fetchRating(d, function (kp, tmdb) { updateVote(card, kp, tmdb); });
        });

        Lampa.Listener.follow('full', function (e) {
            if (e.type !== 'complite' || !e.data || !e.data.movie) return;
            var card = e.data.movie;
            if (!card.release_date && !card.first_air_date) return;
            var render = e.object.activity.render();
            var cached = getCache(card.id);
            if (cached) return showFull(cached.kp, cached.tmdb, render);
            if ($('.rate--kp', render).hasClass('hide') && !$('.wait_rating', render).length) {
                $('.info__rate', render).after('<div style="width:2em;margin-top:1em;margin-right:1em" class="wait_rating"><div class="broadcast__scan"><div></div></div></div>');
                fetchRating(card, function (kp, tmdb) { showFull(kp, tmdb, render); });
            }
        });
    }

    // ============================================================
    //  MODULE: russian  (русский контент)
    // ============================================================
    function mod_russian() {
        if (!isOn('russian') || window.shm7Russian) return;
        window.shm7Russian = true;

        var pad = function (n) { return (n < 10 ? '0' : '') + n; };
        var fmt = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
        var today = new Date();
        var monthAgo = new Date(today); monthAgo.setMonth(monthAgo.getMonth() - 1);
        var yearAgo = new Date(today); yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        var dates = { now: fmt(today), month: fmt(monthAgo), year: fmt(yearAgo) };
        var buildUrl = function (q) { return Lampa.TMDB.api(q + '&api_key=' + Lampa.TMDB.key() + '&language=ru'); };
        var sortPop = function (a, b) { return (b.popularity || 0) - (a.popularity || 0); };
        var sortDate = function (a, b) { return (b.release_date || b.first_air_date || '').localeCompare(a.release_date || a.first_air_date || ''); };

        function loadData(queries, title, cb, sortFn) {
            var qs = Array.isArray(queries) ? queries : [queries];
            var results = [], done = 0;
            function onDone() {
                if (++done < qs.length) return;
                if (sortFn) results.sort(sortFn);
                cb(Lampa.Utils.addSource({
                    results: results.slice(0, 20), title: title, source: 'tmdb', total_pages: 2,
                    params: { card: { card_small: true } }
                }, 'tmdb'));
            }
            qs.forEach(function (q) {
                S.re.silent(buildUrl(q), function (j) { results = results.concat(j.results || []); onDone(); }, onDone, false, { cache: { life: 1440 } });
            });
        }

        var QUERIES = {
            nowPlaying: [
                'discover/movie?with_original_language=ru&with_runtime.gte=71&primary_release_date.gte=' + dates.month + '&primary_release_date.lte=' + dates.now + '&sort_by=popularity.desc&page=1',
                'discover/tv?with_original_language=ru&first_air_date.gte=' + dates.month + '&first_air_date.lte=' + dates.now + '&sort_by=popularity.desc&page=1'
            ],
            yearlyPopular: [
                'discover/movie?with_original_language=ru&with_runtime.gte=71&primary_release_date.gte=' + dates.year + '&primary_release_date.lte=' + dates.now + '&sort_by=popularity.desc&page=1',
                'discover/tv?with_original_language=ru&first_air_date.gte=' + dates.year + '&first_air_date.lte=' + dates.now + '&sort_by=popularity.desc&page=1'
            ],
            movies: 'discover/movie?with_original_language=ru&with_runtime.gte=71&without_genres=16,99&primary_release_date.lte=' + dates.now + '&sort_by=primary_release_date.desc',
            series: 'discover/tv?with_original_language=ru&without_genres=16,10764,10767,99&first_air_date.lte=' + dates.now + '&sort_by=first_air_date.desc',
            cartoons: 'discover/movie?with_original_language=ru&with_genres=16&with_runtime.gte=70&primary_release_date.lte=' + dates.now + '&sort_by=primary_release_date.desc',
            cartoonSeries: 'discover/tv?with_original_language=ru&with_genres=16&first_air_date.lte=' + dates.now + '&sort_by=first_air_date.desc',
            reality: 'discover/tv?with_original_language=ru&with_genres=10764&first_air_date.lte=' + dates.now + '&sort_by=first_air_date.desc',
            talkShows: 'discover/tv?with_original_language=ru&with_genres=10767&first_air_date.lte=' + dates.now + '&sort_by=first_air_date.desc',
            documentary: [
                'discover/movie?with_original_language=ru&with_genres=99&primary_release_date.lte=' + dates.now + '&sort_by=primary_release_date.desc&page=1',
                'discover/tv?with_original_language=ru&with_genres=99&first_air_date.lte=' + dates.now + '&sort_by=first_air_date.desc&page=1'
            ]
        };

        Lampa.Component.add('shm7_russian_category', function (params) {
            var comp = Lampa.Maker.make('Main', params);
            var sections = [
                function (cb) { loadData(QUERIES.nowPlaying, 'Сейчас смотрят', cb, sortPop); },
                function (cb) { loadData(QUERIES.yearlyPopular, 'Популярное за год', cb, sortPop); },
                function (cb) { loadData(QUERIES.movies, 'Русские фильмы', cb, sortDate); },
                function (cb) { loadData(QUERIES.series, 'Русские сериалы', cb, sortDate); },
                function (cb) { loadData(QUERIES.cartoons, 'Русские мультфильмы', cb, sortDate); },
                function (cb) { loadData(QUERIES.cartoonSeries, 'Русские мультсериалы', cb, sortDate); },
                function (cb) { loadData(QUERIES.reality, 'Русские реалити-шоу', cb, sortDate); },
                function (cb) { loadData(QUERIES.talkShows, 'Русские ток-шоу', cb, sortDate); },
                function (cb) { loadData(QUERIES.documentary, 'Русские документальные', cb, sortDate); }
            ];
            var routes = {
                'Сейчас смотрят':          { component: 'shm7_russian_now_full', url: '' },
                'Популярное за год':       { component: 'shm7_russian_year_full', url: '' },
                'Русские фильмы':          { component: 'category_full', url: QUERIES.movies },
                'Русские сериалы':         { component: 'category_full', url: QUERIES.series },
                'Русские мультфильмы':     { component: 'category_full', url: QUERIES.cartoons },
                'Русские мультсериалы':    { component: 'category_full', url: QUERIES.cartoonSeries },
                'Русские реалити-шоу':     { component: 'category_full', url: QUERIES.reality },
                'Русские ток-шоу':         { component: 'category_full', url: QUERIES.talkShows },
                'Русские документальные':  { component: 'shm7_russian_documentary_full', url: '' }
            };
            var offset = 0;
            comp.use({
                onCreate: function () {
                    this.activity.loader(true);
                    var self = this;
                    Lampa.Api.partNext(sections.slice(0, 2), 2, function (data) {
                        offset = 2;
                        self.build(data); self.activity.loader(false); self.activity.toggle();
                    }, function () { self.empty(); self.activity.loader(false); });
                },
                onNext: function (resolve, reject) {
                    if (offset >= sections.length) return reject();
                    Lampa.Api.partNext(sections.slice(offset, offset + 2), 2, function (data) {
                        offset += 2; resolve(data);
                    }, reject);
                },
                onInstance: function (item, itemData) {
                    item.use({
                        onMore: function () {
                            var route = routes[itemData.title];
                            if (route) Lampa.Activity.push({ url: route.url, title: itemData.title, component: route.component, page: 1, source: 'tmdb' });
                        },
                        onInstance: function (card, cardData) {
                            card.use({
                                onEnter: function () { Lampa.Router.call('full', cardData); },
                                onFocus: function () { Lampa.Background.change(Lampa.Utils.cardImgBackground(cardData)); }
                            });
                        }
                    });
                }
            });
            return comp;
        });

        ['now', 'year', 'documentary'].forEach(function (type) {
            Lampa.Component.add('shm7_russian_' + type + '_full', function (params) {
                var comp = Lampa.Maker.make('Category', params);
                var cache = {};
                var queries = type === 'now' ? QUERIES.nowPlaying : type === 'year' ? QUERIES.yearlyPopular : QUERIES.documentary;
                var sortFn = type === 'documentary' ? sortDate : sortPop;
                function loadPage(pageNum, cb) {
                    if (cache[pageNum]) return cb(cache[pageNum]);
                    var apiPage = Math.ceil(pageNum / 2);
                    var results = [], done = 0;
                    function onDone() {
                        if (++done < queries.length) return;
                        var data = { results: results.sort(sortFn), total_pages: 500, source: 'tmdb' };
                        cache[pageNum] = data;
                        cb(data);
                    }
                    [0, 1].forEach(function (i) {
                        S.re.silent(buildUrl(queries[i].replace(/page=1/, 'page=' + apiPage)),
                            function (j) { results = results.concat(j.results || []); onDone(); },
                            onDone, false, { cache: { life: 1440 } });
                    });
                }
                comp.use({
                    onCreate: function () {
                        var self = this;
                        self.activity.loader(true);
                        loadPage(params.page || 1, function (data) {
                            self.build(data);
                            self.render().find('.category-full').addClass('cols--6');
                            self.activity.loader(false); self.activity.toggle();
                        });
                    },
                    onNext: function (resolve) {
                        params.page = (params.page || 1) + 1;
                        loadPage(params.page, resolve);
                    },
                    onInstance: function (card, cardData) {
                        card.use({
                            onEnter: function () { Lampa.Router.call('full', cardData); },
                            onFocus: function () { Lampa.Background.change(Lampa.Utils.cardImgBackground(cardData)); }
                        });
                    }
                });
                return comp;
            });
        });

        var SVG_MENU = '<svg width="36" height="36" viewBox="0 0 35 35"><path d="M7.486,33.076a3.164,3.164,0,0,1-3.164-3.165V5.089A3.164,3.164,0,0,1,9.249,2.461L27.754,14.872a3.165,3.165,0,0,1,0,5.256L9.249,32.539h0A3.156,3.156,0,0,1,7.486,33.076Z" fill="currentColor"/></svg>';
        Lampa.Menu.addButton(SVG_MENU, 'Русское', function () {
            Lampa.Activity.push({ url: '', title: 'Русский контент', component: 'shm7_russian_category', page: 1 });
        });
    }

    // ============================================================
    //  MODULE: status  (статус контента)
    // ============================================================
    function mod_status() {
        if (!isOn('status') || window.shm7Status) return;
        window.shm7Status = true;

        function daysUntil(s) {
            if (!s) return -1;
            var t = new Date(); t.setHours(0, 0, 0, 0);
            var target = Lampa.Utils.parseToDate(s);
            return Math.round((target.getTime() - t.getTime()) / 86400000);
        }
        function fDate(s) {
            if (!s) return null;
            var p = s.split('-');
            if (p.length === 1 && p[0].length === 4) return p[0];
            if (p.length === 2) return p[1] + '.' + p[0].slice(2);
            var d = daysUntil(s);
            if (d <= 0) return null;
            if (d <= 30) return 'Премьера ' + d + 'дн.';
            return p[2] + '.' + p[1] + '.' + p[0].slice(2);
        }
        function fPremiere(s) {
            if (!s) return 'Премьера';
            var p = s.split('-');
            if (p.length === 1 && p[0].length === 4) return 'Премьера ' + p[0];
            if (p.length === 2) return 'Премьера ' + p[1] + '.' + p[0].slice(2);
            var d = daysUntil(s);
            if (d > 0 && d <= 30) return 'Премьера ' + d + 'дн.';
            return 'Премьера ' + p[2] + '.' + p[1] + '.' + p[0].slice(2);
        }
        function fYear(s) { return s ? s.split('-')[0] : null; }

        function buildEpisodeText(info) {
            var last = info.last_episode_to_air;
            var next = info.next_episode_to_air;
            var seasons = info.seasons || [];
            if (!last) return null;
            var curS = last.season_number;
            var aired = 0;
            for (var i = 0; i < seasons.length; i++) {
                var s = seasons[i];
                if (s.season_number > 0 && s.season_number < curS) aired += s.episode_count;
            }
            aired += last.episode_number;
            var sp = 'S' + curS, ep = 'E' + aired;
            if (next) {
                var tot = info.number_of_episodes;
                if (next.season_number > curS) {
                    sp += '/S' + next.season_number;
                    if (tot && tot > aired) ep += '/E' + tot;
                } else if (next.season_number === curS && tot && tot > aired) ep += '/E' + tot;
            }
            return sp + ':' + ep;
        }
        function tvLabel(info) {
            var last = info.last_episode_to_air;
            var next = info.next_episode_to_air;
            var status = info.status;
            var ep = buildEpisodeText(info);
            if (!last) {
                if (status === 'Returning Series') return { text: fDate(info.first_air_date) || 'Онгоинг', icon: '▶', color: '#00E676' };
                if (status === 'In Production') return { text: fPremiere(info.first_air_date), icon: '✦', color: '#E040FB' };
                if (status === 'Planned') { var y = fYear(info.first_air_date); return { text: 'Запланировано' + (y ? ' ' + y : ''), icon: '❱', color: '#E040FB' }; }
                if (status === 'Ended') return { text: 'Завершён', icon: '✔', color: '#FFD740' };
                if (status === 'Canceled') return { text: 'Отменён', icon: '✘', color: '#FF5252' };
                if (status === 'Pilot') return { text: 'Пилот', icon: '✔', color: '#FFD740' };
                return null;
            }
            if (status === 'Returning Series') {
                var dn = (next && next.air_date) ? daysUntil(next.air_date) : 999;
                return dn >= 0 && dn <= 8 ? { text: ep, icon: '▶', color: '#00E676' } : { text: ep, icon: '⏯︎', color: '#40C4FF' };
            }
            if (status === 'Ended') return { text: ep, icon: '✔', color: '#FFD740' };
            if (status === 'Canceled') return { text: ep, icon: '✘', color: '#FF5252' };
            if (status === 'Pilot') return { text: 'Пилот', icon: '✔', color: '#FFD740' };
            if (status === 'In Production') return { text: fPremiere(info.first_air_date), icon: '✦', color: '#E040FB' };
            if (status === 'Planned') { var y2 = fYear(info.first_air_date); return { text: 'Запланировано' + (y2 ? ' ' + y2 : ''), icon: '❱', color: '#E040FB' }; }
            return { text: ep, icon: '⏯︎', color: '#40C4FF' };
        }
        function movieLabel(info) {
            var st = info.status, rd = info.release_date;
            if (st === 'Rumored') { var y = fYear(rd); return { text: 'По слухам' + (y ? ' ' + y : ''), icon: '❱', color: '#E040FB' }; }
            if (st === 'Planned') { var y2 = fYear(rd); return { text: 'Запланировано' + (y2 ? ' ' + y2 : ''), icon: '❱', color: '#E040FB' }; }
            if (st === 'In Production' || st === 'Post Production') return { text: fPremiere(rd), icon: '✦', color: '#E040FB' };
            if (st === 'Released') return null;
            if (st === 'Canceled') return { text: 'Отменён', icon: '✘', color: '#FF5252' };
            return null;
        }

        function apply(card, info, isTv) {
            if (card._shm7Status) return;
            card._shm7Status = true;
            var li = isTv ? tvLabel(info) : movieLabel(info);
            if (!li || !li.text) return;
            var view = card.querySelector('.card__view');
            if (!view) return;
            var label = document.createElement('div');
            label.className = 'card__status';
            var ic = document.createElement('span'); ic.className = 'tvs-icon'; ic.style.color = li.color; ic.textContent = li.icon;
            var tx = document.createElement('span'); tx.className = 'tvs-text'; tx.textContent = li.text;
            label.appendChild(ic); label.appendChild(tx);
            view.appendChild(label);
        }

        function isPerson(data) {
            return !!(data.known_for_department !== undefined || (data.profile_path && !data.poster_path && !data.backdrop_path));
        }

        S.cardBus.onCard(function (card) {
            var data = card.card_data;
            if (!data || card._shm7Status || isPerson(data)) return;
            var isTv = !!(data.original_name || data.first_air_date);
            if (isTv) {
                S.re.silent(Lampa.TMDB.api('tv/' + data.id + '?api_key=' + Lampa.TMDB.key()),
                    function (r) { if (r && r.id) apply(card, r, true); },
                    function () {}, false, { cache: { life: 1440 } });
            } else if (data.release_date || data.original_title) {
                S.re.silent(Lampa.TMDB.api('movie/' + data.id + '?api_key=' + Lampa.TMDB.key()),
                    function (r) { if (r && r.id) apply(card, r, false); },
                    function () {}, false, { cache: { life: 1440 } });
            }
        });
    }

    // ============================================================
    //  MODULE: torrserver  (TorrServer Free)
    // ============================================================
    function mod_torrserver() {
        if (!isOn('torrserver') || window.shm7TorrServer) return;
        window.shm7TorrServer = true;

        var fail = function () { Lampa.Noty.show('TorrServer недоступен'); };
        function switchServer() {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', 'https://185.87.48.42:8090/random_torr');
            xhr.onload = function () {
                var ip = xhr.status === 200 ? xhr.responseText.trim() : '';
                if (ip) {
                    Lampa.Storage.set('torrserver_url_two', 'http://' + ip + ':8090');
                    Lampa.Noty.show('TorrServer изменён http://' + ip + ':8090');
                } else fail();
            };
            xhr.onerror = fail;
            xhr.send();
        }

        function addButton() {
            if (!Lampa.Storage.field('internal_torrclient') || Lampa.Storage.get('torrserver_use_link') !== 'two') return;
            var button = Lampa.Head.addIcon('<img src="./img/icons/settings/server.svg" />', switchServer).addClass('switch-server');
            Lampa.Listener.follow('activity', function (e) {
                if (e.type !== 'start') return;
                button.toggle(e.component === 'torrents');
                if (e.component === 'torrents') switchServer();
            });
            var _a = Lampa.Activity.active();
            button.toggle(_a && _a.component === 'torrents');
        }
        addButton();
    }

    // ============================================================
    //  MODULE: tweaks  (очистка интерфейса)
    // ============================================================
    function mod_tweaks() {
        if (!isOn('tweaks') || window.shm7Tweaks) return;
        window.shm7Tweaks = true;

        var NON_LATIN_CYR = /[\u0530-\u06FF\u0900-\u0FFF\u1000-\u11FF\u1780-\u18AF\u3040-\u30FF\u31F0-\u31FF\u4E00-\u9FFF\uA960-\uA97F\uAC00-\uD7FF\uFF66-\uFF9F]/;
        var CYR = /[\u0400-\u04FF]/;

        Lampa.Listener.follow('request_secuses', function (r) {
            if (r.data && Array.isArray(r.data.results)) {
                r.data.results = r.data.results.filter(function (item) {
                    var t = item.title || item.name || '';
                    var lang = item.original_language;
                    if (lang === 'en' || lang === 'ru') return !NON_LATIN_CYR.test(t);
                    return CYR.test(t);
                });
            }
        });

        Object.assign(window.lampa_settings || (window.lampa_settings = {}), {
            torrents_use: true, feed: false, services: false, lang_use: false,
            white_use: false, read_only: false, demo: false
        });
        Object.assign(window.lampa_settings.disable_features || (window.lampa_settings.disable_features = {}), {
            dmca: true, lgbt: true, ai: true, subscribe: true,
            blacklist: true, persons: true, ads: true, remote_configuration: true
        });

        var editItem = $('.menu [data-action="edit"]').detach();
        $('.menu .nosort:first .menu__list').append(editItem);
        var lastNosort = $('.menu .nosort:last');
        lastNosort.prev('.menu__split').remove();
        lastNosort.remove();
    }

    // ============================================================
    //  GLOBAL CSS
    // ============================================================
    function injectStyles() {
        var css = [
            /* ---- list cards (cards.js) ---- */
            '.card[data-list-card] .card__title{display:none!important}',
            '.card[data-list-card] .card__age{display:none!important}',
            '.card[data-list-card] .card__promo{display:none!important}',
            '.card.focus .card-watched{display:none!important}',
            '.card__icons{top:0.5em!important;left:auto!important;right:0.5em!important;justify-content:flex-end!important}',
            '.card__icons-inner{background:none!important;border-radius:0!important;flex-direction:column!important}',
            '.card__icons-inner>.card__icon{margin-bottom:0.2em}',
            '.card__icon{filter:drop-shadow(0 1px 4px rgba(0,0,0,1)) drop-shadow(0 0 8px rgba(0,0,0,0.9))!important}',
            '.card__overlay{position:absolute;left:0.2em;right:0.2em;bottom:0.2em;padding:0.35em 0.35em 0.2em;background:#3c3c3c;border-radius:0.8em;box-shadow:0 0.3em 0.6em rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.08);z-index:1;pointer-events:none;display:flex;flex-direction:column}',
            '.card__overlay-title{font-size:1.45em;font-weight:500;line-height:1.15;color:#fff;overflow:hidden;margin-bottom:0.1em;white-space:normal;word-break:normal;max-height:2.5em;padding-bottom:0.08em}',
            '.card__status-row{display:flex;align-items:baseline;margin-bottom:0.1em;line-height:1;overflow:hidden;white-space:nowrap;min-width:0}',
            '.card__status-row:empty{display:none}',
            '.card__status-row .card__status{position:static!important;left:auto!important;top:auto!important;bottom:auto!important;background:none!important;padding:0!important;border-radius:0!important;font-size:0.95em!important;display:flex!important;align-items:baseline!important;pointer-events:none;white-space:nowrap}',
            '.card__status-row .card__status .tvs-icon{font-size:1.1em;margin-right:0.2em;flex-shrink:0}',
            '.card__status-row .card__status .tvs-text{font-size:0.95em;font-weight:500;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex-shrink:1;min-width:0}',
            '.card__badge{display:flex;flex-wrap:nowrap;align-items:center;line-height:1;width:100%;overflow:hidden;margin-top:auto}',
            '.card__badge-year{font-size:0.95em;line-height:1;color:#fff;flex-shrink:0}',
            '.card__badge-genre,.card__badge .card__type{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-left:0.4em;color:#fff;line-height:1}',
            '.card__badge-year+.card__badge-genre::before,.card__badge-year+.card__type::before{content:none}',
            '.card__badge .card__type{position:static!important;top:auto!important;left:auto!important;background:none!important;padding:0!important;border-radius:0!important;font-size:0.95em!important;line-height:1!important;color:#fff!important}',
            '.card__badge-right{display:flex;align-items:center;flex-shrink:0;margin-left:auto}',
            '.card__badge-right>*+*{margin-left:0.4em}',
            '.card__badge-right .card__quality{position:static!important;left:auto!important;bottom:auto!important;padding:0!important;background:none!important;color:#fff!important;font-size:1.1em!important;line-height:1!important;font-weight:500;border-radius:0!important}',
            '.card__badge-right .card__quality>div{display:inline}',
            '.card__badge-right .card__vote{position:static!important;right:auto!important;bottom:auto!important;background:none!important;color:#fff!important;font-size:1.1em!important;line-height:1!important;font-weight:500;padding:0!important;border-radius:0!important}',
            '.card__status,.card__type,.card__quality,.card__vote{visibility:hidden!important}',
            '.card__status-row .card__status,.card__badge .card__type,.card__badge-right .card__quality,.card__badge-right .card__vote{visibility:visible!important}',

            /* ---- labels ---- */
            '.card__type--movie{background:#1565C0!important;color:#fff!important}',
            '.shm7-label{position:absolute;top:0.4em;left:0.4em;padding:0.2em 0.5em;background:#1565C0;color:#fff;font-size:0.9em;font-weight:600;border-radius:0.3em;z-index:5;box-shadow:0 1px 3px rgba(0,0,0,.5)}',

            /* ---- rating ---- */
            '.card__vote{display:flex!important;align-items:center!important}',
            '.card__vote .source--name{width:0.85em;height:1.1em;background-repeat:no-repeat;background-position:center;background-size:contain;margin-left:0.2em;flex-shrink:0;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'white\' d=\'M12.049 0C5.45 0 .104 5.373.104 12S5.45 24 12.049 24c3.928 0 7.414-1.904 9.592-4.844l-9.803-5.174l6.256 6.418h-3.559l-4.373-6.086V20.4h-2.89V3.6h2.89v6.095L14.535 3.6h3.559l-6.422 6.627l9.98-5.368C19.476 1.911 15.984 0 12.05 0z\'/%3E%3C/svg%3E")}',

            /* ---- status (standalone) ---- */
            '.card__status{position:absolute;left:-0.8em;top:3.5em;padding:0.4em;background:rgba(0,0,0,.8);border-radius:0.3em;font-size:0.8em;display:flex;align-items:baseline;line-height:1;z-index:1;pointer-events:none;white-space:nowrap}',
            '.card__status .tvs-icon{font-size:1.2em;margin-right:0.3em;transform:translateY(0.05em)}',
            '.card__status .tvs-text{font-size:1em;font-weight:600;color:#fff;letter-spacing:0.03em;line-height:1}',

            /* ---- mobile card (cardMobile) ---- */
            'body.shm7-cm .full-start-new__poster{position:relative!important;overflow:hidden!important;padding-bottom:150%!important;background:transparent!important}',
            'body.shm7-cm .full-start-new__poster::after{content:""!important;position:absolute!important;left:0!important;right:0!important;bottom:0!important;pointer-events:none!important;z-index:1!important}',
            'body.shm7-cm .full-start-new__right{position:relative!important;z-index:2!important;border-radius:0!important;background:transparent!important;padding-top:0.6em!important;display:flex!important;flex-direction:column!important;align-items:center!important;text-align:center!important}',
            'body.shm7-cm .full-start-new__right>*:not(.shm7-row):not(.full-start-new__buttons){display:none!important}',
            '.shm7-row{width:100%;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;margin-bottom:.35em}',
            '.shm7-row:empty{display:none}',
            '.shm7-row--title{margin-bottom:.15em}',
            '.shm7-title-text{font-size:2em;font-weight:600;line-height:1.15;text-shadow:0 2px 10px rgba(0,0,0,.9)}',
            '.shm7-title-text.shm7-title-split{white-space:normal}',
            '.shm7-logo{max-width:16em;max-height:4.5em;object-fit:contain}',
            '.shm7-tagline{font-size:1.15em;opacity:.85;text-shadow:0 2px 8px rgba(0,0,0,.9)}',
            '.shm7-badge{display:inline-flex;align-items:center;height:1.6em;padding:0 .55em;background:rgba(255,255,255,.08);color:#fff;font-size:1.05em;font-weight:600;border-radius:.35em;white-space:nowrap;border:1px solid rgba(255,255,255,.2);margin:.12em}',
            '.shm7-row--next .shm7-badge{max-width:92%;white-space:normal;height:auto;text-align:center}',
            '.shm7-react-icon{width:1em;height:1em;flex-shrink:0}',
            'body.shm7-cm .full-start-new__buttons{margin-top:.6em!important;order:99!important}',

            /* ---- TV card (cardTV) ---- */
            'body.shm7-tv .full-start__background{position:fixed!important;top:0!important;right:0!important;bottom:0!important;left:0!important;width:100vw!important;height:100vh!important;z-index:0!important;object-fit:cover!important;-webkit-mask-image:none!important;mask-image:none!important;pointer-events:none!important;filter:none!important;opacity:0;transition:opacity .5s ease-in-out}',
            'body.shm7-tv .full-start__background.loaded{opacity:.8!important}',
            'body.shm7-tv:not(.shm7-tv-scrolled) .background{opacity:0!important;transition:none!important}',
            'body.shm7-tv.shm7-tv-scrolled .background{opacity:1!important;transition:opacity .4s!important}',
            'body.shm7-tv:not(.shm7-tv-scrolled) .head{background:transparent!important}',
            'body.shm7-tv .full-start-new{position:relative!important;overflow:visible!important}',
            'body.shm7-tv .full-start-new__body{min-height:calc(100vh - 6em)!important;align-items:stretch!important;justify-content:center!important;overflow:visible!important}',
            'body.shm7-tv .full-start-new__right{display:flex!important;flex-direction:column!important;min-height:calc(100vh - 6em)!important;justify-content:flex-end!important;align-items:center!important;text-align:center!important;padding-bottom:.8em!important;overflow:visible!important;position:relative!important}',
            'body.shm7-tv.shm7-tv-scrolled .full-start-new__right{min-height:0!important}',
            'body.shm7-tv .full-start-new__left{display:none!important}',
            'body.shm7-tv .full-start-new__right>*:not(.shm7-tv-main):not(.shm7-poster-fallback):not(.shm7-reactions-badge){display:none!important}',
            '.shm7-tv-main{display:flex!important;flex-direction:column!important;align-items:center!important;text-align:center!important;margin-bottom:.2em!important;width:100%!important}',
            'body.shm7-tv.shm7-tv-scrolled .shm7-tv-main{display:none!important}',
            'body.shm7-tv .full-start-new__title{text-align:center!important;max-width:100%!important;text-shadow:0 2px 12px rgba(0,0,0,.95)!important;margin-bottom:.15em!important;display:block!important;overflow:hidden!important;white-space:nowrap!important;text-overflow:ellipsis!important}',
            'body.shm7-tv .full-start-new__title.shm7-title-split{white-space:normal!important;text-overflow:clip!important;display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:2!important}',
            '.shm7-center-row{display:flex!important;flex-wrap:wrap!important;align-items:center!important;justify-content:center!important;margin-bottom:.2em!important}',
            '.shm7-poster-fallback{flex:1 1 0!important;min-height:0!important;max-width:60%!important;object-fit:cover!important;object-position:center top!important;margin-bottom:.5em!important;border-radius:1em!important}',
            '.shm7-reactions-badge{position:absolute!important;bottom:1em!important;right:0!important;z-index:10!important}',
            'body.shm7-tv.shm7-tv-scrolled .shm7-reactions-badge{display:none!important}',
            'body.shm7-tv .shm7-tv-main .full-start-new__buttons{margin-top:0.5em!important}',

            /* ---- menu (floating) ---- */
            '.wrap__left{position:fixed!important;margin-left:0!important;padding-top:0!important;height:auto!important;border-radius:1em!important;background:#262829!important;border:2px solid rgba(255,255,255,.25)!important;transform:translate3d(-17em,0,0)!important;overflow:hidden!important}',
            'body.black--style .wrap__left{background:#000!important}',
            'body.glass--style .wrap__left{background:rgba(0,0,0,.3)!important;-webkit-backdrop-filter:blur(1.6em)!important;backdrop-filter:blur(1.6em)!important}',
            'body.glass--style-opacity--medium .wrap__left{background:rgba(20,20,20,.6)!important}',
            'body.glass--style-opacity--blacked .wrap__left{background:rgba(20,20,20,.9)!important}',
            '.wrap__left>.scroll{height:auto!important;overflow:hidden!important}',
            '.wrap__left .scroll--mask{-webkit-mask-image:none!important;mask-image:none!important}',
            '.wrap__left .scroll--mask .scroll__content{padding:0!important}',
            '.wrap__left .menu__list{padding-left:0!important}',
            'body.menu--open:not(.light--version) .wrap__left{transform:translate3d(0,0,0)!important}',
            'body.menu--open:not(.light--version) .wrap__content{transform:translate3d(0,0,0)!important}',
            'body.menu--always:not(.light--version) .wrap__left{width:5em!important;transform:translate3d(0,0,0)!important}',
            'body.menu--always.menu--open:not(.light--version) .wrap__left{width:15em!important}',
            '.settings__content,.selectbox__content{top:.5em!important;bottom:.5em!important;height:auto!important;max-height:calc(100vh - 1em)!important;border-radius:1em!important;border:2px solid rgba(255,255,255,.25)!important;overflow:hidden!important}',
            'body.black--style .settings__content,body.black--style .selectbox__content{background:#000!important}',
            'body.settings--open .settings__content,body.selectbox--open .selectbox__content{transform:translate3d(calc(-100% - .5em),0,0)!important}',
            '.settings__content .scroll--mask .scroll__content,.selectbox__content .scroll--mask .scroll__content{padding-bottom:.5em!important}',
            '.modal__content{border:2px solid rgba(255,255,255,.25)!important}',
            'body.black--style .modal__content{background:#000!important}',

            /* ---- parser ---- */
            '.torrent-item__seeds span,.torrent-item__grabs span{font-weight:800;font-size:1.25em}',
            '.torrent-list .watched-history{display:none}',
            '.torrents--serial .torrent-list .watched-history{display:flex}',

            /* ---- torrserver ---- */
            '.head__action.switch-server.focus img,.head__action.switch-server.hover img{-webkit-filter:brightness(0.3);filter:brightness(0.3)}',

            /* ---- tweaks ---- */
            '.head .open--broadcast,.head .open--profile,.head .notice--icon{display:none!important}',
            '.menu [data-action="catalog"],.menu [data-action="relise"],.menu [data-action="timetable"],.menu [data-action="about"],.menu [data-action="mytorrents"]{display:none!important}',
            '.button--options{display:none!important}'
        ].join('\n');

        var st = document.createElement('style');
        st.id = 'shm7-styles';
        st.textContent = css;
        document.head.appendChild(st);
    }

    // ============================================================
    //  SETTINGS
    // ============================================================
    function buildSettings() {
        Lampa.SettingsApi.addComponent({
            component: COMPONENT_NAME,
            name: 'Shmitt7 (все-в-одном)',
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        });

        Lampa.SettingsApi.addParam({
            component: COMPONENT_NAME,
            param: { name: 'shm7_reload', type: 'button' },
            field: {
                name: '<svg style="width:20px;height:20px;display:inline-block;vertical-align:middle;margin-right:8px" viewBox="0 0 24 24" fill="none"><path d="M21 12a9 9 0 1 1-2.64-6.36" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M21 3v6h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Перезагрузить приложение',
                description: 'Применить изменения в модулях'
            },
            onChange: function () { window.location.reload(); }
        });

        var MODULE_INFO = [
            ['buttons',     'Цветные кнопки просмотра',        'Раздельные цветные кнопки для источников в карточке'],
            ['cardMobile',  'Карточка фильма для телефона',    'Мобильный вид полной карточки (не TV)'],
            ['cardTV',      'Карточка фильма для TV',          'ТВ-вид полной карточки'],
            ['cards',       'Карточки в списках',              'Визуальный вид карточки в списках'],
            ['dmca',        'Разблокировка DMCA',              'Автоматический обход блокировки DMCA'],
            ['labels',      'Цветные метки контента',          'Метки типа: фильм/сериал/аниме/мультфильм'],
            ['lines',       'Линии Кинопоиск и CUB',           'Линии «Сейчас смотрят» на главной'],
            ['menu',        'Плавающее меню (TV)',             'Новое оформление меню на TV'],
            ['parser',      'Доп. кнопки Торрента',            'Управление парсерами (jac.red и т.д.)'],
            ['quality',     'Отметка качества',                'Отображение доступного качества 4K/HD/TS'],
            ['rating',      'Рейтинг Кинопоиск',               'Рейтинг с логотипом + TMDB'],
            ['russian',     'Русский контент',                 'Категория «Русское» в меню'],
            ['status',      'Статус контента',                 'Метка статуса: премьера, онгоинг, S/E'],
            ['torrserver',  'TorrServer Free',                 'Авто-подключение к публичным серверам'],
            ['tweaks',      'Очистка интерфейса',              'Скрытие лишних иконок, фильтр контента']
        ];

        MODULE_INFO.forEach(function (m) {
            var key = PREFIX + KEYS[m[0]];
            Lampa.SettingsApi.addParam({
                component: COMPONENT_NAME,
                param: { name: key, type: 'trigger', default: true },
                field: { name: m[1], description: m[2] },
                onChange: function () {}
            });
        });

        Lampa.SettingsApi.addParam({
            component: COMPONENT_NAME,
            param: { name: PREFIX + KEYS.kpApiKey, type: 'input', default: DEFAULT_KP_KEY },
            field: { name: 'Кинопоиск API-ключ', description: 'Ключ с kinopoiskapiunofficial.tech. По умолчанию — публичный.' },
            onChange: function () {}
        });

        Lampa.SettingsApi.addParam({
            component: COMPONENT_NAME,
            param: { name: PREFIX + KEYS.logoCacheMax, type: 'input', default: '500' },
            field: { name: 'Размер кэша логотипов', description: 'Сколько логотипов фильмов кэшировать (100–2000)' },
            onChange: function () {}
        });
    }

    // ============================================================
    //  INIT
    // ============================================================
    function init() {
        injectStyles();
        S.cardBus.init();

        mod_buttons();
        mod_cardMobile();
        mod_cardTV();
        mod_cards();
        mod_dmca();
        mod_labels();
        mod_lines();
        mod_menu();
        mod_parser();
        mod_quality();
        mod_rating();
        mod_russian();
        mod_status();
        mod_torrserver();
        mod_tweaks();

        buildSettings();
    }

    if (window.appready) init();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') init(); });
})();
