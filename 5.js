(function () {  
    Lampa.Listener.follow('request_secuses', function (e) {  
        if (e.params.url && e.params.url.indexOf('kinopoisk') >= 0) {  
            console.log('KP_DUMP_URL:', e.params.url)  
            console.log('KP_DUMP_DATA:', JSON.stringify(e.data).slice(0, 2000))  
        }  
    })  
  
    Lampa.Listener.follow('request_error', function (e) {  
        if (e.params.url && e.params.url.indexOf('kinopoisk') >= 0) {  
            console.log('KP_DUMP_ERROR_URL:', e.params.url)  
        }  
    })  
})()
