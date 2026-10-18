(function () {  
    if (window.onlineGroupBtn) return;  
    window.onlineGroupBtn = true;  
  
    var ICON = '<svg width="24" height="24" viewBox="0 0 48 48" fill="none">' +  
        '<circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="3"/>' +  
        '<path d="M24 4c-5 5.5-7.5 12-7.5 20S19 38.5 24 44c5-5.5 7.5-12 7.5-20S29 9.5 24 4z" stroke="currentColor" stroke-width="3"/>' +  
        '<path d="M5 19h38M5 29h38" stroke="currentColor" stroke-width="3"/>' +  
        '</svg><span>Онлайн</span>';  
  
    // кнопки, которые прячем из общего ряда (всё, кроме штатных)  
    var SKIP = '.button--play,.button--book,.button--reaction,.button--subscribe,.button--options,.view--torrent,.view--trailer,.view--online-src,.button--priority';  
  
    function openFolder(e, $target) {  
        var options = [];  
  
        // плагины сами положат сюда свои пункты — как в кнопке "Ещё"  
        Lampa.Listener.send('full', {  
            link: e.link,  
            type: 'options',  
            props: e.props,  
            options: options  
        });  
  
        // чистим служебные пункты вроде сепараторов/AI, если не нужны — убери фильтр  
        var items = options.filter(function (o) {  
            return o && o.onSelect;  
        }).map(function (o) {  
            return {  
                title: o.title,  
                subtitle: o.subtitle,  
                template: o.icon ? 'selectbox_icon' : 'selectbox_item',  
                icon: o.icon,  
                item: o  
            };  
        });  
  
        if (!items.length) {  
            Lampa.Noty.show('Нет онлайн-источников');  
            return;  
        }  
  
        Lampa.Select.show({  
            title: 'Онлайн',  
            items: items,  
            onSelect: function (a) {  
                a.item.onSelect(); // вызываем обработчик плагина напрямую  
            },  
            onBack: function () {  
                Lampa.Controller.toggle('content');  
            }  
        });  
    }  
  
    Lampa.Listener.follow('full', function (e) {  
        if (e.type !== 'complite') return;  
  
        var $target = e.body.find('.full-start-new__buttons');  
        if (!$target.length || $target.find('.view--online-src').length) return;  
  
        var $btn = $('<div class="full-start__button selector view--online-src">' + ICON + '</div>');  
  
        $btn.on('hover:enter', function () {  
            openFolder(e, $target);  
        });  
  
        var $torrent = $target.find('.view--torrent').not('.hide').last();  
        if ($torrent.length) $torrent.after($btn);  
        else $target.prepend($btn);  
  
        // прячем кнопки онлайн-плагинов из ряда — они живут теперь в нашей "папке"  
        $target.find('.full-start__button').not(SKIP).addClass('hide');  
  
        var start = e.link && e.link.items && e.link.items[0];  
        if (start) {  
            $btn.on('hover:focus hover:enter hover:hover hover:touch', function (ev) {  
                start.last = ev.target;  
            });  
        }  
    });  
})();
