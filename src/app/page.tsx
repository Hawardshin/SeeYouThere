'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ParticipantManager from '@/components/ParticipantManager';
import LocationManager from '@/components/LocationManager';
import ResultsDisplay from '@/components/ResultsDisplay';
import ParticipantAnalysis from '@/components/ParticipantAnalysis';
import ShareDialog from '@/components/ShareDialog';
import RoomListDialog from '@/components/RoomListDialog';
import ThemeToggle from '@/components/ThemeToggle';
import AlertModal, { useAlertModal } from '@/components/AlertModal';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, Users, MapPin, Sparkles, List, TestTube, Check, AlertCircle, Loader2, RefreshCw, Share2 } from 'lucide-react';
import { useRoomState } from '@/hooks/useRoomState';
import { useParticipants } from '@/hooks/useParticipants';
import { useCandidates } from '@/hooks/useCandidates';
import { useRoomData, SaveStatus } from '@/hooks/useRoomData';

// 저장 상태 표시 컴포넌트 (간소화 - 저장 중/완료/에러만 표시)
function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  if (status === 'saving') {
    return (
      <div className="flex items-center gap-1 text-xs text-blue-500">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>저장 중...</span>
      </div>
    );
  }
  
  if (status === 'saved') {
    return (
      <div className="flex items-center gap-1 text-xs text-green-500">
        <Check className="h-3 w-3" />
        <span>저장됨</span>
      </div>
    );
  }
  
  if (status === 'error') {
    return (
      <div className="flex items-center gap-1 text-xs text-red-500">
        <AlertCircle className="h-3 w-3" />
        <span>저장 실패</span>
      </div>
    );
  }
  
  return null;
}


