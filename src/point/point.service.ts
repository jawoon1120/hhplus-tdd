import { Injectable } from '@nestjs/common';
import { PointHistoryTable } from '../database/pointhistory.table';
import { UserPointTable } from '../database/userpoint.table';
import { PointHistory, TransactionType, UserPoint } from './point.model';

@Injectable()
export class PointService {
    readonly MAX_POINT = 10000;
    constructor(
        private readonly userDb: UserPointTable,
        private readonly historyDb: PointHistoryTable,
    ) {}

    async getPoint(userId: number): Promise<UserPoint> {
        if (userId == null || userId == undefined || userId <= 0) {
            throw new Error('올바르지 않은 ID 값 입니다.');
        }
        return await this.userDb.selectById(userId);
    }

    async chargePoint(userId: number, amount: number): Promise<UserPoint> {
        if (amount == 0) {
            throw new Error('포인트에 0을 충전할 수 없다');
        }
        if (userId == null || userId == undefined || userId <= 0) {
            throw new Error('올바르지 않은 ID 값 입니다.');
        }
        if (amount < 0) {
            throw new Error('음수로 충전시 예외발생');
        }
        const userPoint = await this.userDb.selectById(userId);
        if (userPoint.point + amount > this.MAX_POINT) {
            throw new Error('최대 잔고 초과, 포인트 충전 실패');
        }
        const updatedPoint = await this.userDb.insertOrUpdate(userId, userPoint.point + amount);
        await this.historyDb.insert(userId, amount, TransactionType.CHARGE, Date.now());

        return updatedPoint;
    }

    async usePoint(userId: number, amount: number): Promise<UserPoint> {
        if (amount < 0) {
            throw new Error('음수로 포인트를 사용시 예외 발생');
        }
        if (amount == 0) {
            throw new Error('0으로 포인트를 사용시 예외 발생');
        }
        if (userId == null || userId == undefined || userId <= 0) {
            throw new Error('올바르지 않은 ID 값 입니다.');
        }
        const userPoint = await this.userDb.selectById(userId);
        if (userPoint.point - amount < 0) {
            throw new Error('잔고 부족, 포인트 사용 실패');
        }
        const updatedPoint = await this.userDb.insertOrUpdate(userId, userPoint.point - amount);
        await this.historyDb.insert(userId, amount, TransactionType.USE, Date.now());

        return updatedPoint;
    }

    async getHistory(userId: number): Promise<PointHistory[]> {
        if (userId == null || userId == undefined || !Number.isInteger(userId) || userId <= 0) {
            throw new Error('올바르지 않은 ID 값 입니다.');
        }
        return await this.historyDb.selectAllByUserId(userId);
    }
}
