# UI 실행 및 공유 방법

## 로컬에서 실행

Anaconda Prompt에서:

```bat
cd C:\Users\user\Documents\alldam
scripts\start-ui.bat
```

브라우저에서 아래 주소를 연다.

```text
http://localhost:8000
```

PowerShell에서 가장 편한 실행 방법:

```powershell
cd C:\Users\user\Documents\alldam
.\scripts\start-ui.bat
```

`scripts\start-ui.bat`을 더블클릭해도 된다.
일반 PowerShell에서 `conda`가 인식되지 않아도 스크립트가 `C:\Users\user\anaconda3\Scripts\conda.exe`를 직접 사용한다.

PowerShell 스크립트를 꼭 쓰고 싶다면 실행 정책을 한 번만 우회한다.

```powershell
cd C:\Users\user\Documents\alldam
powershell -ExecutionPolicy Bypass -File .\scripts\start-ui.ps1
```

직접 명령으로 실행하려면:

```powershell
cd C:\Users\user\Documents\alldam
& "C:\Users\user\anaconda3\Scripts\conda.exe" run -n alldam python -m http.server 8000
```

포트가 이미 사용 중이면 다른 포트를 지정한다.

```powershell
$env:PORT=8010
.\scripts\start-ui.bat
```

## 로컬 링크 공유 주의

`http://localhost:8000` 같은 `localhost` 주소는 현재 컴퓨터 안에서만 보이는 주소다.
팀원에게 이 링크만 보내면 팀원 PC에서는 열리지 않는다.

팀원에게 공유하려면 아래 중 하나가 필요하다.

- 프로젝트 폴더를 GitHub/압축파일로 공유하고 팀원 PC에서 같은 명령으로 실행
- 같은 와이파이/LAN 안에서 PC IP와 방화벽 설정을 열어 임시 공유
- GitHub Pages, Netlify, Vercel 같은 정적 호스팅에 배포

현재 UI는 정적 HTML/CSS/JS이므로 별도 백엔드 없이 정적 호스팅으로 공유할 수 있다.
