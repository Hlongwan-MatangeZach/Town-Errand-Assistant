import { AuthService } from '../authService';

jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

describe('AuthService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('registers a user', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: 'User registered successfully',
        token: 'jwt',
        user: { id: '1', email: 'test@example.com', name: 'Test', role: 'user' },
      }),
    }) as jest.Mock;

    const result = await AuthService.register('test@example.com', 'secret123', 'Test');

    expect(result.token).toBe('jwt');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/register'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('logs in a user', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: 'Login successful',
        token: 'jwt',
        user: { id: '1', email: 'test@example.com', name: 'Test', role: 'user' },
      }),
    }) as jest.Mock;

    const result = await AuthService.login('test@example.com', 'secret123');

    expect(result.message).toBe('Login successful');
  });

  it('throws on login failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Invalid email or password' }),
    }) as jest.Mock;

    await expect(AuthService.login('test@example.com', 'wrong')).rejects.toThrow(
      'Invalid email or password'
    );
  });

  it('requests password reset', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: 'If an account with that email exists, a password reset link has been sent.',
      }),
    }) as jest.Mock;

    const result = await AuthService.forgotPassword('test@example.com');

    expect(result.message).toContain('If an account');
  });

  it('resets password with token', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Password reset successfully' }),
    }) as jest.Mock;

    const result = await AuthService.resetPassword('reset-token', 'newpass123');

    expect(result.message).toBe('Password reset successfully');
  });

  it('performs social login', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: 'Social login successful',
        token: 'jwt',
        user: {
          id: '1',
          email: 'social@example.com',
          name: 'Social',
          role: 'user',
          authProvider: 'google',
        },
      }),
    }) as jest.Mock;

    const result = await AuthService.socialLogin('google', 'id-token');

    expect(result.user.authProvider).toBe('google');
  });

  it('throws when API is unreachable', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));

    await expect(AuthService.login('test@example.com', 'secret123')).rejects.toThrow(
      'Cannot reach the API'
    );
  });
});
