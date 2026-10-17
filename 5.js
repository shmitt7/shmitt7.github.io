(function () {  
    'use strict';  
  
    var plugins = [  
        'https://nb557.github.io/plugins/online_mod.js',  
        'https://cub.red/plugin/sport',  
        'https://shmitt7.github.io/buttons.js',  
        'https://shmitt7.github.io/cardMobile.js',  
        'https://shmitt7.github.io/cardTV.js',  
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
  
    function install() {  
        var installed = Lampa.Plugins.get().map(function (p) { return p.url; });  
  
        plugins.forEach(function (url) {  
            if (installed.indexOf(url) === -1) {  
                Lampa.Plugins.add({ url: url, status: 1 });  
            }  
        });  
    }  
  
    install();  
})();
