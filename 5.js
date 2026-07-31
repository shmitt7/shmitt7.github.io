(function(){  
    if(window.plugin_force_inner_torrent_ready) return  
    window.plugin_force_inner_torrent_ready = true  
  
    if(!Lampa.Platform.is('android')) return  
  
    function init(){  
        Lampa.SettingsApi.addParam({  
            component: 'player',  
            param: {  
                name: 'force_inner_torrent_player',  
                type: 'trigger',  
                default: false  
            },  
            field: {  
                name: 'Встроенный плеер для торрентов (обход ограничения)',  
            },  
            onChange: (value)=>{  
                Lampa.Storage.set('player_torrent', value === 'true' ? 'inner' : 'android')  
            }  
        })  
  
        // применяем сразу при старте, если тумблер уже включён  
        if(Lampa.Storage.field('force_inner_torrent_player')){  
            Lampa.Storage.set('player_torrent', 'inner')  
        }  
    }  
  
    if(window.appready) init()  
    else Lampa.Listener.follow('app', (e)=>{ if(e.type == 'ready') init() })  
})()
