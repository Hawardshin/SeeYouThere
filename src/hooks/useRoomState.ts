'use client';

import { useState, useEffect } from 'react';

export function useRoomState() {
  const [currentRoomCode, setCurrentRoomCode] = useState<string | null>(null);
  const [meetingTitle, setMeetingTitle] = useState('새로운 모임');
  const [isTemporaryMode, setIsTemporaryMode] = useState(false);
  const [showRoomDialog, setShowRoomDialog] = useState(false);

  // 방 코드가 없고 임시 모드가 아니면 방 다이얼로그 표시
  useEffect(() => {
    if (!currentRoomCode && !isTemporaryMode) {
      setShowRoomDialog(true);
    }
  }, [currentRoomCode, isTemporaryMode]);

  const enterTemporaryMode = () => {
    setIsTemporaryMode(true);
    setMeetingTitle('임시 테스트');
    setCurrentRoomCode(null);
    setShowRoomDialog(false);
  };

  const enterRoom = (roomCode: string, title?: string) => {
    setIsTemporaryMode(false);
    setCurrentRoomCode(roomCode);
    if (title) {
      setMeetingTitle(title);
    }
  };

  const resetRoom = () => {
    setCurrentRoomCode(null);
    setMeetingTitle('새로운 모임');
    setIsTemporaryMode(false);
  };

  return {
    // State
    currentRoomCode,
    meetingTitle,
    isTemporaryMode,
    showRoomDialog,
    
    // Setters
    setCurrentRoomCode,
    setMeetingTitle,
    setIsTemporaryMode,
    setShowRoomDialog,
    
    // Actions
    enterTemporaryMode,
    enterRoom,
    resetRoom,
  };
}
