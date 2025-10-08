'use client';

import { useState, useEffect } from 'react';
import { Participant, CandidateLocation } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Share2, Copy, Check } from 'lucide-react';

interface ShareDialogProps {
  meetingTitle: string;
  participants: Participant[];
  candidates: CandidateLocation[];
}

export default function ShareDialog({ meetingTitle, participants, candidates }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasShareApi, setHasShareApi] = useState(false);

  useEffect(() => {
    setHasShareApi(typeof navigator !== 'undefined' && 'share' in navigator);
  }, []);

  const generateShareText = () => {
    let text = `🎉 ${meetingTitle}\n\n`;
    text += `👥 참여자 (${participants.length}명)\n`;
    participants.forEach((p) => {
      text += `  • ${p.name} - ${p.startLocation}\n`;
    });
    text += `\n📍 후보 장소 (${candidates.length}개)\n`;
    
    candidates.forEach((candidate) => {
      const totalTime = candidate.travelTimes.reduce((sum, tt) => sum + tt.duration, 0);
      const maxTime = Math.max(...candidate.travelTimes.map(tt => tt.duration));
      
      text += `\n  📌 ${candidate.name}\n`;
      text += `     주소: ${candidate.address}\n`;
      text += `     총 시간: ${totalTime}분 | 최대: ${maxTime}분\n`;
      
      candidate.travelTimes.forEach((tt) => {
        text += `     - ${tt.participantName}: ${tt.duration}분\n`;
      });
    });

    text += '\n✨ SeeYouThere로 생성됨';
    return text;
  };

  const handleCopy = async () => {
    const text = generateShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
      alert('복사에 실패했습니다.');
    }
  };

  const handleShare = async () => {
    const text = generateShareText();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: meetingTitle,
          text: text,
        });
      } catch (err) {
        console.error('공유 실패:', err);
      }
    } else {
      // Web Share API를 지원하지 않는 경우 복사
      handleCopy();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Share2 className="h-5 w-5" />
          결과 공유하기
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>모임 정보 공유</DialogTitle>
          <DialogDescription>
            아래 정보를 복사하거나 공유할 수 있습니다
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 미리보기 */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <pre className="text-sm whitespace-pre-wrap font-mono">
              {generateShareText()}
            </pre>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-2">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="flex-1"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  복사됨!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  텍스트 복사
                </>
              )}
            </Button>
            
            {hasShareApi && (
              <Button
                onClick={handleShare}
                className="flex-1"
              >
                <Share2 className="h-4 w-4 mr-2" />
                공유하기
              </Button>
            )}
          </div>

          {/* 링크 공유 안내 */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>팁:</strong> 이 정보를 카카오톡, 이메일 등으로 전달하여 
              참여자들과 공유할 수 있습니다.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
