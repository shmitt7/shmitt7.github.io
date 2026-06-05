(function() {  
    'use strict';  
    if (window.switchTorrServer) return;  
    window.switchTorrServer = true;  
    document.head.insertAdjacentHTML('beforeend', '<style>.head__action.switch-server.focus img,.head__action.switch-server.hover img{-webkit-filter:brightness(0.3);filter:brightness(0.3)}</style>');  
    const switchServer = () => {  
        const xhr = new XMLHttpRequest();  
        xhr.open('GET', 'http://185.87.48.42:8090/random_torr');  
        xhr.onload = () => {  
            const ip = xhr.status === 200 ? xhr.responseText.trim() : '';  
            if (ip) {  
                Lampa.Storage.set('torrserver_url_two', `http://${ip}:8090`);  
                Lampa.Noty.show(`TorrServer изменён http://${ip}:8090`);  
            } else {  
                Lampa.Noty.show('TorrServer недоступен');  
            }  
        };  
        xhr.onerror = () => Lampa.Noty.show('TorrServer недоступен');  
        xhr.send();  
    };  
    const addButton = () => {  
        if (!Lampa.Storage.field('internal_torrclient') || Lampa.Storage.get('torrserver_use_link') !== 'two') return;  
        const button = Lampa.Head.addIcon('<img src="./img/icons/settings/server.svg" />', switchServer).addClass('switch-server');  
        Lampa.Listener.follow('activity', (e) => {  
            if (e.type !== 'start') return;  
            button.toggle(e.component === 'torrents');  
            if (e.component === 'torrents') switchServer();  
        });  
        button.toggle(Lampa.Activity.active()?.component === 'torrents');  
    };  
    if (window.appready) addButton();  
    else Lampa.Listener.follow('app', (e) => { if (e.type === 'ready') addButton(); });  
})();
