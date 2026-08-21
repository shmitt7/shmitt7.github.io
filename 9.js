function startMyPlugin() {  
    window.my_plugin_ready = true  
  
    function init() {  
        // здесь будет код плагина  
    }  
  
    if (window.appready) init()  
    else Lampa.Listener.follow('app', function (e) {  
        if (e.type == 'ready') init()  
    })  
}  
  
if (!window.my_plugin_ready) startMyPlugin()
