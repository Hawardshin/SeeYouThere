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
import { Share2, Copy, Check, Loader2 } from 'lucide-react';
import AlertModal, { useAlertModal } from './AlertModal';

interface ShareDialogProps {
  meetingTitle: string;
  participants: Participant[];
  candidates: CandidateLocation[];
}

export default function ShareDialog({ meetingTitle, participants, candidates }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasShareApi, setHasShareApi] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { alertState, showAlert, closeAlert } = useAlertModal();

  useEffect(() => {
    setHasShareApi(typeof navigator !== 'undefined' && 'share' in navigator);
  }, []);

  // 모임 저장 및 공유 URL 생성
  const handleSaveMeeting = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: meetingTitle,
          participants,
          candidates,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShareUrl(data.shareUrl);
        return data.shareUrl;
      } else {
        showAlert('모임 저장에 실패했습니다.', { variant: 'error' });
        return null;
      }
    } catch (error) {
      console.error('모임 저장 오류:', error);
      showAlert('모임 저장 중 오류가 발생했습니다.', { variant: 'error' });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

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
    let urlToCopy = shareUrl;
    
    // 아직 저장되지 않았으면 먼저 저장
    if (!urlToCopy) {
      urlToCopy = await handleSaveMeeting();
      if (!urlToCopy) return;
    }

    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
      showAlert('복사에 실패했습니다.', { variant: 'error' });
    }
  };

  const handleShare = async () => {
    let urlToShare = shareUrl;
    
    // 아직 저장되지 않았으면 먼저 저장
    if (!urlToShare) {
      urlToShare = await handleSaveMeeting();
      if (!urlToShare) return;
    }
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: meetingTitle,
          text: `${meetingTitle} - 약속 장소 정보`,
          url: urlToShare,
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
          {/* 공유 URL 표시 */}
          {shareUrl ? (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-sm font-semibold mb-2">공유 링크</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border rounded text-sm"
                />
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="sm"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 공유 링크를 생성하려면 아래 버튼을 클릭하세요.
              </p>
            </div>
          )}

          {/* 미리보기 */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-sm font-semibold mb-2">미리보기</p>
            <pre className="text-xs whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
              {generateShareText()}
            </pre>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-2">
            {!shareUrl && (
              <Button
                onClick={handleSaveMeeting}
                className="flex-1"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    공유 링크 생성
                  </>
                )}
              </Button>
            )}
            
            {shareUrl && (
              <>
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
                      링크 복사
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
              </>
            )}
          </div>

          {/* 안내 */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>팁:</strong> 공유 링크를 통해 다른 사람들이 결과를 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </DialogContent>

      {/* Alert Modal */}
      <AlertModal
        open={alertState.open}
        onOpenChange={closeAlert}
        title={alertState.title}
        message={alertState.message}
        variant={alertState.variant}
      />
    </Dialog>
  );
}
