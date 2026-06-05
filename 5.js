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
    let switchTimer = null;
    let _removeHistoryTimer = null;
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
            const displayTitle = `${index + 1}. ${server.url}` + (server.key ? ` (${server.key})` : '') + (mainServer === serverString ? ' ★' : '');
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
            btn.addEventListener('hover:enter', function() {
                Lampa.Router.call('mytorrents', { title: 'Торренты' });
            });
            body.appendChild(btn);
            Lampa.Controller.collectionAppend(btn);
            Lampa.Torserver.my(function(result) {
                counter.textContent = result.length;
            }, function() {
                counter.textContent = '0';
            });
        }, 0);
    });
    const addHeaderButton = () => {
        const icon = Lampa.Head.addIcon(
            '<svg><use xlink:href="#sprite-torrent"></use></svg>',
            showServerSelector
        );
        icon.addClass('jackett-servers-selector');
        icon.hide();
        Lampa.Listener.follow('activity', (e) => {
            if (e.type === 'start') icon[e.component === 'torrents' ? 'show' : 'hide']();
        });
        Lampa.Listener.follow('torrent', (e) => {
            if (e.type !== 'render') return;
            const movie = Lampa.Activity.active()?.movie;
            if (movie && movie.number_of_seasons) return;
            clearTimeout(_removeHistoryTimer);
            _removeHistoryTimer = setTimeout(() => {
                const wh = $('.activity--active .watched-history');
                if (!wh.length) return;
                wh.remove();
                const first = $('.activity--active .torrent-item').first();
                if (first.length) Lampa.Controller.collectionFocus(first[0], $('.activity--active .scroll')[0]);
            }, 0);
        });
        $('head').append('<style>.torrent-item__seeds span,.torrent-item__grabs span{font-weight:800;font-size:1.25em}</style>');
    };
    if (Lampa.Manifest?.plugins) Lampa.Manifest.plugins.unshift({
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
    if (window.appready) {
        addHeaderButton();
    } else {
        Lampa.Listener.follow('app', (e) => {
            if (e.type === 'ready') addHeaderButton();
        });
    }
})();
