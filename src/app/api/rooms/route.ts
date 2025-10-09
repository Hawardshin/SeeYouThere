// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Participant, CandidateLocation } from '@/types';

// Supabase DB 타입
interface DbRoom {
  id: string;
  room_code: string;
  meeting_title: string;
  password: string | null;
  created_at: string;
  updated_at: string;
}

interface DbParticipant {
  id: string;
  room_id: string;
  name: string;
  start_location: unknown;
  transport_mode: 'car' | 'transit';
  created_at: string;
}

interface DbCandidateLocation {
  id: string;
  room_id: string;
  location_id: string;
  name: string;
  address: string;
  coordinates: unknown;
  travel_times: unknown;
  created_at: string;
}

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

// GET - 방 데이터 가져오기 또는 방 목록 조회
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const roomCode = searchParams.get('roomCode');
  const listAll = searchParams.get('list') === 'true';

  try {
    // 방 목록 조회
    if (listAll) {
      // 1. 모든 방 가져오기
      const { data, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .order('updated_at', { ascending: false });

      if (roomsError) throw roomsError;
      if (!data) {
        return NextResponse.json({ success: true, data: [] });
      }

      const rooms = data as DbRoom[];

      // 2. 각 방의 참여자와 후보지 개수 카운트
      const roomsWithCounts = await Promise.all(
        rooms.map(async (room) => {
          const [participantsCount, candidatesCount] = await Promise.all([
            supabase
              .from('participants')
              .select('id', { count: 'exact', head: true })
              .eq('room_id', room.id),
            supabase
              .from('candidate_locations')
              .select('id', { count: 'exact', head: true })
              .eq('room_id', room.id),
          ]);

          return {
            roomCode: room.room_code,
            meetingTitle: room.meeting_title,
            participantCount: participantsCount.count || 0,
            candidateCount: candidatesCount.count || 0,
            hasPassword: !!room.password,
            createdBy: undefined, // createdBy는 더 이상 사용하지 않음
            updatedAt: room.updated_at,
          };
        })
      );

      return NextResponse.json({ 
        success: true, 
        data: roomsWithCounts 
      });
    }

    // 특정 방 데이터 가져오기
    if (!roomCode) {
      return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });
    }

    // 1. 방 정보 조회
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_code', roomCode)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ 
        success: false, 
        error: 'Room not found' 
      }, { status: 404 });
    }

    const roomTyped = room as any;

    // 2. 참여자 목록 조회
    const { data: participantsData, error: participantsError } = await supabase
      .from('participants')
      .select('*')
      .eq('room_id', roomTyped.id);

    if (participantsError) throw participantsError;

    // 3. 후보 장소 목록 조회
    const { data: candidatesData, error: candidatesError } = await supabase
      .from('candidate_locations')
      .select('*')
      .eq('room_id', roomTyped.id);

    if (candidatesError) throw candidatesError;

    // 4. 데이터 변환 (DB 형식 → 앱 형식)
    const participants: Participant[] = (participantsData || []).map((p) => {
      const startLocation = p.start_location as { address: string; coordinates: { lat: number; lng: number } };
      return {
        id: p.id,
        name: p.name,
        startLocation: startLocation.address,
        coordinates: startLocation.coordinates,
        transportMode: p.transport_mode,
      };
    });

    const candidates: CandidateLocation[] = (candidatesData || []).map((c) => ({
      id: c.location_id,
      name: c.name,
      address: c.address,
      coordinates: c.coordinates as { lat: number; lng: number },
      travelTimes: c.travel_times as CandidateLocation['travelTimes'],
    }));

    const roomData: RoomData = {
      roomCode: room.room_code,
      meetingTitle: room.meeting_title,
      participants,
      candidates,
      createdAt: room.created_at,
      updatedAt: room.updated_at,
    };

    return NextResponse.json({ 
      success: true, 
      data: {
        ...roomData,
        hasPassword: !!room.password
      }
    });
  } catch (error) {
    console.error('방 조회 오류:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch room data' 
    }, { status: 500 });
  }
}

