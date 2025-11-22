# 백엔드 프록시 서버

OpenAI API 키를 안전하게 관리하고 클라이언트로부터 API 요청을 프록시하는 백엔드 서버입니다.

## 🔒 보안 목적

- ✅ API 키는 서버에서만 관리 (클라이언트에 노출되지 않음)
- ✅ 모든 OpenAI API 호출이 서버를 통해 이루어짐
- ✅ 클라이언트는 백엔드 API를 통해 요청

## 설치

```bash
cd server
npm install
```

## 환경 변수 설정

`.env` 파일을 `server/` 디렉토리에 생성:

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4o-mini
USE_MOCK_API=false
PORT=3001
```

**중요**: 
- 서버 측 환경 변수는 `VITE_` 접두사 **없이** 사용합니다.
- `.env` 파일은 Git에 커밋하지 마세요.

## 실행

### 개발 모드

```bash
npm run dev
```

서버가 `http://localhost:3001`에서 실행됩니다.

### 프로덕션 빌드

```bash
npm run build
npm start
```

## API 엔드포인트

### POST `/api/recommendation`

영양제 추천을 요청합니다.

**Request Body:**
```json
{
  "age": 30,
  "gender": "male",
  "weight": 70,
  "medications": "없음",
  "concerns": ["피로", "스트레스"],
  "lifestyle": ["운동_정기적", "수면_양호"],
  "smoking": false
}
```

**Response:**
```json
{
  "supplements": [
    {
      "name": "멜라토닌",
      "dosage": "0.5-3 mg",
      "reason": "...",
      "caution": "..."
    }
  ],
  "summary": "..."
}
```

### GET `/health`

서버 상태 확인 (헬스 체크)

**Response:**
```json
{
  "status": "ok"
}
```

## 환경 변수

- `OPENAI_API_KEY`: OpenAI API 키 (필수)
- `OPENAI_MODEL`: 사용할 모델명 (기본값: `gpt-4o-mini`)
- `USE_MOCK_API`: Mock 모드 사용 여부 (기본값: `false`)
- `PORT`: 서버 포트 (기본값: `3001`)

