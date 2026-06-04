(function() {
    'use strict';

    if (!window.liteTweaks) {
        window.liteTweaks = {};
    }

    Object.assign(window.lampa_settings, {
        disable_features: {
            dmca:                 true,
            lgbt:                 true,
            ai:                   true,
            subscribe:            true,
            blacklist:            true,
            persons:              true,
            ads:                  true,
            remote_configuration: true,
        },
        torrents_use: true,
        feed:         false,
        services:     false,
        lang_use:     false,
        white_use:    false,
        read_only:    false,
        demo:         false,
    });

    window.plugin_shots_ready = true;

    function run() {
        $('.head .open--broadcast').remove();
        $('.head .open--profile').remove();
        $('.head .notice--icon').remove();
        if (Lampa.Notice?.drawCount) Lampa.Notice.drawCount = () => {};

        $('.menu [data-action="catalog"]').remove();
        $('.menu [data-action="relise"]').remove();
        $('.menu [data-action="timetable"]').remove();
        $('.menu [data-action="mytorrents"]').remove();
        $('.menu [data-action="about"]').remove();

        const editItem = $('.menu [data-action="edit"]').detach();
        $('.menu .nosort:first .menu__list').append(editItem);
        const lastNosort = $('.menu .nosort:last');
        lastNosort.prev('.menu__split').remove();
        lastNosort.remove();

        Lampa.Listener.follow('full', (e) => {
            if (e.type === 'complite') {
                e.object.activity.render().find('.button--options').remove();
            }
        });

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
    }

    if (window.appready) {
        run();
    } else {
        Lampa.Listener.follow('app', (e) => {
            if (e.type === 'ready') run();
        });
    }

})();
