(function() {
    'use strict';
    if (window.fscPlugin) return;
    window.fscPlugin = true;
    let logoCache = {};
    function formatTitle(text) {
        if (!text || text.length <= 30) return null;
        const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        for (const {sep, keep} of [{sep:': ',keep:1},{sep:' - ',keep:2},{sep:' \u2013 ',keep:2},{sep:' \u2014 ',keep:2}]) {
            const idx = text.indexOf(sep);
            if (idx > 2 && idx + sep.length < text.length - 2) {
                const part2 = text.slice(idx + keep).replace(/^\s+/,'');
                if (part2.length >= 3) return esc(text.slice(0, idx + keep)) + '<br>' + esc(part2);
            }
        }
        return null;
    }
    function getGenreLabels(movie, max) {
        const isTv = !!movie.name;
        const genres = movie.genres || [];
        const ids = genres.map(g => g?.id ?? g);
        let priority = null;
        if (ids.includes(16) && movie.original_language === 'ja') priority = 'Аниме';
        else if (ids.includes(10763)) priority = 'Новости';
        else if (ids.includes(10767)) priority = 'Ток-шоу';
        else if (ids.includes(10764)) priority = 'Реалити-шоу';
        else if (ids.includes(99)) priority = 'Документальный';
        else if (ids.includes(10766)) priority = 'Мыльная опера';
        else if (ids.includes(16)) priority = isTv ? 'Мультсериал' : 'Мультфильм';
        const result = priority ? [priority] : [];
        for (const g of genres) {
            if (result.length >= (max || 2)) break;
            if (!g) continue;
            const gId = g?.id ?? g;
            if ((priority === 'Аниме' || priority === 'Мультсериал' || priority === 'Мультфильм') && gId === 16) continue;
            const name = Lampa.Utils.capitalizeFirstLetter(g.name);
            if (name && !result.includes(name)) result.push(name);
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
            '.fsc-main{display:flex!important;flex-direction:column!important;align-items:center!important;text-align:center!important;margin-bottom:0.2em!important;width:100%!important;}',
            'body.fsc--open .full-start-new__title{text-align:center!important;max-width:100%!important;text-shadow:0 2px 12px rgba(0,0,0,0.95)!important;margin-bottom:0.15em!important;display:block!important;overflow:hidden!important;white-space:nowrap!important;text-overflow:ellipsis!important;-webkit-line-clamp:unset!important;line-clamp:unset!important;}',
            'body.fsc--open .full-start-new__title.fsc-title-split{white-space:normal!important;text-overflow:clip!important;display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:2!important;line-clamp:2!important;}',
            '.fsc-logo{max-width:18em!important;max-height:5em!important;object-fit:contain!important;}',
            '.fsc-center-row{display:flex!important;flex-wrap:wrap!important;align-items:center!important;justify-content:center!important;gap:0.35em!important;margin-bottom:0.2em!important;}',
            '.fsc-serial-badge{display:inline-flex!important;align-items:center!important;height:1.5em!important;padding:0 0.5em!important;background:rgba(0,0,0,0.65)!important;color:#fff!important;font-size:1.25em!important;font-weight:550!important;border-radius:0.35em!important;white-space:nowrap!important;box-sizing:border-box!important;border:1px solid rgba(255,255,255,0.2)!important;margin:0!important;text-shadow:none!important;}',
            '.fsc-poster-fallback{flex:1 1 0!important;min-height:0!important;max-width:60%!important;object-fit:cover!important;object-position:center top!important;margin-bottom:0.5em!important;border-radius:1em!important;}',
            'body.fsc--open .full-start-new__buttons .full-start-new__reactions{display:flex!important;flex-wrap:nowrap!important;margin:0!important;min-height:0!important;flex-shrink:0!important;align-items:center!important;margin-left:0.5em!important;}',
            'body.fsc--open .full-start-new__buttons .full-start-new__reactions>div{padding:0!important;}',
            'body.fsc--open .full-start-new__buttons .full-start-new__reactions>div:not(:first-child){display:none!important;}',
            'body.fsc--open .full-start-new__buttons .full-start-new__reactions .reaction{position:relative!important;}',
            'body.fsc--open .full-start-new__buttons .full-start-new__reactions .reaction__count{position:absolute!important;top:28%!important;left:95%!important;font-size:1.2em!important;font-weight:500!important;}',
            'body.fsc--open .full-start-new__buttons .button--reaction{display:none!important;}'
        ].join('');
        document.head.appendChild(style);
        let currentToken = null;
        let currentFullComp = null;
        const openFsc = () => {
            $('body').addClass('fsc--open').removeClass('fsc--scrolled');
            if (!Lampa.Storage.field('card_interfice_cover')) $('body').removeClass('card--no-cover');
        };
        Lampa.Listener.follow('full', (e) => {
            if (e.type !== 'complite') return;
            const fullComp = e.link;
            const token = {};
            currentToken = token;
            currentFullComp = fullComp;
            openFsc();
            setTimeout(() => {
                if (currentToken !== token) return;
                const render = fullComp.render();
                const movie = e.data.movie;
                if (!movie) return;
                const right = render.find('.full-start-new__right');
                const title = render.find('.full-start-new__title');
                const buttons = render.find('.full-start-new__buttons');
                const reactionsEl = render.find('.full-start-new__reactions');
                const relDate = movie.release_date || movie.first_air_date || '';
                const year = relDate ? relDate.slice(0, 4) : '';
                const runtimeMin = movie.first_air_date ? (movie.episode_run_time || [])[0] : movie.runtime;
                const runtime = runtimeMin > 0 ? Lampa.Utils.secondsToTimeHuman(runtimeMin * 60) : '';
                const countries = (movie.production_countries || []).slice(0, 2).map(c => {
                    const k = 'country_' + (c.iso_3166_1 || '').toLowerCase();
                    const t = Lampa.Lang.translate(k);
                    return (t && t !== k) ? t : (c.iso_3166_1 || '');
                }).filter(Boolean);
                const genreLabels = getGenreLabels(movie, 2);
                const tmdbRating = movie.vote_average ? parseFloat(movie.vote_average) : 0;
                const pg = render.find('.full-start__pg').not('.hide').text().trim();
                const infoParts = [];
                if (year) infoParts.push(year);
                if (runtime) infoParts.push(runtime);
                if (countries.length) infoParts.push(countries.join(', '));
                if (genreLabels.length) infoParts.push(genreLabels.join(', '));
                if (pg) infoParts.push(pg);
                const kpRating = movie.kp_rating || movie.kinopoisk_rating;
                if (kpRating) infoParts.push(parseFloat(kpRating).toFixed(1) + ' KP');
                if (tmdbRating > 0) infoParts.push(tmdbRating.toFixed(1) + ' TMDB');
                const quality = movie.release_quality || movie.quality;
                if (quality) infoParts.push(quality);
                const infoEl = $('<span class="fsc-serial-badge"></span>').text(infoParts.join(' \u2022 '));
                let movieStatusEl = null;
                if (movie.first_air_date) {
                    const user = movie.user || {};
                    const currentSeason = user.season || 1;
                    const currentEpisode = user.episode || 1;
                    const totalSeasons = movie.number_of_seasons || 0;
                    const totalEpisodes = movie.number_of_episodes || 0;
                    let airedTotal = 0;
                    const lastEpisode = movie.last_episode_to_air;
                    if (movie.seasons && lastEpisode) {
                        for (const season of movie.seasons) {
                            if (season.season_number > 0 && season.season_number < currentSeason)
                                airedTotal += season.episode_count || 0;
                        }
                        airedTotal += currentEpisode;
                    }
                    const tvStatus = movie.status || '';
                    let hasNextEpisode = false;
                    let nextEpisodeText = '';
                    const nextEpisode = movie.next_episode_to_air;
                    if (nextEpisode && nextEpisode.air_date) {
                        const daysLeft = Math.ceil((Lampa.Utils.parseToDate(nextEpisode.air_date).getTime() - Date.now()) / 86400000);
                        if (daysLeft > 0) {
                            hasNextEpisode = true;
                            nextEpisodeText = Lampa.Lang.translate('full_next_episode') + ': '
                                + Lampa.Utils.parseTime(nextEpisode.air_date).short + ' / '
                                + Lampa.Lang.translate('full_episode_days_left') + ': ' + daysLeft;
                        }
                    }
                    const serialParts = [];
                    if (tvStatus && !(tvStatus === 'Returning Series' && hasNextEpisode))
                        serialParts.push(Lampa.Lang.translate('tv_status_' + tvStatus.toLowerCase().replace(/ /g,'_')));
                    if (totalSeasons > 0)
                        serialParts.push(Lampa.Lang.translate('title_seasons') + ': ' + (airedTotal > 0 ? airedTotal + '/' : '') + totalSeasons);
                    if (totalEpisodes > 0)
                        serialParts.push(Lampa.Lang.translate('title_episodes') + ': ' + totalEpisodes);
                    if (hasNextEpisode) serialParts.push(nextEpisodeText);
                    if (serialParts.length) movieStatusEl = $('<span class="fsc-serial-badge"></span>').text(serialParts.join(' \u2022 '));
                }
                const main = $('<div class="fsc-main"></div>');
                main.append(title);
                if (movieStatusEl) main.append($('<div class="fsc-center-row"></div>').append(movieStatusEl));
                main.append($('<div class="fsc-center-row"></div>').append(infoEl));
                main.append(buttons);
                if (reactionsEl.length) buttons.append(reactionsEl);
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
                    const applyLogo = (src) => {
                        const img = document.createElement('img');
                        img.className = 'fsc-logo';
                        img.onerror = () => {
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
                            (data) => {
                                if (currentToken !== token) return;
                                const logos = (data.logos || []).filter(l => l.file_path && !l.file_path.endsWith('.svg') && l.iso_639_1 === 'ru');
                                logos.sort((a, b) => b.vote_average - a.vote_average);
                                if (Object.keys(logoCache).length > 200) logoCache = {};
                                logoCache[cacheKey] = logos.length ? Lampa.TMDB.image('t/p/original' + logos[0].file_path) : null;
                                if (logoCache[cacheKey]) applyLogo(logoCache[cacheKey]);
                            }
                        );
                    }
                }
                if (fullComp.scroll && !fullComp.scroll._fscWrapped) {
                    fullComp.scroll._fscWrapped = true;
                    const origOnScroll = fullComp.scroll.onScroll;
                    fullComp.scroll.onScroll = (pos) => {
                        if (origOnScroll) origOnScroll(pos);
                        $('body').toggleClass('fsc--scrolled', pos > 30);
                    };
                }
            }, 0);
        });
        Lampa.Listener.follow('activity', (e) => {
            if (e.type === 'archive' && e.component === 'full') {
                openFsc();
                currentFullComp = e.object.activity.component;
            }
            if (e.type === 'destroy' && e.component === 'full') {
                const destroyedComp = e.object?.activity?.component;
                if (destroyedComp?.scroll) destroyedComp.scroll._fscWrapped = false;
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
    else Lampa.Listener.follow('app', (e) => { if (e.type === 'ready') init(); });
})();
