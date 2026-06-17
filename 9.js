(function(){  
'use strict';  
if(window.plugin_overlay_menu_ready)return;  
window.plugin_overlay_menu_ready=true;  
var H='-16.5em',V='1em';  
var s=document.createElement('style');  
s.textContent=  
'.wrap__left{position:fixed!important;left:'+H+'!important;top:3.5em!important;height:calc(100vh - 4.5em)!important;overflow:hidden!important;z-index:200!important;border-radius:1em!important;background-color:rgba(0,0,0,0.85)!important;border:1px solid rgba(255,255,255,0.2)!important;box-shadow:0 0.5em 3em rgba(0,0,0,0.7)!important;transition:left 0.25s ease!important;transform:none!important;will-change:left!important;padding:0!important}'+  
'.wrap__left>.scroll{height:100%!important}'+  
'.wrap__left .scroll--over{height:100%!important}'+  
'.wrap__left .menu__list{padding:0!important}'+  
'.wrap__left .scroll__content{padding:0!important}'+  
'.wrap__left .scroll--mask{mask-image:none!important;-webkit-mask-image:none!important}';  
document.head.appendChild(s);  
new MutationObserver(function(){  
var l=document.querySelector('.wrap__left');  
var c=document.querySelector('.wrap__content');  
var o=document.body.classList.contains('menu--open');  
if(l)l.style.setProperty('left',o?V:H,'important');  
if(c)c.style.setProperty('transform','none','important');  
}).observe(document.body,{attributes:true,attributeFilter:['class']});  
})();
