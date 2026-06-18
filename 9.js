(function(){  
'use strict';  
if(window.plugin_overlay_menu_ready)return;  
window.plugin_overlay_menu_ready=true;  
var H='-16.5em',V='1em';  
var s=document.createElement('style');  
s.textContent=  
'.wrap__left>.scroll{height:100%!important}'+  
'.wrap__left .scroll--over{height:100%!important}'+  
'.wrap__left .menu__list{padding:0!important}'+  
'.wrap__left .scroll__content{padding:0!important}'+  
'.wrap__left .scroll--mask{mask-image:none!important;-webkit-mask-image:none!important}';  
document.head.appendChild(s);  
function apply(){  
var l=document.querySelector('.wrap__left');  
if(!l)return;  
l.style.setProperty('position','fixed','important');  
l.style.setProperty('left',H,'important');  
l.style.setProperty('top','3.5em','important');  
l.style.setProperty('height','calc(100vh - 4.5em)','important');  
l.style.setProperty('overflow','hidden','important');  
l.style.setProperty('z-index','200','important');  
l.style.setProperty('border-radius','1em','important');  
l.style.setProperty('background-color','rgba(0,0,0,0.85)','important');  
l.style.setProperty('border','1px solid rgba(255,255,255,0.2)','important');  
l.style.setProperty('box-shadow','0 0.5em 3em rgba(0,0,0,0.7)','important');  
l.style.setProperty('transition','left 0.25s ease','important');  
l.style.setProperty('transform','none','important');  
l.style.setProperty('will-change','left','important');  
l.style.setProperty('padding','0','important');  
}  
new MutationObserver(function(m){  
for(var i=0;i<m.length;i++){  
if(m[i].attributeName!=='class')continue;  
var l=document.querySelector('.wrap__left');  
var c=document.querySelector('.wrap__content');  
var o=document.body.classList.contains('menu--open');  
if(l){l.style.setProperty('transform','none','important');l.style.setProperty('left',o?V:H,'important');}  
if(c)c.style.setProperty('transform','none','important');  
break;  
}  
}).observe(document.body,{attributes:true});  
if(window.appready){apply();}  
else{Lampa.Listener.follow('app',function(e){if(e.type==='ready')apply();});}  
Lampa.Listener.follow('menu',function(e){if(e.type==='end')apply();});  
})();
