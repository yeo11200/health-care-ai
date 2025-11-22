# 건강 정보 기반 맞춤형 영양제 추천 웹 애플리케이션

건강 정보를 입력받아 LLM을 활용한 맞춤형 영양제 추천을 제공하는 웹 애플리케이션입니다.

## 🔒 보안 개선

**이제 API 키는 백엔드 서버에서만 관리되며, 클라이언트에 노출되지 않습니다!**

- ✅ API 키는 서버 측 환경 변수로 관리
- ✅ 클라이언트는 백엔드 프록시를 통해 API 호출
- ✅ 개발자 도구에서 API 키 노출 없음

## 주요 기능

1. **건강 정보 입력**: 나이, 성별, 체중, 복용 약물, 건강 고민, 생활 패턴 입력
2. **LLM 기반 추천**: OpenAI API를 활용한 맞춤형 영양제 추천
3. **약물 상호작용 체크**: 복용 중인 약물과 영양제 간 상호작용 분석
4. **에러 처리 및 재시도**: 네트워크 오류, API 할당량 초과 등 다양한 에러 상황 처리

## 기술 스택

### 프론트엔드

- **React**: 18.3.1
- **TypeScript**: ^5.3.3
- **Vite**: ^5.4.2
- **React Router**: ^6.28.0

### 백엔드

- **Vercel Serverless Functions**: 프로덕션 환경
- **Express**: 로컬 개발 환경
- **Node.js**: 22.x
- **OpenAI**: ^6.9.1

### 상태 관리 및 폼

- **React Hook Form**: ^7.53.0
- **@hookform/resolvers**: ^3.9.0

### 검증

- **Zod**: ^3.23.8

## 프로젝트 구조

```
algo-health-care/
├── api/                     # Vercel Serverless Functions (프로덕션)
│   ├── recommendation.ts
│   └── health.ts
├── src/                     # 프론트엔드 (클라이언트)
│   ├── features/
│   ├── libs/
│   └── navigation/
├── server/                  # 백엔드 로직 (공유)
│   ├── llmProxy.ts
│   ├── llmPrompt.ts
│   └── llmParser.ts
└── README.md
```

## 배포

### Vercel 배포 (권장)

프론트엔드와 백엔드를 모두 Vercel에 배포할 수 있습니다.

**상세 배포 가이드**: [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)

#### 빠른 배포

1. [Vercel](https://vercel.com)에 프로젝트 연결
2. 환경 변수 설정:
   ```
   OPENAI_API_KEY=your_api_key_here
   OPENAI_MODEL=gpt-4o-mini
   USE_MOCK_API=false
   ```
3. 배포 완료!

Vercel은 자동으로:

- 프론트엔드를 정적 사이트로 배포
- `/api` 폴더의 함수를 Serverless Functions로 배포
- 환경 변수를 서버에만 노출

## 설치 및 실행

### 사전 요구사항

- Node.js 22.x (권장)
- npm 또는 yarn

### 로컬 개발

```bash
# 의존성 설치
npm install
```

#### 방법 1: Vercel Dev Server (권장 - Vercel 환경과 동일)

```bash
# Vercel CLI 설치
npm i -g vercel

# 로컬에서 Vercel 환경 시뮬레이션 (프론트엔드 + 백엔드 동시 실행)
vercel dev
```

이 방법은 프로덕션 환경과 동일하게 작동합니다.

#### 방법 2: 개별 서버 (로컬 개발)

**터미널 1 - 백엔드 서버 실행:**

```bash
cd server
npm install
npm run dev
```

백엔드 서버가 `http://localhost:3001`에서 실행됩니다.

**터미널 2 - 프론트엔드 개발 서버 실행:**

```bash
npm run dev
```

프론트엔드가 `http://localhost:3000`에서 실행되며, 자동으로 백엔드 서버로 요청을 보냅니다.

**프론트엔드 `.env` 설정 (선택사항):**

```bash
# .env (프로젝트 루트)
VITE_API_BASE_URL=http://localhost:3001
```

기본값이 `http://localhost:3001`이므로 설정하지 않아도 작동합니다.

### 환경 변수 설정

#### 백엔드 환경 변수 (로컬 개발 시)

`server/.env` 파일 생성:

```bash
# server/.env
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4o-mini
USE_MOCK_API=false
PORT=3001
```

**중요**:

- 서버 측 환경 변수는 `VITE_` 접두사 **없이** 사용합니다.
- `.env` 파일은 Git에 커밋하지 마세요.

#### Vercel 환경 변수 (프로덕션 배포 시)

Vercel 대시보드 → Settings → Environment Variables:

```
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4o-mini
USE_MOCK_API=false
```

## API 키 설정 방법

### ✅ 안전한 방법 (권장)

1. **로컬 개발**: `server/.env` 파일에 설정
2. **프로덕션**: Vercel 환경 변수에 설정

API 키는 서버에서만 관리되며 클라이언트에 노출되지 않습니다.

### Mock 모드 사용

개발 중이거나 API 키가 없는 경우 Mock 모드를 사용할 수 있습니다:

**백엔드 Mock 모드:**

```bash
# server/.env
USE_MOCK_API=true
```

**프론트엔드 Mock 모드:**

```bash
# .env
VITE_USE_MOCK_API=true
```

Mock 모드에서는 실제 API 호출 없이 미리 정의된 추천 결과를 반환합니다.

## 보안

### ✅ 보안 강화

- ✅ **API 키는 서버에서만 관리** - 클라이언트에 노출되지 않음
- ✅ **백엔드 프록시 서버** - 모든 API 호출이 서버를 통해 이루어짐
- ✅ **환경 변수 분리** - 서버와 클라이언트 환경 변수 분리
- ✅ **CORS 설정** - 필요한 경우 CORS 제한 설정 가능

### ⚠️ 프로덕션 배포 시

1. 환경 변수를 안전하게 관리 (예: Vercel 환경 변수)
2. API 키 사용량 제한 및 모니터링 설정
3. HTTPS 사용
4. Rate limiting 구현 (선택사항)

## React Native에서 React로 변환

이 프로젝트는 원래 React Native로 개발되었으며, 웹 환경을 위해 React로 변환되었습니다.

### 주요 변경사항

1. **네비게이션**: React Navigation → React Router
2. **UI 컴포넌트**: React Native 컴포넌트 → React DOM 컴포넌트
3. **스타일링**: StyleSheet → CSS Modules
4. **환경 변수**: EXPO*PUBLIC* → VITE\_ (클라이언트), 서버는 접두사 없음
5. **빌드 도구**: Expo → Vite
6. **보안 개선**: 백엔드 프록시 서버 추가로 API 키 보호

## 라이선스

Private
