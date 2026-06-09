(function () {
    'use strict';

    // Определение аниме: японский язык + жанр 16 (Анимация)
    function isAnime(item) {
        var ids = item.genre_ids
            || (item.genres ? item.genres.map(function (g) { return g.id; }) : []);
        return item.original_language === 'ja' && ids.indexOf(16) >= 0;
    }

    // Карты фильтров: ключ хранилища → языковые коды
    var FILTERS = [
        { key: 'cf_indian',   langs: ['hi','ta','te','ml','kn','bn','ur','pa','gu','mr','si'] },
        { key: 'cf_chinese',  langs: ['zh'] },
        { key: 'cf_japanese', langs: ['ja'] },
        { key: 'cf_korean',   langs: ['ko'] },
        { key: 'cf_turkish',  langs: ['tr'] },
        { key: 'cf_asian',    langs: ['th','vi','id','ms','tl','my','km','lo','mn','ne'] }
    ];

    function isFiltered(item) {
        if (!item || !item.original_language) return false;

        // Аниме — отдельный фильтр (не зависит от фильтра японского)
        if (Lampa.Storage.field('cf_anime') == 'true' && isAnime(item)) return true;

        var lang = item.original_language;
        for (var i = 0; i < FILTERS.length; i++) {
            var f = FILTERS[i];
            if (Lampa.Storage.field(f.key) == 'true' && f.langs.indexOf(lang) >= 0) return true;
        }
        return false;
    }

    function shouldApplyFilter(url) {
        return url.indexOf(Lampa.TMDB.api('')) > -1
            && url.indexOf('/search') === -1
            && url.indexOf('/person/') === -1;
    }

    function initPlugin() {
        if (window._cf_plugin_loaded) return;
        window._cf_plugin_loaded = true;

        // Регистрируем раздел настроек
        Lampa.SettingsApi.addComponent({
            component: 'content_filter',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36"><path fill="white" d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg>',
            name: 'Фильтр контента'
        });

        var items = [
            { key: 'cf_indian',   name: 'Индийское кино и сериалы',        desc: 'Хинди, тамильский, телугу и другие языки Индии' },
            { key: 'cf_chinese',  name: 'Китайское кино и сериалы',         desc: 'Контент на китайском языке' },
            { key: 'cf_japanese', name: 'Японское кино и сериалы',          desc: 'Весь японский контент (включая аниме)' },
            { key: 'cf_korean',   name: 'Южнокорейское кино и сериалы',     desc: 'Контент на корейском языке' },
            { key: 'cf_turkish',  name: 'Турецкое кино и сериалы',          desc: 'Контент на турецком языке' },
            { key: 'cf_asian',    name: 'Прочий азиатский контент',         desc: 'Тайский, вьетнамский, индонезийский и другие' },
            { key: 'cf_anime',    name: 'Аниме',                            desc: 'Только японская анимация (жанр Анимация + японский язык)' }
        ];

        items.forEach(function (item) {
            Lampa.SettingsApi.addParam({
                component: 'content_filter',
                param: { name: item.key, type: 'trigger', default: false },
                field: { name: item.name, description: item.desc }
            });
        });

        // Перехватываем ответы API и фильтруем результаты
        Lampa.Listener.follow('request_secuses', function (req) {
            if (!req.data || !Array.isArray(req.data.results)) return;
            if (!shouldApplyFilter(req.params.url)) return;

            req.data.results = req.data.results.filter(function (item) {
                return !isFiltered(item);
            });
        });
    }

    if (window.appready) initPlugin();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') initPlugin();
    });
})();
