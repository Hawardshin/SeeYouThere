import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Meeting } from '@/types';

// 고유 ID 생성
function generateId(): string {
  return 'm' + Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// POST: 모임 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const meetingId = generateId();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('meetings')
      .insert({
        id: meetingId,
        title: body.title,
        participants: body.participants,
        candidates: body.candidates,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase 에러:', error);
      return NextResponse.json(
        { success: false, error: '모임 저장에 실패했습니다: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      meetingId: data.id,
      shareUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://seeyouthere.vercel.app'}/share/${data.id}`
    });
  } catch (error) {
    console.error('모임 저장 실패:', error);
    return NextResponse.json(
      { success: false, error: '모임 저장에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// GET: 모임 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get('id');

    if (!meetingId) {
      return NextResponse.json(
        { success: false, error: '모임 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single();

    if (error || !data) {
      console.error('Supabase 조회 에러:', error);
      return NextResponse.json(
        { success: false, error: '모임을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const meeting: Meeting = {
      id: data.id,
      title: data.title,
      participants: data.participants as Meeting['participants'],
      candidates: data.candidates as Meeting['candidates'],
      createdAt: new Date(data.created_at),
    };

    return NextResponse.json({ success: true, meeting });
  } catch (error) {
    console.error('모임 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '모임 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
