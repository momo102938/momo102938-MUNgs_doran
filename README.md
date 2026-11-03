# 도란

캐릭터들이 집·회사·도란 고등학교·광장·도란 대학교에서 보내는 하루를 관찰하는 한국어 생활 시뮬레이션입니다. React + TypeScript + Vite로 작성했습니다. 기존 도란 사이트를 참고한 크림색·베이지색 관찰 화면, 기본 캐릭터 A와 B, 수정 가능한 다섯 전개도, 사용자가 제공한 기본 자리표시자 PNG 한 장을 포함합니다.

**백엔드·Cloudflare·Workers·D1·외부 AI·API 키를 사용하지 않습니다.** 웹페이지를 내려받은 뒤 대사 생성과 데이터 저장은 브라우저에서 처리합니다. Windows 앱은 빌드한 웹 화면을 내장하여 오프라인으로 실행합니다. 첨부 참고 이미지의 원본이나 워터마크 이미지를 배포 파일에 넣지 않고 독립적인 편집형 전개도를 구성했습니다.

## 1.4.4 업데이트

- Windows 메인 창을 **1200×800으로 고정**했습니다. 창 크기 변경·최대화는 막고, 전개도 팝업은 별도 3:2 창으로 유지합니다. 웹은 브라우저 크기에 맞춰 표시합니다.
- 시작 전에 사용자가 확정한 **도란을 시작하기 전에** 주의사항을 보여 줍니다. 시작하기를 누르면 관찰 화면으로 들어갑니다. 전개도 팝업에는 주의사항을 띄우지 않습니다. 문구는 `src/components/StartNotice.tsx`에서 수정합니다.
- ‘도란’ 로고와 화면의 고정된 굵은 한글 제목·메뉴·접기 항목·사건 라벨은 **코트라 볼드체 모양의 SVG 이미지**로 통일했습니다. 시작 안내는 **양 그림 옆에 제목**을 가로로 배치하고, 그림의 여백을 고려해 사이 간격을 줄였습니다. 메뉴·본문·입력창·말풍선의 일반 글자는 **SUIT**입니다. 코트라 원본 글꼴 파일은 재배포하지 않고 완성된 문구 이미지 `public/titles/`만 포함합니다. 직접 입력하는 캐릭터 이름 등 동적 문구는 PC에 설치된 KOTRA 글꼴을 우선 사용하며, 미설치 시 SUIT로 표시합니다. 고정 문구를 새로 조판하려면 원 제작자의 글꼴 파일을 프로젝트 밖에 준비한 뒤 `python scripts/render-kotra-titles.py /로컬/글꼴파일`을 사용합니다(Python fontTools 필요). SVG 목록은 `src/kotra-titles.json`, 표시 컴포넌트는 `src/components/KotraText.tsx`입니다.
- 시작 주의사항 제목 옆과 관찰 화면의 도란 로고 옆에 **v1.4.4**를 작게 표시합니다. 두 화면 모두 `src/version.ts`에서 읽는 최상위 `package.json`의 버전을 사용합니다. 같은 값을 따로 적지 않습니다. 글꼴 출처는 `public/KOTRA-WORDMARK-NOTICE.txt`, SUIT 이용 안내는 `public/fonts/SUIT-LICENSE.txt`에 있습니다.
- 화분은 **위에서 본 둥근 화분과 잎**으로 수정했습니다. 의자 등받이는 식탁·책상을 향해 앉도록 바깥쪽으로 정돈했고, 거실·욕실·서재 가구와 출입문 동선을 정리했습니다.
- 집 왼쪽에 **베란다**를 추가했습니다. 주방과 맞닿는 위쪽은 벽으로 막고, 거실 쪽은 유리 미닫이창으로 드나듭니다. 가까이 걸어오면 창이 열리며, 일반 창문과 별도로 구조 팔레트에서 추가할 수 있습니다. 자유 행동 중 가끔 바람을 쐬고, ‘바람 쐬기’ 행동을 일정에 넣을 수도 있습니다. 이전 기본 집을 그대로 쓰는 저장본은 자동 보완합니다. 직접 꾸민 집은 유지하므로 새 베란다 배치를 원하면 **집 → ↶ 기본 전개도**로 복원하세요. 복원 전 JSON을 내보내면 기존 배치를 보관할 수 있습니다.
- **선생님·선생·교사·강사·교원**은 고등학교를 나이 제한 없이 선택할 수 있습니다. **교수·부교수·초빙 교수**의 회사·학교 일정은 대학교로 연결합니다. 학생은 19세까지 고등학교, 20세부터 대학교 기준입니다. 직업별 회사 대사와 교탁 수업, 선택형 연상 존댓말도 유지합니다.
- **PC 시각만 사용합니다.** 배속·날짜 직접 설정·연동 선택은 제거했습니다. 재생하면 현재 PC 시각에 맞추고, 정지하면 시간과 움직임을 멈춥니다. 다시 재생하면 현재 PC 시각으로 돌아갑니다. ‘말 걸기’와 ‘대화 생성’ 버튼은 제거하고 랜덤 사건 버튼은 유지합니다. 같은 장소의 대화는 재생 중 자동으로 발생합니다.
- 오른쪽 날씨 표시와 공유·서버 저장 관련 안내 문장을 화면에서 제거했습니다. 관찰·기록·캐릭터 편집·왼쪽 메뉴의 장식 문구도 제거하고 기록 조작 버튼은 오른쪽으로 정렬했습니다. 캐릭터 PNG 안내는 왼쪽 정렬과 단어 단위 줄바꿈으로 정리했습니다.
- 재생 중 자동 저장은 최대 3초 간격으로 묶고, 정지·수정·직접 저장·창 종료 때 저장합니다. 캐릭터 위치는 초당 8회 갱신하며 CSS 보간으로 이어 보입니다. 기본 도면을 불러오는 중복 작업도 줄였습니다. 세계 데이터와 캐릭터 PNG는 계속 브라우저에 보관합니다.
- 앉을 때 크기 유지, 침대 회전에 따른 베개 방향 취침, 씻기 거품, 팝업 말풍선, PNG 업로드·기억 편집, 전개도 전체 편집과 JSON 내보내기·불러오기를 포함합니다.

