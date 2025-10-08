import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Participant, CandidateLocation } from '@/types';

const ROOMS_DIR = path.join(process.cwd(), 'data', 'rooms');

// 방 데이터 타입
interface RoomData {
  roomCode: string;
  meetingTitle: string;
  participants: Participant[];
  candidates: CandidateLocation[];
  createdAt: string;
  updatedAt: string;
}

// 디렉토리 생성 (없으면)
async function ensureRoomsDir() {
  try {
    await fs.access(ROOMS_DIR);
  } catch {
    await fs.mkdir(ROOMS_DIR, { recursive: true });
  }
}

// GET - 방 데이터 가져오기
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const roomCode = searchParams.get('roomCode');

  if (!roomCode) {
    return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });
  }

  await ensureRoomsDir();

  const filePath = path.join(ROOMS_DIR, `${roomCode}.json`);

  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const roomData: RoomData = JSON.parse(data);
    
    return NextResponse.json({ 
      success: true, 
      data: roomData 
    });
  } catch {
    // 파일이 없으면 방이 존재하지 않음
    return NextResponse.json({ 
      success: false, 
      error: 'Room not found' 
    }, { status: 404 });
  }
}

// POST - 새 방 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomCode, meetingTitle, participants, candidates } = body;

    if (!roomCode) {
      return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });
    }

    await ensureRoomsDir();

    const filePath = path.join(ROOMS_DIR, `${roomCode}.json`);

    // 이미 존재하는 방인지 확인
    try {
      await fs.access(filePath);
      return NextResponse.json({ 
        success: false, 
        error: 'Room already exists' 
      }, { status: 409 });
    } catch {
      // 파일이 없으면 새로 생성
    }

    const roomData: RoomData = {
      roomCode,
      meetingTitle: meetingTitle || '새로운 모임',
      participants: participants || [],
      candidates: candidates || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(filePath, JSON.stringify(roomData, null, 2), 'utf-8');

    return NextResponse.json({ 
      success: true, 
      data: roomData 
    });
  } catch (error) {
    console.error('방 생성 오류:', error);
    return NextResponse.json({ 
      error: 'Failed to create room' 
    }, { status: 500 });
  }
}

// PUT - 방 데이터 업데이트
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomCode, meetingTitle, participants, candidates } = body;

    if (!roomCode) {
      return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });
    }

    await ensureRoomsDir();

    const filePath = path.join(ROOMS_DIR, `${roomCode}.json`);

    // 방이 존재하는지 확인
    let existingData: RoomData;
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      existingData = JSON.parse(data);
    } catch {
      return NextResponse.json({ 
        success: false, 
        error: 'Room not found' 
      }, { status: 404 });
    }

    // 업데이트
    const updatedData: RoomData = {
      ...existingData,
      meetingTitle: meetingTitle ?? existingData.meetingTitle,
      participants: participants ?? existingData.participants,
      candidates: candidates ?? existingData.candidates,
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), 'utf-8');

    return NextResponse.json({ 
      success: true, 
      data: updatedData 
    });
  } catch (error) {
    console.error('방 업데이트 오류:', error);
    return NextResponse.json({ 
      error: 'Failed to update room' 
    }, { status: 500 });
  }
}
