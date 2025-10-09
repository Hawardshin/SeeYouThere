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
  password?: string; // 비밀번호 (선택)
  createdBy?: string; // 생성자 이름
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

// GET - 방 데이터 가져오기 또는 방 목록 조회
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const roomCode = searchParams.get('roomCode');
  const listAll = searchParams.get('list') === 'true';

  await ensureRoomsDir();

  // 방 목록 조회
  if (listAll) {
    try {
      const files = await fs.readdir(ROOMS_DIR);
      const rooms = await Promise.all(
        files
          .filter(file => file.endsWith('.json'))
          .map(async (file) => {
            const filePath = path.join(ROOMS_DIR, file);
            const data = await fs.readFile(filePath, 'utf-8');
            const roomData: RoomData = JSON.parse(data);
            
            // 비밀번호는 제외하고 목록 정보만 반환
            return {
              roomCode: roomData.roomCode,
              meetingTitle: roomData.meetingTitle,
              participantCount: roomData.participants.length,
              candidateCount: roomData.candidates.length,
              hasPassword: !!roomData.password,
              createdBy: roomData.createdBy,
              updatedAt: roomData.updatedAt,
            };
          })
      );

      // 최근 업데이트 순으로 정렬
      rooms.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      return NextResponse.json({ 
        success: true, 
        data: rooms 
      });
    } catch (error) {
      console.error('방 목록 조회 오류:', error);
      return NextResponse.json({ 
        success: false,
        error: 'Failed to list rooms' 
      }, { status: 500 });
    }
  }

  // 특정 방 데이터 가져오기
  if (!roomCode) {
    return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });
  }

  const filePath = path.join(ROOMS_DIR, `${roomCode}.json`);

  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const roomData: RoomData = JSON.parse(data);
    
    // 비밀번호는 제외하고 반환
    const { password, ...roomDataWithoutPassword } = roomData;
    
    return NextResponse.json({ 
      success: true, 
      data: {
        ...roomDataWithoutPassword,
        hasPassword: !!password
      }
    });
  } catch {
    // 파일이 없으면 방이 존재하지 않음
    return NextResponse.json({ 
      success: false, 
      error: 'Room not found' 
    }, { status: 404 });
  }
}

// POST - 새 방 생성 또는 비밀번호 확인
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomCode, meetingTitle, participants, candidates, password, createdBy, verifyPassword } = body;

    if (!roomCode) {
      return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });
    }

    await ensureRoomsDir();

    const filePath = path.join(ROOMS_DIR, `${roomCode}.json`);

    // 비밀번호 확인 요청
    if (verifyPassword !== undefined) {
      try {
        const data = await fs.readFile(filePath, 'utf-8');
        const roomData: RoomData = JSON.parse(data);
        
        // 비밀번호가 설정되지 않은 방
        if (!roomData.password) {
          return NextResponse.json({ 
            success: true,
            message: 'No password required'
          });
        }
        
        // 비밀번호 확인
        if (roomData.password === verifyPassword) {
          // 비밀번호 제외하고 반환
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { password: _, ...roomDataWithoutPassword } = roomData;
          return NextResponse.json({ 
            success: true,
            data: roomDataWithoutPassword
          });
        } else {
          return NextResponse.json({ 
            success: false, 
            error: 'Incorrect password' 
          }, { status: 401 });
        }
      } catch {
        return NextResponse.json({ 
          success: false, 
          error: 'Room not found' 
        }, { status: 404 });
      }
    }

    // 새 방 생성
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
      password: password || undefined,
      createdBy: createdBy || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(filePath, JSON.stringify(roomData, null, 2), 'utf-8');

    // 비밀번호 제외하고 반환
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...roomDataWithoutPassword } = roomData;
    return NextResponse.json({ 
      success: true, 
      data: roomDataWithoutPassword
    });
  } catch (error) {
    console.error('방 생성/확인 오류:', error);
    return NextResponse.json({ 
      error: 'Failed to create/verify room' 
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
