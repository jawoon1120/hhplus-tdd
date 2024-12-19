import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LockService } from './lock.service';
import { Request } from 'express';

@Injectable()
export class UserLockInterceptor implements NestInterceptor {
  constructor(private readonly lockService: LockService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request: Request = context.switchToHttp().getRequest();
    const userId: number = Number.parseInt(request.params.id);

    if (!userId) {
      throw new Error('User ID is required for lock management.');
    }

    const release = await this.lockService.acquireLock(userId);

    return next.handle().pipe(
      finalize(() => {
        release();
        this.lockService.releaseLock(userId);
      }),
    );
  }
}
