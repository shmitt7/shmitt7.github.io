(function() {  
    if (window.plugin_stub_ready) return;  
    window.plugin_stub_ready = true;  
    function run() {  
    }  
    if (window.appready) run();  
    else Lampa.Listener.follow('app', function(event) {  
        if (event.type === 'ready') run();  
    });  
})();
