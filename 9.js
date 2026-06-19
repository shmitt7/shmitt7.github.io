(function() {  
'use strict';  
if (window.myPlugin) return;  
window.myPlugin = true;  
function init() {  
    if (!Lampa.Platform.screen('tv')) return;  
}  
if (window.appready) init();  
else Lampa.Listener.follow('app', function(e) { if (e.type === 'ready') init(); });  
})();
