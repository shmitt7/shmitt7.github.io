(function () {
    if (window.listCard) return;
    window.listCard = true;

    document.head.insertAdjacentHTML('beforeend', '<style>' +

        /* =========================================
           ОСНОВА КАРТОЧКИ
        ========================================= */

        '.card{' +
            'transition:transform .18s ease,filter .18s ease!important;' +
        '}' +

        '.card__view{' +
            'overflow:hidden!important;' +
            'border-radius:.55em!important;' +
        '}' +

        /* тонкая рамка */
        '.card__view:after{' +
            'content:"";' +
            'position:absolute;' +
            'inset:0;' +
            'border:1px solid rgba(255,255,255,.12);' +
            'border-radius:inherit;' +
            'pointer-events:none;' +
            'z-index:20;' +
            'transition:all .18s ease;' +
        '}' +

        /* focus */
        '.card.focus{' +
            'transform:scale(1.035)!important;' +
            'z-index:30!important;' +
        '}' +

        '.card.focus .card__view:after{' +
            'border-color:rgba(255,255,255,.7);' +
            'box-shadow:' +
                '0 0 0 .08em rgba(255,255,255,.08),' +
                '0 0 1.8em rgba(255,255,255,.12);' +
        '}' +


        /* =========================================
           СКРЫВАЕМ СТАРЫЕ ЭЛЕМЕНТЫ
        ========================================= */

        '.card__age{' +
            'display:none!important;' +
        '}' +

        '.card__status,' +
        '.card__type,' +
        '.card__quality,' +
        '.card__vote{' +
            'visibility:hidden!important;' +
        '}' +


        /* =========================================
           ИКОНКИ СПРАВА
        ========================================= */

        '.card__icons{' +
            'top:.55em!important;' +
            'left:auto!important;' +
            'right:.55em!important;' +
            'z-index:25!important;' +
            'justify-content:flex-end!important;' +
        '}' +

        '.card__icons-inner{' +
            'background:none!important;' +
            'border-radius:0!important;' +
            'flex-direction:column!important;' +
            'gap:.3em!important;' +
        '}' +

        '.card__icons-inner>.card__icon{' +
            'margin:0!important;' +
        '}' +

        '.card__icon{' +
            'filter:' +
                'drop-shadow(0 2px 5px rgba(0,0,0,.95))' +
                'drop-shadow(0 0 8px rgba(0,0,0,.5))' +
            '!important;' +
        '}' +


        /* =========================================
           НИЖНИЙ ГРАДИЕНТ
        ========================================= */

        '.lc9-overlay{' +
            'position:absolute;' +
            'left:0;' +
            'right:0;' +
            'bottom:0;' +
            'z-index:15;' +
            'padding:4em .7em .65em;' +
            'pointer-events:none;' +
            'background:' +
                'linear-gradient(' +
                    'to bottom,' +
                    'rgba(0,0,0,0) 0%,' +
                    'rgba(0,0,0,.02) 18%,' +
                    'rgba(0,0,0,.22) 42%,' +
                    'rgba(0,0,0,.72) 72%,' +
                    'rgba(0,0,0,.97) 100%' +
                ');' +
        '}' +


        /* =========================================
           НАЗВАНИЕ
        ========================================= */

        '.lc9-title{' +
            'display:-webkit-box;' +
            '-webkit-box-orient:vertical;' +
            '-webkit-line-clamp:2;' +
            'overflow:hidden;' +
            'font-size:1.22em;' +
            'font-weight:700;' +
            'line-height:1.12;' +
            'color:#fff;' +
            'text-shadow:0 2px 8px rgba(0,0,0,.95);' +
            'margin:0 0 .38em 0;' +
        '}' +


        /* =========================================
           ПОДЧЁРКИВАНИЕ ПОД НАЗВАНИЕМ
        ========================================= */

        '.lc9-line{' +
            'width:2.2em;' +
            'height:2px;' +
            'background:rgba(255,255,255,.8);' +
            'border-radius:2px;' +
            'margin-bottom:.42em;' +
            'box-shadow:0 1px 4px rgba(0,0,0,.8);' +
        '}' +


        /* =========================================
           META ПАНЕЛЬ
        ========================================= */

        '.lc9-meta{' +
            'display:flex;' +
            'align-items:center;' +
            'gap:.38em;' +
            'min-width:0;' +
            'padding:.28em .45em;' +
            'margin-bottom:.5em;' +
            'border-radius:.3em;' +
            'background:rgba(0,0,0,.52);' +
            'border:1px solid rgba(255,255,255,.13);' +
            'box-shadow:0 2px 8px rgba(0,0,0,.3);' +
            'font-size:.76em;' +
            'line-height:1.2;' +
            'color:rgba(255,255,255,.88);' +
            'white-space:nowrap;' +
            'overflow:hidden;' +
        '}' +

        '.lc9-year{' +
            'font-weight:700;' +
            'color:#fff;' +
            'flex-shrink:0;' +
        '}' +

        '.lc9-separator{' +
            'opacity:.45;' +
            'flex-shrink:0;' +
        '}' +

        '.lc9-type{' +
            'flex-shrink:0;' +
        '}' +

        '.lc9-genres{' +
            'min-width:0;' +
            'overflow:hidden;' +
            'text-overflow:ellipsis;' +
            'white-space:nowrap;' +
            'color:rgba(255,255,255,.72);' +
        '}' +


        /* =========================================
           НИЖНЯЯ СТРОКА
        ========================================= */

        '.lc9-bottom{' +
            'display:flex;' +
            'align-items:center;' +
            'justify-content:space-between;' +
            'gap:.5em;' +
            'min-width:0;' +
        '}' +


        /* =========================================
           QUALITY
        ========================================= */

        '.lc9-quality{' +
            'display:inline-flex;' +
            'align-items:center;' +
            'justify-content:center;' +
            'height:1.45em;' +
            'min-width:2.1em;' +
            'padding:0 .4em;' +
            'border:1px solid rgba(255,205,0,.95);' +
            'border-radius:.18em;' +
            'background:rgba(0,0,0,.48);' +
            'color:#ffd400;' +
            'font-size:.76em;' +
            'font-weight:800;' +
            'line-height:1;' +
            'box-shadow:0 1px 6px rgba(0,0,0,.55);' +
        '}' +


        /* =========================================
           РЕЙТИНГ
        ========================================= */

        '.lc9-rating{' +
            'display:flex;' +
            'align-items:center;' +
            'gap:.22em;' +
            'color:#fff;' +
            'font-size:.88em;' +
            'font-weight:700;' +
            'text-shadow:0 1px 5px rgba(0,0,0,.9);' +
        '}' +

        '.lc9-star{' +
            'color:#ffd400;' +
            'font-size:1.05em;' +
        '}' +


        /* =========================================
           СТАТУС / ПРОГРЕСС
        ========================================= */

        '.lc9-status{' +
            'font-size:.75em;' +
            'font-weight:600;' +
            'color:rgba(255,255,255,.72);' +
            'overflow:hidden;' +
            'text-overflow:ellipsis;' +
            'white-space:nowrap;' +
            'text-shadow:0 1px 5px #000;' +
        '}' +


        /* =========================================
           FOCUS
        ========================================= */

        '.card.focus .lc9-overlay{' +
            'padding-bottom:.8em;' +
        '}' +

        '.card.focus .lc9-title{' +
            'text-shadow:0 2px 12px rgba(0,0,0,1);' +
        '}' +

        '.card.focus .lc9-meta{' +
            'background:rgba(0,0,0,.65);' +
            'border-color:rgba(255,255,255,.22);' +
        '}' +

        '.card.focus .lc9-quality{' +
            'box-shadow:' +
                '0 0 10px rgba(255,205,0,.16),' +
                '0 1px 6px rgba(0,0,0,.55);' +
        '}' +


        /* =========================================
           WATCHED
        ========================================= */

        '.card.focus .card-watched{' +
            'display:none!important;' +
        '}' +

    '</style>');


    /* =========================================
       НАСТРОЙКИ
    ========================================= */

    var WATCH_TIMEOUT = 8000;
    var activeChildObservers = [];


    /* =========================================
       ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    ========================================= */

    function makeElement(className, text) {
        var el = document.createElement('span');

        el.className = className;

        if (text !== undefined) {
            el.textContent = text;
        }

        return el;
    }


    function getYear(data) {

        return (
            data.release_date ||
            data.first_air_date ||
            ''
        ).toString().slice(0, 4);
    }


    function getType(data) {

        var type =
            data.media_type ||
            data.type ||
            data.object_type ||
            '';

        type = String(type).toLowerCase();

        if (
            type === 'tv' ||
            type === 'serial' ||
            type === 'series' ||
            type === 'show'
        ) {
            return 'Сериал';
        }

        return 'Фильм';
    }


    function getTitle(card, data) {

        var titleEl =
            card.querySelector('.card__title');

        if (titleEl) {

            var title =
                titleEl.textContent.trim();

            if (title) return title;
        }

        return (
            data.title ||
            data.name ||
            data.original_title ||
            data.original_name ||
            ''
        );
    }


    function getGenres(data) {

        var genres = [];

        if (Array.isArray(data.genres)) {

            data.genres.forEach(function (genre) {

                if (typeof genre === 'string') {
                    genres.push(genre);
                }

                else if (
                    genre &&
                    genre.name
                ) {
                    genres.push(
                        genre.name
                    );
                }
            });
        }

        else if (Array.isArray(data.genre)) {

            data.genre.forEach(function (genre) {

                if (typeof genre === 'string') {
                    genres.push(genre);
                }

                else if (
                    genre &&
                    genre.name
                ) {
                    genres.push(
                        genre.name
                    );
                }
            });
        }

        return genres.slice(0, 2);
    }


    /* =========================================
       СОЗДАНИЕ КАРТОЧКИ
    ========================================= */

    function createOverlay(card, view, data) {

        var old =
            view.querySelector('.lc9-overlay');

        if (old) {
            old.remove();
        }


        var overlay =
            document.createElement('div');

        overlay.className =
            'lc9-overlay';


        /* ---------- TITLE ---------- */

        var title =
            getTitle(card, data);

        if (title) {

            var titleEl =
                makeElement(
                    'lc9-title',
                    title
                );

            overlay.appendChild(
                titleEl
            );
        }


        /* ---------- LINE ---------- */

        var line =
            document.createElement('div');

        line.className =
            'lc9-line';

        overlay.appendChild(line);


        /* ---------- META ---------- */

        var meta =
            document.createElement('div');

        meta.className =
            'lc9-meta';


        var year =
            getYear(data);

        var type =
            getType(data);

        var genres =
            getGenres(data);


        if (year) {

            meta.appendChild(
                makeElement(
                    'lc9-year',
                    year
                )
            );
        }


        if (year && type) {

            meta.appendChild(
                makeElement(
                    'lc9-separator',
                    '•'
                )
            );
        }


        if (type) {

            meta.appendChild(
                makeElement(
                    'lc9-type',
                    type
                )
            );
        }


        if (
            genres.length &&
            type
        ) {

            meta.appendChild(
                makeElement(
                    'lc9-separator',
                    '•'
                )
            );


            meta.appendChild(
                makeElement(
                    'lc9-genres',
                    genres.join(', ')
                )
            );
        }


        if (meta.childNodes.length) {

            overlay.appendChild(
                meta
            );
        }


        /* ---------- BOTTOM ---------- */

        var bottom =
            document.createElement('div');

        bottom.className =
            'lc9-bottom';


        /* ---------- STATUS ---------- */

        var left =
            document.createElement('div');

        left.style.cssText =
            'min-width:0;overflow:hidden;';


        var status =
            card.querySelector(
                '.card__status'
            );


        if (status) {

            var statusText =
                status.querySelector(
                    '.tvs-text'
                );

            var text =
                statusText
                    ? statusText.textContent.trim()
                    : status.textContent.trim();


            if (text) {

                left.appendChild(
                    makeElement(
                        'lc9-status',
                        text
                    )
                );
            }
        }


        /* ---------- RIGHT ---------- */

        var right =
            document.createElement('div');

        right.style.cssText =
            'display:flex;' +
            'align-items:center;' +
            'gap:.45em;' +
            'flex-shrink:0;';


        /* ---------- QUALITY ---------- */

        var quality =
            card.querySelector(
                '.card__quality'
            );


        if (quality) {

            var qualityText =
                quality.textContent.trim();

            if (qualityText) {

                right.appendChild(
                    makeElement(
                        'lc9-quality',
                        qualityText
                    )
                );
            }
        }


        /* ---------- RATING ---------- */

        var vote =
            card.querySelector(
                '.card__vote'
            );


        if (vote) {

            var voteText =
                vote.textContent.trim();

            if (voteText) {

                var rating =
                    document.createElement(
                        'span'
                    );

                rating.className =
                    'lc9-rating';


                rating.appendChild(
                    makeElement(
                        'lc9-star',
                        '★'
                    )
                );


                rating.appendChild(
                    makeElement(
                        'lc9-vote-value',
                        voteText
                    )
                );


                right.appendChild(
                    rating
                );
            }
        }


        bottom.appendChild(left);
        bottom.appendChild(right);

        overlay.appendChild(bottom);


        view.appendChild(overlay);
    }


    /* =========================================
       СЛЕДИМ ЗА ДИНАМИЧЕСКИМИ ДАННЫМИ
    ========================================= */

    function watchCard(card, view, data) {

        var timer;


        var observer =
            new MutationObserver(
                function () {

                    clearTimeout(timer);


                    timer =
                        setTimeout(
                            function () {

                                if (
                                    document.body.contains(
                                        card
                                    )
                                ) {

                                    createOverlay(
                                        card,
                                        view,
                                        data
                                    );
                                }

                            },
                            60
                        );
                }
            );


        observer.observe(
            card,
            {
                childList: true,
                subtree: true,
                characterData: true
            }
        );


        timer =
            setTimeout(
                function () {

                    observer.disconnect();


                    var index =
                        activeChildObservers
                            .indexOf(
                                observer
                            );


                    if (index !== -1) {

                        activeChildObservers
                            .splice(
                                index,
                                1
                            );
                    }

                },
                WATCH_TIMEOUT
            );


        activeChildObservers.push(
            observer
        );
    }


    /* =========================================
       PROCESS CARD
    ========================================= */

    function processCard(card) {

        var data =
            card.card_data;

        if (!data) return;


        card.dataset.listCard =
            '1';


        var view =
            card.querySelector(
                '.card__view'
            );

        if (!view) return;


        /* возраст */

        var age =
            card.querySelector(
                '.card__age'
            );

        if (age) {
            age.style.display =
                'none';
        }


        /* иконки */

        var icons =
            card.querySelector(
                '.card__icons'
            );


        if (icons) {

            icons.style.cssText =
                'top:.55em;' +
                'left:auto;' +
                'right:.55em;' +
                'justify-content:flex-end;';


            var inner =
                icons.querySelector(
                    '.card__icons-inner'
                );


            if (inner) {

                inner.style.cssText =
                    'background:none;' +
                    'border-radius:0;' +
                    'flex-direction:column;' +
                    'gap:.3em;';
            }
        }


        /* собственный интерфейс */

        createOverlay(
            card,
            view,
            data
        );


        /* следим за Lampa */

        watchCard(
            card,
            view,
            data
        );
    }


    /* =========================================
       INTERSECTION OBSERVER
    ========================================= */

    var intersectionObserver =
        null;


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
                    rootMargin:
                        '250px'
                }
            );
    }


    /* =========================================
       OBSERVE CARD
    ========================================= */

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


    /* =========================================
       MUTATION OBSERVER
    ========================================= */

    var mutationObserver =
        new MutationObserver(
            function (mutations) {

                for (
                    var i = 0;
                    i < mutations.length;
                    i++
                ) {

                    var nodes =
                        mutations[i]
                            .addedNodes;


                    for (
                        var j = 0;
                        j < nodes.length;
                        j++
                    ) {

                        var node =
                            nodes[j];


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


    /* =========================================
       УЖЕ СУЩЕСТВУЮЩИЕ КАРТОЧКИ
    ========================================= */

    [].forEach.call(
        document.querySelectorAll(
            '.card'
        ),
        observe
    );


    /* =========================================
       LAMPA
    ========================================= */

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
