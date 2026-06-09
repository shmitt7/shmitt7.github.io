(function () {  
    'use strict';  
  
    // Символы нелатинских/некириллических скриптов:  
    // CJK (китайский, японский), Хангыль (корейский),  
    // Деванагари + индийские письмена, Арабский,  
    // Тайский, Лаосский, Бирманский, Кхмерский  
    var NON_RU_EN = /[\u0600-\u06FF\u0900-\u0DFF\u0E00-\u0EFF\u1000-\u109F\u1780-\u17FF\u3040-\u30FF\u31F0-\u31FF\u4E00-\u9FFF\uAC00-\uD7AF\uFF66-\uFF9F]/;  
  
    function hasUntranslatedTitle(item) {  
        // Берём отображаемое название (локализованное), а не оригинальное  
        var title = item.title || item.name || '';  
        return NON_RU_EN.test(title);  
    }  
  
    function shouldApplyFilter(url) {  
        return url.indexOf('/search') === -1  
            && url.indexOf('/person/') === -1;  
    }  
  
    function initPlugin() {  
        if (window._cf_title_plugin_loaded) return;  
        window._cf_title_plugin_loaded = true;  
  
        Lampa.SettingsApi.addComponent({  
            component: 'content_filter',  
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36"><path fill="white" d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg>',  
            name: 'Фильтр контента'  
        });  
  
        Lampa.SettingsApi.addParam({  
            component: 'content_filter',  
            param: { name: 'cf_hide_untranslated', type: 'trigger', default: false },  
            field: {  
                name: 'Скрыть непереведённые карточки',  
                description: 'Скрывает карточки, название которых не переведено на русский или английский (написано иероглифами, арабским, деванагари и т.д.)'  
            }  
        });  
  
        Lampa.Listener.follow('request_secuses', function (req) {  
            if (!req.params || !req.params.url) return;  
            if (!req.data || !Array.isArray(req.data.results)) return;  
            if (!shouldApplyFilter(req.params.url)) return;  
            if (!Lampa.Storage.field('cf_hide_untranslated')) return;  
  
            req.data.results = req.data.results.filter(function (item) {  
                return !hasUntranslatedTitle(item);  
            });  
        });  
    }  
  
    if (window.appready) initPlugin();  
    else Lampa.Listener.follow('app', function (e) {  
        if (e.type === 'ready') initPlugin();  
    });  
})();
