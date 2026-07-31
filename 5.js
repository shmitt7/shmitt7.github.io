(function () {  
    if (window.plugin_force_inner_torrent_ready) return;  
    window.plugin_force_inner_torrent_ready = true;  
  
    if (!Lampa.Platform.is('android')) return;  
  
    function init() {  
        // 1) Добавляем пункт в настройки — просто для UI и хранения выбора пользователя  
        Lampa.SettingsApi.addParam({  
            component: 'player',  
            param: {  
                name: 'force_inner_torrent_player',  
                type: 'trigger',  
                default: false  
            },  
            field: {  
                name: 'Встроенный плеер для торрентов (обход ограничения)',  
            }  
        });  
  
        // 2) Патчим Lampa.Player.play — единственная публичная точка входа,  
        // которая гарантированно вызывается ДО Player.start() для торрент-файлов  
        var original_play = Lampa.Player.play;  
  
        Lampa.Player.play = function (data) {  
            if (Lampa.Storage.field('force_inner_torrent_player') && data && data.torrent_hash) {  
                data = Object.assign({}, data, {  
                    torrent_hash: null,   // убираем условие data.torrent_hash && !gstWork()  
                    launch_player: 'inner' // форсируем ветку launchInner() в start()  
                });  
            }  
            return original_play.apply(this, arguments);  
        };  
    }  
  
    if (window.appready) init();  
    else Lampa.Listener.follow('app', function (e) {  
        if (e.type == 'ready') init();  
    });  
})();
