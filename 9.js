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
  
            '.cp-overlay{position:absolute;left:0;bottom:0;right:0;padding:3em 0.5em 0.5em 0.4em;background:linear-gradient(to bottom,transparent 0%,rgba(0,0,0,0.6) 35%,rgba(0,0,0,0.92) 70%,rgba(0,0,0,0.97) 100%);border-bottom-left-radius:1em;border-bottom-right-radius:1em;z-index:2}',  
  
            '.cp-row1{display:flex;align-items:center;margin-bottom:0.2em;min-height:1em}',  
            '.cp-row1 .card__quality{position:static!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;background:none!important;padding:0!important;border-radius:0!important;color:rgba(255,255,255,0.9)!important;font-size:0.8em!important;font-weight:600!important;text-transform:uppercase!important;margin-right:0.4em;text-shadow:0 1px 3px rgba(0,0,0,0.9)!important}',  
            '.cp-row1 .card__quality>div{display:inline!important}',  
            '.cp-row1 .card__vote{position:static!important;background:none!important;padding:0!important;border-radius:0!important;color:rgba(255,255,255,0.9)!important;font-size:0.8em!important;font-weight:600!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;text-shadow:0 1px 3px rgba(0,0,0,0.9)!important}',  
  
            '.cp-year{margin-bottom:0.15em;min-height:1em}',  
            '.cp-year .card__age{color:rgba(255,255,255,0.5)!important;font-size:0.8em!important;font-weight:400!important;line-height:1!important;margin-top:0!important;text-shadow:0 1px 3px rgba(0,0,0,0.9)!important}',  
  
            '.cp-overlay .card__title{color:#fff!important;font-size:1.2em!important;font-weight:600!important;line-height:1.2!important;max-height:3.6em!important;overflow:hidden!important;display:-webkit-box!important;-webkit-line-clamp:3!important;-webkit-box-orient:vertical!important;margin-bottom:0!important;word-break:break-word!important;text-shadow:0 1px 6px rgba(0,0,0,1),0 2px 12px rgba(0,0,0,0.8)!important}',  
  
            '.card__type{display:none!important}',  
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
            '<div class="cp-year"><div class="card__age"></div></div>' +  
            '<div class="card__title"></div>' +  
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
                var quality, row1;  
                origIconsOnCreate.call(this);  
                quality = this.html.querySelector('.card__quality');  
                row1    = this.html.querySelector('.cp-row1');  
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
        var SKIP = ['card__img','card__marker','card__img-broken','card__icons','cp-overlay','cp-row1','cp-year','card__title','card__age','card__type'];  
  
        cardObserver = new MutationObserver(function(mutations){  
            var mi, ni, mutation, addedNodes, node, parent, cls, i, found, row1, cpYear;  
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
                    cpYear = parent.querySelector('.cp-year');  
                    if(cls.contains('card__quality') && row1){  
                        row1.appendChild(node);  
                    }  
                    else if(cls.contains('card__vote') && row1){  
                        row1.appendChild(node);  
                    }  
                    else if(cls.contains('card__age') && cpYear){  
                        cpYear.appendChild(node);  
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
