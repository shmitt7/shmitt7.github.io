(function () {
    if (window.listCard) return;
    window.listCard = true;

    document.head.insertAdjacentHTML('beforeend', '<style>' +

        /* =========================
           CARD
        ========================= */

        '.card{' +
            'transition:transform .22s ease,filter .22s ease!important;' +
        '}' +

        '.card__view{' +
            'overflow:hidden!important;' +
            'border-radius:0.65em!important;' +
        '}' +

        /* лёгкая рамка */
        '.card__view:after{' +
            'content:"";' +
            'position:absolute;' +
            'inset:0;' +
            'border:1px solid rgba(255,255,255,.10);' +
            'border-radius:inherit;' +
            'pointer-events:none;' +
            'z-index:8;' +
            'transition:all .22s ease;' +
        '}' +

        /* focus */
        '.card.focus{' +
            'transform:scale(1.035)!important;' +
            'z-index:20!important;' +
            'filter:brightness(1.05);' +
        '}' +

        '.card.focus .card__view:after{' +
            'border-color:rgba(255,255,255,.65);' +
            'box-shadow:0 0 0 .08em rgba(255,255,255,.10),0 0 2em rgba(0,0,0,.8);' +
        '}' +

        /* =========================
           TITLE
        ========================= */

        '.card__title{' +
            'display:block!important;' +
            'font-size:1.25em!important;' +
            'font-weight:700!important;' +
            'line-height:1.12!important;' +
            'max-height:2.25em!important;' +
            'margin:0!important;' +
            'padding:0!important;' +
            'overflow:hidden!important;' +
            'text-overflow:ellipsis!important;' +
            'display:-webkit-box!important;' +
            '-webkit-line-clamp:2!important;' +
            'line-clamp:2!important;' +
            '-webkit-box-orient:vertical!important;' +
            'color:#fff!important;' +
            'text-shadow:0 2px 8px rgba(0,0,0,.9)!important;' +
        '}' +

        /* возраст убираем */
        '.card__age{' +
            'display:none!important;' +
        '}' +

        /* =========================
           ICONS
        ========================= */

        '.card__icons{' +
            'top:.65em!important;' +
            'left:auto!important;' +
            'right:.65em!important;' +
            'z-index:10!important;' +
            'justify-content:flex-end!important;' +
        '}' +

        '.card__icons-inner{' +
            'background:none!important;' +
            'border-radius:0!important;' +
            'flex-direction:column!important;' +
            'gap:.35em!important;' +
        '}' +

        '.card__icons-inner>.card__icon{' +
            'margin:0!important;' +
        '}' +

        '.card__icon{' +
            'filter:drop-shadow(0 2px 5px rgba(0,0,0,.95))!important;' +
        '}' +

        /* =========================
           OUR OVERLAY
        ========================= */

        '.lc-overlay{' +
            'position:absolute;' +
            'left:0;' +
            'right:0;' +
            'bottom:0;' +
            'z-index:7;' +
            'padding:4.5em .75em .7em;' +
            'display:flex;' +
            'flex-direction:column;' +
            'justify-content:flex-end;' +
            'pointer-events:none;' +
            'background:linear-gradient(' +
                'to bottom,' +
                'rgba(0,0,0,0) 0%,' +
                'rgba(0,0,0,.03) 12%,' +
                'rgba(0,0,0,.35) 35%,' +
                'rgba(0,0,0,.78) 70%,' +
                'rgba(0,0,0,.96) 100%' +
            ');' +
        '}' +

        /* =========================
           META ROW
        ========================= */

        '.lc-meta{' +
            'display:flex;' +
            'align-items:center;' +
            'gap:.4em;' +
            'min-height:1.45em;' +
            'margin-bottom:.28em;' +
            'font-size:.82em;' +
            'font-weight:600;' +
            'white-space:nowrap;' +
            'overflow:hidden;' +
            'color:rgba(255,255,255,.82);' +
            'text-shadow:0 1px 5px #000;' +
        '}' +

        '.lc-year{' +
            'color:#fff;' +
            'font-weight:700;' +
        '}' +

        '.lc-dot{' +
            'opacity:.45;' +
        '}' +

        '.lc-type{' +
            'overflow:hidden;' +
            'text-overflow:ellipsis;' +
        '}' +

        /* =========================
           TITLE INSIDE OVERLAY
        ========================= */

        '.lc-title{' +
            'font-size:1.22em;' +
            'font-weight:700;' +
            'line-height:1.15;' +
            'color:#fff;' +
            'display:-webkit-box;' +
            '-webkit-line-clamp:2;' +
            '-webkit-box-orient:vertical;' +
            'overflow:hidden;' +
            'text-shadow:0 2px 10px rgba(0,0,0,.95);' +
            'margin-bottom:.4em;' +
        '}' +

        /* =========================
           BOTTOM INFO
        ========================= */

        '.lc-bottom{' +
            'display:flex;' +
            'align-items:center;' +
            'justify-content:space-between;' +
            'gap:.5em;' +
            'min-width:0;' +
        '}' +

        '.lc-left-info{' +
            'display:flex;' +
            'align-items:center;' +
            'gap:.35em;' +
            'min-width:0;' +
            'overflow:hidden;' +
        '}' +

        '.lc-right-info{' +
            'display:flex;' +
            'align-items:center;' +
            'gap:.35em;' +
            'flex-shrink:0;' +
        '}' +

        /* =========================
           QUALITY
        ========================= */

        '.lc-quality{' +
            'display:inline-flex;' +
            'align-items:center;' +
            'height:1.45em;' +
            'padding:0 .42em;' +
            'border-radius:.28em;' +
            'background:rgba(255,193,7,.92);' +
            'color:#111;' +
            'font-size:.78em;' +
            'font-weight:800;' +
            'line-height:1;' +
            'box-shadow:0 2px 8px rgba(0,0,0,.45);' +
        '}' +

        /* =========================
           RATING
        ========================= */

        '.lc-rating{' +
            'display:inline-flex;' +
            'align-items:center;' +
            'gap:.18em;' +
            'font-size:.9em;' +
            'font-weight:700;' +
            'color:#fff;' +
            'text-shadow:0 1px 5px #000;' +
        '}' +

        '.lc-star{' +
            'color:#ffd54a;' +
            'font-size:1.05em;' +
        '}' +

        /* =========================
           STATUS
        ========================= */

        '.lc-status{' +
            'font-size:.78em;' +
            'font-weight:600;' +
            'color:rgba(255,255,255,.72);' +
            'overflow:hidden;' +
            'white-space:nowrap;' +
            'text-overflow:ellipsis;' +
            'text-shadow:0 1px 5px #000;' +
        '}' +

        /* =========================
           HIDE ORIGINAL ELEMENTS
        ========================= */

        '.card__status,' +
        '.card__type,' +
        '.card__quality,' +
        '.card__vote{' +
            'visibility:hidden!important;' +
        '}' +

        /* =========================
           FOCUS ENHANCEMENT
        ========================= */

        '.card.focus .lc-overlay{' +
            'padding-bottom:.85em;' +
        '}' +

        '.card.focus .lc-title{' +
            'text-shadow:0 2px 12px #000;' +
        '}' +

        '.card.focus .lc-quality{' +
            'box-shadow:0 0 12px rgba(255,193,7,.25),0 2px 8px rgba(0,0,0,.5);' +
        '}' +

        /* =========================
           WATCHED
        ========================= */

        '.card.focus .card-watched{' +
            'display:none!important;' +
        '}' +

    '</style>');


    /* =========================================================
       SETTINGS
    ========================================================= */

    var WATCH_TIMEOUT = 8000;
    var activeChildObservers = [];


    /* =========================================================
       HELPERS
    ========================================================= */

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


    function createText(className, text) {
        var el = document.createElement('span');
        el.className = className;
        el.textContent = text;
        return el;
    }


    /* =========================================================
       BUILD OVERLAY
    ========================================================= */

    function createOverlay(card, view, data) {

        var old = view.querySelector('.lc-overlay');

        if (old) old.remove();


        var overlay = document.createElement('div');
        overlay.className = 'lc-overlay';


        /* ---------- META ---------- */

        var meta = document.createElement('div');
        meta.className = 'lc-meta';

        var year = getYear(data);
        var type = getType(data);

        if (year) {
            meta.appendChild(
                createText('lc-year', year)
            );
        }

        if (year && type) {
            meta.appendChild(
                createText('lc-dot', '•')
            );
        }

        if (type) {
            meta.appendChild(
                createText('lc-type', type)
            );
        }

        overlay.appendChild(meta);


        /* ---------- TITLE ---------- */

        var title =
            data.title ||
            data.name ||
            data.original_title ||
            data.original_name ||
            '';

        var titleEl = createText(
            'lc-title',
            title
        );

        overlay.appendChild(titleEl);


        /* ---------- BOTTOM ---------- */

        var bottom = document.createElement('div');
        bottom.className = 'lc-bottom';


        var left = document.createElement('div');
        left.className = 'lc-left-info';


        var right = document.createElement('div');
        right.className = 'lc-right-info';


        /* ---------- STATUS ---------- */

        var status =
            card.querySelector('.card__status');

        if (status) {

            var statusText =
                status.querySelector('.tvs-text');

            var text =
                statusText
                    ? statusText.textContent.trim()
                    : status.textContent.trim();

            if (text) {

                var statusEl =
                    createText('lc-status', text);

                left.appendChild(statusEl);
            }
        }


        /* ---------- QUALITY ---------- */

        var quality =
            card.querySelector('.card__quality');

        if (quality) {

            var qualityText =
                quality.textContent.trim();

            if (qualityText) {

                var qualityEl =
                    createText(
                        'lc-quality',
                        qualityText
                    );

                right.appendChild(qualityEl);
            }
        }


        /* ---------- RATING ---------- */

        var vote =
            card.querySelector('.card__vote');

        if (vote) {

            var voteText =
                vote.textContent.trim();

            if (voteText) {

                var rating =
                    document.createElement('span');

                rating.className =
                    'lc-rating';

                var star =
                    createText(
                        'lc-star',
                        '★'
                    );

                var value =
                    createText(
                        'lc-vote-value',
                        voteText
                    );

                rating.appendChild(star);
                rating.appendChild(value);

                right.appendChild(rating);
            }
        }


        bottom.appendChild(left);
        bottom.appendChild(right);

        overlay.appendChild(bottom);

        view.appendChild(overlay);
    }


    /* =========================================================
       WATCH FOR LAMPA UPDATES
    ========================================================= */

    function watchCard(card, view, data) {

        var timer;

        var observer =
            new MutationObserver(function () {

                clearTimeout(timer);

                timer = setTimeout(function () {

                    if (
                        document.body.contains(card)
                    ) {
                        createOverlay(
                            card,
                            view,
                            data
                        );
                    }

                }, 50);

            });


        observer.observe(
            card,
            {
                childList: true,
                subtree: true,
                characterData: true
            }
        );


        timer = setTimeout(function () {

            observer.disconnect();

            var index =
                activeChildObservers.indexOf(observer);

            if (index !== -1) {
                activeChildObservers.splice(
                    index,
                    1
                );
            }

        }, WATCH_TIMEOUT);


        activeChildObservers.push(observer);
    }


    /* =========================================================
       PROCESS CARD
    ========================================================= */

    function processCard(card) {

        var data = card.card_data;

        if (!data) return;


        card.dataset.listCard = '1';


        var view =
            card.querySelector('.card__view');

        if (!view) return;


        /* убираем возраст */

        var age =
            card.querySelector('.card__age');

        if (age) {
            age.style.display = 'none';
        }


        /* иконки */

        var icons =
            card.querySelector('.card__icons');

        if (icons) {

            icons.style.cssText =
                'top:.65em;' +
                'left:auto;' +
                'right:.65em;' +
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
                    'gap:.35em;';
            }
        }


        /* создаём свой интерфейс */

        createOverlay(
            card,
            view,
            data
        );


        /* следим за динамическими данными */

        watchCard(
            card,
            view,
            data
        );
    }


    /* =========================================================
       INTERSECTION OBSERVER
    ========================================================= */

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
                        ) continue;


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
                    rootMargin: '250px'
                }
            );
    }


    /* =========================================================
       OBSERVE
    ========================================================= */

    function observe(card) {

        if (
            !card.card_data ||
            card.dataset.listCard
        ) return;


        if (intersectionObserver) {

            intersectionObserver.observe(
                card
            );

        } else {

            processCard(card);
        }
    }


    /* =========================================================
       MUTATION OBSERVER
    ========================================================= */

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
                        ) continue;


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


    /* =========================================================
       EXISTING CARDS
    ========================================================= */

    [].forEach.call(
        document.querySelectorAll(
            '.card'
        ),
        observe
    );


    /* =========================================================
       LAMPA LIFECYCLE
    ========================================================= */

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

                if (intersectionObserver) {
                    intersectionObserver.disconnect();
                }

                mutationObserver.disconnect();


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
