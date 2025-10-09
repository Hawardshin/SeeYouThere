import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'SeeYouThere - 약속 장소 추천 서비스';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          background: 'linear-gradient(to bottom right, #1e293b, #334155)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '40px',
        }}
      >
        {/* 아이콘 */}
        <div
          style={{
            fontSize: 120,
            marginBottom: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 200,
            height: 200,
            background: 'linear-gradient(to bottom right, #3b82f6, #8b5cf6)',
            borderRadius: 40,
          }}
        >
          📍
        </div>

        {/* 타이틀 */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            marginBottom: 20,
            background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
            backgroundClip: 'text',
            color: 'transparent',
            display: 'flex',
          }}
        >
          SeeYouThere
        </div>

        {/* 설명 */}
        <div
          style={{
            fontSize: 32,
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: 800,
            display: 'flex',
          }}
        >
          모두가 만족하는 약속 장소를 찾아드립니다
        </div>

        {/* 하단 텍스트 */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 24,
            color: '#64748b',
            display: 'flex',
          }}
        >
          참여자들의 출발지를 입력하면 최적의 만남 장소를 추천해드립니다
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
