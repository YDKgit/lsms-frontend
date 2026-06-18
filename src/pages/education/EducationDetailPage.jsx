import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getEducation, updateEducationProgress } from '../../api/education';
import { useAuth } from '../../context/AuthContext';

const SYNC_INTERVAL_MS = 10000;
const JUMP_THRESHOLD = 15;  // 이 초 이상 앞으로 건너뛰면 점프로 판정
const JUMP_PENALTY_MS = 20000; // 점프 후 이 시간 동안 저장 차단

export default function EducationDetailPage() {
  const { contentId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const lastSyncedRef = useRef(0);
  const jumpBlockedUntilRef = useRef(0); // 점프 차단 해제 시각 (Date.now() 기준)
  const unmountedRef = useRef(false);    // 언마운트 후 상태 업데이트 방지
  const [content, setContent] = useState(null);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);

  const syncProgress = useCallback(async (seconds, { silent = false } = {}) => {
    if (unmountedRef.current) return;
    const point = Math.floor(seconds);
    if (point < 0 || Number.isNaN(point)) return;
    if (silent && point === lastSyncedRef.current) return;

    setSyncing(true);
    try {
      await updateEducationProgress(token, contentId, point);
      lastSyncedRef.current = point;
      if (!silent && !unmountedRef.current) {
        const updated = await getEducation(token, contentId);
        if (!unmountedRef.current) setContent(updated);
      }
    } catch (err) {
      if (!silent && !unmountedRef.current) setError(err.message);
    } finally {
      if (!unmountedRef.current) setSyncing(false);
    }
  }, [token, contentId]);

  useEffect(() => {
    getEducation(token, contentId)
      .then(setContent)
      .catch((err) => setError(err.message));
  }, [token, contentId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !content) return undefined;

    const handleLoadedMetadata = () => {
      if (content.lastViewedPoint > 0 && content.lastViewedPoint < video.duration) {
        video.currentTime = content.lastViewedPoint;
      }
    };

    const isBlocked = () => Date.now() < jumpBlockedUntilRef.current;

    const handleSeeked = () => {
      const jumped = video.currentTime - lastSyncedRef.current > JUMP_THRESHOLD;
      if (jumped) {
        jumpBlockedUntilRef.current = Date.now() + JUMP_PENALTY_MS;
      }
    };

    const handlePause = () => {
      if (isBlocked()) return;
      syncProgress(video.currentTime);
    };

    const intervalId = window.setInterval(() => {
      if (!video.paused && !isBlocked()) {
        syncProgress(video.currentTime, { silent: true });
      }
    }, SYNC_INTERVAL_MS);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('pause', handlePause);

    return () => {
      unmountedRef.current = true;
      window.clearInterval(intervalId);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('pause', handlePause);
    };
  }, [content, syncProgress]);

  if (error && !content) return <p className="error-text">{error}</p>;
  if (!content) return <p>불러오는 중...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>안전교육 상세 및 수강</h2>
        <button type="button" className="btn btn-outline" onClick={() => navigate('/educations')}>
          목록으로
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      <section className="card education-detail">
        <div className="education-detail-meta">
          <span>{content.categoryName}</span>
          <span>{content.termTitle}</span>
          <span>필수 시청 {content.requiredTime}초</span>
          <span className={content.isCompleted ? 'education-badge' : 'muted-text'}>
            {content.isCompleted ? '수료 완료' : `진도 ${content.learningRate}%`}
          </span>
          {syncing && <span className="muted-text">진도 저장 중...</span>}
        </div>

        <h3>{content.title}</h3>
        <p className="education-desc">{content.description}</p>

        <video
          ref={videoRef}
          className="education-video"
          src={content.videoUrl}
          controls
          playsInline
        >
          <track kind="captions" />
        </video>

        <p className="muted-text section-desc">
          영상 시청 중 10초마다, 일시정지 시점에 진도가 자동 저장됩니다.
          {content.lastViewedPoint > 0 && ` (이어보기: ${content.lastViewedPoint}초)`}
        </p>
      </section>
    </div>
  );
}
