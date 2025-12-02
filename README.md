# 건강 정보 기반 맞춤형 영양제 추천 웹 애플리케이션

건강 정보를 입력받아 LLM을 활용한 맞춤형 영양제 추천을 제공하는 웹 애플리케이션입니다.

## 주요 기능

1. **건강 정보 입력**: 나이, 성별, 체중, 복용 약물, 건강 고민, 생활 패턴 입력
2. **LLM 기반 추천**: 외부 API를 활용한 맞춤형 영양제 추천
3. **약물 상호작용 체크**: 복용 중인 약물과 영양제 간 상호작용 분석
4. **에러 처리 및 재시도**: 네트워크 오류, API 할당량 초과 등 다양한 에러 상황 처리

## 기술 스택

### 프론트엔드

- **React**: 18.3.1
- **TypeScript**: ^5.3.3
- **Vite**: ^5.4.2
- **React Router**: ^6.28.0

### 상태 관리 및 폼

- **React Hook Form**: ^7.53.0
- **@hookform/resolvers**: ^3.9.0

### 검증

- **Zod**: ^3.23.8

## 프로젝트 구조

```
algo-web/
├── api/                     # Vercel Serverless Functions (선택사항)
│   ├── recommendation.ts
│   └── health.ts
├── src/                     # 프론트엔드 (클라이언트)
│   ├── features/
│   ├── libs/
│   └── navigation/
└── README.md
```

## 설치 및 실행

### 사전 요구사항

- Node.js 22.x (권장)
- npm 또는 yarn
- 추천 API 서버 (기본값: `http://localhost:8000`)

### 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드가 `http://localhost:3000`에서 실행되며, 추천 API 서버를 직접 호출합니다.

### 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```bash
# .env
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK_API=false
```

**중요**:

- 클라이언트 환경 변수는 `VITE_` 접두사가 필요합니다.
- `.env` 파일은 Git에 커밋하지 마세요.
- `VITE_API_BASE_URL`은 추천 API 서버의 기본 URL입니다 (기본값: `http://localhost:8000`).

### Mock 모드 사용

개발 중이거나 API 서버가 없는 경우 Mock 모드를 사용할 수 있습니다:

```bash
# .env
VITE_USE_MOCK_API=true
```

Mock 모드에서는 실제 API 호출 없이 미리 정의된 추천 결과를 반환합니다.

## API 형식

추천 API는 다음 형식으로 호출됩니다:

**Request:**

```json
POST {VITE_API_BASE_URL}/health/recommend
Content-Type: application/json

{
  "profile": {
    "age": 35,
    "gender": "male",
    "weight": 70.5,
    "smoking": false,
    "medications": "아스피린",
    "concerns": ["피로", "면역력"],
    "lifestyle": ["운동", "야근"]
  }
}
```

**Response:**

```json
{
  "result": "{\"supplements\": [...], \"summary\": \"...\"}",
  "model_id": "...",
  "region": "..."
}
```

`result` 필드는 JSON 문자열로 파싱되어 사용됩니다.

## 배포

### Vercel 배포 (권장)

1. [Vercel](https://vercel.com)에 프로젝트 연결
2. 환경 변수 설정:
   ```
   VITE_API_BASE_URL=https://your-api-server.com
   VITE_USE_MOCK_API=false
   ```
3. 배포 완료!

Vercel은 자동으로:

- 프론트엔드를 정적 사이트로 배포
- 환경 변수를 빌드 시 주입

## 보안

### ⚠️ 주의사항

- API 서버 URL은 클라이언트 환경 변수로 관리됩니다.
- 프로덕션 환경에서는 HTTPS를 사용하는 API 서버를 설정하세요.
- CORS 설정을 확인하여 허용된 도메인에서만 API를 호출하도록 설정하세요.

## React Native에서 React로 변환

이 프로젝트는 원래 React Native로 개발되었으며, 웹 환경을 위해 React로 변환되었습니다.

### 주요 변경사항

1. **네비게이션**: React Navigation → React Router
2. **UI 컴포넌트**: React Native 컴포넌트 → React DOM 컴포넌트
3. **스타일링**: StyleSheet → CSS Modules
4. **환경 변수**: EXPO*PUBLIC* → VITE\_ (클라이언트)
5. **빌드 도구**: Expo → Vite
6. **API 호출**: 백엔드 프록시 → 클라이언트에서 직접 호출

## 라이선스

Private
