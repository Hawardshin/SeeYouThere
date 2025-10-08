'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Meeting } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Users, MapPin, Clock, Home, Trophy, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function SharePage() {
  const params = useParams();
  const meetingId = params.id as string;
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMeeting() {
      try {
        const response = await fetch(`/api/meetings?id=${meetingId}`);
        const data = await response.json();

        if (data.success) {
          setMeeting(data.meeting);
        } else {
          setError(data.error || '모임을 찾을 수 없습니다.');
        }
      } catch {
        setError('모임 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }

    if (meetingId) {
      fetchMeeting();
    }
  }, [meetingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8 flex items-center justify-center">
        <p className="text-lg">로딩 중...</p>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>오류</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <Link href="/">
              <Button>
                <Home className="h-4 w-4 mr-2" />
                홈으로 가기
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 통계 계산
  const stats = meeting.candidates.map((candidate) => {
    const times = candidate.travelTimes.map(tt => tt.duration);
    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const maxTime = Math.max(...times, 0);
    const avgTime = times.length > 0 ? totalTime / times.length : 0;
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

  const fairestLocation = stats.length > 0 
    ? stats.reduce((prev, curr) => curr.fairnessScore < prev.fairnessScore ? curr : prev)
    : null;

  const fastestLocation = stats.length > 0
    ? stats.reduce((prev, curr) => curr.totalTime < prev.totalTime ? curr : prev)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {meeting.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            공유된 모임 정보
          </p>
        </div>

        {/* 참여자 정보 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              참여자 ({meeting.participants.length}명)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {meeting.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{participant.name}</Badge>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {participant.startLocation}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 추천 장소 */}
        {(fairestLocation || fastestLocation) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {fairestLocation && (
              <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <Trophy className="h-5 w-5" />
                    가장 공평한 장소
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {fairestLocation.locationName}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-white dark:bg-gray-800">
                      평균 {Math.round(fairestLocation.avgTime)}분
                    </Badge>
                    <Badge variant="outline" className="bg-white dark:bg-gray-800">
                      공평도 {fairestLocation.fairnessScore.toFixed(1)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {fastestLocation && (
              <Card className="border-2 border-blue-500 bg-blue-50 dark:bg-blue-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <TrendingUp className="h-5 w-5" />
                    가장 빠른 장소
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {fastestLocation.locationName}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-white dark:bg-gray-800">
                      총합 {fastestLocation.totalTime}분
                    </Badge>
                    <Badge variant="outline" className="bg-white dark:bg-gray-800">
                      최대 {fastestLocation.maxTime}분
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Separator className="my-6" />

        {/* 후보 장소 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              후보 장소 ({meeting.candidates.length}개)
            </CardTitle>
            <CardDescription>각 장소별 소요시간 정보</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {meeting.candidates.map((candidate) => {
              const stat = stats.find(s => s.locationId === candidate.id);
              const isFairest = fairestLocation?.locationId === candidate.id;
              const isFastest = fastestLocation?.locationId === candidate.id;

              return (
                <div key={candidate.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{candidate.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {candidate.address}
                      </p>
                      <div className="flex gap-2 mt-2">
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

                  {/* 통계 */}
                  {stat && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                      <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-center">
                        <p className="text-xs text-gray-500">총 시간</p>
                        <p className="font-semibold">{stat.totalTime}분</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-center">
                        <p className="text-xs text-gray-500">평균</p>
                        <p className="font-semibold">{Math.round(stat.avgTime)}분</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-center">
                        <p className="text-xs text-gray-500">최대</p>
                        <p className="font-semibold">{stat.maxTime}분</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-center">
                        <p className="text-xs text-gray-500">공평도</p>
                        <p className="font-semibold">{stat.fairnessScore.toFixed(1)}</p>
                      </div>
                    </div>
                  )}

                  {/* 각 참여자별 시간 */}
                  <div className="space-y-1">
                    {candidate.travelTimes.map((tt) => (
                      <div
                        key={tt.participantId}
                        className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded"
                      >
                        <span className="text-gray-700 dark:text-gray-300">
                          {tt.participantName}
                        </span>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <Badge variant="outline">{tt.duration}분</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* 액션 버튼 */}
        <div className="mt-6 flex justify-center">
          <Link href="/">
            <Button size="lg">
              <Home className="h-4 w-4 mr-2" />
              새로운 모임 만들기
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