// POST - 새 방 생성 또는 비밀번호 확인
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomCode, meetingTitle, participants, candidates, password, verifyPassword } = body;

    if (!roomCode) {
      return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });
    }

    // 비밀번호 확인 요청
    if (verifyPassword !== undefined) {
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', roomCode)
        .single();

      if (roomError || !room) {
        return NextResponse.json({ 
          success: false, 
          error: 'Room not found' 
        }, { status: 404 });
      }

      // 비밀번호가 설정되지 않은 방
      if (!room.password) {
        return NextResponse.json({ 
          success: true,
          message: 'No password required'
        });
      }

      // 비밀번호 확인
      if (room.password === verifyPassword) {
        // 참여자와 후보지 데이터도 함께 가져오기
        const { data: participantsData } = await supabase
          .from('participants')
          .select('*')
          .eq('room_id', room.id);

        const { data: candidatesData } = await supabase
          .from('candidate_locations')
          .select('*')
          .eq('room_id', room.id);

        // 데이터 변환
        const participantsList: Participant[] = (participantsData || []).map((p) => {
          const startLocation = p.start_location as { address: string; coordinates: { lat: number; lng: number } };
          return {
            id: p.id,
            name: p.name,
            startLocation: startLocation.address,
            coordinates: startLocation.coordinates,
            transportMode: p.transport_mode,
          };
        });

        const candidatesList: CandidateLocation[] = (candidatesData || []).map((c) => ({
          id: c.location_id,
          name: c.name,
          address: c.address,
          coordinates: c.coordinates as { lat: number; lng: number },
          travelTimes: c.travel_times as CandidateLocation['travelTimes'],
        }));

        return NextResponse.json({ 
          success: true,
          data: {
            roomCode: room.room_code,
            meetingTitle: room.meeting_title,
            participants: participantsList,
            candidates: candidatesList,
            createdAt: room.created_at,
            updatedAt: room.updated_at,
          }
        });
      } else {
        return NextResponse.json({ 
          success: false, 
          error: 'Incorrect password' 
        }, { status: 401 });
      }
    }

    // 새 방 생성
    // 이미 존재하는 방인지 확인
    const { data: existingRoom } = await supabase
      .from('rooms')
      .select('id')
      .eq('room_code', roomCode)
      .single();

    if (existingRoom) {
      return NextResponse.json({ 
        success: false, 
        error: 'Room already exists' 
      }, { status: 409 });
    }

    // 방 생성
    const { data: newRoom, error: createError } = await supabase
      .from('rooms')
      .insert({
        room_code: roomCode,
        meeting_title: meetingTitle || '새로운 모임',
        password: password || null,
      })
      .select()
      .single();

    if (createError || !newRoom) {
      throw createError;
    }

    // 초기 참여자가 있으면 추가
    if (participants && participants.length > 0) {
      const participantsToInsert = participants.map((p: Participant) => ({
        room_id: newRoom.id,
        name: p.name,
        start_location: {
          address: p.startLocation,
          coordinates: p.coordinates,
        },
        transport_mode: p.transportMode,
      }));

      await supabase.from('participants').insert(participantsToInsert);
    }

    // 초기 후보지가 있으면 추가
    if (candidates && candidates.length > 0) {
      const candidatesToInsert = candidates.map((c: CandidateLocation) => ({
        room_id: newRoom.id,
        location_id: c.id,
        name: c.name,
        address: c.address,
        coordinates: c.coordinates,
        travel_times: c.travelTimes,
      }));

      await supabase.from('candidate_locations').insert(candidatesToInsert);
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        roomCode: newRoom.room_code,
        meetingTitle: newRoom.meeting_title,
        participants: participants || [],
        candidates: candidates || [],
        createdAt: newRoom.created_at,
        updatedAt: newRoom.updated_at,
      }
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

    // 1. 방이 존재하는지 확인
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id')
      .eq('room_code', roomCode)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ 
        success: false, 
        error: 'Room not found' 
      }, { status: 404 });
    }

    // 2. 방 정보 업데이트 (meetingTitle이 있으면)
    if (meetingTitle !== undefined) {
      await supabase
        .from('rooms')
        .update({ 
          meeting_title: meetingTitle,
          updated_at: new Date().toISOString()
        })
        .eq('id', room.id);
    } else {
      // meetingTitle이 없어도 updated_at은 갱신
      await supabase
        .from('rooms')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', room.id);
    }

    // 3. 참여자 업데이트 (있으면)
    if (participants !== undefined) {
      // 기존 참여자 모두 삭제
      await supabase
        .from('participants')
        .delete()
        .eq('room_id', room.id);

      // 새 참여자 추가
      if (participants.length > 0) {
        const participantsToInsert = participants.map((p: Participant) => ({
          room_id: room.id,
          name: p.name,
          start_location: {
            address: p.startLocation,
            coordinates: p.coordinates,
          },
          transport_mode: p.transportMode,
        }));

        await supabase.from('participants').insert(participantsToInsert);
      }
    }

    // 4. 후보지 업데이트 (있으면)
    if (candidates !== undefined) {
      // 기존 후보지 모두 삭제
      await supabase
        .from('candidate_locations')
        .delete()
        .eq('room_id', room.id);

      // 새 후보지 추가
      if (candidates.length > 0) {
        const candidatesToInsert = candidates.map((c: CandidateLocation) => ({
          room_id: room.id,
          location_id: c.id,
          name: c.name,
          address: c.address,
          coordinates: c.coordinates,
          travel_times: c.travelTimes,
        }));

        await supabase.from('candidate_locations').insert(candidatesToInsert);
      }
    }

    // 5. 업데이트된 데이터 반환
    const { data: updatedRoom } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', room.id)
      .single();

    const { data: updatedParticipants } = await supabase
      .from('participants')
      .select('*')
      .eq('room_id', room.id);

    const { data: updatedCandidates } = await supabase
      .from('candidate_locations')
      .select('*')
      .eq('room_id', room.id);

    // 데이터 변환
    const participantsList: Participant[] = (updatedParticipants || []).map((p) => {
      const startLocation = p.start_location as { address: string; coordinates: { lat: number; lng: number } };
      return {
        id: p.id,
        name: p.name,
        startLocation: startLocation.address,
        coordinates: startLocation.coordinates,
        transportMode: p.transport_mode,
      };
    });

    const candidatesList: CandidateLocation[] = (updatedCandidates || []).map((c) => ({
      id: c.location_id,
      name: c.name,
      address: c.address,
      coordinates: c.coordinates as { lat: number; lng: number },
      travelTimes: c.travel_times as CandidateLocation['travelTimes'],
    }));

    return NextResponse.json({ 
      success: true, 
      data: {
        roomCode: updatedRoom?.room_code || roomCode,
        meetingTitle: updatedRoom?.meeting_title || meetingTitle,
        participants: participantsList,
        candidates: candidatesList,
        createdAt: updatedRoom?.created_at,
        updatedAt: updatedRoom?.updated_at,
      }
    });
  } catch (error) {
    console.error('방 업데이트 오류:', error);
    return NextResponse.json({ 
      error: 'Failed to update room' 
    }, { status: 500 });
  }
}
