(function() {  
    if (window.switchTorrServer) return;  
    window.switchTorrServer = true;  
    document.head.insertAdjacentHTML('beforeend', '<style>.head__action.switch-server.focus img,.head__action.switch-server.hover img{-webkit-filter:brightness(0.3);filter:brightness(0.3)}</style>');  
    var switchServer = function() {  
        var xhr = new XMLHttpRequest();  
        xhr.open('GET', 'http://185.87.48.42:8090/random_torr');  
        xhr.onload = function() {  
            var ip = xhr.status === 200 ? xhr.responseText.trim() : '';  
            if (ip) {  
                Lampa.Storage.set('torrserver_url_two', 'http://' + ip + ':8090');  
                Lampa.Noty.show('TorrServer изменён http://' + ip + ':8090');  
            } else {  
                Lampa.Noty.show('TorrServer недоступен');  
            }  
        };  
        xhr.onerror = function() { Lampa.Noty.show('TorrServer недоступен'); };  
        xhr.send();  
    };  
    var addButton = function() {  
        if (!Lampa.Storage.field('internal_torrclient') || Lampa.Storage.get('torrserver_use_link') !== 'two') return;  
        var button = Lampa.Head.addIcon('<img src="./img/icons/settings/server.svg" />', switchServer).addClass('switch-server');  
        Lampa.Listener.follow('activity', function(e) {  
            if (e.type !== 'start') return;  
            button.toggle(e.component === 'torrents');  
            if (e.component === 'torrents') switchServer();  
        });  
        var _active = Lampa.Activity.active();  
        button.toggle(_active && _active.component === 'torrents');  
    };  
    if (window.appready) addButton();  
    else Lampa.Listener.follow('app', function(e) { if (e.type === 'ready') addButton(); });  
})();
