'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'seeyouthere_room_state';

interface RoomStateStorage {
  currentRoomCode: string | null;
  meetingTitle: string;
  isTemporaryMode: boolean;
}

export function useRoomState() {
  const [currentRoomCode, setCurrentRoomCode] = useState<string | null>(null);
  const [meetingTitle, setMeetingTitle] = useState('새로운 모임');
  const [isTemporaryMode, setIsTemporaryMode] = useState(false);
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 로컬 스토리지에서 상태 복원 (마운트 시 한 번만)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: RoomStateStorage = JSON.parse(stored);
        
        // 임시 모드는 새로고침 시 유지하지 않음 (데이터가 없으므로)
        if (parsed.isTemporaryMode) {
          setShowRoomDialog(true);
        } else if (parsed.currentRoomCode) {
          setCurrentRoomCode(parsed.currentRoomCode);
          setMeetingTitle(parsed.meetingTitle || '새로운 모임');
          setIsTemporaryMode(false);
        } else {
          setShowRoomDialog(true);
        }
      } else {
        setShowRoomDialog(true);
      }
    } catch (error) {
      console.error('방 상태 복원 실패:', error);
      setShowRoomDialog(true);
    }
    setIsInitialized(true);
  }, []);

  // 상태 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    if (!isInitialized) return;
    
    const stateToStore: RoomStateStorage = {
      currentRoomCode,
      meetingTitle,
      isTemporaryMode,
    };
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToStore));
    } catch (error) {
      console.error('방 상태 저장 실패:', error);
    }
  }, [currentRoomCode, meetingTitle, isTemporaryMode, isInitialized]);

  const enterTemporaryMode = useCallback(() => {
    setIsTemporaryMode(true);
    setMeetingTitle('임시 테스트');
    setCurrentRoomCode(null);
    setShowRoomDialog(false);
  }, []);

  const enterRoom = useCallback((roomCode: string, title?: string) => {
    setIsTemporaryMode(false);
    setCurrentRoomCode(roomCode);
    if (title) {
      setMeetingTitle(title);
    }
    setShowRoomDialog(false);
  }, []);

  const resetRoom = useCallback(() => {
    setCurrentRoomCode(null);
    setMeetingTitle('새로운 모임');
    setIsTemporaryMode(false);
    // 로컬 스토리지도 정리
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('방 상태 삭제 실패:', error);
    }
  }, []);

  const exitRoom = useCallback(() => {
    resetRoom();
    setShowRoomDialog(true);
  }, [resetRoom]);

  return {
    // State
    currentRoomCode,
    meetingTitle,
    isTemporaryMode,
    showRoomDialog,
    isInitialized,
    
    // Setters
    setCurrentRoomCode,
    setMeetingTitle,
    setIsTemporaryMode,
    setShowRoomDialog,
    
    // Actions
    enterTemporaryMode,
    enterRoom,
    resetRoom,
    exitRoom,
  };
}
