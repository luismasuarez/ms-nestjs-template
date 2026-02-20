import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { UserFromRmq } from 'src/shared/decorators/user.decorator';
import { UserPayload } from 'src/shared/decorators/user.decorator';
import { NativeRpcService } from 'src/shared/services/native-rpc.service';

@Controller()
export class ExampleRpcController {
  constructor(private readonly nativeRpcService: NativeRpcService) {}

  @MessagePattern('test.pattern')
  async handleTestPattern(@Payload() data: any, @UserPayload() user: UserFromRmq) {
    const church = data?.church ?? user?.church;

    const payload = {
      user: { church },
      operation: 'getMembersByChurch',
    };

    const membersResponse = await this.nativeRpcService.produceRpc(
      payload,
      'member_v2',
    );

    return { ok: true, user, membersResponse };
  }
}
