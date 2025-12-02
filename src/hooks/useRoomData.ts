'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
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

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'unsaved';

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // 마지막 저장된 데이터 추적
  const lastSavedDataRef = useRef<string>('');

  // 데이터 변경 감지
  useEffect(() => {
    if (!currentRoomCode || isTemporaryMode || isLoadingData) {
      setHasUnsavedChanges(false);
      return;
    }

    const currentData = JSON.stringify({ participants, candidates, meetingTitle });
    
    if (lastSavedDataRef.current && currentData !== lastSavedDataRef.current) {
      setHasUnsavedChanges(true);
      setSaveStatus('unsaved');
    }
  }, [participants, candidates, meetingTitle, currentRoomCode, isTemporaryMode, isLoadingData]);

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
        
        // 로드된 데이터를 마지막 저장 데이터로 설정
        lastSavedDataRef.current = JSON.stringify({
          participants: data.data.participants || [],
          candidates: data.data.candidates || [],
          meetingTitle: data.data.meetingTitle || '새로운 모임'
        });
        setHasUnsavedChanges(false);
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

  // 명시적 저장
  const saveRoom = useCallback(async (): Promise<boolean> => {
    if (!currentRoomCode || isTemporaryMode) {
      return false;
    }

    setSaveStatus('saving');

    try {
      const titleToSave = meetingTitle === '새로운 모임' ? undefined : meetingTitle;
      
      const response = await fetch('/api/rooms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: currentRoomCode,
          meetingTitle: titleToSave,
          participants,
          candidates,
        }),
      });

      const data = await response.json();

      if (data.success) {
        lastSavedDataRef.current = JSON.stringify({ participants, candidates, meetingTitle });
        setHasUnsavedChanges(false);
        setSaveStatus('saved');
        
        // 3초 후 상태 초기화
        setTimeout(() => {
          setSaveStatus('idle');
        }, 3000);
        
        return true;
      } else {
        setSaveStatus('error');
        return false;
      }
    } catch (error) {
      console.error('저장 실패:', error);
      setSaveStatus('error');
      return false;
    }
  }, [currentRoomCode, isTemporaryMode, meetingTitle, participants, candidates]);

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
      
      if (data.success) {
        // 새 방의 초기 데이터를 저장된 상태로 설정
        lastSavedDataRef.current = JSON.stringify({
          participants: [],
          candidates: [],
          meetingTitle: roomTitle
        });
        setHasUnsavedChanges(false);
        setSaveStatus('idle');
      }
      
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
          
          // 로드된 데이터를 마지막 저장 데이터로 설정
          lastSavedDataRef.current = JSON.stringify({
            participants: data.data.participants || [],
            candidates: data.data.candidates || [],
            meetingTitle: data.data.meetingTitle || '새로운 모임'
          });
          setHasUnsavedChanges(false);
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
    loadRoomData,
    refreshRoom,
    createRoom,
    enterRoom,
    saveRoom,
    saveStatus,
    hasUnsavedChanges,
  };
}
