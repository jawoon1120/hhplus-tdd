import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Point Controller (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('동시성 테스트', () => {
    it('동일한 유저의 최대 포인트 이하의 충전 요청이 동시에 들어온 경우 순차적으로 처리된다', async () => {
      const userId = 1;
      const chargeAmount = 1000;
      const numberOfRequests = 5;

      const chargeRequests = Array(numberOfRequests)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .patch(`/point/${userId}/charge`)
            .send({ amount: chargeAmount }),
        );

      const responses = await Promise.allSettled(chargeRequests);

      responses.forEach((response) => {
        if (response.status === 'fulfilled') {
          expect(response.value.status).toBe(200);
        }
      });

      const finalPointResponse = await request(app.getHttpServer())
        .get(`/point/${userId}`)
        .expect(200);

      expect(finalPointResponse.body.point).toBe(chargeAmount * numberOfRequests);
    });

    it('동일한 유저의 충전과 사용 요청이 동시에 들어올 경우 충전 손실이 발생하지 않아야 한다', async () => {
      const userId = 1;
      const chargeAmount = 500;
      const useAmount = 300;

      const requests = [
        request(app.getHttpServer())
          .patch(`/point/${userId}/charge`)
          .send({ amount: chargeAmount }),
        request(app.getHttpServer()).patch(`/point/${userId}/use`).send({ amount: useAmount }),
        request(app.getHttpServer())
          .patch(`/point/${userId}/charge`)
          .send({ amount: chargeAmount }),
      ];

      const responses = await Promise.allSettled(requests);

      responses.forEach((response) => {
        if (response.status === 'fulfilled') {
          expect(response.value.status).toBe(200);
        }
      });

      const finalPointResponse = await request(app.getHttpServer())
        .get(`/point/${userId}`)
        .expect(200);

      const expectedFinalPoint = chargeAmount * 2 - useAmount;

      expect(finalPointResponse.body.point).toBe(expectedFinalPoint);
    });

    it('서로 다른 유저의 요청은 동시에 처리되어야 한다', async () => {
      const user1Id = 1;
      const user2Id = 2;
      const chargeAmount = 1000;

      // 두 유저의 동시 요청 준비
      const requests = [
        // 첫 번째 유저의 요청들
        request(app.getHttpServer())
          .patch(`/point/${user1Id}/charge`)
          .send({ amount: chargeAmount }),
        request(app.getHttpServer()).patch(`/point/${user1Id}/use`).send({ amount: 500 }),

        // 두 번째 유저의 요청들
        request(app.getHttpServer())
          .patch(`/point/${user2Id}/charge`)
          .send({ amount: chargeAmount }),
        request(app.getHttpServer()).patch(`/point/${user2Id}/use`).send({ amount: 300 }),
      ];

      const startTime = Date.now();
      const responses = await Promise.allSettled(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // 모든 요청이 성공했는지 확인
      responses.forEach((response) => {
        if (response.status === 'fulfilled') {
          expect(response.value.status).toBe(200);
        }
      });

      const user1FinalPoint = await request(app.getHttpServer())
        .get(`/point/${user1Id}`)
        .expect(200);

      const user2FinalPoint = await request(app.getHttpServer())
        .get(`/point/${user2Id}`)
        .expect(200);

      expect(user1FinalPoint.body.point).toBe(chargeAmount - 500);
      expect(user2FinalPoint.body.point).toBe(chargeAmount - 300);

      // 서로 다른 유저의 요청이 병렬로 처리되었는지 확인
      // 포인트 충전, 사용 요청별 소요되는 시간
      // UserPointTable.selectById : randomInt(200)
      // UserPointTable.insertOrUpdate : randomInt(300)
      // PointHistoryTable.insert : randomInt(300)
      // => 최대 800ms 소요
      // 4개의 요청이 순차적으로 처리된다면 최대 3200ms 소요
      // 다른 유저별 요청이 병렬로 처리된다면 최대 1600ms 소요
      expect(totalTime).toBeLessThan(1600);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
