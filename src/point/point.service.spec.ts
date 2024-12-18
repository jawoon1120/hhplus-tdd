import { Test, TestingModule } from '@nestjs/testing';
import { PointService } from './point.service';
import { UserPointTable } from '../database/userpoint.table';
import { PointHistoryTable } from '../database/pointhistory.table';
import { UserPoint } from './point.model';

describe('PointService', () => {
    let pointService: PointService;
    let userPointTable: jest.Mocked<UserPointTable>;
    let pointHistoryTable: jest.Mocked<PointHistoryTable>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PointService,
                {
                    provide: UserPointTable, // 의존성을 Mock으로 설정
                    useValue: {
                        selectById: jest.fn(),
                        insertOrUpdate: jest.fn(),
                    },
                },
                {
                    provide: PointHistoryTable,
                    useValue: {
                        insert: jest.fn(),
                        selectAllByUserId: jest.fn(),
                    },
                },
            ],
        }).compile();

        pointService = module.get(PointService);
        userPointTable = module.get(UserPointTable);
        pointHistoryTable = module.get(PointHistoryTable);
    });

    describe('포인트 조회', () => {
        it('초기 유저 포인트 조회', async () => {
            const userDefaultPoint: UserPoint = { id: 1, point: 0, updateMillis: Date.now() };
            userPointTable.selectById.mockResolvedValue(userDefaultPoint);
            const result = await pointService.getPoint(1);
            expect(result).toEqual(userDefaultPoint);
        });

        it('음의 정수인 Id로 포인트 조회시 에러 반환', async () => {
            userPointTable.selectById.mockRejectedValue(new Error('올바르지 않은 ID 값 입니다.'));
            await expect(pointService.getPoint(-1)).rejects.toThrow('올바르지 않은 ID 값 입니다.');
        });

        it('0으로 포인트 조회시 에러 반환', async () => {
            userPointTable.selectById.mockRejectedValue(new Error('올바르지 않은 ID 값 입니다.'));
            await expect(pointService.getPoint(0)).rejects.toThrow('올바르지 않은 ID 값 입니다.');
        });

        it('실수로 포인트 조회시 에러 반환', async () => {
            userPointTable.selectById.mockRejectedValue(new Error('올바르지 않은 ID 값 입니다.'));
            await expect(pointService.getPoint(1.1)).rejects.toThrow('올바르지 않은 ID 값 입니다.');
        });

        it('NaN으로 포인트 조회시 에러 반환', async () => {
            userPointTable.selectById.mockRejectedValue(new Error('올바르지 않은 ID 값 입니다.'));
            await expect(pointService.getPoint(NaN)).rejects.toThrow('올바르지 않은 ID 값 입니다.');
        });

        it('undefined로 포인트 조회시 에러 반환', async () => {
            userPointTable.selectById.mockRejectedValue(new Error('올바르지 않은 ID 값 입니다.'));
            await expect(pointService.getPoint(undefined)).rejects.toThrow(
                '올바르지 않은 ID 값 입니다.',
            );
        });

        it('null로 포인트 조회시 에러 반환', async () => {
            userPointTable.selectById.mockRejectedValue(new Error('올바르지 않은 ID 값 입니다.'));
            await expect(pointService.getPoint(null)).rejects.toThrow(
                '올바르지 않은 ID 값 입니다.',
            );
        });
    });

    describe('포인트 충전', () => {
        it('포인트에 0을 충전시 에러 반환', async () => {
            await expect(pointService.chargePoint(1, 0)).rejects.toThrow(
                '포인트에 0을 충전할 수 없다',
            );
        });

        it('포인트에 음수로 충전시 에러 반환', async () => {
            await expect(pointService.chargePoint(1, -20)).rejects.toThrow(
                '음수로 충전시 예외발생',
            );
        });

        it('음수의 Id로 포인트 조회시 에러 반환', async () => {
            userPointTable.selectById.mockRejectedValue(new Error('올바르지 않은 ID 값 입니다.'));

            await expect(pointService.getPoint(-1)).rejects.toThrow('올바르지 않은 ID 값 입니다.');
        });

        it('Id가 0으로 포인트 조회시 에러 반환', async () => {
            userPointTable.selectById.mockRejectedValue(new Error('올바르지 않은 ID 값 입니다.'));

            await expect(pointService.getPoint(0)).rejects.toThrow('올바르지 않은 ID 값 입니다.');
        });
        it('Id가 실수로 포인트 조회시 에러 반환', async () => {
            userPointTable.selectById.mockRejectedValue(new Error('올바르지 않은 ID 값 입니다.'));

            await expect(pointService.getPoint(1.1)).rejects.toThrow('올바르지 않은 ID 값 입니다.');
        });
        it('Id가 NaN으로 포인트 조회시 에러 반환', async () => {
            userPointTable.selectById.mockRejectedValue(new Error('올바르지 않은 ID 값 입니다.'));

            await expect(pointService.getPoint(NaN)).rejects.toThrow('올바르지 않은 ID 값 입니다.');
        });

        it('Id가 Undefined으로 포인트 조회시 에러 반환', async () => {
            userPointTable.selectById.mockRejectedValue(new Error('올바르지 않은 ID 값 입니다.'));

            await expect(pointService.getPoint(undefined)).rejects.toThrow(
                '올바르지 않은 ID 값 입니다.',
            );
        });

        it('최대 포인트 초과해서 충전시 에러 반환', async () => {
            const userDefaultPoint: UserPoint = { id: 1, point: 0, updateMillis: Date.now() };
            userPointTable.selectById.mockResolvedValue(userDefaultPoint);

            await expect(pointService.chargePoint(1, 10100)).rejects.toThrow(
                '최대 잔고 초과, 포인트 충전 실패',
            );
        });
    });

    describe('포인트 사용', () => {
        it('포인트 사용 성공', async () => {
            const userDefaultPoint: UserPoint = { id: 1, point: 1000, updateMillis: Date.now() };
            userPointTable.selectById.mockResolvedValue(userDefaultPoint);

            const userUpdatedPoint: UserPoint = { id: 1, point: 900, updateMillis: Date.now() };
            userPointTable.insertOrUpdate.mockResolvedValue(userUpdatedPoint);

            const result = await pointService.usePoint(1, 100);
            expect(result).toEqual(userUpdatedPoint);
        });

        it('0 포인트로 충전시 에러 반환', async () => {
            await expect(pointService.usePoint(1, 0)).rejects.toThrow(
                '0으로 포인트를 사용시 예외 발생',
            );
        });

        it('음수의 포인트로 충전시 에러 반환', async () => {
            await expect(pointService.usePoint(1, -20)).rejects.toThrow(
                '음수로 포인트를 사용시 예외 발생',
            );
        });

        it('음수의 Id로 포인트 조회시 에러 반환', async () => {
            await expect(pointService.usePoint(-1, 100)).rejects.toThrow(
                '올바르지 않은 ID 값 입니다.',
            );
        });

        it('0인 Id로 포인트 조회시 에러 반환', async () => {
            await expect(pointService.usePoint(0, 100)).rejects.toThrow(
                '올바르지 않은 ID 값 입니다.',
            );
        });
        it('실수인 Id로 포인트 조회시 에러 반환', async () => {
            userPointTable.selectById.mockRejectedValue(new Error('올바르지 않은 ID 값 입니다.'));

            await expect(pointService.usePoint(1.1, 100)).rejects.toThrow(
                '올바르지 않은 ID 값 입니다.',
            );
        });

        it('잔고 부족시 포인트 사용 실패', async () => {
            const userDefaultPoint: UserPoint = { id: 1, point: 0, updateMillis: Date.now() };
            userPointTable.selectById.mockResolvedValue(userDefaultPoint);

            await expect(pointService.usePoint(1, 100)).rejects.toThrow(
                '잔고 부족, 포인트 사용 실패',
            );
        });
    });
});