- 1.4.4: 소파를 왼쪽 등받이·두 쿠션 형태로 다듬고 주방 가구와 의자 방향을 정돈했습니다. 일반 문은 얇은 문턱 선으로 표시합니다. 거실과 복도 사이에는 문 없는 통로를 두었습니다. **1인 침대는 전개도 꾸미기에서만 추가**하며 한 명이 사용합니다. 기본 집에는 기존 2인 침대를 유지합니다. 이전 기본 위치의 가구만 자동 보완하고 직접 이동한 가구는 보존합니다.

## 1. 먼저 실행하기

1. Node.js 24 LTS와 npm을 설치합니다.
2. ZIP을 풀고 `doran` 폴더에서 터미널을 엽니다. `package.json`과 `index.html`이 보이는 위치입니다.
3. 아래 명령을 차례대로 실행합니다.

```bash
npm ci
npm run dev
```

터미널에 표시되는 주소를 브라우저에서 엽니다. `index.html`을 더블 클릭하는 방식으로는 React 소스가 실행되지 않습니다.

```bash
npm test            # 일정·대사·저장 검증 테스트
npm run build       # TypeScript 검사 후 dist/ 생성
npm run preview     # 생성된 배포 파일 미리보기
```

## 2. GitHub Pages 게시하기

**저장소 최상위에 이 프로젝트의 `index.html`, `package.json`, `src`, `public`, `.github`, `windows-app`이 오도록 업로드합니다.** `doran` 폴더 자체를 한 번 더 감싸서 올리지 마세요. 숨김 폴더 `.github`와 두 `package-lock.json`도 반드시 올려야 합니다. GitHub Desktop으로 폴더 전체를 커밋할 수 있습니다. 웹 업로드에서 `.github`에 “This file is hidden”이 나오면 저장소의 **Add file → Create new file**을 이용해 `.github/workflows/build-windows-app.yml`을 직접 만들고, 압축 파일 속 같은 파일의 내용을 붙여 넣어 저장하세요. Pages 워크플로도 `.github/workflows/deploy-pages.yml` 경로에 같은 방법으로 만듭니다.

