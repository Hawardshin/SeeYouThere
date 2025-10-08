'use client';

import { useState } from 'react';
import { Participant, CandidateLocation, TravelTime } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Clock, Trash2, Loader2, Star } from 'lucide-react';
import { getTravelTime } from '@/lib/mapApi';
import AddressSearch from './AddressSearch';
import { popularLocations } from '@/data/popularLocations';

interface LocationManagerProps {
  participants: Participant[];
  candidates: CandidateLocation[];
  onCandidatesChange: (candidates: CandidateLocation[]) => void;
  selectedLocationId: string | null;
  onLocationSelect: (id: string | null) => void;
  departureTime: string;
  onDepartureTimeChange: (time: string) => void;
}

export default function LocationManager({
  participants,
  candidates,
  onCandidatesChange,
  selectedLocationId,
  onLocationSelect,
  departureTime,
  onDepartureTimeChange,
}: LocationManagerProps) {
  const [locationAddress, setLocationAddress] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>();
  const [isCalculating, setIsCalculating] = useState(false);
  const [showPopularLocations, setShowPopularLocations] = useState(false);
  const [sortBy, setSortBy] = useState<'time' | 'maxTime' | 'totalTime'>('maxTime'); // 정렬 기준

  // 후보지 추가 로직 (일반 검색용과 인기 장소용 공통 사용)
  const addCandidateLocation = async (name: string, address: string, coords: { lat: number; lng: number }) => {
    if (participants.length === 0) {
      alert('참여자를 먼저 추가해주세요.');
      return;
    }

    // 중복 이름 체크
    if (candidates.some(c => c.name === name)) {
      alert('⚠️ 이미 같은 이름의 후보지가 추가되어 있습니다.');
      return;
    }

    // 좌표 유효성 검사
    if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
      alert('좌표 정보가 올바르지 않습니다.');
      return;
    }

    // 좌표가 0, 0인 경우 (데이터 미입력)
    if (coords.lat === 0 && coords.lng === 0) {
      alert('⚠️ 이 장소의 정보가 아직 입력되지 않았습니다.\n데이터를 먼저 채워주세요.');
      return;
    }

    console.log('[LocationManager] 후보지 추가:', {
      name,
      address,
      coordinates: coords
    });

    setIsCalculating(true);

    try {
      const candidateCoords = coords;

      // 각 참여자별 소요시간 계산
      const travelTimes: TravelTime[] = await Promise.all(
        participants.map(async (participant) => {
          const startCoords = participant.coordinates;
          
          let duration = 0;
          let distance = 0;

          console.log(`[LocationManager] ${participant.name} 경로 계산 시작:`, {
            from: startCoords,
            to: candidateCoords,
            mode: participant.transportMode,
            departureTime: departureTime
          });
          
          const mode = participant.transportMode === 'car' ? 'driving' : 'transit';
          const result = await getTravelTime(startCoords, candidateCoords, mode, departureTime);
          
          duration = result.duration;
          distance = result.distance;
          
          console.log(`[LocationManager] ${participant.name} 경로 계산 성공:`, {
            duration: `${duration}분`,
            distance: `${(distance / 1000).toFixed(1)}km`
          });

          return {
            participantId: participant.id,
            participantName: participant.name,
            duration,
            distance,
          };
        })
      );

      const newCandidate: CandidateLocation = {
        id: Date.now().toString(),
        name: name,
        address: address || name,
        coordinates: {
          lat: candidateCoords.lat,
          lng: candidateCoords.lng,
        },
        travelTimes,
      };

      console.log('[LocationManager] 후보지 저장:', newCandidate);

      onCandidatesChange([...candidates, newCandidate]);
      setLocationAddress('');
      setCoordinates(undefined);
    } catch (error) {
      console.error('후보지 추가 오류:', error);
      alert('후보지 추가 중 오류가 발생했습니다.');
    } finally {
      setIsCalculating(false);
    }
  };

  // 검색으로 추가
  const handleAddCandidate = async () => {
    if (!locationAddress.trim()) {
      alert('장소를 입력해주세요.');
      return;
    }

    if (!coordinates) {
      alert('후보지 좌표를 찾을 수 없습니다. 검색 결과에서 장소를 선택해주세요.');
      return;
    }

    await addCandidateLocation(locationAddress, locationAddress, coordinates);
  };

  // 인기 장소로 추가
  const handleAddPopularLocation = async (locationId: string) => {
    const location = popularLocations.find(loc => loc.id === locationId);
    if (!location) return;

    await addCandidateLocation(
      location.name,
      location.address || location.name,
      location.coordinates
    );
  };

  const handleRemoveCandidate = (id: string) => {
    onCandidatesChange(candidates.filter(c => c.id !== id));
    if (selectedLocationId === id) {
      onLocationSelect(null);
    }
  };

  const getTotalTime = (travelTimes: TravelTime[]) => {
    return travelTimes.reduce((sum, tt) => sum + tt.duration, 0);
  };

  const getMaxTime = (travelTimes: TravelTime[]) => {
    return Math.max(...travelTimes.map(tt => tt.duration), 0);
  };

  // 후보지 정렬
  const getSortedCandidates = () => {
    const sorted = [...candidates];
    
    switch (sortBy) {
      case 'maxTime':
        // 최대 시간 적은 순
        return sorted.sort((a, b) => getMaxTime(a.travelTimes) - getMaxTime(b.travelTimes));
      case 'totalTime':
        // 총합 시간 적은 순
        return sorted.sort((a, b) => getTotalTime(a.travelTimes) - getTotalTime(b.travelTimes));
      case 'time':
      default:
        // 추가된 순서 (기본)
        return sorted;
    }
  };

  const sortedCandidates = getSortedCandidates();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <MapPin className="h-5 w-5 text-primary" />
          회합 후보지
        </CardTitle>
        <CardDescription className="text-base">
          약속 장소 후보를 검색하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 출발 시간 설정 */}
        <div className="p-4 bg-muted/50 rounded-lg border">
          <label className="text-sm font-semibold mb-2 flex items-center gap-2 text-foreground">
            <Clock className="h-4 w-4 text-primary" />
            출발 시간
          </label>
          <input
            type="time"
            value={departureTime}
            onChange={(e) => onDepartureTimeChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground mt-2">
            선택한 시간 기준으로 소요시간을 계산합니다
          </p>
        </div>

        {/* 입력 폼 */}
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
          <div>
            <label className="text-sm font-semibold mb-1.5 block text-foreground">📍 목표 지점</label>
            <AddressSearch
              onSelect={(address: string, coords: { lat: number; lng: number }) => {
                setLocationAddress(address);
                setCoordinates(coords);
              }}
              placeholder="장소를 검색하세요 (예: 스타벅스 강남역점)"
            />
          </div>

          <Button 
            onClick={handleAddCandidate} 
            className="w-full font-semibold"
            disabled={participants.length === 0 || isCalculating}
          >
            {isCalculating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span>소요시간 계산 중...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                <span>후보지 추가</span>
              </>
            )}
          </Button>

          {/* 인기 장소 원터치 추가 */}
          <div className="pt-3 border-t">
            <button
              onClick={() => setShowPopularLocations(!showPopularLocations)}
              className="w-full flex items-center justify-between text-sm font-semibold text-foreground hover:text-primary transition-colors mb-2"
            >
              <span className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                인기 장소 원터치 추가
              </span>
              <span className="text-xs text-muted-foreground">
                {showPopularLocations ? '▲' : '▼'}
              </span>
            </button>

            {showPopularLocations && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {popularLocations.map((location) => {
                  const isAlreadyAdded = candidates.some(c => c.name === location.name);
                  return (
                    <Button
                      key={location.id}
                      onClick={() => handleAddPopularLocation(location.id)}
                      variant="outline"
                      size="sm"
                      disabled={isCalculating || participants.length === 0 || isAlreadyAdded}
                      className={`text-xs font-medium h-auto py-2 ${
                        isAlreadyAdded 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'hover:bg-primary/10 hover:text-primary hover:border-primary'
                      }`}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {location.name}
                      {isAlreadyAdded && <span className="ml-1">✓</span>}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          {participants.length === 0 && (
            <p className="text-xs text-destructive font-medium flex items-center gap-1.5 bg-destructive/10 p-2 rounded border border-destructive/30">
              <span>⚠️</span>
              <span>먼저 참여자를 추가해주세요</span>
            </p>
          )}
        </div>

        {/* 후보지 목록 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              🎯 후보 지점 목록 ({candidates.length}개)
            </h3>
            {candidates.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">정렬:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'time' | 'maxTime' | 'totalTime')}
                  className="text-xs border rounded px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="maxTime">최대 시간 ↑</option>
                  <option value="totalTime">총합 시간 ↑</option>
                  <option value="time">추가 순서</option>
                </select>
              </div>
            )}
          </div>
          
          {/* 출발 시간 표시 */}
          {candidates.length > 0 && (
            <div className="mb-3 px-3 py-2 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs text-foreground">
                <Clock className="h-3 w-3 inline mr-1 text-primary" />
                출발 시간: <span className="font-semibold">{departureTime}</span> 기준
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            {candidates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-lg bg-muted/30">
                후보 장소를 추가해주세요
              </p>
            ) : (
              sortedCandidates.map((candidate, index) => {
                return (
                <div
                  key={candidate.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedLocationId === candidate.id
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border bg-card hover:border-primary/50 hover:shadow-sm'
                  }`}
                  onClick={() => onLocationSelect(candidate.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {sortBy !== 'time' && (
                          <Badge variant={index === 0 ? 'default' : 'secondary'} className="text-xs shrink-0">
                            {index === 0 ? (
                              sortBy === 'maxTime' ? '⭐ 최적' : sortBy === 'totalTime' ? '⚡ 효율' : `${index + 1}위`
                            ) : (
                              `${index + 1}위`
                            )}
                          </Badge>
                        )}
                        <h4 className="font-semibold text-foreground truncate">
                          {candidate.name}
                        </h4>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {candidate.travelTimes.length}명
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {candidate.address}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCandidate(candidate.id);
                      }}
                      className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* 소요시간 요약 */}
                  <div className="flex gap-3 mb-2">
                    <div className="flex items-center gap-1 text-xs font-medium text-foreground">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">총합:</span>
                      <span className="font-semibold">{getTotalTime(candidate.travelTimes)}분</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium text-foreground">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">최대:</span>
                      <span className="font-semibold">{getMaxTime(candidate.travelTimes)}분</span>
                    </div>
                  </div>

                  {/* 선택된 경우 상세 정보 표시 */}
                  {selectedLocationId === candidate.id && (
                    <div className="mt-3 pt-3 border-t space-y-1.5">
                      {[...candidate.travelTimes]
                        .sort((a, b) => a.duration - b.duration) // 시간 적은 순으로 정렬
                        .map((tt) => {
                        const participant = participants.find(p => p.id === tt.participantId);
                        return (
                          <div
                            key={tt.participantId}
                            className="flex justify-between items-center text-sm bg-muted/50 px-3 py-2 rounded"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-foreground font-medium">
                                {tt.participantName}
                              </span>
                              {participant?.transportMode === 'transit' && (
                                <Badge variant="outline" className="text-xs py-0 border-primary/50 text-primary">
                                  대중교통
                                </Badge>
                              )}
                            </div>
                            <Badge variant="secondary" className="font-semibold">
                              {tt.duration}분
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

