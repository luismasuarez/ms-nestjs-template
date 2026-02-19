import { Controller, Get } from '@nestjs/common';
import { NativeRpcService } from '../shared/services/native-rpc.service';

@Controller('example')
export class ExampleHttpController {
  constructor(private nativeRpc: NativeRpcService) {}

  @Get('call-rpc')
  async callRpc() {
    const res = await this.nativeRpc.call('test.pattern', { msg: 'hello from http' });
    return res;
  }
}
