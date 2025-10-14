'use client';

import { useState, useEffect } from 'react';
import { Participant, CandidateLocation } from '@/types';

interface UseRoomDataParams {
  currentRoomCode: string | null;
  isTemporaryMode: boolean;
  participants: Participant[];
  candidates: CandidateLocation[];
  meetingTitle: string;
  setParticipants: (participants: Participant[]) => void;
  setCandidates: (candidates: CandidateLocation[]) => void;
  setMeetingTitle: (title: string) => void;
}

export function useRoomData({
  currentRoomCode,
  isTemporaryMode,
  participants,
  candidates,
  meetingTitle,
  setParticipants,
  setCandidates,
  setMeetingTitle,
}: UseRoomDataParams) {
  const [isLoadingData, setIsLoadingData] = useState(false);

  // 방 데이터 로드
  const loadRoomData = async (roomCode: string) => {
    try {
      setIsLoadingData(true);
      const response = await fetch(`/api/rooms?roomCode=${roomCode}`);
      const data = await response.json();

      console.log('📦 방 데이터 로드:', data);

      if (data.success) {
        if (data.data.meetingTitle) {
          setMeetingTitle(data.data.meetingTitle);
        }
        setParticipants(data.data.participants || []);
        setCandidates(data.data.candidates || []);
        
        console.log('✅ 참여자:', data.data.participants?.length || 0);
        console.log('✅ 후보지:', data.data.candidates?.length || 0);
      } else {
        console.error('❌ 방 데이터 로드 실패:', data.error);
      }
    } catch (error) {
      console.error('❌ 방 데이터 로드 에러:', error);
    } finally {
      setTimeout(() => setIsLoadingData(false), 500);
    }
  };

  // 방 새로고침
  const refreshRoom = async () => {
    if (currentRoomCode) {
      await loadRoomData(currentRoomCode);
    }
  };

  // 방 생성
  const createRoom = async (roomCode: string, roomTitle: string, password?: string) => {
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          meetingTitle: roomTitle,
          password,
        }),
      });

      const data = await response.json();
      return { success: data.success, error: data.error };
    } catch (error) {
      console.error('방 생성 오류:', error);
      return { success: false, error: '방 생성 중 오류가 발생했습니다.' };
    }
  };

  // 방 입장
  const enterRoom = async (roomCode: string, password?: string) => {
    try {
      if (password !== undefined) {
        const response = await fetch('/api/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode,
            verifyPassword: password,
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          setMeetingTitle(data.data.meetingTitle);
          setParticipants(data.data.participants || []);
          setCandidates(data.data.candidates || []);
          return { success: true, data: data.data };
        }
        return { success: false };
      } else {
        await loadRoomData(roomCode);
        return { success: true };
      }
    } catch (error) {
      console.error('방 입장 오류:', error);
      return { success: false };
    }
  };

  // 자동 저장
  useEffect(() => {
    if (currentRoomCode && !isLoadingData && !isTemporaryMode && (participants.length > 0 || candidates.length > 0)) {
      const timer = setTimeout(() => {
        const titleToSave = meetingTitle === '새로운 모임' ? undefined : meetingTitle;
        
        fetch('/api/rooms', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode: currentRoomCode,
            meetingTitle: titleToSave,
            participants,
            candidates,
          }),
        }).catch(error => console.error('저장 실패:', error));
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [participants, candidates, meetingTitle, currentRoomCode, isLoadingData, isTemporaryMode]);

  return {
    isLoadingData,
    loadRoomData,
    refreshRoom,
    createRoom,
    enterRoom,
  };
}
