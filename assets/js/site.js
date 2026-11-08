/* =========================================================
   비하이브 공통 스크립트 (메인 사이트: 학생 · 학교 교육)
   - 상단 메뉴, 기업 교육 배너, 하단 푸터를 수업 데이터(assets/data/courses.js)로 만들어 넣습니다.
   - 페이지에서 사용법:
       <div id="site-nav"></div>
       <script src="assets/data/courses.js"></script>
       <script src="assets/js/site.js"></script>
       ... 본문 ...
       <div id="site-footer"></div>
   - 기업 · 공공기관 교육은 별도 사이트 biz/ 에서만 보여줍니다.
   ========================================================= */
(function () {
  var CATS = window.BH_CATEGORIES || [];
  var COURSES = window.BH_COURSES || [];
  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var q = new URLSearchParams(location.search);
  var BIZ_URL = 'biz/';

  /* 기업 · 공공기관 주소로 들어오면 비즈니스 사이트로 보냅니다 */
  if (page === 'program.html' && q.get('cat') === 'biz') { location.replace(BIZ_URL + (location.hash || '')); return; }
  if (page === 'course.html') {
    var bc = COURSES.filter(function (x) { return x.id === q.get('id'); })[0];
    if (bc && bc.cat === 'biz') { location.replace(BIZ_URL + '#' + bc.id); return; }
  }

  var ICONS = {
    ai: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
    sw: '<path d="M8.5 7L3.5 12l5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15"/>',
    career: '<circle cx="12" cy="12" r="9"/><path d="M15.8 8.2l-2.1 5.5-5.5 2.1 2.1-5.5z"/>',
    conv: '<circle cx="9" cy="12" r="5.5"/><circle cx="15" cy="12" r="5.5"/>',
    teacher: '<rect x="3" y="4.5" width="18" height="12" rx="1.5"/><path d="M7 20.5l3-4M17 20.5l-3-4M7 9h6M7 12h4"/>',
    biz: '<rect x="3.5" y="7" width="17" height="12.5" rx="2"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3.5 12.5h17"/>'
  };
  window.BH_ICON = function (id) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[id] || '') + '</svg>'; };

  var curCat = null;
  if (page === 'program.html') curCat = q.get('cat');
  if (page === 'course.html') { var c = COURSES.filter(function (x) { return x.id === q.get('id'); })[0]; if (c) curCat = c.cat; }
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
        '<a href="about.html"' + cur(page === 'about.html') + '>비하이브 소개</a>' +
        '<div class="nav-dropdown">' +
          '<button class="nav-trigger' + (curCat ? ' is-current' : '') + '" type="button" aria-expanded="false">교육 프로그램</button>' +
          '<div class="mega"><div class="mega-cols">' + cols + '</div>' +
          '<div class="mega-foot"><a class="mega-all" href="curriculum.html">전체 커리큘럼 한눈에 보기 <span>→</span></a>' +
          '<a class="mega-biz" href="' + BIZ_URL + '">기업 · 공공기관 교육은 <b>비하이브 비즈니스</b> <span>↗</span></a></div></div>' +
        '</div>' +
        '<a href="curriculum.html"' + cur(page === 'curriculum.html') + '>커리큘럼</a>' +
        '<a href="./#stories">교육 사례</a>' +
        '<a class="nav-cta" href="./#contact">교육 문의</a>' +
      '</div>' +
    '</nav>';

  /* 모든 메인 페이지 아래쪽(푸터 위)에 붙는 기업 교육 배너 */
  var bizBanner =
    '<aside class="biz-banner" aria-label="기업 · 공공기관 교육 안내"><div class="content-wrap">' +
      '<a class="biz-banner-in" href="' + BIZ_URL + '">' +
        '<span class="bb-copy"><small>FOR BUSINESS &amp; PUBLIC</small><b>기업 · 공공기관 교육을 찾으시나요?</b>' +
        '<em>임직원 AI 실무 · 업무 자동화 · 공무원 연수 · 지역 디지털 교육</em></span>' +
        '<span class="bb-go">비하이브 비즈니스 바로가기 <i>↗</i></span>' +
      '</a></div></aside>';

  var footer = bizBanner +
    '<footer class="site-footer"><div class="content-wrap">' +
      '<a class="footer-brand" href="./"><b class="brand-word">beehive</b><span>배움의 가능성을 함께 키웁니다</span></a>' +
      '<div class="footer-links"><a href="about.html">비하이브 소개</a><a href="program.html?cat=ai">교육 프로그램</a><a href="curriculum.html">커리큘럼</a><a href="./#stories">교육 사례</a><a href="' + BIZ_URL + '">기업 · 공공기관 교육 ↗</a></div>' +
      '<small>© BEEHIVE · LEARN, GROW, GO FURTHER</small>' +
    '</div></footer>';

  var slot = document.getElementById('site-nav');
  if (slot) slot.outerHTML = nav;
  function putFooter() { var f = document.getElementById('site-footer'); if (f) f.outerHTML = footer; }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', putFooter); else putFooter();

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
