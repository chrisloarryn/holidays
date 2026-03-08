import { Logger } from '@nestjs/common';
import { UserAgentMiddleware } from './user-agent.middleware';

describe('UserAgentMiddleware', () => {
  const middleware = new UserAgentMiddleware();
  const logSpy = jest.spyOn(Logger, 'log').mockImplementation(jest.fn());

  afterEach(() => {
    logSpy.mockClear();
  });

  it('should log the incoming user agent and continue the pipeline', () => {
    const next = jest.fn();

    middleware.use(
      {
        headers: {
          'user-agent': 'jest-agent'
        }
      } as never,
      {} as never,
      next
    );

    expect(logSpy).toHaveBeenCalledWith(
      'User Agent: jest-agent',
      UserAgentMiddleware.name
    );
    expect(next).toHaveBeenCalled();
  });
});
