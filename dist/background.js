!function(){"use strict";async function e(e){const t=[],s=[];setTimeout((()=>this.sendResponse({success:!1,error:"Timeout"})),1e4);for(const o of e)try{t.push(await o)}catch(e){s.push(e),console.log(e)}const o={};s.length>0?(1===s.length?o.error=s[0]:o.errors=s,o.success=!1):(1===t.length?o.result=t[0]:o.results=t,o.success=!0),this.sendResponse(o)}async function t(){const{url:e,config:t}=this.params;return await(await fetch(e,t)).text()}async function s(e){return encodeURIComponent((await async function(){return[...await chrome.cookies.getAll({domain:".quillbot.com"}),...await chrome.cookies.getAll({domain:"quillbot.com"})]}()).map((t=>("useridtoken"===t.name&&(t.value=e),`${t.name}=${t.value};`))).join(""))}async function o(){const{token:e,url:t}=this.params;return await chrome.declarativeNetRequest.updateDynamicRules({removeRuleIds:[1],addRules:[{action:{type:"modifyHeaders",requestHeaders:[{header:"Cookie",operation:"set",value:await s(e)},{header:"useridtoken",operation:"set",value:e}]},condition:{resourceTypes:["xmlhttprequest"],urlFilter:t},id:1,priority:1}]}),!0}chrome=chrome??browser,chrome.runtime.onMessage.addListener((function(s,n,r){const{method:a,params:c}=s;switch(this.sender=n,this.sendResponse=r,this.params=c,a){case"proxyFetch":return e.call(this,[t.call(this)]),!0;case"setTokenHeader":return e.call(this,[o.call(this)]),!0}r({success:!1,error:"Unknown method"})}))}();
