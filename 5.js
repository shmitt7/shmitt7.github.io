(function(){  
    if(window.plugin_force_inner_torrent_ready) return  
    window.plugin_force_inner_torrent_ready = true  
  
    if(!Lampa.Platform.is('android')) return  
  
    function init(){  
        // Всегда говорим коду, что "gst работает" — это снимает  
        // условие data.torrent_hash && !Torserver.gstWork()  
        Lampa.Torserver.gstWork = function(){  
            return true  
        }  
  
        // Дублируем настройку через launch_player на всякий случай  
        var original_play = Lampa.Player.play  
        Lampa.Player.play = function(data){  
            if(data) data.launch_player = 'inner'  
            return original_play.apply(this, arguments)  
        }  
    }  
  
    if(window.appready) init()  
    else Lampa.Listener.follow('app', function(e){  
        if(e.type == 'ready') init()  
    })  
})()
