/* Modular client-side CAPTCHA (educational). Usage: const c = Captcha.mount(el); c.verify() -> true/false */
const Captcha=(()=>{
  const CH='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',R=()=>Math.random()*150|0;
  function mount(box){
    box.innerHTML='<canvas width="170" height="52"></canvas><button type="button" class="ref" title="Refresh CAPTCHA">&#10227;</button><input class="cin" placeholder="Enter CAPTCHA" maxlength="5" autocomplete="off"><small class="cerr"></small>';
    const cv=box.querySelector('canvas'),x=cv.getContext('2d'),inp=box.querySelector('.cin'),err=box.querySelector('.cerr');let code='';
    function draw(){
      code=Array.from({length:5},()=>CH[Math.random()*CH.length|0]).join('');
      x.fillStyle='#e6edf5';x.fillRect(0,0,170,52);
      for(let i=0;i<80;i++){x.fillStyle=`rgba(${R()},${R()},${R()},.5)`;x.fillRect(Math.random()*170,Math.random()*52,2,2)}
      for(let i=0;i<5;i++){x.strokeStyle=`rgba(${R()},${R()},${R()},.7)`;x.beginPath();x.moveTo(0,Math.random()*52);x.lineTo(170,Math.random()*52);x.stroke()}
      [...code].forEach((c,i)=>{x.save();x.translate(14+i*30,34);x.rotate((Math.random()-.5)*.7);x.font=`italic bold ${24+(Math.random()*8|0)}px Georgia,serif`;x.fillStyle='#16324f';x.fillText(c,0,0);x.restore()});
      inp.value='';
    }
    box.querySelector('.ref').onclick=()=>{err.textContent='';draw()};
    draw();
    return{refresh:draw,verify(){
      const v=inp.value.trim();
      if(!v){err.textContent='Please enter the CAPTCHA.';draw();return false}
      if(v.toUpperCase()!==code){err.textContent='Incorrect CAPTCHA. Try the new one.';draw();return false}
      err.textContent='';return true}};
  }
  return{mount};
})();
