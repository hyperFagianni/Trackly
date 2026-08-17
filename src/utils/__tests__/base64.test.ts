import { base64Encode } from '../base64';

describe('base64Encode', () => {
  it('matches known base64 test vectors', () => {
    expect(base64Encode('')).toBe('');
    expect(base64Encode('a')).toBe('YQ==');
    expect(base64Encode('ab')).toBe('YWI=');
    expect(base64Encode('abc')).toBe('YWJj');
    expect(base64Encode('client:secret')).toBe('Y2xpZW50OnNlY3JldA==');
  });
});
