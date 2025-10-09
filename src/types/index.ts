// 참여자 정보
export interface Participant {
  id: string;
  name: string;
  startLocation: string; // 출발지 주소
  coordinates: {
    lat: number;
    lng: number;
  };
  transportMode: 'car' | 'transit'; // 교통수단 (기본: transit)
}

// 후보 장소 정보
export interface CandidateLocation {
  id: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  travelTimes: TravelTime[]; // 각 참여자별 소요시간
}

// 소요시간 정보
export interface TravelTime {
  participantId: string;
  participantName: string;
  duration: number; // 분 단위
  distance?: number; // 미터 단위
}

// 장소별 통계
export interface LocationStats {
  locationId: string;
  locationName: string;
  totalTime: number; // 총 소요시간 합계
  maxTime: number; // 최대 소요시간
  minTime: number; // 최소 소요시간
  avgTime: number; // 평균 소요시간
  fairnessScore: number; // 공평성 점수 (낮을수록 공평)
  timeDifference: number; // 최대-최소 시간 차이 (균형성)
}

// 모임 정보
export interface Meeting {
  id: string;
  title: string;
  participants: Participant[];
  candidates: CandidateLocation[];
  createdAt: Date;
}

// 방 정보 (서버 저장용)
export interface Room {
  roomCode: string;
  meetingTitle: string;
  participants: Participant[];
  candidates: CandidateLocation[];
  password?: string; // 비밀번호 (선택사항)
  createdBy?: string; // 생성자 이름
  createdAt: string;
  updatedAt: string;
}

// 방 목록 아이템
export interface RoomListItem {
  roomCode: string;
  meetingTitle: string;
  participantCount: number;
  candidateCount: number;
  hasPassword: boolean;
  createdBy?: string;
  updatedAt: string;
}

// 추천 타입
export type RecommendationType = 'fairest' | 'fastest';
