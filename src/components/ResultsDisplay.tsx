'use client';

import { useMemo } from 'react';
import { CandidateLocation, LocationStats } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, BarChart3, Award } from 'lucide-react';

interface ResultsDisplayProps {
  candidates: CandidateLocation[];
  selectedLocationId: string | null;
}

export default function ResultsDisplay({ candidates, selectedLocationId }: ResultsDisplayProps) {
  const stats = useMemo(() => {
    return candidates.map((candidate): LocationStats => {
      const times = candidate.travelTimes.map(tt => tt.duration);
      const totalTime = times.reduce((sum, time) => sum + time, 0);
      const maxTime = Math.max(...times, 0);
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
        avgTime,
        fairnessScore,
      };
    });
  }, [candidates]);

  const fairestLocation = useMemo(() => {
    if (stats.length === 0) return null;
    return stats.reduce((prev, curr) => 
      curr.fairnessScore < prev.fairnessScore ? curr : prev
    );
  }, [stats]);

  const fastestLocation = useMemo(() => {
    if (stats.length === 0) return null;
    return stats.reduce((prev, curr) => 
      curr.totalTime < prev.totalTime ? curr : prev
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
          <p className="text-center text-gray-500 py-8">
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
        {/* 가장 공평한 장소 */}
        {fairestLocation && (
          <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <Trophy className="h-5 w-5" />
                가장 공평한 장소
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {fairestLocation.locationName}
                </h3>
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="outline" className="bg-white dark:bg-gray-800">
                    평균 {Math.round(fairestLocation.avgTime)}분
                  </Badge>
                  <Badge variant="outline" className="bg-white dark:bg-gray-800">
                    공평도 {fairestLocation.fairnessScore.toFixed(1)}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  모든 참여자의 소요시간이 비슷합니다
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 가장 빠른 장소 */}
        {fastestLocation && (
          <Card className="border-2 border-blue-500 bg-blue-50 dark:bg-blue-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <TrendingUp className="h-5 w-5" />
                가장 빠른 장소
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {fastestLocation.locationName}
                </h3>
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="outline" className="bg-white dark:bg-gray-800">
                    총합 {fastestLocation.totalTime}분
                  </Badge>
                  <Badge variant="outline" className="bg-white dark:bg-gray-800">
                    최대 {fastestLocation.maxTime}분
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  모든 참여자의 총 이동시간이 가장 적습니다
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
            클릭하여 각 장소의 상세 정보를 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.map((stat) => {
              const isFairest = fairestLocation?.locationId === stat.locationId;
              const isFastest = fastestLocation?.locationId === stat.locationId;
              const isSelected = selectedLocationId === stat.locationId;

              return (
                <div
                  key={stat.locationId}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {stat.locationName}
                      </h4>
                      <div className="flex gap-2 mt-1">
                        {isFairest && (
                          <Badge className="bg-green-500 text-white text-xs">
                            <Trophy className="h-3 w-3 mr-1" />
                            공평
                          </Badge>
                        )}
                        {isFastest && (
                          <Badge className="bg-blue-500 text-white text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            빠름
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div className="bg-white dark:bg-gray-800 p-2 rounded">
                      <p className="text-xs text-gray-500">총 시간</p>
                      <p className="font-semibold">{stat.totalTime}분</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-2 rounded">
                      <p className="text-xs text-gray-500">평균</p>
                      <p className="font-semibold">{Math.round(stat.avgTime)}분</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-2 rounded">
                      <p className="text-xs text-gray-500">최대</p>
                      <p className="font-semibold">{stat.maxTime}분</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-2 rounded">
                      <p className="text-xs text-gray-500">공평도</p>
                      <p className="font-semibold">{stat.fairnessScore.toFixed(1)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
