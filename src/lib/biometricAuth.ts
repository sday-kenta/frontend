import { hasStoredAuthSession, readStoredUserId } from '@/lib/authSession';

const BIOMETRIC_STORAGE_KEY = 'auth:biometric-quick-unlock';
const CHALLENGE_BYTE_LENGTH = 32;
const DEFAULT_TIMEOUT_MS = 60_000;

type StoredBiometricQuickUnlock = {
  version: 1;
  enabled: true;
  credentialId: string;
  userId: string;
  label: string;
  enabledAt: string;
};

export type BiometricSupport = {
  isSupported: boolean;
  canUsePlatformAuthenticator: boolean;
  label: string;
};

function isIosDevice() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isMacDevice() {
  if (typeof navigator === 'undefined') return false;
  return /macintosh|mac os x/i.test(navigator.userAgent);
}

function isWindowsDevice() {
  if (typeof navigator === 'undefined') return false;
  return /windows/i.test(navigator.userAgent);
}

export function getPreferredBiometricLabel() {
  if (isIosDevice()) return 'Face ID / Touch ID';
  if (isMacDevice()) return 'Touch ID';
  if (isWindowsDevice()) return 'Windows Hello';
  return 'биометрию устройства';
}

function encodeBase64Url(bytes: ArrayBuffer | Uint8Array) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';

  view.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  const binary = window.atob(normalized + padding);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function createChallenge() {
  const challenge = new Uint8Array(CHALLENGE_BYTE_LENGTH);
  window.crypto.getRandomValues(challenge);
  return challenge;
}

function readStoredBiometricQuickUnlock(): StoredBiometricQuickUnlock | null {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(BIOMETRIC_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredBiometricQuickUnlock>;
    if (
      parsed?.version !== 1 ||
      parsed.enabled !== true ||
      typeof parsed.credentialId !== 'string' ||
      typeof parsed.userId !== 'string' ||
      typeof parsed.label !== 'string'
    ) {
      return null;
    }

    return {
      version: 1,
      enabled: true,
      credentialId: parsed.credentialId,
      userId: parsed.userId,
      label: parsed.label,
      enabledAt: typeof parsed.enabledAt === 'string' ? parsed.enabledAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function persistStoredBiometricQuickUnlock(payload: StoredBiometricQuickUnlock) {
  window.localStorage.setItem(BIOMETRIC_STORAGE_KEY, JSON.stringify(payload));
}

function isPublicKeyCredentialSupported() {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.credentials)
  );
}

function getSupportLabel() {
  const preferred = getPreferredBiometricLabel();
  return preferred === 'биометрию устройства' ? 'биометрия устройства' : preferred;
}

export async function getBiometricSupport(): Promise<BiometricSupport> {
  const fallbackLabel = getSupportLabel();
  if (!isPublicKeyCredentialSupported()) {
    return {
      isSupported: false,
      canUsePlatformAuthenticator: false,
      label: fallbackLabel,
    };
  }

  const publicKeyCredential = window.PublicKeyCredential as typeof PublicKeyCredential & {
    isUserVerifyingPlatformAuthenticatorAvailable?: () => Promise<boolean>;
  };

  if (typeof publicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') {
    return {
      isSupported: true,
      canUsePlatformAuthenticator: false,
      label: fallbackLabel,
    };
  }

  const canUsePlatformAuthenticator =
    (await publicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().catch(() => false)) === true;

  return {
    isSupported: true,
    canUsePlatformAuthenticator,
    label: fallbackLabel,
  };
}

export function isBiometricQuickUnlockEnabledForCurrentSession() {
  if (!hasStoredAuthSession()) return false;

  const currentUserId = readStoredUserId();
  const storedQuickUnlock = readStoredBiometricQuickUnlock();

  return Boolean(currentUserId && storedQuickUnlock?.userId === currentUserId);
}

export function shouldRequireBiometricUnlockOnLaunch() {
  return hasStoredAuthSession() && isBiometricQuickUnlockEnabledForCurrentSession();
}

export function disableBiometricQuickUnlock() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(BIOMETRIC_STORAGE_KEY);
}

function createUserHandle(userId: string) {
  const encoded = new TextEncoder().encode(`sday-kenta:${userId}`);
  return encoded.slice(0, 64);
}

