(function () {  
    'use strict';  
  
    if (window.plugin_bookchannel_ready) return;  
    window.plugin_bookchannel_ready = true;  
  
    var TAG       = 'BookChannel';  
    var WHERE     = 'book';        // «Запланировано»  
    var MAX_CARDS = 10;  
    var MARK      = 'bcard_';      // пометка наших карточек, чтобы чистить  
  
    function log() {  
        var args = ['[' + TAG + ']'];  
        for (var i = 0; i < arguments.length; i++) {  
            var a = arguments[i];  
            args.push(typeof a === 'object' ? JSON.stringify(a).slice(0, 300) : a);  
        }  
        console.log.apply(console, args);  
    }  
  
    function noty(t) {  
        log(t);  
        try { if (Lampa.Noty) Lampa.Noty.show(TAG + ': ' + t); } catch (e) {}  
    }  
  
    // ---- данные: «Сейчас смотрят» (CUB ?sort=now_playing) ----  
    function fetchNowWatching(onDone) {  
        var domain = (Lampa.Manifest && Lampa.Manifest.cub_domain) || 'cub.red';  
        var proto  = (Lampa.Utils && Lampa.Utils.protocol) ? Lampa.Utils.protocol() : 'https://';  
        var email  = '';  
        try { email = (Lampa.Storage.get('account', '{}') || {}).email || ''; } catch (e) {}  
  
        var u = proto + 'tmdb.' + domain + '/?sort=now_playing&email=' + encodeURIComponent(email);  
        log('fetch:', u);  
  
        var net = new Lampa.Reguest();  
        net.silent(u, function (json) {  
            var n = json && json.results ? json.results.length : 0;  
            log('fetch ok, results:', n);  
            onDone(json && json.results ? json.results : []);  
        }, function (e) {  
            noty('fetch error');  
            log('fetch error:', e);  
            onDone([]);  
        }, false, { cache: { life: 60 * 24 * 2 } });  
    }  
  
    // ---- добавление в избранное «Запланировано» ----  
    function fillBook(items) {  
        if (!items.length) return noty('пустой список — нечего добавлять');  
  
        var added = 0, skipped = 0;  
  
        items.slice(0, MAX_CARDS).forEach(function (item, i) {  
            if (!item.id) return skipped++;  
  
            var card = Lampa.Arrays.clone(item);  
            // уникальный id, чтобы не смешиваться с вашими настоящими закладками  
            card.id       = MARK + item.id;  
            card.source   = card.source || 'cub';  
            card.title    = card.title || card.name || '';  
            card.img      = card.img || (card.poster_path ? 'https://image.tmdb.org/t/p/w500' + card.poster_path : '');  
  
            try {  
                Lampa.Favorite.add(WHERE, card);  
                added++;  
            } catch (e) {  
                log('add error:', e);  
                skipped++;  
            }  
        });  
  
        noty('added=' + added + ' skipped=' + skipped + ' в «Запланировано»');  
        // каждый add() шлёт state:changed {target:'favorite', type:'book'}  
        // -> android.js вызывает AndroidJS.updateChannel('book')  
        // -> канал «Запланировано» на домашнем экране должен обновиться  
    }  
  
    // ---- очистка наших карточек ----  
    function clearBook() {  
        var list = Lampa.Favorite.get({ type: WHERE }) || [];  
        var ours = list.filter(function (c) {  
            return String(c.id).indexOf(MARK) === 0;  
        });  
        ours.forEach(function (c) {  
            try { Lampa.Favorite.remove(WHERE, c); } catch (e) {}  
        });  
        log('cleared:', ours.length);  
        return ours.length;  
    }  
  
    // ---- жизненный цикл ----  
    function run() {  
        var info = {  
            androidJS:  typeof AndroidJS !== 'undefined',  
            version:    '',  
            updateCh:   typeof AndroidJS !== 'undefined' && typeof AndroidJS.updateChannel === 'function',  
            platform:   Lampa.Platform.is('android')  
        };  
        try { if (info.androidJS) info.version = AndroidJS.appVersion(); } catch (e) {}  
        log('env:', info);  
  
        if (!info.platform)   return noty('не android, пропуск');  
        if (!info.updateCh)   return noty('нет AndroidJS.updateChannel');  
  
        fetchNowWatching(fillBook);  
    }  
  
    function start() {  
        Lampa.Listener.follow('app', function (e) {  
            if (e.type === 'ready') setTimeout(run, 3000);  
        });  
  
        // ручное управление из консоли/другого плагина:  
        //   window.BookChannel.fill()   — наполнить «Запланировано»  
        //   window.BookChannel.clear()  — убрать наши карточки  
        window.BookChannel = { fill: run, clear: clearBook };  
        noty('plugin loaded');  
    }  
  
    if (window.appready) start();  
    else {  
        var t = setInterval(function () {  
            if (window.appready) { clearInterval(t); start(); }  
        }, 200);  
    }  
})();