1. GitHub에 새 저장소를 만들고 위 파일을 `main` 브랜치에 업로드합니다.
2. 저장소의 **Settings → Pages → Build and deployment → Source**에서 **GitHub Actions**를 선택합니다.
3. **Actions → Deploy GitHub Pages**로 들어갑니다. `main`에 올릴 때 자동 실행되며, **Run workflow**로도 실행할 수 있습니다.
4. 성공한 실행의 `deploy` 작업 또는 **Settings → Pages**에 표시되는 주소를 엽니다.

최상위 `index.html`은 Vite의 소스 진입점입니다. 워크플로가 이를 빌드해 **`dist`의 정적 파일만** Pages에 게시합니다. React 소스가 들어 있는 저장소 루트를 `Deploy from a branch`로 직접 게시하면 작동하지 않습니다. `base: './'`를 사용하므로 저장소 이름이 달라도 하위 경로의 이미지와 자산을 찾습니다. 기본 브랜치가 `main`이 아니라면 `deploy-pages.yml`의 `branches`를 변경하세요. Pages를 사용할 수 있는 저장소 공개 범위는 본인의 GitHub 요금제에 맞게 선택하세요.

## 3. Actions에서 Windows EXE 받기

Pages를 게시하지 않아도 EXE를 만들 수 있습니다.

1. 저장소 **Actions** 탭을 엽니다. 처음이라면 워크플로 사용을 활성화합니다.
2. 왼쪽에서 **Build Windows app**을 선택합니다. 파일명은 `.github/workflows/build-windows-app.yml`입니다.
3. **Run workflow → main → Run workflow**를 누릅니다.
4. 완료된 실행을 클릭하고 아래 **Artifacts → Doran-Windows-x64**를 다운로드합니다.
5. 받은 ZIP을 풀면 `Doran-1.2.0-portable-x64.exe`가 있습니다. 설치 없이 실행하는 x64 휴대용 앱입니다. Windows ARM64 전용 빌드는 포함하지 않습니다.

`Build Windows app`이 보이지 않으면 `.github/workflows/build-windows-app.yml`이 기본 브랜치에 정확한 경로로 올라갔는지 확인하세요. `workflow_dispatch`를 사용하므로 기본 브랜치에 파일이 있어야 수동 실행 메뉴가 나타납니다. 실패하면 해당 실행의 빨간 작업을 열어 로그를 확인하세요. 결과물 보관 기간은 30일입니다.

## 4. Windows PC에서 직접 빌드하기

프로젝트 루트의 PowerShell 또는 명령 프롬프트에서 실행합니다.

```powershell
npm ci
npm ci --prefix windows-app
npm run desktop
```

`npm run desktop`은 웹을 빌드한 후 Electron으로 엽니다. 휴대용 EXE 생성:

```powershell
npm run build:windows
```

결과는 `windows-app/release/`입니다. 최초 의존성 설치와 Electron 빌드 도구 다운로드에는 인터넷이 필요하지만 생성한 EXE의 기본 실행에는 필요하지 않습니다. 인증서 서명을 하지 않은 개인 빌드이므로 Windows에서 게시자를 확인할 수 없다는 안내가 나타날 수 있습니다.

### Pages 주소를 사용하는 선택 실행

기본 Electron은 로컬 `dist`를 내장하여 엽니다. 웹 버전 주소를 쓰고 싶을 때만 **`windows-app/main.cjs` 상단의 `PAGES_URL` 한 곳**을 본인의 주소로 바꾸고 다음과 같이 실행합니다.

```powershell
npm --prefix windows-app start -- --pages
```

이 모드는 해당 Pages 웹페이지를 로딩하므로 인터넷이 필요합니다. 저장 데이터는 내장 화면(`doran://app`)과 Pages 주소마다 따로 보관됩니다. 기본 오프라인 앱을 만드는 데 `PAGES_URL`을 수정할 필요는 없습니다.

