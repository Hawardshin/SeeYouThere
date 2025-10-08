import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ 
      error: 'API key not configured',
      status: 'FAILED'
    }, { status: 500 });
  }

  // 서울 명동 -> 강남역 테스트
  const testOrigin = '37.5665,126.9780'; // 명동
  const testDestination = '37.4979,127.0276'; // 강남역

  try {
    // Transit (대중교통) 테스트
    const transitParams = new URLSearchParams({
      origins: testOrigin,
      destinations: testDestination,
      mode: 'transit',
      departure_time: 'now',
      transit_mode: 'subway|bus|train',
      transit_routing_preference: 'fewer_transfers',
      language: 'ko',
      region: 'KR',
      units: 'metric',
      key: apiKey,
    });

    const transitUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?${transitParams.toString()}`;
    const transitResponse = await fetch(transitUrl);
    const transitData = await transitResponse.json();

    console.log('[API Test] Transit 응답:', JSON.stringify(transitData, null, 2));

    // Driving (자동차) 테스트
    const drivingParams = new URLSearchParams({
      origins: testOrigin,
      destinations: testDestination,
      mode: 'driving',
      language: 'ko',
      region: 'KR',
      units: 'metric',
      key: apiKey,
    });

    const drivingUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?${drivingParams.toString()}`;
    const drivingResponse = await fetch(drivingUrl);
    const drivingData = await drivingResponse.json();

    console.log('[API Test] Driving 응답:', JSON.stringify(drivingData, null, 2));

    // 결과 분석
    const transitOK = transitData.status === 'OK' && 
                     transitData.rows?.[0]?.elements?.[0]?.status === 'OK';
    const drivingOK = drivingData.status === 'OK' && 
                     drivingData.rows?.[0]?.elements?.[0]?.status === 'OK';

    return NextResponse.json({
      message: 'Distance Matrix API 테스트 결과',
      testRoute: '명동 → 강남역',
      results: {
        transit: {
          status: transitData.status,
          elementStatus: transitData.rows?.[0]?.elements?.[0]?.status,
          success: transitOK,
          duration: transitData.rows?.[0]?.elements?.[0]?.duration?.text,
          distance: transitData.rows?.[0]?.elements?.[0]?.distance?.text,
          error: transitData.error_message,
        },
        driving: {
          status: drivingData.status,
          elementStatus: drivingData.rows?.[0]?.elements?.[0]?.status,
          success: drivingOK,
          duration: drivingData.rows?.[0]?.elements?.[0]?.duration?.text,
          distance: drivingData.rows?.[0]?.elements?.[0]?.distance?.text,
          error: drivingData.error_message,
        },
      },
      apiKeyConfigured: true,
      recommendation: !transitOK && !drivingOK 
        ? '⚠️ Distance Matrix API가 활성화되지 않았거나 API 키 권한이 없습니다. Google Cloud Console에서 확인하세요.'
        : transitOK 
        ? '✅ 모든 테스트 성공! API가 정상 작동합니다.'
        : drivingOK
        ? '⚠️ 대중교통은 실패했지만 자동차 경로는 성공. Transit 모드 문제일 수 있습니다.'
        : '❌ API 오류. 설정을 확인하세요.',
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      apiKeyConfigured: true,
    }, { status: 500 });
  }
}
