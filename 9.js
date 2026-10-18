(function () {  
    'use strict';  
  
    var BTN_SEL      = '.view--online'; // селектор онлайн-кнопок, можно расширить  
    var FOLDER_CLASS = 'online-folder';  
  
    function collect(render) {  
        var items = [];  
  
        render.find('.full-start__button' + BTN_SEL).not('.' + FOLDER_CLASS).each(function () {  
            var icon = $(this).find('svg').prop('outerHTML');  
  
            items.push({  
                title:    $(this).text().trim(),  
                subtitle: $(this).data('subtitle'),  
                template: icon ? 'selectbox_icon' : 'selectbox_item',  
                icon:     icon,  
                btn:      $(this)  
            });  
        });  
  
        return items;  
    }  
  
    function makeFolder(render) {  
        var f = $(  
            '<div class="full-start__button selector ' + FOLDER_CLASS + '">' +  
                '<svg><use xlink:href="#sprite-play"></use></svg>' +  
                '<span>Онлайн</span>' +  
            '</div>'  
        );  
  
        f.on('hover:enter', function () {  
            var items = collect(render);  
  
            if (!items.length) return;  
  
            Lampa.Select.show({  
                title: 'Онлайн',  
                items: items,  
                onSelect: function (a) { a.btn.trigger('hover:enter'); },  
                onBack:   function ()  { Lampa.Controller.toggle('content'); }  
            });  
        });  
  
        return f;  
    }  
  
    function group(render) {  
        var cont   = render.find('.buttons--container');  
        var row    = render.find('.full-start-new__buttons');  
        var online = render.find('.full-start__button' + BTN_SEL).not('.' + FOLDER_CLASS);  
  
        if (!online.length) {  
            render.find('.' + FOLDER_CLASS).remove();  
            return;  
        }  
  
        // прячем оригинальные кнопки — они выпадают из меню "Смотреть" и из видимого ряда  
        online.addClass('hide');  
  
        // папка в скрытом контейнере -> появится пунктом в меню "Смотреть"  
        if (cont.length && !cont.children('.' + FOLDER_CLASS).length) {  
            cont.prepend(makeFolder(render));  
        }  
  
        // папка в видимом ряду — только если онлайн-кнопки были там  
        if (row.length && row.children(BTN_SEL).length && !row.children('.' + FOLDER_CLASS).length) {  
            row.children(BTN_SEL).first().before(makeFolder(render));  
        }  
  
        render.find('.' + FOLDER_CLASS).attr('data-subtitle', online.length);  
    }  
  
    function observe(render) {  
        var node = render.get(0);  
        if (!node || node.__onlineFolderObserved) return;  
        node.__onlineFolderObserved = true;  
  
        var t;  
        new MutationObserver(function () {  
            clearTimeout(t);  
            t = setTimeout(function () { group(render); }, 100);  
        }).observe(node, { childList: true, subtree: true });  
    }  
  
    function start() {  
        Lampa.Listener.follow('full', function (e) {  
            if (e.type !== 'complite') return;  
  
            var render = e.object.activity.render();  
  
            observe(render);  
            group(render);  
        });  
    }  
  
    if (window.appready) start();  
    else {  
        Lampa.Listener.follow('app', function (e) {  
            if (e.type === 'ready') start();  
        });  
    }  
})();
