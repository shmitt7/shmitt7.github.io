(function() {  
    'use strict';  
    if (window.torrentParser) return;  
    window.torrentParser = true;  
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
    let switchTimer;  
    let focusTimer;  
    const parseServer = s => { const p = s.split('='); return { url: p[0], key: p[1] || '' }; };  
    const switchServer = (serverString) => {  
        const activity = Lampa.Activity.active();  
        if (!activity) return;  
        const srv = parseServer(serverString);  
        const originalUrl = Lampa.Storage.get('jackett_url', '');  
        const originalKey = Lampa.Storage.get('jackett_key', '');  
        Lampa.Storage.set('jackett_url', srv.url);  
        Lampa.Storage.set('jackett_key', srv.key);  
        Lampa.Storage.set('jackett_interview', 'healthy');  
        Lampa.Activity.replace({ url: '', title: `Торренты - ${srv.url}`, component: 'torrents', search: activity.search, movie: activity.movie, page: 1 });  
        clearTimeout(switchTimer);  
        switchTimer = setTimeout(() => {  
            Lampa.Storage.set('jackett_url', originalUrl);  
            Lampa.Storage.set('jackett_key', originalKey);  
        }, 1000);  
    };  
    const showServerSelector = () => {  
        const mainServer = Lampa.Storage.get('jackett_main_server', '');  
        Lampa.Select.show({  
            title: '',  
            items: [  
                { title: 'Короткий тап - поиск | Долгий тап - сделать основным', separator: true },  
                ...JACKETT_SERVERS.map((s, i) => {  
                    const srv = parseServer(s);  
                    return { title: `${i + 1}. ${srv.url}${srv.key ? ` (${srv.key})` : ''}${mainServer === s ? ' ★' : ''}`, serverString: s };  
                })  
            ],  
            onSelect: (sel) => { if (sel?.serverString) switchServer(sel.serverString); },  
            onLong: (sel) => {  
                if (!sel?.serverString) return;  
                const srv = parseServer(sel.serverString);  
                Lampa.Storage.set('jackett_url', srv.url);  
                Lampa.Storage.set('jackett_key', srv.key);  
                Lampa.Storage.set('jackett_main_server', sel.serverString);  
                showServerSelector();  
            },  
            onBack: () => Lampa.Controller.toggle('head')  
        });  
    };  
    Lampa.Listener.follow('activity', function(e) {  
        if (e.component !== 'bookmarks' || e.type !== 'start') return;  
        setTimeout(function() {  
            var line = document.querySelector('.activity--active .items-line');  
            if (!line) return;  
            var body = line.querySelector('.scroll__body');  
            if (body.querySelector('.torrents-btn')) return;  
            var btn = document.createElement('div');  
            btn.className = 'register layer--render layer--visible register--line selector torrents-btn';  
            btn.setAttribute('data-action', 'mytorrents');  
            var name = document.createElement('div');  
            name.className = 'register__name';  
            name.textContent = 'Торренты';  
            btn.appendChild(name);  
            var counter = document.createElement('div');  
            counter.className = 'register__counter';  
            btn.appendChild(counter);  
            btn.addEventListener('hover:enter', () => Lampa.Router.call('mytorrents', { title: 'Торренты' }));  
            body.appendChild(btn);  
            Lampa.Controller.collectionAppend(btn);  
            Lampa.Torserver.my(r => counter.textContent = r.length, () => counter.textContent = 0);  
        }, 0);  
    });  
    const addHeaderButton = () => {  
        const icon = Lampa.Head.addIcon('<svg><use xlink:href="#sprite-torrent"></use></svg>', showServerSelector);  
        icon.addClass('jackett-servers-selector');  
        icon.hide();  
        Lampa.Listener.follow('activity', (e) => {  
            if (e.type !== 'start') return;  
            const isTorrents = e.component === 'torrents';  
            icon[isTorrents ? 'show' : 'hide']();  
            if (!isTorrents) return;  
            const movie = e.object?.movie;  
            document.querySelector('.activity--active')?.classList.toggle('torrents--serial', !!(movie && movie.number_of_seasons));  
        });  
        Lampa.Listener.follow('torrent', (e) => {  
            if (e.type !== 'render') return;  
            const movie = Lampa.Activity.active()?.movie;  
            if (movie && movie.number_of_seasons) return;  
            clearTimeout(focusTimer);  
            focusTimer = setTimeout(() => {  
                const first = $('.activity--active .torrent-item').first();  
                if (first.length) Lampa.Controller.collectionFocus(first[0], $('.activity--active .scroll')[0]);  
            }, 0);  
        });  
        $('head').append('<style>.torrent-item__seeds span,.torrent-item__grabs span{font-weight:800;font-size:1.25em}.torrent-list .watched-history{display:none}.torrents--serial .torrent-list .watched-history{display:flex}</style>');  
    };  
    if (Lampa.Manifest?.plugins) Lampa.Manifest.plugins.unshift({  
        type: 'video',  
        name: 'Парсер',  
        subtitle: 'Смотреть торрент',  
        onContextMenu: () => {},  
        onContextLauch: (object) => { Lampa.Activity.push({ component: 'torrents', search: object.title, movie: object, clarification: true }); }  
    });  
    if (window.appready) addHeaderButton();  
    else Lampa.Listener.follow('app', (e) => { if (e.type === 'ready') addHeaderButton(); });  
})();
