/* =========================================================
   비하이브 교육 견적 기준 (이 파일 하나만 고치면 됩니다)
   - 의뢰 폼의 "예상 금액"과, 서버가 만드는 제안서의 견적표가 모두 이 파일을 씁니다.
   - 금액 단위는 원입니다.
   ========================================================= */
window.BH_PRICING = {
  baseMinutes: 45,                 // 1차시 기준 시간 (이보다 길면 시간 비율로 늘어남: 90분 = 2차시분)
  perSession: {                    // 1학급 · 1차시 강사료 (분야별)
    ai: 150000, sw: 150000, conv: 150000, career: 120000
  },
  teacherPerHour: 300000,          // 교원 연수: 1시간 강사료 (학급 수와 무관)
  materialPerStudent: {            // 재료비가 드는 수업: 학생 1인당 (수업 id 기준)
    'sw-arduino': 15000, 'sw-escape': 15000, 'conv-mbl': 15000, 'conv-future-me': 8000
  },
  studentsPerClass: 25,            // 인원을 안 적었을 때 재료비 계산용 학급당 인원
  minTotal: 300000,                // 최소 금액 (짧은 특강도 이 금액부터)
  vatNote: '부가가치세 별도',
  travelNote: '원거리(수도권 밖) 출장비는 별도 협의',
  soleContractLimit: 20000000      // 학교 소액 수의계약(1인 견적) 기준 금액
};

/* 견적 계산: 화면과 서버가 같은 함수를 씁니다
   입력: course(수업 데이터), level, sessions(차시), minutes(1차시 분), classes(학급 수), headcount(전체 인원) */
window.BH_QUOTE = function (course, level, sessions, minutes, classes, headcount) {
  var P = window.BH_PRICING || this.BH_PRICING;
  var lines = [], round = function (n) { return Math.round(n / 1000) * 1000; };
  sessions = Math.max(1, Number(sessions) || 1); minutes = Math.max(20, Number(minutes) || P.baseMinutes);
  classes = Math.max(1, Number(classes) || 1); headcount = Number(headcount) || 0;
  if (!course) return null;
  var fee;
  if (course.cat === 'teacher' || level === 'adult') {
    var hours = Math.ceil((sessions * minutes / 60) * 2) / 2;   // 30분 단위 올림
    fee = round(P.teacherPerHour * hours);
    lines.push({ item: '강사료 (연수)', detail: P.teacherPerHour.toLocaleString('ko-KR') + '원 × ' + hours + '시간', amount: fee });
    classes = 1;
  } else {
    var unit = P.perSession[course.cat] || 150000;
    var factor = Math.max(1, Math.round((minutes / P.baseMinutes) * 2) / 2); // 0.5 단위
    fee = round(unit * factor * sessions * classes);
    lines.push({ item: '강사료', detail: unit.toLocaleString('ko-KR') + '원' + (factor > 1 ? ' × ' + factor + '배(' + minutes + '분)' : '') + ' × ' + sessions + '차시 × ' + classes + '학급', amount: fee });
  }
  var mat = P.materialPerStudent[course.id] || 0, material = 0;
  if (mat) {
    var students = headcount || classes * P.studentsPerClass;
    material = round(mat * students);
    lines.push({ item: '재료비', detail: mat.toLocaleString('ko-KR') + '원 × ' + students + '명' + (headcount ? '' : ' (학급당 ' + P.studentsPerClass + '명 기준)'), amount: material });
  }
  var subtotal = fee + material, total = Math.max(P.minTotal, subtotal);
  if (total > subtotal) lines.push({ item: '최소 금액 적용', detail: '최소 ' + P.minTotal.toLocaleString('ko-KR') + '원', amount: total - subtotal });
  return { lines: lines, total: total, classes: classes, vatNote: P.vatNote, travelNote: P.travelNote, soleContract: total <= P.soleContractLimit };
};
