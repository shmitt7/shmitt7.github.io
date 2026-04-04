(function() {
    'use strict';

    if (window.lampaPlugins) return;
    window.lampaPlugins = true;

    Object.assign(window.lampa_settings || {}, {
        disable_features: {
            dmca: true,
            ai: true,
            subscribe: true,
            blacklist: true,
            persons: true,
            ads: true,
            install_proxy: true
        },
        feed: false,
        services: false,
        geo: false,
        lang_use: false,
        dcma: false
    });

    window.plugin_shots_ready = true;
    window.lampa_settings.disable_features.lgbt = true;
    window.lampa_settings.torrents_use = true;
    window.lampa_settings.demo = false;
    window.lampa_settings.read_only = false;

    const plugins = [
        {
            url: 'https://nb557.github.io/plugins/online_mod.js',
            name: 'Online Mod',
            description: 'Источники онлайн-просмотра фильмов и сериалов. Необходимое зеркало: hdrezka.club | @t_anton/nb557'
        },
        {
            url: 'https://shmitt7.github.io/rating.js',
            name: 'Рейтинг КиноПоиск с логотипом',
            description: 'Отображение рейтинга КиноПоиск с логотипом на карточке | Рейтинг без логотипа - TMDB'
        },
        {
            url: 'https://shmitt7.github.io/labels.js',
            name: 'Цветные метки контента',
            description: 'Визуальные метки типа контента: синие для фильмов, красные для сериалов'
        },
        {
            url: 'https://shmitt7.github.io/parser.js',
            name: 'Дополнительные кнопки Торрента',
            description: 'Управление общедоступными парсерами. Доступ: Карточка → Торренты → кнопка µTorrent в шапке | Долгий тап на карточку → Парсер'
        },
        {
            url: 'https://shmitt7.github.io/torrserver.js',
            name: 'TorrServer Free',
            description: 'Просмотр торрентов через общедоступные сервера. Работает при включённом встроенном клиенте и дополнительной ссылки. Сервер автоматически переподключается при входе в торренты и в шапке появляется кнопка'
        },
        {
            url: 'https://shmitt7.github.io/russkoe.js',
            name: 'Русский контент',
            description: 'Добавляет категорию Русское: новинки, популярное, фильмы, сериалы, мультфильмы, реалити...'
        },
        {
            url: 'https://shmitt7.github.io/buttons.js',
            name: 'Цветные кнопки просмотра',
            description: 'Раздельные цветные кнопки для источников просмотра в карточке фильма'
        },
        {
            url: 'https://shmitt7.github.io/tweaks.js',
            name: 'Улучшения и отключения',
            description: 'Отключает ненужные функции и блокировки, убирает лишние кнопки'
        }
    ];

    function getStorageKey(name) {
        return 'my_plugin_' + name.toLowerCase().replace(/\s+/g, '_');
    }

    function loadPlugins() {
        const enabledPlugins = plugins.filter(plugin => {
            const key = getStorageKey(plugin.name);
            const isEnabled = Lampa.Storage.field(key);
            return isEnabled === undefined ? (Lampa.Storage.set(key, true), true) : isEnabled;
        }).map(plugin => plugin.url);

        if (enabledPlugins.length) {
            Lampa.Utils.putScriptAsync(enabledPlugins);
        }
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

        plugins.forEach(plugin => {
            const key = getStorageKey(plugin.name);
            Lampa.SettingsApi.addParam({
                component: 'my_plugins',
                param: { name: key, type: 'trigger', default: true },
                field: { name: plugin.name, description: plugin.description },
                onChange: value => Lampa.Storage.set(key, value)
            });
        });
    }

    function init() {
        if (!window.Lampa || !Lampa.Storage || !Lampa.Utils) return;
        loadPlugins();
        setupSettings();
    }

    if (window.appready) {
        init();
    } else {
        window.Lampa && Lampa.Listener.follow('app', e => {
            if (e.type === 'ready') init();
        });
    }
})();
