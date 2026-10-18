(function () {  
    'use strict';  
  
    var FOLDER_CLASS = 'online-folder';  
  
    // кнопки, которые НЕ должны попадать в папку "Онлайн"  
    var EXCLUDE = '.view--torrent, .view--trailer, .' + FOLDER_CLASS;  
  
    function onlineButtons(render) {  
        return render.find('.buttons--container > .full-start__button').not(EXCLUDE);  
    }  
  
    function collect(render) {  
        var items = [];  
  
        onlineButtons(render).each(function () {  
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
  
    function makeFolder(render, container) {  
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
        var container = render.find('.buttons--container');  
        if (!container.length) return;  
  
        var online = onlineButtons(render);  
        var folder = container.children('.' + FOLDER_CLASS);  
  
        if (!online.length) {  
            folder.remove();  
            return;  
        }  
  
        // прячем оригиналы — они выпадают из меню "Смотреть"  
        online.addClass('hide');  
  
        if (!folder.length) {  
            folder = makeFolder(render, container);  
            container.prepend(folder);  
        }  
  
        folder.attr('data-subtitle', online.length);  
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
