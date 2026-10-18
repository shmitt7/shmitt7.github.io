(function () {  
    if (window.onlineGroupBtn) return;  
    window.onlineGroupBtn = true;  
  
    // источники, которые будут в меню  
    var SOURCES = [  
        { title: 'Online Mod', url: 'https://nb557.github.io/plugins/online_mod.js' },  
        { title: 'BWA',        url: 'https://bwa.ad/rc' },  
        { title: 'Z01',        url: 'http://z01.online/live' }  
    ];  
  
    // классы штатных кнопок, которые трогать нельзя  
    var SKIP = '.button--play,.button--book,.button--reaction,.button--subscribe,.button--options,.view--torrent,.view--trailer,.view--online-src,.button--priority';  
  
    var ICON = '<svg width="24" height="24" viewBox="0 0 48 48" fill="none">' +  
        '<circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="3"/>' +  
        '<path d="M24 4c-5 5.5-7.5 12-7.5 20S19 38.5 24 44c5-5.5 7.5-12 7.5-20S29 9.5 24 4z" stroke="currentColor" stroke-width="3"/>' +  
        '<path d="M5 19h38M5 29h38" stroke="currentColor" stroke-width="3"/>' +  
        '</svg><span>Онлайн</span>';  
  
    function ourButton() {  
        return $('<div class="full-start__button selector view--online-src">' + ICON + '</div>');  
    }  
  
    // лишние кнопки = кнопки онлайн-плагинов, которые другие плагины накидали в ряд  
    function extraButtons($target) {  
        return $target.find('.full-start__button').not(SKIP);  
    }  
  
    function openMenu(e, $target) {  
        var items = [];  
  
        // сначала кнопки уже установленных плагинов  
        extraButtons($target).each(function () {  
            var $b = $(this);  
            var icon = $b.find('svg').prop('outerHTML');  
            items.push({  
                title: $b.text().trim() || 'Источник',  
                subtitle: $b.data('subtitle'),  
                template: icon ? 'selectbox_icon' : 'selectbox_item',  
                icon: icon,  
                btn: $b  
            });  
        });  
  
        // затем три фиксированных источника  
        SOURCES.forEach(function (s) {  
            items.push({ title: s.title, source: s });  
        });  
  
        Lampa.Select.show({  
            title: 'Онлайн',  
            items: items,  
            onSelect: function (a) {  
                if (a.btn) {  
                    a.btn.trigger('hover:enter'); // жмём реальную кнопку плагина  
                } else {  
                    loadAndPress(a.source, e);  
                }  
                Lampa.Controller.toggle('content');  
            },  
            onBack: function () {  
                Lampa.Controller.toggle('content');  
            }  
        });  
    }  
  
    // грузим скрипт и после загрузки ищем кнопку, которую плагин добавил, и жмём её  
    function loadAndPress(src, e) {  
        Lampa.Noty.show('Загрузка: ' + src.title);  
  
        // запоминаем текущие кнопки, чтобы потом найти новую  
        var before = $('.full-start__button').toArray();  
  
        Lampa.Utils.putScript([src.url], function () {  
            // даём плагину время отрисовать свою кнопку  
            setTimeout(function () {  
                var fresh = $('.full-start__button').toArray().filter(function (el) {  
                    return before.indexOf(el) === -1 && !$(el).hasClass('hide');  
                });  
  
                if (fresh.length) {  
                    $(fresh[0]).trigger('hover:enter');  
                } else {  
                    Lampa.Noty.show('Плагин загружен, но кнопка не найдена');  
                }  
            }, 1500);  
        }, function () {  
            Lampa.Noty.show('Не удалось загрузить: ' + src.title);  
        });  
    }  
  
    Lampa.Listener.follow('full', function (e) {  
        if (e.type !== 'complite') return;  
  
        var $target = e.body.find('.full-start-new__buttons');  
        if (!$target.length || $target.find('.view--online-src').length) return;  
  
        var $btn = ourButton();  
  
        $btn.on('hover:enter', function () {  
            openMenu(e, $target);  
        });  
  
        // после торрента, а если его нет — первой  
        var $torrent = $target.find('.view--torrent').not('.hide').last();  
        if ($torrent.length) $torrent.after($btn);  
        else $target.prepend($btn);  
  
        // прячем лишние кнопки онлайн-плагинов из общего ряда  
        extraButtons($target).addClass('hide');  
  
        // фокус-позиция для возврата  
        var start = e.link && e.link.items && e.link.items[0];  
        if (start) {  
            $btn.on('hover:focus hover:enter hover:hover hover:touch', function (ev) {  
                start.last = ev.target;  
            });  
        }  
    });  
})();
