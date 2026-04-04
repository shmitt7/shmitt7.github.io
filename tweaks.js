(function() {
    'use strict';
    
    if (!window.liteTweaks) {
        window.liteTweaks = {};
    }
    
    Object.assign(window.lampa_settings, {
        // Отключаем различные функции приложения
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
    
    // Для появления пунктов Парсер и Torrserver
    window.lampa_settings.torrents_use = true;    // Включить торрент-раздел и кнопку торрентов
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
