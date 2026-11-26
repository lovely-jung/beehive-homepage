# SW 분야 01 — 자료수집 · 분석 (physical / coding)

조사일: 2026-11-24 · 담당: sw (physical 아두이노·피지컬 컴퓨팅, coding 코딩 기초)
기준 문서: 00_brief.md · 기존 데이터: assets/data/courses.js (sw-arduino, conv-mbl 은 운영 수업이라 손대지 않음)

## 1. 사례 조사 (국내 · 해외 · 학교 밖)

| # | 사례 | 출처 URL | 대상 | 핵심 활동 | 빌려올 메커니즘 | 뻔한 점 |
|---|---|---|---|---|---|---|
| 1 | CS Unplugged 이진수 카드 · 패리티 마술 | https://www.csunplugged.org/en/topics/binary-numbers/ · https://www.csunplugged.org/en/topics/error-detection-and-correction/parity-magic/ | 초~중 | 카드 5~6장으로 상대가 고른 수를 맞히는 마술, 뒤집힌 카드 찾기 | 먼저 "속고" 나서 비밀을 역추적하는 구조. 학생이 원리를 알면 직접 공연자가 됨 | 원리 설명으로 끝나 손에 남는 결과물이 없음 |
| 2 | Code.org Dance Party: Unplugged | https://studio.code.org/s/dance-unplugged/lessons/1 · https://code.org/en-US/hour-of-code/dance | 초~중 | 이벤트 카드에 맞춰 몸으로 춤 동작 실행 | 사람이 컴퓨터 역할을 해 "명령 그대로만 실행"하는 답답함을 몸으로 느끼기 | Hour of Code 행사용, 튜토리얼 따라 하기로 끝남 |
| 3 | micro:bit classroom · do your :bit | https://microbit.org/get-started/user-guide/microbit-classroom/ · https://microbit.org/teach/do-your-bit/ | 초5~중 | 교사 · 학생 모두 등록 없이 학급 세션으로 코드 공유, 지속가능발전목표 해결 챌린지 | 계정 없이 바로 시작, 실물 센서로 즉시 반응 | "세상 문제 해결" 주제가 커서 결과물이 흐려지기 쉬움 |
| 4 | Code Club(Raspberry Pi Foundation) 언플러그드 방탈출 · micro:bit 방탈출 퍼즐 | https://codeclub.org/2026/03/03/hands-on-computing-explore-our-new-code-club-unplugged-projects · https://curiouscoders.substack.com/p/build-your-own-escape-room-puzzle | 9~13세 | 서사로 이어진 퍼즐을 차례로 풀기, micro:bit로 잠금 퍼즐 만들기 | 퍼즐 사슬(앞 퍼즐 답이 다음 퍼즐 열쇠), "남이 풀게" 만드는 설계 | 강사가 만든 방을 푸는 체험으로 끝나는 경우가 많음 |
| 5 | Robot Turtles 보드게임 | https://www.canonlab.org/robotturtlesboards | 유아~초저 | 명령 카드로 거북이를 보석까지 이동, 함수 카드 | 카드 수 제한 → 반복 · 함수가 "필요해서" 등장 | 대상 연령이 낮아 초고학년엔 단순 |
| 6 | Exploratorium Tinkering Studio — Scribbling Machines · Light Play | https://www.exploratorium.edu/tinkering/projects/scribbling-machines · https://www.exploratorium.edu/tinkering/projects/light-play | 전 연령(과학관) | 재료부터 만지고, 각자 만든 장치를 모아 협동 설치 작품으로 연결 | "먼저 만지고 개념은 나중", 개인 작품을 하나의 설치물로 잇기 | 개념 정리가 약해 학교 수업으로는 목표가 흐림 |
| 7 | Edutopia — Quest to Learn 6학년 루브 골드버그 장치 | https://www.edutopia.org/film-fest-rube-goldberg-learning-ideas · https://www.youtube.com/watch?v=qJyNxx82vGQ | 중1 | 연쇄 반응 장치 제작, 실패를 반복 개선으로 기록 | 실패 = 다음 버전(이터레이션) 기록 | 만들기만 길고 코딩 · 원리 연결이 약함 |
| 8 | Raspberry Pi Foundation PRIMM | https://www.raspberrypi.org/blog/using-primm-to-teach-programming-a-new-short-course-for-educators/ · https://computingeducationresearch.org/projects/primm/ | 중~고 | 예측 → 실행 → 조사 → 수정 → 제작 순서로 남의 코드부터 읽기 | 쓰기 전에 "결과 예측"부터, 일부러 버그 넣은 코드 고치기 | 교사용 틀이라 그대로 쓰면 학습지 수업처럼 건조함 |
| 9 | (국내) EBS 이솦 '뚝딱뚝딱 소프트웨어' 피지컬 컴퓨팅 과정 | https://www.ebssw.kr/edc/cultursens/cultursensDetailView.do?alctcrSn=55563 | 초~중 | 생활 문제 상황 → 컴퓨팅 사고로 설계 → 피지컬 컴퓨팅 구현 | 생활 문제 상황 제시 | "생활 속 불편 해결"이 흔해 결과물이 비슷해짐(자동 조명 · 화분 알림) |
| 10 | (국내) 마이크로비트 피지컬 컴퓨팅 효과 연구(KCI) · 교육청 마이크로비트 융합 수업 영상 | https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART002702698 · https://www.youtube.com/watch?v=YywTTR8hpdw | 초고 · 중 | 프로그래밍 경험 없는 초고학년 대상 마이크로비트 프로그램, 데이터 수집 융합 수업 | 경험 없는 학생도 실물 반응으로 진입 가능하다는 근거 | 결과물이 '자동 점수판' '센서 측정'에 머무름 |
| 11 | (국내) 소프트웨어야 놀자(네이버 커넥트재단) 피지컬 컴퓨팅 실습 | https://www.playsw.or.kr/program/view/PLAYSW_099_20241018131534 | 교 · 강사 | 피지컬 컴퓨팅 실습 연수 | 대상 맞춤 키트 축소 | 연수형, 학생 참여 메커니즘 정보 적음 |

