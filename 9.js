(function(){  
    Lampa.Player.listener.follow('create', function(e){  
        if(e.data.torrent_hash && Lampa.Platform.is('android')){  
            e.data.launch_player = 'inner'  
        }  
    })  
})()
