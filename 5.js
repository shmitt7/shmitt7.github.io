(function () {  
    'use strict';  
  
    // Regex: все нелатинские скрипты — иероглифы, индийские письмена, арабский, тайский и т.д.  
    var NON_LATIN_SCRIPT = /[\u0600-\u06FF\u0900-\u0DFF\u0E00-\u0EFF\u1000-\u109F\u1780-\u17FF\u3040-\u30FF\u31F0-\u31FF\u4E00-\u9FFF\uAC00-\uD7AF\uFF66-\uFF9F]/;  
  
    function hasNonLatinTitle(item) {  
        // Проверяем оригинальное название (то, что хранит TMDB на языке страны производства)  
        var title = item.original_title || item.original_name || '';  
        return NON_LATIN_SCRIPT.test(title);  
    }  
  
    function shouldApplyFilter(url) {  
        return url.indexOf('/search') === -1  
            && url.indexOf('/person/') === -1;  
    }  
  
    function initPlugin() {  
        if (window._cf_script_plugin_loaded) return;  
        window._cf_script_plugin_loaded = true;  
  
        Lampa.SettingsApi.addComponent({  
            component: 'content_filter',  
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36"><path fill="white" d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg>',  
            name: 'Фильтр контента'  
        });  
  
        Lampa.SettingsApi.addParam({  
            component: 'content_filter',  
            param: { name: 'cf_hide_nonlatin', type: 'trigger', default: false },  
            field: {  
                name: 'Скрыть карточки с иероглифами',  
                description: 'Скрывает карточки, оригинальное название которых написано нелатинскими символами (китайские, японские, корейские, индийские, арабские и другие)'  
            }  
        });  
  
        Lampa.Listener.follow('request_secuses', function (req) {  
            if (!req.params || !req.params.url) return;  
            if (!req.data || !Array.isArray(req.data.results)) return;  
            if (!shouldApplyFilter(req.params.url)) return;  
            if (!Lampa.Storage.field('cf_hide_nonlatin')) return;  
  
            req.data.results = req.data.results.filter(function (item) {  
                return !hasNonLatinTitle(item);  
            });  
        });  
    }  
  
    if (window.appready) initPlugin();  
    else Lampa.Listener.follow('app', function (e) {  
        if (e.type === 'ready') initPlugin();  
    });  
})();
