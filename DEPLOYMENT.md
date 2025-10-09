# 🚀 SeeYouThere 배포 가이드

## ✅ 완료된 설정

### 1. SEO 및 메타데이터
- ✅ 페이지 제목: "SeeYouThere - 약속 장소 추천 서비스"
- ✅ 메타 설명: 참여자 출발지 기반 최적 장소 추천
- ✅ Open Graph 이미지 설정
- ✅ Twitter Card 설정
- ✅ 키워드 최적화

### 2. 파비콘 및 아이콘
- ✅ 기본 파비콘 (32x32)
- ✅ Apple Touch Icon (180x180)
- ✅ 동적 생성 아이콘 (📍 이모지)

### 3. Google Analytics
- ✅ GA4 추적 코드 설정
- ✅ 환경 변수 준비

### 4. SEO 최적화
- ✅ robots.txt
- ✅ sitemap.xml
- ✅ 메타 태그 최적화

### 5. SNS 공유 미리보기
- ✅ OG 이미지 (1200x630)
- ✅ 카카오톡, 페이스북, 트위터 등에서 보기 좋은 미리보기

---

## 📝 배포 전 체크리스트

### 1. Google Analytics 설정 (필수)

**Step 1**: Google Analytics 계정 생성
1. https://analytics.google.com 접속
2. "측정 시작" 클릭
3. 계정 이름: "SeeYouThere"
4. 속성 이름: "SeeYouThere Web"
5. **측정 ID 복사** (예: G-XXXXXXXXXX)

**Step 2**: Vercel 환경 변수 설정
1. Vercel 대시보드 → 프로젝트 → Settings → Environment Variables
2. 추가할 변수:
   ```
   Key: NEXT_PUBLIC_GA_MEASUREMENT_ID
   Value: G-XXXXXXXXXX (위에서 복사한 ID)
   ```
3. Production, Preview, Development 모두 체크
4. "Save" 클릭

### 2. 환경 변수 확인

Vercel에 다음 환경 변수가 모두 설정되어 있는지 확인:

```bash
# Google Maps API
GOOGLE_MAPS_SERVER_API_KEY=your-server-api-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-client-api-key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Analytics (추가 필요)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 3. 배포 후 확인사항

#### 메타데이터 확인
1. 브라우저에서 https://see-you-there.vercel.app 접속
2. F12 → Elements → `<head>` 섹션 확인
3. 다음 태그들이 있는지 확인:
   - `<title>SeeYouThere - 약속 장소 추천 서비스</title>`
   - `<meta name="description" content="모두가 만족하는...">`
   - `<meta property="og:image" content="/opengraph-image">`

#### SNS 공유 미리보기 테스트

**카카오톡**:
1. https://developers.kakao.com/tool/debugger/sharing
2. URL 입력: https://see-you-there.vercel.app
3. 미리보기 확인

**페이스북**:
1. https://developers.facebook.com/tools/debug/
2. URL 입력: https://see-you-there.vercel.app
3. "Scrape Again" 클릭
4. 미리보기 확인

**트위터**:
1. https://cards-dev.twitter.com/validator
2. URL 입력: https://see-you-there.vercel.app
3. 미리보기 확인

#### Google Analytics 작동 확인
1. Google Analytics → 보고서 → 실시간
2. 사이트 접속
3. 실시간 사용자 수 확인 (1명 이상 표시되어야 함)

---

## 🎨 커스터마이징

### OG 이미지 수정
`/src/app/opengraph-image.tsx` 파일에서:
- 배경색 변경: `background` 속성
- 텍스트 수정: `div` 내용
- 이모지 변경: 📍 → 다른 이모지

### 파비콘 수정
`/src/app/icon.tsx` 파일에서:
- 이모지 변경
- 배경색 변경
- 크기 조정

---

## 🔍 SEO 개선 팁

### Google Search Console 등록
1. https://search.google.com/search-console
2. "속성 추가" → URL 접두어: https://see-you-there.vercel.app
3. 소유권 확인 (HTML 태그 방식)
4. `/src/app/layout.tsx`의 `verification.google` 값에 확인 코드 입력

### Naver Search Advisor 등록
1. https://searchadvisor.naver.com
2. 사이트 등록
3. 소유 확인
4. sitemap.xml 제출

---

## 📊 성능 모니터링

### Vercel Analytics
1. Vercel 대시보드 → 프로젝트 → Analytics
2. Speed Insights 활성화
3. Web Vitals 모니터링

### Google PageSpeed Insights
- https://pagespeed.web.dev/
- URL 입력하여 성능 점수 확인
- 개선 제안 사항 검토

---

## 🎯 마케팅 가이드

### 소개 문구 (Reddit, 커뮤니티 등)
```
여러분 안녕하세요! 약속 장소를 정하는 사이트를 개발했습니다.

🎯 SeeYouThere - 약속 장소 추천 서비스
📍 https://see-you-there.vercel.app

✨ 주요 기능:
- 참여자들의 출발지를 입력하면 최적의 만남 장소 자동 추천
- 대중교통/자동차 선택 가능
- 이동 시간 실시간 계산
- 개인별 상세 분석
- 방 생성으로 여러 약속 관리

💡 체험하기:
방 이름: 테토남들
비밀번호: 1019

건전한 피드백은 언제나 환영입니다! 🙏
```

### 해시태그
`#약속장소 #만남장소추천 #SeeYouThere #중간지점 #약속앱 #편의서비스`

---

## ✅ 최종 배포 단계

```bash
# 1. 로컬 빌드 테스트
npm run build
npm run start

# 2. Git 커밋 & 푸시
git add .
git commit -m "Add SEO, GA, favicon, and OG image"
git push origin main

# 3. Vercel 자동 배포 대기 (약 1-2분)

# 4. 배포 완료 후 확인
# - https://see-you-there.vercel.app 접속
# - 메타데이터 확인
# - GA 작동 확인
# - SNS 공유 미리보기 테스트
```

---

## 🆘 트러블슈팅

### OG 이미지가 안 보여요
- Vercel 재배포 필요 (캐시 문제)
- SNS 디버거에서 "Scrape Again" 클릭
- 24시간 정도 기다리면 자동 업데이트됨

### Google Analytics가 작동 안 해요
- 환경 변수가 `NEXT_PUBLIC_`로 시작하는지 확인
- Vercel 재배포 후 확인
- 개발자 도구 → Network 탭에서 `gtag/js` 요청 확인

### 파비콘이 안 바뀌어요
- 브라우저 캐시 삭제 (Ctrl+Shift+R)
- 시크릿 모드에서 확인

---

## 🎉 완료!

모든 설정이 완료되었습니다. 배포 후 위 체크리스트를 따라 확인해주세요!

궁금한 점이 있으면 언제든 물어보세요! 🚀