## 5. 화면 사용법

- **관찰 화면**: 1200×800 데스크톱 창에서 전개도·상태·최근 이야기 두 줄을 함께 봅니다. 원형 캐릭터 탭이나 전개도의 캐릭터를 누르면 상태를 볼 수 있습니다. 재생·정지와 장소 선택, 랜덤 사건을 조작하고 자동 대화와 친밀도를 관찰합니다.
- **캐릭터 편집**: 이름·나이·성격·말투·직업·취향·습관·기분·피로도, PNG, 일정, 기본 대사, 기억을 수정합니다. 최소 2명, 기본 최대 6명입니다. 투명 배경 PNG를 업로드하면 최대 400px 범위로 비율을 유지하여 축소합니다. 전신 이미지는 `object-fit: contain`으로 표시합니다. 기본 이미지는 캐릭터가 정해지지 않은 자리표시자입니다. ‘내 캐릭터 PNG 넣기’로 직접 만든 이미지로 바꿀 수 있고 ‘기본 캐릭터로 되돌리기’로 복원할 수 있습니다. 이전 버전의 기본 SD는 새 자리표시자로 자동 교체되며, 사용자가 직접 업로드한 이미지는 유지합니다.
- **하루 일정**: 각 항목의 시간이 되면 행동과 장소가 바뀝니다. 자정부터 첫 일정 전까지는 전날 마지막 일정이 이어집니다. 일정은 매일 반복되며 주말·휴일은 따로 계산하지 않습니다. 시간표에 기상·식사·출근·등교·귀가·공부·놀이·대화·취침을 넣을 수 있습니다.
- **자녀 설정**: 부모 최대 2명과 학교·등교·귀가·취침·숙제를 정합니다. 부모를 선택하면 부모와 자녀 관계도 생성합니다. 자녀는 등교부터 귀가까지 학교에서 생활하며 기본 직장 출근 일정은 무시합니다. 등교·귀가·취침은 같은 시각의 일반 일정보다 우선합니다. 숙제 시간에는 일반 일정에 ‘공부’를 추가하세요. 일반 일정에 넣은 야간 놀이 등은 필요에 맞게 지워 주세요.
- **관계 설정**: 두 사람 사이에 연인·친구·룸메이트·직장 동료·부모와 자녀·형제자매 중 하나를 지정하고 친밀도를 조절합니다. 작은 사건으로 친밀도가 변합니다.
- **세계 설정**: 세계 이름·장소 이름·자동 랜덤 사건 여부를 바꿉니다. 현재 PC 연동 시각은 읽기 전용으로 표시합니다. JSON 내보내기와 불러오기도 이곳에서 합니다.
- **대화 기록**: 종류·캐릭터별로 확인하고 비울 수 있습니다. 기록 삭제와 캐릭터 기억 삭제는 별개입니다.

## 6. 대사와 기억의 원리

외부 모델이나 AI API를 호출하지 않습니다. 규칙 엔진이 성격(밝음·다정함·조용함 등 키워드), 말투(존댓말·정중 키워드), 선택형 연상 존댓말, 관계·친밀도, 장소·행동, 취향, 직업, 기분·피로도, 최근 질문과 대화 기억을 참고하여 문장 후보를 고릅니다. 최근 40개 기록에 나온 동일 문장은 피하고, 후보가 소진되면 오래 전에 사용한 자연스러운 문장부터 다시 선택합니다. 유한한 규칙이므로 긴 시간 동안 표현이 다시 등장할 수 있으며 자유로운 AI 추론이나 모든 말투를 모방하는 기능은 아닙니다.

