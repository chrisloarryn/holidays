import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { HolidaysModule } from './holidays/holidays.module';
import { RootController } from './root/presentation/http/root.controller';
import { UserAgentMiddleware } from './shared/infrastructure/http/middleware/user-agent.middleware';
import { IpMiddleware } from './shared/infrastructure/http/middleware/ip.middleware';

@Module({
  imports: [HolidaysModule],
  controllers: [RootController]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserAgentMiddleware, IpMiddleware).forRoutes('{*path}');
  }
}
