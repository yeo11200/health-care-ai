import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getRecommendation } from './llmProxy.js';
import type { HealthProfile } from '../src/features/intake/intake.types.js';

// 환경 변수 로드
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어
app.use(cors());
app.use(express.json());

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 영양제 추천 API
app.post('/api/recommendation', async (req, res) => {
  try {
    const profile: HealthProfile = req.body;

    // 입력 검증
    if (!profile || !profile.age || !profile.gender || !profile.weight) {
      return res.status(400).json({
        error: '필수 정보가 누락되었습니다.',
      });
    }

    // OpenAI API를 서버에서 호출
    const recommendation = await getRecommendation(profile);

    res.json(recommendation);
  } catch (error: any) {
    console.error('추천 생성 오류:', error);
    
    // 에러 타입에 따라 적절한 상태 코드 반환
    if (error.type === 'timeout') {
      return res.status(504).json({
        type: 'timeout',
        message: error.message || 'API 호출 시간이 초과되었습니다.',
      });
    }

    if (error.type === 'api') {
      return res.status(502).json({
        type: 'api',
        message: error.message || 'API 오류가 발생했습니다.',
      });
    }

    if (error.type === 'network') {
      return res.status(503).json({
        type: 'network',
        message: error.message || '네트워크 연결을 확인해주세요.',
      });
    }

    // 기타 에러
    res.status(500).json({
      type: 'parse',
      message: error.message || '알 수 없는 오류가 발생했습니다.',
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📍 API 엔드포인트: http://localhost:${PORT}/api/recommendation`);
  
  // 환경 변수 확인
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your_api')) {
    console.warn('⚠️  OPENAI_API_KEY가 설정되지 않았거나 예시 값입니다.');
    console.warn('   server/.env 파일에 실제 OPENAI_API_KEY를 설정해주세요.');
    console.warn('   또는 USE_MOCK_API=true로 설정하여 Mock 모드를 사용하세요.');
  }
});

