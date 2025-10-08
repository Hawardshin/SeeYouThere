import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const input = searchParams.get('input');

  if (!input) {
    return NextResponse.json({ error: 'input parameter is required' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: 'Server API key not configured' }, { status: 500 });
  }

  try {
    // Text Search (New) API 사용 - 더 정확한 장소 검색
    const response = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location'
        },
        body: JSON.stringify({
          textQuery: input,
          languageCode: 'ko', // 한국어
          regionCode: 'KR',   // 한국 지역
          maxResultCount: 5
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Places Text Search API error:', response.status, errorText);
      return NextResponse.json(
        { error: `Places API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // 구 형식으로 변환하여 호환성 유지
    if (data.places && data.places.length > 0) {
      const predictions = data.places.map((place: { id: string; displayName?: { text: string }; formattedAddress?: string }) => ({
        place_id: place.id.replace('places/', ''), // "places/ChIJ..." -> "ChIJ..."
        description: place.displayName?.text || place.formattedAddress || ''
      }));
      
      return NextResponse.json({
        status: 'OK',
        predictions
      });
    }

    return NextResponse.json({
      status: 'ZERO_RESULTS',
      predictions: []
    });
  } catch (error) {
    console.error('Places autocomplete error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch places', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
