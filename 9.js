(function() {  
    if (window.card_mirror_plugin_ready) return;  
    window.card_mirror_plugin_ready = true;  
  
    document.head.insertAdjacentHTML('beforeend',  
        '<style id="card-mirror-plugin-style">' +  
        '.card:not(.card--wide) .card__view::before {' +  
            'content: "";' +  
            'position: absolute;' +  
            'left: 0;' +  
            'right: 0;' +  
            'bottom: 0;' +  
            'height: 25%;' +  
            'background: -webkit-linear-gradient(top, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%);' +  
            'background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%);' +  
            'border-bottom-left-radius: 1em;' +  
            'border-bottom-right-radius: 1em;' +  
            'pointer-events: none;' +  
            'z-index: 1;' +  
        '}' +  
        '</style>'  
    );  
})();
