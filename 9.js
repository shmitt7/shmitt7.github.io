(function () {  
var KEY1 = 'full_btn_priority';  
var KEY2 = 'full_btn_priority_2';  
var ICONS = [  
{ selector: '.button--play', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 384 512"><path fill="#3B82F6" d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80v352c0 17.4 9.4 33.4 24.5 41.9S58.2 482 73 473l288-176c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41z"/></svg>' },  
{ selector: '.view--torrent', svg: '<svg width="24" height="24" viewBox="0 0 48 48"><path fill="#4caf50" d="M23.501,44.125c11.016,0,20-8.984,20-20c0-11.015-8.984-20-20-20c-11.016,0-20,8.985-20,20C3.501,35.141,12.485,44.125,23.501,44.125z"/><path fill="#fff" d="M43.252,27.114C39.718,25.992,38.055,19.625,34,11l-7,1.077c1.615,4.905,8.781,16.872,0.728,18.853C20.825,32.722,17.573,20.519,15,14l-8,2l10.178,27.081c1.991,0.67,4.112,1.044,6.323,1.044c0.982,0,1.941-0.094,2.885-0.232l-4.443-8.376c6.868,1.552,12.308-0.869,12.962-6.203c1.727,2.29,4.089,3.183,6.734,3.172C42.419,30.807,42.965,29.006,43.252,27.114z"/></svg>' },  
{ selector: '.view--trailer', svg: '<svg width="24" height="24" viewBox="0 0 48 48"><path d="M47.044 12.3709C46.7726 11.3497 46.2378 10.4178 45.493 9.66822C44.7483 8.91869 43.8197 8.37791 42.8003 8.1C39.0476 7.09091 24.0476 7.09091 24.0476 7.09091C24.0476 7.09091 9.04761 7.09091 5.29488 8.1C4.27547 8.37791 3.34693 8.91869 2.60218 9.66822C1.85744 10.4178 1.32262 11.3497 1.05124 12.3709C0.0476075 16.14 0.0476074 24 0.0476074 24C0.0476074 24 0.0476075 31.86 1.05124 35.6291C1.32262 36.6503 1.85744 37.5822 2.60218 38.3318C3.34693 39.0813 4.27547 39.6221 5.29488 39.9C9.04761 40.9091 24.0476 40.9091 24.0476 40.9091C24.0476 40.9091 39.0476 40.9091 42.8003 39.9C43.8197 39.6221 44.7483 39.0813 45.493 38.3318C46.2378 37.5822 46.7726 36.6503 47.044 35.6291C48.0476 31.86 48.0476 24 48.0476 24C48.0476 24 48.0476 16.14 47.044 12.3709Z" fill="#FF0302"/><path d="M19.1385 31.1373V16.8628L31.684 24.0001L19.1385 31.1373Z" fill="#FEFEFE"/></svg>' }  
];  
var selectObserver = null;  
var renderTimer = null;  
function buttonHash(btn) {  
return Lampa.Utils.hash(btn.clone().removeClass('focus').prop('outerHTML'));  
}  
function replaceIcons(root) {  
for (var i = 0; i < ICONS.length; i++) {  
var item = ICONS[i];  
root.find(item.selector).each(function () {  
var oldSvg = $(this).find('svg');  
if (oldSvg.length) oldSvg.replaceWith(item.svg);  
});  
}  
}  
function findButtonByHash(root, wanted) {  
var found = null;  
root.find('.buttons--container > .full-start__button').not('.hide').each(function () {  
var $b = $(this);  
if (!$b.hasClass('button--priority') && buttonHash($b) === wanted) found = $b;  
});  
return found;  
}  
function renderSecond() {  
var cont = $('.full-start-new__buttons');  
if (!cont.length) return;  
var card = cont.closest('.full-start-new');  
var wanted = Lampa.Storage.get(KEY2, '') + '';  
cont.find('.button--priority-two').remove();  
if (!wanted) return;  
var found = findButtonByHash(card, wanted);  
if (!found) {  
Lampa.Storage.set(KEY2, '');  
return;  
}  
var clon = found.clone();  
clon.addClass('button--priority button--priority-two').removeClass('view--torrent').on('hover:enter', function () {  
found.trigger('hover:enter');  
}).on('hover:long', function () {  
clon.remove();  
Lampa.Storage.set(KEY2, '');  
var last = $('.full-start-new .button--play')[0];  
if (last) Lampa.Controller.toggle('content');  
});  
var first = cont.find('.button--priority').not('.button--priority-two').last();  
if (first.length) first.after(clon);  
else cont.prepend(clon);  
}  
function scheduleRenderSecond() {  
if (renderTimer) clearTimeout(renderTimer);  
renderTimer = setTimeout(renderSecond, 100);  
}  
function hideSecondInSelect(box) {  
var wanted = Lampa.Storage.get(KEY2, '') + '';  
if (!wanted) return;  
var src = findButtonByHash($('body'), wanted);  
if (!src) return;  
var icon = src.find('svg').prop('outerHTML');  
var title = $.trim(src.text());  
box.find('.selector').each(function () {  
var $it = $(this);  
var itIcon = $it.find('svg').prop('outerHTML');  
var itTitle = $.trim($it.text());  
if ((icon && itIcon === icon) || (title && itTitle === title)) $it.addClass('hide').css('display', 'none');  
});  
}  
var origSet = Lampa.Storage.set;  
Lampa.Storage.set = function (name, value) {  
if (name === KEY1) {  
var oldVal = Lampa.Storage.get(KEY1, '') + '';  
var newVal = value + '';  
var res = origSet.apply(this, arguments);  
if (newVal) {  
var second = Lampa.Storage.get(KEY2, '') + '';  
if (newVal === second) origSet.call(this, KEY2, '');  
else if (oldVal && oldVal !== newVal) origSet.call(this, KEY2, oldVal);  
scheduleRenderSecond();  
}  
return res;  
}  
return origSet.apply(this, arguments);  
};  
selectObserver = new MutationObserver(function (mutations) {  
for (var i = 0; i < mutations.length; i++) {  
var nodes = mutations[i].addedNodes;  
for (var j = 0; j < nodes.length; j++) {  
var $n = $(nodes[j]);  
if (!$n.find) continue;  
var box = $n.hasClass('selectbox') ? $n : $n.find('.selectbox');  
if (box.length) hideSecondInSelect(box);  
}  
}  
});  
selectObserver.observe(document.body, { childList: true, subtree: true });  
Lampa.Listener.follow('full', function (e) {  
if (e.type === 'complite') {  
var card = $(e.object.activity.render());  
replaceIcons(card);  
scheduleRenderSecond();  
}  
});  
Lampa.Listener.follow('app', function (e) {  
if (e.type === 'destroy') {  
if (selectObserver) selectObserver.disconnect();  
if (renderTimer) clearTimeout(renderTimer);  
}  
});  
})();
