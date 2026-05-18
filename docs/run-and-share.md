# UI 실행 및 공유 방법

## 로컬 실행

이 프로젝트는 Next.js가 아니라 정적 HTML/CSS/JS 웹앱입니다. `src/main.js`가 `src/components/app.js`를 불러와 UI를 렌더링하고, `scripts/dev-server.mjs`가 프로젝트 루트를 정적 파일로 서빙합니다.

```powershell
cd C:\Users\user\Documents\CheonanAsan-LifeArea
node scripts\dev-server.mjs
```

기본 주소는 다음과 같습니다.

```text
http://localhost:4173
```

포트를 바꾸려면 `PORT` 환경변수를 지정합니다.

```powershell
$env:PORT=8010
node scripts\dev-server.mjs
```

`package.json` 기준 실행 명령은 `npm run dev`입니다. 로컬에서 `npm`이 PATH에 잡혀 있다면 아래 명령도 같은 개발 서버를 실행합니다.

```powershell
npm run dev
```

기존 보조 실행 스크립트도 유지되어 있습니다. 이 스크립트들은 Anaconda의 `alldam` 환경에서 Python 정적 서버를 실행하며, 기본 포트는 `8000`입니다.

```powershell
.\scripts\start-ui.bat
powershell -ExecutionPolicy Bypass -File .\scripts\start-ui.ps1
```

## 테스트 실행

`package.json` 기준 테스트 명령은 다음과 같습니다.

```powershell
npm test
```

`npm`을 사용할 수 없는 환경에서는 Node 테스트 러너를 직접 실행할 수 있습니다.

```powershell
node --test --test-isolation=none tests/*.test.mjs
```

정적 앱 구성 파일 검증은 다음 명령으로 실행합니다.

```powershell
node scripts\verify-static-app.mjs
```

## 환경변수와 키 관리

`.env.local`은 실제 API 키를 넣는 로컬 전용 파일이며 Git에 올리지 않습니다. 현재 `.gitignore`에서 `.env.local`, `.env*.local`, `/data/`, API key 텍스트 파일을 제외합니다.

`.env.example`은 팀원 공유용 예시 파일입니다. 실제 키를 넣지 말고 필요한 변수 이름만 비워 둡니다.

이 프로젝트는 Next.js가 아니므로 `NEXT_PUBLIC_*` 환경변수가 자동으로 브라우저 코드에 주입되지 않습니다. 현재 `scripts/dev-server.mjs`는 `PORT`만 읽고, 네이버 지도 API 키나 Directions API 호출은 아직 처리하지 않습니다.

Client Secret은 프론트엔드 코드에 포함하면 안 됩니다. 이후 네이버 Directions 5 API처럼 secret이 필요한 호출은 별도 서버 또는 안전한 백엔드 경유 방식으로 붙입니다.

## 데이터 위치

루트의 `data/` 폴더는 Git에서 제외되어 원본/전처리 작업 파일 보관용으로 사용합니다.

웹앱에서 직접 import해서 사용할 공개 데이터는 `src/data/` 아래에 둡니다. 예를 들어 읍면동 중심좌표 데이터는 `src/data/cheonanAsanEmdCenters.js`에서 관리합니다.

## 공유 주의

`http://localhost:4173` 또는 `http://localhost:8000` 같은 주소는 현재 컴퓨터 안에서만 열리는 로컬 주소입니다. 다른 사람에게 공유하려면 GitHub, 압축 파일, 사내 공유 폴더, GitHub Pages, Netlify, Vercel 같은 정적 호스팅 방식을 사용해야 합니다.
