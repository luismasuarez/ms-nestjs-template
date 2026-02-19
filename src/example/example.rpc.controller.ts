import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class ExampleRpcController {
  @MessagePattern('test.pattern')
  async handleTestPattern(@Payload() data: any) {
    return { ok: true, echo: data };
  }
}
