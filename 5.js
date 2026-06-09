(function(){  
'use strict';  
var NON_RU_EN=/[\u0530-\u06FF\u0900-\u0FFF\u1000-\u11FF\u1780-\u18AF\u3040-\u30FF\u31F0-\u31FF\u4E00-\u9FFF\uA960-\uA97F\uAC00-\uD7FF\uFF66-\uFF9F]/;  
function filter(req){  
if(!req.params||!req.params.url)return;  
if(!req.data||!Array.isArray(req.data.results))return;  
if(req.params.url.indexOf('/search')>=0||req.params.url.indexOf('/person/')>=0)return;  
req.data.results=req.data.results.filter(function(item){  
var t=item.title||item.name||'';  
return!NON_RU_EN.test(t);  
});  
}  
function init(){  
if(window._cf_loaded)return;  
window._cf_loaded=true;  
Lampa.Listener.follow('request_secuses',filter);  
}  
if(window.appready)init();  
else Lampa.Listener.follow('app',function(e){if(e.type==='ready')init();});  
})();
