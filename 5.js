(function(){  
    if(window.plugin_force_inner_torrent_ready) return  
    window.plugin_force_inner_torrent_ready = true  
  
    // Каждый раз при загрузке принудительно ставим inner для торрентов на Android TV  
    if(Lampa.Platform.is('android')){  
        Lampa.Storage.set('player_torrent', 'inner')  
    }  
})()
