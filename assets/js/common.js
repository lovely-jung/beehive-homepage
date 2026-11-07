/* 비하이브 공통 스크립트: 상단 메뉴(모바일 햄버거 + 드롭다운) */
(function(){
  const n=document.querySelector('.global-nav'),m=n.querySelector('.global-menu-toggle'),d=n.querySelector('.nav-dropdown'),t=n.querySelector('.nav-trigger');
  const close=()=>{n.classList.remove('menu-open');d.classList.remove('open');m.setAttribute('aria-expanded','false');t.setAttribute('aria-expanded','false');m.setAttribute('aria-label','메뉴 열기');m.textContent='☰'};
  m.addEventListener('click',()=>{const open=n.classList.toggle('menu-open');m.setAttribute('aria-expanded',open);m.setAttribute('aria-label',open?'메뉴 닫기':'메뉴 열기');m.textContent=open?'×':'☰'});
  t.addEventListener('click',()=>{const open=d.classList.toggle('open');t.setAttribute('aria-expanded',open)});
  n.querySelectorAll('.global-links a').forEach(a=>a.addEventListener('click',close));
  document.addEventListener('click',e=>{if(!n.contains(e.target))close()});
})();
