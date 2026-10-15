(function () {  
    'use strict';  
  
    if (window.plugin_tvchannel_ready) return;  
    window.plugin_tvchannel_ready = true;  
  
    var TAG         = 'TvChannel';  
    var CHANNEL_ID  = 'now_watching';  
    var CHANNEL_TTL = 'Сейчас смотрят';  
    var MAX_CARDS   = 15;  
  
    // ---------- helpers ----------  
    function log() {  
        var args = ['[' + TAG + ']'];  
        for (var i = 0; i < arguments.length; i++) {  
            var a = arguments[i];  
            args.push(typeof a === 'object' ? JSON.stringify(a).slice(0, 300) : a);  
        }  
        console.log.apply(console, args);  
    }  
  
    function noty(text) {  
        log(text);  
        try { if (Lampa.Noty) Lampa.Noty.show(TAG + ': ' + text); } catch (e) {}  
    }  
  
    function poster(item) {  
        // CUB/TMDB карточки: img уже полный url, иначе собираем из poster_path  
        if (item.img) return item.img;  
        var p = item.poster_path || item.poster || item.backdrop_path || '';  
        if (!p) return '';  
        if (p.indexOf('http') === 0) return p;  
        return 'https://image.tmdb.org/t/p/w500' + p;  
    }  
  
    // ---------- данные: «Сейчас смотрят» (CUB ?sort=now_playing) ----------  
    function fetchNowWatching(onDone) {  
        var domain = (Lampa.Manifest && Lampa.Manifest.cub_domain) || 'cub.red';  
        var proto  = (Lampa.Utils && Lampa.Utils.protocol) ? Lampa.Utils.protocol() : 'https://';  
        var email  = '';  
        try { email = (Lampa.Storage.get('account', '{}') || {}).email || ''; } catch (e) {}  
  
        var u = proto + 'tmdb.' + domain + '/?sort=now_playing&email=' + encodeURIComponent(email);  
        log('fetch url:', u);  
  
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
  
    function buildPrograms(items) {  
        return items.slice(0, MAX_CARDS).map(function (item) {  
            return {  
                title:       item.title || item.name || '',  
                description: item.overview || '',  
                poster:      poster(item),  
                navigation: {  
                    action: 'lampa_card',  
                    card: {  
                        id:     item.id,  
                        method: item.name ? 'tv' : 'movie',  
                        source: item.source || 'cub'  
                    }  
                }  
            };  
        }).filter(function (p) { return p.title && p.poster; });  
    }  
  
    // ---------- мост ----------  
    function bridgeInfo() {  
        var info = {  
            androidJS:  typeof AndroidJS !== 'undefined',  
            publish:    typeof AndroidJS !== 'undefined' && typeof AndroidJS.publishPluginChannel === 'function',  
            clear:      typeof AndroidJS !== 'undefined' && typeof AndroidJS.clearPluginChannel === 'function',  
            platform:   typeof Lampa.Platform !== 'undefined' && Lampa.Platform.is('android'),  
            appVersion: ''  
        };  
        try { if (info.androidJS && AndroidJS.appVersion) info.appVersion = AndroidJS.appVersion(); } catch (e) {}  
        return info;  
    }  
  
    function publish() {  
        var info = bridgeInfo();  
        log('bridge:', info);  
  
        if (!info.platform)            return noty('не android, пропуск');  
        if (!info.publish)             return noty('нет publishPluginChannel — нужна Lampa v1.13.4+, у вас: ' + (info.appVersion || '?'));  
  
        fetchNowWatching(function (items) {  
            var programs = buildPrograms(items);  
            if (!programs.length) return noty('пустой список — канал не публикуется');  
  
            var payload = { id: CHANNEL_ID, title: CHANNEL_TTL, programs: programs };  
            log('payload programs:', programs.length, 'first:', programs[0]);  
  
            var ok = false;  
            try { ok = !!AndroidJS.publishPluginChannel(JSON.stringify(payload)); }  
            catch (e) { log('publish throw:', e); }  
  
            noty('enqueue=' + ok + ', programs=' + programs.length);  
            // enqueue=true = только принято в очередь; если канала нет —  
            // смотреть logcat и включить канал в настройках лаунчера  
        });  
    }  
  
    function clear() {  
        try {  
            if (typeof AndroidJS !== 'undefined' && typeof AndroidJS.clearPluginChannel === 'function') {  
                AndroidJS.clearPluginChannel(CHANNEL_ID);  
                log('cleared');  
            }  
        } catch (e) { log('clear error:', e); }  
    }  
  
    // ---------- жизненный цикл ----------  
    function start() {  
        log('plugin start');  
  
        // публикация при готовности приложения (данные придут с кэшем/сетью сами)  
        Lampa.Listener.follow('app', function (e) {  
            if (e.type === 'ready') {  
                // небольшая задержка, чтобы Storage/аккаунт успели подняться  
                setTimeout(publish, 3000);  
            }  
            if (e.type === 'destroy') clear();  
        });  
  
        // ручная перепубликация: window.MyTvChannel.publish()  
        window.MyTvChannel = { publish: publish, clear: clear };  
        noty('plugin loaded');  
    }  
  
    if (window.appready) start();  
    else {  
        var t = setInterval(function () {  
            if (window.appready) { clearInterval(t); start(); }  
        }, 200);  
    }  
})();
