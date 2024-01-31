import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HolidaysModule } from './holidays/holidays.module';
import { HolidayScrapperService } from './services/holiday-scrapper/holiday-scrapper.service';
import { UserAgentMiddleware } from './middlewares/user-agent.middleware';
import { IpMiddleware } from './middlewares/ip.middleware';

@Module({
  imports: [HolidaysModule],
  controllers: [AppController],
  providers: [AppService, HolidayScrapperService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserAgentMiddleware, IpMiddleware).forRoutes('*'); // Aplica los middlewares a todas las rutas
  }
}