기본 대사는 한 줄에 하나씩 최대 20개입니다. `{상대}`와 `{이름}`을 호칭으로 바꿉니다. 예문 자체도 대사 후보로 사용하므로 해당 캐릭터의 자연스러운 문장을 적어 주세요. **기억은 모델 재학습이 아니라 브라우저에 저장된 대화 내용을 대사 선택에 참고하는 방식**입니다. 보행 위치는 별도로 매 프레임 저장하지 않고 실행 중 메인 화면에서 관리합니다. 재실행하면 일정에 맞는 장소에서 생활을 다시 시작하며, 식사·취침·공부·업무 중에 열면 해당 가구의 자리나 침대 위에 배치합니다. 자동 대화는 참여자 두 명의 기억에 저장하며 캐릭터별 최근 100개를 보관합니다. 기억을 직접 확인·수정·추가·삭제할 수 있습니다. 일부 기억은 반복 인용이나 어색한 질문을 막기 위해 후보에서 제외합니다.

내장 사건은 간식 나누기·산책 약속·사소한 의견 차이·화해·휴식 등 일상적인 내용입니다. 노골적인 성적 내용, 미성년자 성적 내용, 과도한 폭력 묘사를 생성하는 규칙은 없습니다. 사용자가 직접 쓰는 대사와 기억은 그대로 저장하므로 원하는 일상 분위기의 문장을 입력하세요.

## 7. 전체 전개도 꾸미기

장소를 선택하고 **전개도 꾸미기**를 누르면 별도 편집 창이 열립니다. 메인 관찰 화면은 길어지지 않습니다. 오른쪽 속성 영역은 필요한 만큼 스크롤할 수 있습니다.

1. **가구·벽·문** 모드에서 도면의 요소를 누르고 끌어 옮깁니다. 선택 테두리의 오른쪽 아래 작은 사각형을 끌면 크기가 바뀝니다.
2. 오른쪽 ‘추가하기’에서 **생활 / 구조 / 학교 / 야외**를 선택합니다. 소파·침대·책상·의자·러그·싱크대·냉장고·욕조·변기·세면대·책장·수납장·텔레비전·화분·메모, 벽·문·창문, 칠판·교탁·강의 책상·시계, 벤치·나무·분수·카페·조명을 추가할 수 있습니다.
3. **방·바닥 구역** 모드에서는 방 전체를 옮기거나 크기를 조절합니다. ‘방·바닥 구역 추가’로 새 공간을 만들고 이름, 색상, 나무·타일·잔디 무늬, 모서리 둥글기, 테두리를 정합니다. 각 벽은 구조 요소이므로 방 바닥과 독립적으로 움직일 수 있습니다.
4. 작은 벽이나 창문을 누르기 어려우면 오른쪽 **요소 선택** 목록을 사용하세요. 이름·가로/세로 위치·너비·높이를 숫자로 입력하거나 45도 간격으로 회전할 수 있습니다. 색상 변경, 복제, 맨 앞으로, 선택 삭제도 지원합니다.
5. **모두 비우기**는 현재 장소의 모든 구역과 요소를 비웁니다. **기본 도면 복원**은 현재 장소만 새 기본 배치로 되돌립니다. 편집 중에는 최근 20단계 **실행 취소**를 사용할 수 있습니다.
6. **완료 · 닫기** 또는 Esc로 관찰 화면에 돌아옵니다. 변경 사항은 자동 저장되고 JSON에도 포함됩니다.

장소별 최대 40개 방·바닥 구역과 200개 가구·구조 요소를 저장합니다. 벽의 길이·두께도 너비와 높이로 바꿀 수 있습니다. 크기와 위치는 전개도 기준 백분율이라 다른 화면에서도 배치가 유지됩니다. 기본 제공 이미지는 사용자가 보내 준 자리표시자를 사용하며, 캐릭터 PNG 업로드 기능도 유지합니다.

## 8. PC 시각과 작은 창

시간은 항상 **컴퓨터의 현지 날짜·시각**을 사용합니다. 앱을 열면 현재 PC 시각에서 정지한 상태로 시작합니다. 재생하면 현재 PC 시각에 맞춰 일정과 이동을 진행하고, 정지하면 시간과 이동을 멈춥니다. 다시 재생하면 그때의 PC 시각으로 맞춥니다. 배속이나 날짜 직접 설정은 없습니다. 이전 JSON의 시각·배속은 실행 시 PC 연동 방식으로 전환합니다.

