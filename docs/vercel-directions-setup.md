# Vercel 자동차 길찾기 설정

자동차 통근시간은 Vercel 서버리스 API가 네이버 Directions 5를 호출해 성공한 값만 사용한다. 실패하면 위치 기반 가상 자동차 시간을 대신 표시하지 않는다.

## 필수 환경변수

Vercel Project Settings의 Environment Variables에 아래 값을 등록한다.

```text
NAVER_MAP_CLIENT_ID=
NAVER_MAP_CLIENT_SECRET=
NAVER_DIRECTIONS_BASE_URL=https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving
```

- Production 환경에 등록해야 실제 배포 주소에서 동작한다.
- Preview, Development에서도 확인하려면 해당 환경에도 같은 이름으로 등록한다.
- 환경변수를 바꾼 뒤에는 재배포가 필요하다.
- Client Secret은 `public-config.js`나 프론트엔드 코드에 넣지 않는다.

## 네이버 콘솔 확인 항목

- Maps Application에서 Dynamic Map과 Directions 5가 선택되어 있어야 한다.
- Web 서비스 URL에 Vercel 도메인을 등록한다.
- 예시: `http://alldam-project.vercel.app`
- 도메인을 추가하거나 상품을 변경한 뒤에는 Vercel을 다시 배포해 확인한다.

## 실패 원인 확인

프론트 화면에는 안전한 오류 코드만 표시한다. Secret 값이나 전체 Client ID는 표시하지 않는다.

- `MISSING_NAVER_ENV`: Vercel 환경변수가 누락되었거나 재배포 전이다.
- `NAVER_DIRECTIONS_UNAUTHORIZED`: 인증 정보가 올바르지 않다.
- `NAVER_DIRECTIONS_FORBIDDEN`: Directions 5 권한 또는 등록 도메인을 확인해야 한다.
- `NAVER_DIRECTIONS_RATE_LIMITED`: 요청 한도를 초과했다.
- `NAVER_DIRECTIONS_NO_ROUTE`: 네이버가 경로를 찾지 못했다.
- `NAVER_DIRECTIONS_PARSE_FAILED`: 네이버 응답 구조에서 통근시간을 읽지 못했다.
- `NETWORK_ERROR`: 서버리스 함수에서 네이버 API 호출에 실패했다.

GitHub Pages에는 서버리스 API가 없으므로 자동차 길찾기는 실패 안내로 표시될 수 있다. 도보와 대중교통은 현재 거리 기반 추정값을 유지한다.
