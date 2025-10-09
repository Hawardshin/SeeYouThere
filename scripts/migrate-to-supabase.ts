import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Participant {
  id: string;
  name: string;
  startLocation: string;
  coordinates: { lat: number; lng: number };
  transportMode: 'car' | 'transit';
}

interface CandidateLocation {
  id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  travelTimes: Array<{
    participantId: string;
    participantName: string;
    duration: number;
    distance?: number;
  }>;
}

interface RoomData {
  roomCode: string;
  meetingTitle: string;
  participants: Participant[];
  candidates: CandidateLocation[];
  password?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

async function migrateData() {
  const ROOMS_DIR = path.join(process.cwd(), 'data', 'rooms');
  
  try {
    const files = await fs.readdir(ROOMS_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    console.log(`📁 발견된 방 데이터: ${jsonFiles.length}개`);

    for (const file of jsonFiles) {
      const filePath = path.join(ROOMS_DIR, file);
      const data = await fs.readFile(filePath, 'utf-8');
      const roomData: RoomData = JSON.parse(data);

      console.log(`\n🔄 마이그레이션 중: ${roomData.roomCode}`);

      // 1. 방이 이미 존재하는지 확인
      const { data: existingRoom } = await supabase
        .from('rooms')
        .select('id')
        .eq('room_code', roomData.roomCode)
        .single();

      let roomId: string;

      if (existingRoom) {
        console.log(`  ⏭️  이미 존재하는 방: ${roomData.roomCode}`);
        roomId = existingRoom.id;
      } else {
        // 2. 방 생성
        const { data: newRoom, error: roomError } = await supabase
          .from('rooms')
          .insert({
            room_code: roomData.roomCode,
            meeting_title: roomData.meetingTitle,
            password: roomData.password || null,
            created_at: roomData.createdAt,
            updated_at: roomData.updatedAt,
          })
          .select()
          .single();

        if (roomError) {
          console.error(`  ❌ 방 생성 실패:`, roomError);
          continue;
        }

        roomId = newRoom.id;
        console.log(`  ✅ 방 생성 완료: ${roomData.roomCode}`);
      }

      // 3. 기존 참여자/후보지 삭제 (재실행 시 중복 방지)
      await supabase.from('participants').delete().eq('room_id', roomId);
      await supabase.from('candidate_locations').delete().eq('room_id', roomId);

      // 4. 참여자 추가
      if (roomData.participants && roomData.participants.length > 0) {
        const participantsToInsert = roomData.participants.map(p => ({
          id: p.id, // 기존 ID 유지
          room_id: roomId,
          name: p.name,
          start_location: {
            address: p.startLocation,
            coordinates: p.coordinates,
          },
          transport_mode: p.transportMode,
        }));

        const { error: pError } = await supabase
          .from('participants')
          .insert(participantsToInsert);

        if (pError) {
          console.error(`  ❌ 참여자 추가 실패:`, pError);
        } else {
          console.log(`  ✅ 참여자 ${roomData.participants.length}명 추가`);
        }
      }

      // 5. 후보지 추가
      if (roomData.candidates && roomData.candidates.length > 0) {
        const candidatesToInsert = roomData.candidates.map(c => ({
          id: c.id, // 기존 ID 유지
          room_id: roomId,
          location_id: c.id,
          name: c.name,
          address: c.address,
          coordinates: c.coordinates,
          travel_times: c.travelTimes,
        }));

        const { error: cError } = await supabase
          .from('candidate_locations')
          .insert(candidatesToInsert);

        if (cError) {
          console.error(`  ❌ 후보지 추가 실패:`, cError);
        } else {
          console.log(`  ✅ 후보지 ${roomData.candidates.length}개 추가`);
        }
      }

      console.log(`  🎉 ${roomData.roomCode} 마이그레이션 완료!`);
    }

    console.log(`\n✨ 전체 마이그레이션 완료! (${jsonFiles.length}개 방)`);
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
  }
}

// 실행
migrateData();
