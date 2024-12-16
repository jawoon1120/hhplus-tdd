import { Test, TestingModule } from '@nestjs/testing';
import { PointService } from './point.service';
import { UserPointTable } from 'src/database/userpoint.table';
import { PointHistoryTable } from 'src/database/pointhistory.table';

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
});
