'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, LogIn, TestTube } from 'lucide-react';

interface RoomEntranceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoomEnter: (roomCode: string, isNew: boolean) => void;
  onTemporaryMode?: () => void;
}

export default function RoomEntranceDialog({ 
  open, 
  onOpenChange, 
  onRoomEnter,
  onTemporaryMode
}: RoomEntranceDialogProps) {
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
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
          meetingTitle: '새로운 모임',
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
        if (data.error === 'Room already exists') {
          handleCreateRoom();
        } else {
          setError('방 생성에 실패했습니다');
        }
      }
    } catch (err) {
      setError('방 생성 중 오류가 발생했습니다');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      setError('방 코드를 입력해주세요');
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
        setError('존재하지 않는 방입니다');
      }
    } catch (err) {
      setError('방 입장 중 오류가 발생했습니다');
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
      <DialogContent className="sm:max-w-md bg-card border-2">
        <DialogHeader>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <DialogTitle className="text-2xl md:text-3xl font-black text-center mb-2">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                ✨ 환영합니다!
              </span>
            </DialogTitle>
            <DialogDescription className="text-center">
              새로운 모임을 시작하거나<br className="md:hidden" /> 기존 방에 입장하세요
            </DialogDescription>
          </motion.div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 새로 만들기 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              새 방 만들기
            </h3>
            <Button 
              onClick={handleCreateRoom} 
              disabled={loading}
              className="w-full py-6 text-lg font-bold"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  새 방 만들기
                </>
              )}
            </Button>
          </motion.div>

          {/* 구분선 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 py-1 text-muted-foreground">또는</span>
            </div>
          </div>

          {/* 입장하기 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <LogIn className="h-4 w-4 text-primary" />
              기존 방 입장
            </h3>
            <div className="space-y-3">
              <Input
                placeholder="방 코드 입력 (예: ABC123)"
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value.toUpperCase());
                  setError('');
                }}
                onKeyPress={handleKeyPress}
                maxLength={6}
                className="text-center text-lg font-bold tracking-widest"
                disabled={loading}
              />
              <Button 
                onClick={handleJoinRoom} 
                disabled={loading || !roomCode.trim()}
                variant="secondary"
                className="w-full py-6 text-lg font-bold"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    입장 중...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    입장하기
                  </>
                )}
              </Button>
            </div>
          </motion.div>

          {/* 에러 메시지 */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-destructive text-center bg-destructive/10 border border-destructive/30 rounded-lg p-3 font-medium"
            >
              {error}
            </motion.div>
          )}

          {/* 임시 모드 */}
          {onTemporaryMode && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-dashed" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-3 py-1 text-muted-foreground">저장하지 않고 테스트</span>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                <Button 
                  onClick={() => {
                    onTemporaryMode();
                    onOpenChange(false);
                  }}
                  variant="outline"
                  className="w-full py-6 text-base font-semibold border-dashed"
                >
                  <TestTube className="mr-2 h-5 w-5" />
                  방 없이 실행해보기
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  💡 저장되지 않으며, 새로고침 시 데이터가 사라집니다
                </p>
              </motion.div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
