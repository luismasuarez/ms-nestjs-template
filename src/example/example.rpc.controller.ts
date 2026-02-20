import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { UserFromRmq } from 'src/shared/decorators/user.decorator';
import { UserPayload } from 'src/shared/decorators/user.decorator';

@Controller()
export class ExampleRpcController {
  @MessagePattern('test.pattern')
  async handleTestPattern(@Payload() data: any, @UserPayload() user: UserFromRmq) {
    return { ok: true, user, };
  }
}
