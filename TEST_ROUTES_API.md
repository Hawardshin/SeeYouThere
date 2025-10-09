# Routes API v2 테스트 가이드

## 수동 테스트 방법

### 1. API 직접 호출 테스트

#### cURL 명령어
```bash
curl -X POST http://localhost:3000/api/maps/distancematrix \
  -H "Content-Type: application/json" \
  -d '{
    "origins": [
      { "lat": 37.5665, "lng": 126.9780 }
    ],
    "destinations": [
      { "lat": 37.5172, "lng": 127.0473 }
    ],
    "mode": "TRANSIT"
  }'
```

#### 예상 응답
```json
{
  "status": "OK",
  "origin_addresses": [""],
  "destination_addresses": [""],
  "rows": [
    {
      "elements": [
        {
          "status": "OK",
          "duration": {
            "value": 2400,
            "text": "40분"
          },
          "distance": {
            "value": 12000,
            "text": "12.0 km"
          }
        }
      ]
    }
  ]
}
```

### 2. 브라우저 콘솔 테스트

개발자 도구(F12) → Console에서 실행:

```javascript
// 서울시청 → 강남역 대중교통 경로
fetch('/api/maps/distancematrix', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    origins: [{ lat: 37.5665, lng: 126.9780 }],
    destinations: [{ lat: 37.5172, lng: 127.0473 }],
    mode: 'TRANSIT'
  })
})
.then(res => res.json())
.then(data => console.log('결과:', data));
```

### 3. 앱 내에서 테스트

1. 앱을 실행: `npm run dev`
2. 참여자 추가에서 "서울시청" 검색 후 추가
3. 목표 지점에서 "강남역" 검색 후 추가
4. 콘솔에서 Routes API v2 로그 확인:
   - `[Routes API v2] 요청:`
   - `[Routes API v2] 응답:`
   - `✅ TRANSIT 경로 성공 (Routes API v2):`

## 테스트 케이스

### Case 1: 서울 시내 대중교통
```json
{
  "origins": [{ "lat": 37.5665, "lng": 126.9780 }],  // 서울시청
  "destinations": [{ "lat": 37.5172, "lng": 127.0473 }],  // 강남역
  "mode": "TRANSIT"
}
```
**예상**: 지하철 경로 (약 40분)

### Case 2: 장거리 대중교통
```json
{
  "origins": [{ "lat": 37.5665, "lng": 126.9780 }],  // 서울시청
  "destinations": [{ "lat": 37.4563, "lng": 126.7052 }],  // 인천공항
  "mode": "TRANSIT"
}
```
**예상**: 공항철도 경로 (약 60분)

### Case 3: 출발 시간 지정
```json
{
  "origins": [{ "lat": 37.5665, "lng": 126.9780 }],
  "destinations": [{ "lat": 37.5172, "lng": 127.0473 }],
  "mode": "TRANSIT",
  "departureTime": "1735776000"  // 2025-01-02 09:00:00 KST
}
```
**예상**: 오전 9시 출발 기준 대중교통 경로

### Case 4: 여러 출발지 → 여러 목적지
```json
{
  "origins": [
    { "lat": 37.5665, "lng": 126.9780 },  // 서울시청
    { "lat": 37.5172, "lng": 127.0473 }   // 강남역
  ],
  "destinations": [
    { "lat": 37.5400, "lng": 127.0695 },  // 건대입구역
    { "lat": 37.5833, "lng": 127.0000 }   // 동대문역
  ],
  "mode": "TRANSIT"
}
```
**예상**: 4개의 경로 (2x2 매트릭스)

## 로그 확인 포인트

### 1. 요청 로그
```
[Routes API v2] 요청: {
  origins: 1,
  destinations: 1,
  mode: 'TRANSIT',
  departureTime: '2025-01-09T00:00:00.000Z',
  transitPreferences: {
    allowedTravelModes: [ 'SUBWAY', 'BUS', 'TRAIN', 'LIGHT_RAIL', 'RAIL' ]
  }
}
```

**참고**: `routingPreference`를 지정하지 않으면 Google Routes API가 **가장 빠른 경로(최단 시간)**를 자동으로 선택합니다.

### 2. 성공 응답 로그
```
[Routes API v2] 응답: {
  elements: 1,
  sample: {
    originIndex: 0,
    destinationIndex: 0,
    duration: '2400s',
    distanceMeters: 12000,
    condition: 'ROUTE_EXISTS'
  }
}
```

### 3. getTravelTime 성공 로그
```
✅ TRANSIT 경로 성공 (Routes API v2): {
  duration: '40분',
  distance: '12.0 km',
  duration_minutes: 40
}
```

## 오류 해결

### 오류 1: API 키 미설정
```
error: "Server API key not configured"
```
**해결**: `.env.local`에 `GOOGLE_MAPS_SERVER_API_KEY` 설정

### 오류 2: Routes API 미활성화
```
error: "Routes API error: 403"
```
**해결**: Google Cloud Console에서 Routes API 활성화

### 오류 3: 대중교통 경로 없음
```
⚠️ 대중교통 경로 실패, 자동차 경로로 재시도...
✅ 자동차 경로로 성공 (조정됨): 30분 → 39분
```
**설명**: 정상 동작 - 대중교통 불가 지역은 자동으로 자동차 경로 사용 (1.3배 가중치)

### 오류 4: CORS 에러
```
Access to fetch at 'https://routes.googleapis.com/...' has been blocked by CORS
```
**설명**: 서버 사이드 API Route를 사용하므로 발생하지 않아야 함
**해결**: 클라이언트에서 직접 호출하지 말고 `/api/maps/distancematrix` 경유

## 성능 모니터링

### 응답 시간
- **목표**: < 2초
- **실제**: Routes API v2는 일반적으로 1-3초

### 콘솔에서 시간 측정
```javascript
console.time('Routes API');
fetch('/api/maps/distancematrix', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    origins: [{ lat: 37.5665, lng: 126.9780 }],
    destinations: [{ lat: 37.5172, lng: 127.0473 }],
    mode: 'TRANSIT'
  })
})
.then(res => res.json())
.then(data => {
  console.timeEnd('Routes API');
  console.log('결과:', data);
});
```

## 다음 단계

1. ✅ Routes API v2 마이그레이션 완료
2. ⏳ 실제 앱에서 테스트
3. ⏳ 사용자 피드백 수집
4. ⏳ 필요시 추가 최적화

## 참고사항

- Routes API v2는 Distance Matrix API보다 더 정확한 대중교통 경로 제공
- 한국 지역 대중교통 정보 완벽 지원
- 실시간 스케줄 반영으로 더 정확한 소요 시간 계산
- Field mask 사용으로 비용 최적화
