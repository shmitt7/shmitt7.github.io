(function () {  
    console.log('[dmca-debug] script loaded at', Date.now())  
    console.log('[dmca-debug] disable_features.dmca =', window.lampa_settings && window.lampa_settings.disable_features && window.lampa_settings.disable_features.dmca)  
    console.log('[dmca-debug] dcma list length at load =', (window.lampa_settings && window.lampa_settings.dcma || []).length)  
  
    // следим за КАЖДОЙ записью dcma, чтобы поймать момент, когда список наполняется  
    try {  
        var _dcma = window.lampa_settings.dcma  
        Object.defineProperty(window.lampa_settings, 'dcma', {  
            get: function () { return _dcma },  
            set: function (val) {  
                console.log('[dmca-debug] window.lampa_settings.dcma OVERWRITTEN, new length =', val && val.length, 'stack:', new Error().stack)  
                _dcma = val  
            },  
            configurable: true  
        })  
    } catch (e) {  
        console.warn('[dmca-debug] cannot hook dcma setter', e)  
    }  
})();
