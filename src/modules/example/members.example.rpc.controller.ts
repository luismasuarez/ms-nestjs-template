import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { QueueMembersOperations, Queues } from 'src/shared/constants/queues';
import type { UserFromRmq } from 'src/shared/decorators/user.decorator';
import { UserPayload } from 'src/shared/decorators/user.decorator';
import { NativeRpcService } from 'src/shared/services/native-rpc.service';

@Controller()
export class MembersExampleRpcController {
  constructor(private readonly nativeRpcService: NativeRpcService) {}

  @MessagePattern('example.members')
  async handleMembersExample(@Payload() data: any, @UserPayload() user: UserFromRmq) {
    const church = user?.church;
    const memberId = data?.memberId;

    const payload = memberId
      ? {
          data: { memberId },
          operation: QueueMembersOperations.GET_MEMBER_BY_ID,
        }
      : {
          user: { church },
          operation: QueueMembersOperations.GET_MEMBERS_BY_CHURCH,
        };

    const membersResponse = await this.nativeRpcService.produceRpc(
      payload,
      Queues.MEMBER_V2,
    );

    return { ok: true, user, membersResponse };
  }
}
