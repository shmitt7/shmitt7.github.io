(function(){  
    if (window.fullCardActorsRight) return;  
    window.fullCardActorsRight = true;  
  
    function buildPersonCard(person){  
        var photo = person.profile_path  
            ? Lampa.TMDB.image('t/p/w185' + person.profile_path)  
            : './img/person.svg';  
  
        var card = $('<div class="selector fsc-person"></div>');  
        card.append('<div class="fsc-person__photo"><img src="'+photo+'"></div>');  
        card.append('<div class="fsc-person__name">'+ Lampa.Utils.escape(person.name || '') +'</div>');  
        card.append('<div class="fsc-person__role">'+ Lampa.Utils.escape(person.character || person.job || '') +'</div>');  
  
        card.on('hover:enter', function(){  
            // Повторяем router.add('actor', ...) из src/core/router.js  
            Lampa.Activity.push({  
                id: person.id,  
                job: (person.known_for_department || 'actor').toLowerCase(),  
                url: '',  
                component: 'actor',  
                source: person.source || Lampa.Storage.field('source'),  
                page: 1  
            });  
        });  
  
        return card;  
    }  
  
    function init(){  
        var style = document.createElement('style');  
        style.textContent =  
            '.fsc-persons-col{display:flex;flex-direction:column;gap:0.5em;margin-top:0.8em;width:100%;max-width:20em;}' +  
            '.fsc-persons-col__grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0.5em;}' +  
            '.fsc-person{display:flex;flex-direction:column;align-items:center;text-align:center;padding:0.4em;border-radius:0.6em;background:rgba(0,0,0,0.35);}' +  
            '.fsc-person.focus{background:rgba(255,255,255,0.25);}' +  
            '.fsc-person__photo img{width:100%;aspect-ratio:2/3;object-fit:cover;border-radius:0.4em;}' +  
            '.fsc-person__name{font-size:0.8em;margin-top:0.3em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%;}' +  
            '.fsc-person__role{font-size:0.7em;opacity:0.7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%;}' +  
            '.fsc-persons-more{align-self:center;padding:0.3em 1em;border-radius:1em;background:rgba(255,255,255,0.1);font-size:0.8em;}' +  
            '.fsc-persons-more.focus{background:rgba(255,255,255,0.3);}';  
        document.head.appendChild(style);  
  
        Lampa.Listener.follow('full', function(e){  
            if (e.type !== 'build' || e.name !== 'persons') return;  
  
            // Отличаем актёров от режиссёров по заголовку ряда (см. src/components/full.js, title_actors)  
            var isActors = e.data && e.data.title === Lampa.Lang.translate('title_actors');  
            if (!isActors) return;  
  
            var startComponent = e.item; // это сам Persons/Line-компонент, он нам не нужен -  
            // мы строим свою колонку напрямую из e.data.results, не трогая штатный Line  
  
            var results = (e.data && e.data.results) || [];  
            if (!results.length) return;  
  
            // Ищем корень .full-start-new в теле карточки, которое пришло в событии  
            var root = e.body;  
            var right = root.find('.full-start-new__right');  
            if (!right.length) return;  
  
            // Не дублируем, если уже построили для этой карточки  
            if (right.find('.fsc-persons-col').length) return;  
  
            var visibleCount = 6;  
            var shown = results.slice(0, visibleCount);  
            var rest = results.slice(visibleCount);  
  
            var col = $('<div class="fsc-persons-col"></div>');  
            var grid = $('<div class="fsc-persons-col__grid"></div>');  
  
            shown.forEach(function(person){  
                grid.append(buildPersonCard(person));  
            });  
  
            col.append(grid);  
  
            if (rest.length){  
                var more = $('<div class="selector fsc-persons-more"></div>')  
                    .text(Lampa.Lang.translate('more') + ' (' + rest.length + ')');  
  
                more.on('hover:enter', function(){  
                    rest.forEach(function(person){  
                        grid.append(buildPersonCard(person));  
                    });  
                    more.remove();  
  
                    // Добавляем новые .selector в активную коллекцию навигации без сброса фокуса  
                    Lampa.Controller.collectionAppend(grid.find('.selector'));  
                });  
  
                col.append(more);  
            }  
  
            right.append(col);  
  
            // Если контроллер 'full_start' уже активен (toggle() уже отработал),  
            // добавляем новые элементы в его коллекцию вручную  
            if (Lampa.Controller.enabled && Lampa.Controller.enabled().name === 'full_start'){  
                Lampa.Controller.collectionAppend(col.find('.selector'));  
            }  
        });  
    }  
  
    if (window.appready) init();  
    else Lampa.Listener.follow('app', function(e){ if (e.type === 'ready') init(); });  
})();
