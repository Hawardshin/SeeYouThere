'use client';

import { useState, useEffect } from 'react';
import { Participant, CandidateLocation } from '@/types';
import ParticipantManager from '@/components/ParticipantManager';
import LocationManager from '@/components/LocationManager';
import ResultsDisplay from '@/components/ResultsDisplay';
import ShareDialog from '@/components/ShareDialog';
import RoomEntranceDialog from '@/components/RoomEntranceDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { LogOut, Users, Copy, Check } from 'lucide-react';

export default function Home() {
  const [meetingTitle, setMeetingTitle] = useState('새로운 작전');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [candidates, setCandidates] = useState<CandidateLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  
  // 방 관련 상태
  const [currentRoomCode, setCurrentRoomCode] = useState<string | null>(null);
  const [showRoomDialog, setShowRoomDialog] = useState(true);
  const [copied, setCopied] = useState(false);

  // 방 데이터 로드
  const loadRoomData = async (roomCode: string) => {
    try {
      const response = await fetch(`/api/rooms?roomCode=${roomCode}`);
      const data = await response.json();

      if (data.success) {
        setMeetingTitle(data.data.meetingTitle || '새로운 작전');
        setParticipants(data.data.participants || []);
        setCandidates(data.data.candidates || []);
      }
    } catch (error) {
      console.error('방 데이터 로드 실패:', error);
    }
  };

  // 방 입장 처리
  const handleRoomEnter = async (roomCode: string, isNew: boolean) => {
    setCurrentRoomCode(roomCode);
    if (!isNew) {
      await loadRoomData(roomCode);
    }
  };

  // 방 나가기
  const handleLeaveRoom = () => {
    setCurrentRoomCode(null);
    setMeetingTitle('새로운 작전');
    setParticipants([]);
    setCandidates([]);
    setShowRoomDialog(true);
  };

  // 코드 복사
  const handleCopyCode = async () => {
    if (currentRoomCode) {
      await navigator.clipboard.writeText(currentRoomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 자동 저장 (참여자, 후보지, 제목 변경 시)
  useEffect(() => {
    if (currentRoomCode) {
      const timer = setTimeout(() => {
        // 방 데이터 저장
        fetch('/api/rooms', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode: currentRoomCode,
            meetingTitle,
            participants,
            candidates,
          }),
        }).catch(error => console.error('방 데이터 저장 실패:', error));
      }, 1000); // 1초 디바운스

      return () => clearTimeout(timer);
    }
  }, [participants, candidates, meetingTitle, currentRoomCode]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* 방 입장 다이얼로그 */}
      <RoomEntranceDialog
        open={showRoomDialog && !currentRoomCode}
        onOpenChange={setShowRoomDialog}
        onRoomEnter={handleRoomEnter}
      />

      <div className="max-w-7xl mx-auto">
        {/* 헤더 - 진격의 거인 스타일 */}
        <div className="mb-8 text-center relative">
          <div className="absolute inset-0 bg-primary/5 rounded-2xl -z-10 transform -rotate-1"></div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-3 tracking-wider uppercase drop-shadow-lg">
            ⚔️ SeeYouThere
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-medium">
            모두에게 공평한 약속 장소를 찾아드립니다
          </p>
          <div className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span className="inline-block w-12 h-0.5 bg-primary"></span>
            <span>전략적 회합 지점 분석 시스템</span>
            <span className="inline-block w-12 h-0.5 bg-primary"></span>
          </div>
        </div>

        {/* 방 정보 표시 */}
        {currentRoomCode && (
          <Card className="mb-6 border-2 shadow-lg bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-lg tracking-widest">
                      {currentRoomCode}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyCode}
                      className="gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          복사됨
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          복사
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      병력 {participants.length}명
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleLeaveRoom}
                  className="gap-2 uppercase"
                >
                  <LogOut className="h-4 w-4" />
                  작전실 나가기
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 모임 제목 */}
        <Card className="mb-6 border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-xl font-bold tracking-wide uppercase">📋 작전명</CardTitle>
            <CardDescription className="text-base">이번 회합의 코드명을 입력하세요</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <input
              type="text"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground font-medium transition-all duration-200"
              placeholder="예: 조사병단 회식"
              disabled={!currentRoomCode}
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 참여자 관리 */}
          <ParticipantManager
            participants={participants}
            onParticipantsChange={setParticipants}
          />

          {/* 후보지 관리 */}
          <LocationManager
            participants={participants}
            candidates={candidates}
            onCandidatesChange={setCandidates}
            selectedLocationId={selectedLocationId}
            onLocationSelect={setSelectedLocationId}
          />
        </div>

        <Separator className="my-8" />

        {/* 결과 표시 및 추천 */}
        <ResultsDisplay
          candidates={candidates}
          selectedLocationId={selectedLocationId}
        />

        {/* 공유 버튼 */}
        {candidates.length > 0 && (
          <div className="mt-6 flex justify-center">
            <ShareDialog
              meetingTitle={meetingTitle}
              participants={participants}
              candidates={candidates}
            />
          </div>
        )}
      </div>
    </div>
  );
}
