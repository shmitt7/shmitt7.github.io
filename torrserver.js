(function(){  
    if(window.switchTorrServer) return;  
    window.switchTorrServer = true;  
    var network = new Lampa.Reguest();  
    var button;  
    var styleAdded = false;  
    function addStyle(){  
        if(styleAdded) return;  
        styleAdded = true;  
        document.head.insertAdjacentHTML('beforeend', '<style>.head__action.switch-server.focus img,.head__action.switch-server.hover img{-webkit-filter:brightness(0.3);filter:brightness(0.3)}</style>');  
    }  
    function switchServer(){  
        network.silent('http://185.87.48.42:8090/random_torr', function(response){  
            var ip = response ? String(response).trim() : '';  
            if(ip){  
                Lampa.Storage.set('torrserver_url_two', 'http://' + ip + ':8090');  
                Lampa.Noty.show('TorrServer изменён http://' + ip + ':8090');  
            }  
            else Lampa.Noty.show('TorrServer недоступен');  
        }, function(){  
            Lampa.Noty.show('TorrServer недоступен');  
        }, false, {  
            timeout: 5000,  
            dataType: 'text'  
        });  
    }  
    function isTorrentsActive(){  
        var active = Lampa.Activity.active();  
        return !!(active && active.component === 'torrents');  
    }  
    function canShowButton(){  
        return !!Lampa.Storage.field('internal_torrclient') && Lampa.Storage.get('torrserver_use_link') === 'two';  
    }  
    function updateVisibility(){  
        if(!button) return;  
        var show = canShowButton() && isTorrentsActive();  
        button.toggle(show);  
    }  
    function addButton(){  
        if(!canShowButton()) return;  
        addStyle();  
        button = Lampa.Head.addIcon('<img src="./img/icons/settings/server.svg" />', switchServer).addClass('switch-server');  
        Lampa.Listener.follow('activity', function(e){  
            if(e.type !== 'start') return;  
            updateVisibility();  
            if(isTorrentsActive()) switchServer();  
        });  
        Lampa.Storage.listener.follow('change', function(e){  
            if(e.name === 'internal_torrclient' || e.name === 'torrserver_use_link') updateVisibility();  
        });  
        updateVisibility();  
    }  
    if(window.appready) addButton();  
    else Lampa.Listener.follow('app', function(e){ if(e.type === 'ready') addButton(); });  
})();
