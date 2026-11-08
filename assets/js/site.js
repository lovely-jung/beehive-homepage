/* =========================================================
   비하이브 공통 스크립트
   - 상단 메뉴와 하단 푸터를 수업 데이터(assets/data/courses.js)로 만들어 넣습니다.
   - 페이지에서 사용법:
       <div id="site-nav"></div>
       <script src="assets/data/courses.js"></script>
       <script src="assets/js/site.js"></script>
       ... 본문 ...
       <div id="site-footer"></div>
   ========================================================= */
(function () {
  var CATS = window.BH_CATEGORIES || [];
  var COURSES = window.BH_COURSES || [];
  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var q = new URLSearchParams(location.search);

  var ICONS = {
    ai: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
    sw: '<path d="M8.5 7L3.5 12l5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15"/>',
    career: '<circle cx="12" cy="12" r="9"/><path d="M15.8 8.2l-2.1 5.5-5.5 2.1 2.1-5.5z"/>',
    conv: '<circle cx="9" cy="12" r="5.5"/><circle cx="15" cy="12" r="5.5"/>',
    biz: '<rect x="3.5" y="7" width="17" height="12.5" rx="2"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3.5 12.5h17"/>'
  };
  window.BH_ICON = function (id) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[id] || '') + '</svg>'; };

  /* 지금 페이지가 어느 메뉴에 속하는지 */
  var curCat = null;
  if (page === 'program.html') curCat = q.get('cat');
  if (page === 'course.html') { var c = COURSES.filter(function (x) { return x.id === q.get('id'); })[0]; if (c) curCat = c.cat; }
  var here = {
    about: page === 'about.html',
    prog: !!curCat && curCat !== 'biz',
    biz: curCat === 'biz',
    curri: page === 'curriculum.html'
  };
  var cur = function (on) { return on ? ' aria-current="page"' : ''; };

  var cols = CATS.filter(function (c) { return !c.separate; }).map(function (c) {
    return '<div class="mega-col">' +
      '<a class="mega-head" href="program.html?cat=' + c.id + '"><span class="np-icon ' + c.id + '">' + window.BH_ICON(c.id) + '</span><b>' + c.name + '</b></a>' +
      '<ul>' + c.subs.map(function (s) { return '<li><a href="program.html?cat=' + c.id + '#' + s.id + '">' + s.name + '</a></li>'; }).join('') + '</ul></div>';
  }).join('');

  var nav =
    '<nav class="global-nav" id="global-top" aria-label="비하이브 주요 메뉴">' +
      '<a class="global-brand" href="./" aria-label="비하이브 홈"><span class="brand-word">beehive</span></a>' +
      '<button class="global-menu-toggle" type="button" aria-label="메뉴 열기" aria-expanded="false" aria-controls="primaryLinks">☰</button>' +
      '<div class="global-links" id="primaryLinks">' +
        '<a href="about.html"' + cur(here.about) + '>비하이브 소개</a>' +
        '<div class="nav-dropdown">' +
          '<button class="nav-trigger' + (here.prog ? ' is-current' : '') + '" type="button" aria-expanded="false">교육 프로그램</button>' +
          '<div class="mega"><div class="mega-cols">' + cols + '</div>' +
          '<a class="mega-all" href="curriculum.html">전체 커리큘럼 한눈에 보기 <span>→</span></a></div>' +
        '</div>' +
        '<a href="program.html?cat=biz"' + cur(here.biz) + '>기업·기관 교육</a>' +
        '<a href="curriculum.html"' + cur(here.curri) + '>커리큘럼</a>' +
        '<a href="./#stories">교육 사례</a>' +
        '<a class="nav-cta" href="./#contact">교육 문의</a>' +
      '</div>' +
    '</nav>';

  var footer =
    '<footer class="site-footer"><div class="content-wrap">' +
      '<a class="footer-brand" href="./"><b class="brand-word">beehive</b><span>배움의 가능성을 함께 키웁니다</span></a>' +
      '<div class="footer-links"><a href="about.html">비하이브 소개</a><a href="program.html?cat=ai">교육 프로그램</a><a href="program.html?cat=biz">기업·기관 교육</a><a href="curriculum.html">커리큘럼</a><a href="./#stories">교육 사례</a></div>' +
      '<small>© BEEHIVE · LEARN, GROW, GO FURTHER</small>' +
    '</div></footer>';

  /* 메뉴는 바로 넣고(아래 스크립트들이 메뉴 높이를 쓰므로), 푸터는 본문이 다 읽힌 뒤 넣습니다 */
  var slot = document.getElementById('site-nav');
  if (slot) slot.outerHTML = nav;
  function putFooter() { var f = document.getElementById('site-footer'); if (f) f.outerHTML = footer; }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', putFooter); else putFooter();

  /* 메뉴 동작: 모바일 햄버거 + 드롭다운 */
  var n = document.querySelector('.global-nav');
  if (!n) return;
  var m = n.querySelector('.global-menu-toggle'), d = n.querySelector('.nav-dropdown'), t = n.querySelector('.nav-trigger');
  function close() {
    n.classList.remove('menu-open'); d.classList.remove('open');
    m.setAttribute('aria-expanded', 'false'); t.setAttribute('aria-expanded', 'false');
    m.setAttribute('aria-label', '메뉴 열기'); m.textContent = '☰';
  }
  m.addEventListener('click', function () {
    var open = n.classList.toggle('menu-open');
    m.setAttribute('aria-expanded', open); m.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기'); m.textContent = open ? '×' : '☰';
  });
  t.addEventListener('click', function () { var open = d.classList.toggle('open'); t.setAttribute('aria-expanded', open); });
  n.querySelectorAll('.global-links a').forEach(function (a) { a.addEventListener('click', close); });
  document.addEventListener('click', function (e) { if (!n.contains(e.target)) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
})();
