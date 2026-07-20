(function() {  
    if (window.kpRating) return;  
    window.kpRating = true;  
    var CACHE_SUCCESS = 15 * 24 * 60 * 60 * 1000;  
    var CACHE_ERROR = 24 * 60 * 60 * 1000;  
    var CACHE_SEARCH = 3 * 60 * 60 * 1000;  
    var API_KEY = '14342b35-714b-449d-bf10-30d0d9ac22e6';  
    var network = new Lampa.Reguest();  
    var ratingCache = Lampa.Storage.cache('kp_rating', 500, {});  
    document.head.insertAdjacentHTML('beforeend', '<style>.card__vote{display:flex!important;align-items:center!important}.card__vote .source--name{width:0.9em;height:1.1em;background-repeat:no-repeat;background-position:center;background-size:contain;margin-left:0.2em;flex-shrink:0;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'white\' d=\'M12.049 0C5.45 0 .104 5.373.104 12S5.45 24 12.049 24c3.928 0 7.414-1.904 9.592-4.844l-9.803-5.174l6.256 6.418h-3.559l-4.373-6.086V20.4h-2.89V3.6h2.89v6.095L14.535 3.6h3.559l-6.422 6.627l9.98-5.368C19.476 1.911 15.984 0 12.05 0zm10.924 7.133l-9.994 4.027l10.917-.713a12 12 0 0 0-.923-3.314m-10.065 5.68l10.065 4.054c.458-1.036.774-2.149.923-3.314z\'/%3E%3C/svg%3E")}</style>');  
    function getCache(id, type) {  
        var key = type === 'search' ? 'search_' + id : id;  
        var item = ratingCache[key];  
        if (!item) return null;  
        var ttl = type === 'search' ? CACHE_SEARCH : item.kp === 0 ? CACHE_ERROR : CACHE_SUCCESS;  
        return (Date.now() - item.timestamp) < ttl ? item : null;  
    }  
    function setCache(id, data, type) {  
        var key = type === 'search' ? 'search_' + id : id;  
        ratingCache[key] = Object.assign({}, data, { timestamp: Date.now() });  
        Lampa.Storage.set('kp_rating', ratingCache);  
    }  
    function showFullRating(kp, tmdb, render) {  
        $('.wait_rating', render).remove();  
        if (kp > 0) $('.rate--kp', render).removeClass('hide').find('> div').eq(0).text(kp.toFixed(1));  
        if (tmdb > 0) $('.rate--tmdb', render).removeClass('hide').find('> div').eq(0).text(tmdb.toFixed(1));  
    }  
    function updateCardVote(card, kp, tmdb) {  
        var el = card.querySelector('.card__vote');  
        if (!el) {  
            el = document.createElement('div');  
            el.className = 'card__vote';  
            var view = card.querySelector('.card__view');  
            if (view) view.appendChild(el);  
        }  
        var rating = kp > 0 ? kp : tmdb;  
        if (rating > 0) {  
            el.innerHTML = '<span style="display:flex;align-items:center">' + rating.toFixed(1) + (kp > 0 ? '<span class="source--name"></span>' : '') + '</span>';  
            el.style.display = '';  
        } else {  
            el.style.display = 'none';  
        }  
    }  
    function fetchFromKpApi(id, card, callback) {  
        var tmdb = card.vote_average || 0;  
        network.silent('https://kinopoiskapiunofficial.tech/api/v2.2/films/' + id,  
            function(data) { var kp = data.ratingKinopoisk || 0; setCache(card.id, { kp: kp, tmdb: tmdb }); callback(kp, tmdb); },  
            function() { setCache(card.id, { kp: 0, tmdb: tmdb }); callback(0, tmdb); },  
            false,  
            { timeout: 3000, headers: { 'X-API-KEY': API_KEY } }  
        );  
    }  
    function getRatingById(id, card, callback) {  
        var tmdb = card.vote_average || 0;  
        network.silent('https://rating.kinopoisk.ru/' + id + '.xml',  
            function(str) {  
                if (str && str.includes('<rating>')) {  
                    try {  
                        var kp = parseFloat($($.parseXML(str)).find('kp_rating').text()) || 0;  
                        if (kp > 0) { setCache(card.id, { kp: kp, tmdb: tmdb }); callback(kp, tmdb); return; }  
                    } catch (e) {}  
                }  
                fetchFromKpApi(id, card, callback);  
            },  
            function() { fetchFromKpApi(id, card, callback); },  
            false,  
            { timeout: 1000, dataType: 'text' }  
        );  
    }  
    function fetchRating(card, callback) {  
        var cached = getCache(card.id);  
        if (cached) { callback(cached.kp, cached.tmdb); return; }  
        var searchCached = getCache(card.id, 'search');  
        if (searchCached) { getRatingById(searchCached.kp_id, card, callback); return; }  
        var year = parseInt((card.release_date || card.first_air_date || '').slice(0, 4)) || null;  
        var title = card.title || card.name;  
        var tmdb = card.vote_average || 0;  
        var processError = function() { setCache(card.id, { kp: 0, tmdb: tmdb }); callback(0, tmdb); };  
        function searchByTitle() {  
            var query = (title || '').toLowerCase().replace(/[^\wа-яё\s]/gi, ' ').replace(/\s+/g, ' ').trim();  
            network.silent('https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=' + encodeURIComponent(query),  
                function(json) {  
                    if (!json.films || !json.films.length) { processError(); return; }  
                    var films = json.films;  
                    var best = null;  
                    if (year) {  
                        best = films.find(function(f) { return parseInt((f.year || '').slice(0, 4)) === year; });  
                        if (!best) best = films.find(function(f) { var y = parseInt((f.year || '').slice(0, 4)); return y && y > year - 3 && y < year + 3; });  
                    }  
                    best = best || films[0];  
                    if (best) { setCache(card.id, { kp_id: best.filmId }, 'search'); getRatingById(best.filmId, card, callback); }  
                    else processError();  
                },  
                processError,  
                false,  
                { timeout: 5000, headers: { 'X-API-KEY': API_KEY } }  
            );  
        }  
        if (card.imdb_id) {  
            network.silent('https://kinopoiskapiunofficial.tech/api/v2.2/films?imdbId=' + encodeURIComponent(card.imdb_id),  
                function(data) {  
                    var firstItem = data.items && data.items[0];  
                    var id = (firstItem && (firstItem.kinopoiskId || firstItem.filmId)) || data.kinopoiskId || data.filmId;  
                    if (id) { setCache(card.id, { kp_id: id }, 'search'); getRatingById(id, card, callback); }  
                    else searchByTitle();  
                },  
                searchByTitle,  
                false,  
                { timeout: 5000, headers: { 'X-API-KEY': API_KEY } }  
            );  
        } else {  
            searchByTitle();  
        }  
    }  
    var intersectionObserver = null;  
    if (typeof IntersectionObserver !== 'undefined') {  
        intersectionObserver = new IntersectionObserver(function(entries) {  
            for (var ei = 0; ei < entries.length; ei++) {  
                var entry = entries[ei];  
                if (!entry.isIntersecting) continue;  
                intersectionObserver.unobserve(entry.target);  
                (function(target) {  
                    fetchRating(target.card_data, function(kp, tmdb) { updateCardVote(target, kp, tmdb); });  
                })(entry.target);  
            }  
        }, { rootMargin: '100px' });  
    }  
    function observeCard(card) {  
        if (!card.card_data || !card.card_data.id || card.dataset.kp) return;  
        var data = card.card_data;  
        if (!data.release_date && !data.first_air_date) return;  
        card.dataset.kp = 'true';  
        if (intersectionObserver) intersectionObserver.observe(card);  
        else fetchRating(data, function(kp, tmdb) { updateCardVote(card, kp, tmdb); });  
    }  
    var cardObserver = new MutationObserver(function(mutations) {  
        for (var mi = 0; mi < mutations.length; mi++) {  
            var addedNodes = mutations[mi].addedNodes;  
            for (var ni = 0; ni < addedNodes.length; ni++) {  
                var node = addedNodes[ni];  
                if (node.nodeType !== 1) continue;  
                if (node.classList && node.classList.contains('card')) observeCard(node);  
                if (node.querySelectorAll) [].forEach.call(node.querySelectorAll('.card'), observeCard);  
            }  
        }  
    });  
    cardObserver.observe(document.body, { childList: true, subtree: true });  
    Lampa.Listener.follow('full', function(e) {  
        if (e.type !== 'complite' || !e.data || !e.data.movie) return;  
        var card = e.data.movie;  
        if (!card.release_date && !card.first_air_date) return;  
        var render = e.object.activity.render();  
        var cached = getCache(card.id);  
        if (cached) { showFullRating(cached.kp, cached.tmdb, render); return; }  
        if ($('.rate--kp', render).hasClass('hide') && !$('.wait_rating', render).length) {  
            $('.info__rate', render).after('<div style="width:2em;margin-top:1em;margin-right:1em" class="wait_rating"><div class="broadcast__scan"><div></div></div></div>');  
            fetchRating(card, function(kp, tmdb) { showFullRating(kp, tmdb, render); });  
        }  
    });  
    Lampa.Listener.follow('app', function(e) {  
        if (e.type === 'destroy') {  
            if (intersectionObserver) intersectionObserver.disconnect();  
            cardObserver.disconnect();  
        }  
    });  
    [].forEach.call(document.querySelectorAll('.card'), observeCard);  
})();
