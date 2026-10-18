(function() {  
    if (window.contentFilter) return;  
    window.contentFilter = true;  
    var CYRILLIC = /[\u0400-\u04FF]/;  
    var LATIN = /[A-Za-z\u00C0-\u024F]/;  
    var DIGIT = /[0-9]/;  
    var SKIP_URL = /search\/|person\/|collection\/|\/credits/;  
    var LANGS = ['en', 'ru'];  
    function keepItem(item) {  
        if (item.media_type && item.media_type !== 'movie' && item.media_type !== 'tv') return true;  
        if (item.gender !== undefined) return true;  
        var title = item.title || item.name || '';  
        var lang = item.original_language;  
        if (CYRILLIC.test(title)) return true;  
        if (LATIN.test(title)) return LANGS.indexOf(lang) !== -1;  
        if (DIGIT.test(title)) return true;  
        return false;  
    }  
    Lampa.Listener.follow('request_secuses', function(request) {  
        if (!request.data || !request.data.results || !request.data.results.length) return;  
        var url = String(request.data.url || '') + ' ' + String(request.params && request.params.url || '');  
        if (SKIP_URL.test(url)) return;  
        request.data.results = request.data.results.filter(keepItem);  
    });  
})();
