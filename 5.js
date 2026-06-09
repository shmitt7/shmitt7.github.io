(function(){  
var R=/[\u0530-\u06FF\u0900-\u0FFF\u1000-\u11FF\u1780-\u18AF\u3040-\u30FF\u31F0-\u31FF\u4E00-\u9FFF\uA960-\uA97F\uAC00-\uD7FF\uFF66-\uFF9F]/;  
Lampa.Listener.follow('request_secuses',function(req){  
if(!req.data||!Array.isArray(req.data.results))return;  
req.data.results=req.data.results.filter(function(i){return!R.test(i.title||i.name||'');});  
});  
})();
