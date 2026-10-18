(function () {  
    'use strict';  
  
    var FOLDER_CLASS = 'online-folder';  
    var PROCESSED    = 'online-folder-processed';  
  
    function collect(container) {  
        var items = [];  
  
        container.find('> .full-start__button.view--online').each(function () {  
            var icon = $(this).find('svg').prop('outerHTML');  
  
            items.push({  
                title:    $(this).text(),  
                subtitle: $(this).data('subtitle'),  
                template: icon ? 'selectbox_icon' : 'selectbox_item',  
                icon:     icon,  
                btn:      $(this)  
            });  
        });  
  
        return items;  
    }  
  
    function group(render) {  
        var container = render.find('.buttons--container');  
        if (!container.length) return;  
  
        // прячем новые онлайн-кнопки, чтобы не попадали в список "Смотреть"  
        container.find('> .full-start__button.view--online').not('.' + PROCESSED)  
            .addClass('hide ' + PROCESSED);  
  
        var all = container.find('> .full-start__button.view--online');  
        var folder = container.find('> .full-start__button.' + FOLDER_CLASS);  
  
        if (!all.length) {  
            folder.remove();  
            return;  
        }  
  
        if (!folder.length) {  
            folder = $(  
                '<div class="full-start__button selector ' + FOLDER_CLASS + '">' +  
                    '<svg><use xlink:href="#sprite-play"></use></svg>' +  
                    '<span>Онлайн</span>' +  
                '</div>'  
            );  
  
            folder.on('hover:enter', function () {  
                Lampa.Select.show({  
                    title: 'Онлайн',  
                    items: collect(container),  
                    onSelect: function (a) {  
                        a.btn.trigger('hover:enter');  
                    },  
                    onBack: function () {  
                        Lampa.Controller.toggle('content');  
                    }  
                });  
            });  
  
            container.prepend(folder);  
        }  
  
        folder.attr('data-subtitle', all.length);  
    }  
  
    function start() {  
        Lampa.Listener.follow('full', function (e) {  
            if (e.type !== 'complite') return;  
  
            var render = e.object.activity.render();  
  
            group(render);  
  
            // другие плагины могут добавлять кнопки с задержкой  
            setTimeout(function () { group(render); }, 300);  
            setTimeout(function () { group(render); }, 1500);  
        });  
    }  
  
    if (window.appready) start();  
    else {  
        Lampa.Listener.follow('app', function (e) {  
            if (e.type === 'ready') start();  
        });  
    }  
})();
