(function () {  
    var plugins = [  
        { url: 'https://nb557.github.io/plugins/online_mod.js', name: 'Online Mod', descr: 'Источники онлайн-просмотра фильмов и сериалов. Необходимое зеркало: hdrezka.club | @t_anton/nb557' },  
        { url: 'https://cub.red/plugin/sport', name: 'Спорт', descr: 'Раздел Спорт в меню: прямые трансляции спортивных событий | @lampa' },  
        { url: 'https://shmitt7.github.io/buttons.js', name: 'Цветные кнопки просмотра', descr: 'Раздельные цветные кнопки для источников просмотра в карточке фильма' },  
        { url: 'https://shmitt7.github.io/cardMobile.js', name: 'Карточка фильма для телефона', descr: 'Меняет визуальный вид полной карточки на телефоне' },  
        { url: 'https://shmitt7.github.io/cardTV.js', name: 'Карточка фильма', descr: 'Меняет визуальный вид полной карточки на TV' },  
        { url: 'https://shmitt7.github.io/cards.js', name: 'Карточки в списках', descr: 'Меняет визуальный вид карточки в списках' },  
        { url: 'https://shmitt7.github.io/dmca.js', name: 'Разблокировка DMCA', descr: 'Автоматически обходит блокировку DMCA-контента' },
        { url: 'https://shmitt7.github.io/filter.js', name: 'Фильтр контента', description: 'Оставляет карточки с русским названием или с оригиналом на английском/русском языке. Поиск, персоны и коллекции не фильтруются' }
        { url: 'https://shmitt7.github.io/menu.js', name: 'Плавающее меню', descr: 'Новое оформление всех меню на TV' },  
        { url: 'https://shmitt7.github.io/labels.js', name: 'Цветные метки контента', descr: 'Визуальные метки типа контента: синие для фильмов, красные для сериалов' },  
        { url: 'https://shmitt7.github.io/line.js', name: 'Линии Кинопоиск и CUB', descr: 'Добавляет на главный экран линии "Сейчас смотрят Кинопоиск" и "Сейчас смотрят CUB" с карточками, привязанными к TMDB по названию и году' },  
        { url: 'https://shmitt7.github.io/parser.js', name: 'Дополнительные кнопки Торрента', descr: 'Управление общедоступными парсерами. Доступ: Карточка → Торренты → кнопка µTorrent в шапке | Долгий тап на карточку → Парсер' },  
        { url: 'https://shmitt7.github.io/quality.js', name: 'Отметка качества', descr: 'Отображение доступного качества видео 4K, HD, TS' },  
        { url: 'https://shmitt7.github.io/rating.js', name: 'Рейтинг КиноПоиск с логотипом', descr: 'Отображение рейтинга КиноПоиск с логотипом на карточке | Рейтинг без логотипа - TMDB' },  
        { url: 'https://shmitt7.github.io/russkoe.js', name: 'Русский контент', descr: 'Добавляет категорию Русское: новинки, популярное, фильмы, сериалы, мультфильмы, реалити...' },  
        { url: 'https://shmitt7.github.io/status.js', name: 'Статус контента', descr: 'Метка статуса на карточке: дата премьеры, онгоинг, завершён, отменён, текущий сезон и серия (S/E)' },  
        { url: 'https://shmitt7.github.io/torrserver.js', name: 'TorrServer Free', descr: 'Просмотр торрентов через общедоступные сервера. Работает при включённом встроенном клиенте и дополнительной ссылки. Сервер автоматически переподключается при входе в торренты и в шапке появляется кнопка' },  
        { url: 'https://shmitt7.github.io/tweaks.js', name: 'Очистка интерфейса', descr: 'Убирает лишние иконки/кнопки/пункты меню. Отключает рекламу, DMCA, подписки и сервисы. Фильтр контента: только латиница и кириллица' }  
    ];  
    var keyPrefix = 'shmitt7_';  
    var managedKey = 'shmitt7_managed';  
    var componentName = 'shmitt7_plugins';  
    var originalGet = Lampa.Plugins.get.bind(Lampa.Plugins);  
    var hiddenUrls = plugins.map(function (plugin) { return plugin.url; });  
    Lampa.Plugins.get = function () {  
        return originalGet().filter(function (plugin) {  
            return hiddenUrls.indexOf(plugin.url) === -1;  
        });  
    };  
    var originalNotyShow = Lampa.Noty.show.bind(Lampa.Noty);  
    var addSuccessText = Lampa.Lang.translate('plugins_add_success');  
    Lampa.Noty.show = function (text, params) {  
        if (text === addSuccessText) return;  
        return originalNotyShow(text, params);  
    };  
    function isEnabled(key) {  
        var value = Lampa.Storage.get(key, 'true');  
        return value === true || value === 'true';  
    }  
    function applyPlugin(plugin, enabled) {  
        var installed = originalGet().find(function (item) { return item.url === plugin.url; });  
        if (enabled) {  
            if (!installed) {  
                Lampa.Plugins.add({ url: plugin.url, status: 1 });  
            } else if (installed.status !== 1) {  
                installed.status = 1;  
                Lampa.Plugins.save();  
                Lampa.Plugins.push(installed);  
            }  
        } else if (installed && installed.status === 1) {  
            installed.status = 0;  
            Lampa.Plugins.save();  
        }  
    }  
    function syncRemoved() {  
        var managed = Lampa.Storage.get(managedKey, '[]');  
        if (!Array.isArray(managed)) managed = [];  
        plugins.forEach(function (plugin) {  
            if (managed.indexOf(plugin.url) === -1) managed.push(plugin.url);  
        });  
        managed.forEach(function (url) {  
            if (hiddenUrls.indexOf(url) === -1) {  
                var installed = originalGet().find(function (item) { return item.url === url; });  
                if (installed) Lampa.Plugins.remove(installed);  
            }  
        });  
        Lampa.Storage.set(managedKey, hiddenUrls.slice());  
    }  
    function start() {  
        syncRemoved();  
        Lampa.SettingsApi.addComponent({  
            component: componentName,  
            name: 'Плагины',  
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'  
        });  
        Lampa.SettingsApi.addParam({  
            component: componentName,  
            param: { name: 'shmitt7_reload', type: 'button' },  
            field: {  
            name: '<svg style="width:20px;height:20px;display:inline-block;vertical-align:middle;margin-right:8px;flex-shrink:0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 12a9 9 0 1 1-2.64-6.36" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M21 3v6h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Перезагрузить приложение',  
            description: 'Перезагрузить приложение для применения изменений в плагинах'  
            },  
            onChange: function () {  
                window.location.reload();  
            }  
        });  
        plugins.forEach(function (plugin) {  
            var key = keyPrefix + encodeURIComponent(plugin.url).slice(0, 60);  
            Lampa.SettingsApi.addParam({  
                component: componentName,  
                param: { name: key, type: 'trigger', default: true },  
                field: { name: plugin.name, description: plugin.descr },  
                onChange: function () {  
                    applyPlugin(plugin, isEnabled(key));  
                }  
            });  
            applyPlugin(plugin, isEnabled(key));  
        });  
    }  
    if (window.appready) start();  
    else {  
        Lampa.Listener.follow('app', function (event) {  
            if (event.type === 'ready') start();  
        });  
    }  
})();
