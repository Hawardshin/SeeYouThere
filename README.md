# SeeYouThere 👋

**모두에게 공평한 약속 장소를 찾아드립니다**

여러 명의 출발지를 바탕으로 약속 후보지의 소요시간을 분석하고, 가장 공평하고 빠른 장소를 추천하는 서비스입니다.

## 🎯 주요 기능

- ✅ **참여자 관리**: 이름과 출발지를 등록
- 📍 **후보지 분석**: 각 장소까지의 대중교통 소요시간 자동 계산
- 🏆 **스마트 추천**: 
  - 가장 공평한 장소 (표준편차 기반)
  - 가장 빠른 장소 (총 소요시간 기반)
- 🔗 **공유 기능**: 결과를 URL로 공유
- 🌓 **다크모드** 지원

## 🚀 시작하기

### 1. 저장소 클론

```bash
git clone https://github.com/Hawardshin/SeeYouThere.git
cd SeeYouThere
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.local` 파일을 생성하고 아래 API 키를 설정하세요:

```env
# 네이버 Maps API (네이버 클라우드 플랫폼)
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_NAVER_MAP_CLIENT_SECRET=your_client_secret_here
```

> **참고**: 
> - 네이버 Maps API의 Client ID와 Client Secret이 **필수**입니다.
> - 네이버 Maps API는 대중교통 경로를 제공하지 않아 자동차 경로로 대체됩니다.
> - API 키가 없으면 거리 기반 예상 시간으로 계산됩니다.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 📖 사용 방법

1. **모임 제목 입력**: 약속의 이름을 정합니다
2. **참여자 추가**: 각 참여자의 이름과 출발지를 입력
3. **후보지 추가**: 약속 장소 후보를 검색하여 추가
4. **결과 확인**: 자동으로 계산된 통계와 추천 장소 확인
5. **공유**: "공유 링크 생성" 버튼으로 URL 생성 및 공유

## 🛠 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **API**: 
  - 네이버 Maps API (Geocoding, Directions 5)

## 📦 배포

### Vercel 배포

```bash
npm run build
```

Vercel에 배포 시 환경 변수를 프로젝트 설정에서 추가하세요.

**주의**: 파일 기반 저장소는 serverless 환경에서 제한적입니다. 실제 운영 환경에서는 데이터베이스 사용을 권장합니다.

## 🔧 API 설정 가이드

### 네이버 Maps API (필수)

1. [네이버 클라우드 플랫폼](https://www.ncloud.com/) 가입 및 로그인
2. Console > Services > AI·Application > AI·NAVER API 메뉴로 이동
3. **Application 등록**
   - Application 이름 입력 (예: SeeYouThere)
   - 사용 API 선택: **Maps** 체크
   - [등록] 버튼 클릭
4. 생성된 Application 클릭하여 **인증 정보 확인**
   - Client ID (X-NCP-APIGW-API-KEY-ID)
   - Client Secret (X-NCP-APIGW-API-KEY)
5. `.env.local`에 추가:
   ```env
   NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=발급받은_Client_ID
   NEXT_PUBLIC_NAVER_MAP_CLIENT_SECRET=발급받은_Client_Secret
   ```

**주의사항**:
- 네이버 Maps API는 **대중교통 경로를 제공하지 않습니다**
- 자동차 경로(Directions 5 API)로 대체하여 소요시간을 계산합니다
- 실제 대중교통 시간과 차이가 있을 수 있습니다

### ODsay API (선택사항 - 현재 미지원)

대중교통 경로가 필요한 경우:
1. [ODsay 개발자 센터](https://lab.odsay.com/) 가입
2. API 신청 및 키 발급
3. 별도 구현 필요 (현재는 네이버 Maps Directions API 사용)

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

MIT License

## 👥 개발자

[@Hawardshin](https://github.com/Hawardshin)

---

**SeeYouThere** - 장소 결정의 번거로움을 데이터로 빠르게 해결 ✨

