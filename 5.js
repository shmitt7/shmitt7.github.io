(function() {  
    'use strict';  
  
    // Настройки — мержим disable_features отдельно, чтобы не затереть остальные поля  
    Object.assign(window.lampa_settings || (window.lampa_settings = {}), {  
        torrents_use: true, feed: false, services: false,  
        lang_use: false, white_use: false, read_only: false, demo: false,  
    });  
  
    Object.assign(  
        window.lampa_settings.disable_features || (window.lampa_settings.disable_features = {}),  
        { dmca: true, lgbt: true, ai: true, subscribe: true, blacklist: true, persons: true, ads: true, remote_configuration: true }  
    );  
  
    function run() {  
        // Шапка  
        $('.head .open--broadcast, .head .open--profile, .head .notice--icon').remove();  
        if (Lampa.Notice?.drawCount) Lampa.Notice.drawCount = () => {};  
  
        // Меню (только то, что Лампа не убирает сама через настройки)  
        $('.menu [data-action="catalog"], .menu [data-action="relise"], .menu [data-action="timetable"], .menu [data-action="about"]').remove();  
  
        // Переместить edit в первую группу, убрать последнюю группу  
        const editItem = $('.menu [data-action="edit"]').detach();  
        $('.menu .nosort:first .menu__list').append(editItem);  
        const lastNosort = $('.menu .nosort:last');  
        lastNosort.prev('.menu__split').remove();  
        lastNosort.remove();  
  
        // Убрать кнопку options в карточке фильма  
        Lampa.Listener.follow('full', (e) => {  
            if (e.type === 'complite') e.object.activity.render().find('.button--options').remove();  
        });  
    }  
  
    if (window.appready) run();  
    else Lampa.Listener.follow('app', (e) => { if (e.type === 'ready') run(); });  
  
})();