**작은 창으로 보기**는 같은 앱의 전개도와 그 안에서 생활하는 캐릭터만 표시합니다. 장소 선택은 마우스를 올리거나 Tab 키로 접근하면 나타납니다. 메인 창이 시간을 계산하고 팝업은 `BroadcastChannel` 및 같은 출처의 저장 이벤트로 데이터를 받아 표시합니다. 이동 좌표도 같은 채널로 받아 메인 화면과 팝업에서 같은 캐릭터 위치를 보여 줍니다. 팝업에서 선택하는 장소는 팝업 안에서만 바뀝니다. **메인 창은 계속 열어 두세요.** 팝업 자체는 시뮬레이션을 진행하거나 세계를 저장하지 않습니다. 메인 창을 두 개 이상 열어 서로 다른 편집을 하면 마지막으로 저장한 내용이 남으므로, 관찰 팝업을 이용해 주세요.

브라우저에서 팝업이 차단되면 주소창의 팝업 허용 기능을 사용하세요. 브라우저 팝업에는 운영체제의 항상 위·투명 창 기능을 적용할 수 없습니다. Electron 팝업은 프레임 없는 투명 창으로 열리고 기본적으로 항상 위에 표시됩니다. 전개도 맨 위의 24픽셀 영역을 잡아 옮길 수 있고, 마우스를 올리면 **장소 선택 / 고정 해제 / 항상 위 / 닫기** 조작이 전개도 위에 나타납니다. 메인 앱을 닫으면 Electron 팝업도 닫힙니다.

Electron은 `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`를 유지합니다. preload는 팝업 열기·항상 위 전환·닫기 세 기능만 연결합니다. IPC 호출 창과 프레임을 검사하며 임의 탐색·새 창·권한 요청을 차단합니다. 내장 화면은 고정 출처 `doran://app`에서 제공하므로 파일 위치나 앱 업데이트에 따라 저장 출처가 바뀌지 않습니다.

## 9. 자동 저장·백업·복구

`localStorage`에 장소·캐릭터·관계·일정·대화·기억·전개도·시각을 저장합니다. 브라우저, 주소, 프로필이 달라지거나 웹 버전에서 EXE로 옮기면 자동으로 데이터가 따라오지 않습니다. **도란 파일 내보내기**로 JSON을 저장하고 새 환경에서 **JSON 파일 불러오기**로 가져오세요. JSON에는 캐릭터 이미지도 포함됩니다.

브라우저 저장 공간은 제한적입니다. 이미지가 너무 크거나 브라우저에서 저장을 막으면 실패 안내가 나타납니다. 이미지를 줄이거나 JSON 백업을 하세요. 개인정보 보호 모드와 브라우저 데이터 삭제 시 저장이 사라질 수 있습니다. 자동 저장본이 손상되면 기존 내용을 즉시 덮어쓰지 않고 기본 화면과 복구 안내를 보여 줍니다. 정상 JSON을 가져오거나, 확인 후 새 세계 저장을 시작할 수 있습니다.

불러올 때 데이터 버전·자료형·범위·시각·장소·관계 참조를 검사하고 누락된 값을 보완합니다. 기존에 꾸민 도면과 의도적으로 비워 둔 배열은 보존합니다. 더 높은 버전의 세계 파일은 안전하게 거절합니다. 기록은 최근 400개, 기억은 캐릭터당 100개입니다. JSON 가져오기는 15MB까지 지원합니다. 내보낸 파일은 개인정보일 수 있으므로 공개 저장소에 함께 올리지 않는 것을 권합니다.

## 10. 코드를 수정할 때

