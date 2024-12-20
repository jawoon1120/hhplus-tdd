## ❓ [과제] `point` 패키지의 TODO 와 테스트코드를 작성해주세요.

- PATCH  `/point/{id}/charge` : 포인트를 충전한다.
- PATCH `/point/{id}/use` : 포인트를 사용한다.
- *GET `/point/{id}` : 포인트를 조회한다.*
- *GET `/point/{id}/histories` : 포인트 내역을 조회한다.*
- *잔고가 부족할 경우, 포인트 사용은 실패하여야 합니다.*
- *동시에 여러 건의 포인트 충전, 이용 요청이 들어올 경우 순차적으로 처리되어야 합니다.*

- `/point` 패키지 (디렉토리) 내에 `PointService` 기본 기능 작성
- `/database` 패키지의 구현체는 수정하지 않고, 이를 활용해 기능을 구현
- 각 기능에 대한 단위 테스트 작성

> 총 4가지 기본 기능 (포인트 조회, 포인트 충전/사용 내역 조회, 충전, 사용) 을 구현합니다.


**STEP01** `기본과제`

- 포인트 충전, 사용에 대한 정책 추가 (잔고 부족, 최대 잔고 등)
- 동시에 여러 요청이 들어오더라도 순서대로 (혹은 한번에 하나의 요청씩만) 제어될 수 있도록 리팩토링
- 동시성 제어에 대한 통합 테스트 작성


<br/>  
<br/>  
<br/>  

## 요구사항 분석


- 포인트 조회  
  - 전제조건) 유저가 존재하지 않는 경우, 초기값 포인트는 0  
  - cf1) 올바르지 않는 userID 인 경우, 예외 발생
- 포인트 충전
  - 포인트 조회
  - 포인트 추가
  - 포인트 내역 추가  
  - cf1) 잔고가 최대 잔고 10000을 초과하는 경우, 포인트 충전 실패
  - cf2) 올바르지 않는 userID 인 경우, 예외 발생
  - cf3) 음수로 충전시 예외발생
  - cf3) 0으로 충전시 예외발생
- 포인트 사용
  - 포인트 조회
  - 포인트 차감
  - 포인트 내역 추가  
  - cf1) 잔고가 부족한 경우, 포인트 사용 실패  
  - cf2) 올바르지 않는 userID 인 경우, 예외 발생
  - cf3) 음수로 사용시 예외발생
  - cf3) 0으로 사용시 예외발생
- 포인트 내역 조회
  - 포인트 충전 성공
  - 포인트 사용 성공


- 동시성
  - 동일한 유저의 포인트 조회, 충전, 사용 요청이 동시에 여러 건 들어올 경우 순차적으로 처리되어야 합니다.
  - 동일한 유저의 충전과 사용 요청이 동시에 들어올 경우 충전 손실이 발생하지 않아야 한다
  - 다른 유저들간은 조회, 충전, 사용 요청은 독립적으로 처리


-----------

# 동시성 제어 방식에 대한 분석 및 보고서 작성


### 발생 원인
nodejs에서 비동기 테스크는 libuv 내에서 싱글 스레드인 이벤트 루프를 통해서 thread pool로 처리됩니다.   
이때 thread pool은 멀티 스레드이기 떄문에 비동기 작업들이 동시에 실행될 수 있습니다.  
그렇기 때문에 동시성 관련된 이슈가 발생할 수 있습니다

ex) 동시에 요청 2개가 들어오고 각 요청은 3개의 callback 함수를 호출한다고 가정

요청 A : callback1, callback2, callback3
요청 B : callback1-1, callback2-1, callback3-1

요청 A의 callback함수와 요청 B의 callback함수가 싱글스레드로 동작하는 이벤트 루프를 통해서 thread pool로 callback함수들이 전달되고 이때 같은 리소스에 접근할 경우 동시성 이슈가 발생할 수 있습니다

### 대안
외부 인프라 사용을 제외하고 고려했던 대안들을 말씀드리겠습니다

1. async-mutex의 Semaphore
- 동작
  - 각 스레드가 고유한 값을 가지고 있고 자원을 사용할 때는 해당 값으로 변경
  - 같은 자원을 접근하려는 다른 스레드들은 일정기간 동안 대기
  - 대기 중인 스레드들은 자원을 사용하는 스레드가 자원을 반납할 때까지 대기
  - 자원을 사용하는 스레드가 자원을 반납하면 대기 중인 스레드들 중 하나가 자원을 사용
  - 자원을 사용할 때는 해당 값으로 변경
  - ... 반복
- 선택하지 않은 이유
  - 복수개의 스레드가 하나의 공유 자원을 접근하는게 아니라 하나의 스레드가 하나의 공유자원을 접근하는게 목적이었습니다 

2. async-lock
- 동작
  - 각 리소스에 대해 고유한 키를 가진 락을 생성
  - 동일한 키에 대한 요청이 들어오면 큐에 적재
  - 현재 실행 중인 작업이 완료되면 큐에서 다음 작업을 실행
  - 작업이 완료되면 자동으로 락이 해제되어 다음 작업 실행
  - Promise 기반으로 동작하여 비동기 작업에 최적화
- 선택하지 않은 이유
  - 작업 완료 시 자동으로 락 해제
    - 락의 획득과 해제를 명시적으로 관리해서 inteceptor로 관리하고 싶었음  
    

3. 큐 사용
- 동작
   - 유저별로 큐를 생성하고 요청을 큐에 추가
   - 큐에 있는 요청을 순차적으로 처리
- 선택하지 않은 이유
  - 유저수 별로 큐를 생성
    - 시스템의 부하가 크다고 판단


### 선택한 방법

**async-mutex의 Mutex를 활용한 인터셉터**
- 이유
  - 스레드 간의 상호 배제
  - 프로세스가 공유데이터에 접근시 단독으로 실행되게 하기 위해 lock과 unlock으로 관리
  - async-mutex의 Mutex는 락의 획득과 해제를 명시적으로 관리
    - 이를 통해 inteceptor에서 직접적으로 관리하고 싶었음
- 동작
  - 유저별로 동시성 제어는 userId를 key로 사용
  - 관심사의 분리를 위해서 lock 모듈 분리
    - 락 획득과 해제 서비스 존재
  - 요청별 동시성을 제어해야해서 AOP 컨셉인 인터셉터를 활용
    - 락 획득과 해제를 명시적으로 관리
    - 요청 왔을 때 락 획득 
    - 요청 처리한 이후 락 해제  
    - 만약 요청시 특정 유저의 요청에 대해서 락이 걸려있다면 락 풀릴때까지 대기
    - 락 풀리면 특정 유저의 요청에 대한 요청을 처리

### 향후 개선 방향
  - DB, Redis 외부 인프라를 사용하는 경우 외부 인프라에서 제공하는 동시성 제어 기능을 개선해야합니다
  - 조회와 데이터 조작을 분리하여 동시성 제어 기능을 최적화 해볼 수 있을 것 같습니다
  
