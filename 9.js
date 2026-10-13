(function () {  
    'use strict';  
  
    var CHANNEL_ID   = 'my_plugin_rows';      // попадёт под неймспейс plugin:  
    var CHANNEL_NAME = 'Мои линии';  
  
    // ==== ДАННЫЕ: подставьте свой источник ====  
    // Должна вернуть массив программ для канала.  
    // Идеально — тот же источник, что кормит ваши ContentRows.  
    function collectPrograms() {  
        // пример: берём то же, что отдаёте в линию на главной  
        var items = (window.MyRowsPlugin && window.MyRowsPlugin.getItems)  
            ? window.MyRowsPlugin.getItems()  
            : [];  
  
        return items.map(function (item) {  
            return {  
                title:       item.title || item.name,  
                description: item.overview || '',  
                poster:      item.img || item.poster || '',  
                // навигация: при клике по превью открывается карточка в Lampa  
                navigation: {  
                    action: 'lampa_card',  
                    card: {  
                        id:     item.id,  
                        method: item.method || (item.name ? 'tv' : 'movie'),  
                        source: item.source || 'tmdb'  
                    }  
                }  
            };  
        }).slice(0, 20); // preview-каналы не любят огромные списки  
    }  
  
    // ==== МОСТ ====  
    function bridgeAvailable() {  
        return typeof AndroidJS !== 'undefined' &&  
               typeof AndroidJS.publishPluginChannel === 'function';  
    }  
  
    function publish() {  
        if (!bridgeAvailable()) return false;  
        if (!Lampa.Platform.is('android')) return false;  
  
        var payload = {  
            id:       CHANNEL_ID,  
            title:    CHANNEL_NAME,  
            programs: collectPrograms()  
        };  
  
        var ok = false;  
        try {  
            ok = !!AndroidJS.publishPluginChannel(JSON.stringify(payload));  
        } catch (e) {  
            console.log('TvChannel', 'publish error', e);  
        }  
        return ok; // true = поставлено в очередь, НЕ гарантия публикации  
    }  
  
    function clear() {  
        if (typeof AndroidJS !== 'undefined' &&  
            typeof AndroidJS.clearPluginChannel === 'function') {  
            try { AndroidJS.clearPluginChannel(CHANNEL_ID); } catch (e) {}  
        }  
    }  
  
    // ==== ЖИЗНЕННЫЙ ЦИКЛ ====  
    function startPlugin() {  
        // первичная публикация, когда приложение готово  
        if (Lampa.Listener) {  
            Lampa.Listener.follow('app', function (e) {  
                if (e.type === 'ready') publish();  
            });  
        }  
  
        // пере-публикация при обновлении ваших данных.  
        // Вариант А: ваш плагин линий кидает событие  
        Lampa.Listener.follow('myrows:updated', publish); // пример имени  
  
        // Вариант Б: если данные из избранного/закладок  
        Lampa.Listener.follow('state:changed', function (e) {  
            if (e.target === 'favorite') publish();  
        });  
  
        // очистка при выходе — по контракту PR очистка  
        // сохраняет идентичность канала, пустого канала не создаёт  
        Lampa.Listener.follow('app', function (e) {  
            if (e.type === 'destroy') clear();  
        });  
  
        // публичный API, чтобы основной плагин мог дёрнуть обновление  
        window.MyTvChannel = { publish: publish, clear: clear };  
    }  
  
    if (window.Lampa) startPlugin();  
    else {  
        var t = setInterval(function () {  
            if (window.Lampa) { clearInterval(t); startPlugin(); }  
        }, 200);  
    }  
})();
