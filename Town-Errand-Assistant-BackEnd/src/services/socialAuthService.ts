import { OAuth2Client } from 'google-auth-library';
import appleSigninAuth from 'apple-signin-auth';

export type SocialProvider = 'google' | 'apple' | 'facebook';

export interface SocialProfile {
  provider: SocialProvider;
  providerId: string;
  email: string;
  name: string | null;
}

export class SocialAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SocialAuthError';
  }
}

// Google Auth setup
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(idToken: string): Promise<SocialProfile> {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.sub || !payload.email) {
      throw new SocialAuthError('Google token missing required fields');
    }

    return {
      provider: 'google',
      providerId: payload.sub,
      email: payload.email.toLowerCase(),
      name: payload.name ?? null,
    };
  } catch (error: any) {
    throw new SocialAuthError(`Invalid Google token: ${error.message}`);
  }
}

async function verifyFacebookToken(accessToken: string): Promise<SocialProfile> {
  const response = await fetch(
    `https://graph.facebook.com/me?fields=id,email,name&access_token=${encodeURIComponent(accessToken)}`
  );

  if (!response.ok) {
    throw new SocialAuthError('Invalid Facebook token');
  }

  const data = (await response.json()) as {
    id?: string;
    email?: string;
    name?: string;
    error?: { message: string };
  };

  if (data.error) {
    throw new SocialAuthError(data.error.message || 'Invalid Facebook token');
  }

  if (!data.id || !data.email) {
    throw new SocialAuthError('Facebook token missing email permission');
  }

  return {
    provider: 'facebook',
    providerId: data.id,
    email: data.email.toLowerCase(),
    name: data.name ?? null,
  };
}

async function verifyAppleToken(identityToken: string): Promise<SocialProfile> {
  try {
    const appleClientId = process.env.APPLE_CLIENT_ID;
    
    // verifyIdToken securely fetches Apple's public keys and verifies the JWT signature
    const payload = await appleSigninAuth.verifyIdToken(identityToken, {
      audience: appleClientId,
      ignoreExpiration: false,
    });

    if (!payload.sub) {
      throw new SocialAuthError('Apple token missing subject');
    }

    if (!payload.email) {
      throw new SocialAuthError('Apple token missing email');
    }

    return {
      provider: 'apple',
      providerId: payload.sub,
      email: payload.email.toLowerCase(),
      name: null, // Apple only sends the name during the very first login
    };
  } catch (error: any) {
    throw new SocialAuthError(`Invalid Apple identity token: ${error.message}`);
  }
}

export async function verifySocialToken(
  provider: SocialProvider,
  token: string
): Promise<SocialProfile> {
  switch (provider) {
    case 'google':
      return verifyGoogleToken(token);
    case 'facebook':
      return verifyFacebookToken(token);
    case 'apple':
      return verifyAppleToken(token);
    default:
      throw new SocialAuthError(`Unsupported provider: ${provider}`);
  }
}
