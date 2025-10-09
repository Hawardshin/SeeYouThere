'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Participant, CandidateLocation } from '@/types';
import ParticipantManager from '@/components/ParticipantManager';
import LocationManager from '@/components/LocationManager';
import ResultsDisplay from '@/components/ResultsDisplay';
import ParticipantAnalysis from '@/components/ParticipantAnalysis';
import ShareDialog from '@/components/ShareDialog';
import RoomEntranceDialog from '@/components/RoomEntranceDialog';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, Users, MapPin, Sparkles } from 'lucide-react';

export default function Home() {
  const [meetingTitle, setMeetingTitle] = useState('새로운 모임');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [candidates, setCandidates] = useState<CandidateLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  
  // 출발 시간 설정 (기본값: 빈 문자열, useEffect에서 설정)
  const [departureTime, setDepartureTime] = useState('');
  
  // 방 관련 상태
  const [currentRoomCode, setCurrentRoomCode] = useState<string | null>(null);
  // 방 입장 전까지 다이얼로그 강제 표시
  const [showRoomDialog, setShowRoomDialog] = useState(true);
  
  // 🎯 스텝 관리 (1: 참여자, 2: 장소, 3: 결과)
  const [currentStep, setCurrentStep] = useState(1);
  
  // 결과 페이지 뷰 모드 (overview: 전체 분석, individual: 개인별 분석)
  const [resultView, setResultView] = useState<'overview' | 'individual'>('overview');

  // 클라이언트에서만 기본 출발 시간 설정 (hydration 불일치 방지)
  useEffect(() => {
    if (!departureTime) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      setDepartureTime(`${year}-${month}-${day}T13:00`);
    }
  }, [departureTime]);

  // 방 데이터 로드
  const loadRoomData = async (roomCode: string) => {
    try {
      const response = await fetch(`/api/rooms?roomCode=${roomCode}`);
      const data = await response.json();

      if (data.success) {
        setMeetingTitle(data.data.meetingTitle || '새로운 모임');
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
    setShowRoomDialog(false); // 방 입장 성공 시에만 닫기
    if (!isNew) {
      await loadRoomData(roomCode);
    }
  };

  // 자동 저장
  useEffect(() => {
    if (currentRoomCode) {
      const timer = setTimeout(() => {
        fetch('/api/rooms', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode: currentRoomCode,
            meetingTitle,
            participants,
            candidates,
          }),
        }).catch(error => console.error('저장 실패:', error));
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [participants, candidates, meetingTitle, currentRoomCode]);

  // 다음 단계로
  const handleNext = () => {
    if (currentStep === 1 && participants.length === 0) {
      alert('최소 1명의 참여자를 추가해주세요!');
      return;
    }
    if (currentStep === 2 && candidates.length === 0) {
      alert('최소 1개의 후보 장소를 추가해주세요!');
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

  return (
    <div className="min-h-screen pb-20">
      {/* 방 입장 다이얼로그 */}
      <RoomEntranceDialog
        open={showRoomDialog && !currentRoomCode}
        onOpenChange={(open) => {
          // 방 코드가 있을 때만 다이얼로그를 닫을 수 있음
          if (!open && !currentRoomCode) {
            return; // 방 입장 전에는 닫기 방지
          }
          setShowRoomDialog(open);
        }}
        onRoomEnter={handleRoomEnter}
      />

      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 md:mb-12 relative"
        >
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
          {currentRoomCode && (
            <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-accent rounded-full border">
              <span className="text-sm text-muted-foreground">방 코드:</span>
              <span className="font-bold text-primary">{currentRoomCode}</span>
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
                participants={participants}
                onParticipantsChange={setParticipants}
                candidatesCount={candidates.length}
                onClearCandidates={() => {
                  setCandidates([]);
                  setSelectedLocationId(null);
                }}
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
                participants={participants}
                candidates={candidates}
                onCandidatesChange={setCandidates}
                selectedLocationId={selectedLocationId}
                onLocationSelect={setSelectedLocationId}
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
                {candidates.length > 0 && participants.length > 0 && (
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
                      candidates={candidates}
                      selectedLocationId={selectedLocationId}
                    />
                  </motion.div>
                )}
                
                {/* 개인별 분석 뷰 */}
                {resultView === 'individual' && candidates.length > 0 && participants.length > 0 && (
                  <motion.div
                    key="individual"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ParticipantAnalysis
                      participants={participants}
                      candidates={candidates}
                    />
                  </motion.div>
                )}
                
                {/* 공유 버튼 */}
                {candidates.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex justify-center"
                  >
                    <ShareDialog
                      meetingTitle={meetingTitle}
                      participants={participants}
                      candidates={candidates}
                    />
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
          className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent backdrop-blur-lg border-t border-white/10 md:relative md:mt-8 md:bg-transparent md:backdrop-blur-none md:border-t-0"
        >
          <div className="max-w-4xl mx-auto flex gap-3">
            {currentStep > 1 && (
              <Button
                onClick={() => setCurrentStep(prev => prev - 1)}
                variant="outline"
                className="flex-1 md:flex-none bg-white/5 border-white/20 hover:bg-white/10 py-6"
              >
                <ChevronLeft className="mr-2 h-5 w-5" />
                이전
              </Button>
            )}
            
            {currentStep < 3 ? (
              <Button
                onClick={handleNext}
                className="flex-1 btn-bling py-6 text-lg font-black"
              >
                다음
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentStep(1)}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 py-6 text-lg font-black"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                새로 시작하기
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
