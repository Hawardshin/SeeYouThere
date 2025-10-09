'use client';

import { useMemo, useState } from 'react';
import { CandidateLocation, LocationStats } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, BarChart3, Award, ChevronDown, ChevronUp, User } from 'lucide-react';

interface ResultsDisplayProps {
  candidates: CandidateLocation[];
  selectedLocationId: string | null;
}

export default function ResultsDisplay({ candidates, selectedLocationId }: ResultsDisplayProps) {
  // 각 장소의 펼침/접힌 상태 관리
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());

  // 장소 토글 함수
  const toggleLocation = (locationId: string) => {
    const newExpanded = new Set(expandedLocations);
    if (newExpanded.has(locationId)) {
      newExpanded.delete(locationId);
    } else {
      newExpanded.add(locationId);
    }
    setExpandedLocations(newExpanded);
  };

  const stats = useMemo(() => {
    return candidates.map((candidate): LocationStats => {
      const times = candidate.travelTimes.map(tt => tt.duration);
      const totalTime = times.reduce((sum, time) => sum + time, 0);
      const maxTime = Math.max(...times, 0);
      const minTime = Math.min(...times, Infinity);
      const avgTime = times.length > 0 ? totalTime / times.length : 0;
      
      // 공평성 점수: 표준편차 사용 (낮을수록 공평)
      const mean = avgTime;
      const variance = times.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / times.length;
      const fairnessScore = Math.sqrt(variance);

      return {
        locationId: candidate.id,
        locationName: candidate.name,
        totalTime,
        maxTime,
        minTime,
        avgTime,
        fairnessScore,
        timeDifference: maxTime - minTime, // 최대-최소 시간 차이
      };
    });
  }, [candidates]);

  // 가장 공평한 장소 (공평성 점수가 낮은 = 표준편차가 낮은)
  const fairestLocation = useMemo(() => {
    if (stats.length === 0) return null;
    return stats.reduce((prev, curr) => 
      curr.fairnessScore < prev.fairnessScore ? curr : prev
    );
  }, [stats]);

  // 가장 빠른 장소 (총합 시간이 적은)
  const fastestLocation = useMemo(() => {
    if (stats.length === 0) return null;
    return stats.reduce((prev, curr) => 
      curr.totalTime < prev.totalTime ? curr : prev
    );
  }, [stats]);

  // 최대 시간이 가장 짧은 장소 (가장 먼 사람도 빨리 도착)
  const minMaxTimeLocation = useMemo(() => {
    if (stats.length === 0) return null;
    return stats.reduce((prev, curr) => 
      curr.maxTime < prev.maxTime ? curr : prev
    );
  }, [stats]);

  // 시간 차이가 가장 적은 장소 (균형성 최고)
  const mostBalancedLocation = useMemo(() => {
    if (stats.length === 0) return null;
    return stats.reduce((prev, curr) => 
      curr.timeDifference < prev.timeDifference ? curr : prev
    );
  }, [stats]);

  if (candidates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            분석 결과
          </CardTitle>
          <CardDescription>
            후보 장소를 추가하면 최적의 장소를 추천해드립니다
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
    <div className="space-y-6">
      {/* 추천 장소 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 최대 시간 최소 (가장 먼 사람도 빨리 도착) */}
        {minMaxTimeLocation && (
          <Card className="border-2 border-purple-500/50 bg-purple-50/50 dark:bg-purple-950/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                <Award className="h-5 w-5" />
                최대 시간 최소
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h3 className="text-lg font-bold">
                  {minMaxTimeLocation.locationName}
                </h3>
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge className="bg-purple-600 hover:bg-purple-700">
                    최대 {minMaxTimeLocation.maxTime}분
                  </Badge>
                  <Badge variant="outline">
                    평균 {Math.round(minMaxTimeLocation.avgTime)}분
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  가장 먼 사람도 {minMaxTimeLocation.maxTime}분 내 도착
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 시간 차이 최소 (균형성 최고) */}
        {mostBalancedLocation && (
          <Card className="border-2 border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <Trophy className="h-5 w-5" />
                균형성 최고
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h3 className="text-lg font-bold">
                  {mostBalancedLocation.locationName}
                </h3>
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge className="bg-orange-600 hover:bg-orange-700">
                    차이 {mostBalancedLocation.timeDifference}분
                  </Badge>
                  <Badge variant="outline">
                    {mostBalancedLocation.minTime}~{mostBalancedLocation.maxTime}분
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  최대-최소 시간 차이가 가장 적습니다
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* 가장 공평한 장소 */}
        {fairestLocation && (
          <Card className="border-2 border-green-500/50 bg-green-50/50 dark:bg-green-950/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Trophy className="h-5 w-5" />
                표준편차 최소
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h3 className="text-lg font-bold">
                  {fairestLocation.locationName}
                </h3>
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge className="bg-green-600 hover:bg-green-700">
                    공평도 {fairestLocation.fairnessScore.toFixed(1)}
                  </Badge>
                  <Badge variant="outline">
                    평균 {Math.round(fairestLocation.avgTime)}분
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  모든 참여자의 소요시간이 가장 균일합니다
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 가장 빠른 장소 */}
        {fastestLocation && (
          <Card className="border-2 border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <TrendingUp className="h-5 w-5" />
                총합 시간 최소
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h3 className="text-lg font-bold">
                  {fastestLocation.locationName}
                </h3>
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge className="bg-blue-600 hover:bg-blue-700">
                    총합 {fastestLocation.totalTime}분
                  </Badge>
                  <Badge variant="outline">
                    최대 {fastestLocation.maxTime}분
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  모든 참여자의 이동 시간 합계가 가장 적습니다
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 전체 통계 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            전체 후보지 비교
          </CardTitle>
          <CardDescription>
            클릭하여 각 장소의 참여자별 소요시간을 확인하세요 (시간 순 정렬)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.map((stat) => {
              const isFairest = fairestLocation?.locationId === stat.locationId;
              const isFastest = fastestLocation?.locationId === stat.locationId;
              const isSelected = selectedLocationId === stat.locationId;
              const isExpanded = expandedLocations.has(stat.locationId);
              
              // 해당 장소의 참여자별 소요시간 (시간 순 정렬)
              const candidate = candidates.find(c => c.id === stat.locationId);
              const sortedTravelTimes = candidate?.travelTimes 
                ? [...candidate.travelTimes].sort((a, b) => a.duration - b.duration)
                : [];

              return (
                <div
                  key={stat.locationId}
                  className={`rounded-lg border-2 transition-all overflow-hidden ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card'
                  }`}
                >
                  {/* 장소 정보 헤더 - 클릭 가능 */}
                  <button
                    onClick={() => toggleLocation(stat.locationId)}
                    className="w-full flex items-start justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-foreground text-lg">
                          {stat.locationName}
                        </h4>
                        {isFairest && (
                          <Badge className="bg-green-600 text-white text-xs">
                            <Trophy className="h-3 w-3 mr-1" />
                            공평
                          </Badge>
                        )}
                        {isFastest && (
                          <Badge className="bg-blue-600 text-white text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            빠름
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div className="bg-muted/50 p-2 rounded">
                          <p className="text-xs text-muted-foreground">총 시간</p>
                          <p className="font-semibold text-foreground">{stat.totalTime}분</p>
                        </div>
                        <div className="bg-muted/50 p-2 rounded">
                          <p className="text-xs text-muted-foreground">평균</p>
                          <p className="font-semibold text-foreground">{Math.round(stat.avgTime)}분</p>
                        </div>
                        <div className="bg-muted/50 p-2 rounded">
                          <p className="text-xs text-muted-foreground">최대</p>
                          <p className="font-semibold text-foreground">{stat.maxTime}분</p>
                        </div>
                        <div className="bg-muted/50 p-2 rounded">
                          <p className="text-xs text-muted-foreground">공평도</p>
                          <p className="font-semibold text-foreground">{stat.fairnessScore.toFixed(1)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="ml-4 shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* 펼쳐진 경우에만 참여자별 소요시간 표시 */}
                  {isExpanded && (
                    <div className="p-4 pt-0 space-y-2 border-t">
                      <p className="text-sm font-medium text-muted-foreground mb-3">
                        참여자별 소요시간 (시간 순)
                      </p>
                      {sortedTravelTimes.map((travelTime, index) => {
                        const isFirst = index === 0;
                        const isLast = index === sortedTravelTimes.length - 1;
                        
                        return (
                          <div
                            key={travelTime.participantId}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                              isFirst 
                                ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/30' 
                                : isLast 
                                ? 'border-red-500/50 bg-red-50/50 dark:bg-red-950/30'
                                : 'border-border bg-muted/30'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <Badge 
                                variant={isFirst ? 'default' : isLast ? 'destructive' : 'secondary'}
                                className="shrink-0 w-8 text-center"
                              >
                                {index + 1}
                              </Badge>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-foreground">
                                  {travelTime.participantName}
                                </span>
                                {isFirst && (
                                  <Badge variant="outline" className="text-xs bg-green-600 text-white border-green-600">
                                    최단
                                  </Badge>
                                )}
                                {isLast && (
                                  <Badge variant="outline" className="text-xs bg-red-600 text-white border-red-600">
                                    최장
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0 ml-3">
                              <div className={`text-lg font-bold ${
                                isFirst ? 'text-green-600 dark:text-green-400' : 
                                isLast ? 'text-red-600 dark:text-red-400' : 
                                'text-foreground'
                              }`}>
                                {travelTime.duration}분
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {((travelTime.distance || 0) / 1000).toFixed(1)}km
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
