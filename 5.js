(function () {  
    'use strict';  
  
    function startPlugin() {  
        if (window.lampa_requests_monitor) return;  
        window.lampa_requests_monitor = true;  
  
        var stats = {  
            active: 0,      // запросов в работе прямо сейчас  
            total: 0,       // всего выполнено  
            errors: 0,  
            storage: 0      // обращений к хранилищу  
        };  
  
        function add() {  
            var elem = $('<div class="head__action selector" style="width:auto;min-width:2.8em;font-size:0.85em;padding:0 0.5em;flex-direction:column;line-height:1.1">' +  
                '<span class="rm-req">0</span>' +  
                '<span class="rm-det" style="font-size:0.7em;opacity:0.7">0/0</span>' +  
                '</div>');  
  
            elem.on('hover:enter', function () {  
                Lampa.Noty.show(  
                    'Активных запросов: ' + stats.active +  
                    '<br>Всего: ' + stats.total +  
                    '<br>Ошибок: ' + stats.errors +  
                    '<br>Записей в хранилище: ' + stats.storage  
                );  
            });  
  
            Lampa.Head.addElement(elem);  
  
            function redraw() {  
                elem.find('.rm-req').text(stats.active);  
                elem.find('.rm-det').text(stats.errors + '/' + stats.total);  
            }  
  
            Lampa.Listener.follow('request_before', function () {  
                stats.active++; stats.total++;  
                redraw();  
            });  
            Lampa.Listener.follow('request_secuses', function () {  
                stats.active = Math.max(0, stats.active - 1);  
                redraw();  
            });  
            Lampa.Listener.follow('request_error', function () {  
                stats.active = Math.max(0, stats.active - 1);  
                stats.errors++;  
                redraw();  
            });  
            Lampa.Storage.listener.follow('change,add', function () {  
                stats.storage++;  
            });  
        }  
  
        if (window.appready) add();  
        else Lampa.Listener.follow('app', function (e) {  
            if (e.type == 'ready') add();  
        });  
    }  
  
    startPlugin();  
})();
