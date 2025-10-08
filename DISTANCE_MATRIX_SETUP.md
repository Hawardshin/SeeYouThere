# Distance Matrix API 설정 가이드

## 문제 해결: NOT_FOUND 오류

### 1. API 활성화 확인

Google Cloud Console에서 다음 API들이 **모두 활성화**되어 있는지 확인:

1. **Distance Matrix API** ✅ (필수!)
2. Places API (New)
3. Geocoding API
4. Maps JavaScript API

**확인 방법:**
```
https://console.cloud.google.com/apis/library/distance-matrix-backend.googleapis.com
```

### 2. API 키 권한 확인

`.env.local` 파일의 `GOOGLE_MAPS_SERVER_API_KEY`가:

- Distance Matrix API 사용 권한 있음 ✅
- IP 주소 제한 없음 (또는 서버 IP 허용됨)
- HTTP referrer 제한 없음 (서버용 키이므로)

### 3. 한국 대중교통 지원 파라미터

Distance Matrix API 호출 시 필수 파라미터:

```
mode=transit                              // 대중교통
departure_time=now                        // 현재 시간 출발
transit_mode=subway|bus|train            // 지하철, 버스, 기차
language=ko                               // 한국어
region=KR                                 // 한국 지역
units=metric                              // 미터법
```

**주의:** `transit_routing_preference`는 제거됨 (한국에서 NOT_FOUND 오류 발생)

### 4. 테스트 URL

브라우저에서 직접 테스트:

```
https://maps.googleapis.com/maps/api/distancematrix/json?origins=37.5665,126.9780&destinations=37.4979,127.0276&mode=transit&departure_time=now&transit_mode=subway|bus&language=ko&region=KR&key=YOUR_API_KEY
```

**성공 응답 예시:**
```json
{
  "status": "OK",
  "rows": [
    {
      "elements": [
        {
          "status": "OK",
          "duration": {
            "value": 1800,
            "text": "30분"
          },
          "distance": {
            "value": 8500,
            "text": "8.5 km"
          }
        }
      ]
    }
  ]
}
```

### 5. NOT_FOUND 오류가 계속되는 경우

**원인:**
- 대중교통 경로가 실제로 존재하지 않음
- 출발지/도착지가 대중교통 접근 불가 지역
- 한국 지역이 아닌 해외 좌표

**해결책:**
- `mode=driving`으로 자동 fallback (이미 구현됨)
- 직선 거리 기반 추정치 사용 (이미 구현됨)

### 6. 비용 최적화

Distance Matrix API는 호출당 과금:
- Basic: $5 per 1,000 elements
- Advanced (실시간 교통): $10 per 1,000 elements

**절약 팁:**
- 캐싱 활용
- 중복 요청 방지
- 필요한 경우에만 `departure_time` 사용

### 7. 현재 구현 상태

✅ Transit 실패 시 Driving으로 자동 재시도
✅ 모든 API 실패 시 직선거리 추정
✅ 좌표 유효성 검사
✅ 상세한 로그 출력
✅ 한국어 응답
✅ 대중교통 최적화 파라미터

### 8. 디버깅 체크리스트

1. [ ] Distance Matrix API가 활성화되어 있는가?
2. [ ] API 키에 Distance Matrix API 권한이 있는가?
3. [ ] 터미널 로그에서 `[Distance Matrix] 전체 응답` 확인
4. [ ] 브라우저 콘솔에서 좌표값이 올바른가?
5. [ ] 테스트 URL로 직접 호출 시 성공하는가?

### 9. 대체 솔루션: Routes API (선택사항)

더 정확한 대중교통 정보가 필요한 경우 Routes API의 Compute Route Matrix 사용 가능:

```bash
curl -X POST \
  -H 'Content-Type: application/json' \
  -H 'X-Goog-Api-Key: YOUR_API_KEY' \
  -H 'X-Goog-FieldMask: originIndex,destinationIndex,distanceMeters,duration' \
  --data '{
    "origins": [{"waypoint": {"location": {"latLng": {"latitude": 37.5665, "longitude": 126.9780}}}}],
    "destinations": [{"waypoint": {"location": {"latLng": {"latitude": 37.4979, "longitude": 127.0276}}}}],
    "travelMode": "TRANSIT"
  }' \
  'https://routes.googleapis.com/v2:computeRouteMatrix'
```

단점: 더 복잡한 API, 높은 비용
