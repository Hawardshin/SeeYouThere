// 좌표 타입
export interface Coordinates {
  lat: number;
  lng: number;
}

// 장소 검색 결과 타입
export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  coordinates: Coordinates;
}

// Google Places Autocomplete API - 장소 검색 (서버 API Route 사용)
export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const response = await fetch(
      `/api/places/autocomplete?input=${encodeURIComponent(query)}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Places API 오류:', errorData);
      return [];
    }

    const data = await response.json();

    if (data.status === 'OK' && data.predictions) {
      // Place Details를 가져와서 좌표 포함
      const results = await Promise.all(
        data.predictions.slice(0, 5).map(async (prediction: { place_id: string }) => {
          const details = await getPlaceDetails(prediction.place_id);
          return details;
        })
      );
      
      return results.filter((r): r is PlaceResult => r !== null);
    }

    if (data.status === 'ZERO_RESULTS') {
      return [];
    }

    console.error('Places API 상태:', data.status, data.error_message);
    return [];
  } catch (error) {
    console.error('장소 검색 오류:', error);
    return [];
  }
}

// Google Place Details API - 장소 상세 정보 (좌표 포함) (서버 API Route 사용)
export async function getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
  try {
    const response = await fetch(
      `/api/places/details?placeId=${placeId}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Place Details API 오류:', errorData);
      return null;
    }

    const data = await response.json();

    if (data.status === 'OK' && data.result) {
      const place = data.result;
      const result: PlaceResult = {
        placeId,
        name: place.name,
        address: place.formatted_address,
        coordinates: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        },
      };
      
      console.log('[getPlaceDetails] 장소 상세 정보:', result);
      return result;
    }

    console.error('Place Details API 상태:', data.status, data.error_message);
    return null;
  } catch (error) {
    console.error('장소 상세 정보 오류:', error);
    return null;
  }
}

