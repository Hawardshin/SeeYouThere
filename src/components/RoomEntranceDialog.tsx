'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface RoomEntranceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoomEnter: (roomCode: string, isNew: boolean) => void;
}

export default function RoomEntranceDialog({ 
  open, 
  onOpenChange, 
  onRoomEnter 
}: RoomEntranceDialogProps) {
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 혼동되는 문자 제외
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateRoom = async () => {
    setLoading(true);
    setError('');
    
    const newCode = generateRoomCode();
    
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomCode: newCode,
          meetingTitle: '새로운 작전',
          participants: [],
          candidates: []
        }),
      });

      const data = await response.json();

      if (data.success) {
        onRoomEnter(newCode, true);
        setRoomCode('');
        onOpenChange(false);
      } else {
        // 코드 충돌 시 재시도
        if (data.error === 'Room already exists') {
          handleCreateRoom(); // 재귀적으로 다시 시도
        } else {
          setError('작전실 생성에 실패했습니다');
        }
      }
    } catch (err) {
      setError('작전실 생성 중 오류가 발생했습니다');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      setError('코드명을 입력해주세요');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/rooms?roomCode=${roomCode.toUpperCase()}`);
      const data = await response.json();

      if (data.success) {
        onRoomEnter(roomCode.toUpperCase(), false);
        setRoomCode('');
        onOpenChange(false);
      } else {
        setError('존재하지 않는 작전실입니다');
      }
    } catch (err) {
      setError('작전실 입장 중 오류가 발생했습니다');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      handleJoinRoom();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold uppercase">작전실 입장</DialogTitle>
          <DialogDescription>
            새로운 작전실을 생성하거나 기존 작전실에 입장하세요
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 새로 만들기 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase">새 작전실 생성</h3>
            <Button 
              onClick={handleCreateRoom} 
              disabled={loading}
              className="w-full uppercase"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                '새 코드명 생성'
              )}
            </Button>
          </div>

          {/* 구분선 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">또는</span>
            </div>
          </div>

          {/* 입장하기 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase">기존 작전실 입장</h3>
            <div className="flex gap-2">
              <Input
                placeholder="코드명 입력 (예: ABC123)"
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value.toUpperCase());
                  setError('');
                }}
                onKeyPress={handleKeyPress}
                maxLength={6}
                className="uppercase"
                disabled={loading}
              />
              <Button 
                onClick={handleJoinRoom} 
                disabled={loading || !roomCode.trim()}
                className="uppercase"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  '입장'
                )}
              </Button>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="text-sm text-red-500 mt-2">
              {error}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
