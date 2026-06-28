(function() {  
    'use strict';  
    if (window.myPlugin) return;  
    window.myPlugin = true;  
  
    function run() {  
        // Ваш код здесь  
    }  
  
    if (window.appready) run();  
    else Lampa.Listener.follow('app', function(e) {  
        if (e.type === 'ready') run();  
    });  
})();
