import { NextRequest, NextResponse } from 'next/server';

interface LatLng {
  lat: number;
  lng: number;
}

interface RouteMatrixOrigin {
  waypoint: {
    location: {
      latLng: {
        latitude: number;
        longitude: number;
      };
    };
  };
}

interface RouteMatrixDestination {
  waypoint: {
    location: {
      latLng: {
        latitude: number;
        longitude: number;
      };
    };
  };
}

interface TransitPreferences {
  allowedTravelModes: string[];
  routingPreference?: string; // optional로 변경
}

interface RouteMatrixRequestBody {
  origins: RouteMatrixOrigin[];
  destinations: RouteMatrixDestination[];
  travelMode: string;
  regionCode: string;
  languageCode: string;
  units: string;
  departureTime?: string;
  transitPreferences?: TransitPreferences;
}

interface RouteMatrixElement {
  originIndex?: number;
  destinationIndex?: number;
  condition?: string;
  duration?: string;
  distanceMeters?: number;
  status?: {
    message?: string;
  };
}

interface DistanceMatrixElement {
  status: string;
  duration?: {
    value: number;
    text: string;
  };
  distance?: {
    value: number;
    text: string;
  };
}

interface DistanceMatrixResponse {
  status: string;
  origin_addresses: string[];
  destination_addresses: string[];
  rows: {
    elements: DistanceMatrixElement[];
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origins, destinations, mode = 'TRANSIT', departureTime } = body;

    if (!origins || !destinations || !Array.isArray(origins) || !Array.isArray(destinations)) {
      return NextResponse.json({ 
        error: 'origins and destinations arrays are required' 
      }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Server API key not configured' }, { status: 500 });
    }

    // Routes API v2의 computeRouteMatrix 엔드포인트로 변경
    const url = 'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix';
    
    // 출발 시간 설정 (대중교통 모드)
    let departureTimeFormatted;
    if (mode === 'TRANSIT') {
      if (departureTime && departureTime.trim() !== '') {
        // Unix timestamp를 RFC3339 UTC format으로 변환
        const timestamp = parseInt(departureTime);
        if (!isNaN(timestamp) && timestamp > 0) {
          const date = new Date(timestamp * 1000);
          departureTimeFormatted = date.toISOString();
        } else {
          // 현재 시간 사용
          departureTimeFormatted = new Date().toISOString();
        }
      } else {
        // 현재 시간
        departureTimeFormatted = new Date().toISOString();
      }
    }

    // Routes API v2 요청 본문 구성
    const requestBody: RouteMatrixRequestBody = {
      origins: (origins as LatLng[]).map((coord) => ({
        waypoint: {
          location: {
            latLng: {
              latitude: coord.lat,
              longitude: coord.lng
            }
          }
        }
      })),
      destinations: (destinations as LatLng[]).map((coord) => ({
        waypoint: {
          location: {
            latLng: {
              latitude: coord.lat,
              longitude: coord.lng
            }
          }
        }
      })),
      travelMode: mode,
      regionCode: 'KR',
      languageCode: 'ko',
      units: 'METRIC'
    };

    // 대중교통 설정
    if (mode === 'TRANSIT') {
      requestBody.departureTime = departureTimeFormatted;
      requestBody.transitPreferences = {
        // 모든 대중교통 수단 허용 (버스, 지하철, 기차 등)
        allowedTravelModes: ['SUBWAY', 'BUS', 'TRAIN', 'LIGHT_RAIL', 'RAIL']
        // routingPreference를 지정하지 않으면 가장 빠른 경로(최단 시간)를 반환
      };
    }

    console.log('[Routes API v2] 요청:', {
      origins: origins.length,
      destinations: destinations.length,
      mode,
      departureTime: departureTimeFormatted,
      transitPreferences: requestBody.transitPreferences
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'originIndex,destinationIndex,duration,distanceMeters,status,condition,travelAdvisory.transitFare',
        // 서버 사이드 요청에서 Referer 헤더 추가 (HTTP 리퍼러 제한 우회)
        'Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://see-you-there.vercel.app',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Routes API v2] HTTP 오류:', response.status, errorText);
      return NextResponse.json(
        { error: `Routes API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    console.log('[Routes API v2] 응답:', {
      elements: Array.isArray(data) ? data.length : 0,
      sample: Array.isArray(data) && data.length > 0 ? data[0] : null
    });

    // Distance Matrix API 형식으로 변환
    const convertedResponse = convertRoutesAPIToDistanceMatrix(
      data as RouteMatrixElement[], 
      origins as LatLng[], 
      destinations as LatLng[]
    );
    
    return NextResponse.json(convertedResponse);
  } catch (error) {
    console.error('[Routes API v2] 예외 발생:', error);
    return NextResponse.json(
      { error: 'Failed to calculate route matrix', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Routes API 응답을 기존 Distance Matrix 형식으로 변환
function convertRoutesAPIToDistanceMatrix(
  routesData: RouteMatrixElement[], 
  origins: LatLng[], 
  destinations: LatLng[]
): DistanceMatrixResponse {
  if (!Array.isArray(routesData) || routesData.length === 0) {
    return {
      status: 'ZERO_RESULTS',
      origin_addresses: [],
      destination_addresses: [],
      rows: origins.map(() => ({
        elements: destinations.map(() => ({
          status: 'ZERO_RESULTS'
        }))
      }))
    };
  }

  // originIndex와 destinationIndex로 매트릭스 구성
  const matrix: (DistanceMatrixElement | null)[][] = Array(origins.length)
    .fill(null)
    .map(() => Array(destinations.length).fill(null));

  routesData.forEach((element) => {
    const originIdx = element.originIndex || 0;
    const destIdx = element.destinationIndex || 0;
    
    if (element.condition === 'ROUTE_EXISTS' && element.duration) {
      // duration은 "123s" 형식
      const durationInSeconds = parseInt(element.duration.replace('s', ''));
      
      matrix[originIdx][destIdx] = {
        status: 'OK',
        duration: {
          value: durationInSeconds,
          text: formatDuration(durationInSeconds)
        },
        distance: {
          value: element.distanceMeters || 0,
          text: formatDistance(element.distanceMeters || 0)
        }
      };
    } else {
      matrix[originIdx][destIdx] = {
        status: element.status?.message || 'ZERO_RESULTS'
      };
    }
  });

  return {
    status: 'OK',
    origin_addresses: origins.map(() => ''),
    destination_addresses: destinations.map(() => ''),
    rows: matrix.map(row => ({
      elements: row.map(el => el || { status: 'ZERO_RESULTS' })
    }))
  };
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  return `${minutes}분`;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${meters} m`;
}
