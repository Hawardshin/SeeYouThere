import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get('placeId');

  if (!placeId) {
    return NextResponse.json({ error: 'placeId parameter is required' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: 'Server API key not configured' }, { status: 500 });
  }

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://see-you-there.vercel.app';
    
    // Place Details (New) API 사용
    const fullPlaceId = placeId.startsWith('places/') ? placeId : `places/${placeId}`;
    
    const response = await fetch(
      `https://places.googleapis.com/v1/${fullPlaceId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,location',
          'Accept-Language': 'ko-KR', // 한국어 우선
          'Referer': siteUrl,
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Place Details API error:', response.status, errorText);
      return NextResponse.json(
        { error: `Place Details API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const place = await response.json();
    
    console.log('[Place Details API] 원본 응답:', JSON.stringify(place, null, 2));
    
    // 구 형식으로 변환하여 호환성 유지
    const result = {
      status: 'OK',
      result: {
        name: place.displayName?.text || '',
        formatted_address: place.formattedAddress || '',
        geometry: {
          location: {
            lat: place.location?.latitude || 0,
            lng: place.location?.longitude || 0,
          }
        }
      }
    };
    
    console.log('[Place Details API] 변환된 응답:', JSON.stringify(result, null, 2));
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Place details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch place details', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
