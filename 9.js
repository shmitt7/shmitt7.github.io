(function() {  
    'use strict';  
    if (window.myPlugin) return;  
    window.myPlugin = true;  
    function run() {  
    }  
    if (window.appready) run();  
    else Lampa.Listener.follow('app', e => { if (e.type === 'ready') run(); });  
})();
