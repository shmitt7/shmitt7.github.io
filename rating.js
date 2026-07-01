(function() {  
    if (window.kpRating) return;  
    window.kpRating = true;  
    var CACHE_SUCCESS = 15 * 24 * 60 * 60 * 1000;  
    var CACHE_ERROR = 24 * 60 * 60 * 1000;  
    var CACHE_SEARCH = 3 * 60 * 60 * 1000;  
    var API_KEY = '14342b35-714b-449d-bf10-30d0d9ac22e6';  
    var network = new Lampa.Reguest();  
    var ratingCache = Lampa.Storage.cache('kp_rating', 500, {});  
    document.head.insertAdjacentHTML('beforeend', '<style>.card__vote{display:flex!important;align-items:center!important}.card__vote .source--name{font-size:0;color:transparent;width:12px;height:12px;background-repeat:no-repeat;background-position:center;background-size:contain;margin-left:2px;flex-shrink:0;background-image:url("data:image/svg+xml,%3Csvg width=\'300\' height=\'300\' viewBox=\'0 0 300 300\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cmask id=\'mask0_1_69\' style=\'mask-type:alpha\' maskUnits=\'userSpaceOnUse\' x=\'0\' y=\'0\' width=\'300\' height=\'300\'%3E%3Ccircle cx=\'150\' cy=\'150\' r=\'150\' fill=\'white\'/%3E%3C/mask%3E%3Cg mask=\'url(%23mask0_1_69)\'%3E%3Ccircle cx=\'150\' cy=\'150\' r=\'150\' fill=\'black\'/%3E%3Cpath d=\'M300 45L145.26 127.827L225.9 45H181.2L126.3 121.203V45H89.9999V255H126.3V178.92L181.2 255H225.9L147.354 174.777L300 255V216L160.776 160.146L300 169.5V130.5L161.658 139.494L300 84V45Z\' fill=\'url(%23paint0_radial_1_69)\'/%3E%3C/g%3E%3Cdefs%3E%3CradialGradient id=\'paint0_radial_1_69\' cx=\'0\' cy=\'0\' r=\'1\' gradientUnits=\'userSpaceOnUse\' gradientTransform=\'translate(89.9999 45) rotate(45) scale(296.985)\'%3E%3Cstop offset=\'0.5\' stop-color=\'%23FF5500\'/%3E%3Cstop offset=\'1\' stop-color=\'%23BBFF00\'/%3E%3C/radialGradient%3E%3C/defs%3E%3C/svg%3E")}@media(min-width:481px){.card__vote .source--name{width:14px;height:14px;margin-left:3px}}</style>');  
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
        network.timeout(3000);  
        network.silent('https://kinopoiskapiunofficial.tech/api/v2.2/films/' + id,  
            function(data) { var kp = data.ratingKinopoisk || 0; setCache(card.id, { kp: kp, tmdb: tmdb }); callback(kp, tmdb); },  
            function() { setCache(card.id, { kp: 0, tmdb: tmdb }); callback(0, tmdb); },  
            false,  
            { headers: { 'X-API-KEY': API_KEY } }  
        );  
    }  
    function getRatingById(id, card, callback) {  
        var tmdb = card.vote_average || 0;  
        network.timeout(1000);  
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
            { dataType: 'text' }  
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
            network.timeout(5000);  
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
                { headers: { 'X-API-KEY': API_KEY } }  
            );  
        }  
        if (card.imdb_id) {  
            network.timeout(5000);  
            network.silent('https://kinopoiskapiunofficial.tech/api/v2.2/films?imdbId=' + encodeURIComponent(card.imdb_id),  
                function(data) {  
                    var firstItem = data.items && data.items[0];  
                    var id = (firstItem && (firstItem.kinopoiskId || firstItem.filmId)) || data.kinopoiskId || data.filmId;  
                    if (id) { setCache(card.id, { kp_id: id }, 'search'); getRatingById(id, card, callback); }  
                    else searchByTitle();  
                },  
                searchByTitle,  
                false,  
                { headers: { 'X-API-KEY': API_KEY } }  
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
