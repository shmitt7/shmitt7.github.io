(function () {  
    if (window.lampaPlugins) return;  
    window.lampaPlugins = true;  
    window.plugin_shots_ready = true;  
    Object.assign(window.lampa_settings || (window.lampa_settings = {}), {  
        torrents_use: true,  
        feed: false,  
        services: false,  
        lang_use: false,  
        white_use: false,  
        read_only: false,  
        demo: false  
    });  
    Object.assign(window.lampa_settings.disable_features || (window.lampa_settings.disable_features = {}), {  
        dmca: true,  
        lgbt: true,  
        ai: true,  
        subscribe: true,  
        blacklist: true,  
        persons: true,  
        ads: true,  
        remote_configuration: true  
    });  
    var plugins = [  
        { url: 'https://nb557.github.io/plugins/online_mod.js', name: 'Online Mod', descr: 'Плагин для онлайн-просмотра фильмов и сериалов | github/nb557' },  
        { url: 'http://z01.online/online.js?v=2', name: 'Z01 Online', descr: 'Плагин для онлайн-просмотра фильмов и сериалов | t/lampabyskaz' },  
        { url: 'https://bwa.ad/rc', name: 'BwaRC', descr: 'Плагин для онлайн-просмотра фильмов и сериалов | bwa.ad' },  
        { url: 'https://cub.red/plugin/sport', name: 'Спорт', descr: 'Раздел Спорт в меню: прямые трансляции спортивных событий | @lampa' },  
        { url: 'https://shmitt7.github.io/buttons.js', name: 'Цветные кнопки просмотра', descr: 'Раздельные цветные кнопки для источников просмотра в карточке фильма' },  
        { url: 'https://shmitt7.github.io/cardMobile.js', name: 'Карточка фильма для телефона', descr: 'Меняет визуальный вид полной карточки на телефоне' },  
        { url: 'https://shmitt7.github.io/cardTV.js', name: 'Карточка фильма', descr: 'Меняет визуальный вид полной карточки на TV' },  
        { url: 'https://shmitt7.github.io/cards.js', name: 'Карточки в списках', descr: 'Меняет визуальный вид карточки в списках' },  
        { url: 'https://shmitt7.github.io/dmca.js', name: 'Разблокировка DMCA', descr: 'Автоматически обходит блокировку DMCA-контента' },  
        { url: 'https://shmitt7.github.io/filter.js', name: 'Фильтр контента', descr: 'Оставляет карточки с русским названием или с оригиналом на английском/русском языке. Поиск, персоны и коллекции не фильтруются' },  
        { url: 'https://shmitt7.github.io/menu.js', name: 'Плавающее меню', descr: 'Новое оформление всех меню на TV' },  
        { url: 'https://shmitt7.github.io/labels.js', name: 'Цветные метки контента', descr: 'Визуальные метки типа контента: синие для фильмов, красные для сериалов' },  
        { url: 'https://shmitt7.github.io/line.js', name: 'Линии Кинопоиск и CUB', descr: 'Добавляет на главный экран линии "Сейчас смотрят Кинопоиск" и "Сейчас смотрят CUB" с карточками, привязанными к TMDB по названию и году' },  
        { url: 'https://shmitt7.github.io/parser.js', name: 'Дополнительные кнопки Торрента', descr: 'Управление общедоступными парсерами. Доступ: Карточка → Торренты → кнопка µTorrent в шапке | Долгий тап на карточку → Парсер' },  
        { url: 'https://shmitt7.github.io/quality.js', name: 'Отметка качества', descr: 'Отображение доступного качества видео 4K, HD, TS' },  
        { url: 'https://shmitt7.github.io/rating.js', name: 'Рейтинг КиноПоиск с логотипом', descr: 'Отображение рейтинга КиноПоиск с логотипом на карточке | Рейтинг без логотипа - TMDB' },  
        { url: 'https://shmitt7.github.io/russkoe.js', name: 'Русский контент', descr: 'Добавляет категорию Русское: новинки, популярное, фильмы, сериалы, мультфильмы, реалити...' },  
        { url: 'https://shmitt7.github.io/status.js', name: 'Статус контента', descr: 'Метка статуса на карточке: дата премьеры, онгоинг, завершён, отменён, текущий сезон и серия (S/E)' },  
        { url: 'https://shmitt7.github.io/torrserver.js', name: 'TorrServer Free', descr: 'Просмотр торрентов через общедоступные сервера. Работает при включённом встроенном клиенте и дополнительной ссылки. Сервер автоматически переподключается при входе в торренты и в шапке появляется кнопка' }  
    ];  
    var keyPrefix = 'shmitt7_';  
    var componentName = 'shmitt7_plugins';  
    function pluginKey(plugin) {  
        return keyPrefix + encodeURIComponent(plugin.url).slice(0, 60);  
    }  
    function isEnabled(key) {  
        var value = Lampa.Storage.get(key, 'true');  
        return value === true || value === 'true';  
    }  
    function loadPlugin(plugin) {  
        Lampa.Utils.putScriptAsync([plugin.url], false, function () {}, function () {}, false);  
    }  
    function loadEnabled() {  
        plugins.forEach(function (plugin) {  
            if (isEnabled(pluginKey(plugin))) loadPlugin(plugin);  
        });  
    }  
    function hideItems() {  
        $('.menu .menu__item[data-action="catalog"],.menu .menu__item[data-action="relise"],.menu .menu__item[data-action="timetable"],.menu .menu__item[data-action="about"],.menu .menu__item[data-action="mytorrents"]').remove();  
        var menu = $('.menu');  
        var editItem = menu.find('[data-action="edit"]').detach();  
        if (editItem.length) menu.find('.nosort').first().find('.menu__list').append(editItem);  
        var lastNosort = menu.find('.nosort').last();  
        lastNosort.prev('.menu__split').remove();  
        lastNosort.remove();  
    }  
    function runTweaks() {  
        document.head.insertAdjacentHTML('beforeend', '<style>.head .open--broadcast,.head .open--profile,.head .notice--icon{display:none!important}.button--options{display:none!important}</style>');  
        hideItems();  
        Lampa.Listener.follow('menu', function (event) {  
            if (event.type === 'end') hideItems();  
        });  
    }  
    function start() {  
        Lampa.SettingsApi.addComponent({  
            component: componentName,  
            name: 'Плагины',  
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'  
        });  
        Lampa.SettingsApi.addParam({  
            component: componentName,  
            param: { name: 'shmitt7_reload', type: 'button' },  
            field: { name: 'Перезагрузить приложение', description: 'Перезагрузить приложение для применения изменений в плагинах' },  
            onChange: function () {  
                window.location.reload();  
            }  
        });  
        plugins.forEach(function (plugin) {  
            var key = pluginKey(plugin);  
            Lampa.SettingsApi.addParam({  
                component: componentName,  
                param: { name: key, type: 'trigger', default: true },  
                field: { name: plugin.name, description: plugin.descr },  
                onChange: function () {  
                    if (isEnabled(key)) {  
                        loadPlugin(plugin);  
                    } else {  
                        Lampa.Noty.show('Изменения применятся после перезагрузки');  
                    }  
                }  
            });  
        });  
    }  
    loadEnabled();  
    if (window.appready) {  
        runTweaks();  
        start();  
    } else {  
        Lampa.Listener.follow('app', function (event) {  
            if (event.type === 'ready') {  
                runTweaks();  
                start();  
            }  
        });  
    }  
})();
