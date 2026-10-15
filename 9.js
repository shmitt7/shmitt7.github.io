(function () {  
    'use strict';  
  
    if (window.plugin_nw_channel_ready) return;  
    window.plugin_nw_channel_ready = true;  
  
    var TAG    = 'NowWatchChannel';  
    var WHERE  = 'book';        // канал «Запланировано»  
    var CAP    = 15;  
    var MARK   = 'nw_';         // префикс наших карточек  
  
    function log() {  
        var a = ['[' + TAG + ']'];  
        for (var i = 0; i < arguments.length; i++) {  
            var v = arguments[i];  
            a.push(typeof v === 'object' ? JSON.stringify(v).slice(0, 300) : v);  
        }  
        console.log.apply(console, a);  
    }  
    function noty(t) {  
        log(t);  
        try { if (Lampa.Noty) Lampa.Noty.show(TAG + ': ' + t); } catch (e) {}  
    }  
  
    // карточка в том же «trimmed» формате, что ждёт приложение (как в android_fav_bridge)  
    function trimCard(c) {  
        var s = function (v) { return (v == null) ? undefined : String(v); };  
        var o = {  
            id: s(c.id), source: s(c.source), type: s(c.type),  
            title: s(c.title), name: s(c.name),  
            original_title: s(c.original_title), original_name: s(c.original_name),  
            img: s(c.img || (c.poster_path ? 'https://image.tmdb.org/t/p/w500' + c.poster_path : '')),  
            background_image: s(c.background_image ||  
                (c.backdrop_path ? 'https://image.tmdb.org/t/p/w780' + c.backdrop_path : '')),  
            release_date: s(c.release_date), first_air_date: s(c.first_air_date),  
            release_year: s(c.release_year)  
        };  
        var va = (typeof c.vote_average === 'number') ? c.vote_average : parseFloat(c.vote_average);  
        if (isFinite(va)) o.vote_average = va;  
        return o;  
    }  
  
    // «Сейчас смотрят» из CUB (?sort=now_playing)  
    function fetchNowWatching(done) {  
        var domain = (Lampa.Manifest && Lampa.Manifest.cub_domain) || 'cub.red';  
        var proto  = (Lampa.Utils && Lampa.Utils.protocol) ? Lampa.Utils.protocol() : 'https://';  
        var email  = '';  
        try { email = (Lampa.Storage.get('account', '{}') || {}).email || ''; } catch (e) {}  
  
        var u = proto + 'tmdb.' + domain + '/?sort=now_playing&email=' + encodeURIComponent(email);  
        log('fetch:', u);  
        new Lampa.Reguest().silent(u,  
            function (j) { done(j && j.results ? j.results : []); },  
            function (e) { log('fetch error:', e); done([]); },  
            false, { cache: { life: 60 * 24 * 2 } });  
    }  
  
    // встраиваем наши карточки в localStorage.favorite  
    function inject(items) {  
        var fav;  
        try { fav = JSON.parse(localStorage.getItem('favorite') || '{}'); }  
        catch (e) { fav = {}; }  
  
        fav.card = fav.card || [];  
        fav[WHERE] = fav[WHERE] || [];  
  
        // чистим старые nw_-карточки  
        fav.card = fav.card.filter(function (c) {  
            return String(c.id).indexOf(MARK) !== 0;  
        });  
        fav[WHERE] = fav[WHERE].filter(function (id) {  
            return String(id).indexOf(MARK) !== 0;  
        });  
  
        var added = 0;  
        items.slice(0, CAP).forEach(function (item, idx) {  
            if (!item.id) return;  
            var card = trimCard(item);  
            card.id = MARK + item.id;  
            if (!card.img) return;  
            fav.card.push(card);  
            fav[WHERE].splice(idx, 0, card.id); // сверху списка  
            added++;  
        });  
  
        try { localStorage.setItem('favorite', JSON.stringify(fav)); }  
        catch (e) { noty('localStorage error'); return 0; }  
        return added;  
    }  
  
    // пуш + обновление канала (тот же контракт, что в android_fav_bridge)  
    function pushAndUpdate() {  
        if (typeof AndroidJS === 'undefined' ||  
            typeof AndroidJS.storageChange !== 'function' ||  
            typeof AndroidJS.updateChannel !== 'function') {  
            return noty('нет AndroidJS.storageChange/updateChannel — нужна Lampa Android APK');  
        }  
        try {  
            AndroidJS.storageChange(JSON.stringify({  
                name: 'favorite',  
                value: localStorage.getItem('favorite')  
            }));  
            AndroidJS.updateChannel(WHERE);  
            noty('пуш ok, канал ' + WHERE + ' обновлён');  
        } catch (e) { log('push error:', e); }  
    }  
  
    function run() {  
        fetchNowWatching(function (items) {  
            if (!items.length) return noty('пустой список now_playing');  
            var n = inject(items);  
            log('injected:', n);  
            if (n) pushAndUpdate();  
        });  
    }  
  
    function start() {  
        Lampa.Listener.follow('app', function (e) {  
            if (e.type === 'ready') setTimeout(run, 4000);  
        });  
        // ручное: window.NWChannel.run()  
        window.NWChannel = { run: run };  
        noty('plugin loaded');  
    }  
  
    var t = setInterval(function () {  
        if (window.Lampa && window.appready) { clearInterval(t); start(); }  
    }, 300);  
})();
