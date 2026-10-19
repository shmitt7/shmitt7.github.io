(function () {  
    var ICONS = {  
        '.button--play':   '<svg width="24" height="24" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20.5" fill="#3B82F6"/><path fill="#fff" d="M19.5 14.5v19l16-9.5z"/></svg>',  
        '.view--torrent':  '<svg width="24" height="24" viewBox="0 0 48 48"><path fill="#4caf50" d="M23.501,44.125c11.016,0,20-8.984,20-20c0-11.015-8.984-20-20-20c-11.016,0-20,8.985-20,20C3.501,35.141,12.485,44.125,23.501,44.125z"/><path fill="#fff" d="M43.252,27.114C39.718,25.992,38.055,19.625,34,11l-7,1.077c1.615,4.905,8.781,16.872,0.728,18.853C20.825,32.722,17.573,20.519,15,14l-8,2l10.178,27.081c1.991,0.67,4.112,1.044,6.323,1.044c0.982,0,1.941-0.094,2.885-0.232l-4.443-8.376c6.868,1.552,12.308-0.869,12.962-6.203c1.727,2.29,4.089,3.183,6.734,3.172C42.419,30.807,42.965,29.006,43.252,27.114z"/></svg>',  
        '.view--trailer':  '<svg width="24" height="24" viewBox="0 0 48 48"><path d="M47.044 12.3709C46.7726 11.3497 46.2378 10.4178 45.493 9.66822C44.7483 8.91869 43.8197 8.37791 42.8003 8.1C39.0476 7.09091 24.0476 7.09091 24.0476 7.09091C24.0476 7.09091 9.04761 7.09091 5.29488 8.1C4.27547 8.37791 3.34693 8.91869 2.60218 9.66822C1.85744 10.4178 1.32262 11.3497 1.05124 12.3709C0.0476075 16.14 0.0476074 24 0.0476074 24C0.0476074 24 0.0476075 31.86 1.05124 35.6291C1.32262 36.6503 1.85744 37.5822 2.60218 38.3318C3.34693 39.0813 4.27547 39.6221 5.29488 39.9C9.04761 40.9091 24.0476 40.9091 24.0476 40.9091C24.0476 40.9091 39.0476 40.9091 42.8003 39.9C43.8197 39.6221 44.7483 39.0813 45.493 38.3318C46.2378 37.5822 46.7726 36.6503 47.044 35.6291C48.0476 31.86 48.0476 24 48.0476 24C48.0476 24 48.0476 16.14 47.044 12.3709Z" fill="#FF0302"/><path d="M19.1385 31.1373V16.8628L31.684 24.0001L19.1385 31.1373Z" fill="#FEFEFE"/></svg>'  
    };  
  
    var lastFocused = null;   // последняя сфокусированная кнопка нашей строки  
    var renderTimer = null;  
  
    function setIcon(btn, selector) {  
        var svg = btn.find('svg');  
        if (svg.length && ICONS[selector]) svg.replaceWith(ICONS[selector]);  
    }  
  
    // клон кнопки из скрытого контейнера, оригинал не трогаем  
    function makeClone(src, selector) {  
        var clon = src.clone();  
  
        clon.removeClass('hide')  
            .addClass('selector button--extracted')  
            .on('hover:enter', function () {  
                src.trigger('hover:enter');  
            })  
            .on('hover:long', function () {  
                src.trigger('hover:long');  
            })  
            .on('hover:focus', function () {  
                lastFocused = clon[0];  
            });  
  
        setIcon(clon, selector);  
        return clon;  
    }  
  
    function buildButtons(card) {  
        var cont = card.find('.full-start-new__buttons');  
        var play = cont.find('.button--play');  
  
        if (!cont.length || !play.length) return;  
  
        // чистим старые клоны (complite может прийти повторно)  
        cont.find('.button--extracted').remove();  
  
        var torrent = card.find('.buttons--container > .view--torrent').first();  
        var trailer = card.find('.buttons--container > .view--trailer').first();  
  
        var firstBtn = null;  
  
        // порядок: Торренты | Смотреть | Трейлеры  
        if (torrent.length && !torrent.hasClass('hide')) {  
            var tclon = makeClone(torrent, '.view--torrent');  
            play.before(tclon);  
            firstBtn = tclon;  
        }  
  
        setIcon(play, '.button--play');  
        if (!firstBtn) firstBtn = play;  
  
        play.on('hover:focus', function () { lastFocused = play[0]; });  
  
        if (trailer.length && !trailer.hasClass('hide')) {  
            var rclon = makeClone(trailer, '.view--trailer');  
            play.after(rclon);  
        }  
  
        setTimeout(function () {  
            Lampa.Controller.collectionSet(cont);  
            // фокус на первую кнопку только если сохранённого нет  
            var target = (lastFocused && $.contains(cont[0], lastFocused)) ? lastFocused : firstBtn[0];  
            Lampa.Controller.collectionFocus(target, cont);  
        }, 50);  
    }  
  
    Lampa.Listener.follow('full', function (e) {  
        if (e.type !== 'complite') return;  
  
        var act = e.object && e.object.activity;  
        if (!act) return;  
  
        var card = $(act.render());  
  
        if (renderTimer) clearTimeout(renderTimer);  
        renderTimer = setTimeout(function () {  
            buildButtons(card);  
        }, 100);  
    });  
  
    // возврат в карточку (из трейлеров/торрентов/плеера) — восстановить фокус  
    Lampa.Controller.listener.follow('toggle', function (e) {  
        if (e.name !== 'full_start' || !lastFocused) return;  
  
        setTimeout(function () {  
            if (!$.contains(document.body, lastFocused)) {  
                lastFocused = null;  
                return;  
            }  
            var cont = $(lastFocused).closest('.full-start-new__buttons');  
            if (cont.length) {  
                Lampa.Controller.collectionSet(cont);  
                Lampa.Controller.collectionFocus(lastFocused, cont);  
            }  
        }, 50);  
    });  
  
    Lampa.Listener.follow('app', function (e) {  
        if (e.type === 'destroy') {  
            if (renderTimer) clearTimeout(renderTimer);  
            lastFocused = null;  
        }  
    });  
})();