export default function Home() {
  // Custom Hooks
  const roomState = useRoomState();
  const participantsState = useParticipants();
  const candidatesState = useCandidates();
  const searchParams = useSearchParams();
  
  const { alertState, showAlert, closeAlert } = useAlertModal();
  const [departureTime, setDepartureTime] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [resultView, setResultView] = useState<'overview' | 'individual'>('overview');
  const [isJoiningFromUrl, setIsJoiningFromUrl] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Room Data Hook
  const roomData = useRoomData({
    currentRoomCode: roomState.currentRoomCode,
    isTemporaryMode: roomState.isTemporaryMode,
    participants: participantsState.participants,
    candidates: candidatesState.candidates,
    meetingTitle: roomState.meetingTitle,
    setParticipants: participantsState.setParticipants,
    setCandidates: candidatesState.setCandidates,
    setMeetingTitle: roomState.setMeetingTitle,
  });

  useEffect(() => {
    if (!departureTime) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const year = tomorrow.getFullYear();
      const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const day = String(tomorrow.getDate()).padStart(2, '0');
      setDepartureTime(`${year}-${month}-${day}T13:00`);
    }
  }, [departureTime]);

  // 새로고침 시 방 데이터 자동 로드
  useEffect(() => {
    if (roomState.isInitialized && roomState.currentRoomCode && !roomState.isTemporaryMode) {
      console.log('🔄 새로고침 감지, 방 데이터 로드:', roomState.currentRoomCode);
      roomData.loadRoomData(roomState.currentRoomCode);
    }
  }, [roomState.isInitialized, roomState.currentRoomCode, roomState.isTemporaryMode]);

  // URL 쿼리 파라미터로 방 자동 입장 (?room=XXXX&step=3)
  useEffect(() => {
    const roomCode = searchParams.get('room');
    const stepParam = searchParams.get('step');
    
    if (roomCode && roomState.isInitialized && !isJoiningFromUrl) {
      // 이미 해당 방에 있으면 스텝만 변경
      if (roomState.currentRoomCode === roomCode) {
        if (stepParam) {
          const step = parseInt(stepParam);
          if (step >= 1 && step <= 3) {
            setCurrentStep(step);
          }
        }
        // URL에서 쿼리 파라미터 제거 (깔끔하게)
        window.history.replaceState({}, '', '/');
        return;
      }
      
      // 다른 방이면 자동 입장 시도
      setIsJoiningFromUrl(true);
      console.log('🔗 URL에서 방 코드 감지:', roomCode);
      
      (async () => {
        try {
          const response = await fetch(`/api/rooms?roomCode=${roomCode}`);
          const data = await response.json();
          
          if (data.success) {
            // 비밀번호가 없는 방이면 자동 입장
            if (!data.data.hasPassword) {
              roomState.enterRoom(roomCode, data.data.meetingTitle || '공유된 모임');
              participantsState.setParticipants(data.data.participants || []);
              candidatesState.setCandidates(data.data.candidates || []);
              
              // step 파라미터가 있으면 해당 스텝으로 이동
              if (stepParam) {
                const step = parseInt(stepParam);
                if (step >= 1 && step <= 3) {
                  setCurrentStep(step);
                }
              } else if (data.data.candidates?.length > 0) {
                // 후보지가 있으면 결과 페이지로
                setCurrentStep(3);
              }
              
              showAlert(`"${data.data.meetingTitle || roomCode}" 방에 입장했습니다!`, { variant: 'success' });
            } else {
              // 비밀번호가 있는 방이면 방 목록 다이얼로그 열기
              showAlert('비밀번호가 설정된 방입니다. 방 목록에서 입장해주세요.', { variant: 'warning' });
              roomState.setShowRoomDialog(true);
            }
          } else {
            showAlert('존재하지 않는 방입니다.', { variant: 'error' });
            roomState.enterTemporaryMode();
          }
        } catch (error) {
          console.error('방 입장 실패:', error);
          showAlert('방 입장에 실패했습니다.', { variant: 'error' });
          roomState.enterTemporaryMode();
        } finally {
          // URL에서 쿼리 파라미터 제거
          window.history.replaceState({}, '', '/');
          setIsJoiningFromUrl(false);
        }
      })();
    }
  }, [searchParams, roomState.isInitialized, isJoiningFromUrl]);

  // 방 생성 핸들러
  const handleRoomCreate = async (roomCode: string, roomTitle: string, password?: string) => {
    const result = await roomData.createRoom(roomCode, roomTitle, password);
    
    if (result.success) {
      roomState.enterRoom(roomCode, roomTitle);
      participantsState.clearParticipants();
      candidatesState.clearCandidates();
      return true;
    } else {
      showAlert(
        result.error === 'Room already exists' ? '이미 존재하는 방 코드입니다.' : '방 생성에 실패했습니다.',
        { variant: 'error' }
      );
      return false;
    }
  };

  // 방 입장 핸들러
  const handleRoomEnter = async (roomCode: string, password?: string) => {
    const result = await roomData.enterRoom(roomCode, password);
    
    if (result.success) {
      roomState.enterRoom(roomCode, result.data?.meetingTitle);
      return true;
    }
    return false;
  };

  // 임시 모드 진입
  const handleTemporaryMode = () => {
    roomState.enterTemporaryMode();
    participantsState.clearParticipants();
    candidatesState.clearCandidates();
    setCurrentStep(1);
  };

  // 방 입장 전 확인
  const handleRoomEnterWithConfirm = async (roomCode: string, password?: string) => {
    return handleRoomEnter(roomCode, password);
  };

  // 다음 단계로
  const handleNext = () => {
    if (currentStep === 1 && participantsState.participants.length === 0) {
      showAlert('최소 1명의 참여자를 추가해주세요!', { variant: 'warning' });
      return;
    }
    if (currentStep === 2 && candidatesState.candidates.length === 0) {
      showAlert('최소 1개의 후보 장소를 추가해주세요!', { variant: 'warning' });
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  // 스텝 정보
  const steps = [
    { number: 1, title: '참여자', icon: Users, desc: '누가 참여하나요?' },
    { number: 2, title: '장소', icon: MapPin, desc: '어디서 만날까요?' },
    { number: 3, title: '결과', icon: Sparkles, desc: '최적의 장소는?' },
  ];

  // 초기화 중이거나 데이터 로딩 중일 때 로딩 표시
  if (!roomState.isInitialized || (roomState.currentRoomCode && roomData.isLoadingData)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">잠시만 기다려주세요</p>
            <p className="text-sm text-muted-foreground mt-1">
              {roomState.currentRoomCode ? '방 데이터를 불러오는 중...' : '초기화 중...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* 방 목록 다이얼로그 */}
      <RoomListDialog
        open={roomState.showRoomDialog}
        onOpenChange={(open) => {
          // 다이얼로그가 닫힐 때, 방도 없고 임시모드도 아니면 임시모드로 진입
          if (!open && !roomState.currentRoomCode && !roomState.isTemporaryMode) {
            roomState.enterTemporaryMode();
          } else {
            roomState.setShowRoomDialog(open);
          }
        }}
        onRoomEnter={handleRoomEnterWithConfirm}
        onRoomCreate={handleRoomCreate}
        currentRoomCode={roomState.currentRoomCode}
        onTemporaryMode={handleTemporaryMode}
      />

      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 md:mb-12 relative"
        >
          {/* 방 목록 버튼 - 좌측 상단 */}
          <div className="absolute top-0 left-0">
            <Button
              variant="outline"
              size="icon"
              onClick={() => roomState.setShowRoomDialog(true)}
              className="hover:bg-primary/10"
            >
              <List className="h-5 w-5" />
            </Button>
          </div>

          {/* 테마 토글 버튼 - 우측 상단 */}
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black mb-3 md:mb-4">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              SeeYouThere
            </span>
          </h1>
          <p className="text-base md:text-xl text-muted-foreground mb-2">
            모두에게 공평한 만남의 장소 찾기
          </p>
          {roomState.isTemporaryMode && (
            <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-orange-500/10 border-2 border-orange-500/30 rounded-full">
              <TestTube className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-bold text-orange-500">임시 모드 (저장되지 않음)</span>
            </div>
          )}
          {roomState.currentRoomCode && !roomState.isTemporaryMode && (
            <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mt-3 px-4 py-2 bg-accent rounded-xl border">
              <span className="text-sm font-semibold text-foreground">{roomState.meetingTitle}</span>
              <div className="hidden sm:block h-4 w-px bg-border"></div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">방 코드:</span>
                <span className="font-bold text-primary">{roomState.currentRoomCode}</span>
              </div>
              {/* 저장 상태 표시 */}
              <SaveStatusIndicator status={roomData.saveStatus} />
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 md:mb-12"
        >
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentStep(step.number)}
                      className={`
                        w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center cursor-pointer
                        transition-all duration-300 mb-2 border-2
                        ${isActive ? 'bg-gradient-to-r from-primary to-secondary shadow-lg scale-110 border-primary' : ''}
                        ${isCompleted ? 'bg-primary/20 border-primary' : ''}
                        ${!isActive && !isCompleted ? 'bg-muted/30 border-border' : ''}
                      `}
                    >
                      <Icon className={`w-5 h-5 md:w-7 md:h-7 ${isActive ? 'text-primary-foreground' : isCompleted ? 'text-primary' : 'text-muted-foreground'}`} />
                    </motion.div>
                    <span className={`text-xs md:text-sm font-bold hidden md:block ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.title}
                    </span>
                    <span className={`text-xs text-muted-foreground hidden lg:block transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                      {step.desc}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 transition-all duration-300 ${
                      currentStep > step.number ? 'bg-primary' : 'bg-border'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* 스텝별 컨텐츠 - AnimatePresence로 부드러운 전환 */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <ParticipantManager
                participants={participantsState.participants}
                onAddParticipant={roomData.addParticipant}
                onRemoveParticipant={roomData.removeParticipant}
                onUpdateParticipant={roomData.updateParticipant}
                candidatesCount={candidatesState.candidates.length}
                onClearCandidates={roomData.clearCandidates}
              />
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <LocationManager
                participants={participantsState.participants}
                candidates={candidatesState.candidates}
                onAddCandidate={roomData.addCandidate}
                onRemoveCandidate={roomData.removeCandidate}
                selectedLocationId={candidatesState.selectedLocationId}
                onLocationSelect={candidatesState.setSelectedLocationId}
                departureTime={departureTime}
                onDepartureTimeChange={setDepartureTime}
              />
            </motion.div>
          )}

                      {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-6">
                {/* 뷰 전환 토글 버튼 */}
                {candidatesState.candidates.length > 0 && participantsState.participants.length > 0 && (
                  <div className="flex justify-center">
                    <div className="inline-flex rounded-lg border bg-muted p-1">
                      <button
                        onClick={() => setResultView('overview')}
                        className={`px-6 py-2 text-sm font-semibold rounded-md transition-all ${
                          resultView === 'overview'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        📊 전체 분석
                      </button>
                      <button
                        onClick={() => setResultView('individual')}
                        className={`px-6 py-2 text-sm font-semibold rounded-md transition-all ${
                          resultView === 'individual'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        👤 개인별 분석
                      </button>
                    </div>
                  </div>
                )}
                
                {/* 전체 분석 뷰 */}
                {resultView === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ResultsDisplay
                      candidates={candidatesState.candidates}
                      participants={participantsState.participants}
                      selectedLocationId={candidatesState.selectedLocationId}
                    />
                  </motion.div>
                )}
                
                {/* 개인별 분석 뷰 */}
                {resultView === 'individual' && candidatesState.candidates.length > 0 && participantsState.participants.length > 0 && (
                  <motion.div
                    key="individual"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ParticipantAnalysis
                      participants={participantsState.participants}
                      candidates={candidatesState.candidates}
                    />
                  </motion.div>
                )}
                
                {/* 공유 버튼 */}
                {candidatesState.candidates.length > 0 && roomState.currentRoomCode && !roomState.isTemporaryMode && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex justify-center"
                  >
                    <Button
                      onClick={() => setShowShareDialog(true)}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      결과 공유하기
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 하단 네비게이션 - 모바일 고정 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent backdrop-blur-lg border-t border-white/10 md:relative md:mt-8 md:bg-transparent md:backdrop-blur-none md:border-t-0 z-40"
        >
          <div className="max-w-4xl mx-auto flex gap-2 sm:gap-3">
            {/* 이전 버튼 */}
            {currentStep > 1 && (
              <Button
                onClick={() => setCurrentStep(prev => prev - 1)}
                variant="outline"
                className="flex-none bg-white/5 border-white/20 hover:bg-white/10 py-6 px-4"
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="hidden sm:inline ml-1">이전</span>
              </Button>
            )}

            {/* 새로고침 버튼 - 방이 있고 임시모드가 아닐 때만 표시 */}
            {roomState.currentRoomCode && !roomState.isTemporaryMode && (
              <Button
                onClick={async () => {
                  await roomData.refreshRoom();
                  showAlert('새로고침 완료!', { variant: 'success' });
                }}
                variant="outline"
                className="flex-none bg-white/5 border-white/20 hover:bg-white/10 py-6 px-4"
              >
                <RefreshCw className="h-5 w-5" />
                <span className="hidden sm:inline ml-1">새로고침</span>
              </Button>
            )}
            
            {/* 다음/완료 버튼 */}
            {currentStep < 3 ? (
              <Button
                onClick={handleNext}
                className="flex-1 btn-bling py-6 text-base sm:text-lg font-black"
              >
                다음
                <ChevronRight className="ml-1 sm:ml-2 h-5 w-5" />
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentStep(1)}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 py-6 text-base sm:text-lg font-black"
              >
                <Sparkles className="mr-1 sm:mr-2 h-5 w-5" />
                <span className="hidden sm:inline">새로 시작하기</span>
                <span className="sm:hidden">처음으로</span>
              </Button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Alert Modal */}
      <AlertModal
        open={alertState.open}
        onOpenChange={closeAlert}
        title={alertState.title}
        message={alertState.message}
        variant={alertState.variant}
      />

      {/* Share Dialog */}
      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        roomCode={roomState.currentRoomCode || ''}
        meetingTitle={roomState.meetingTitle || '모임 장소 찾기'}
        participants={participantsState.participants}
        candidates={candidatesState.candidates}
      />
    </div>
  );
}
