(function() {  
    'use strict';  
  
    if (window.switchTorrServer) return;  
    window.switchTorrServer = true;  
  
    const randomTorrUrl = 'http://185.87.48.42:8090/random_torr';  
    const serverIcon = '<img src="./img/icons/settings/server.svg" />';  
    const successMessage = ip => `TorrServer изменён http://${ip}:8090`;  
    const errorMessage = 'TorrServer недоступен';  
      
    const style = document.createElement('style');  
    style.textContent = '.head__action.switch-server.focus img,.head__action.switch-server.hover img{-webkit-filter:brightness(0.3);filter:brightness(0.3)}';  
    document.head.appendChild(style);  
  
    const switchServer = () => {  
        const xhr = new XMLHttpRequest();  
        xhr.open('GET', randomTorrUrl);  
        xhr.onload = () => {  
            const ip = xhr.status === 200 ? xhr.responseText?.trim() : '';  
            if (ip) {  
                Lampa.Storage.set('torrserver_url_two', `http://${ip}:8090`);  
                Lampa.Noty.show(successMessage(ip));  
            } else {  
                Lampa.Noty.show(errorMessage);  
            }  
        };  
        xhr.onerror = () => Lampa.Noty.show(errorMessage);  
        xhr.send();  
    };  
  
    const addButton = () => {  
        if (!Lampa.Storage.field('internal_torrclient') || Lampa.Storage.get('torrserver_use_link') !== 'two') return;  
          
        const button = Lampa.Head.addIcon(serverIcon, switchServer).addClass('switch-server');  
        const toggleButton = () => button.toggle(Lampa.Activity.active()?.component === 'torrents');  
          
        Lampa.Storage.listener.follow('change', e => {  
            if (e.name === 'activity') {  
                toggleButton();  
                if (Lampa.Activity.active()?.component === 'torrents') {  
                    switchServer();  
                }  
            }  
        });  
          
        toggleButton();  
    };  
  
    if (window.appready) {  
        addButton();  
    } else {  
        Lampa.Listener.follow('app', e => {  
            if (e.type === 'ready') addButton();  
        });  
    }  
})();
