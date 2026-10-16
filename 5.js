(function () {  
    if (!window.Lampa) return;  
  
    var plugins = [  
        'https://nb557.github.io/plugins/online_mod.js',  
        'https://cub.red/plugin/sport',  
        'https://shmitt7.github.io/buttons.js',  
        'https://shmitt7.github.io/cards.js',  
        'https://shmitt7.github.io/dmca.js',  
        'https://shmitt7.github.io/menu.js',  
        'https://shmitt7.github.io/labels.js',  
        'https://shmitt7.github.io/line.js',  
        'https://shmitt7.github.io/parser.js',  
        'https://shmitt7.github.io/quality.js',  
        'https://shmitt7.github.io/rating.js',  
        'https://shmitt7.github.io/russkoe.js',  
        'https://shmitt7.github.io/status.js',  
        'https://shmitt7.github.io/torrserver.js'  
    ];  
  
    // карточка фильма: только одна из двух  
    if (window.innerWidth < 768) {  
        plugins.push('https://shmitt7.github.io/cardMobile.js');  
    } else {  
        plugins.push('https://shmitt7.github.io/cardTV.js');  
    }  
  
    Lampa.Utils.putScript(plugins, function () {  
        console.log('MyPlugins', 'loaded');  
    });  
})();