| 바꿀 항목 | 파일 |
| --- | --- |
| 최대 캐릭터 수 | `src/types.ts`의 `MAX_CHARACTERS` 한 곳 |
| 데이터 구조와 허용 행동 | `src/types.ts` |
| 초기 캐릭터·일정 | `src/defaults.ts` |
| 다섯 장소의 기본 방·벽·문·가구 배치 | `src/plans.ts` |
| 가구 종류별 초기 크기·분류 | `src/planSpec.ts` |
| 가구·구조 SVG 도형과 비율 보존 | `src/components/FurnitureArt.tsx` |
| 식탁·침대·의자 자리 배정과 생활 목적지 | `src/life.ts` |
| 학교 나이 기준과 장소 순서 | `src/schools.ts` |
| 전체 전개도와 편집 조작 | `src/components/FloorPlan.tsx` |
| 데이터 검증·호환·입출력 | `src/storage.ts` |
| 일정 판단·대사·사건 | `src/simulation.ts` |
| 캐릭터 이동 속도·휴식·목적지 | `src/motion.ts` |
| 벽·가구 충돌과 문 경로 탐색 | `src/navigation.ts` |
| 메인 재생·저장·창 동기화 | `src/App.tsx` |
| 캐릭터 편집·관계·세계·관찰·팝업 | `src/components/` |
| 기본 폼·공통 스타일 | `src/styles.css` |
| 기본 크림·베이지 테마 | `src/theme.css` |
| 1200×800 관찰 배치·새 전개도·편집 창 스타일 | `src/workspace.css` |
| Pages 주소·Electron 창·IPC | `windows-app/main.cjs` |
| 제한된 렌더러 연결 | `windows-app/preload.cjs` |

`MAX_CHARACTERS`는 2 이상으로 설정하세요. 인원을 크게 늘리면 전개도 캐릭터 배치와 메모리 사용량도 조정하세요. 코드 정리는 `npm run format`으로 실행합니다. 외부 웹 폰트·이미지·CDN·대사 API를 사용하지 않으며 production CSP는 외부 연결을 막습니다.

## 11. 검증 범위

이 프로젝트를 작성한 Linux 환경에서 `npm run build`의 TypeScript 검사와 Vite 프로덕션 빌드, `npm test`의 일정·대사·데이터 호환 검사를 실행했습니다. 브라우저에서 관찰 화면, 대화·사건, 재생·정지 및 팝업 데이터 반영을 확인했습니다. 1.4에서는 1200×800 테스트 프레임에서 전체 페이지 스크롤 없음, 주의사항 팝업과 포함 글꼴 로드, PNG 안내문 두 줄 왼쪽 정렬, 베란다 배치와 경로, PC 전용 조작과 버튼 제거를 확인했습니다.  가구 추가·드래그 이동·손잡이 크기 조절·삭제와 대학교 장면도 직접 확인했습니다. 저장 호환·편집 속성·대학교 일정·벽과 문 경로 탐색 등을 포함한 자동 테스트 43개가 통과했습니다. 재생 중의 보행, 정지 후의 좌표 고정, 메인 화면과 팝업의 좌표 일치도 확인했습니다. Windows 전용 EXE의 실제 패키징과 운영체제의 투명 창·항상 위 동작은 이 Linux 환경에서 실행하지 않았습니다. 포함된 Windows Actions 또는 Windows PC에서 빌드해 최종 확인하세요. GitHub 저장소 업로드 및 Pages 게시 자체는 이 파일 생성 작업에서 실행하지 않았습니다.

## 12. 생성 파일 목록

아래 파일을 포함합니다. `node_modules`와 Windows 빌드 결과는 ZIP에 넣지 않았습니다. `dist`에는 바로 호스팅할 수 있는 정적 빌드 결과가 들어 있습니다. 파일을 수정한 뒤에는 `npm run build`로 갱신하세요.

