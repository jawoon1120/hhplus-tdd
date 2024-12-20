import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { PointHistory, UserPoint } from './point.model';
import { PointBody as PointDto } from './point.dto';
import { PointService } from './point.service';
import { UserLockInterceptor } from '../lock/user-lock.interceptor';

@Controller('/point')
export class PointController {
  constructor(private readonly pointService: PointService) {}

  /**
   * TODO - 특정 유저의 포인트를 조회하는 기능을 작성해주세요.
   */
  @Get(':id')
  @UseInterceptors(UserLockInterceptor)
  async point(@Param('id') id): Promise<UserPoint> {
    const userId = Number.parseInt(id);
    const { id: existedUserId, point, updateMillis } = await this.pointService.getPoint(userId);
    return { id: existedUserId, point, updateMillis };
  }

  /**
   * TODO - 특정 유저의 포인트 충전/이용 내역을 조회하는 기능을 작성해주세요.
   */
  @Get(':id/histories')
  @UseInterceptors(UserLockInterceptor)
  async history(@Param('id') id): Promise<PointHistory[]> {
    const userId = Number.parseInt(id);
    const pointHistories: PointHistory[] = await this.pointService.getHistory(userId);
    return pointHistories;
  }

  /**
   * TODO - 특정 유저의 포인트를 충전하는 기능을 작성해주세요.
   */
  @Patch(':id/charge')
  @UseInterceptors(UserLockInterceptor)
  async charge(@Param('id') id, @Body(ValidationPipe) pointDto: PointDto): Promise<UserPoint> {
    const userId = Number.parseInt(id);
    const updatedPoint = await this.pointService.chargePoint(userId, pointDto.amount);
    return updatedPoint;
  }

  /**
   * TODO - 특정 유저의 포인트를 사용하는 기능을 작성해주세요.
   */
  @Patch(':id/use')
  @UseInterceptors(UserLockInterceptor)
  async use(@Param('id') id, @Body(ValidationPipe) pointDto: PointDto): Promise<UserPoint> {
    const userId = Number.parseInt(id);
    const updatedPoint = await this.pointService.usePoint(userId, pointDto.amount);
    return updatedPoint;
  }
}
