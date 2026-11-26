# 04 총괄 검수 보고서 — 홈페이지 분야별 커리큘럼

검수 대상: ai · sw · career · conv · teacher 의 `*_entries.js` (33개 중 신규·재설계 28개) + 설계서, 기준 문서 `00_brief.md`, 참고 `assets/data/courses.js`(수정하지 않음).

잘된 점: 하위 카테고리와 수업이 대체로 정확히 맞고, 초등 생성형 AI는 거의 모두 교사 시연으로 처리했으며, 블랙리스트 활동과 빈말·이모지는 하나도 없습니다. goal이 측정 가능한 숫자 조건을 가진 경우가 대부분입니다.

---

## 1. 항목별 판정

| # | 항목 | 판정 | 요지 |
|---|---|---|---|
| 1 | 카테고리 정합 | ✅ (⚠️ 2) | 모든 cat/sub·also 값 유효, 빈 하위 카테고리 없음(camp 신설 2개 + conv-mbl also). ⚠️ ai-chatbot 중등은 엔트리 텍스트 분류라서 '생성형 AI' 칸에 넣기엔 약함. ⚠️ ai-fairness 고등 1차시(사진 프로파일링)는 개인정보 주제라 영향평가 목표와 따로 놂 → 수정 |
| 2 | 중복 | ❌ → 수정 | 방탈출 3곳(sw-escape, conv-reading-escape, career-camp-escape). 제목 '수사대' 3곳(ai-literacy, sw-pybug, conv-phonelab). '월급날·한 달 생활비'가 conv-finance와 career-camp-rehearsal에 함께 있음. career-job과 career-camp-escape에 '과학수사' 직업 스테이션이 겹침. teacher-ai-assess와 teacher-ai-student 모두 'AI 사용 표기' 산출물. sw-arduino·conv-mbl과는 겹치지 않음(sw-escape 고등은 센서·상태 기계 단계라 기초와 분리됨) |
| 3 | 정렬 | ✅ (⚠️ 2) | goal–steps–output 대체로 맞물림. ⚠️ career-hackathon 중등 output '1분 시연 영상'은 steps에 촬영 단계가 없음. ⚠️ ai-fairness 고등 1차시(수정함) |
| 4 | 시간 현실성 | ⚠️ → 일부 수정 | 차시 수 = steps 수, 초40/중45/고50 모두 일치(career-free 17차시는 구간 묶음으로 허용). ❌ teacher 4개는 '3시간 특강 / 15시간 직무연수'에 같은 5단계를 쓰는데, 마지막 단계의 '현장 적용 결과로 수정'은 연수 사이에 현장 적용 기간이 있는 15시간형에서만 가능 → 표시 추가. ⚠️ sw-escape 초등 4×40분에 서보·자물쇠·단서 연결까지는 빠듯함 |
| 5 | 연령·툴 | ⚠️ → 수정 | 초등은 티처블 머신·오토드로우·퀵드로우·phyphox·교사 시연으로 문제없음. ⚠️ 중등에서 학생이 교사 계정이나 기기 스테이션으로 생성형 AI를 직접 조작하는 수업이 6개인데, 중1은 만 12~13세라 13세 미만 직접 사용에 걸림 → 해당 tools에 '만 13세 미만은 교사(강사) 시연' 추가 |
| 6 | 제도 정확성 | ⚠️ → 수정 | 공통·일반선택·진로선택·융합선택, 진로연계학기, 자유학기(주제선택·진로탐색), 예방·보충지도 용어는 정확함. ⚠️ teacher-min-achieve의 '성취율 40%'는 현행 기준이지만 선택과목 적용 범위·시기가 바뀌고 있어 홈페이지에 수치로 박아 두면 위험 → '이수 기준 경계'로 일반화. 설계서(career_02, teacher_02)에는 수치를 남겨도 됨 |
| 7 | 문체 | ⚠️ → 일부 수정 | 빈말·이모지·허위 제휴 없음. ❌ career-camp-escape summary가 두 문장 → 한 문장으로. ⚠️ 학교 담당자가 낯설어할 용어: 레드팀, 침투 테스트, 사전 부검, 스피드런, 바이브코딩(고등), 금통위 → 쉬운 말로 바꿈(대학용 MVP·IR·바이브코딩은 그대로 둠). ⚠️ teacher summary 4개가 모두 '~하고, ~하는 연수' 틀 → 1개 바꿈 |
| 8 | 형식 | ✅ | 5개 조각 모두 개별 파싱 성공, sample: true, 물리 활동 7개 모두 safety 있음, id 33개 고유(sw-arduino·conv-mbl·biz 포함 대조). 각 파일 끝에 쉼표가 없으므로 courses.js에 합칠 때 파일 사이에 쉼표를 넣어야 함 |

---

## 2. 수정 요청 목록

