(function() {  
    'use strict';  
  
    if (window.torrentParser) return;  
    window.torrentParser = true;  
  
    // Список серверов Jackett, формат 'адрес=ключ'  
    const JACKETT_SERVERS = [  
        'jac.red',  
        '87.120.84.218:8443=777',  
        'jacred.stream=pp',  
        'ru.jacred.stream=pp',  
        'jr.maxvol.pro',  
        'jacred.pro',  
        'jac-red.ru',  
        'jacblack.ru:9117',  
        'ru.jacred.pro',  
        'jacred.freebie.tom.ru=1',  
        'nmjc.duckdns.org',  
    ];  
  
    let switchTimer = null;  
  
    const parseServer = (serverString) => {  
        const parts = serverString.split('=');  
        return { url: parts[0], key: parts[1] || '' };  
    };  
  
    const switchServer = (serverString) => {  
        const activity = Lampa.Activity.active();  
        if (!activity) return;  
  
        const server = parseServer(serverString);  
        const originalUrl = Lampa.Storage.get('jackett_url', '');  
        const originalKey = Lampa.Storage.get('jackett_key', '');  
          
        Lampa.Storage.set('jackett_url', server.url);  
        Lampa.Storage.set('jackett_key', server.key);  
        Lampa.Storage.set('jackett_interview', 'healthy');  
          
        Lampa.Activity.replace({  
            url: '',  
            title: `Торренты - ${server.url}`,  
            component: 'torrents',  
            search: activity.search,  
            movie: activity.movie,  
            page: 1  
        });  
  
        if (switchTimer) clearTimeout(switchTimer);  
          
        switchTimer = setTimeout(() => {  
            Lampa.Storage.set('jackett_url', originalUrl);  
            Lampa.Storage.set('jackett_key', originalKey);  
            switchTimer = null;  
        }, 1000);  
    };  
  
    const showServerSelector = () => {  
        const mainServer = Lampa.Storage.get('jackett_main_server', '');  
          
        const items = [  
            { title: 'Короткий тап - поиск | Долгий тап - сделать основным', separator: true }  
        ];  
  
        JACKETT_SERVERS.forEach((serverString, index) => {  
            const server = parseServer(serverString);  
            const displayTitle = `${index + 1}. ${server.url}` +   
                                (server.key ? ` (${server.key})` : '') +   
                                (mainServer === serverString ? ' ★' : '');  
              
            items.push({ title: displayTitle, serverString });  
        });  
  
        Lampa.Select.show({  
            title: '',  
            items,  
            onSelect: (selected) => {  
                if (selected?.serverString) switchServer(selected.serverString);  
            },  
            onLong: (selected) => {  
                if (selected?.serverString) {  
                    const server = parseServer(selected.serverString);  
                    Lampa.Storage.set('jackett_url', server.url);  
                    Lampa.Storage.set('jackett_key', server.key);  
                    Lampa.Storage.set('jackett_main_server', selected.serverString);  
                    showServerSelector();  
                }  
            },  
            onBack: () => Lampa.Controller.toggle('head')  
        });  
    };  
  
    // Добавление кнопки в шапку  
    const addHeaderButton = () => {  
        const icon = Lampa.Head.addIcon(  
            '<svg><use xlink:href="#sprite-torrent"></use></svg>',  
            showServerSelector  
        );  
          
        icon.addClass('jackett-servers-selector');  
        icon.hide();  
  
        Lampa.Listener.follow('activity', (e) => {  
            if (e.type === 'start') {  
                icon[e.component === 'torrents' ? 'show' : 'hide']();  
            }  
        });  
    };  
  
    // Добавление пункта в меню Действие  
    Lampa.Manifest.plugins.unshift({  
        type: 'video',  
        name: 'Парсер',  
        subtitle: 'Смотреть торрент',  
        onContextMenu: () => {},  
        onContextLauch: (object) => {  
            Lampa.Activity.push({  
                component: 'torrents',  
                search: object.title,  
                movie: object,  
                clarification: true  
            });  
        }  
    });  
      
    // Инициализация  
    if (window.appready) {  
        addHeaderButton();  
    } else {  
        Lampa.Listener.follow('app', (e) => {  
            if (e.type === 'ready') addHeaderButton();  
        });  
    }  
})();