참고: 인디스쿨(https://indischool.com/)은 로그인 기반 교사 커뮤니티라 자료 본문을 확인하지 못함 → 사례 표에서 제외. 국내 엔트리 게임 수업은 시중 교재(송상수 '엔트리 게임 코딩 학교' 등)처럼 "따라 만들기 → 공유"가 일반적 흐름임을 확인.

## 2. 흔한 패턴 (피해야 할 것)

1. 따라 만들기 튜토리얼 → 완성 작품 공유로 끝 (엔트리 게임, Hour of Code).
2. 피지컬 컴퓨팅 = "LED 깜빡이 → 신호등 → 생활 속 불편 해결 장치" 순서. 결과물이 자동 조명 · 화분 알림 · 점수판으로 수렴.
3. 강사가 개념 설명 15분 이상 → 예제 코드 타이핑 → 남는 시간에 응용.
4. 결과물을 만든 사람만 써 보고 끝 — 남이 써 보며 망가뜨리는 단계가 없음.
5. 디버깅을 "선생님 도와주세요"로 해결 — 오류를 읽는 법 자체를 배우지 않음.

## 3. 빌려올 메커니즘 (설계에 실제 반영)

| 메커니즘 | 출처 사례 | 반영 위치 |
|---|---|---|
| A. 먼저 속고, 비밀을 역추적 (잠긴 상자 · 마술 먼저) | CS Unplugged 마술, 방탈출 | sw-escape 1차시 '열리지 않는 상자', sw-pybug 3차시 '독심술 프로그램' |
| B. 퍼즐 사슬 — 내 장치의 답이 다른 모둠 장치의 열쇠 | Code Club 방탈출, Tinkering Studio 협동 설치 | sw-escape 3~4차시 '단서 사슬' '방탈출 개장' |
| C. 제약이 개념을 부른다 (카드 수 제한 → 반복) | Robot Turtles, Dance Party Unplugged | sw-block 초등 1~2차시 '선생님 로봇 조종' '카드 아끼기 대결' |
| D. 예측 먼저, 실행 나중 + 일부러 심은 버그 | PRIMM | sw-pybug 1 · 4차시 '예언하고 실행하라' '함정 심기 맞교환' |
| E. 남이 망가뜨려 보는 단계 (플레이테스트 · 침투 테스트 → 패치) | 루브 골드버그 반복 기록, 게임 업계 플레이테스트 | sw-block 4차시 '버그 신고 센터/플레이테스트 장터', sw-escape 고등 4차시 '침투 테스트' |

## 4. 무료 도구 연령 · 계정 조건 (확인 결과)

| 도구 | 계정 없이 사용 | 연령 · 계정 조건 | 수업 적용 |
|---|---|---|---|
| 엔트리 (playentry.org) | 작품 만들기 · 실행 가능(로그인 없으면 온라인 저장 불가, 내 컴퓨터 저장) | 14세 미만 가입 시 보호자 함께 가입 안내. '선생님' 회원만 학급 만들기 가능, 학급아이디 발급 · 초대 가능 (https://playentry.org/faq/63ec4453cda6570076f55d35 , https://playentry.org/terms/group) | 초등 · 중등: 비로그인 + 파일 저장 기본, 학교가 원하면 교사 학급으로 운영 |
| 스크래치 (scratch.mit.edu) | 에디터 사용 가능(공유 · 온라인 저장은 계정 필요) | 교사 계정으로 이메일 없는 학생 계정 생성 가능 (https://scratch.mit.edu/educators/faq) | 엔트리 대체용 |
| 마이크로비트 MakeCode (makecode.microbit.org) | 가능. 프로젝트는 브라우저에 저장 | micro:bit classroom은 교사 · 학생 모두 등록 불필요 (https://microbit.org/get-started/user-guide/microbit-classroom/) | 초등 · 중등 피지컬 기본 도구. 학교 PC의 USB · 파일 다운로드 차단 여부 사전 확인 필요 |
| Tinkercad Circuits | 계정 필요 | 13세 미만은 사용자명 · 비밀번호 · 보호자 이메일 필요, 또는 교사 Classroom의 로그인 코드 + 클래스 코드로 이메일 없이 입장 (https://www.tinkercad.com/help-center/signing-up-as-a-student-under-13 , https://www.tinkercad.com/blog/official-guide-to-tinkercad-classrooms) | 고등만 사용(교사 Classroom 코드 방식 권장) |
| 아두이노 IDE 2 | 설치형, 계정 불필요(Arduino Cloud는 계정 필요) | — | 고등: 설치형 IDE 사전 설치 요청 |
| Python 실행 환경 | Google Colab은 구글 계정 필요(국내 만 14세 미만은 보호자 동의) | 고등학생 학교 계정 사용, 계정이 어려우면 설치 없는 브라우저 파이썬 편집기로 대체 | 고등 텍스트 코딩 |

## 5. 기존 수업과의 겹침 점검

- sw-arduino(운영): 중등 LED 디지털 출력 · 신호등, 고등 보드 구조 · setup/loop · 핀 전류 한계 → 새 수업은 **입력 센서 · 임계값 · 서보 · 상태 관리**로 다음 단계만 다룸. 신호등 · LED 깜빡이 활동 없음.
- conv-mbl(운영, physical에도 노출): 스트로보 · 회전 · p5.js 대시보드 · 워터펌프 → 새 수업은 빛 깜빡임 · 회전 측정 · 대시보드 미사용.
- ai-* 수업: 티처블 머신 · 챗봇 → SW 수업은 AI 도구 없이 진행(겹침 없음).
- career-hackathon: 팀 제작 · 심사 → SW 수업은 경쟁 심사가 아니라 "서로 뚫고 고치는" 상호 테스트 구조.
