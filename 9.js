(function () {  
    'use strict';  
  
    function reorder(e) {  
        if (e.type !== 'complite') return;  
  
        let body  = e.body;  
        let play  = body.find('.button--play');  
        let cont  = body.find('.full-start-new__buttons');  
        let torrent = body.find('.buttons--container .view--torrent');  
        let trailer = body.find('.buttons--container .view--trailer');  
  
        // Торренты — перед "Смотреть"  
        torrent.removeClass('hide').addClass('selector').insertBefore(play);  
        // Трейлеры — сразу после "Смотреть"  
        trailer.removeClass('hide').addClass('selector').insertAfter(play);  
  
        // groupButtons() выполняется после события 'complite' и может  
        // скрыть "Смотреть", если в контейнере ничего не осталось —  
        // возвращаем её на место  
        setTimeout(() => {  
            let rest = body.find('.buttons--container > .full-start__button').not('.hide');  
            if (!rest.length) {  
                play.removeClass('hide').off('hover:enter').on('hover:enter', () => {  
                    // нечего показывать — можно повесить свою реакцию или оставить пустым  
                });  
            }  
            Lampa.Controller.collectionSet(body);  
            Lampa.Controller.collectionFocus(play[0], body);  
        }, 0);  
    }  
  
    if (window.appready) {  
        Lampa.Listener.follow('full', reorder);  
    } else {  
        Lampa.Listener.follow('app', function (e) {  
            if (e.type === 'ready') Lampa.Listener.follow('full', reorder);  
        });  
    }  
})();
