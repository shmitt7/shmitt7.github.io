
(function () {
    'use strict';

    var ICONS = {
        // Синяя кнопка «Смотреть»: треугольник со скруглёнными углами
        play:
            '<svg width="24" height="24" viewBox="0 0 48 48">' +
            '<path fill="#3B82F6" d="' +
            'M18 13.5 Q15 11.8 15 15.2 V32.8 ' +
            'Q15 36.2 18 34.5 L34 25.7 ' +
            'Q37 24 34 22.3 Z"/>' +
            '</svg>',

        // Зелёная кнопка «Торренты»
        torrent:
            '<svg width="24" height="24" viewBox="0 0 48 48">' +
            '<path fill="#4caf50" d="' +
            'M23.501,44.125c11.016,0,20-8.984,20-20' +
            'c0-11.015-8.984-20-20-20c-11.016,0-20,' +
            '8.985-20,20C3.501,35.141,12.485,44.125,' +
            '23.501,44.125z"/>' +
            '<path fill="#fff" d="' +
            'M43.252,27.114C39.718,25.992,38.055,' +
            '19.625,34,11l-7,1.077c1.615,4.905,8.781,' +
            '16.872,0.728,18.853C20.825,32.722,17.573,' +
            '20.519,15,14l-8,2l10.178,27.081c1.991,' +
            '0.67,4.112,1.044,6.323,1.044c0.982,0,' +
            '1.941-0.094,2.885-0.232l-4.443-8.376' +
            'c6.868,1.552,12.308-0.869,12.962-6.203' +
            'c1.727,2.29,4.089,3.183,6.734,3.172' +
            'C42.419,30.807,42.965,29.006,43.252,27.114z"/>' +
            '</svg>',

        // Красная кнопка «Трейлеры»
        trailer:
            '<svg width="24" height="24" viewBox="0 0 48 48">' +
            '<path fill="#FF0302" d="' +
            'M47.044 12.3709C46.7726 11.3497 46.2378 ' +
            '10.4178 45.493 9.66822C44.7483 8.91869 ' +
            '43.8197 8.37791 42.8003 8.1C39.0476 ' +
            '7.09091 24.0476 7.09091 24.0476 ' +
            '7.09091C24.0476 7.09091 9.04761 ' +
            '7.09091 5.29488 8.1C4.27547 8.37791 ' +
            '3.34693 8.91869 2.60218 9.66822C1.85744 ' +
            '10.4178 1.32262 11.3497 1.05124 ' +
            '12.3709C0.0476075 16.14 0.0476075 24 ' +
            '0.0476075 24C0.0476075 24 0.0476075 ' +
            '31.86 1.05124 35.6291C1.32262 36.6503 ' +
            '1.85744 37.5822 2.60218 38.3318C3.34693 ' +
            '39.0813 4.27547 39.6221 5.29488 ' +
            '39.9C9.04761 40.9091 24.0476 40.9091 ' +
            '24.0476 40.9091C24.0476 40.9091 39.0476 ' +
            '40.9091 42.8003 39.9C43.8197 39.6221 ' +
            '44.7483 39.0813 45.493 38.3318C46.2378 ' +
            '37.5822 46.7726 36.6503 47.044 ' +
            '35.6291C48.0476 31.86 48.0476 24 ' +
            '48.0476 24C48.0476 24 48.0476 16.14 ' +
            '47.044 12.3709Z"/>' +
            '<path fill="#FEFEFE" d="' +
            'M19.1385 31.1373V16.8628L31.684 ' +
            '24.0001L19.1385 31.1373Z"/>' +
            '</svg>'
    };

    var SELECTORS = {
        play: '.button--play',
        torrent: '.view--torrent',
        trailer: '.view--trailer'
    };

    // Последняя кнопка, на которой находился фокус.
    // Храним тип кнопки, а не DOM-элемент: карточка может перерисоваться.
    var lastFocusKey = null;

    var renderTimer = null;
    var focusTimer = null;
    var observers = [];

    // --------------------------------------------------
    // ИКОНКИ
    // --------------------------------------------------

    function setIcon(button, iconName) {
        if (!button || !button.length) return;

        var svg = button.find('svg').first();

        if (svg.length) {
            svg.replaceWith(ICONS[iconName]);
        }
    }

    // --------------------------------------------------
    // ПОИСК КНОПОК
    // --------------------------------------------------

    function getOriginal(card, selector) {
        return card
            .find('.buttons--container > ' + selector)
            .first();
    }

    // --------------------------------------------------
    // СКРЫТИЕ ОРИГИНАЛОВ В МЕНЮ «СМОТРЕТЬ»
    // --------------------------------------------------

    function hideOriginals(card) {
        var torrent = getOriginal(card, SELECTORS.torrent);
        var trailer = getOriginal(card, SELECTORS.trailer);

        if (torrent.length) torrent.addClass('hide');
        if (trailer.length) trailer.addClass('hide');
    }

    // Некоторые обработчики Lampa могут менять классы оригинальных
    // кнопок при обновлении доступности торрентов и трейлеров.
    // Наблюдатель не позволяет им снова попасть в меню «Смотреть».

    function watchOriginals(card) {
        var container = card.find('.buttons--container')[0];

        if (!container || typeof MutationObserver === 'undefined') {
            return;
        }

        var observer = new MutationObserver(function () {
            hideOriginals(card);
        });

        observer.observe(container, {
            attributes: true,
            attributeFilter: ['class'],
            subtree: true
        });

        observers.push(observer);
    }

    // --------------------------------------------------
    // КЛОНИРОВАНИЕ КНОПОК
    // --------------------------------------------------

    function makeClone(source, type) {
        if (!source || !source.length) return $();

        var clone = source.clone(false, false);

        clone
            .removeClass('hide focus')
            .addClass('selector button--extracted')
            .attr('data-plugin-button', type);

        // При активации копии вызываем оригинальную кнопку.
        // Оригинал остаётся в DOM, но скрыт из меню «Смотреть».
        clone.on('hover:enter.lampaExtracted', function () {
            source.trigger('hover:enter');
        });

        // Запоминаем фокус по типу кнопки.
        clone.on('hover:focus.lampaExtracted', function () {
            lastFocusKey = type;
        });

        setIcon(clone, type);

        return clone;
    }

    // --------------------------------------------------
    // ВОССТАНОВЛЕНИЕ ФОКУСА
    // --------------------------------------------------

    function getFocusTarget(container, firstButton) {
        if (lastFocusKey) {
            var saved = container.find(
                '[data-plugin-button="' + lastFocusKey + '"]'
            );

            if (saved.length && !saved.hasClass('hide')) {
                return saved;
            }

            if (lastFocusKey === 'play') {
                var play = container.find(SELECTORS.play).first();

                if (play.length && !play.hasClass('hide')) {
                    return play;
                }
            }
        }

        return firstButton;
    }

    function focusButton(container, button) {
        if (!container || !container.length) return;
        if (!button || !button.length) return;

        Lampa.Controller.collectionSet(container);
        Lampa.Controller.collectionFocus(button[0], container);
    }

    // --------------------------------------------------
    // СОЗДАНИЕ ОСНОВНОГО РЯДА
    // --------------------------------------------------

    function buildButtons(card) {
        var container = card.find('.full-start-new__buttons');
        var play = container.find(SELECTORS.play).first();

        if (!container.length || !play.length) return;

        // Защита от повторной обработки карточки.
        container.find('.button--extracted').remove();

        var torrent = getOriginal(card, SELECTORS.torrent);
        var trailer = getOriginal(card, SELECTORS.trailer);

        // Важно: проверяем доступность до скрытия оригиналов.
        var hasTorrent = torrent.length && !torrent.hasClass('hide');
        var hasTrailer = trailer.length && !trailer.hasClass('hide');

        // Если оригиналы уже были скрыты нашим плагином,
        // повторный вызов всё равно должен восстанавливать копии.
        if (torrent.length && torrent.attr('data-plugin-hidden') === '1') {
            hasTorrent = true;
        }

        if (trailer.length && trailer.attr('data-plugin-hidden') === '1') {
            hasTrailer = true;
        }

        // Убираем оригиналы из внутреннего меню.
        // Внешние копии продолжают вызывать оригинальные действия.
        if (torrent.length) {
            torrent.attr('data-plugin-hidden', '1').addClass('hide');
        }

        if (trailer.length) {
            trailer.attr('data-plugin-hidden', '1').addClass('hide');
        }

        // Сбрасываем старые обработчики плагина на кнопке play.
        play.off('.lampaExtracted');

        // Обновляем иконку «Смотреть».
        setIcon(play, 'play');

        play.attr('data-plugin-button', 'play');

        play.on('hover:focus.lampaExtracted', function () {
            lastFocusKey = 'play';
        });

        // Порядок: Торренты → Смотреть → Трейлеры.
        var firstButton = $();

        if (hasTorrent) {
            var torrentClone = makeClone(torrent, 'torrent');

            if (torrentClone.length) {
                play.before(torrentClone);
                firstButton = torrentClone;
            }
        }

        if (hasTrailer) {
            var trailerClone = makeClone(trailer, 'trailer');

            if (trailerClone.length) {
                play.after(trailerClone);

                if (!firstButton.length) {
                    firstButton = play;
                }
            }
        }

        if (!firstButton.length && !play.hasClass('hide')) {
            firstButton = play;
        }

        // Устанавливаем наблюдатель только один раз для контейнера.
        if (!container.data('lampaExtractedObserver')) {
            container.data('lampaExtractedObserver', true);
            watchOriginals(card);
        }

        // Даём Lampa закончить построение строки перед фокусировкой.
        if (focusTimer) clearTimeout(focusTimer);

        focusTimer = setTimeout(function () {
            var target = getFocusTarget(container, firstButton);

            if (target.length && !target.hasClass('hide')) {
                focusButton(container, target);
            }
        }, 100);
    }

    // --------------------------------------------------
    // СОБЫТИЯ LAMPA
    // --------------------------------------------------

    Lampa.Listener.follow('full', function (event) {
        if (event.type !== 'complite') return;

        var activity = event.object && event.object.activity;

        if (!activity || typeof activity.render !== 'function') return;

        var card = $(activity.render());

        if (renderTimer) clearTimeout(renderTimer);

        renderTimer = setTimeout(function () {
            buildButtons(card);
        }, 100);
    });

    // При возврате в карточку восстанавливаем последнюю кнопку.
    Lampa.Controller.listener.follow('toggle', function (event) {
        if (event.name !== 'full_start') return;

        if (focusTimer) clearTimeout(focusTimer);

        focusTimer = setTimeout(function () {
            if (!lastFocusKey) return;

            var container = $('.full-start-new__buttons').last();

            if (!container.length) return;

            var target;

            if (lastFocusKey === 'play') {
                target = container.find(SELECTORS.play).first();
            } else {
                target = container.find(
                    '[data-plugin-button="' + lastFocusKey + '"]'
                ).first();
            }

            if (target.length && !target.hasClass('hide')) {
                focusButton(container, target);
            }
        }, 150);
    });

    // --------------------------------------------------
    // ОЧИСТКА
    // --------------------------------------------------

    Lampa.Listener.follow('app', function (event) {
        if (event.type !== 'destroy') return;

        if (renderTimer) clearTimeout(renderTimer);
        if (focusTimer) clearTimeout(focusTimer);

        observers.forEach(function (observer) {
            observer.disconnect();
        });

        observers = [];
        lastFocusKey = null;
    });

})();
