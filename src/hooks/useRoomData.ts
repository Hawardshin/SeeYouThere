'use client';

import { useState, useCallback } from 'react';
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

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

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
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  // 방 데이터 저장 (내부용)
  const saveToServer = useCallback(async (
    newParticipants: Participant[],
    newCandidates: CandidateLocation[],
    newTitle?: string
  ): Promise<boolean> => {
    if (!currentRoomCode || isTemporaryMode) {
      return true; // 임시 모드에서는 성공으로 처리
    }

    setSaveStatus('saving');

    try {
      const response = await fetch('/api/rooms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: currentRoomCode,
          meetingTitle: newTitle || meetingTitle,
          participants: newParticipants,
          candidates: newCandidates,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        return true;
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
        return false;
      }
    } catch (error) {
      console.error('저장 실패:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return false;
    }
  }, [currentRoomCode, isTemporaryMode, meetingTitle]);

  // 참여자 추가 (즉시 저장)
  const addParticipant = useCallback(async (participant: Participant): Promise<boolean> => {
    const newParticipants = [...participants, participant];
    setParticipants(newParticipants);
    return saveToServer(newParticipants, candidates);
  }, [participants, candidates, setParticipants, saveToServer]);

  // 참여자 삭제 (즉시 저장)
  const removeParticipant = useCallback(async (participantId: string): Promise<boolean> => {
    const newParticipants = participants.filter(p => p.id !== participantId);
    setParticipants(newParticipants);
    return saveToServer(newParticipants, candidates);
  }, [participants, candidates, setParticipants, saveToServer]);

  // 참여자 수정 (즉시 저장)
  const updateParticipant = useCallback(async (participantId: string, updates: Partial<Participant>): Promise<boolean> => {
    const newParticipants = participants.map(p => 
      p.id === participantId ? { ...p, ...updates } : p
    );
    setParticipants(newParticipants);
    return saveToServer(newParticipants, candidates);
  }, [participants, candidates, setParticipants, saveToServer]);

  // 후보지 추가 (즉시 저장)
  const addCandidate = useCallback(async (candidate: CandidateLocation): Promise<boolean> => {
    const newCandidates = [...candidates, candidate];
    setCandidates(newCandidates);
    return saveToServer(participants, newCandidates);
  }, [participants, candidates, setCandidates, saveToServer]);

  // 후보지 삭제 (즉시 저장)
  const removeCandidate = useCallback(async (candidateId: string): Promise<boolean> => {
    const newCandidates = candidates.filter(c => c.id !== candidateId);
    setCandidates(newCandidates);
    return saveToServer(participants, newCandidates);
  }, [participants, candidates, setCandidates, saveToServer]);

  // 모든 후보지 삭제 (즉시 저장)
  const clearCandidates = useCallback(async (): Promise<boolean> => {
    setCandidates([]);
    return saveToServer(participants, []);
  }, [participants, setCandidates, saveToServer]);

  // 방 데이터 로드
  const loadRoomData = useCallback(async (roomCode: string) => {
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
        setSaveStatus('idle');
        
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
  }, [setMeetingTitle, setParticipants, setCandidates]);

  // 방 새로고침
  const refreshRoom = useCallback(async () => {
    if (currentRoomCode) {
      await loadRoomData(currentRoomCode);
    }
  }, [currentRoomCode, loadRoomData]);

  // 방 생성
  const createRoom = useCallback(async (roomCode: string, roomTitle: string, password?: string) => {
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
  }, []);

  // 방 입장
  const enterRoom = useCallback(async (roomCode: string, password?: string) => {
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
          setSaveStatus('idle');
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
  }, [loadRoomData, setMeetingTitle, setParticipants, setCandidates]);

  return {
    isLoadingData,
    saveStatus,
    
    // 방 관리
    loadRoomData,
    refreshRoom,
    createRoom,
    enterRoom,
    
    // 참여자 즉시 저장 액션
    addParticipant,
    removeParticipant,
    updateParticipant,
    
    // 후보지 즉시 저장 액션
    addCandidate,
    removeCandidate,
    clearCandidates,
  };
}