### 반영함 (❌ · 중요 ⚠️)
1. conv-reading-escape: 방탈출 틀을 'AI가 못 푸는 독서 문제 출제소'로 바꿈. 핵심 메커니즘(제목만 아는 AI가 맞히면 폐기·재출제)은 그대로 둠.
2. 제목 '수사대' 3중복: sw-pybug, conv-phonelab 제목 변경(ai-literacy만 유지).
3. career-camp-rehearsal의 '월급날·생활비'를 '성과 면담'으로 바꿈(conv-finance와 겹침 해소). summary·prep·tools도 맞춤.
4. career-job 스테이션 '과학수사 요원'을 '음향 엔지니어'로 바꿈(career-camp-escape와 겹침 해소).
5. 중등 생성형 AI 직접 조작 6곳에 만 13세 미만 가드 문구 추가.
6. teacher 4개의 현장 적용 단계에 '(직무연수)' 표시 추가.
7. teacher-min-achieve '성취율 40%'를 일반화.
8. 용어 정리: 레드팀, 침투 테스트(2곳), 사전 부검, 스피드런, 바이브코딩(고등), 금통위(중등).
9. career-camp-escape summary를 한 문장으로.
10. ai-fairness 고등 1차시를 영향평가서와 연결.
11. teacher-ai-student 5단계에서 '사용 표기 규칙'을 빼고 개인정보·답 검증 약속으로 바꿈(teacher-ai-assess와 겹침 해소).

### 반영 안 함 (설계자·운영자가 결정)
- A. 'AI가 틀린 것을 증거로 잡기' 메커니즘이 conv 5개 전부, ai-prompt, ai-inside, career-startup·portfolio, teacher-subject-counsel에 반복됨. 비하이브의 수업 철학이라면 유지하되, 융합 수업 중 1~2개는 AI를 검증 대상이 아니라 도구로 쓰는 쪽으로 다양화할지 결정이 필요함.
- B. '블라인드' 6회, '다른 팀 것 깨기(해킹·괴롭히기·금고 뚫기·버그 심기)' 약 7회, '재판·판결' 7회, '토큰·경매' 4회가 반복됨. 각 수업 안에서는 자연스럽지만 분야 페이지를 넘겨 보면 비슷해 보일 수 있음.
- C. ai-chatbot 중등(엔트리 분류 챗봇)이 '생성형 AI 활용' 칸에 맞는지, 아니면 also로 ai/basics를 붙일지.
- D. career-free 11~14차시 'AI 트레이너(티처블 머신)'가 ai-how와 거의 같은 활동임. 학기 강좌 안의 한 과제라 허용 가능하지만 다른 직업 과제로 바꿀지 검토 필요.
- E. sw-escape 초등 4×40분 완주 가능성. 5~6학년으로 대상을 한정하거나 5차시로 늘리는 방안을 검토.
- F. career-hackathon 중등 output의 '1분 시연 영상'은 steps 4부에 '촬영'을 넣거나 output에서 빼야 함.
- G. teacher 3시간 특강에 5개 모듈과 1인 10분 시범까지 넣기엔 빠듯함. 특강용 steps를 따로 둘지 결정 필요.
- H. 기존 courses.js의 teacher-genai · teacher-credit · career-future id가 새 조각에 없음. 교체 시 삭제할지, 이 id로 들어오는 기존 링크를 넘겨줄지 결정 필요.

---

## 3. 수업별 한 줄 판정

