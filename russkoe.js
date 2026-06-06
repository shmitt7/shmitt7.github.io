(function() {  
    'use strict';  
    if (window.russianContent) return;  
    window.russianContent = true;  
    const net = new Lampa.Reguest();  
    const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;  
    const today = new Date();  
    const monthAgo = new Date(today); monthAgo.setMonth(monthAgo.getMonth()-1);  
    const yearAgo = new Date(today); yearAgo.setFullYear(yearAgo.getFullYear()-1);  
    const D = { now: fmt(today), month: fmt(monthAgo), year: fmt(yearAgo) };  
    const buildUrl = q => Lampa.TMDB.api(q + '&api_key=' + Lampa.TMDB.key() + '&language=ru');  
    const sortByPopularity = (a, b) => (b.popularity || 0) - (a.popularity || 0);  
    const sortByDate = (a, b) => (b.release_date || b.first_air_date || '').localeCompare(a.release_date || a.first_air_date || '');  
    const loadData = (queries, title, callback, sortFn) => {  
        const qs = Array.isArray(queries) ? queries : [queries];  
        let results = [], done = 0;  
        const onDone = () => {  
            if (++done < qs.length) return;  
            if (sortFn) results.sort(sortFn);  
            callback(Lampa.Utils.addSource({ results: results.slice(0, 20), title, source: 'tmdb', total_pages: 2, params: { card: { card_small: true } } }, 'tmdb'));  
        };  
        qs.forEach(q => net.silent(buildUrl(q), json => { results = results.concat(json.results || []); onDone(); }, onDone, false, { cache: { life: 1440 } }));  
    };  
    const Q = {  
        nowPlaying: [  
            `discover/movie?with_original_language=ru&with_runtime.gte=71&primary_release_date.gte=${D.month}&primary_release_date.lte=${D.now}&sort_by=popularity.desc&page=1`,  
            `discover/tv?with_original_language=ru&first_air_date.gte=${D.month}&first_air_date.lte=${D.now}&sort_by=popularity.desc&page=1`  
        ],  
        yearlyPopular: [  
            `discover/movie?with_original_language=ru&with_runtime.gte=71&primary_release_date.gte=${D.year}&primary_release_date.lte=${D.now}&sort_by=popularity.desc&page=1`,  
            `discover/tv?with_original_language=ru&first_air_date.gte=${D.year}&first_air_date.lte=${D.now}&sort_by=popularity.desc&page=1`  
        ],  
        movies: `discover/movie?with_original_language=ru&with_runtime.gte=71&without_genres=16,99&primary_release_date.lte=${D.now}&sort_by=primary_release_date.desc`,  
        series: `discover/tv?with_original_language=ru&without_genres=16,10764,10767,99&first_air_date.lte=${D.now}&sort_by=first_air_date.desc`,  
        cartoons: `discover/movie?with_original_language=ru&with_genres=16&with_runtime.gte=70&primary_release_date.lte=${D.now}&sort_by=primary_release_date.desc`,  
        cartoonSeries: `discover/tv?with_original_language=ru&with_genres=16&first_air_date.lte=${D.now}&sort_by=first_air_date.desc`,  
        reality: `discover/tv?with_original_language=ru&with_genres=10764&first_air_date.lte=${D.now}&sort_by=first_air_date.desc`,  
        talkShows: `discover/tv?with_original_language=ru&with_genres=10767&first_air_date.lte=${D.now}&sort_by=first_air_date.desc`,  
        documentary: [  
            `discover/movie?with_original_language=ru&with_genres=99&primary_release_date.lte=${D.now}&sort_by=primary_release_date.desc&page=1`,  
            `discover/tv?with_original_language=ru&with_genres=99&first_air_date.lte=${D.now}&sort_by=first_air_date.desc&page=1`  
        ]  
    };  
    Lampa.Component.add('russian_category', function(params) {  
        const comp = Lampa.Maker.make('Main', params);  
        const sections = [  
            cb => loadData(Q.nowPlaying, 'Сейчас смотрят', cb, sortByPopularity),  
            cb => loadData(Q.yearlyPopular, 'Популярное за год', cb, sortByPopularity),  
            cb => loadData(Q.movies, 'Русские фильмы', cb, sortByDate),  
            cb => loadData(Q.series, 'Русские сериалы', cb, sortByDate),  
            cb => loadData(Q.cartoons, 'Русские мультфильмы', cb, sortByDate),  
            cb => loadData(Q.cartoonSeries, 'Русские мультсериалы', cb, sortByDate),  
            cb => loadData(Q.reality, 'Русские реалити-шоу', cb, sortByDate),  
            cb => loadData(Q.talkShows, 'Русские ток-шоу', cb, sortByDate),  
            cb => loadData(Q.documentary, 'Русские документальные', cb, sortByDate)  
        ];  
        const routes = {  
            'Сейчас смотрят': { component: 'russian_now_full', url: '' },  
            'Популярное за год': { component: 'russian_year_full', url: '' },  
            'Русские фильмы': { component: 'category_full', url: Q.movies },  
            'Русские сериалы': { component: 'category_full', url: Q.series },  
            'Русские мультфильмы': { component: 'category_full', url: Q.cartoons },  
            'Русские мультсериалы': { component: 'category_full', url: Q.cartoonSeries },  
            'Русские реалити-шоу': { component: 'category_full', url: Q.reality },  
            'Русские ток-шоу': { component: 'category_full', url: Q.talkShows },  
            'Русские документальные': { component: 'russian_documentary_full', url: '' }  
        };  
        comp.use({  
            onCreate() {  
                this.activity.loader(true);  
                Lampa.Api.partNext(sections, 2, data => { this.build(data); this.activity.loader(false); this.activity.toggle(); }, () => { this.empty(); this.activity.loader(false); });  
            },  
            onNext(resolve, reject) {  
                if (sections.some(s => typeof s === 'function')) Lampa.Api.partNext(sections, 2, resolve, reject);  
                else reject();  
            },  
            onInstance(item, itemData) {  
                item.use({  
                    onMore() {  
                        const route = routes[itemData.title];  
                        if (route) Lampa.Activity.push({ url: route.url, title: itemData.title, component: route.component, page: 1, source: 'tmdb' });  
                    },  
                    onInstance(card, cardData) {  
                        card.use({  
                            onEnter: () => Lampa.Router.call('full', cardData),  
                            onFocus: () => Lampa.Background.change(Lampa.Utils.cardImgBackground(cardData))  
                        });  
                    }  
                });  
            }  
        });  
        return comp;  
    });  
    ['now', 'year', 'documentary'].forEach(type => {  
        Lampa.Component.add(`russian_${type}_full`, function(params) {  
            const comp = Lampa.Maker.make('Category', params);  
            const pageCache = new Map();  
            const queries = type === 'now' ? Q.nowPlaying : type === 'year' ? Q.yearlyPopular : Q.documentary;  
            const sortFn = type === 'documentary' ? sortByDate : sortByPopularity;  
            const loadPage = (pageNum, callback) => {  
                if (pageCache.has(pageNum)) return callback(pageCache.get(pageNum));  
                const apiPage = Math.ceil(pageNum / 2);  
                let results = [], done = 0;  
                const onDone = () => {  
                    if (++done < 2) return;  
                    const data = { results: results.sort(sortFn), total_pages: 500, source: 'tmdb' };  
                    pageCache.set(pageNum, data);  
                    callback(data);  
                };  
                [0, 1].forEach(i => net.silent(buildUrl(queries[i].replace(/page=1/, `page=${apiPage}`)), json => { results = results.concat(json.results || []); onDone(); }, onDone, false, { cache: { life: 1440 } }));  
            };  
            comp.use({  
                onCreate() {  
                    this.activity.loader(true);  
                    loadPage(params.page || 1, data => { this.build(data); this.render().find('.category-full').addClass('cols--6'); this.activity.loader(false); this.activity.toggle(); });  
                },  
                onNext(resolve) {  
                    params.page = (params.page || 1) + 1;  
                    loadPage(params.page, resolve);  
                },  
                onInstance(card, cardData) {  
                    card.use({  
                        onEnter: () => Lampa.Router.call('full', cardData),  
                        onFocus: () => Lampa.Background.change(Lampa.Utils.cardImgBackground(cardData))  
                    });  
                }  
            });  
            return comp;  
        });  
    });  
    const SVG_MENU = '<svg width="36" height="36" viewBox="0 0 35 35"><path d="M7.486,33.076a3.164,3.164,0,0,1-3.164-3.165V5.089A3.164,3.164,0,0,1,9.249,2.461L27.754,14.872a3.165,3.165,0,0,1,0,5.256L9.249,32.539h0A3.156,3.156,0,0,1,7.486,33.076ZM8.552,31.5h0ZM7.491,4.422a.7.7,0,0,0-.317.08.652.652,0,0,0-.352.587V29.911a.664.664,0,0,0,1.034.552L26.362,18.052a.66.66,0,0,0,.294-.553.646.646,0,0,0-.294-.55L7.856,4.537A.649.649,0,0,0,7.491,4.422Z" fill="currentColor"/></svg>';  
    const addMenu = () => Lampa.Menu.addButton(SVG_MENU, 'Русское', () => Lampa.Activity.push({ url: '', title: 'Русский контент', component: 'russian_category', page: 1 }));  
    if (window.appready) addMenu();  
    else Lampa.Listener.follow('app', e => { if (e.type === 'ready') addMenu(); });
})();