function normalizeWebAuthnError(error: unknown, action: 'create' | 'get') {
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotAllowedError':
        return action === 'create'
          ? 'Включение быстрого входа было отменено.'
          : 'Проверка биометрии была отменена.';
      case 'InvalidStateError':
        return action === 'create'
          ? 'На устройстве уже есть сохранённый ключ для этого входа. Попробуйте отключить и включить быстрый вход заново.'
          : 'Сохранённый ключ этого устройства больше недоступен. Войдите заново обычным способом.';
      case 'NotSupportedError':
        return 'На этом устройстве системная биометрия для приложения недоступна.';
      case 'SecurityError':
        return 'Быстрый вход работает только в установленном PWA или защищённом HTTPS-контексте.';
      default:
        return error.message || 'Не удалось завершить проверку биометрии.';
    }
  }

  return error instanceof Error ? error.message : 'Не удалось завершить проверку биометрии.';
}

export async function enableBiometricQuickUnlock() {
  const currentUserId = readStoredUserId();
  if (!currentUserId) {
    throw new Error('Сначала нужно войти в аккаунт обычным способом.');
  }

  const support = await getBiometricSupport();
  if (!support.isSupported || !support.canUsePlatformAuthenticator) {
    throw new Error('Системная биометрия недоступна на этом устройстве.');
  }

  const challenge = createChallenge();
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: {
        name: 'Sday Kenta',
      },
      user: {
        id: createUserHandle(currentUserId),
        name: `user-${currentUserId}`,
        displayName: 'Быстрый вход',
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      timeout: DEFAULT_TIMEOUT_MS,
      attestation: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        residentKey: 'preferred',
        userVerification: 'required',
      },
    },
  }).catch((error: unknown) => {
    throw new Error(normalizeWebAuthnError(error, 'create'));
  });

  if (!(credential instanceof PublicKeyCredential) || credential.rawId.byteLength === 0) {
    throw new Error('Устройство не вернуло ключ для быстрого входа.');
  }

  const nextValue: StoredBiometricQuickUnlock = {
    version: 1,
    enabled: true,
    credentialId: encodeBase64Url(credential.rawId),
    userId: currentUserId,
    label: support.label,
    enabledAt: new Date().toISOString(),
  };

  persistStoredBiometricQuickUnlock(nextValue);
  return nextValue;
}

export async function unlockWithBiometricQuickUnlock() {
  const currentUserId = readStoredUserId();
  const storedQuickUnlock = readStoredBiometricQuickUnlock();

  if (!currentUserId || !storedQuickUnlock || storedQuickUnlock.userId !== currentUserId) {
    throw new Error('Для этого устройства не настроен быстрый вход.');
  }

  const support = await getBiometricSupport();
  if (!support.isSupported || !support.canUsePlatformAuthenticator) {
    throw new Error('Системная биометрия недоступна на этом устройстве.');
  }

  const challenge = createChallenge();
  const expectedChallenge = encodeBase64Url(challenge);

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [
        {
          id: decodeBase64Url(storedQuickUnlock.credentialId),
          type: 'public-key',
          transports: ['internal'],
        },
      ],
      timeout: DEFAULT_TIMEOUT_MS,
      userVerification: 'required',
    },
  }).catch((error: unknown) => {
    throw new Error(normalizeWebAuthnError(error, 'get'));
  });

  if (!(assertion instanceof PublicKeyCredential) || assertion.rawId.byteLength === 0) {
    throw new Error('Устройство не подтвердило быстрый вход.');
  }

  if (encodeBase64Url(assertion.rawId) !== storedQuickUnlock.credentialId) {
    throw new Error('Подтверждённый ключ не совпадает с сохранённым ключом устройства.');
  }

  const response = assertion.response as AuthenticatorAssertionResponse | null;
  if (!response || !(response.clientDataJSON instanceof ArrayBuffer)) {
    throw new Error('Устройство вернуло неподдерживаемый ответ биометрии.');
  }

  const clientDataJson = JSON.parse(new TextDecoder().decode(response.clientDataJSON)) as {
    challenge?: string;
    origin?: string;
    type?: string;
  };

  if (clientDataJson.type !== 'webauthn.get') {
    throw new Error('Устройство вернуло некорректный тип подтверждения.');
  }

  if (clientDataJson.challenge !== expectedChallenge) {
    throw new Error('Проверка быстрого входа завершилась с неверным challenge.');
  }

  if (clientDataJson.origin && clientDataJson.origin !== window.location.origin) {
    throw new Error('Подтверждение биометрии пришло с другого origin.');
  }
}
