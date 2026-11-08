/* =========================================================
   분야 페이지(program.html) · 수업 상세(course.html) · 커리큘럼(curriculum.html)
   화면을 수업 데이터(assets/data/courses.js)로 그립니다.
   ========================================================= */
(function () {
  var CATS = window.BH_CATEGORIES || [], COURSES = window.BH_COURSES || [], LV = window.BH_LEVELS || {};
  var LV_ORDER = ['elem', 'mid', 'high', 'univ', 'adult'];
  var q = new URLSearchParams(location.search);
  var root = document.getElementById('page');
  var kind = document.body.getAttribute('data-page');
  var icon = window.BH_ICON || function () { return ''; };

  var catOf = function (id) { return CATS.filter(function (c) { return c.id === id; })[0]; };
  var levelsOf = function (c) { return LV_ORDER.filter(function (k) { return c.levels && c.levels[k]; }); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); };
  var badges = function (c) { return '<span class="lv">' + levelsOf(c).map(function (k) { return '<b title="' + LV[k].label + '">' + LV[k].short + '</b>'; }).join('') + '</span>'; };
  var section = function (c) { return c && c.id === 'biz' ? '기업·기관 교육' : '교육 프로그램'; };
  var note = function (text) {
    if (!text) { document.body.classList.add('no-note'); return ''; }
    return '<div class="sample-note">' + esc(text) + '</div>';
  };
  var cta = function (title, desc) {
    return '<div class="content-wrap"><div class="cta-band"><div><h2>' + title + '</h2><p>' + desc + '</p></div><a href="./#contact">교육 문의하기 ↗</a></div></div>';
  };
  var card = function (c, viaCat) {
    var from = viaCat && c.cat !== viaCat ? '<span class="ref">' + esc(catOf(c.cat).name) + ' 수업</span>' : '';
    return '<a class="c-card" href="course.html?id=' + c.id + '">' + from +
      '<span class="fmt">' + (c.format || []).map(function (f) { return '<i>' + esc(f) + '</i>'; }).join('') + '</span>' +
      '<h3>' + esc(c.title) + '</h3><p>' + esc(c.summary) + '</p>' +
      '<span class="foot">' + badges(c) + '<span class="go">↗</span></span></a>';
  };
  /* 분야 · 하위 묶음에 속한 수업 (다른 분야에서 함께 보여주는 수업 포함) */
  var coursesIn = function (cat, sub) {
    return COURSES.filter(function (c) {
      if (c.cat === cat && (!sub || c.sub === sub)) return true;
      return (c.also || []).some(function (a) { return a.cat === cat && (!sub || a.sub === sub); });
    });
  };

  /* ---------------- 분야 페이지 ---------------- */
  function renderProgram() {
    var cat = catOf(q.get('cat')) || CATS[0];
    document.title = cat.full + ' | 비하이브';
    var all = coursesIn(cat.id);
    var hasSample = all.some(function (c) { return c.sample; });
    var html = note(hasSample ? '이 분야의 일부 수업 구성은 디자인 확인용 예시입니다.' : '') +
      '<section class="page-top"><div class="content-wrap">' +
        '<nav class="crumb" aria-label="현재 위치"><a href="./">홈</a><span>›</span><span>' + section(cat) + '</span><span>›</span><span>' + esc(cat.name) + '</span></nav>' +
        '<span class="cat-chip"><span class="np-icon ' + cat.id + '">' + icon(cat.id) + '</span>' + esc(cat.full) + '</span>' +
        '<h1>' + esc(cat.lead) + '</h1>' +
        '<div class="why"><b>왜 필요할까요</b><p>' + esc(cat.why) + '</p></div>' +
        '<nav class="sub-nav" aria-label="하위 분야">' + cat.subs.map(function (s) { return '<a href="#' + s.id + '">' + esc(s.name) + '<span>' + coursesIn(cat.id, s.id).length + '</span></a>'; }).join('') + '</nav>' +
      '</div></section><div class="content-wrap">';
    cat.subs.forEach(function (s) {
      var list = coursesIn(cat.id, s.id);
      html += '<section class="sec-block" id="' + s.id + '"><div class="block-head"><h2>' + esc(s.name) + '</h2><span>수업 ' + list.length + '개</span></div>' +
        (list.length ? '<div class="c-grid">' + list.map(function (c) { return card(c, cat.id); }).join('') + '</div>' : '<div class="empty-note">준비 중인 수업입니다. 필요한 주제가 있으면 문의해 주세요.</div>') +
        '</section>';
    });
    html += '</div>' + cta('우리 학교 · 기관에 맞게 구성해 드립니다', '대상, 인원, 시간에 맞춰 차시와 활동을 조정합니다.');
    root.innerHTML = html;
  }

  /* ---------------- 수업 상세 ---------------- */
  function renderCourse() {
    var c = COURSES.filter(function (x) { return x.id === q.get('id'); })[0];
    if (!c) {
      document.body.classList.add('no-note');
      root.innerHTML = '<section class="page-top"><div class="content-wrap"><h1>수업을 찾을 수 없습니다</h1><p class="page-lead"><a href="curriculum.html">전체 커리큘럼</a>에서 다시 찾아보세요.</p></div></section>';
      return;
    }
    var cat = catOf(c.cat), lvs = levelsOf(c);
    document.title = c.title + ' | 비하이브';
    var partSample = lvs.filter(function (k) { return c.levels[k].sampleLevel; }).map(function (k) { return LV[k].label; });
    var noteText = c.sample ? '이 수업의 구성은 디자인 확인용 예시입니다.' : (partSample.length ? partSample.join(' · ') + ' 구성은 예시입니다. 나머지는 실제 수업 자료를 바탕으로 정리했습니다.' : '');
    var html = note(noteText) +
      '<section class="page-top"><div class="content-wrap">' +
        '<nav class="crumb" aria-label="현재 위치"><a href="./">홈</a><span>›</span><span>' + section(cat) + '</span><span>›</span><a href="program.html?cat=' + cat.id + '">' + esc(cat.name) + '</a><span>›</span><span>' + esc(c.title) + '</span></nav>' +
        '<a class="cat-chip" href="program.html?cat=' + cat.id + '"><span class="np-icon ' + cat.id + '">' + icon(cat.id) + '</span>' + esc(cat.full) + '</a>' +
        '<h1>' + esc(c.title) + '</h1><p class="page-lead">' + esc(c.summary) + '</p>' +
        '<dl class="c-meta">' +
          '<div><dt>대상</dt><dd>' + lvs.map(function (k) { return LV[k].label; }).join(' · ') + '</dd></div>' +
          '<div><dt>운영 형태</dt><dd>' + esc((c.format || []).join(' · ')) + '</dd></div>' +
          '<div><dt>준비물 · 환경</dt><dd>' + esc(c.prep || '사전 협의') + '</dd></div>' +
        '</dl></div></section><div class="content-wrap">';

    html += '<section class="sec-block" id="levels"><div class="block-head"><h2>대상별 수업 구성</h2><span>같은 주제도 대상에 따라 목표와 활동이 달라집니다</span></div>' +
      '<div class="lv-tabs" role="tablist">' + lvs.map(function (k, i) { return '<button type="button" role="tab" data-lv="' + k + '" aria-selected="' + (i === 0) + '">' + LV[k].label + '</button>'; }).join('') + '</div>' +
      '<div id="lvPanel"></div></section>';

    if (lvs.length > 1) {
      var rows = [['목표', 'goal'], ['차시 · 시간', 'time'], ['수업 흐름', 'steps'], ['사용 도구', 'tools'], ['결과물', 'output'], ['연계', 'link']];
      html += '<section class="sec-block"><div class="block-head"><h2>대상별 한눈에 비교</h2><span>표가 넓으면 옆으로 밀어서 보세요</span></div><div class="cmp-wrap"><table class="cmp"><thead><tr><th></th>' +
        lvs.map(function (k) { return '<th>' + LV[k].label + (c.levels[k].sampleLevel ? ' <span class="tag-sample">예시</span>' : '') + '</th>'; }).join('') + '</tr></thead><tbody>' +
        rows.map(function (r) {
          return '<tr><th>' + r[0] + '</th>' + lvs.map(function (k) {
            var v = c.levels[k][r[1]];
            if (r[1] === 'steps') v = (v || []).map(function (s) { return s.split(' — ')[0]; }).join(' → ');
            return '<td>' + esc(v) + '</td>';
          }).join('') + '</tr>';
        }).join('') + '</tbody></table></div></section>';
    }
    if (c.safety) html += '<section class="sec-block"><div class="safety"><b>안전 안내 · 수업 시작 전 꼭 함께 확인합니다</b><ul>' + c.safety.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></div></section>';

    var rel = coursesIn(c.cat).filter(function (x) { return x.id !== c.id; }).slice(0, 3);
    if (rel.length) html += '<section class="sec-block"><div class="block-head"><h2>' + esc(cat.name) + ' 분야의 다른 수업</h2><a class="text-link" href="program.html?cat=' + cat.id + '">전체 보기 <span>↗</span></a></div><div class="c-grid">' + rel.map(function (x) { return card(x, c.cat); }).join('') + '</div></section>';
    html += '</div>' + cta('이 수업을 우리 학교 · 기관에 맞게', '대상, 인원, 시간을 알려주시면 차시와 활동을 맞춰 운영안을 보내드립니다.');
    root.innerHTML = html;

    var panel = document.getElementById('lvPanel');
    function show(k) {
      var L = c.levels[k];
      panel.innerHTML = '<div class="lv-panel" role="tabpanel">' +
        '<div class="box"><h3>학습 목표' + (L.sampleLevel ? ' <span class="tag-sample">예시 구성</span>' : '') + '</h3><p class="lv-goal">' + esc(L.goal) + '</p>' +
          '<h3>수업 흐름</h3><ol class="steps">' + (L.steps || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></div>' +
        '<div class="box white"><dl class="facts">' +
          '<div><dt>차시 · 시간</dt><dd>' + esc(L.time) + '</dd></div>' +
          '<div><dt>사용 도구</dt><dd>' + esc(L.tools) + '</dd></div>' +
          '<div><dt>결과물</dt><dd>' + esc(L.output) + '</dd></div>' +
          '<div><dt>교과 · 생기부 연계</dt><dd>' + esc(L.link) + '</dd></div>' +
        '</dl></div></div>';
      root.querySelectorAll('.lv-tabs button').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-lv') === k); });
    }
    root.querySelectorAll('.lv-tabs button').forEach(function (b) { b.addEventListener('click', function () { show(b.getAttribute('data-lv')); }); });
    var want = q.get('lv');
    show(lvs.indexOf(want) >= 0 ? want : lvs[0]);
  }

  /* ---------------- 커리큘럼 표 ---------------- */
  function renderCurriculum() {
    document.title = '커리큘럼 | 비하이브';
    var state = { cat: q.get('cat') || 'all', lv: q.get('lv') || 'all' };
    var sessions = function (c) {
      var nums = [];
      levelsOf(c).forEach(function (k) { var m = String(c.levels[k].time).match(/(\d+)\s*차시/); if (m) nums.push(+m[1]); });
      if (!nums.length) return esc(c.levels[levelsOf(c)[0]].time);
      var a = Math.min.apply(null, nums), b = Math.max.apply(null, nums);
      return (a === b ? a : a + '~' + b) + '차시';
    };
    root.innerHTML = note('일부 수업 구성은 디자인 확인용 예시입니다.') +
      '<section class="page-top"><div class="content-wrap">' +
        '<nav class="crumb" aria-label="현재 위치"><a href="./">홈</a><span>›</span><span>커리큘럼</span></nav>' +
        '<h1>모든 수업을 한눈에</h1><p class="page-lead">분야와 대상을 골라 보세요. 수업을 누르면 초 · 중 · 고 대상별로 무엇이 달라지는지 자세히 볼 수 있습니다.</p>' +
        '<div class="filters">' +
          '<div class="f-row" data-key="cat"><span>분야</span><button data-v="all">전체</button>' + CATS.map(function (c) { return '<button data-v="' + c.id + '">' + esc(c.name) + '</button>'; }).join('') + '</div>' +
          '<div class="f-row" data-key="lv"><span>대상</span><button data-v="all">전체</button>' + LV_ORDER.map(function (k) { return '<button data-v="' + k + '">' + LV[k].label + '</button>'; }).join('') + '</div>' +
        '</div></div></section>' +
      '<div class="content-wrap" style="padding-bottom:20px"><p class="cur-count" id="curCount"></p><table class="cur-table"><thead><tr><th style="width:110px">분야</th><th>수업</th><th style="width:170px">대상</th><th style="width:100px">차시</th><th style="width:170px">운영 형태</th></tr></thead><tbody id="curBody"></tbody></table></div>' +
      cta('찾는 수업이 없나요?', '원하는 주제와 대상을 알려주시면 새로 설계해 드립니다.');

    function draw() {
      var list = COURSES.filter(function (c) {
        var okCat = state.cat === 'all' || c.cat === state.cat || (c.also || []).some(function (a) { return a.cat === state.cat; });
        var okLv = state.lv === 'all' || !!c.levels[state.lv];
        return okCat && okLv;
      });
      document.getElementById('curCount').textContent = '수업 ' + list.length + '개';
      document.getElementById('curBody').innerHTML = list.map(function (c) {
        var cat = catOf(c.cat);
        return '<tr><td><span class="cat-pill"><i class="d-' + cat.id + '"></i>' + esc(cat.name) + '</span></td>' +
          '<td><a href="course.html?id=' + c.id + (state.lv !== 'all' ? '&lv=' + state.lv : '') + '">' + esc(c.title) + '</a><span class="s">' + esc(c.summary) + '</span></td>' +
          '<td>' + badges(c) + '</td><td>' + sessions(c) + '</td><td>' + esc((c.format || []).join(' · ')) + '</td></tr>';
      }).join('') || '<tr><td colspan="5">조건에 맞는 수업이 없습니다.</td></tr>';
      root.querySelectorAll('.f-row').forEach(function (r) {
        var key = r.getAttribute('data-key');
        r.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-v') === state[key]); });
      });
    }
    root.querySelectorAll('.f-row button').forEach(function (b) {
      b.addEventListener('click', function () { state[b.parentNode.getAttribute('data-key')] = b.getAttribute('data-v'); draw(); });
    });
    draw();
  }

  if (kind === 'program') renderProgram();
  else if (kind === 'course') renderCourse();
  else if (kind === 'curriculum') renderCurriculum();
})();
