import{r as m,j as a}from"./app-CAQkWQq7.js";import{T as N}from"./index-DUzXbpgE.js";import{c}from"./createLucideIcon-DuX8yNJO.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],_=c("CircleCheck",b);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]],T=c("Info",v);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]],A=c("LoaderCircle",j);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C=[["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z",key:"2d38gg"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]],M=c("OctagonX",C);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const S=[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]],z=c("TriangleAlert",S);var L=(t,s,u,n,i,o,p,g)=>{let r=document.documentElement,h=["light","dark"];function l(e){(Array.isArray(t)?t:[t]).forEach(d=>{let y=d==="class",w=y&&o?i.map(f=>o[f]||f):i;y?(r.classList.remove(...w),r.classList.add(o&&o[e]?o[e]:e)):r.setAttribute(d,e)}),k(e)}function k(e){g&&h.includes(e)&&(r.style.colorScheme=e)}function x(){return window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}if(n)l(n);else try{let e=localStorage.getItem(s)||u,d=p&&e==="system"?x():e;l(d)}catch{}},$=m.createContext(void 0),E={setTheme:t=>{},themes:[]},I=()=>{var t;return(t=m.useContext($))!=null?t:E};m.memo(({forcedTheme:t,storageKey:s,attribute:u,enableSystem:n,enableColorScheme:i,defaultTheme:o,value:p,themes:g,nonce:r,scriptProps:h})=>{let l=JSON.stringify([u,s,o,t,g,p,n,i]).slice(1,-1);return m.createElement("script",{...h,suppressHydrationWarning:!0,nonce:typeof window>"u"?r:"",dangerouslySetInnerHTML:{__html:`(${L.toString()})(${l})`}})});const B=({...t})=>{const{theme:s="light"}=I();return a.jsx(N,{theme:s,className:"toaster group",icons:{success:a.jsx(_,{className:"h-4 w-4"}),info:a.jsx(T,{className:"h-4 w-4"}),warning:a.jsx(z,{className:"h-4 w-4"}),error:a.jsx(M,{className:"h-4 w-4"}),loading:a.jsx(A,{className:"h-4 w-4 animate-spin"})},toastOptions:{classNames:{toast:"group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",description:"group-[.toast]:text-muted-foreground",actionButton:"group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",cancelButton:"group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"}},...t})};export{A as L,B as T};
