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

// Google Distance Matrix API - 교통수단별 소요시간 계산 (서버 API Route 사용)
export async function getTravelTime(
  origin: Coordinates,
  destination: Coordinates,
  mode: 'driving' | 'transit' | 'walking' = 'transit'
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

    const originStr = `${origin.lat},${origin.lng}`;
    const destStr = `${destination.lat},${destination.lng}`;
    
    console.log(`[getTravelTime] 요청:`, { 
      origin: originStr, 
      destination: destStr, 
      mode 
    });
    
    let response = await fetch(
      `/api/maps/distancematrix?origins=${originStr}&destinations=${destStr}&mode=${mode}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Distance Matrix API 오류:', errorData);
      
      // transit 모드 실패 시 driving으로 재시도
      if (mode === 'transit') {
        console.warn('대중교통 경로 실패, 자동차 경로로 재시도...');
        response = await fetch(
          `/api/maps/distancematrix?origins=${originStr}&destinations=${destStr}&mode=driving`,
          { cache: 'no-store' }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'OK' && data.rows && data.rows.length > 0) {
            const element = data.rows[0].elements[0];
            if (element.status === 'OK') {
              console.log(`✅ 자동차 경로로 성공:`, element.duration.text);
              return {
                duration: Math.round(element.duration.value / 60),
                distance: element.distance.value,
              };
            }
          }
        }
      }
      
      console.warn('API 실패, 더미 데이터를 사용합니다.');
      return calculateDummyTravelTime(origin, destination);
    }

    const data = await response.json();

    if (data.status === 'OK' && data.rows && data.rows.length > 0) {
      const element = data.rows[0].elements[0];
      
      if (element.status === 'OK') {
        console.log(`✅ ${mode} 경로 성공:`, element.duration.text, element.distance.text);
        return {
          duration: Math.round(element.duration.value / 60), // 초를 분으로 변환
          distance: element.distance.value, // 미터
        };
      }
      
      console.warn(`Distance Matrix element 상태: ${element.status}`);
      
      // transit 실패 시 driving으로 재시도
      if (mode === 'transit' && element.status !== 'OK') {
        console.warn('대중교통 경로 불가, 자동차 경로로 재시도...');
        const fallbackResponse = await fetch(
          `/api/maps/distancematrix?origins=${originStr}&destinations=${destStr}&mode=driving`,
          { cache: 'no-store' }
        );
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.status === 'OK' && fallbackData.rows && fallbackData.rows.length > 0) {
            const fallbackElement = fallbackData.rows[0].elements[0];
            if (fallbackElement.status === 'OK') {
              console.log(`✅ 자동차 경로로 성공:`, fallbackElement.duration.text);
              return {
                duration: Math.round(fallbackElement.duration.value / 60),
                distance: fallbackElement.distance.value,
              };
            }
          }
        }
      }
    } else {
      console.warn(`Distance Matrix API 상태: ${data.status}`, data.error_message);
    }

    // 모든 시도 실패 시 더미 데이터
    console.warn('모든 경로 탐색 실패, 직선 거리 기반 추정치 사용');
    return calculateDummyTravelTime(origin, destination);
  } catch (error) {
    console.error('거리/시간 계산 오류:', error);
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
  const distance = R * c * 1000; // 미터로 변환

  // 평균 속도로 시간 계산 (대중교통 기준 30km/h)
  const duration = Math.round((distance / 1000 / 30) * 60); // 분 단위

  console.log('[calculateDummyTravelTime] 추정 결과:', {
    from: startCoords,
    to: endCoords,
    duration: `${Math.max(duration, 5)}분`,
    distance: `${(Math.round(distance) / 1000).toFixed(1)}km`,
  });

  return {
    duration: Math.max(duration, 5), // 최소 5분
    distance: Math.round(distance),
  };
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

