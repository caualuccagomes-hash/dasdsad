/* Incompressible smoke: momentum, pressure projection and density advection. */
(()=>{
const hero=document.querySelector('.hero'),fine=matchMedia('(hover:hover) and (pointer:fine)'),reduce=matchMedia('(prefers-reduced-motion:reduce)');
if(!hero)return;const c=document.createElement('canvas');c.className='cursor-smoke fluid-smoke';c.setAttribute('aria-hidden','true');hero.prepend(c);const ctx=c.getContext('2d');if(!ctx)return;
let emission=0,lastInput=0; let w,h,N,u,v,U,V,d,D,p,P,div,curl,img,raf=0,prev=0,point=null;const queue=[];
const enabled=()=>fine.matches&&!reduce.matches&&!document.hidden;
function stop(){cancelAnimationFrame(raf);raf=prev=0;point=null;queue.length=0;if(d){d.fill(0);u.fill(0);v.fill(0)}ctx.clearRect(0,0,c.width,c.height)}
function resize(){stop();const r=hero.getBoundingClientRect();w=Math.max(100,Math.min(260,Math.round(r.width/5)));h=Math.max(80,Math.min(180,Math.round(w*r.height/r.width)));N=w*h;c.width=w;c.height=h;[u,v,U,V,d,D,p,P,div,curl]=Array.from({length:10},()=>new Float32Array(N));img=ctx.createImageData(w,h)}
function sample(f,x,y){x=Math.max(.5,Math.min(w-1.5,x));y=Math.max(.5,Math.min(h-1.5,y));const a=Math.floor(x),b=Math.floor(y),tx=x-a,ty=y-b,i=a+b*w;return(f[i]*(1-tx)+f[i+1]*tx)*(1-ty)+(f[i+w]*(1-tx)+f[i+w+1]*tx)*ty}
function advect(out,src,dt,fade){for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=x+y*w;out[i]=sample(src,x-u[i]*dt,y-v[i]*dt)*fade}}
function splat(s){
// A broad impulse pushes existing density. Alternating vortices roll its edges.
const speed=Math.hypot(s.dx,s.dy),radius=8,dirX=s.dx/(speed+.001),dirY=s.dy/(speed+.001);
const phase=emission++*.83,offset=Math.sin(phase)*3.2;
const cx=s.x-dirY*offset,cy=s.y+dirX*offset;
for(let y=Math.max(1,Math.floor(s.y-22));y<Math.min(h-1,s.y+22);y++)for(let x=Math.max(1,Math.floor(s.x-22));x<Math.min(w-1,s.x+22);x++){
const i=x+y*w,a=x-s.x,b=y-s.y,push=Math.exp(-(a*a+b*b)/100);
u[i]+=s.dx*push*1.8;v[i]+=s.dy*push*1.8;
for(const side of [-1,1]){const ax=a+dirY*side*6,by=b-dirX*side*6,swirl=Math.exp(-(ax*ax+by*by)/48)*side*Math.min(speed,4)*.6;u[i]-=by*swirl;v[i]+=ax*swirl}
// Interrupted, lobed density instead of a continuous solid stripe.
if(emission%2===0){const ax=x-cx,by=y-cy,envelope=Math.exp(-(ax*ax+by*by)/(radius*radius));
// Layered, curved filaments are transported by the same velocity as the cloud.
const strand=Math.pow(.5+.5*Math.sin(ax*.92+Math.sin(by*.37+phase)*2.7),4);
const fineStrand=Math.pow(.5+.5*Math.cos(by*1.3+Math.sin(ax*.51)*2+phase),6);
const folds=.38+.18*Math.sin(x*.57+Math.sin(y*.31)*2+phase)+.14*Math.cos(y*.63-x*.21+phase)+strand*.65+fineStrand*.23;
d[i]=Math.min(1.6,d[i]+envelope*Math.max(.08,folds)*.39)}
}}
function step(dt){while(queue.length)splat(queue.shift());
for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=x+y*w;curl[i]=.5*(v[i+1]-v[i-1]-u[i+w]+u[i-w])}
for(let y=2;y<h-2;y++)for(let x=2;x<w-2;x++){const i=x+y*w,a=Math.abs(curl[i+1])-Math.abs(curl[i-1]),b=Math.abs(curl[i+w])-Math.abs(curl[i-w]),len=Math.hypot(a,b)+.0001;u[i]+=b/len*curl[i]*7*dt;v[i]-=(a/len*curl[i]*7+d[i]*4.5)*dt}
advect(U,u,dt,Math.exp(-.8*dt));advect(V,v,dt,Math.exp(-.8*dt));[u,U]=[U,u];[v,V]=[V,v];p.fill(0);P.fill(0);
for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=x+y*w;div[i]=.5*(u[i+1]-u[i-1]+v[i+w]-v[i-w])}
for(let k=0;k<14;k++){for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=x+y*w;P[i]=.25*(p[i-1]+p[i+1]+p[i-w]+p[i+w]-div[i])}[p,P]=[P,p]}
for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=x+y*w;u[i]=Math.max(-180,Math.min(180,u[i]-.5*(p[i+1]-p[i-1])));v[i]=Math.max(-180,Math.min(180,v[i]-.5*(p[i+w]-p[i-w])))}
advect(D,d,dt,Math.exp(-.65*dt));
// Gentle diffusion softens the edges without inflating the plume.
for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=x+y*w;d[i]=Math.max(0,D[i]+dt*.65*(D[i-1]+D[i+1]+D[i-w]+D[i+w]-4*D[i]))}
}
function tick(t){raf=0;if(!enabled()){stop();return}const dt=prev?Math.min((t-prev)/1000,.033):.016;prev=t;step(dt);let peak=0;const a=img.data;for(let i=0;i<N;i++){peak=Math.max(peak,d[i]);const light=Math.min(1,d[i]*.7),j=i*4,age=Math.max(0,(t-lastInput)/1000),fade=age<3?1:Math.max(0,1-(age-3)/3);const ridge=i>w&&i<N-w?Math.min(1,Math.abs(d[i+1]-d[i-1])+Math.abs(d[i+w]-d[i-w])):0;a[j]=211+14*light+ridge*11;a[j+1]=198+15*light+ridge*10;a[j+2]=180+16*light+ridge*8;a[j+3]=Math.min(136,(1-Math.exp(-d[i]*1.65))*158)*fade}ctx.putImageData(img,0,0);if((peak>.008&&t-lastInput<6000)||queue.length)raf=requestAnimationFrame(tick);else stop()}
hero.addEventListener('pointermove',e=>{if(!enabled()||e.pointerType!=='mouse')return;lastInput=performance.now();const r=hero.getBoundingClientRect(),q={x:(e.clientX-r.left)/r.width*w,y:(e.clientY-r.top)/r.height*h};if(point){const dx=q.x-point.x,dy=q.y-point.y,n=Math.min(20,Math.max(1,Math.ceil(Math.hypot(dx,dy)/4)));for(let k=1;k<=n;k++)queue.push({x:point.x+dx*k/n,y:point.y+dy*k/n,dx:Math.max(-12,Math.min(12,dx/n)),dy:Math.max(-12,Math.min(12,dy/n))});if(queue.length>60)queue.splice(0,queue.length-60);if(!raf)raf=requestAnimationFrame(tick)}point=q},{passive:true});
hero.addEventListener('pointerleave',()=>point=null);window.addEventListener('blur',stop);document.addEventListener('visibilitychange',stop);fine.addEventListener('change',stop);reduce.addEventListener('change',stop);new ResizeObserver(resize).observe(hero);resize();
})();

