(function() {  
    'use strict';  
      
    // Защита от повторной загрузки  
    if (window.plugin_tv_status_ready) return;  
    window.plugin_tv_status_ready = true;  
      
    // ─── Кэш ответов TMDB ───────────────────────────────────────────────────  
    var cache = {};  
    var CACHE_TTL = 30 * 60 * 1000; // 30 минут  
      
    // ─── Иконки статусов ────────────────────────────────────────────────────  
    var ICONS = {  
        'Returning Series': '▶',   // онгоинг  
        'Ended':            '✔',   // завершён  
        'Canceled':         '✘',   // отменён  
        'In Production':    '⏳',  // в производстве  
        'Planned':          '◷',   // запланирован  
        'Pilot':            '★'    // пилот  
    };  
      
    // ─── Цвета статусов ─────────────────────────────────────────────────────  
    var COLORS = {  
        'Returning Series': '#4CAF50',  
        'Ended':            '#2196F3',  
        'Canceled':         '#f44336',  
        'In Production':    '#FF9800',  
        'Planned':          '#9C27B0',  
        'Pilot':            '#00BCD4'  
    };  
      
    // ─── Построить текст метки ──────────────────────────────────────────────  
    // Форматы:  
    //   S3:E30        — все серии вышли  
    //   S3:E27/E30    — идёт 3 сезон, ещё 3 серии выйдет  
    //   S1/S2:E10     — анонсирован 2й сезон  
    //   S1/S2:E10/E20 — анонсирован 2й сезон с 20 сериями  
    function buildText(info) {  
        var last    = info.last_episode_to_air;  
        var next    = info.next_episode_to_air;  
        var seasons = info.seasons || [];  
          
        if (!last) return null;  
          
        var curS = last.season_number;  
        var curE = last.episode_number;  
          
        // Найти количество серий в текущем сезоне  
        var totalE = null;  
        for (var i = 0; i < seasons.length; i++) {  
            if (seasons[i].season_number === curS) {  
                totalE = seasons[i].episode_count;  
                break;  
            }  
        }  
          
        var sPart = 'S' + curS;  
        var ePart = 'E' + curE;  
          
        if (next) {  
            if (next.season_number > curS) {  
                // Следующий сезон анонсирован  
                sPart += '/S' + next.season_number;  
                if (totalE && totalE > curE) ePart += '/E' + totalE;  
            } else if (next.season_number === curS && totalE && totalE > curE) {  
                // Ещё серии в текущем сезоне  
                ePart += '/E' + totalE;  
            }  
        }  
          
        return sPart + ':' + ePart;  
    }  
      
    // ─── Добавить метку на карточку ─────────────────────────────────────────  
    function applyLabel(cardElem, info) {  
        if (cardElem._tvsDone) return;  
        cardElem._tvsDone = true;  
          
        var text  = buildText(info);  
        if (!text) return;  
          
        var icon  = ICONS[info.status]  || '?';  
        var color = COLORS[info.status] || '#888';  
          
        var typeElem = cardElem.querySelector('.card__type');  
        if (!typeElem) return;  
          
        var label = document.createElement('div');  
        label.className = 'tvs-label';  
        label.style.borderLeftColor = color;  
        label.innerHTML =  
            '<span class="tvs-icon" style="color:' + color + '">' + icon + '</span>' +  
            '<span class="tvs-text">' + text + '</span>';  
          
        typeElem.parentNode.insertBefore(label, typeElem.nextSibling);  
    }  
      
    // ─── Запросить данные и применить метку ─────────────────────────────────  
    function fetchAndApply(cardElem, data) {  
        if (!data || !data.original_name || !data.id) return;  
          
        var id  = data.id;  
        var now = Date.now();  
          
        if (cache[id] && (now - cache[id].t) < CACHE_TTL) {  
            applyLabel(cardElem, cache[id].d);  
            return;  
        }  
          
        var url = Lampa.TMDB.api('tv/' + id + '?api_key=' + Lampa.TMDB.key());  
          
        Lampa.Network.silent(url, function(resp) {  
            if (resp && resp.id) {  
                cache[id] = { d: resp, t: Date.now() };  
                applyLabel(cardElem, resp);  
            }  
        }, function() {}, false);  
    }  
      
    // ─── Подключить обработчик к карточке ───────────────────────────────────  
    function attachToCard(cardElem) {  
        if (cardElem._tvsAttached) return;  
        cardElem._tvsAttached = true;  
          
        cardElem.addEventListener('visible', function() {  
            var data = cardElem.card_data;  
            if (data) fetchAndApply(cardElem, data);  
        });  
    }  
      
    // ─── Обёртка старого Lampa.Card ─────────────────────────────────────────  
    function wrapOldCard() {  
        var Orig = Lampa.Card;  
          
        Lampa.Card = function(data, params) {  
            var inst = new Orig(data, params);  
              
            if (data && data.original_name) {  
                var origBuild = inst.build;  
                inst.build = function() {  
                    origBuild.call(inst);  
                    if (inst.card) {  
                        inst.card.card_data = data;  
                        attachToCard(inst.card);  
                    }  
                };  
            }  
              
            return inst;  
        };  
          
        // Копируем прототип  
        Lampa.Card.prototype = Orig.prototype;  
    }  
      
    // ─── MutationObserver для новой системы Maker ───────────────────────────  
    function startObserver() {  
        var observer = new MutationObserver(function(mutations) {  
            for (var i = 0; i < mutations.length; i++) {  
                var nodes = mutations[i].addedNodes;  
                for (var j = 0; j < nodes.length; j++) {  
                    var node = nodes[j];  
                    if (node.nodeType !== 1) continue;  
                      
                    // Сама карточка  
                    if (node.classList && node.classList.contains('card--tv')) {  
                        attachToCard(node);  
                    }  
                      
                    // Карточки внутри добавленного узла  
                    if (node.querySelectorAll) {  
                        var tvCards = node.querySelectorAll('.card--tv');  
                        for (var k = 0; k < tvCards.length; k++) {  
                            attachToCard(tvCards[k]);  
                        }  
                    }  
                }  
            }  
        });  
          
        observer.observe(document.body, { childList: true, subtree: true });  
    }  
      
    // ─── CSS ────────────────────────────────────────────────────────────────  
    function addStyles() {  
        var style = document.createElement('style');  
        style.textContent = [  
            '.tvs-label {',  
            '  position: absolute;',  
            '  left: -0.8em;',  
            '  top: 3.4em;',  
            '  padding: 0.3em 0.5em;',  
            '  background: rgba(0,0,0,0.80);',  
            '  color: #fff;',  
            '  font-size: 0.75em;',  
            '  border-radius: 0.3em;',  
            '  border-left: 2px solid #fff;',  
            '  z-index: 2;',  
            '  display: flex;',  
            '  align-items: center;',  
            '  gap: 0.3em;',  
            '  white-space: nowrap;',  
            '  line-height: 1;',  
            '  pointer-events: none;',  
            '}',  
            '.tvs-icon {',  
            '  font-size: 0.9em;',  
            '  line-height: 1;',  
            '}',  
            '.tvs-text {',  
            '  font-size: 0.85em;',  
            '  font-weight: 700;',  
            '  letter-spacing: 0.03em;',  
            '}'  
        ].join('\n');  
        document.head.appendChild(style);  
    }  
      
    // ─── Инициализация ──────────────────────────────────────────────────────  
    function init() {  
        addStyles();  
        wrapOldCard();  
        startObserver();  
    }  
      
    if (window.appready) init();  
    else {  
        Lampa.Listener.follow('app', function(e) {  
            if (e.type == 'ready') init();  
        });  
    }  
      
})();
