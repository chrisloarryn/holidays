import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller()
@ApiTags('root')
export class RootController {
  @Get()
  @ApiOperation({
    summary: 'Root endpoint'
  })
  @ApiOkResponse({
    schema: {
      type: 'string',
      example: 'Hello World!'
    }
  })
  getHello(): string {
    return 'Hello World!';
  }
}
