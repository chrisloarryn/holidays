import { AppModule } from './app.module';
import { IpMiddleware } from './shared/infrastructure/http/middleware/ip.middleware';
import { UserAgentMiddleware } from './shared/infrastructure/http/middleware/user-agent.middleware';

describe('AppModule', () => {
  it('should apply the shared middlewares to every route', () => {
    const forRoutes = jest.fn();
    const consumer = {
      apply: jest.fn().mockReturnValue({
        forRoutes
      })
    };

    new AppModule().configure(consumer as never);

    expect(consumer.apply).toHaveBeenCalledWith(
      UserAgentMiddleware,
      IpMiddleware
    );
    expect(forRoutes).toHaveBeenCalledWith('{*path}');
  });
});