// Google Geocoding API - 주소를 좌표로 변환 (서버 API Route 사용)
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  try {
    const response = await fetch(
      `/api/maps/geocode?address=${encodeURIComponent(address)}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Geocoding API 오류:', errorData);
      return null;
    }

    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
      };
    }

    console.error('Geocoding API 상태:', data.status, data.error_message);
    return null;
  } catch (error) {
    console.error('Geocoding 오류:', error);
    return null;
  }
}

// Google Routes API v2 - 대중교통 소요시간 계산 (서버 API Route 사용)
// 항상 대중교통(버스+지하철+걷기) 경로 중 가장 빠른 경로를 제공
export async function getTravelTime(
  origin: Coordinates,
  destination: Coordinates,
  mode: 'DRIVE' | 'TRANSIT' | 'WALK' | 'BICYCLE' | 'TWO_WHEELER' = 'TRANSIT',
  departureTime?: string // HH:mm 형식의 시간
): Promise<{ duration: number; distance: number }> {
  try {
    // 좌표 유효성 검사
    if (!origin || !destination ||
        typeof origin.lat !== 'number' || typeof origin.lng !== 'number' ||
        typeof destination.lat !== 'number' || typeof destination.lng !== 'number' ||
        isNaN(origin.lat) || isNaN(origin.lng) ||
        isNaN(destination.lat) || isNaN(destination.lng)) {
      console.error('[getTravelTime] 유효하지 않은 좌표:', { origin, destination });
      return calculateDummyTravelTime(origin, destination);
    }
    
    // 출발 시간을 Unix timestamp로 변환
    let departureTimestamp: string | undefined;
    if (departureTime && mode === 'TRANSIT') {
      const [hours, minutes] = departureTime.split(':').map(Number);
      const now = new Date();
      const departureDate = new Date(now);
      departureDate.setHours(hours, minutes, 0, 0);
      
      // 과거 시간이면 내일로 설정
      if (departureDate < now) {
        departureDate.setDate(departureDate.getDate() + 1);
      }
      
      departureTimestamp = Math.floor(departureDate.getTime() / 1000).toString();
      console.log(`[getTravelTime] 출발 시간: ${departureTime} → ${departureDate.toLocaleString('ko-KR')}`);
    }
    
    console.log(`[getTravelTime] Routes API v2 요청:`, { 
      origin, 
      destination, 
      mode,
      departureTime: departureTimestamp ? new Date(parseInt(departureTimestamp) * 1000).toLocaleString('ko-KR') : 'now'
    });
    
    // Routes API v2 요청 본문
    const requestBody = {
      origins: [origin],
      destinations: [destination],
      mode,
      departureTime: departureTimestamp
    };
    
    const response = await fetch('/api/maps/distancematrix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Routes API v2 오류:', errorData);
      
      // TRANSIT 모드 실패 시 DRIVE로 재시도
      if (mode === 'TRANSIT') {
        console.warn('⚠️ 대중교통 경로 실패, 자동차 경로로 재시도...');
        const fallbackResponse = await fetch('/api/maps/distancematrix', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            origins: [origin],
            destinations: [destination],
            mode: 'DRIVE'
          }),
          cache: 'no-store'
        });
        
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          if (data.status === 'OK' && data.rows && data.rows.length > 0) {
            const element = data.rows[0].elements[0];
            if (element.status === 'OK') {
              const duration = Math.round(element.duration.value / 60);
              // 대중교통 대신 자동차 시간 사용 시 1.3배 가중치
              const adjustedDuration = Math.round(duration * 1.3);
              console.log(`✅ 자동차 경로로 성공 (조정됨): ${duration}분 → ${adjustedDuration}분`);
              return {
                duration: adjustedDuration,
                distance: element.distance.value,
              };
            }
          }
        }
      }
      
      console.warn('⚠️ API 실패, 직선 거리 기반 추정치 사용');
      return calculateDummyTravelTime(origin, destination);
    }

    const data = await response.json();

    if (data.status === 'OK' && data.rows && data.rows.length > 0) {
      const element = data.rows[0].elements[0];
      
      if (element.status === 'OK') {
        const duration = Math.round(element.duration.value / 60);
        console.log(`✅ ${mode} 경로 성공 (Routes API v2):`, {
          duration: element.duration.text,
          distance: element.distance.text,
          duration_minutes: duration
        });
        return {
          duration: duration, // 초를 분으로 변환
          distance: element.distance.value, // 미터
        };
      }
      
      console.warn(`⚠️ Routes API element 상태: ${element.status}`);
      
      // TRANSIT 실패 시 DRIVE로 재시도 (두 번째 시도)
      if (mode === 'TRANSIT' && element.status !== 'OK') {
        console.warn('⚠️ 대중교통 경로 불가 (element 상태), 자동차 경로로 재시도...');
        const fallbackResponse = await fetch('/api/maps/distancematrix', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            origins: [origin],
            destinations: [destination],
            mode: 'DRIVE'
          }),
          cache: 'no-store'
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.status === 'OK' && fallbackData.rows && fallbackData.rows.length > 0) {
            const fallbackElement = fallbackData.rows[0].elements[0];
            if (fallbackElement.status === 'OK') {
              const duration = Math.round(fallbackElement.duration.value / 60);
              const adjustedDuration = Math.round(duration * 1.3);
              console.log(`✅ 자동차 경로로 성공 (조정됨): ${duration}분 → ${adjustedDuration}분`);
              return {
                duration: adjustedDuration,
                distance: fallbackElement.distance.value,
              };
            }
          }
        }
      }
    } else {
      console.warn(`⚠️ Routes API 상태: ${data.status}`, data.error_message);
    }

    // 모든 시도 실패 시 더미 데이터
    console.warn('⚠️ 모든 경로 탐색 실패, 직선 거리 기반 추정치 사용');
    return calculateDummyTravelTime(origin, destination);
  } catch (error) {
    console.error('❌ 거리/시간 계산 오류:', error);
    return calculateDummyTravelTime(origin, destination);
  }
}

// 거리 기반 더미 소요시간 계산 (API 실패 시 대체용)
export function calculateDummyTravelTime(
  startCoords: Coordinates,
  endCoords: Coordinates
): { duration: number; distance: number } {
  // 좌표 유효성 검사
  if (!startCoords || !endCoords || 
      typeof startCoords.lat !== 'number' || typeof startCoords.lng !== 'number' ||
      typeof endCoords.lat !== 'number' || typeof endCoords.lng !== 'number' ||
      isNaN(startCoords.lat) || isNaN(startCoords.lng) ||
      isNaN(endCoords.lat) || isNaN(endCoords.lng)) {
    console.error('[calculateDummyTravelTime] 유효하지 않은 좌표:', { startCoords, endCoords });
    return {
      duration: 0,
      distance: 0,
    };
  }

  // 하버사인 공식을 사용한 거리 계산
  const R = 6371; // 지구 반지름 (km)
  const dLat = toRad(endCoords.lat - startCoords.lat);
  const dLng = toRad(endCoords.lng - startCoords.lng);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(startCoords.lat)) *
    Math.cos(toRad(endCoords.lat)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightDistance = R * c; // km 단위

  // 실제 도로 거리는 직선 거리의 약 1.3배 (서울 기준)
  const roadDistance = straightDistance * 1.3;
  const distanceInMeters = Math.round(roadDistance * 1000);

  // 서울 대중교통 평균 속도 고려:
  // - 5km 이하: 지하철 환승 포함 평균 25km/h
  // - 5-15km: 지하철 직통 평균 35km/h  
  // - 15km 이상: 장거리 평균 40km/h
  let avgSpeed = 25;
  if (roadDistance > 15) {
    avgSpeed = 40;
  } else if (roadDistance > 5) {
    avgSpeed = 35;
  }

  // 시간 계산 (분 단위)
  let duration = Math.round((roadDistance / avgSpeed) * 60);
  
  // 최소 시간 설정:
  // - 1km 이하: 최소 5분 (도보 + 대기)
  // - 1-3km: 최소 10분
  // - 3km 이상: 계산된 시간 사용
  if (roadDistance < 1) {
    duration = Math.max(duration, 5);
  } else if (roadDistance < 3) {
    duration = Math.max(duration, 10);
  }

  console.log('[calculateDummyTravelTime] 📍 추정 결과:', {
    직선거리: `${straightDistance.toFixed(2)}km`,
    도로거리: `${roadDistance.toFixed(2)}km`,
    평균속도: `${avgSpeed}km/h`,
    소요시간: `${duration}분`,
  });

  return {
    duration: duration,
    distance: distanceInMeters,
  };
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

