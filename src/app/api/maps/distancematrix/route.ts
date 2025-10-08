import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const origins = searchParams.get('origins');
  const destinations = searchParams.get('destinations');
  const mode = searchParams.get('mode') || 'transit';
  const departureTime = searchParams.get('departureTime'); // 출발 시간 추가

  if (!origins || !destinations) {
    return NextResponse.json({ error: 'origins and destinations parameters are required' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: 'Server API key not configured' }, { status: 500 });
  }

  try {
    // Distance Matrix API URL 구성 (한국 대중교통 지원)
    const params = new URLSearchParams({
      origins: origins,
      destinations: destinations,
      mode: mode,
      key: apiKey,
      language: 'ko',
      region: 'KR',
      units: 'metric',
    });

    // 대중교통 모드일 때 출발 시간 설정
    if (mode === 'transit') {
      if (departureTime) {
        // 사용자가 설정한 시간 사용 (Unix timestamp)
        params.append('departure_time', departureTime);
      } else {
        // 기본값: 현재 시간
        params.append('departure_time', 'now');
      }
      // 한국 대중교통 수단 우선순위: 지하철 > 버스 > 기차
      params.append('transit_mode', 'subway|bus|train|rail');
      // 대중교통 경로 선호: 최소 환승
      params.append('transit_routing_preference', 'fewer_transfers');
    }

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`;
    
    console.log('[Distance Matrix] 요청:', { 
      origins, 
      destinations, 
      mode,
      departure_time: mode === 'transit' ? (departureTime || 'now') : undefined,
      transit_routing: mode === 'transit' ? 'fewer_transfers' : undefined
    });

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Distance Matrix] HTTP 오류:', response.status, errorText);
      return NextResponse.json(
        { error: `Distance Matrix API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // 상세 응답 로깅
    console.log('[Distance Matrix] 응답 상태:', data.status);
    
    if (data.rows && data.rows[0] && data.rows[0].elements && data.rows[0].elements[0]) {
      const element = data.rows[0].elements[0];
      console.log('[Distance Matrix] Element 상태:', element.status);
      
      if (element.status !== 'OK') {
        console.error('[Distance Matrix] Element 오류 상세:', {
          status: element.status,
          origins,
          destinations,
          mode,
          origin_addresses: data.origin_addresses,
          destination_addresses: data.destination_addresses,
        });
      } else {
        console.log('[Distance Matrix] ✅ 성공:', {
          duration: element.duration?.text,
          distance: element.distance?.text,
          duration_value: element.duration?.value,
          distance_value: element.distance?.value,
          duration_in_traffic: element.duration_in_traffic?.text,
        });
      }
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Distance Matrix] 예외 발생:', error);
    return NextResponse.json(
      { error: 'Failed to calculate distance', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
