# Routes API v2 마이그레이션 완료

## 변경 사항

### 1. API 엔드포인트 업데이트
- **이전**: Distance Matrix API `https://maps.googleapis.com/maps/api/distancematrix/json`
- **현재**: Routes API v2 `https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix`

### 2. 요청 방식 변경
- **이전**: HTTP GET 요청 with URL parameters
- **현재**: HTTP POST 요청 with JSON body

### 3. 대중교통 경로 최적화
항상 **대중교통(버스 + 지하철 + 걷기)** 경로를 사용하며, **가장 빠른 시간의 경로**를 제공합니다.

#### 대중교통 설정
```json
{
  "travelMode": "TRANSIT",
  "transitPreferences": {
    "allowedTravelModes": ["SUBWAY", "BUS", "TRAIN", "LIGHT_RAIL", "RAIL"]
  }
}
```

- **허용 수단**: 지하철, 버스, 기차, 경전철 등 모든 대중교통
- **경로 선호**: `routingPreference`를 지정하지 않음 → **가장 빠른 경로(최단 시간)** 자동 선택
- Google Routes API는 기본적으로 소요 시간이 가장 짧은 경로를 우선 제공합니다

### 4. 응답 형식 변환
Routes API v2의 응답을 기존 Distance Matrix API 형식으로 자동 변환하여 호환성 유지:

#### Routes API v2 응답
```json
[
  {
    "originIndex": 0,
    "destinationIndex": 0,
    "condition": "ROUTE_EXISTS",
    "duration": "1234s",
    "distanceMeters": 5000
  }
]
```

#### 변환된 응답 (Distance Matrix 형식)
```json
{
  "status": "OK",
  "rows": [
    {
      "elements": [
        {
          "status": "OK",
          "duration": {
            "value": 1234,
            "text": "20분"
          },
          "distance": {
            "value": 5000,
            "text": "5.0 km"
          }
        }
      ]
    }
  ]
}
```

## 수정된 파일

### 1. `/src/app/api/maps/distancematrix/route.ts`
- GET → POST 메서드로 변경
- URL parameters → JSON body로 요청 방식 변경
- Routes API v2 엔드포인트 사용
- 대중교통 우선순위 및 경로 선호 설정
- 응답 형식 자동 변환 로직 추가
- TypeScript 타입 안전성 강화

### 2. `/src/lib/mapApi.ts`
- `getTravelTime` 함수 업데이트
- GET → POST 요청으로 변경
- 대중교통 모드 기본값으로 설정
- Routes API v2 호출 방식으로 변경

## 주요 기능

### 1. 대중교통 경로 우선
- 모든 경로 탐색은 기본적으로 대중교통(TRANSIT) 모드 사용
- 모든 대중교통 수단(지하철, 버스, 기차 등) 조합하여 **가장 빠른 경로** 자동 선택
- 대중교통 불가능한 경우에만 자동차(DRIVE) 경로로 fallback (1.3배 가중치)

### 2. 최단 시간 경로
- `routingPreference` 미지정으로 기본 동작 사용
- Google Routes API의 기본 동작: **소요 시간이 가장 짧은 경로 우선**
- 버스만, 지하철만이 아닌 모든 조합 중 가장 빠른 경로 제공

### 3. 한국 대중교통 최적화
- `regionCode: "KR"` - 한국 지역 설정
- `languageCode: "ko"` - 한국어 응답
- 지하철, 버스, 기차 등 모든 대중교통 수단 포함

### 4. 시간대별 정확한 경로
- `departureTime` 설정으로 특정 시간대 대중교통 스케줄 반영
- 기본값: 현재 시간

## 비용 최적화

### Field Mask 사용
필요한 필드만 요청하여 비용 절감:
```
X-Goog-FieldMask: originIndex,destinationIndex,duration,distanceMeters,status,condition
```

### 요청 필드
- `originIndex`: 출발지 인덱스
- `destinationIndex`: 목적지 인덱스
- `duration`: 소요 시간
- `distanceMeters`: 거리 (미터)
- `status`: 상태 정보
- `condition`: 경로 존재 여부

## API 키 설정

`.env.local` 파일에 API 키 설정 필요:
```bash
GOOGLE_MAPS_SERVER_API_KEY=your_api_key_here
```

### 필수 API 활성화
Google Cloud Console에서 다음 API 활성화:
1. **Routes API** (새로 추가)
2. Places API
3. Geocoding API

## 마이그레이션 이점

1. ✅ **최신 API**: Routes API v2는 Google의 최신 경로 탐색 기술 사용
2. ✅ **대중교통 최적화**: 더 정확한 대중교통 경로 제공
3. ✅ **비용 효율**: Field mask로 필요한 데이터만 요청
4. ✅ **하위 호환성**: 기존 코드 변경 최소화 (자동 형식 변환)
5. ✅ **타입 안전성**: TypeScript 타입 정의로 안정성 향상

## 사용 예시

```typescript
// mapApi.ts에서 사용
const result = await getTravelTime(
  { lat: 37.5665, lng: 126.9780 }, // 서울시청
  { lat: 37.5172, lng: 127.0473 }, // 강남역
  'TRANSIT', // 대중교통 (기본값)
  '09:00' // 오전 9시 출발
);

console.log(result.duration); // 소요 시간 (분)
console.log(result.distance); // 거리 (미터)
```

## 참고 문서

- [Routes API v2 Documentation](https://developers.google.com/maps/documentation/routes)
- [Compute Route Matrix](https://developers.google.com/maps/documentation/routes/compute_route_matrix)
- [Transit Routes](https://developers.google.com/maps/documentation/routes/transit_routes)
- [Migration Guide](https://developers.google.com/maps/documentation/routes/migration)
