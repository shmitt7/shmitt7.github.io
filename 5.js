(function () {  
    'use strict';  
  
    if (window.plugin_empty_ready) return;  
    window.plugin_empty_ready = true;  
  
    function startPlugin() {  
        // Здесь будет логика плагина  
    }  
  
    if (window.appready) startPlugin();  
    else {  
        Lampa.Listener.follow('app', function (e) {  
            if (e.type === 'ready') startPlugin();  
        });  
    }  
})();
