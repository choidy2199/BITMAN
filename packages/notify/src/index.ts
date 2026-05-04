/**
 * 알림 인터페이스 — Phase 0 stub.
 * Phase 1에서 카카오 알림톡 실제 발송 구현. 실패 시 SMS fallback.
 */

import { KakaoTemplate, type KakaoTemplateCode, type KakaoTemplateVars } from './templates';

export { KakaoTemplate };
export type { KakaoTemplateCode, KakaoTemplateVars };

export interface SendKakaoRequest<T extends KakaoTemplateCode> {
  to: string;
  template: T;
  vars: KakaoTemplateVars[T];
}

export interface NotifyClient {
  sendKakao<T extends KakaoTemplateCode>(req: SendKakaoRequest<T>): Promise<void>;
  sendSms(to: string, message: string): Promise<void>;
}

class StubNotify implements NotifyClient {
  async sendKakao<T extends KakaoTemplateCode>(req: SendKakaoRequest<T>): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`[notify:stub] kakao ${req.template} → ${req.to}`, req.vars);
    }
  }
  async sendSms(_to: string, _message: string): Promise<void> {
    // no-op
  }
}

export const notify: NotifyClient = new StubNotify();
