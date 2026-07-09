(function(){    
    var PLUGIN_ID = 'clean-poster-plugin';    
    var cleanPosterCache = {};    
    var cardObserver = null;    
    
    function addStyles(){    
        if(document.getElementById(PLUGIN_ID)) return;    
        var style = document.createElement('style');    
        style.id = PLUGIN_ID;    
        style.textContent = [    
            '.card{overflow:visible!important}',    
            '.card__view{overflow:visible!important;margin-bottom:0!important}',    
            '.card__view .card__icons{position:absolute!important;top:0.5em!important;right:0.5em!important;left:auto!important;width:auto!important;z-index:3}',  
  
            /* --- УСИЛЕННЫЙ ГРАДИЕНТ + BLUR --- */  
            '.cp-overlay{' +  
                'position:absolute;left:0;bottom:0;right:0;' +  
                'padding:3em 0.7em 0.7em 0.5em;' +  
                'background:linear-gradient(to bottom,transparent 0%,rgba(0,0,0,0.6) 35%,rgba(0,0,0,0.92) 70%,rgba(0,0,0,0.97) 100%);' +  
                'border-bottom-left-radius:1em;border-bottom-right-radius:1em;' +  
                'z-index:2;' +  
                '-webkit-backdrop-filter:blur(1px);backdrop-filter:blur(1px)' +  
            '}',  
  
            '.cp-row1{display:flex;align-items:center;margin-bottom:0.25em;min-height:1em}',    
            '.cp-row1 .card__quality{position:static!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;background:none!important;padding:0!important;border-radius:0!important;color:rgba(255,255,255,0.9)!important;font-size:0.8em!important;font-weight:600!important;text-transform:uppercase!important;margin-right:0.4em;text-shadow:0 1px 3px rgba(0,0,0,0.9)!important}',    
            '.cp-row1 .card__quality>div{display:inline!important}',    
            '.cp-row1 .card__vote{position:static!important;background:none!important;padding:0!important;border-radius:0!important;color:rgba(255,255,255,0.9)!important;font-size:0.8em!important;font-weight:600!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;text-shadow:0 1px 3px rgba(0,0,0,0.9)!important}',    
  
            /* --- ЗАГОЛОВОК С ТЕНЬЮ --- */  
            '.cp-overlay .card__title{' +  
                'color:#fff!important;font-size:1.2em!important;font-weight:700!important;' +  
                'line-height:1.2!important;max-height:3.6em!important;overflow:hidden!important;' +  
                'display:-webkit-box!important;-webkit-line-clamp:3!important;-webkit-box-orient:vertical!important;' +  
                'margin-bottom:0.3em!important;word-break:break-word!important;' +  
                'text-shadow:0 1px 6px rgba(0,0,0,1),0 2px 12px rgba(0,0,0,0.8)!important' +  
            '}',  
  
            '.cp-bottom{display:flex;align-items:center}',    
            '.cp-bottom .card__age{color:rgba(255,255,255,0.95)!important;font-size:0.95em!important;font-weight:700!important;line-height:1!important;margin-top:0!important;margin-right:0.4em;text-shadow:0 1px 3px rgba(0,0,0,0.9)!important}',    
            '.cp-bottom .card__type,.card--tv .cp-bottom .card__type,.card--movie .cp-bottom .card__type{position:static!important;background:none!important;padding:0!important;border-radius:0!important;color:rgba(255,255,255,0.95)!important;font-size:0.95em!important;font-weight:700!important;text-transform:none!important;text-shadow:0 1px 3px rgba(0,0,0,0.9)!important}',    
        ].join('\n');    
        document.head.appendChild(style);    
    }    
    
    function patchTemplate(){    
        Lampa.Template.add('card',    
            '<div class="card selector layer--visible layer--render">' +    
            '<div class="card__view">' +    
            '<img src="./img/img_load.svg" class="card__img" />' +    
            '<div class="card__icons"><div class="card__icons-inner"></div></div>' +    
            '<div class="cp-overlay">' +    
            '<div class="cp-row1"></div>' +    
            '<div class="card__title"></div>' +    
            '<div class="cp-bottom">' +    
            '<div class="card__age"></div>' +    
            '</div>' +    
            '</div>' +    
            '</div>' +    
            '</div>'    
        );    
    }    
    
    function loadCleanPoster(card){    
        var data = card.data;    
        var id, type, posterSize, url, self;    
        if(!data || !data.id) return;    
        id = data.id;    
        type = data.original_name ? 'tv' : 'movie';    
        self = card;    
        if(cleanPosterCache[id] === null) return;    
        if(cleanPosterCache[id]){    
            if(self.img) self.img.src = cleanPosterCache[id];    
            return;    
        }    
        if(cleanPosterCache[id] === '') return;    
        cleanPosterCache[id] = null;    
        posterSize = Lampa.Storage.field('poster_size') || 'w300';    
        url = Lampa.TMDB.api(    
            type + '/' + id +    
            '/images?include_image_language=null&api_key=' + Lampa.TMDB.key()    
        );    
        new Lampa.Reguest().silent(url, function(images){    
            var posters = (images && Array.isArray(images.posters)) ? images.posters : [];    
            var clean = null;    
            var i;    
            for(i = 0; i < posters.length; i++){    
                if(posters[i].iso_639_1 === null){ clean = posters[i]; break; }    
            }    
            if(clean){    
                var src = Lampa.TMDB.image('t/p/' + posterSize + clean.file_path);    
                cleanPosterCache[id] = src;    
                if(self.img) self.img.src = src;    
            }    
            else{    
                cleanPosterCache[id] = '';    
            }    
        }, function(){    
            cleanPosterCache[id] = '';    
        });    
    }    
    
    function patchModules(){    
        var map = Lampa.Maker.map('Card');    
        var origCardOnVisible, origIconsOnCreate, origRattingOnCreate;    
        if(!map || !map.Card) return;    
    
        origCardOnVisible = map.Card.onVisible;    
        map.Card.onVisible = function(){    
            origCardOnVisible.call(this);    
            loadCleanPoster(this);    
        };    
    
        if(map.Icons && map.Icons.onCreate){    
            origIconsOnCreate = map.Icons.onCreate;    
            map.Icons.onCreate = function(){    
                var bottom, age, type, quality, row1;    
                origIconsOnCreate.call(this);    
                bottom  = this.html.querySelector('.cp-bottom');    
                age     = bottom ? bottom.querySelector('.card__age') : null;    
                type    = this.html.querySelector('.card__type');    
                quality = this.html.querySelector('.card__quality');    
                row1    = this.html.querySelector('.cp-row1');    
                if(type && bottom && age){    
                    bottom.insertBefore(type, age.nextSibling);    
                }    
                if(quality && row1){    
                    row1.appendChild(quality);    
                }    
            };    
        }    
    
        if(map.Ratting && map.Ratting.onCreate){    
            origRattingOnCreate = map.Ratting.onCreate;    
            map.Ratting.onCreate = function(){    
                var row1, vote;    
                origRattingOnCreate.call(this);    
                row1 = this.html.querySelector('.cp-row1');    
                vote = this.html.querySelector('.card__vote');    
                if(vote && row1){    
                    row1.appendChild(vote);    
                }    
            };    
        }    
    }    
    
    function startObserver(){    
        var SKIP = ['card__img','card__marker','card__img-broken','card__icons','cp-overlay','cp-row1','cp-bottom','card__title','card__age'];    
    
        cardObserver = new MutationObserver(function(mutations){    
            var mi, ni, mutation, addedNodes, node, parent, cls, i, found, row1, bottom, age;    
            for(mi = 0; mi < mutations.length; mi++){    
                mutation = mutations[mi];    
                if(mutation.type !== 'childList') continue;    
                addedNodes = mutation.addedNodes;    
                for(ni = 0; ni < addedNodes.length; ni++){    
                    node = addedNodes[ni];    
                    if(node.nodeType !== 1) continue;    
                    parent = node.parentNode;    
                    if(!parent || !parent.classList) continue;    
                    if(!parent.classList.contains('card__view')) continue;    
                    cls = node.classList;    
                    found = false;    
                    for(i = 0; i < SKIP.length; i++){    
                        if(cls.contains(SKIP[i])){ found = true; break; }    
                    }    
                    if(found) continue;    
                    row1   = parent.querySelector('.cp-row1');    
                    bottom = parent.querySelector('.cp-bottom');    
                    age    = bottom ? bottom.querySelector('.card__age') : null;    
                    if(!bottom) continue;    
                    if(cls.contains('card__quality') && row1){    
                        row1.appendChild(node);    
                    }    
                    else if(cls.contains('card__type') && age){    
                        bottom.insertBefore(node, age.nextSibling);    
                    }    
                    else if(cls.contains('card__vote') && row1){    
                        row1.appendChild(node);    
                    }    
                }    
            }    
        });    
    
        cardObserver.observe(document.body, { childList: true, subtree: true });    
    
        Lampa.Listener.follow('app', function(e){    
            if(e.type === 'destroy' && cardObserver){    
                cardObserver.disconnect();    
                cardObserver = null;    
            }    
        });    
    }    
    
    function init(){    
        addStyles();    
        patchTemplate();    
        patchModules();    
        startObserver();    
    }    
    
    if(window.appready) init();    
    else Lampa.Listener.follow('app', function(e){    
        if(e.type == 'ready') init();    
    });    
})();
