import { FR } from '../../copy/fr';

interface AiReviewBannerProps {
  /** 0 to 1. */
  confidence: number;
  hasFieldsToComplete: boolean;
}

export function AiReviewBanner({ confidence, hasFieldsToComplete }: AiReviewBannerProps) {
  return (
    <div className="ai-banner">
      <p className="ai-banner__score">{FR.ai.confidence(Math.round(confidence * 100))}</p>
      <p>{FR.ai.reminder}</p>
      {hasFieldsToComplete && <p>{FR.ai.toCompleteNote}</p>}
    </div>
  );
}