- `.github/workflows/build-windows-app.yml`
- `.github/workflows/deploy-pages.yml`
- `.gitignore`
- `README.md`
- `dist/KOTRA-WORDMARK-NOTICE.txt`
- `dist/assets/index-BUsCdkmU.css`
- `dist/assets/index-D8NOkv_W.js`
- `dist/characters/placeholder.png`
- `dist/doran-wordmark.svg`
- `dist/favicon.ico`
- `dist/fonts/SUIT-LICENSE.txt`
- `dist/fonts/SUIT-Variable.woff2`
- `dist/icon.png`
- `dist/index.html`
- `dist/titles/add.svg`
- `dist/titles/autosave.svg`
- `dist/titles/character-edit.svg`
- `dist/titles/characters.svg`
- `dist/titles/child.svg`
- `dist/titles/event.svg`
- `dist/titles/history-nav.svg`
- `dist/titles/home.svg`
- `dist/titles/lines-memory.svg`
- `dist/titles/memory.svg`
- `dist/titles/observe.svg`
- `dist/titles/office.svg`
- `dist/titles/past-character.svg`
- `dist/titles/places.svg`
- `dist/titles/plan-edit.svg`
- `dist/titles/plan.svg`
- `dist/titles/relation-nav.svg`
- `dist/titles/relationship-edit.svg`
- `dist/titles/relationships.svg`
- `dist/titles/schedule.svg`
- `dist/titles/school.svg`
- `dist/titles/selection.svg`
- `dist/titles/square.svg`
- `dist/titles/start.svg`
- `dist/titles/university.svg`
- `dist/titles/world.svg`
- `index.html`
- `package-lock.json`
- `package.json`
- `public/KOTRA-WORDMARK-NOTICE.txt`
- `public/characters/placeholder.png`
- `public/doran-wordmark.svg`
- `public/favicon.ico`
- `public/fonts/SUIT-LICENSE.txt`
- `public/fonts/SUIT-Variable.woff2`
- `public/icon.png`
- `public/titles/add.svg`
- `public/titles/autosave.svg`
- `public/titles/character-edit.svg`
- `public/titles/characters.svg`
- `public/titles/child.svg`
- `public/titles/event.svg`
- `public/titles/history-nav.svg`
- `public/titles/home.svg`
- `public/titles/lines-memory.svg`
- `public/titles/memory.svg`
- `public/titles/observe.svg`
- `public/titles/office.svg`
- `public/titles/past-character.svg`
- `public/titles/places.svg`
- `public/titles/plan-edit.svg`
- `public/titles/plan.svg`
- `public/titles/relation-nav.svg`
- `public/titles/relationship-edit.svg`
- `public/titles/relationships.svg`
- `public/titles/schedule.svg`
- `public/titles/school.svg`
- `public/titles/selection.svg`
- `public/titles/square.svg`
- `public/titles/start.svg`
- `public/titles/university.svg`
- `public/titles/world.svg`
- `scripts/render-kotra-titles.py`
- `src/App.tsx`
- `src/components/CharacterEditor.tsx`
- `src/components/Fields.tsx`
- `src/components/FloorPlan.tsx`
- `src/components/FurnitureArt.tsx`
- `src/components/KotraText.tsx`
- `src/components/LegacyFurnitureArt.tsx`
- `src/components/Observation.tsx`
- `src/components/PopupView.tsx`
- `src/components/RelationshipEditor.tsx`
- `src/components/StartNotice.tsx`
- `src/components/TimeControls.tsx`
- `src/components/WorldSettings.tsx`
- `src/defaults.ts`
- `src/dialogue.ts`
- `src/kotra-titles.json`
- `src/layoutUpgrade.ts`
- `src/life.ts`
- `src/main.tsx`
- `src/motion.ts`
- `src/navigation.ts`
- `src/planSpec.ts`
- `src/plans.ts`
- `src/schools.ts`
- `src/simulation.ts`
- `src/storage.ts`
- `src/styles.css`
- `src/theme.css`
- `src/types.ts`
- `src/typography.css`
- `src/version.ts`
- `src/workspace.css`
- `tests/balcony.test.ts`
- `tests/doors.test.ts`
- `tests/fixtures/home-v3.json`
- `tests/home-update.test.ts`
- `tests/life.test.ts`
- `tests/navigation.test.ts`
- `tests/refinements.test.ts`
- `tests/simulation.test.ts`
- `tsconfig.json`
- `vite.config.ts`
- `windows-app/build/icon.ico`
- `windows-app/build/icon.png`
- `windows-app/main.cjs`
- `windows-app/package-lock.json`
- `windows-app/package.json`
- `windows-app/preload.cjs`
