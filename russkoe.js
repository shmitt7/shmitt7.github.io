(function() {  
    if (window.russianContent) return;  
    window.russianContent = true;  
    var network = new Lampa.Reguest();  
    var pad = function(n) { return (n < 10 ? '0' : '') + n; };  
    var formatDate = function(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };  
    var getDates = function() {  
        var today = new Date();  
        var monthAgo = new Date(today); monthAgo.setMonth(monthAgo.getMonth() - 1);  
        var yearAgo = new Date(today); yearAgo.setFullYear(yearAgo.getFullYear() - 1);  
        return { now: formatDate(today), month: formatDate(monthAgo), year: formatDate(yearAgo) };  
    };  
    var buildUrl = function(q) { return Lampa.TMDB.api(q + '&api_key=' + Lampa.TMDB.key() + '&language=ru'); };  
    var sortByPopularity = function(a, b) { return (b.popularity || 0) - (a.popularity || 0); };  
    var sortByDate = function(a, b) { return (b.release_date || b.first_air_date || '').localeCompare(a.release_date || a.first_air_date || ''); };  
    var buildQueries = function() {  
        var D = getDates();  
        return {  
            nowPlaying: [  
                'discover/movie?with_original_language=ru&with_runtime.gte=71&primary_release_date.gte=' + D.month + '&primary_release_date.lte=' + D.now + '&sort_by=popularity.desc&page=1',  
                'discover/tv?with_original_language=ru&first_air_date.gte=' + D.month + '&first_air_date.lte=' + D.now + '&sort_by=popularity.desc&page=1'  
            ],  
            yearlyPopular: [  
                'discover/movie?with_original_language=ru&with_runtime.gte=71&primary_release_date.gte=' + D.year + '&primary_release_date.lte=' + D.now + '&sort_by=popularity.desc&page=1',  
                'discover/tv?with_original_language=ru&first_air_date.gte=' + D.year + '&first_air_date.lte=' + D.now + '&sort_by=popularity.desc&page=1'  
            ],  
            movies: 'discover/movie?with_original_language=ru&with_runtime.gte=71&without_genres=16,99&primary_release_date.lte=' + D.now + '&sort_by=primary_release_date.desc',  
            series: 'discover/tv?with_original_language=ru&without_genres=16,10764,10767,99&first_air_date.lte=' + D.now + '&sort_by=first_air_date.desc',  
            cartoons: 'discover/movie?with_original_language=ru&with_genres=16&with_runtime.gte=70&primary_release_date.lte=' + D.now + '&sort_by=primary_release_date.desc',  
            cartoonSeries: 'discover/tv?with_original_language=ru&with_genres=16&first_air_date.lte=' + D.now + '&sort_by=first_air_date.desc',  
            reality: 'discover/tv?with_original_language=ru&with_genres=10764&first_air_date.lte=' + D.now + '&sort_by=first_air_date.desc',  
            talkShows: 'discover/tv?with_original_language=ru&with_genres=10767&first_air_date.lte=' + D.now + '&sort_by=first_air_date.desc',  
            documentary: [  
                'discover/movie?with_original_language=ru&with_genres=99&primary_release_date.lte=' + D.now + '&sort_by=primary_release_date.desc&page=1',  
                'discover/tv?with_original_language=ru&with_genres=99&first_air_date.lte=' + D.now + '&sort_by=first_air_date.desc&page=1'  
            ]  
        };  
    };  
    var loadData = function(queries, title, callback, sortFn) {  
        var qs = Array.isArray(queries) ? queries : [queries];  
        var results = [], done = 0;  
        var onDone = function() {  
            if (++done < qs.length) return;  
            if (sortFn) results.sort(sortFn);  
            callback(Lampa.Utils.addSource({ results: results.slice(0, 20), title: title, source: 'tmdb', total_pages: 2, params: { card: { card_small: true } } }, 'tmdb'));  
        };  
        qs.forEach(function(q) { network.silent(buildUrl(q), function(json) { results = results.concat(json.results || []); onDone(); }, onDone, false, { cache: { life: 1440 } }); });  
    };  
    Lampa.Component.add('russian_category', function(params) {  
        var comp = Lampa.Maker.make('Category', params);  
        comp.use({  
            onCreate: function() {  
                var QUERIES = buildQueries();  
                this.activity.loader(true);  
                var sections = [  
                    { queries: QUERIES.nowPlaying, title: 'Новинки', sortFn: sortByPopularity },  
                    { queries: QUERIES.yearlyPopular, title: 'Популярное за год', sortFn: sortByPopularity },  
                    { queries: QUERIES.movies, title: 'Фильмы', sortFn: null },  
                    { queries: QUERIES.series, title: 'Сериалы', sortFn: null },  
                    { queries: QUERIES.cartoons, title: 'Мультфильмы', sortFn: null },  
                    { queries: QUERIES.cartoonSeries, title: 'Мультсериалы', sortFn: null },  
                    { queries: QUERIES.reality, title: 'Реалити-шоу', sortFn: null },  
                    { queries: QUERIES.talkShows, title: 'Ток-шоу', sortFn: null },  
                    { queries: QUERIES.documentary, title: 'Документальное', sortFn: sortByDate }  
                ];  
                var loaded = 0;  
                var allData = [];  
                sections.forEach(function(s, i) {  
                    loadData(s.queries, s.title, function(data) {  
                        allData[i] = data;  
                        if (++loaded < sections.length) return;  
                        this.build(allData.filter(Boolean));  
                        this.activity.loader(false);  
                        this.activity.toggle();  
                    }.bind(this), s.sortFn);  
                }.bind(this));  
            },  
            onInstance: function(card, cardData) {  
                card.use({  
                    onEnter: function() { Lampa.Activity.push({ url: '', title: cardData.title || cardData.name, component: 'full', id: cardData.id, source: 'tmdb', card: cardData }); },  
                    onFocus: function() { Lampa.Background.change(Lampa.Utils.cardImgBackground(cardData)); }  
                });  
            }  
        });  
        return comp;  
    });  
    ['now', 'year', 'documentary'].forEach(function(type) {  
        Lampa.Component.add('russian_' + type + '_full', function(params) {  
            var comp = Lampa.Maker.make('Category', params);  
            var pageCache = {};  
            var loadPage = function(pageNum, callback) {  
                if (pageCache[pageNum]) return callback(pageCache[pageNum]);  
                var QUERIES = buildQueries();  
                var queries = type === 'now' ? QUERIES.nowPlaying : type === 'year' ? QUERIES.yearlyPopular : QUERIES.documentary;  
                var sortFn = type === 'documentary' ? sortByDate : sortByPopularity;  
                var apiPage = Math.ceil(pageNum / 2);  
                var results = [], done = 0;  
                var onDone = function() {  
                    if (++done < queries.length) return;  
                    var data = { results: results.sort(sortFn), total_pages: 500, source: 'tmdb' };  
                    pageCache[pageNum] = data;  
                    callback(data);  
                };  
                [0, 1].forEach(function(i) { network.silent(buildUrl(queries[i].replace(/page=1/, 'page=' + apiPage)), function(json) { results = results.concat(json.results || []); onDone(); }, onDone, false, { cache: { life: 1440 } }); });  
            };  
            comp.use({  
                onCreate: function() {  
                    this.activity.loader(true);  
                    loadPage(params.page || 1, function(data) { this.build(data); this.render().find('.category-full').addClass('cols--6'); this.activity.loader(false); this.activity.toggle(); }.bind(this));  
                },  
                onNext: function(resolve) {  
                    params.page = (params.page || 1) + 1;  
                    loadPage(params.page, resolve);  
                },  
                onInstance: function(card, cardData) {  
                    card.use({  
                        onEnter: function() { Lampa.Router.call('full', cardData); },  
                        onFocus: function() { Lampa.Background.change(Lampa.Utils.cardImgBackground(cardData)); }  
                    });  
                }  
            });  
            return comp;  
        });  
    });  
    var SVG_MENU = '<svg width="36" height="36" viewBox="0 0 35 35"><path d="M7.486,33.076a3.164,3.164,0,0,1-3.164-3.165V5.089A3.164,3.164,0,0,1,9.249,2.461L27.754,14.872a3.165,3.165,0,0,1,0,5.256L9.249,32.539h0A3.156,3.156,0,0,1,7.486,33.076ZM8.552,31.5h0ZM7.491,4.422a.7.7,0,0,0-.317.08.652.652,0,0,0-.352.587V29.911a.664.664,0,0,0,1.034.552L26.362,18.052a.66.66,0,0,0,.294-.553.646.646,0,0,0-.294-.55L7.856,4.537A.649.649,0,0,0,7.491,4.422Z" fill="currentColor"/></svg>';  
    var addMenu = function() { Lampa.Menu.addButton(SVG_MENU, 'Русское', function() { Lampa.Activity.push({ url: '', title: 'Русский контент', component: 'russian_category', page: 1 }); }); };  
    if (window.appready) addMenu();  
    else Lampa.Listener.follow('app', function(e) { if (e.type === 'ready') addMenu(); });  
})();
