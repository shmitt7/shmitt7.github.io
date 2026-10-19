(function () {  
    'use strict';  
  
    var KEY1 = 'full_btn_priority';  
    var KEY2 = 'full_btn_priority_2';  
  
    function hashOf($btn) {  
        return Lampa.Utils.hash($btn.clone().removeClass('focus').prop('outerHTML'));  
    }  
  
    // Рендер второй вынесенной кнопки  
    function renderSecond() {  
        var cont = $('.full-start-new__buttons');  
        if (!cont.length) return;  
  
        var html = cont.closest('.full-start-new, body');  
        var wanted = (Lampa.Storage.get(KEY2, '') + '');  
  
        // убрать старый клон слота 2  
        cont.find('.button--priority-two').remove();  
  
        if (!wanted) return;  
  
        var found;  
        html.find('.buttons--container > .full-start__button').not('.hide').each(function () {  
            if (hashOf($(this)) === wanted) found = $(this);  
        });  
  
        if (!found) {  
            Lampa.Storage.set(KEY2, ''); // кнопка исчезла (сменился источник) — чистим слот  
            return;  
        }  
  
        var clon = found.clone();  
  
        clon.addClass('button--priority button--priority-two')  
            .removeClass('view--torrent')  
            .on('hover:enter', function () {  
                found.trigger('hover:enter');  
            })  
            .on('hover:long', function () {  
                clon.remove();  
                Lampa.Storage.set(KEY2, '');  
  
                var last = $('.full-start-new .button--play')[0];  
                if (last) Lampa.Controller.toggle('content');  
            });  
  
        // вставить после кнопки слота 1, иначе в начало контейнера  
        var first = cont.find('.button--priority').not('.button--priority-two').last();  
        if (first.length) first.after(clon);  
        else cont.prepend(clon);  
    }  
  
    // Обёртка Storage.set: при установке нового хэша старый сдвигается в слот 2  
    var origSet = Lampa.Storage.set;  
    Lampa.Storage.set = function (name, value) {  
        if (name === KEY1) {  
            var oldVal = (Lampa.Storage.get(KEY1, '') + '');  
            var newVal = (value + '');  
  
            var res = origSet.apply(this, arguments);  
  
            if (newVal) {  
                var second = (Lampa.Storage.get(KEY2, '') + '');  
  
                // дедупликация: если выносится та же кнопка, что в слоте 2 — слот 2 очищаем  
                if (newVal === second) origSet.call(this, KEY2, '', true);  
                // старая кнопка из слота 1 переезжает в слот 2  
                else if (oldVal && oldVal !== newVal) origSet.call(this, KEY2, oldVal, true);  
  
                // исходник удаляет все .button--priority — перерисовываем слот 2  
                setTimeout(renderSecond, 50);  
            }  
  
            return res;  
        }  
        return origSet.apply(this, arguments);  
    };  
  
    // При открытии полной карточки дорисовываем вторую кнопку  
    Lampa.Listener.follow('full', function (e) {  
        if (e.type === 'complite') {  
            setTimeout(renderSecond, 100);  
        }  
    });  
})();
