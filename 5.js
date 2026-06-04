(function() {
    'use strict';
    if (!window.liteTweaks) {
        window.liteTweaks = {};
    }
    Object.assign(window.lampa_settings, {
        disable_features: {
            dmca: true,
            ai: true,
            subscribe: true,
            blacklist: true,
            persons: true,
            ads: true,
            install_proxy: true
        },
        feed: false,
        services: false,
        geo: false,
        lang_use: false,
        dcma: false
    });
    window.plugin_shots_ready = true;
    window.lampa_settings.disable_features.lgbt = true;
    window.lampa_settings.torrents_use = true;
    window.lampa_settings.demo = false;
    window.lampa_settings.read_only = false;
    function run() {
        Lampa.AdManager?.destroy();
        $('.ad-video-block, [class*="ad-"], .ad_plugin').remove();
        if (Lampa.Player?.play) {
            const originalPlay = Lampa.Player.play;
            Lampa.Player.play = function(data) {
                data.iptv = true;
                delete data.vast_url;
                delete data.vast_msg;
                return originalPlay.call(this, data);
            };
        }
        Lampa.Listener.follow('full', (e) => {
            if (e.type === 'complite') {
                $('.button--options').remove();
            }
        });
        $('.head__action.open--notice, .head__action.notice--icon').remove();
        if (Lampa.Notice?.drawCount) {
            Lampa.Notice.drawCount = () => {};
        }
        $('.head__action.open--premium, .head__action.open--feed, .head__action.open--broadcast, .black-friday__button').remove();
        const removeHistory = () => {
            $('.watched-history').remove();
            const firstTorrent = $('.torrent-item').first();
            if (firstTorrent.length) {
                Lampa.Controller.collectionFocus(firstTorrent, $('.scroll').first());
            }
        };
        removeHistory();
        new MutationObserver(removeHistory).observe(document.body, {
            childList: true,
            subtree: true
        });
        $('body').append('<style>.torrent-item__seeds span,.torrent-item__grabs span{font-weight:800;font-size:1.25em}</style>');
    }
    if (window.appready) {
        run();
    } else {
        Lampa.Listener.follow('app', (e) => {
            if (e.type === 'ready') {
                run();
            }
        });
    }
})();
