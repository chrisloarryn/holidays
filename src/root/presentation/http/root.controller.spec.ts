import { RootController } from './root.controller';

describe('RootController', () => {
  it('should return Hello World!', () => {
    expect(new RootController().getHello()).toBe('Hello World!');
  });
});
