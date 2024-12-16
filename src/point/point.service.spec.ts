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

        it('양의 정수 이외의 Id로 포인트 조회시 에러 반환', async () => {
            userPointTable.selectById.mockRejectedValue(new Error('올바르지 않은 ID 값 입니다.'));

            await expect(pointService.getPoint(-1)).rejects.toThrow('올바르지 않은 ID 값 입니다.');
            await expect(pointService.getPoint(0)).rejects.toThrow('올바르지 않은 ID 값 입니다.');
            await expect(pointService.getPoint(1.1)).rejects.toThrow('올바르지 않은 ID 값 입니다.');
            await expect(pointService.getPoint(NaN)).rejects.toThrow('올바르지 않은 ID 값 입니다.');
            await expect(pointService.getPoint(undefined)).rejects.toThrow(
                '올바르지 않은 ID 값 입니다.',
            );
            await expect(pointService.getPoint(null)).rejects.toThrow(
                '올바르지 않은 ID 값 입니다.',
            );
        });
    });
});
