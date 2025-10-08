import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { Meeting } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data', 'meetings');

// 데이터 디렉토리 생성
async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

// 고유 ID 생성
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// POST: 모임 생성
export async function POST(request: NextRequest) {
  try {
    await ensureDataDir();
    
    const body = await request.json();
    const meetingId = generateId();
    
    const meeting: Meeting = {
      id: meetingId,
      title: body.title,
      participants: body.participants,
      candidates: body.candidates,
      createdAt: new Date(),
    };

    const filePath = path.join(DATA_DIR, `${meetingId}.json`);
    await writeFile(filePath, JSON.stringify(meeting, null, 2), 'utf-8');

    return NextResponse.json({ 
      success: true, 
      meetingId,
      shareUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/share/${meetingId}`
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

    const filePath = path.join(DATA_DIR, `${meetingId}.json`);
    
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: '모임을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const data = await readFile(filePath, 'utf-8');
    const meeting = JSON.parse(data);

    return NextResponse.json({ success: true, meeting });
  } catch (error) {
    console.error('모임 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '모임 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
