(function () {  
    'use strict';  
  
    // ================== СПИСОК ПЛАГИНОВ ==================  
    var plugins = [  
        { url: 'https://nb557.github.io/plugins/online_mod.js', name: 'Online Mod', descr: 'Источники онлайн-просмотра фильмов и сериалов. Необходимое зеркало: hdrezka.club | @t_anton/nb557' },  
        { url: 'https://cub.red/plugin/sport', name: 'Спорт', descr: 'Раздел Спорт в меню: прямые трансляции спортивных событий | @lampa' },  
        { url: 'https://shmitt7.github.io/buttons.js', name: 'Цветные кнопки просмотра', descr: 'Раздельные цветные кнопки для источников просмотра в карточке фильма' },  
        { url: 'https://shmitt7.github.io/cardMobile.js', name: 'Карточка фильма для телефона', descr: 'Меняет визуальный вид полной карточки на телефоне' },  
        { url: 'https://shmitt7.github.io/cardTV.js', name: 'Карточка фильма', descr: 'Меняет визуальный вид полной карточки на TV' },  
        { url: 'https://shmitt7.github.io/cards.js', name: 'Карточки в списках', descr: 'Меняет визуальный вид карточки в списках' },  
        { url: 'https://shmitt7.github.io/dmca.js', name: 'Разблокировка DMCA', descr: 'Автоматически обходит блокировку DMCA-контента' },  
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
    // =====================================================  
  
    var KEY = 'myplugins_';  
  
    // --- Скрытие: подменяем Plugins.get до отрисовки магазина ---  
    var origGet = Lampa.Plugins.get.bind(Lampa.Plugins);  
  
    var hiddenUrls = plugins.map(function (p) { return p.url; });  
  
    Lampa.Plugins.get = function () {  
        return origGet().filter(function (p) {  
            return hiddenUrls.indexOf(p.url) === -1;  
        });  
    };  
  
    // Реальный список (включая скрытые) — для внутренних проверок  
    function allPlugins() {  
        return origGet();  
    }  
  
    function getPlugin(url) {  
        return allPlugins().find(function (p) { return p.url === url; });  
    }  
  
    function isEnabled(key) {  
        var v = Lampa.Storage.get(key, 'true');  
        return v === true || v === 'true';  
    }  
  
    function apply(p, enabled) {  
        var plug = getPlugin(p.url);  
  
        if (enabled) {  
            if (!plug) {  
                Lampa.Plugins.add({ url: p.url, status: 1, name: p.name });  
            } else if (plug.status !== 1) {  
                plug.status = 1;  
                Lampa.Plugins.save(plug);  
                Lampa.Plugins.push(plug);  
            }  
        } else {  
            if (plug && plug.status === 1) {  
                plug.status = 0;  
                Lampa.Plugins.save(plug);  
                Lampa.Noty.show(p.name + ': отключится после перезагрузки');  
            }  
        }  
    }  
  
    function start() {  
        Lampa.SettingsApi.addComponent({  
            component: 'myplugins',  
            name: 'Плагины',  
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'  
        });  
  
        // Первый пункт — перезагрузка приложения  
        Lampa.SettingsApi.addParam({  
            component: 'myplugins',  
            param: {  
                name: 'myplugins_reload',  
                type: 'button'  
            },  
            field: {  
                name: 'Перезагрузить приложение',  
                description: 'Перезагрузить приложение для применения изменений в плагинах'  
            },  
            onChange: function () {  
                window.location.reload();  
            }  
        });  
  
        plugins.forEach(function (p) {  
            var key = KEY + encodeURIComponent(p.url).slice(0, 60);  
  
            Lampa.Params.trigger(key, true);  
  
            Lampa.SettingsApi.addParam({  
                component: 'myplugins',  
                param: {  
                    name: key,  
                    type: 'trigger',  
                    default: true  
                },  
                field: {  
                    name: p.name,  
                    description: p.descr  
                },  
                onChange: function () {  
                    apply(p, isEnabled(key));  
                }  
            });  
  
            // приводим состояние плагина к тумблеру при каждом старте  
            apply(p, isEnabled(key));  
        });  
    }  
  
    if (window.appready) start();  
    else {  
        Lampa.Listener.follow('app', function (e) {  
            if (e.type === 'ready') start();  
        });  
    }  
})();
