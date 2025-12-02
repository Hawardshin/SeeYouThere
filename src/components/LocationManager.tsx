'use client';

import { useState, useRef } from 'react';
import { Participant, CandidateLocation, TravelTime } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Plus, Clock, Trash2, Loader2, Star, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { getTravelTime, MapApiError } from '@/lib/mapApi';
import AddressSearch from './AddressSearch';
import SubwayStationPicker from './SubwayStationPicker';
import { popularLocations } from '@/data/popularLocations';
import { subwayStations } from '@/data/subwayStations';
import MapView from './MapView';
import AlertModal, { useAlertModal } from './AlertModal';

interface LocationManagerProps {
  participants: Participant[];
  candidates: CandidateLocation[];
  onAddCandidate: (candidate: CandidateLocation) => Promise<boolean>;
  onRemoveCandidate: (id: string) => Promise<boolean>;
  selectedLocationId: string | null;
  onLocationSelect: (id: string | null) => void;
  departureTime: string;
  onDepartureTimeChange: (time: string) => void;
}

export default function LocationManager({
  participants,
  candidates,
  onAddCandidate,
  onRemoveCandidate,
  selectedLocationId,
  onLocationSelect,
  departureTime,
  onDepartureTimeChange,
}: LocationManagerProps) {
  const [locationAddress, setLocationAddress] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>();
  const [isCalculating, setIsCalculating] = useState(false);
  const [apiErrorModal, setApiErrorModal] = useState<{ 
    open: boolean; 
    message: string; 
    retryFn: (() => void) | null 
  }>({ open: false, message: '', retryFn: null });
  const { alertState, showAlert, closeAlert } = useAlertModal();
  
  // 목표지 선택 방법 탭
  const [locationTab, setLocationTab] = useState<'popular' | 'subway' | 'search'>('popular');
  const [previewPopularLocation, setPreviewPopularLocation] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'time' | 'maxTime' | 'totalTime'>('maxTime');
  const popularScrollRef = useRef<HTMLDivElement>(null);

  // 후보지 추가 로직
  const addCandidateLocation = async (name: string, address: string, coords: { lat: number; lng: number }) => {
    if (participants.length === 0) {
      showAlert('참여자를 먼저 추가해주세요.', { variant: 'warning' });
      return;
    }

    setIsCalculating(true);

    try {
      const travelTimes: TravelTime[] = [];

      for (const participant of participants) {
        // transportMode 변환 ('transit' -> 'TRANSIT', 'car' -> 'DRIVE')
        const mode = participant.transportMode === 'transit' ? 'TRANSIT' as const : 'DRIVE' as const;
        
        const result = await getTravelTime(
          participant.coordinates,
          coords,
          mode,
          departureTime
        );

        travelTimes.push({
          participantId: participant.id,
          participantName: participant.name,
          duration: result.duration,
          distance: result.distance,
          isEstimated: result.isEstimated,
        });
      }

      const newCandidate: CandidateLocation = {
        id: Date.now().toString(),
        name,
        address,
        coordinates: coords,
        travelTimes,
      };

      await onAddCandidate(newCandidate);
      setLocationAddress('');
      setCoordinates(undefined);
      setPreviewPopularLocation(null);
    } catch (error) {
      console.error('Error calculating travel times:', error);
      
      // MapApiError인 경우 모달로 재시도 가능한 에러 표시
      if (error instanceof MapApiError && error.retryable) {
        setApiErrorModal({
          open: true,
          message: error.message,
          retryFn: () => addCandidateLocation(name, address, coords)
        });
      } else {
        showAlert('경로 계산 중 오류가 발생했습니다.', { variant: 'error' });
      }
    } finally {
      setIsCalculating(false);
    }
  };

  const handleAddLocation = async () => {
    if (!locationAddress.trim()) {
      showAlert('장소명을 입력해주세요.', { variant: 'warning' });
      return;
    }

    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
      showAlert('좌표를 찾을 수 없습니다. 검색 결과에서 장소를 선택해주세요.', { variant: 'warning' });
      return;
    }

    await addCandidateLocation(locationAddress, locationAddress, coordinates);
  };

  const handleAddPopularLocation = async (locationId: string) => {
    const location = popularLocations.find(l => l.id === locationId);
    if (!location) return;

    await addCandidateLocation(location.name, location.address, location.coordinates);
  };

  const handleAddSubwayStation = async (stationId: string) => {
    const station = subwayStations.find(s => s.id === stationId);
    if (!station) return;

    await addCandidateLocation(`${station.name}역`, `${station.name}역 (${station.line})`, station.coordinates);
  };

  const handleDeleteCandidate = async (id: string) => {
    await onRemoveCandidate(id);
    if (selectedLocationId === id) {
      onLocationSelect(null);
    }
  };

  const scrollPopular = (direction: 'left' | 'right') => {
    if (popularScrollRef.current) {
      const scrollAmount = 200;
      popularScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // 정렬된 후보지 계산
  const sortedCandidates = [...candidates].sort((a, b) => {
    if (sortBy === 'time') {
      const avgA = a.travelTimes.reduce((sum, t) => sum + t.duration, 0) / a.travelTimes.length;
      const avgB = b.travelTimes.reduce((sum, t) => sum + t.duration, 0) / b.travelTimes.length;
      return avgA - avgB;
    } else if (sortBy === 'maxTime') {
      const maxA = Math.max(...a.travelTimes.map(t => t.duration));
      const maxB = Math.max(...b.travelTimes.map(t => t.duration));
      return maxA - maxB;
    } else {
      const totalA = a.travelTimes.reduce((sum, t) => sum + t.duration, 0);
      const totalB = b.travelTimes.reduce((sum, t) => sum + t.duration, 0);
      return totalA - totalB;
    }
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              장소 선택
            </div>
          </CardTitle>
          <CardDescription>
            만날 장소를 추가하고 각 참여자의 이동 시간을 계산합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 출발 시간 설정 - 맨 위로 이동 */}
          <div className="pb-4 border-b">
            <label className="block text-sm font-medium mb-2">
              출발 시간
            </label>
            <Input
              type="datetime-local"
              value={departureTime}
              onChange={(e) => onDepartureTimeChange(e.target.value)}
            />
          </div>

          {/* 탭 버튼 */}
          <div className="flex gap-2">
            <Button
              variant={locationTab === 'popular' ? 'default' : 'outline'}
              onClick={() => setLocationTab('popular')}
              className="flex-1 min-w-0"
              size="sm"
            >
              ⭐ 인기장소
            </Button>
            <Button
              variant={locationTab === 'subway' ? 'default' : 'outline'}
              onClick={() => setLocationTab('subway')}
              className="flex-1 min-w-0"
              size="sm"
            >
              🚇 지하철역
            </Button>
            <Button
              variant={locationTab === 'search' ? 'default' : 'outline'}
              onClick={() => setLocationTab('search')}
              className="flex-1 min-w-0"
              size="sm"
            >
              📍 직접검색
            </Button>
          </div>

          {/* 인기장소 탭 */}
          {locationTab === 'popular' && (
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                자주 찾는 장소에서 선택하세요
              </div>
              
              <div className="relative">
                <button
                  onClick={() => scrollPopular('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div 
                  ref={popularScrollRef}
                  className="flex gap-3 overflow-x-auto scrollbar-hide px-8 py-2"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {popularLocations.map((location) => (
                    <button
                      key={location.id}
                      onClick={() => {
                        if (previewPopularLocation === location.id) {
                          setPreviewPopularLocation(null);
                        } else {
                          setPreviewPopularLocation(location.id);
                        }
                      }}
                      className={`flex-shrink-0 w-40 p-3 rounded-lg border-2 transition-all text-left ${
                        previewPopularLocation === location.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="font-medium text-sm mb-1">{location.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {location.address}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => scrollPopular('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* 인기장소 지도 - 항상 표시 */}
              <div className="space-y-3 border-t pt-3">
                <div className="text-sm font-medium">미리보기</div>
                <MapView
                  locations={
                    previewPopularLocation
                      ? popularLocations
                          .filter(l => l.id === previewPopularLocation)
                          .map(l => ({ ...l.coordinates, name: l.name }))
                      : popularLocations.map(l => ({ ...l.coordinates, name: l.name }))
                  }
                  className="h-[350px]"
                />
                {previewPopularLocation && (
                  <Button
                    onClick={() => handleAddPopularLocation(previewPopularLocation)}
                    disabled={isCalculating}
                    className="w-full"
                  >
                    {isCalculating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        경로 계산 중...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        이 장소 추가
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* 지하철역 탭 */}
          {locationTab === 'subway' && (
            <SubwayStationPicker
              onSelect={(stationId: string) => {
                const station = subwayStations.find(s => s.id === stationId);
                if (station) {
                  setLocationAddress(`${station.name}역`);
                  setCoordinates(station.coordinates);
                  setPreviewPopularLocation(null);
                }
              }}
              actionButton={{
                label: '이 역 추가',
                onClick: (stationId: string) => handleAddSubwayStation(stationId),
                disabled: isCalculating,
                loadingLabel: '경로 계산 중...',
              }}
              compact={true}
            />
          )}

          {/* 직접검색 탭 */}
          {locationTab === 'search' && (
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                주소나 장소명을 직접 검색하세요
              </div>
              
              <AddressSearch
                onSelect={(address, coords) => {
                  setLocationAddress(address);
                  setCoordinates(coords);
                }}
                placeholder="예: 서울역, 강남역 스타벅스"
                defaultValue={locationAddress}
                buttonLabel="장소 추가"
                onConfirm={async (address, coords) => {
                  // onConfirm으로 받은 장소 정보를 직접 사용 (state 업데이트 비동기 문제 방지)
                  if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
                    showAlert('좌표를 찾을 수 없습니다. 검색 결과에서 장소를 선택해주세요.', { variant: 'warning' });
                    return;
                  }

                  await addCandidateLocation(address, address, coords);
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 후보지 목록 */}
      {candidates.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                후보 장소 ({candidates.length})
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortBy('time')}
                  className={sortBy === 'time' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                >
                  평균시간순
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortBy('maxTime')}
                  className={sortBy === 'maxTime' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                >
                  최대시간순
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortBy('totalTime')}
                  className={sortBy === 'totalTime' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                >
                  총합시간순
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedCandidates.map((candidate) => {
              const avgTime = candidate.travelTimes.reduce((sum, t) => sum + t.duration, 0) / candidate.travelTimes.length;
              const maxTime = Math.max(...candidate.travelTimes.map(t => t.duration));
              const totalTime = candidate.travelTimes.reduce((sum, t) => sum + t.duration, 0);
              const hasEstimated = candidate.travelTimes.some(t => t.isEstimated);
              
              return (
                <Card
                  key={candidate.id}
                  className={`cursor-pointer transition-all ${
                    selectedLocationId === candidate.id
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => onLocationSelect(candidate.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-lg">{candidate.name}</span>
                          {hasEstimated && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
                              ⚠️ 일부 추정치
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {candidate.address}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCandidate(candidate.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>

                    <div className="flex gap-4 mb-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        평균: {Math.round(avgTime)}분
                      </div>
                      <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <Clock className="w-4 h-4" />
                        최대: {Math.round(maxTime)}분
                      </div>
                      <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        <Clock className="w-4 h-4" />
                        총합: {Math.round(totalTime)}분
                      </div>
                    </div>

                    <div className="space-y-2">
                      {[...candidate.travelTimes]
                        .sort((a, b) => a.duration - b.duration)
                        .map((time, index) => {
                          const participant = participants.find(p => p.id === time.participantId);
                          return (
                            <div
                              key={time.participantId}
                              className="flex items-center gap-3 text-sm p-3 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700"
                            >
                              {/* 미니 프로필 아바타 */}
                              <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm ${
                                ['bg-gradient-to-br from-violet-500 to-purple-600',
                                 'bg-gradient-to-br from-blue-500 to-cyan-600',
                                 'bg-gradient-to-br from-emerald-500 to-teal-600',
                                 'bg-gradient-to-br from-orange-500 to-amber-600',
                                 'bg-gradient-to-br from-pink-500 to-rose-600',
                                 'bg-gradient-to-br from-indigo-500 to-blue-600'][participants.findIndex(p => p.id === time.participantId) % 6]
                              }`}>
                                {time.participantName.charAt(0).toUpperCase()}
                              </div>
                              
                              {/* 참여자 정보 */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-foreground">{time.participantName}</span>
                                  {participant && (
                                    <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${
                                      participant.transportMode === 'car' 
                                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400' 
                                        : 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400'
                                    }`}>
                                      {participant.transportMode === 'car' ? '🚗' : '🚇'}
                                    </span>
                                  )}
                                </div>
                                {participant && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{participant.startLocation}</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* 소요 시간 */}
                              <div className="flex-shrink-0 text-right">
                                <div className={`flex items-center gap-1 font-semibold ${
                                  time.isEstimated 
                                    ? 'text-amber-600 dark:text-amber-400' 
                                    : 'text-foreground'
                                }`}>
                                  <Clock className={`w-3.5 h-3.5 ${time.isEstimated ? 'text-amber-500' : 'text-primary'}`} />
                                  {time.isEstimated ? '~' : ''}{time.duration}분
                                  {time.isEstimated && (
                                    <span className="text-[10px] text-amber-500" title="API 오류로 직선거리 기반 추정치입니다">⚠️</span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {time.distance ? (time.distance / 1000).toFixed(1) : '?'}km
                                  {time.isEstimated && <span className="ml-1 text-amber-500">(추정)</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Alert Modal */}
      <AlertModal
        open={alertState.open}
        onOpenChange={closeAlert}
        title={alertState.title}
        message={alertState.message}
        variant={alertState.variant}
      />

      {/* API 에러 모달 */}
      <Dialog open={apiErrorModal.open} onOpenChange={(open) => !open && setApiErrorModal(prev => ({ ...prev, open: false }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <span className="text-3xl">😢</span>
              API가 잠깐 쉬고 있어요
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              {apiErrorModal.message}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="text-amber-600 dark:text-amber-400 text-sm">
              💡 걱정마세요! 다시 시도하면 대부분 해결됩니다.
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setApiErrorModal(prev => ({ ...prev, open: false }))}
            >
              닫기
            </Button>
            {apiErrorModal.retryFn && (
              <Button
                onClick={() => {
                  setApiErrorModal(prev => ({ ...prev, open: false }));
                  apiErrorModal.retryFn?.();
                }}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                다시 시도
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
