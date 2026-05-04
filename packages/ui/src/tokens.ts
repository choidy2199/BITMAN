/**
 * toollab-design-system 토큰.
 * 노션 "UI관련" 문서의 색상/폰트 명세 그대로.
 */
export const tokens = {
  color: {
    primary: '#185FA5',
    primaryHover: '#134D85',
    cta: '#E8593C',
    ctaHover: '#D44A2E',
    section: '#1A1D23',
    border: '#E5E7EB',
    bg: '#FFFFFF',
    bgMuted: '#F8F9FA',
    text: '#1A1D23',
    textMuted: '#6B7280',
    success: '#10B981',
    danger: '#EF4444',
  },
  font: {
    sans: 'Pretendard, system-ui, -apple-system, sans-serif',
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
  },
} as const;

export type Tokens = typeof tokens;
