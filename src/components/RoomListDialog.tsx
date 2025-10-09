'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { RoomListItem } from '@/types';
import { 
  Users, 
  MapPin, 
  Lock, 
  LockOpen, 
  Plus, 
  RefreshCw,
  Clock,
  Search
} from 'lucide-react';

interface RoomListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoomEnter: (roomCode: string, password?: string) => Promise<boolean>;
  onRoomCreate: (roomCode: string, createdBy: string, password?: string) => Promise<boolean>;
  currentRoomCode?: string | null;
}

export default function RoomListDialog({
  open,
  onOpenChange,
  onRoomEnter,
  onRoomCreate,
  currentRoomCode
}: RoomListDialogProps) {
  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 방 생성 폼
  const [newRoomCode, setNewRoomCode] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // 비밀번호 입력
  const [selectedRoom, setSelectedRoom] = useState<RoomListItem | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // 방 목록 불러오기
  const loadRooms = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/rooms?list=true');
      const data = await response.json();
      if (data.success) {
        setRooms(data.data);
      }
    } catch (error) {
      console.error('방 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && mode === 'list') {
      loadRooms();
    }
  }, [open, mode]);

  // 방 코드 자동 생성
  const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewRoomCode(code);
  };

  // 방 생성 처리
  const handleCreate = async () => {
    if (!newRoomCode || !createdBy) {
      alert('방 코드와 생성자 이름을 입력해주세요!');
      return;
    }

    const success = await onRoomCreate(newRoomCode, createdBy, newPassword || undefined);
    if (success) {
      setNewRoomCode('');
      setCreatedBy('');
      setNewPassword('');
      setMode('list');
    }
  };

  // 방 입장 처리
  const handleEnter = async (room: RoomListItem) => {
    if (room.hasPassword) {
      setSelectedRoom(room);
      setPasswordInput('');
      setPasswordError('');
    } else {
      const success = await onRoomEnter(room.roomCode);
      if (success) {
        onOpenChange(false);
      }
    }
  };

  // 비밀번호로 입장
  const handleEnterWithPassword = async () => {
    if (!selectedRoom) return;

    const success = await onRoomEnter(selectedRoom.roomCode, passwordInput);
    if (success) {
      setSelectedRoom(null);
      setPasswordInput('');
      onOpenChange(false);
    } else {
      setPasswordError('비밀번호가 올바르지 않습니다.');
    }
  };

  // 필터링된 방 목록
  const filteredRooms = rooms.filter(room =>
    room.roomCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.meetingTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.createdBy?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 시간 포맷팅
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return '방금 전';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {mode === 'list' ? '🏠 방 목록' : '➕ 새 방 만들기'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'list' 
              ? '참여할 방을 선택하거나 새로운 방을 만드세요'
              : '새로운 모임 방을 생성합니다'
            }
          </DialogDescription>
        </DialogHeader>

        {/* 비밀번호 입력 모달 */}
        {selectedRoom && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
            <Card className="p-6 w-80">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5" />
                비밀번호 입력
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                &ldquo;{selectedRoom.meetingTitle}&rdquo; 방에 입장하려면 비밀번호를 입력하세요
              </p>
              <Input
                type="password"
                placeholder="비밀번호"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleEnterWithPassword()}
                className="mb-2"
              />
              {passwordError && (
                <p className="text-sm text-destructive mb-4">{passwordError}</p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedRoom(null);
                    setPasswordInput('');
                    setPasswordError('');
                  }}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handleEnterWithPassword}
                  className="flex-1"
                >
                  입장
                </Button>
              </div>
            </Card>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          {mode === 'list' ? (
            <div className="space-y-4">
              {/* 검색 및 새로고침 */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="방 코드, 제목, 생성자 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={loadRooms}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {/* 방 목록 */}
              <div className="space-y-2">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                    불러오는 중...
                  </div>
                ) : filteredRooms.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? '검색 결과가 없습니다' : '아직 생성된 방이 없습니다'}
                  </div>
                ) : (
                  filteredRooms.map((room) => (
                    <Card
                      key={room.roomCode}
                      className={`p-4 cursor-pointer transition-all hover:border-primary ${
                        currentRoomCode === room.roomCode ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => handleEnter(room)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-lg">{room.meetingTitle}</h3>
                            {room.hasPassword && (
                              <Badge variant="outline" className="text-xs">
                                <Lock className="h-3 w-3 mr-1" />
                                비밀
                              </Badge>
                            )}
                            {currentRoomCode === room.roomCode && (
                              <Badge className="text-xs">현재 방</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <span className="font-mono font-bold text-primary">
                                {room.roomCode}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {room.participantCount}명
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {room.candidateCount}곳
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            {room.createdBy && (
                              <span>생성: {room.createdBy}</span>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(room.updatedAt)}
                            </div>
                          </div>
                        </div>
                        {room.hasPassword ? (
                          <LockOpen className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <div className="h-5 w-5" />
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  방 코드 <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="6자리 코드"
                    value={newRoomCode}
                    onChange={(e) => setNewRoomCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={generateRoomCode}
                  >
                    자동생성
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  생성자 이름 <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="내 이름"
                  value={createdBy}
                  onChange={(e) => setCreatedBy(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  비밀번호 (선택)
                </label>
                <Input
                  type="password"
                  placeholder="비밀번호 없이 만들려면 비워두세요"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  비밀번호를 설정하면 다른 사람이 임의로 입장할 수 없습니다
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          {mode === 'list' ? (
            <>
              <Button
                variant="outline"
                onClick={() => setMode('create')}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                새 방 만들기
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setMode('list')}
                className="flex-1"
              >
                목록으로
              </Button>
              <Button
                onClick={handleCreate}
                className="flex-1"
              >
                방 만들기
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
