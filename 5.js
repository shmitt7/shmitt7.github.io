(function() {  
    'use strict';  
    if (!window.liteTweaks) window.liteTweaks = {};  
  
    // === БЛОК 1: Отключение функций до запуска Лампы ===  
    Object.assign(window.lampa_settings, {  
        disable_features: {  
            dmca: true,  
            lgbt: true,  
            ai: true,  
            subscribe: true,  
            blacklist: true,  
            persons: true,  
            ads: true,  
            install_proxy: true,  
            remote_configuration: true,  
        },  
        torrents_use: true,  
        feed: false,  
        services: false,  
        lang_use: false,  
        white_use: false,  
        read_only: false,  
        demo: false,  
        dcma: false,  
    });  
    window.plugin_shots_ready = true;  
  
    function run() {  
        if (window.liteTweaks._started) return;  
        window.liteTweaks._started = true;  
  
        // === БЛОК 2: Удаление кнопок ===  
        // Шапка  
        $('.head__action.open--notice, .head__action.notice--icon').remove();  
        $('.head__action.open--premium, .head__action.open--feed, .head__action.open--broadcast, .head__action.open--profile').remove();  
        $('.black-friday__button').remove();  
        if (Lampa.Notice?.drawCount) Lampa.Notice.drawCount = () => {};  
  
        // Меню: убираем ненужные пункты  
        $('.menu [data-action="catalog"], .menu [data-action="relise"], .menu [data-action="timetable"], .menu [data-action="mytorrents"], .menu [data-action="about"]').remove();  
        // Перемещаем "Редактировать" в блок с настройками и убираем пустой блок  
        const editItem = $('.menu [data-action="edit"]').detach();  
        $('.menu .nosort:first .menu__list').append(editItem);  
        const lastNosort = $('.menu .nosort:last');  
        lastNosort.prev('.menu__split').remove();  
        lastNosort.remove();  
  
        // Кнопка "Опции" в карточке  
        Lampa.Listener.follow('full', (e) => {  
            if (e.type === 'complite') {  
                e.object.activity.render().find('.button--options').remove();  
            }  
        });  
  
        // === БЛОК 3: Удаление рекламы ===  
        Lampa.AdManager?.destroy();  
        $('.ad-video-block, [class*="ad-"], .ad_plugin').remove();  
        if (Lampa.Player?.play) {  
            const originalPlay = Lampa.Player.play;  
            Lampa.Player.play = function(data) {  
                data.iptv = true;  
                delete data.vast_url;  
                delete data.vast_msg;  
                return originalPlay.call(this, data);  
            };  
        }  
    }  
  
    if (window.appready) run();  
    else Lampa.Listener.follow('app', (e) => { if (e.type === 'ready') run(); });  
})();
