(function() {  
    'use strict';  
  
    if (!window.liteTweaks) {  
        window.liteTweaks = {};  
    }  
  
    Object.assign(window.lampa_settings, {  
        disable_features: {  
            dmca: true,  
            lgbt: true,  
            ai: true,  
            subscribe: true,  
            blacklist: true,  
            persons: true,  
            ads: true,  
            remote_configuration: true,  
        },  
        torrents_use: true,  
        feed: false,  
        services: false,  
        lang_use: false,  
        white_use: false,  
        read_only: false,  
    });  
  
    window.lampa_settings.demo = false;  
    window.plugin_shots_ready = true;  
  
    function run() {  
        // Останавливаем загрузку рекламных preroll-роликов  
        Lampa.AdManager?.destroy();  
  
        // Удаляем рекламные DOM-элементы  
        $('.ad-video-block, [class*="ad-"], .ad_plugin').remove();  
  
        // Патч плеера: пропускаем preroll и убираем ссылки на рекламу  
        if (Lampa.Player?.play) {  
            const originalPlay = Lampa.Player.play;  
            Lampa.Player.play = function(data) {  
                data.iptv = true;        // preroll пропускается  
                delete data.vast_url;    // убираем ссылку на рекламный ролик  
                delete data.vast_msg;    // убираем рекламное сообщение  
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



