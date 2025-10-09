'use client';

import { useMemo, useState } from 'react';
import { Participant, CandidateLocation } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';

interface ParticipantAnalysisProps {
  participants: Participant[];
  candidates: CandidateLocation[];
}

export default function ParticipantAnalysis({ participants, candidates }: ParticipantAnalysisProps) {
  // 각 참여자의 펼침/접힌 상태 관리
  const [expandedParticipants, setExpandedParticipants] = useState<Set<string>>(new Set());

  // 참여자 토글 함수
  const toggleParticipant = (participantId: string) => {
    const newExpanded = new Set(expandedParticipants);
    if (newExpanded.has(participantId)) {
      newExpanded.delete(participantId);
    } else {
      newExpanded.add(participantId);
    }
    setExpandedParticipants(newExpanded);
  };

  // 각 참여자별 장소 순위 계산
  const participantRankings = useMemo(() => {
    return participants.map(participant => {
      // 이 참여자의 모든 후보지 소요시간 수집
      const locations = candidates.map(candidate => {
        // participantId로 먼저 찾고, 없으면 이름으로 찾기
        let travelTime = candidate.travelTimes.find(tt => tt.participantId === participant.id);
        
        // ID 매칭 실패 시 이름으로 재시도
        if (!travelTime) {
          travelTime = candidate.travelTimes.find(tt => tt.participantName === participant.name);
        }
        
        // 그래도 없으면 첫 번째 데이터라도 사용 (임시 - 디버깅용)
        if (!travelTime && candidate.travelTimes.length > 0) {
          console.warn(`⚠️ ${participant.name}의 이동시간 매칭 실패, 후보지: ${candidate.name}`);
        }
        
        return {
          locationId: candidate.id,
          locationName: candidate.name,
          locationAddress: candidate.address,
          duration: travelTime?.duration || 0,
          distance: travelTime?.distance || 0,
        };
      }).sort((a, b) => a.duration - b.duration); // 시간 짧은 순으로 정렬

      const bestLocation = locations[0] || { duration: 0, distance: 0, locationName: '', locationAddress: '', locationId: '' };
      const worstLocation = locations[locations.length - 1] || { duration: 0, distance: 0, locationName: '', locationAddress: '', locationId: '' };

      return {
        participant,
        locations,
        bestLocation,
        worstLocation,
      };
    });
  }, [participants, candidates]);

  if (candidates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            참여자별 분석
          </CardTitle>
          <CardDescription>
            후보 장소를 추가하면 각 참여자별 최적 장소를 분석합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            후보 장소를 추가해주세요
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          참여자별 상세 분석
        </CardTitle>
        <CardDescription>
          각 참여자에게 가장 가까운 장소부터 먼 장소까지 확인하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {participantRankings.map(({ participant, locations, bestLocation, worstLocation }) => {
          const isExpanded = expandedParticipants.has(participant.id);
          
          return (
            <div key={participant.id} className="border rounded-lg overflow-hidden">
              {/* 참여자 정보 헤더 - 클릭 가능 */}
              <button
                onClick={() => toggleParticipant(participant.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full transition-colors ${
                    isExpanded ? 'bg-primary/20' : 'bg-muted'
                  }`}>
                    <User className={`h-5 w-5 ${isExpanded ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-lg">
                      {participant.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {participant.startLocation}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden md:block">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span>최선: {bestLocation.duration}분</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <TrendingDown className="h-3 w-3 text-red-600" />
                      <span>최악: {worstLocation.duration}분</span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* 펼쳐진 경우에만 장소 목록 표시 */}
              {isExpanded && (
                <div className="p-4 pt-0 space-y-3 border-t">
                  {/* 장소 순위 목록 */}
                  <div className="space-y-2">
                    {locations.map((location, index) => {
                      const isFirst = index === 0;
                      const isLast = index === locations.length - 1;
                      
                      return (
                        <div
                          key={location.locationId}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                            isFirst 
                              ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/30' 
                              : isLast 
                              ? 'border-red-500/50 bg-red-50/50 dark:bg-red-950/30'
                              : 'border-border bg-muted/30'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* 순위 배지 */}
                            <Badge 
                              variant={isFirst ? 'default' : isLast ? 'destructive' : 'secondary'}
                              className="shrink-0 w-8 text-center"
                            >
                              {index + 1}
                            </Badge>
                            
                            {/* 장소 정보 */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="font-semibold text-foreground truncate">
                                  {location.locationName}
                                </span>
                                {isFirst && (
                                  <Badge variant="outline" className="text-xs bg-green-600 text-white border-green-600">
                                    최적
                                  </Badge>
                                )}
                                {isLast && (
                                  <Badge variant="outline" className="text-xs bg-red-600 text-white border-red-600">
                                    최악
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {location.locationAddress}
                              </p>
                            </div>
                          </div>

                          {/* 소요시간 */}
                          <div className="text-right shrink-0 ml-3">
                            <div className={`text-lg font-bold ${
                              isFirst ? 'text-green-600 dark:text-green-400' : 
                              isLast ? 'text-red-600 dark:text-red-400' : 
                              'text-foreground'
                            }`}>
                              {location.duration}분
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {(location.distance / 1000).toFixed(1)}km
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 통계 요약 */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-muted/30 rounded-lg">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">평균</p>
                      <p className="text-sm font-semibold text-foreground">
                        {Math.round(locations.reduce((sum, loc) => sum + loc.duration, 0) / locations.length)}분
                      </p>
                    </div>
                    <div className="text-center border-x border-border">
                      <p className="text-xs text-muted-foreground">차이</p>
                      <p className="text-sm font-semibold text-foreground">
                        {worstLocation.duration - bestLocation.duration}분
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">후보지</p>
                      <p className="text-sm font-semibold text-foreground">
                        {locations.length}개
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
