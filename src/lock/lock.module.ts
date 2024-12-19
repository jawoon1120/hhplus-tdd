import { Module } from '@nestjs/common';
import { LockService } from './lock.service';
import { UserLockInterceptor } from './user-lock.interceptor';

@Module({
  providers: [LockService, UserLockInterceptor],
  exports: [LockService, UserLockInterceptor],
})
export class LockModule {}
