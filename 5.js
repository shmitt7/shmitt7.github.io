(function() {
    'use strict';
    if (window.fscPlugin) return;
    window.fscPlugin = true;
    let logoCache = {};
    let logoCacheSize = 0;
    function escapeHtml(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function formatTitle(text) {
        if (!text || text.length <= 30) return null;
        const patterns = [{sep: ': ', keep: 1}, {sep: ' - ', keep: 2}, {sep: ' \u2013', keep: 2}, {sep: ' \u2014', keep: 2}];
        for (let pi = 0; pi < patterns.length; pi++) {
            const sep = patterns[pi].sep;
            const keep = patterns[pi].keep;
            const idx = text.indexOf(sep);
            if (idx > 2 && idx + sep.length < text.length - 2) {
                const part1 = text.slice(0, idx + keep);
                const part2 = text.slice(idx + keep).replace(/^\s+/, '');
                if (part2.length >= 3) return escapeHtml(part1) + '<br>' + escapeHtml(part2);
            }
        }
        return null;
    }
    function getGenreLabels(movie, max) {
        const isTv = !!movie.name;
        const genres = movie.genres || [];
        const ids = genres.map(function(g) { return typeof g === 'object' ? g.id : g; });
        let priority = null;
        if (ids.indexOf(16) !== -1 && movie.original_language === 'ja') priority = 'Аниме';
        else if (ids.indexOf(10763) !== -1) priority = 'Новости';
        else if (ids.indexOf(10767) !== -1) priority = 'Ток-шоу';
        else if (ids.indexOf(10764) !== -1) priority = 'Реалити-шоу';
        else if (ids.indexOf(99) !== -1) priority = 'Документальный';
        else if (ids.indexOf(10766) !== -1) priority = 'Мыльная опера';
        else if (ids.indexOf(16) !== -1) priority = isTv ? 'Мультсериал' : 'Мультфильм';
        const result = [];
        if (priority) result.push(priority);
        for (let i = 0; i < genres.length && result.length < (max || 2); i++) {
            const g = genres[i];
            if (!g) continue;
            const gId = typeof g === 'object' ? g.id : g;
            if ((priority === 'Аниме' || priority === 'Мультсериал' || priority === 'Мультфильм') && gId === 16) continue;
            const name = Lampa.Utils.capitalizeFirstLetter(g.name);
            if (name && result.indexOf(name) === -1) result.push(name);
        }
        return result;
    }
    function init() {
        const style = document.createElement('style');
        style.textContent = [
            'body.fsc--open .full-start__background{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:0!important;object-fit:cover!important;mask-image:none!important;-webkit-mask-image:none!important;pointer-events:none!important;filter:none!important;opacity:0;transition:opacity 0.5s ease-in-out;}',
            'body.fsc--open .full-start__background.loaded{opacity:0.8!important;}',
            'body.fsc--open .full-start__background.dim{opacity:0!important;transition:opacity 0s!important;}',
            'body.fsc--open:not(.fsc--scrolled) .background{opacity:0!important;transition:none!important;}',
            'body.fsc--open.fsc--scrolled .background{opacity:1!important;transition:opacity 0.4s!important;}',
            'body.fsc--open:not(.fsc--scrolled) .head{background:transparent!important;}',
            'body.fsc--open .full-start-new{position:relative!important;overflow:visible!important;}',
            'body.fsc--open .full-start-new__body{min-height:calc(100vh - 6em)!important;align-items:stretch!important;justify-content:center!important;overflow:visible!important;}',
            'body.fsc--open .full-start-new__right{display:flex!important;flex-direction:column!important;min-height:calc(100vh - 6em)!important;justify-content:flex-end!important;align-items:center!important;text-align:center!important;padding-bottom:0.8em!important;overflow:visible!important;}',
            'body.fsc--open .full-start-new__left{display:none!important;}',
            'body.fsc--open .full-start-new__right>*:not(.fsc-main):not(.fsc-poster-fallback){display:none!important;}',
            'body.fsc--open.fsc--scrolled .full-start-new__buttons{display:none!important;}',
            'body.fsc--open .full-start-new__title{font-size:2.2em!important;font-weight:700!important;line-height:1.15!important;margin:0 0 0.15em!important;display:block!important;overflow:hidden!important;white-space:nowrap!important;text-overflow:ellipsis!important;-webkit-line-clamp:unset!important;line-clamp:unset!important;}',
            'body.fsc--open .full-start-new__title.fsc-title-split{white-space:normal!important;text-overflow:clip!important;display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:2!important;line-clamp:2!important;}',
            '.fsc-logo{max-width:18em!important;max-height:5em!important;object-fit:contain!important;}',
            '.fsc-center-row{display:flex!important;flex-wrap:wrap!important;align-items:center!important;justify-content:center!important;gap:0.35em!important;margin-bottom:0.2em!important;}',
            '.fsc-serial-badge{display:inline-flex!important;align-items:center!important;height:1.5em!important;padding:0 0.5em!important;background:rgba(0,0,0,0.65)!important;color:#fff!important;font-size:1.25em!important;font-weight:550!important;border-radius:0.35em!important;white-space:nowrap!important;box-sizing:border-box!important;border:1px solid rgba(255,255,255,0.2)!important;margin:0!important;text-shadow:0 1px 4px rgba(0,0,0,0.8)!important;}',
            '.fsc-poster-fallback{max-width:12em!important;max-height:18em!important;object-fit:contain!important;border-radius:0.5em!important;margin-bottom:0.5em!important;box-shadow:0 4px 24px rgba(0,0,0,0.7)!important;}',
            '.fsc-react-icon{width:1em!important;height:1em!important;flex-shrink:0!important;}'
        ].join('');
        document.head.appendChild(style);
        let currentToken = null;
        let currentFullComp = null;
        Lampa.Listener.follow('full', function(e) {
            if (e.type !== 'complite') return;
            const token = {};
            currentToken = token;
            const fullComp = e.object.activity.component;
            const render = $(fullComp.render());
            const right = render.find('.full-start-new__right');
            const buttons = render.find('.full-start-new__buttons');
            const movie = e.data.movie;
            setTimeout(function() {
                if (currentToken !== token) return;
                const tmdbRating = movie.vote_average || 0;
                const year = (movie.release_date || movie.first_air_date || '').slice(0, 4);
                const countries = movie.production_countries || [];
                const country = countries.length ? countries[0].iso_3166_1 : '';
                const infoParts = [];
                if (year) infoParts.push(year);
                if (country) infoParts.push(country);
                if (movie.content_ratings && movie.content_ratings.results) {
                    const ruR = movie.content_ratings.results.find(function(r) { return r.iso_3166_1 === 'RU'; });
                    const cr = ruR || movie.content_ratings.results[0];
                    if (cr && cr.rating) infoParts.push(cr.rating);
                } else if (movie.release_dates && movie.release_dates.results) {
                    const ruD = movie.release_dates.results.find(function(r) { return r.iso_3166_1 === 'RU'; });
                    const dr = ruD || movie.release_dates.results[0];
                    if (dr && dr.release_dates && dr.release_dates[0] && dr.release_dates[0].certification) {
                        const cert = dr.release_dates[0].certification;
                        if (cert) infoParts.push(cert + '+');
                    }
                }
                getGenreLabels(movie, 2).forEach(function(g) { infoParts.push(g); });
                let reactionsHtml = null;
                const rd = e.data && e.data.reactions;
                if (rd && rd.result && rd.result.length
                    && Lampa.Storage.field('card_interfice_reactions')
                    && !(window.lampa_settings && window.lampa_settings.disable_features && window.lampa_settings.disable_features.reactions)) {
                    const map = {};
                    rd.result.forEach(function(r) { map[r.type] = r.counter || 0; });
                    const think = map['think'] || 0;
                    const thinkPos = Math.floor(think / 2);
                    const pos = (map['fire'] || 0) + (map['nice'] || 0) + thinkPos;
                    const neg = (map['bore'] || 0) + (map['shit'] || 0) + (think - thinkPos);
                    if (pos || neg) {
                        const posStyle = pos > neg ? 'color:#6fcf6f' : 'color:#fff';
                        const negStyle = neg > pos ? 'color:#e05555' : 'color:#fff';
                        const base = (Lampa.Utils.protocol ? Lampa.Utils.protocol() : 'https://') + ((Lampa.Manifest && Lampa.Manifest.cub_domain) || 'cub.red') + '/img/reactions/';
                        reactionsHtml = '<span> \u2022 <span style="display:inline-flex;align-items:center;gap:0.2em;' + posStyle + '"><img class="fsc-react-icon" src="' + base + 'fire.svg">' + Lampa.Utils.bigNumberToShort(pos) + '</span><span style="color:#fff;margin:0 0.2em">/</span><span style="display:inline-flex;align-items:center;gap:0.2em;' + negStyle + '"><img class="fsc-react-icon" src="' + base + 'shit.svg">' + Lampa.Utils.bigNumberToShort(neg) + '</span></span>';
                    }
                }
                let currentKP = 0;
                let currentQuality = '';
                const infoEl = $('<span class="fsc-serial-badge"></span>');
                function rebuildInfo() {
                    const parts = infoParts.slice();
                    if (currentKP > 0) parts.push(currentKP.toFixed(1) + ' KP');
                    else if (tmdbRating > 0) parts.push(tmdbRating.toFixed(1) + ' TMDB');
                    if (currentQuality) parts.push(currentQuality);
                    infoEl.text(parts.join(' \u2022 '));
                    if (reactionsHtml) infoEl.append($(reactionsHtml));
                }
                let kpAttempts = 0;
                function checkKP() {
                    const kpEl = render.find('.full-start__rate.rate--kp').not('.hide');
                    if (kpEl.length) {
                        const kpVal = parseFloat(kpEl.find('div').first().text());
                        if (kpVal > 0 && kpVal !== currentKP) { currentKP = kpVal; rebuildInfo(); return; }
                    }
                    if (++kpAttempts < 12) setTimeout(checkKP, 500);
                }
                let qualAttempts = 0;
                function checkQual() {
                    const qualEl = render.find('.full-start__status').not('.hide');
                    if (qualEl.length) {
                        const qualText = qualEl.text().trim();
                        if (qualText && qualText !== currentQuality) { currentQuality = qualText; rebuildInfo(); return; }
                    }
                    if (++qualAttempts < 30) setTimeout(checkQual, 500);
                }
                rebuildInfo();
                checkKP();
                checkQual();
                let serialEl = null;
                if (movie.first_air_date) {
                    const tvStatus = movie.status || '';
                    const totalSeasons = movie.number_of_seasons || 0;
                    const totalEpisodes = movie.number_of_episodes || 0;
                    const currentSeason = movie.seasons ? movie.seasons.filter(function(s) { return s.episode_count > 0 && s.season_number > 0; }).length : 0;
                    const airedTotal = movie.seasons ? movie.seasons.reduce(function(acc, s) { return s.season_number > 0 ? acc + (s.episode_count || 0) : acc; }, 0) : 0;
                    let hasNextEpisode = false;
                    let nextEpisodeText = '';
                    const nextEpisode = movie.next_episode_to_air;
                    if (nextEpisode && nextEpisode.air_date) {
                        const daysLeft = Math.ceil((Lampa.Utils.parseToDate(nextEpisode.air_date).getTime() - Date.now()) / 86400000);
                        if (daysLeft > 0) {
                            hasNextEpisode = true;
                            nextEpisodeText = Lampa.Lang.translate('full_next_episode') + ': ' + Lampa.Utils.parseTime(nextEpisode.air_date).short + ' / ' + Lampa.Lang.translate('full_episode_days_left') + ': ' + daysLeft;
                        }
                    }
                    const serialParts = [];
                    if (tvStatus && !(tvStatus === 'Returning Series' && hasNextEpisode))
                        serialParts.push(Lampa.Lang.translate('tv_status_' + tvStatus.toLowerCase().replace(/ /g, '_')));
                    if (totalSeasons > 0)
                        serialParts.push(Lampa.Lang.translate('title_seasons') + ': ' + (currentSeason < totalSeasons ? currentSeason + '/' + totalSeasons : totalSeasons));
                    if (totalEpisodes > 0)
                        serialParts.push(Lampa.Lang.translate('title_episodes') + ': ' + (airedTotal > 0 && airedTotal < totalEpisodes ? airedTotal + '/' + totalEpisodes : totalEpisodes));
                    if (hasNextEpisode) serialParts.push(nextEpisodeText);
                    if (serialParts.length) serialEl = $('<span class="fsc-serial-badge"></span>').text(serialParts.join(' \u2022 '));
                }
                let movieStatusEl = null;
                if (!movie.first_air_date) {
                    const movieStatus = movie.status || '';
                    if (movieStatus && movieStatus.toLowerCase() !== 'released') {
                        const movieParts = [Lampa.Lang.translate('tv_status_' + movieStatus.toLowerCase().replace(/ /g, '_'))];
                        if (movie.release_date) movieParts.push(Lampa.Utils.parseTime(movie.release_date).short);
                        movieStatusEl = $('<span class="fsc-serial-badge"></span>').text(movieParts.join(' \u2022 '));
                    }
                }
                const main = $('<div class="fsc-main"></div>');
                const title = render.find('.full-start-new__title');
                main.append(title);
                if (movie.first_air_date && serialEl)
                    main.append($('<div class="fsc-center-row"></div>').append(serialEl));
                else if (!movie.first_air_date && movieStatusEl)
                    main.append($('<div class="fsc-center-row"></div>').append(movieStatusEl));
                main.append($('<div class="fsc-center-row"></div>').append(infoEl));
                main.append(buttons);
                right.find('.fsc-main').remove();
                right.append(main);
                right.find('.fsc-poster-fallback').remove();
                if (!movie.backdrop_path && movie.poster_path)
                    right.prepend($('<img class="fsc-poster-fallback">').attr('src', Lampa.TMDB.image('t/p/original' + movie.poster_path)));
                if (movie.id) {
                    const rawHtml = title.html();
                    const titleText = title.text().trim();
                    const formatted = formatTitle(titleText);
                    const origHtml = formatted !== null ? formatted : rawHtml;
                    if (formatted !== null) { title.html(origHtml); title.addClass('fsc-title-split'); }
                    else title.removeClass('fsc-title-split');
                    const mediaType = movie.name ? 'tv' : 'movie';
                    const cacheKey = mediaType + '_' + movie.id;
                    const applyLogo = function(src) {
                        const img = document.createElement('img');
                        img.className = 'fsc-logo';
                        img.onerror = function() {
                            title.html(origHtml);
                            if (formatted !== null) title.addClass('fsc-title-split');
                            else title.removeClass('fsc-title-split');
                        };
                        img.src = src;
                        title.empty().append(img);
                        title.removeClass('fsc-title-split');
                    };
                    if (cacheKey in logoCache) {
                        if (logoCache[cacheKey]) applyLogo(logoCache[cacheKey]);
                    } else {
                        $.get(
                            Lampa.TMDB.api(mediaType + '/' + movie.id + '/images?api_key=' + Lampa.TMDB.key() + '&language=ru&include_image_language=ru'),
                            function(data) {
                                if (currentToken !== token) return;
                                const logos = (data.logos || []).filter(function(l) { return l.file_path && !l.file_path.endsWith('.svg') && l.iso_639_1 === 'ru'; });
                                logos.sort(function(a, b) { return b.vote_average - a.vote_average; });
                                if (logoCacheSize > 200) { logoCache = {}; logoCacheSize = 0; }
                                logoCache[cacheKey] = logos.length ? Lampa.TMDB.image('t/p/original' + logos[0].file_path) : null;
                                logoCacheSize++;
                                if (logoCache[cacheKey]) applyLogo(logoCache[cacheKey]);
                            }
                        );
                    }
                }
                if (fullComp.scroll && !fullComp.scroll._fscWrapped) {
                    fullComp.scroll._fscWrapped = true;
                    const origOnScroll = fullComp.scroll.onScroll;
                    fullComp.scroll.onScroll = function(pos) {
                        if (origOnScroll) origOnScroll(pos);
                        $('body').toggleClass('fsc--scrolled', pos > 30);
                    };
                }
            }, 0);
        });
        Lampa.Listener.follow('activity', function(e) {
            if (e.type === 'archive' && e.component === 'full') {
                $('body').addClass('fsc--open').removeClass('fsc--scrolled');
                if (!Lampa.Storage.field('card_interfice_cover')) $('body').removeClass('card--no-cover');
                currentFullComp = e.object.activity.component;
            }
            if (e.type === 'destroy' && e.component === 'full') {
                const destroyedComp = e.object && e.object.activity && e.object.activity.component;
                if (destroyedComp && destroyedComp.scroll) destroyedComp.scroll._fscWrapped = false;
                if (destroyedComp === currentFullComp) {
                    currentToken = null;
                    currentFullComp = null;
                    $('body').removeClass('fsc--open fsc--scrolled');
                    if (!Lampa.Storage.field('card_interfice_cover')) $('body').addClass('card--no-cover');
                }
            }
        });
    }
    if (window.appready) init();
    else Lampa.Listener.follow('app', function(e) { if (e.type === 'ready') init(); });
})();
