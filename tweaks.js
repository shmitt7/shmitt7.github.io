(function() {  
    if (window.twi) return;  
    window.lampaPlugins = true;  
    window.plugin_shots_ready = true;  
    var NON_LATIN_CYR = /[\u0530-\u06FF\u0900-\u0FFF\u1000-\u11FF\u1780-\u18AF\u3040-\u30FF\u31F0-\u31FF\u4E00-\u9FFF\uA960-\uA97F\uAC00-\uD7FF\uFF66-\uFF9F]/;  
    var CYRILLIC = /[\u0400-\u04FF]/;  
    Lampa.Listener.follow('request_secuses', function(request) {  
        if (request.data && Array.isArray(request.data.results))  
            request.data.results = request.data.results.filter(function(item) {  
                var title = item.title || item.name || '';  
                var lang = item.original_language;  
                if (lang === 'en' || lang === 'ru') return !NON_LATIN_CYR.test(title);  
                return CYRILLIC.test(title);  
            });  
    });  
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
