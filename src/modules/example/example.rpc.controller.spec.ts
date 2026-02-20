import { ExampleRpcController } from './example.rpc.controller';
import { QueueMembersOperations, Queues } from '../../shared/constants/queues';
import type { UserFromRmq } from '../../shared/decorators/user.decorator';

describe('ExampleRpcController', () => {
  it('routes memberId payloads to GET_MEMBER_BY_ID', async () => {
    const nativeRpcService = {
      produceRpc: jest.fn().mockResolvedValue({ ok: true }),
    };
    const controller = new ExampleRpcController(nativeRpcService as any);
    const user = { church: 'church-1' } as UserFromRmq;

    const response = await controller.handleTestPattern(
      { memberId: 'member-1' },
      user,
    );

    expect(nativeRpcService.produceRpc).toHaveBeenCalledWith(
      {
        data: { memberId: 'member-1' },
        operation: QueueMembersOperations.GET_MEMBER_BY_ID,
      },
      Queues.MEMBER_V2,
    );
    expect(response).toEqual({
      ok: true,
      user,
      membersResponse: { ok: true },
    });
  });

  it('routes church payloads to GET_MEMBERS_BY_CHURCH', async () => {
    const nativeRpcService = {
      produceRpc: jest.fn().mockResolvedValue({ items: [] }),
    };
    const controller = new ExampleRpcController(nativeRpcService as any);
    const user = { church: 'church-1' } as UserFromRmq;

    const response = await controller.handleTestPattern({}, user);

    expect(nativeRpcService.produceRpc).toHaveBeenCalledWith(
      {
        user: { church: 'church-1' },
        operation: QueueMembersOperations.GET_MEMBERS_BY_CHURCH,
      },
      Queues.MEMBER_V2,
    );
    expect(response).toEqual({
      ok: true,
      user,
      membersResponse: { items: [] },
    });
  });
});
