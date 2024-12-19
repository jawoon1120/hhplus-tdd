import { Injectable } from '@nestjs/common';
import { Mutex } from 'async-mutex';

@Injectable()
export class LockService {
  private locks: Map<number, Mutex> = new Map();

  async acquireLock(userId: number): Promise<() => void> {
    if (!this.locks.has(userId)) {
      this.locks.set(userId, new Mutex());
    }

    const mutex = this.locks.get(userId);
    const release = await mutex.acquire();
    return release;
  }

  releaseLock(userId: number): void {
    this.locks.delete(userId);
  }
}
