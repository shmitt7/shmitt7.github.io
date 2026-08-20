(function () {  
    console.log('[dmca-debug] script loaded, disable_features.dmca =', window.lampa_settings && window.lampa_settings.disable_features && window.lampa_settings.disable_features.dmca)  
    console.log('[dmca-debug] window.lampa_settings.dcma at load =', window.lampa_settings && window.lampa_settings.dcma)  
  
    Lampa.Listener.follow('request_before', function (e) {  
        if (/\/(movie|tv)\/\d+/.test(e.params.url)) {  
            console.log('[dmca-debug] request_before:', e.params.url)  
        }  
    })  
  
    Lampa.Listener.follow('request_secuses', function (e) {  
        if (/\/(movie|tv)\/\d+/.test((e.params && e.params.url) || '')) {  
            console.log('[dmca-debug] request_secuses:', e.params.url, 'blocked =', e.data && e.data.blocked)  
        }  
    })  
  
    Lampa.Listener.follow('request_error', function (e) {  
        if (/\/(movie|tv)\/\d+/.test((e.params && e.params.url) || '')) {  
            console.log('[dmca-debug] request_error:', e.params.url, e.error && e.error.status)  
        }  
    })  
})();
