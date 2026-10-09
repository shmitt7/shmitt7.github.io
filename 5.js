(function () {  
    'use strict';  
  
    function startPlugin() {  
        if (window.lampa_requests_monitor) return;  
        window.lampa_requests_monitor = true;  
  
        var stats = {  
            active: 0,      // запросов в работе прямо сейчас  
            total: 0,       // всего запросов  
            errors: 0,      // ошибок  
            storage: 0,     // записей в хранилище  
            actsNew: 0,     // создано activity  
            actsDel: 0,     // уничтожено activity  
            memory: 'n/a',  
            dom: 0,  
            imgs: 0,  
            acts: 0,  
            storKb: 0,  
            fps: 0  
        };  
  
        var elem, panel, visible = false;  
  
        // ---------- сбор метрик ----------  
  
        function collect() {  
            var m = performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null;  
  
            stats.memory = m ? m.toFixed(0) + ' MB' : 'n/a';  
            stats.dom    = document.querySelectorAll('*').length;  
            stats.imgs   = document.querySelectorAll('img').length;  
            stats.acts   = Lampa.Activity.all ? Lampa.Activity.all().length : 0;  
  
            try {  
                stats.storKb = (JSON.stringify(localStorage).length / 1024).toFixed(0) + ' KB';  
            } catch (e) {  
                stats.storKb = '?';  
            }  
        }  
  
        // FPS-зонд  
        var frames = 0, t0 = performance.now();  
        (function loop() {  
            frames++;  
            var now = performance.now();  
            if (now - t0 >= 2000) {  
                stats.fps = Math.round(frames * 1000 / (now - t0));  
                frames = 0;  
                t0 = now;  
            }  
            requestAnimationFrame(loop);  
        })();  
  
        // ---------- UI ----------  
  
        function buildPanel() {  
            panel = $('<div class="lampa-monitor-panel"></div>').css({  
                position: 'fixed',  
                top: '4.5em',  
                right: '1em',  
                'z-index': 999,  
                background: 'rgba(0,0,0,0.85)',  
                'border-radius': '0.5em',  
                padding: '0.8em 1em',  
                'font-size': '0.85em',  
                'line-height': '1.6',  
                color: '#fff',  
                display: 'none',  
                'min-width': '16em'  
            });  
  
            $('body').append(panel);  
        }  
  
        function renderPanel() {  
            if (!visible) return;  
  
            panel.html(  
                '<div style="opacity:0.6;margin-bottom:0.4em">Монитор Лампы</div>' +  
                '<div>Запросы активные: <b>' + stats.active + '</b></div>' +  
                '<div>Запросы всего: <b>' + stats.total + '</b> (ошибок: ' + stats.errors + ')</div>' +  
                '<div>Экраны activity: <b>' + stats.acts + '</b> (+' + stats.actsNew + ' / -' + stats.actsDel + ')</div>' +  
                '<div>DOM-узлов: <b>' + stats.dom + '</b></div>' +  
                '<div>Картинок в DOM: <b>' + stats.imgs + '</b></div>' +  
                '<div>Память JS: <b>' + stats.memory + '</b></div>' +  
                '<div>FPS: <b>' + stats.fps + '</b></div>' +  
                '<div>localStorage: <b>' + stats.storKb + '</b> (' + stats.storage + ' записей)</div>'  
            );  
        }  
  
        function togglePanel() {  
            visible = !visible;  
            panel.toggle(visible);  
            renderPanel();  
        }  
  
        function add() {  
            buildPanel();  
  
            elem = $('<div class="head__action selector lampa-monitor">' +  
                '<span class="rm-req">0</span>' +  
                '<span class="rm-fps">--</span>' +  
                '</div>').css({  
                width: 'auto',  
                'min-width': '2.8em',  
                'font-size': '0.8em',  
                padding: '0 0.5em',  
                display: 'flex',  
                'flex-direction': 'column',  
                'align-items': 'center',  
                'justify-content': 'center',  
                'line-height': '1.1'  
            });  
  
            // перекраска при большой нагрузке  
            elem.on('hover:enter', togglePanel);  
  
            Lampa.Head.addElement(elem);  
  
            function redraw() {  
                elem.find('.rm-req').text(stats.active);  
                elem.find('.rm-fps').text(stats.fps + 'fps');  
  
                // красный — много запросов или низкий FPS  
                var bad = stats.active > 15 || (stats.fps > 0 && stats.fps < 25);  
                elem.css('color', bad ? '#ff5252' : '');  
            }  
  
            // ---------- события ----------  
  
            Lampa.Listener.follow('request_before', function () {  
                stats.active++;  
                stats.total++;  
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
  
            if (Lampa.Storage && Lampa.Storage.listener) {  
                Lampa.Storage.listener.follow('change,add', function () {  
                    stats.storage++;  
                });  
            }  
  
            Lampa.Listener.follow('activity', function (e) {  
                if (e.type == 'create')  stats.actsNew++;  
                if (e.type == 'destroy') stats.actsDel++;  
            });  
  
            // периодический сбор тяжёлых метрик  
            setInterval(function () {  
                collect();  
                redraw();  
                renderPanel();  
            }, 2000);  
        }  
  
        if (window.appready) add();  
        else Lampa.Listener.follow('app', function (e) {  
            if (e.type == 'ready') add();  
        });  
    }  
  
    if (window.Lampa) startPlugin();  
    else {  
        var t = setInterval(function () {  
            if (window.Lampa) {  
                clearInterval(t);  
                startPlugin();  
            }  
        }, 200);  
    }  
})();
