(function() {  
    'use strict';  
    if (window.lampaPlugins) return;  
    window.lampaPlugins = true;  
    window.plugin_shots_ready = true;  
    Object.assign(window.lampa_settings || (window.lampa_settings = {}), {  
        torrents_use: true, feed: false, services: false,  
        lang_use: false, white_use: false, read_only: false, demo: false,  
    });  
    Object.assign(  
        window.lampa_settings.disable_features || (window.lampa_settings.disable_features = {}),  
        { dmca: true, lgbt: true, ai: true, subscribe: true, blacklist: true, persons: true, ads: true, remote_configuration: true }  
    );  
    const plugins = [  
        { url: 'https://nb557.github.io/plugins/online_mod.js', name: 'Online Mod', description: 'Источники онлайн-просмотра фильмов и сериалов. Необходимое зеркало: hdrezka.club | @t_anton/nb557' },  
        { url: 'https://shmitt7.github.io/rating.js', name: 'Рейтинг КиноПоиск с логотипом', description: 'Отображение рейтинга КиноПоиск с логотипом на карточке | Рейтинг без логотипа - TMDB' },
        { url: 'https://shmitt7.github.io/card.js', name: 'Карточка фильма', description: 'Меняет визуальный вид полной карточки на TV' },
        { url: 'https://shmitt7.github.io/labels.js', name: 'Цветные метки контента', description: 'Визуальные метки типа контента: синие для фильмов, красные для сериалов' },  
        { url: 'https://shmitt7.github.io/quality.js', name: 'Отметка качества', description: 'Отображение доступного качества видео 4K, HD, TS' },  
        { url: 'https://shmitt7.github.io/parser.js', name: 'Дополнительные кнопки Торрента', description: 'Управление общедоступными парсерами. Доступ: Карточка → Торренты → кнопка µTorrent в шапке | Долгий тап на карточку → Парсер' },  
        { url: 'https://shmitt7.github.io/torrserver.js', name: 'TorrServer Free', description: 'Просмотр торрентов через общедоступные сервера. Работает при включённом встроенном клиенте и дополнительной ссылки. Сервер автоматически переподключается при входе в торренты и в шапке появляется кнопка' },  
        { url: 'https://shmitt7.github.io/russkoe.js', name: 'Русский контент', description: 'Добавляет категорию Русское: новинки, популярное, фильмы, сериалы, мультфильмы, реалити...' },  
        { url: 'https://shmitt7.github.io/buttons.js', name: 'Цветные кнопки просмотра', description: 'Раздельные цветные кнопки для источников просмотра в карточке фильма' },  
        { url: 'https://shmitt7.github.io/filter.js', name: 'Фильтр контента', description: 'Скрывает карточки, название которых не переведено на русский или английский язык' },
        { url: 'https://shmitt7.github.io/tweaks.js', name: 'Улучшения и отключения', description: 'Отключает ненужные функции и блокировки, убирает лишние кнопки' }  
    ];  
    const getKey = name => 'my_plugin_' + name.toLowerCase().replace(/\s+/g, '_');  
    function loadPlugins() {  
        const urls = plugins.filter(p => {  
            const key = getKey(p.name);  
            const val = Lampa.Storage.field(key);  
            if (val === undefined) { Lampa.Storage.set(key, true); return true; }  
            return val;  
        }).map(p => p.url);  
        if (urls.length) Lampa.Utils.putScriptAsync(urls);  
    }  
    function setupSettings() {  
        if (!Lampa.SettingsApi) return;  
        Lampa.SettingsApi.addComponent({  
            component: 'my_plugins',  
            name: 'Плагины',  
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'  
        });  
        Lampa.SettingsApi.addParam({  
            component: 'my_plugins',  
            param: { name: 'reload_app', type: 'button' },  
            field: { name: 'Перезагрузить приложение', description: 'Перезагрузить приложение для применения изменений в плагинах' },  
            onChange: () => window.location.reload()  
        });  
        plugins.forEach(p => {  
            const key = getKey(p.name);  
            Lampa.SettingsApi.addParam({  
                component: 'my_plugins',  
                param: { name: key, type: 'trigger', default: true },  
                field: { name: p.name, description: p.description },  
                onChange: v => Lampa.Storage.set(key, v)  
            });  
        });  
    }  
    if (window.appready) { loadPlugins(); setupSettings(); }  
    else Lampa.Listener.follow('app', e => { if (e.type === 'ready') { loadPlugins(); setupSettings(); } });  
})();
