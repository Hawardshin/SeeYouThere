# Google Maps API 설정 가이드

## 문제: API keys with referer restrictions cannot be used with this API

이 오류는 **HTTP 리퍼러 제한이 있는 API 키**를 서버사이드 API에서 사용하려고 할 때 발생합니다.

## 해결 방법

### 옵션 1: API 키 제한 해제 (개발 중 - 가장 빠른 방법)

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 선택
3. **API 및 서비스 > 라이브러리**로 이동
4. 다음 API들을 **활성화**:
   - ✅ **Places API (New)** ← 중요! 구버전이 아닌 New 버전 활성화
   - ✅ **Geocoding API**
   - ✅ **Distance Matrix API**
   - ✅ **Directions API** (선택사항, 나중에 경로 시각화 시 필요)
7. **개발 서버 재시작**: `npm run dev`

### 옵션 2: 별도의 서버용 API 키 생성 (프로덕션 권장)

#### 1단계: 새 API 키 생성

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. **API 및 서비스 > 사용자 인증 정보** 이동
3. **+ 사용자 인증 정보 만들기 > API 키** 클릭
4. 새 API 키 복사

#### 2단계: 서버용 API 키 설정

새로 생성한 API 키 편집:
- **이름**: "Server-side API Key" (구분용)
- **애플리케이션 제한사항**: 
  - 개발: "없음"
  - 프로덕션: "IP 주소" → Vercel IP 추가
- **API 제한사항**:
  - "키 제한" 선택
  - Places API, Geocoding API, Distance Matrix API 체크
- **저장**

#### 3단계: .env.local에 서버용 키 추가

```bash
# 서버사이드 전용 (제한 없음)
GOOGLE_MAPS_SERVER_API_KEY=새로_생성한_API_키

# 클라이언트용 (HTTP 리퍼러 제한 가능) - 선택사항
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=기존_API_키
```

#### 4단계: 개발 서버 재시작

```bash
npm run dev
```

## 현재 프로젝트 구조

### 서버사이드 API Routes (제한 없는 API 키 필요)
- `/api/places/autocomplete` - Places Autocomplete
- `/api/places/details` - Place Details  
- `/api/maps/geocode` - Geocoding
- `/api/maps/distancematrix` - Distance Matrix

### 환경 변수
- `GOOGLE_MAPS_SERVER_API_KEY` - 서버사이드 전용 (필수)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - 클라이언트용 (선택)

## 보안 권장사항

### 개발 환경
- API 키 제한: 없음 또는 localhost만 허용
- .env.local에만 저장 (Git 제외)

### 프로덕션 환경
- 서버용 키: IP 제한 (Vercel IP)
- 클라이언트용 키: HTTP 리퍼러 제한 (도메인)
- 환경 변수로 관리 (Vercel 설정)

## 문제 해결

### "REQUEST_DENIED" 오류
→ API 키 제한 해제 또는 별도의 서버용 키 사용

### "API key not configured" 오류
→ .env.local 파일 확인 및 서버 재시작

### "CORS" 오류
→ API Routes를 통해 호출하는지 확인

## 필수 API 활성화

Google Cloud Console에서 다음 API들을 활성화해야 합니다:

1. **Places API (New)** ← 반드시 "New" 버전 활성화!
2. **Geocoding API**
3. **Distance Matrix API**
4. **Directions API** (선택사항)

[API 라이브러리](https://console.cloud.google.com/apis/library)에서 "Places API (New)"를 검색 후 "사용" 버튼 클릭

⚠️ **주의**: "Places API (New)"와 구버전 "Places API"는 다릅니다. 반드시 **(New)** 버전을 활성화하세요!
