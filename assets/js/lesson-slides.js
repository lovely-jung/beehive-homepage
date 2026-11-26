/* =========================================================
   비하이브 수업 슬라이드(PPT) 만들기
   - AI 교안의 차시별 구조 데이터(lesson_plans.content_json)로 실제 수업 화면용 슬라이드를 만듭니다.
   - 디자인: 흰 바탕 · 강조색 하나(주황) · 한 슬라이드 한 메시지 · 넉넉한 여백
   - 교사용 설명(여는 장치, 활동 상세, 현장 피드백)은 각 슬라이드의 '발표자 노트'에 들어갑니다.
   사용: BH_buildSlides(PptxGenJS, data) → pptx 객체 (pptx.writeFile({ fileName }) 로 저장)
   ========================================================= */
(function (root) {
  var C = { ink: '26241F', soft: '77736D', faint: 'B9B3A9', line: 'E8E4DC', paper: 'F6F4EF', accent: 'E9822D' };
  var FONT = 'Malgun Gothic';   // 학교 PC(윈도우)에 기본 설치된 글꼴. 맥에서는 비슷한 고딕으로 표시됩니다.
  var W = 13.333, X = 0.9, CW = W - X * 2;   // 16:9, 좌우 여백 약 7%

  // 글자 수에 따라 글자 크기를 줄여 한 화면에 들어가게 함
  function size(t, big, mid, small) { var n = String(t || '').length; return n > 110 ? small - 2 : n > 75 ? small : n > 40 ? mid : big; }

  // 한글이 단어 중간에서 끊기지 않도록, 글자 폭을 어림해 띄어쓰기 위치에서 미리 줄을 바꿈
  // (한글 1em, 영문 · 숫자 0.6em, 공백 · 문장부호 0.35em 으로 넉넉하게 계산)
  function wrap(text, widthIn, pt) {
    var cw = function (ch) { return /[\u3131-\uD7A3]/.test(ch) ? 1 : /[A-Za-z0-9]/.test(ch) ? 0.6 : /\s/.test(ch) ? 0.35 : /[()\[\]·.,:'"“”‘’!?\-\/~→]/.test(ch) ? 0.4 : 1; };
    var max = (widthIn * 72) / pt * 0.97, out = [], line = '', lw = 0;
    String(text || '').split(/\n/).forEach(function (para, pi) {
      if (pi) { out.push(line); line = ''; lw = 0; }
      para.split(' ').forEach(function (word) {
        var ww = 0; for (var i = 0; i < word.length; i++) ww += cw(word[i]);
        var add = (line ? 0.35 : 0) + ww;
        if (line && lw + add > max) { out.push(line); line = word; lw = ww; }
        else { line += (line ? ' ' : '') + word; lw += add; }
      });
    });
    out.push(line);
    return out.join('\n');
  }
  // 큰 글씨 본문: 크기를 정하고 그 크기에 맞춰 줄바꿈
  function big(s, text, opt) {
    var pt = opt.fontSize;
    s.addText(wrap(text, opt.w, pt), Object.assign({ fontFace: FONT, bold: true, color: C.ink, margin: 0, valign: 'top' }, opt));
  }

  function build(PptxGenJS, d) {
    var p = new PptxGenJS();
    p.layout = 'LAYOUT_WIDE';
    p.author = 'beehive'; p.company = 'beehive'; p.title = d.courseTitle + ' 수업 슬라이드';
    p.theme = { headFontFace: FONT, bodyFontFace: FONT };

    var foot = function (s, label) {
      s.addText([{ text: 'beehive', options: { bold: true, color: C.ink } }, { text: '.', options: { bold: true, color: C.accent } }],
        { x: X, y: 6.85, w: 3, h: 0.35, fontFace: FONT, fontSize: 11, margin: 0 });
      if (label) s.addText(label, { x: W - X - 6, y: 6.85, w: 6, h: 0.35, fontFace: FONT, fontSize: 11, color: C.faint, align: 'right', margin: 0 });
    };
    var kicker = function (s, t, y) { s.addText(t, { x: X, y: y || 0.75, w: CW, h: 0.4, fontFace: FONT, fontSize: 14, bold: true, color: C.accent, margin: 0 }); };
    var notes = function (s, arr) { var t = arr.filter(Boolean).join('\n\n'); if (t) s.addNotes(t); };

    /* ---------- 1. 표지 ---------- */
    var s = p.addSlide(); s.background = { color: 'FFFFFF' };
    kicker(s, d.levelLabel + ' · ' + d.sessions + '차시 수업', 2.2);
    big(s, d.courseTitle, { x: X, y: 2.7, w: CW, h: 1.5, fontSize: size(d.courseTitle, 44, 38, 32) });
    big(s, d.summary, { x: X, y: 4.3, w: CW * 0.8, h: 1.0, fontSize: 16, bold: false, color: C.soft });
    s.addShape(p.ShapeType.line, { x: X, y: 5.75, w: 0.6, h: 0, line: { color: C.accent, width: 2 } });
    s.addText(d.org + (d.dates ? '  ·  ' + d.dates : ''), { x: X, y: 5.9, w: CW, h: 0.4, fontFace: FONT, fontSize: 14, color: C.soft, margin: 0 });
    foot(s);
    notes(s, ['[교사용] ' + d.org + ' · ' + d.levelLabel + ' · ' + d.sessions + '차시 × ' + d.minutes + '분',
      '교안 버전 v' + d.version + (d.feedbackRounds ? ' (현장 피드백 ' + d.feedbackRounds + '회 반영)' : ''),
      '준비 사항: ' + d.prep, d.requestNotes ? '학교 요청 사항: ' + d.requestNotes : '']);

    /* ---------- 2. 수업 목표 ---------- */
    s = p.addSlide();
    kicker(s, '이 수업이 끝나면');
    big(s, d.goal, { x: X, y: 1.5, w: CW * 0.9, h: 3.2, fontSize: size(d.goal, 36, 32, 28) });
    s.addText([{ text: '최종 결과물  ', options: { bold: true, color: C.accent } }, { text: d.output, options: { color: C.ink } }],
      { x: X, y: 5.3, w: CW, h: 0.9, fontFace: FONT, fontSize: 18, margin: 0, valign: 'top' });
    foot(s, d.courseTitle);
    notes(s, ['사용 도구: ' + d.tools, '교과 연계: ' + d.link].concat(d.generalFeedback.length ? ['[이전 수업 현장 피드백]\n- ' + d.generalFeedback.join('\n- ')] : []));

    /* ---------- 3. 차시 한눈에 ---------- */
    var firsts = d.items.filter(function (it, i) { return i === 0 || d.items[i - 1].no !== it.no; });
    if (firsts.length > 1) {
      s = p.addSlide(); kicker(s, '우리가 함께 할 ' + d.sessions + '번의 시간');
      var rowH = Math.min(0.9, 4.9 / firsts.length);
      firsts.forEach(function (it, i) {
        var y = 1.5 + i * rowH;
        s.addText(String(it.no).padStart(2, '0'), { x: X, y: y, w: 0.9, h: rowH, fontFace: FONT, fontSize: Math.min(26, rowH * 30), bold: true, color: C.accent, margin: 0, valign: 'middle' });
        s.addText(it.title.replace(/\s\(\d+\/\d+\)$/, ''), { x: X + 1.0, y: y, w: CW - 1.0, h: rowH, fontFace: FONT, fontSize: Math.min(22, rowH * 26), color: C.ink, margin: 0, valign: 'middle' });
        if (i < firsts.length - 1) s.addShape(p.ShapeType.line, { x: X + 1.0, y: y + rowH, w: CW - 1.0, h: 0, line: { color: C.line, width: 1 } });
      });
      foot(s, d.courseTitle);
    }

    /* ---------- 4. 안전 약속 ---------- */
    if (d.safety && d.safety.length) {
      s = p.addSlide(); kicker(s, '시작하기 전에, 안전 약속');
      s.addText(d.safety.slice(0, 5).map(function (t) { return { text: t, options: { bullet: { indent: 18 }, paraSpaceAfter: 14 } }; }),
        { x: X, y: 1.5, w: CW, h: 4.8, fontFace: FONT, fontSize: 22, color: C.ink, margin: 0, valign: 'top' });
      foot(s, d.courseTitle);
    }

    /* ---------- 5. 차시별 ---------- */
    d.items.forEach(function (it) {
      var label = it.no + '차시 · ' + it.title;
      // 5-1. 차시 표지 (여백 중심)
      s = p.addSlide(); s.background = { color: C.paper };
      s.addText(it.no + '차시', { x: X, y: 2.4, w: CW, h: 0.6, fontFace: FONT, fontSize: 22, bold: true, color: C.accent, margin: 0 });
      big(s, it.title, { x: X, y: 3.0, w: CW, h: 1.6, fontSize: size(it.title, 44, 38, 32) });
      s.addText(it.min + '분', { x: X, y: 4.7, w: 3, h: 0.4, fontFace: FONT, fontSize: 16, color: C.soft, margin: 0 });
      foot(s);
      notes(s, [it.hook ? '[여는 장치] ' + it.hook : '', it.feedback.length ? '[현장 피드백 반영]\n- ' + it.feedback.join('\n- ') : '',
        '[차시 흐름]\n' + it.flow.map(function (f) { return '- ' + f[0] + ' (' + f[1] + '분): ' + f[2]; }).join('\n')]);

      // 5-2. 생각해 볼 질문
      if (it.ask) {
        s = p.addSlide(); kicker(s, '생각해 볼 질문');
        big(s, it.ask, { x: X, y: 1.9, w: CW * 0.92, h: 3.4, fontSize: size(it.ask, 40, 34, 28) });
        foot(s, label);
        notes(s, ['수업 내내 돌아올 핵심 발문입니다. 바로 답을 주지 말고 학생 생각을 칠판에 모아 두세요.', it.hook ? '[여는 장치] ' + it.hook : '']);
      }

      // 5-3. 오늘의 목표
      if (it.aim) {
        s = p.addSlide(); kicker(s, '오늘의 목표');
        big(s, it.aim, { x: X, y: 1.5, w: CW * 0.9, h: 3.4, fontSize: size(it.aim, 34, 30, 26) });
        if (it.out) s.addText([{ text: '오늘 만들 것  ', options: { bold: true, color: C.accent } }, { text: it.out, options: { color: C.ink } }],
          { x: X, y: 5.4, w: CW, h: 0.8, fontFace: FONT, fontSize: 18, margin: 0, valign: 'top' });
        foot(s, label);
      }

      // 5-4. 활동 단계 (한 단계 = 한 슬라이드, 아래에 진행 표시)
      var n = it.flow.length;
      it.flow.forEach(function (f, k) {
        s = p.addSlide();
        s.addText([{ text: f[0], options: { color: C.accent, bold: true } }, { text: '   ' + f[1] + '분', options: { color: C.soft } }],
          { x: X, y: 0.75, w: CW, h: 0.45, fontFace: FONT, fontSize: 16, margin: 0 });
        big(s, f[2], { x: X, y: 1.6, w: CW * 0.92, h: 4.2, fontSize: size(f[2], 34, 30, 26), lineSpacingMultiple: 1.15 });
        // 진행 표시: 지난 단계 · 지금 단계(주황) · 남은 단계
        var dw = Math.min(0.55, (CW * 0.5) / n);
        for (var j = 0; j < n; j++) s.addShape(p.ShapeType.rect, { x: X + j * (dw + 0.08), y: 6.25, w: dw, h: 0.07, fill: { color: j === k ? C.accent : j < k ? C.faint : C.line }, line: { type: 'none' } });
        foot(s, label);
        notes(s, [f[0] + ' (' + f[1] + '분)', f[2], k === n - 1 && it.extra ? '[시간이 남으면] ' + it.extra : '']);
      });

      // 5-5. 차시 정리
      if (it.out || it.extra) {
        s = p.addSlide(); kicker(s, it.no + '차시 정리');
        if (it.out) big(s, it.out, { x: X, y: 1.5, w: CW * 0.9, h: 2.6, fontSize: size(it.out, 36, 32, 28) });
        if (it.extra) s.addText([{ text: '시간이 남으면  ', options: { bold: true, color: C.accent } }, { text: it.extra, options: { color: C.soft } }],
          { x: X, y: 4.8, w: CW, h: 1.2, fontFace: FONT, fontSize: 17, margin: 0, valign: 'top' });
        foot(s, label);
      }
    });

    /* ---------- 6. 마무리 ---------- */
    s = p.addSlide(); s.background = { color: C.paper };
    s.addText('오늘 배운 것을\n한 문장으로 말해 볼까요?', { x: X, y: 2.3, w: CW, h: 2.2, fontFace: FONT, fontSize: 40, bold: true, color: C.ink, margin: 0, valign: 'top' });
    s.addText([{ text: 'beehive', options: { bold: true, color: C.ink } }, { text: '.', options: { bold: true, color: C.accent } }],
      { x: X, y: 5.2, w: 4, h: 0.6, fontFace: FONT, fontSize: 24, margin: 0 });
    notes(s, ['수업이 끝나면 강사 화면에서 결과 보고서를 남겨 주세요. 어느 슬라이드 · 활동을 고치면 좋을지 차시별로 적어 주시면 다음 교안에 반영됩니다.']);
    return p;
  }

  root.BH_buildSlides = build;
  if (typeof module !== 'undefined') module.exports = build;
})(typeof window !== 'undefined' ? window : globalThis);
