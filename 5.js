(function() {  
    'use strict';  
    if (!window.liteTweaks) window.liteTweaks = {};  
    Object.assign(window.lampa_settings, {  
        disable_features: {  
            dmca: true,  
            lgbt: true,  
            ai: true,  
            subscribe: true,  
            blacklist: true,  
            persons: true,  
            ads: true,  
            install_proxy: true,  
            remote_configuration: true,  
        },  
        torrents_use: true,  
        feed: false,  
        services: false,  
        lang_use: false,  
        white_use: false,  
        read_only: false,  
        demo: false,  
    });  
    window.plugin_shots_ready = true;  
    function run() {  
        if (window.liteTweaks._started) return;  
        window.liteTweaks._started = true;  
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
            if (e.type === 'complite') e.object.activity.render().find('.button--options').remove();  
        });  
        $('.head__action.open--notice, .head__action.notice--icon').remove();  
        if (Lampa.Notice?.drawCount) Lampa.Notice.drawCount = () => {};  
        $('.head__action.open--premium, .head__action.open--feed, .head__action.open--broadcast, .black-friday__button').remove();  
    }  
    if (window.appready) run();  
    else Lampa.Listener.follow('app', (e) => { if (e.type === 'ready') run(); });  
})();
