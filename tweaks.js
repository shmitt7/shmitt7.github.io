(function() {  
    if (window.cleanTweaks) return;  
    window.cleanTweaks = true;  
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
    function run() {  
        document.head.insertAdjacentHTML('beforeend', '<style>.head .open--broadcast,.head .open--profile,.head .notice--icon{display:none!important}.menu [data-action="catalog"],.menu [data-action="relise"],.menu [data-action="timetable"],.menu [data-action="about"],.menu [data-action="mytorrents"]{display:none!important}.button--options{display:none!important}</style>');  
        var editItem = $('.menu [data-action="edit"]').detach();  
        $('.menu .nosort:first .menu__list').append(editItem);  
        var lastNosort = $('.menu .nosort:last');  
        lastNosort.prev('.menu__split').remove();  
        lastNosort.remove();  
    }  
    if (window.appready) run();  
    else Lampa.Listener.follow('app', function(event) {  
        if (event.type === 'ready') run();  
    });  
})();
