"use strict";(self.webpackChunkgithub_pages=self.webpackChunkgithub_pages||[]).push([[67],{8067:(t,e,r)=>{function n(t,e){return function(t,e){let r=[];t.sort(((t,e)=>t.rarity>e.rarity?1:-1));for(let n=0;n<t.length;n++){let a=0;for(let r=0;r<e;r++){if(Math.random()<t[n].rarity)if(t[n].quantity.includes("-")){let e=t[n].quantity.split("-");a+=Math.round(u(Number(e[0]),Number(e[1])))}else a+=Number(t[n].quantity)}r.push({name:t[n].name,amount:a})}return r}(t,e)}function u(t,e){return Math.random()*(t-e)+e}r.r(e),r.d(e,{totalLooter:()=>n})}}]);
//# sourceMappingURL=67.cf4b7982.chunk.js.map