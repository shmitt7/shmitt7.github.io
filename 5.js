(function () {  
    'use strict';  
  
    var plugins = [  
        { url: 'https://nb557.github.io/plugins/online_mod.js', name: 'Online Mod', descr: 'Онлайн-просмотр фильмов и сериалов. Зеркало: hdrezka.club' },  
        { url: 'https://cub.red/plugin/sport', name: 'Спорт', descr: 'Прямые трансляции спортивных событий' },  
        { url: 'https://shmitt7.github.io/buttons.js', name: 'Цветные кнопки просмотра', descr: 'Раздельные цветные кнопки источников в карточке' },  
        { url: 'https://shmitt7.github.io/cardMobile.js', name: 'Карточка фильма для телефона', descr: 'Вид полной карточки на телефоне' },  
        { url: 'https://shmitt7.github.io/cardTV.js', name: 'Карточка фильма', descr: 'Вид полной карточки на TV' },  
        { url: 'https://shmitt7.github.io/cards.js', name: 'Карточки в списках', descr: 'Вид карточки в списках' },  
        { url: 'https://shmitt7.github.io/dmca.js', name: 'Разблокировка DMCA', descr: 'Обход блокировки DMCA-контента' },  
        { url: 'https://shmitt7.github.io/menu.js', name: 'Плавающее меню', descr: 'Новое оформление меню на TV' },  
        { url: 'https://shmitt7.github.io/labels.js', name: 'Цветные метки контента', descr: 'Синие метки - фильмы, красные - сериалы' },  
        { url: 'https://shmitt7.github.io/line.js', name: 'Линии Кинопоиск и CUB', descr: 'Линии "Сейчас смотрят" на главном экране' },  
        { url: 'https://shmitt7.github.io/parser.js', name: 'Дополнительные кнопки Торрента', descr: 'Управление общедоступными парсерами' },  
        { url: 'https://shmitt7.github.io/quality.js', name: 'Отметка качества', descr: 'Отображение качества 4K, HD, TS' },  
        { url: 'https://shmitt7.github.io/rating.js', name: 'Рейтинг КиноПоиск', descr: 'Рейтинг КиноПоиск с логотипом на карточке' },  
        { url: 'https://shmitt7.github.io/russkoe.js', name: 'Русский контент', descr: 'Категория Русское: новинки, фильмы, сериалы' },  
        { url: 'https://shmitt7.github.io/status.js', name: 'Статус контента', descr: 'Дата премьеры, онгоинг, сезон и серия' },  
        { url: 'https://shmitt7.github.io/torrserver.js', name: 'TorrServer Free', descr: 'Просмотр торрентов через общедоступные сервера' }  
    ];  
  
    var KEY = 'my_plugins_'; // префикс ключа настройки для каждого плагина  
  
    function getPlugin(url) {  
        return Lampa.Plugins.get().find(function (p) { return p.url === url; });  
    }  
  
    function apply(url, enabled) {  
        var plug = getPlugin(url);  
  
        if (enabled) {  
            if (!plug) {  
                // плагина ещё нет — добавляем включённым  
                Lampa.Plugins.add({ url: url, status: 1 });  
            } else if (plug.status !== 1) {  
                // есть, но выключен — включаем и подгружаем  
                plug.status = 1;  
                Lampa.Plugins.save(plug);  
                Lampa.Plugins.push(plug);  
            }  
        } else {  
            if (plug && plug.status === 1) {  
                // выключаем — отключится после перезагрузки  
                plug.status = 0;  
                Lampa.Plugins.save(plug);  
                Lampa.Noty.show('Отключится после перезагрузки');  
            }  
        }  
    }  
  
    function start() {  
        // создаём раздел "Мои плагины" в настройках  
        Lampa.SettingsApi.addComponent({  
            component: 'myplugins',  
            name: 'Мои плагины',  
            icon: '<svg height="36" viewBox="0 0 38 36" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="30" height="28" rx="3" stroke="white" stroke-width="3"/><line x1="11" y1="19" x2="17" y2="25" stroke="white" stroke-width="3" stroke-linecap="round"/><line x1="16" y1="25" x2="28" y2="11" stroke="white" stroke-width="3" stroke-linecap="round"/></svg>'  
        });  
  
        plugins.forEach(function (p) {  
            var key = KEY + encodeURIComponent(p.url).slice(0, 60);  
  
            // состояние по умолчанию — включено  
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
                    description: p.descr + '\n' + p.url  
                },  
                onChange: function () {  
                    apply(p.url, Lampa.Storage.get(key, 'true') === true || Lampa.Storage.get(key) === 'true');  
                }  
            });  
  
            // при старте приводим реальное состояние плагина к состоянию тумблера  
            apply(p.url, Lampa.Storage.get(key, 'true') === true || Lampa.Storage.get(key) === 'true');  
        });  
    }  
  
    if (window.appready) start();  
    else {  
        Lampa.Listener.follow('app', function (e) {  
            if (e.type === 'ready') start();  
        });  
    }  
})();
