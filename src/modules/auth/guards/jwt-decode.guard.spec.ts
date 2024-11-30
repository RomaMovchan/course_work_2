import { JwtDecodeGuard } from './jwt-decode.guard';

describe('JwtDecodeGuard', () => {
  it('should be defined', () => {
    expect(new JwtDecodeGuard()).toBeDefined();
  });
});
