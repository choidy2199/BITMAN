/**
 * 큐 인터페이스 — Phase 0에서는 즉시실행 stub.
 * Phase 4에서 Upstash QStash로 교체.
 *
 * 입찰/결제 같은 쓰기 트래픽은 큐로 줄세움 (노션 "쓰기는 줄세움" 원칙).
 */

export type JobName =
  | 'order.created'
  | 'order.confirm.auto'
  | 'settlement.run'
  | 'price.snapshot'
  | 'kakao.send'
  | 'lowest_price.notify';

export interface QueueClient {
  enqueue<T = unknown>(job: JobName, payload: T, opts?: EnqueueOptions): Promise<void>;
}

export interface EnqueueOptions {
  /** 지연 실행 (초). Phase 4 QStash에서 사용. */
  delaySeconds?: number;
  /** 멱등 키. 같은 키로 여러 번 enqueue되어도 1회만 처리. */
  idempotencyKey?: string;
}

class ImmediateQueue implements QueueClient {
  async enqueue<T>(job: JobName, payload: T, opts?: EnqueueOptions): Promise<void> {
    // Phase 0: 단순 로그. 실제 핸들러 등록 없음.
    // Phase 1+에서 cron-worker가 핸들러를 등록하면 그쪽으로 라우팅.
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`[queue:stub] ${job}`, { payload, opts });
    }
  }
}

export const queue: QueueClient = new ImmediateQueue();
