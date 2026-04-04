(function() {  
    'use strict';  
      
    if (window.lampaPlugins) return;  
    window.lampaPlugins = true;  
      
    // Безопасная инициализация настроек  
    window.lampa_settings = window.lampa_settings || {};  
      
    // Отключение функций  
    Object.assign(window.lampa_settings, {  
        disable_features: {  
            dmca: true,           // Отключить DMCA блокировки  
            ai: true,             // Отключить ИИ функции  
            subscribe: true,      // Отключить подписки  
            blacklist: true,      // Отключить черный список  
            persons: true,        // Отключить подписку на актеров  
            ads: true,            // Отключить рекламу  
            install_proxy: true   // Отключить установку прокси  
        },  
          
        feed: false,       // Отключить ленту  
        services: false,   // Отключить сервисы  
        geo: false,        // Отключить геолокацию  
        lang_use: false,   // Отключить использование языков  
        dcma: false        // Отключить DCMA  
    });  
      
    // Отключаем плагин Shots  
    window.plugin_shots_ready = true;  
      
    // Отключаем блокировку ЛГБТ контента  
    window.lampa_settings.disable_features.lgbt = true;  
      
    // Список плагинов  
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
            description: 'Управление несколькими парсерами Jackett. Доступ: Карточка → Торренты → кнопка µTorrent в шапке | Долгий тап на карточку → Парсер'  
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
            description: 'Раздельные цветные кнопки для разных источников просмотра в карточке фильма'  
        },  
        {  
            url: 'https://shmitt7.github.io/tweaks.js',  
            name: 'Улучшения и отключения',  
            description: 'Убирает рекламу, лишние кнопки, уведомления и добавляет цветные индикаторы для торрентов'  
        }  
    ];  
      
    // Вспомогательные функции  
    function getPluginId(name) {  
        return 'my_plugin_' + name.toLowerCase().replace(/\s+/g, '_');  
    }  
      
    function loadPlugins() {  
        const enabledPlugins = plugins.filter(plugin => {  
            const pluginId = getPluginId(plugin.name);  
            const isEnabled = Lampa.Storage.field(pluginId);  
              
            if (isEnabled === undefined) {  
                Lampa.Storage.set(pluginId, true);  
                return true;  
            }  
              
            return isEnabled;  
        }).map(plugin => plugin.url);  
          
        if (enabledPlugins.length) {  
            Lampa.Utils.putScriptAsync(enabledPlugins);  
        }  
    }  
      
    function setupPluginSettings() {  
        if (!Lampa.SettingsApi) return;  
          
        Lampa.SettingsApi.addComponent({  
            component: 'my_plugins',  
            name: 'Плагины',  
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'  
        });  
          
        Lampa.SettingsApi.addParam({  
            component: 'my_plugins',  
            param: {  
                name: 'reload_app',  
                type: 'button'  
            },  
            field: {  
                name: 'Перезагрузить приложение',  
                description: 'Перезагрузить приложение для применения изменений в плагинах'  
            },  
            onChange: () => window.location.reload()  
        });  
          
        plugins.forEach(plugin => {  
            const pluginId = getPluginId(plugin.name);  
              
            Lampa.SettingsApi.addParam({  
                component: 'my_plugins',  
                param: {  
                    name: pluginId,  
                    type: 'trigger',  
                    default: true  
                },  
                field: {  
                    name: plugin.name,  
                    description: plugin.description  
                },  
                onChange: (value) => Lampa.Storage.set(pluginId, value)  
            });  
        });  
    }  
      
    // Инициализация  
    function initialize() {  
        if (!window.Lampa || !Lampa.Storage || !Lampa.Utils) return;  
          
        loadPlugins();  
        setupPluginSettings();  
          
        // Блок настроек торрентов перемещен в конец  
        window.lampa_settings.torrents_use = true;    // Включить торрент-раздел и кнопку торрентов  
        window.lampa_settings.demo = false;           // Отключить демонстрационный режим  
        window.lampa_settings.read_only = false;      // Отключить режим только для чтения (включает кнопки онлайн и расширений)  
    }  
      
    if (window.appready) {  
        initialize();  
    } else if (window.Lampa) {  
        Lampa.Listener.follow('app', (event) => {  
            if (event.type === 'ready') {  
                initialize();  
            }  
        });  
    }  
})();    window.lampa_settings.torrents_use = true;    // Включить торрент-раздел и кнопку торрентов  
    window.lampa_settings.demo = false;           // Отключить демонстрационный режим  
    window.lampa_settings.read_only = false;      // Отключить режим только для чтения (включает кнопки онлайн и расширений)  
      
    // Основная функция применения твиков  
    function run() {  
        // Уничтожаем менеджер рекламы, если он существует  
        Lampa.AdManager?.destroy();  
          
        // Удаляем все рекламные блоки со страницы  
        $('.ad-video-block, [class*="ad-"], .ad_plugin').remove();  
          
        // Модифицируем функцию воспроизведения плеера  
        if (Lampa.Player?.play) {  
            const originalPlay = Lampa.Player.play;  
            Lampa.Player.play = function(data) {  
                // Устанавливаем флаг IPTV и удаляем рекламные параметры  
                data.iptv = true;  
                delete data.vast_url;  
                delete data.vast_msg;  
                return originalPlay.call(this, data);  
            };  
        }  
          
        // Удаляем кнопку ЕЩЁ в полной карточке, т.как она после отключений - пустая   
        Lampa.Listener.follow('full', (event) => {  
            if (event.type === 'complite') {  
                $('.button--options').remove();  
            }  
        });  
          
        // Удаляем иконки уведомлений  
        $('.head__action.open--notice, .head__action.notice--icon').remove();  
          
        // Отключаем счетчик уведомлений, если он существует  
        if (Lampa.Notice?.drawCount) {  
            Lampa.Notice.drawCount = () => {};  
        }  
          
        // Удаляем кнопки премиум функций и другие элементы  
        $('.head__action.open--premium, .head__action.open--feed, .head__action.open--broadcast, .black-friday__button').remove();  
          
        // Функция для удаления истории просмотра и фокуса на первом торренте  
        const removeWatchedHistory = () => {  
            $('.watched-history').remove();  
            const firstTorrent = $('.torrent-item').first();  
            if (firstTorrent.length) {  
                Lampa.Controller.collectionFocus(firstTorrent, $('.scroll').first());  
            }  
        };  
          
        // Запускаем удаление истории сразу  
        removeWatchedHistory();  
          
        // Устанавливаем наблюдатель за изменениями DOM для автоматического удаления истории  
        new MutationObserver(removeWatchedHistory).observe(document.body, {  
            childList: true,  
            subtree: true  
        });  
          
        // Добавляем стили для улучшения отображения сидов и раздач (размер цифр)  
        $('body').append('<style>.torrent-item__seeds span,.torrent-item__grabs span{font-weight:800;font-size:1.25em}</style>');  
    }  
      
    if (window.appready) {  
        run();  
    } else {  
        Lampa.Listener.follow('app', (event) => {  
            if (event.type === 'ready') {  
                run();  
            }  
        });  
    }  
})();    
    // Основная функция применения твиков
    function run() {
        // Уничтожаем менеджер рекламы, если он существует
        Lampa.AdManager?.destroy();
        
        // Удаляем все рекламные блоки со страницы
        $('.ad-video-block, [class*="ad-"], .ad_plugin').remove();
        
        // Модифицируем функцию воспроизведения плеера
        if (Lampa.Player?.play) {
            const originalPlay = Lampa.Player.play;
            Lampa.Player.play = function(data) {
                // Устанавливаем флаг IPTV и удаляем рекламные параметры
                data.iptv = true;
                delete data.vast_url;
                delete data.vast_msg;
                return originalPlay.call(this, data);
            };
        }
        
        // Удаляем кнопку ЕЩЁ в полной карточке, т.к. она после отключений - пустая 
        Lampa.Listener.follow('full', (event) => {
            if (event.type === 'complite') {
                $('.button--options').remove();
            }
        });
        
        // Удаляем иконки уведомлений
        $('.head__action.open--notice, .head__action.notice--icon').remove();
        
        // Отключаем счетчик уведомлений, если он существует
        if (Lampa.Notice?.drawCount) {
            Lampa.Notice.drawCount = () => {};
        }
        
        // Удаляем кнопки премиум функций и другие элементы
        $('.head__action.open--premium, .head__action.open--feed, .head__action.open--broadcast, .black-friday__button').remove();
        
        // Функция для удаления истории просмотра и фокуса на первом торренте
        const removeWatchedHistory = () => {
            $('.watched-history').remove();
            const firstTorrent = $('.torrent-item').first();
            if (firstTorrent.length) {
                Lampa.Controller.collectionFocus(firstTorrent, $('.scroll').first());
            }
        };
        
        // Запускаем удаление истории сразу
        removeWatchedHistory();
        
        // Устанавливаем наблюдатель за изменениями DOM для автоматического удаления истории
        new MutationObserver(removeWatchedHistory).observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Добавляем стили для улучшения отображения сидов и раздач (размер цифр)
        $('body').append('<style>.torrent-item__seeds span,.torrent-item__grabs span{font-weight:800;font-size:1.25em}</style>');
    }
    
    if (window.appready) {
        run();
    } else {
        Lampa.Listener.follow('app', (event) => {
            if (event.type === 'ready') {
                run();
            }
        });
    }
})();    
    // Основная функция применения твиков
    function run() {
        // Уничтожаем менеджер рекламы, если он существует
        Lampa.AdManager?.destroy();
        
        // Удаляем все рекламные блоки со страницы
        $('.ad-video-block, [class*="ad-"], .ad_plugin').remove();
        
        // Модифицируем функцию воспроизведения плеера
        if (Lampa.Player?.play) {
            const originalPlay = Lampa.Player.play;
            Lampa.Player.play = function(data) {
                // Устанавливаем флаг IPTV и удаляем рекламные параметры
                data.iptv = true;
                delete data.vast_url;
                delete data.vast_msg;
                return originalPlay.call(this, data);
            };
        }
        
        // Удаляем кнопку ЕЩЁ в полной карточке, т.как она после отключений - пустая 
        Lampa.Listener.follow('full', (event) => {
            if (event.type === 'complite') {
                $('.button--options').remove();
            }
        });
        
        // Удаляем иконки уведомлений
        $('.head__action.open--notice, .head__action.notice--icon').remove();
        
        // Отключаем счетчик уведомлений, если он существует
        if (Lampa.Notice?.drawCount) {
            Lampa.Notice.drawCount = () => {};
        }
        
        // Удаляем кнопки премиум функций и другие элементы
        $('.head__action.open--premium, .head__action.open--feed, .head__action.open--broadcast, .black-friday__button').remove();
        
        // Функция для удаления истории просмотра и фокуса на первом торренте
        const removeWatchedHistory = () => {
            $('.watched-history').remove();
            const firstTorrent = $('.torrent-item').first();
            if (firstTorrent.length) {
                Lampa.Controller.collectionFocus(firstTorrent, $('.scroll').first());
            }
        };
        
        // Запускаем удаление истории сразу
        removeWatchedHistory();
        
        // Устанавливаем наблюдатель за изменениями DOM для автоматического удаления истории
        new MutationObserver(removeWatchedHistory).observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Добавляем стили для улучшения отображения сидов и раздач (размер цифр)
        $('body').append('<style>.torrent-item__seeds span,.torrent-item__grabs span{font-weight:800;font-size:1.25em}</style>');
    }
    
    if (window.appready) {
        run();
    } else {
        Lampa.Listener.follow('app', (event) => {
            if (event.type === 'ready') {
                run();
            }
        });
    }
})();                return originalPlay.call(this, data);
            };
        }
        
        // Удаляем кнопку ЕЩЁ в полной карточке, т.как она после отключений - пустая 
        Lampa.Listener.follow('full', (event) => {
            if (event.type === 'complite') {
                $('.button--options').remove();
            }
        });
        
        // Удаляем иконки уведомлений
        $('.head__action.open--notice, .head__action.notice--icon').remove();
        
        // Отключаем счетчик уведомлений, если он существует
        if (Lampa.Notice?.drawCount) {
            Lampa.Notice.drawCount = () => {};
        }
        
        // Удаляем кнопки премиум функций и другие элементы
        $('.head__action.open--premium, .head__action.open--feed, .head__action.open--broadcast, .black-friday__button').remove();
        
        // Функция для удаления истории просмотра и фокуса на первом торренте
        const removeWatchedHistory = () => {
            $('.watched-history').remove();
            const firstTorrent = $('.torrent-item').first();
            if (firstTorrent.length) {
                Lampa.Controller.collectionFocus(firstTorrent, $('.scroll').first());
            }
        };
        
        // Запускаем удаление истории сразу
        removeWatchedHistory();
        
        // Устанавливаем наблюдатель за изменениями DOM для автоматического удаления истории
        new MutationObserver(removeWatchedHistory).observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Добавляем стили для улучшения отображения сидов и раздач (размер цифр)
        $('body').append('<style>.torrent-item__seeds span,.torrent-item__grabs span{font-weight:800;font-size:1.25em}</style>');
    }
    
    if (window.appready) {
        run();
    } else {
        Lampa.Listener.follow('app', (event) => {
            if (event.type === 'ready') {
                run();
            }
        })();
