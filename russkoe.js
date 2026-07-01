(function() {  
    if (window.russianContent) return;  
    window.russianContent = true;  
    var network = new Lampa.Reguest();  
    var pad = function(n) { return (n < 10 ? '0' : '') + n; };  
    var formatDate = function(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };  
    var today = new Date();  
    var monthAgo = new Date(today); monthAgo.setMonth(monthAgo.getMonth() - 1);  
    var yearAgo = new Date(today); yearAgo.setFullYear(yearAgo.getFullYear() - 1);  
    var dates = { now: formatDate(today), month: formatDate(monthAgo), year: formatDate(yearAgo) };  
    var buildUrl = function(q) { return Lampa.TMDB.api(q + '&api_key=' + Lampa.TMDB.key() + '&language=ru'); };  
    var sortByPopularity = function(a, b) { return (b.popularity || 0) - (a.popularity || 0); };  
    var sortByDate = function(a, b) { return (b.release_date || b.first_air_date || '').localeCompare(a.release_date || a.first_air_date || ''); };  
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
    Lampa.Component.add('russian_category', function(params) {  
        var comp = Lampa.Maker.make('Main', params);  
        var sections = [  
            function(cb) { loadData(QUERIES.nowPlaying, 'Сейчас смотрят', cb, sortByPopularity); },  
            function(cb) { loadData(QUERIES.yearlyPopular, 'Популярное за год', cb, sortByPopularity); },  
            function(cb) { loadData(QUERIES.movies, 'Русские фильмы', cb, sortByDate); },  
            function(cb) { loadData(QUERIES.series, 'Русские сериалы', cb, sortByDate); },  
            function(cb) { loadData(QUERIES.cartoons, 'Русские мультфильмы', cb, sortByDate); },  
            function(cb) { loadData(QUERIES.cartoonSeries, 'Русские мультсериалы', cb, sortByDate); },  
            function(cb) { loadData(QUERIES.reality, 'Русские реалити-шоу', cb, sortByDate); },  
            function(cb) { loadData(QUERIES.talkShows, 'Русские ток-шоу', cb, sortByDate); },  
            function(cb) { loadData(QUERIES.documentary, 'Русские документальные', cb, sortByDate); }  
        ];  
        var routes = {  
            'Сейчас смотрят': { component: 'russian_now_full', url: '' },  
            'Популярное за год': { component: 'russian_year_full', url: '' },  
            'Русские фильмы': { component: 'category_full', url: QUERIES.movies },  
            'Русские сериалы': { component: 'category_full', url: QUERIES.series },  
            'Русские мультфильмы': { component: 'category_full', url: QUERIES.cartoons },  
            'Русские мультсериалы': { component: 'category_full', url: QUERIES.cartoonSeries },  
            'Русские реалити-шоу': { component: 'category_full', url: QUERIES.reality },  
            'Русские ток-шоу': { component: 'category_full', url: QUERIES.talkShows },  
            'Русские документальные': { component: 'russian_documentary_full', url: '' }  
        };  
        comp.use({  
            onCreate: function() {  
                this.activity.loader(true);  
                Lampa.Api.partNext(sections, 2, function(data) { this.build(data); this.activity.loader(false); this.activity.toggle(); }.bind(this), function() { this.empty(); this.activity.loader(false); }.bind(this));  
            },  
            onNext: function(resolve, reject) {  
                if (sections.some(function(s) { return typeof s === 'function'; })) Lampa.Api.partNext(sections, 2, resolve, reject);  
                else reject();  
            },  
            onInstance: function(item, itemData) {  
                item.use({  
                    onMore: function() {  
                        var route = routes[itemData.title];  
                        if (route) Lampa.Activity.push({ url: route.url, title: itemData.title, component: route.component, page: 1, source: 'tmdb' });  
                    },  
                    onInstance: function(card, cardData) {  
                        card.use({  
                            onEnter: function() { Lampa.Router.call('full', cardData); },  
                            onFocus: function() { Lampa.Background.change(Lampa.Utils.cardImgBackground(cardData)); }  
                        });  
                    }  
                });  
            }  
        });  
        return comp;  
    });  
    ['now', 'year', 'documentary'].forEach(function(type) {  
        Lampa.Component.add('russian_' + type + '_full', function(params) {  
            var comp = Lampa.Maker.make('Category', params);  
            var pageCache = {};  
            var queries = type === 'now' ? QUERIES.nowPlaying : type === 'year' ? QUERIES.yearlyPopular : QUERIES.documentary;  
            var sortFn = type === 'documentary' ? sortByDate : sortByPopularity;  
            var loadPage = function(pageNum, callback) {  
                if (pageCache[pageNum]) return callback(pageCache[pageNum]);  
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