| id | 판정 | 한 줄 |
|---|---|---|
| ai-how | ✅ | 데이터 통제 실험이 학년별로 깊어짐. 기초 칸에 정확히 맞음 |
| ai-inside | ✅ | 언플러그드 원리 수업으로 ai-how와 잘 나뉨. 결정나무 '4번 안에 16장'이 측정 가능해서 좋음 |
| ai-literacy | ✅ | 출처 추적 중심이고 '수사대' 제목은 이 수업만 남김 |
| ai-fairness | ⚠️→✅ | 고등 1차시를 영향평가와 연결함 |
| ai-chatbot | ⚠️ | 중등이 생성형 AI가 아님(C). '레드팀' 용어 수정 |
| ai-prompt | ⚠️→✅ | 중등 13세 미만 가드 추가 |
| sw-escape | ⚠️ | 방탈출 3곳 중 피지컬 수업이라 유지. 침투 → 금고 뚫기. 초등 시간이 빠듯함(E) |
| sw-block | ✅ | 보드게임 → 코드 전환이 명확함 |
| sw-pybug | ✅ | 제목 '수사대' 변경. 고등 전용이며 Colab 계정 조건이 명시됨 |
| career-credit | ✅ | 과목 구분 용어가 정확하고 수치를 단정하지 않음 |
| career-free | ⚠️ | 17차시 구간 표기 허용. AI 트레이너가 ai-how와 겹침(D) |
| career-job | ⚠️→✅ | 과학수사 스테이션 교체 |
| career-portfolio | ✅ | '검사 결과 반박'이라는 훅이 신선함 |
| career-major | ✅ | 학과 블라인드 테스트가 좋음. 어디가·K-MOOC 실재 |
| career-startup | ⚠️→✅ | 중등 가드 추가. 대학 PSST 목차가 정확함 |
| career-hackathon | ⚠️ | 가드·용어 수정함. 영상 output 정합 문제 남음(F) |
| career-camp-escape | ⚠️→✅ | summary를 한 문장으로. 캠프 정체성이라 방탈출 유지 |
| career-camp-rehearsal | ⚠️→✅ | 월급날 → 성과 면담, 사전 부검 → 실패 미리 보기 |
| conv-reading | ⚠️→✅ | 쪽수 증거 훅이 좋음. 중등 가드 추가 |
| conv-reading-escape | ❌→✅ | 방탈출 → 독서 문제 출제소로 훅 교체 |
| conv-finance | ⚠️→✅ | 중등 가드 추가. 사기 문자 대응이 실용적임 |
| conv-finance-rate | ✅ | ECOS·통화정책방향 실재. 금통위 용어를 풀어 씀 |
| conv-phonelab | ✅ | 제목 변경. conv-mbl(아두이노)과 장비·현상 모두 겹치지 않음 |
| teacher-ai-assess | ⚠️→✅ | 직무연수 표시 추가 |
| teacher-ai-student | ⚠️→✅ | 표기 규칙 중복 제거, 직무연수 표시 |
| teacher-subject-counsel | ⚠️→✅ | summary 틀 변경, 직무연수 표시 |
| teacher-min-achieve | ⚠️→✅ | 40% 수치 일반화, 직무연수 표시 |

---

## 수정 반영 내역

원본 백업: 세션 scratchpad `backup/` (검수 전 상태). 모든 치환은 정확히 1회 일치를 확인한 뒤 적용함.

**conv_entries.js**
- conv-reading-escape: title '책으로 잠근 방탈출' → 'AI가 못 푸는 독서 문제 출제소'. summary·prep('구글 설문 문제집 틀')·mid goal·mid 1~3차시·mid output·high 1~2차시('사실 문제 vs 해석 문제', 'AI 풀이 시험')·high output의 자물쇠/탈출/침투 표현을 문제집 표현으로 교체
- conv-reading mid, conv-reading-escape mid, conv-finance mid tools: '만 13세 미만은 교사 시연' 추가
- conv-phonelab title → '내 폰이 측정기: 스마트폰 센서 데이터 과학'
- conv-finance-rate mid 2차시 '미니 금통위' → '미니 금융통화위원회'

**sw_entries.js**
- sw-pybug title → '고장 난 코드로 배우는 파이썬 첫걸음'
- sw-escape high goal·4차시·safety 마지막 줄: '침투 테스트' → '금고 뚫기 테스트'

**ai_entries.js**
- ai-chatbot high 3차시 '레드팀 시험' → '규칙 깨기 시험'
- ai-prompt mid tools: '만 13세 미만은 교사 시연' 추가
- ai-fairness high 1차시: 끝을 '개인정보 위험을 영향평가 항목으로 정리'로 바꿔 goal·output과 연결

**career_entries.js**
- career-job elem 1차시: '과학수사 요원' → '음향 엔지니어'
- career-camp-rehearsal: summary(생활비 → 성과 면담), prep·mid/high tools(생활비 카드 → 성과 면담지), mid·high 4부(월급날 → 성과 면담), high 3부·output(사전 부검 → 실패 미리 보기)
- career-camp-escape summary: 두 문장을 한 문장으로
- career-startup mid, career-hackathon mid tools: '만 13세 미만은 강사 시연' 추가
- career-hackathon mid 2부 '도구 스피드런' → '도구 15분 체험', high tools '바이브코딩 도구' → 'AI 코딩 도우미'

**teacher_entries.js**
- 4개 연수 마지막 단계의 현장 적용 부분에 '(직무연수)' 표시
- teacher-ai-student 5단계: '사용 표기 규칙' → '개인정보 · 답 검증 약속'
- teacher-min-achieve 1단계: '성취율 40% 경계' → '이수 기준 경계에 있는'
- teacher-subject-counsel summary 문장 틀 변경

**검증 (node)**: 5개 조각 모두 `window.X=[...]`로 파싱 성공(ai 6 · sw 3 · career 9 · conv 5 · teacher 4). courses.js의 sw-arduino·conv-mbl·biz 4개를 포함해 id 33개가 모두 고유함. cat/sub·also 모두 BH_CATEGORIES에 있는 값이고 빈 하위 카테고리 0개, 차시 수–steps 수와 학교급별 분 수 불일치 0건. 합칠 때는 각 파일 끝에 쉼표가 없으므로 조각 사이에 쉼표를 넣어야 함.
