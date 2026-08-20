(function () {
    if (window.listCard) return;
    window.listCard = true;

    document.head.insertAdjacentHTML(
        'beforeend',
        '<style>' +

        /* =========================
           БАЗОВЫЙ ВИД КАРТОЧКИ
           ========================= */

        '.card__title{display:none!important}' +
        '.card__age{display:none!important}' +
        '.card.focus .card-watched{display:none!important}' +

        /* Иконки */
        '.card__icons{' +
            'top:0.5em!important;' +
            'left:auto!important;' +
            'right:0.5em!important;' +
            'justify-content:flex-end!important;' +
        '}' +

        '.card__icons-inner{' +
            'background:none!important;' +
            'border-radius:0!important;' +
            'flex-direction:column!important;' +
        '}' +

        '.card__icons-inner>.card__icon{' +
            'margin-bottom:0.2em' +
        '}' +

        '.card__icon{' +
            'filter:' +
            'drop-shadow(0 1px 4px rgba(0,0,0,1)) ' +
            'drop-shadow(0 0 8px rgba(0,0,0,0.9))!important' +
        '}' +


        /* =========================
           НИЖНЯЯ ОБЛАСТЬ
           ========================= */

        '.card__overlay{' +
            'position:absolute;' +
            'left:0;' +
            'right:0;' +
            'bottom:0;' +

            'padding:0 0.4em 0.25em 0.4em;' +

            'background:' +
            'linear-gradient(' +
                'to bottom,' +
                'rgba(0,0,0,0.45) 0%,' +
                'rgba(0,0,0,0.62) 35%,' +
                'rgba(0,0,0,0.78) 65%,' +
                'rgba(0,0,0,0.94) 100%' +
            ');' +

            'border-bottom-left-radius:1em;' +
            'border-bottom-right-radius:1em;' +

            'z-index:1;' +
            'pointer-events:none;' +
        '}' +


        /* =========================
           МЯГКОЕ ЗАТЕМНЕНИЕ + BLUR
           НАД НИЖНЕЙ ЧАСТЬЮ ПОСТЕРА
           ========================= */

        '.card__overlay::before{' +
            'content:"";' +
            'position:absolute;' +

            'left:0;' +
            'right:0;' +

            'bottom:100%;' +
            'height:5em;' +

            'background:' +
            'linear-gradient(' +
                'to bottom,' +
                'rgba(0,0,0,0) 0%,' +
                'rgba(0,0,0,0.03) 12%,' +
                'rgba(0,0,0,0.07) 25%,' +
                'rgba(0,0,0,0.13) 40%,' +
                'rgba(0,0,0,0.22) 55%,' +
                'rgba(0,0,0,0.38) 72%,' +
                'rgba(0,0,0,0.55) 88%,' +
                'rgba(0,0,0,0.65) 100%' +
            ');' +

            'pointer-events:none;' +
        '}' +


        /*
         * Очень лёгкое размытие только
         * в нижней части постера.
         *
         * Не используется filter:blur()
         * на самом overlay, поэтому текст
         * остаётся абсолютно резким.
         */

        '.card__overlay::after{' +
            'content:"";' +
            'position:absolute;' +

            'left:0;' +
            'right:0;' +

            'top:-3.5em;' +
            'bottom:0;' +

            'background:rgba(0,0,0,0.035);' +

            'backdrop-filter:blur(2px);' +
            '-webkit-backdrop-filter:blur(2px);' +

            'pointer-events:none;' +
            'z-index:-1;' +
        '}' +


        /* =========================
           НАЗВАНИЕ
           ========================= */

        '.card__overlay-title{' +
            'font-size:1.45em;' +
            'font-weight:500;' +
            'line-height:1.1;' +
            'color:#fff;' +

            'overflow:hidden;' +
            'text-overflow:ellipsis;' +

            'display:-webkit-box;' +
            '-webkit-line-clamp:2;' +
            'line-clamp:2;' +
            '-webkit-box-orient:vertical;' +

            'margin-bottom:0.15em;' +
        '}' +


        /* =========================
           СТАТУС
           ========================= */

        '.card__status-row{' +
            'display:flex;' +
            'align-items:baseline;' +
            'margin-bottom:0.15em;' +
            'line-height:1;' +
            'overflow:hidden;' +
            'white-space:nowrap;' +
            'min-width:0;' +
        '}' +

        '.card__status-row:empty{' +
            'display:none' +
        '}' +

        '.card__status-row .card__status{' +
            'position:static!important;' +
            'left:auto!important;' +
            'top:auto!important;' +
            'bottom:auto!important;' +

            'background:none!important;' +
            'padding:0!important;' +
            'border-radius:0!important;' +

            'font-size:0.95em!important;' +

            'display:flex!important;' +
            'align-items:baseline!important;' +

            'pointer-events:none;' +
            'white-space:nowrap;' +
        '}' +

        '.card__status-row .card__status .tvs-icon{' +
            'font-size:1.1em;' +
            'margin-right:0.2em;' +
            'flex-shrink:0;' +
        '}' +

        '.card__status-row .card__status .tvs-text{' +
            'font-size:0.95em;' +
            'font-weight:500;' +
            'color:#ccc;' +

            'overflow:hidden;' +
            'text-overflow:ellipsis;' +
            'white-space:nowrap;' +

            'flex-shrink:1;' +
            'min-width:0;' +
        '}' +


        /* =========================
           ГОД + ЖАНР
           ========================= */

        '.card__badge{' +
            'display:flex;' +
            'flex-wrap:nowrap;' +
            'align-items:center;' +
            'width:100%;' +
            'overflow:hidden;' +
        '}' +

        '.card__badge-year{' +
            'font-size:0.95em;' +
            'color:#ccc;' +
            'flex-shrink:0;' +
        '}' +

        '.card__badge-genre,' +
        '.card__badge .card__type{' +
            'flex:1 1 auto;' +
            'min-width:0;' +

            'overflow:hidden;' +
            'text-overflow:ellipsis;' +
            'white-space:nowrap;' +

            'margin-left:0.4em;' +
        '}' +

        '.card__badge-year+.card__badge-genre::before,' +
        '.card__badge-year+.card__type::before{' +
            'content:"\\2022";' +
            'margin-right:0.4em;' +
            'color:#ccc;' +
            'font-size:0.95em;' +
        '}' +


        /* =========================
           TYPE
           ========================= */

        '.card__badge .card__type{' +
            'position:static!important;' +
            'top:auto!important;' +
            'left:auto!important;' +

            'background:none!important;' +
            'padding:0!important;' +
            'border-radius:0!important;' +

            'font-size:0.95em!important;' +
            'color:#ccc!important;' +
        '}' +


        /* =========================
           ПРАВАЯ ЧАСТЬ
           ========================= */

        '.card__badge-right{' +
            'display:flex;' +
            'align-items:center;' +
            'flex-shrink:0;' +
            'margin-left:auto;' +
        '}' +

        '.card__badge-right>*+*{' +
            'margin-left:0.4em;' +
        '}' +


        /* Качество */
        '.card__badge-right .card__quality{' +
            'position:static!important;' +
            'left:auto!important;' +
            'bottom:auto!important;' +

            'padding:0!important;' +
            'background:none!important;' +

            'color:#ddd!important;' +
            'font-size:1.1em!important;' +
            'font-weight:500;' +

            'border-radius:0!important;' +
        '}' +

        '.card__badge-right .card__quality>div{' +
            'display:inline;' +
        '}' +


        /* Рейтинг */
        '.card__badge-right .card__vote{' +
            'position:static!important;' +
            'right:auto!important;' +
            'bottom:auto!important;' +

            'background:none!important;' +

            'color:#ddd!important;' +
            'font-size:1.1em!important;' +
            'font-weight:500;' +

            'padding:0!important;' +
            'border-radius:0!important;' +
        '}' +


        /* =========================
           СКРЫВАЕМ ШТАТНЫЕ ЭЛЕМЕНТЫ
           ========================= */

        '.card__status,' +
        '.card__type,' +
        '.card__quality,' +
        '.card__vote{' +
            'visibility:hidden!important;' +
        '}' +

        '.card__status-row .card__status,' +
        '.card__badge .card__type,' +
        '.card__badge-right .card__quality,' +
        '.card__badge-right .card__vote{' +
            'visibility:visible!important;' +
        '}' +

        '</style>'
    );


    /* =========================
       НАСТРОЙКИ
       ========================= */

    var WATCH_TIMEOUT = 8000;

    var activeChildObservers = [];


    /* =========================
       ПЕРЕНОС ЭЛЕМЕНТОВ
       ========================= */

    function relocateExisting(view, statusRow, badge, badgeRight) {

        var status = view.querySelector('.card__status');
        var type = view.querySelector('.card__type');
        var quality = view.querySelector('.card__quality');
        var vote = view.querySelector('.card__vote');


        if (status && status.parentNode !== statusRow) {
            statusRow.appendChild(status);
        }


        if (type && type.parentNode !== badge) {
            badge.insertBefore(type, badgeRight);
        }


        if (
            quality &&
            (
                quality.parentNode !== badgeRight ||
                quality.nextSibling !== vote
            )
        ) {
            badgeRight.insertBefore(
                quality,
                vote && vote.parentNode === badgeRight
                    ? vote
                    : null
            );
        }


        if (vote && vote.parentNode !== badgeRight) {
            badgeRight.appendChild(vote);
        }


        return !!(
            status &&
            type &&
            quality &&
            vote
        );
    }


    /* =========================
       ОЖИДАНИЕ ЭЛЕМЕНТОВ LAMPA
       ========================= */

    function watchOverlayInjects(
        view,
        statusRow,
        badge,
        badgeRight
    ) {

        if (
            relocateExisting(
                view,
                statusRow,
                badge,
                badgeRight
            )
        ) {
            return;
        }


        var watchTimer;


        var childObserver =
            new MutationObserver(function () {

                if (
                    relocateExisting(
                        view,
                        statusRow,
                        badge,
                        badgeRight
                    )
                ) {
                    stopWatching();
                }

            });


        function stopWatching() {

            clearTimeout(watchTimer);

            childObserver.disconnect();

            var idx =
                activeChildObservers.indexOf(
                    childObserver
                );

            if (idx !== -1) {
                activeChildObservers.splice(
                    idx,
                    1
                );
            }
        }


        watchTimer = setTimeout(
            stopWatching,
            WATCH_TIMEOUT
        );


        childObserver.observe(
            view,
            {
                childList: true
            }
        );


        activeChildObservers.push(
            childObserver
        );
    }


    /* =========================
       ОБРАБОТКА КАРТОЧКИ
       ========================= */

    function processCard(card) {

        var data = card.card_data;

        if (!data) return;


        card.dataset.listCard = '1';


        var view =
            card.querySelector('.card__view');

        if (!view) return;


        /* Скрываем стандартный заголовок */

        var titleEl =
            card.querySelector('.card__title');

        var ageEl =
            card.querySelector('.card__age');


        if (titleEl) {
            titleEl.style.display = 'none';
        }

        if (ageEl) {
            ageEl.style.display = 'none';
        }


        /* =========================
           ИКОНКИ
           ========================= */

        var icons =
            card.querySelector('.card__icons');


        if (icons) {

            icons.style.cssText =
                'top:0.5em;' +
                'left:auto;' +
                'right:0.5em;' +
                'justify-content:flex-end;';


            var iconsInner =
                icons.querySelector(
                    '.card__icons-inner'
                );


            if (iconsInner) {

                iconsInner.style.cssText =
                    'background:none;' +
                    'border-radius:0;' +
                    'flex-direction:column;';
            }
        }


        /* =========================
           OVERLAY
           ========================= */

        var overlay =
            document.createElement('div');

        overlay.className =
            'card__overlay';


        /* Название */

        var overlayTitle =
            document.createElement('div');

        overlayTitle.className =
            'card__overlay-title';


        overlayTitle.textContent =
            data.title ||
            data.name ||
            '';


        overlay.appendChild(
            overlayTitle
        );


        /* Статус */

        var statusRow =
            document.createElement('div');

        statusRow.className =
            'card__status-row';


        overlay.appendChild(
            statusRow
        );


        /* Нижняя строка */

        var badge =
            document.createElement('div');

        badge.className =
            'card__badge';


        var year =
            (
                data.release_date ||
                data.first_air_date ||
                ''
            ) + '';


        year = year.slice(0, 4);


        if (year) {

            var yearEl =
                document.createElement('span');

            yearEl.className =
                'card__badge-year';

            yearEl.textContent =
                year;


            badge.appendChild(
                yearEl
            );
        }


        /* Правая часть */

        var badgeRight =
            document.createElement('div');

        badgeRight.className =
            'card__badge-right';


        badge.appendChild(
            badgeRight
        );


        overlay.appendChild(
            badge
        );


        view.appendChild(
            overlay
        );


        /* Ждём штатные элементы Lampa */

        watchOverlayInjects(
            view,
            statusRow,
            badge,
            badgeRight
        );
    }


    /* =========================
       INTERSECTION OBSERVER
       ========================= */

    var intersectionObserver = null;


    if (
        typeof IntersectionObserver !==
        'undefined'
    ) {

        intersectionObserver =
            new IntersectionObserver(
                function (entries) {

                    for (
                        var i = 0;
                        i < entries.length;
                        i++
                    ) {

                        var entry =
                            entries[i];


                        if (
                            !entry.isIntersecting
                        ) {
                            continue;
                        }


                        intersectionObserver
                            .unobserve(
                                entry.target
                            );


                        processCard(
                            entry.target
                        );
                    }

                },
                {
                    rootMargin: '200px'
                }
            );
    }


    /* =========================
       НАБЛЮДЕНИЕ ЗА КАРТОЧКАМИ
       ========================= */

    function observe(card) {

        if (
            !card.card_data ||
            card.dataset.listCard
        ) {
            return;
        }


        if (intersectionObserver) {

            intersectionObserver.observe(
                card
            );

        } else {

            processCard(card);
        }
    }


    /* =========================
       MUTATION OBSERVER
       ========================= */

    var mutationObserver =
        new MutationObserver(
            function (mutations) {

                for (
                    var i = 0;
                    i < mutations.length;
                    i++
                ) {

                    var addedNodes =
                        mutations[i].addedNodes;


                    for (
                        var j = 0;
                        j < addedNodes.length;
                        j++
                    ) {

                        var node =
                            addedNodes[j];


                        if (
                            node.nodeType !== 1
                        ) {
                            continue;
                        }


                        if (
                            node.classList &&
                            node.classList.contains(
                                'card'
                            )
                        ) {

                            observe(node);
                        }


                        if (
                            node.querySelectorAll
                        ) {

                            [].forEach.call(
                                node.querySelectorAll(
                                    '.card'
                                ),
                                observe
                            );
                        }
                    }
                }
            }
        );


    mutationObserver.observe(
        document.body,
        {
            childList: true,
            subtree: true
        }
    );


    /* =========================
       УЖЕ СУЩЕСТВУЮЩИЕ КАРТОЧКИ
       ========================= */

    [].forEach.call(
        document.querySelectorAll(
            '.card'
        ),
        observe
    );


    /* =========================
       LAMPA EVENTS
       ========================= */

    Lampa.Listener.follow(
        'app',
        function (e) {

            if (e.type === 'ready') {

                [].forEach.call(
                    document.querySelectorAll(
                        '.card'
                    ),
                    observe
                );
            }


            if (e.type === 'destroy') {

                if (
                    intersectionObserver
                ) {
                    intersectionObserver
                        .disconnect();
                }


                mutationObserver
                    .disconnect();


                for (
                    var i = 0;
                    i < activeChildObservers.length;
                    i++
                ) {

                    activeChildObservers[i]
                        .disconnect();
                }


                activeChildObservers = [];
            }
        }
    );

})();
