import { Module } from '@nestjs/common';
import { PointController } from './point.controller';
import { DatabaseModule } from '../database/database.module';
import { PointService } from './point.service';
import { LockModule } from '../lock/lock.module';

@Module({
  imports: [DatabaseModule, LockModule],
  controllers: [PointController],
  providers: [PointService],
})
export class PointModule {}
