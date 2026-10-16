(function () {  
    if (!window.Lampa || !Lampa.Plugins) return;  
  
    var plugins = [  
        { url: 'https://nb557.github.io/plugins/online_mod.js', name: 'Online Mod', author: 'nb557' },  
        { url: 'https://cub.red/plugin/sport', name: 'Спорт', author: 'lampa' },  
        { url: 'https://shmitt7.github.io/buttons.js', name: 'Цветные кнопки просмотра', author: 'shmitt' },  
        { url: 'https://shmitt7.github.io/cards.js', name: 'Карточки в списках', author: 'shmitt' },  
        { url: 'https://shmitt7.github.io/dmca.js', name: 'Разблокировка DMCA', author: 'shmitt' },  
        { url: 'https://shmitt7.github.io/menu.js', name: 'Плавающее меню', author: 'shmitt' },  
        { url: 'https://shmitt7.github.io/labels.js', name: 'Цветные метки контента', author: 'shmitt' },  
        { url: 'https://shmitt7.github.io/line.js', name: 'Линии Кинопоиск и CUB', author: 'shmitt' },  
        { url: 'https://shmitt7.github.io/parser.js', name: 'Дополнительные кнопки Торрента', author: 'shmitt' },  
        { url: 'https://shmitt7.github.io/quality.js', name: 'Отметка качества', author: 'shmitt' },  
        { url: 'https://shmitt7.github.io/rating.js', name: 'Рейтинг КиноПоиск', author: 'shmitt' },  
        { url: 'https://shmitt7.github.io/russkoe.js', name: 'Русский контент', author: 'shmitt' },  
        { url: 'https://shmitt7.github.io/status.js', name: 'Статус контента', author: 'shmitt' },  
        { url: 'https://shmitt7.github.io/torrserver.js', name: 'TorrServer Free', author: 'shmitt' }  
    ];  
  
    // карточка фильма — только одна из двух  
    if (window.innerWidth < 768) {  
        plugins.push({ url: 'https://shmitt7.github.io/cardMobile.js', name: 'Карточка фильма (телефон)', author: 'shmitt' });  
    } else {  
        plugins.push({ url: 'https://shmitt7.github.io/cardTV.js', name: 'Карточка фильма (TV)', author: 'shmitt' });  
    }  
  
    var installed = Lampa.Plugins.get().map(function (p) { return p.url; });  
  
    plugins.forEach(function (p) {  
        if (installed.indexOf(p.url) === -1) {  
            Lampa.Plugins.add({ url: p.url, name: p.name, author: p.author, status: 1 });  
        }  
    });  
})();
