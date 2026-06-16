(function () {  
    'use strict';  
  
    function startPlugin() {  
        window.plugin_floating_menu_ready = true;  
  
        function init() {  
            // Переопределяем контроллер меню — вместо боковой панели показываем Select-попап  
            Lampa.Controller.add('menu', {  
                toggle: function () {  
                    var items = [];  
  
                    // Собираем все пункты меню из DOM (включая добавленные плагинами)  
                    Lampa.Menu.render().find('.menu__item.selector').each(function () {  
                        var el = $(this);  
                        var title = el.find('.menu__text').text().trim();  
  
                        if (title) {  
                            items.push({  
                                title: title,  
                                element: el  
                            });  
                        }  
                    });  
  
                    Lampa.Select.show({  
                        title: 'Меню',  
                        items: items,  
                        onSelect: function (item) {  
                            // Триггерим hover:enter на реальном элементе меню —  
                            // это запускает всю существующую логику действий из menu.js  
                            item.element.trigger('hover:enter');  
                        },  
                        onBack: function () {  
                            Lampa.Controller.toggle('content');  
                        }  
                    });  
                },  
                back: function () {  
                    Lampa.Activity.backward();  
                }  
            });  
        }  
  
        // Стандартный паттерн: если приложение уже готово — запускаем сразу  
        if (window.appready) init();  
        else {  
            Lampa.Listener.follow('app', function (e) {  
                if (e.type == 'ready') init();  
            });  
        }  
    }  
  
    if (!window.plugin_floating_menu_ready) startPlugin();  
})();
