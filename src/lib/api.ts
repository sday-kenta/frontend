import { clearStoredAuthSession } from '@/lib/authSession';

export type UserRole = 'user' | 'admin' | 'premium';
export type IncidentStatus = 'draft' | 'published' | 'all';
export type EmailCodePurpose = 'register' | 'change_email';

export interface User {
  id: number;
  login: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  city: string;
  street: string;
  house: string;
  apartment?: string;
  role: UserRole;
  is_blocked: boolean;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: number;
  title: string;
  icon_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface IncidentPhoto {
  id: number;
  file_url: string;
  content_type: string;
  size_bytes: number;
  sort_order: number;
  created_at?: string;
}

export interface Incident {
  id: number;
  user_id: number;
  category_id: number;
  category_title?: string;
  title: string;
  description: string;
  department_name?: string;
  address_text?: string;
  city?: string;
  street?: string;
  house?: string;
  latitude?: number;
  longitude?: number;
  status: 'draft' | 'published';
  photos: IncidentPhoto[];
  published_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GeoAddress {
  city?: string;
  street?: string;
  house?: string;
  address_text?: string;
  latitude?: number;
  longitude?: number;
  display_name?: string;
  lat?: number;
  lon?: number;
  road?: string;
  house_number?: string;
  full_address?: string;
}

export interface SearchAddressResponse {
  status: string;
  data: GeoAddress[];
}

export interface ReverseGeocodeResponse {
  status: string;
  data: GeoAddress;
}

export interface CreateUserRequest {
  login: string;
  password: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  city: string;
  street: string;
  house: string;
  apartment?: string;
  role: UserRole;
  is_blocked?: boolean;
}

export type UpdateUserRequest = Omit<CreateUserRequest, 'password'>;

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface SendEmailCodeRequest {
  email: string;
  purpose: EmailCodePurpose;
}

export interface VerifyEmailCodeRequest extends SendEmailCodeRequest {
  code: string;
}

export interface SendFeedbackRequest {
  message: string;
  email?: string;
  name?: string;
}

export interface SendPasswordResetCodeRequest {
  email: string;
}

export interface ResetPasswordWithCodeRequest {
  email: string;
  code: string;
  new_password: string;
}

export interface CreateIncidentRequest {
  category_id: number;
  title: string;
  description: string;
  status?: 'draft' | 'published';
  department_name?: string;
  address_text?: string;
  city?: string;
  street?: string;
  house?: string;
  latitude?: number;
  longitude?: number;
}

export type UpdateIncidentRequest = Partial<CreateIncidentRequest>;

export interface Session {
  userId?: number;
  role?: UserRole;
  authToken?: string;
}

export interface ApiClientOptions {
  baseUrl?: string;
  getSession?: () => Session;
  onUnauthorized?: () => void;
}

type ApiRequestInit = RequestInit & {
  timeoutMs?: number;
};

type ApiEnvelope<T> = {
  status?: string;
  data?: T;
  message?: string;
};

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

const RAW_BASE_URL =
  (typeof import.meta !== 'undefined' &&
    (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_BASE_URL) ||
  '/v1';

const DEFAULT_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');
const DEFAULT_API_ORIGIN = DEFAULT_BASE_URL.replace(/\/v1$/, '');

export function withApiBase(path: string): string {
  if (!path) return path;

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (!DEFAULT_API_ORIGIN) {
    return path;
  }

  return `${DEFAULT_API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}

function buildQuery(params?: Record<string, string | number | boolean | undefined | null>) {
  const search = new URLSearchParams();

  if (!params) return '';

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return query ? `?${query}` : '';
}

async function parseBody(response: Response) {
  const contentType = response.headers.get('content-type') || '';

  if (response.status === 204) return null;
  if (contentType.includes('application/json')) return response.json();
  return response.text();
}

function unwrapData<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === 'object' &&
    !Array.isArray(payload) &&
    'data' in payload
  ) {
    return (payload as ApiEnvelope<T>).data as T;
  }

  return payload as T;
}

function readSessionFromStorage(): Session {
  if (typeof window === 'undefined') return {};

  const fallbackUserId = window.localStorage.getItem('userId');
  const authToken = window.localStorage.getItem('authToken') ?? undefined;
  if (fallbackUserId) {
    return { userId: Number(fallbackUserId), role: 'user', authToken };
  }

  if (authToken) {
    return { authToken };
  }

  return {};
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly getSession: () => Session;
  private readonly onUnauthorized?: () => void;
  private readonly requestTimeoutMs = 20000;
  private readonly uploadTimeoutMs = 45000;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
    this.getSession = options.getSession || (() => ({}));
    this.onUnauthorized = options.onUnauthorized;
  }

  private buildHeaders(init: ApiRequestInit = {}) {
    const session = this.getSession();
    const headers = new Headers(init.headers || {});

    if (!(init.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (session.authToken) {
      headers.set('Authorization', `Bearer ${session.authToken}`);
    } else {
      if (session.userId) headers.set('X-User-ID', String(session.userId));
      if (session.role) headers.set('X-User-Role', session.role);
    }

    return headers;
  }

  private async rawRequest(path: string, init: ApiRequestInit = {}): Promise<Response> {
    const headers = this.buildHeaders(init);
    const controller = new AbortController();
    const timeoutMs = init.timeoutMs ?? (init.body instanceof FormData ? this.uploadTimeoutMs : this.requestTimeoutMs);
    const timeoutId = typeof window !== 'undefined'
      ? window.setTimeout(() => controller.abort(new DOMException('Request timeout', 'AbortError')), timeoutMs)
      : undefined;

    let response: Response;

    try {
      const { timeoutMs: _timeoutMs, signal: externalSignal, ...requestInit } = init;

      if (externalSignal) {
        if (externalSignal.aborted) {
          controller.abort(externalSignal.reason);
        } else {
          externalSignal.addEventListener('abort', () => controller.abort(externalSignal.reason), { once: true });
        }
      }

      response = await fetch(`${this.baseUrl}${path}`, {
        ...requestInit,
        headers,
        signal: controller.signal,
      });
    } catch (error) {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      const rawMessage = error instanceof Error ? error.message : '';
      const normalized = rawMessage.toLowerCase();
      const isAbort = error instanceof DOMException && error.name === 'AbortError';
      const message = isAbort
        ? 'Сервер отвечает слишком долго. Попробуйте ещё раз или загрузите меньше/легче фото.'
        : normalized.includes('load failed') ||
          normalized.includes('failed to fetch') ||
          normalized.includes('networkerror') ||
          normalized.includes('network error')
            ? 'Не удалось соединиться с сервером. Проверьте VITE_API_BASE_URL или proxy на /v1.'
            : rawMessage || 'Не удалось выполнить запрос к серверу.';

      throw new ApiError(isAbort ? 408 : 0, message, error);
    }

    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const payload = await parseBody(response);

      if (response.status === 401 && this.onUnauthorized) {
        this.onUnauthorized();
      }

      let message = `Ошибка запроса (${response.status})`;
      if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
        const p = payload as { error?: string; message?: string };
        if (typeof p.error === 'string' && p.error.trim()) {
          message = p.error.trim();
        } else if (typeof p.message === 'string' && p.message.trim()) {
          message = p.message.trim();
        }
      }

      throw new ApiError(response.status, message, payload);
    }

    return response;
  }

  private async request<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
    const response = await this.rawRequest(path, init);
    const payload = await parseBody(response);
    return unwrapData<T>(payload);
  }

  healthcheck() {
    return fetch(this.baseUrl.replace(/\/v1$/, '') + '/healthz').then((r) => r.ok);
  }

  login(payload: LoginRequest) {
    return this.request<User>('/users/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  loginViaAuth(payload: LoginRequest) {
    return this.request<User>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  listUsers() {
    return this.request<User[]>('/users');
  }

  getUser(id: number) {
    return this.request<User>(`/users/${id}`);
  }

  createUser(payload: CreateUserRequest) {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  updateUser(id: number, payload: UpdateUserRequest) {
    return this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  deleteUser(id: number) {
    return this.request<void>(`/users/${id}`, { method: 'DELETE' });
  }

  uploadAvatar(userId: number, file: File) {
    const formData = new FormData();
    formData.append('avatar', file);

    return this.request<void>(`/users/${userId}/avatar`, {
      method: 'POST',
      body: formData,
    });
  }

  sendEmailCode(payload: SendEmailCodeRequest) {
    return this.request<void>('/users/email-code/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  verifyEmailCode(payload: VerifyEmailCodeRequest) {
    return this.request<void>('/users/email-code/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  sendPasswordResetCode(payload: SendPasswordResetCodeRequest) {
    return this.request<void>('/users/password-reset/send-code', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  resetPasswordWithCode(payload: ResetPasswordWithCodeRequest) {
    return this.request<void>('/users/password-reset/reset', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /** Обратная связь: письмо на служебный SMTP (тот же, что для кодов). */
  sendFeedback(payload: SendFeedbackRequest) {
    return this.request<void>('/feedback', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  listCategories() {
    return this.request<Category[]>('/categories');
  }

  getCategory(id: number) {
    return this.request<Category>(`/categories/${id}`);
  }

  createCategory(payload: Pick<Category, 'title'>) {
    return this.request<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  updateCategory(id: number, payload: Pick<Category, 'title'>) {
    return this.request<Category>(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  deleteCategory(id: number) {
    return this.request<void>(`/categories/${id}`, { method: 'DELETE' });
  }

  uploadCategoryIcon(id: number, file: File) {
    const formData = new FormData();
    formData.append('icon', file);

    return this.request<void>(`/categories/${id}/icon`, {
      method: 'POST',
      body: formData,
    });
  }

  deleteCategoryIcon(id: number) {
    return this.request<void>(`/categories/${id}/icon`, { method: 'DELETE' });
  }

  searchAddresses(query: string, city?: string) {
    return this.request<GeoAddress[]>(`/maps/search${buildQuery({ q: query, city })}`);
  }

  reverseGeocode(lat: number, lon: number) {
    return this.request<GeoAddress>(`/maps/reverse${buildQuery({ lat, lon })}`);
  }

  listIncidents(categoryId?: number) {
    return this.request<Incident[]>(`/incidents${buildQuery({ category_id: categoryId })}`);
  }

  listMyIncidents(filters?: { status?: IncidentStatus; categoryId?: number }) {
    return this.request<Incident[]>(
      `/my/incidents${buildQuery({ status: filters?.status, category_id: filters?.categoryId })}`,
    );
  }

  getIncident(id: number) {
    return this.request<Incident>(`/incidents/${id}`);
  }

  createIncident(payload: CreateIncidentRequest) {
    return this.request<Incident>('/incidents', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  updateIncident(id: number, payload: UpdateIncidentRequest) {
    return this.request<Incident>(`/incidents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  deleteIncident(id: number) {
    return this.request<void>(`/incidents/${id}`, { method: 'DELETE' });
  }

  uploadIncidentPhotos(id: number, files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append('photos', file));

    return this.request<IncidentPhoto[]>(`/incidents/${id}/photos`, {
      method: 'POST',
      body: formData,
      timeoutMs: this.uploadTimeoutMs,
    });
  }

  deleteIncidentPhoto(incidentId: number, photoId: number) {
    return this.request<void>(`/incidents/${incidentId}/photos/${photoId}`, {
      method: 'DELETE',
    });
  }

  getIncidentDocumentDownloadUrl(id: number) {
    return `${this.baseUrl}/incidents/${id}/document/download`;
  }

  async downloadIncidentDocument(id: number) {
    const response = await this.rawRequest(`/incidents/${id}/document/download`, {
      method: 'GET',
      headers: { Accept: 'application/pdf,text/html,*/*' },
    });

    return {
      blob: await response.blob(),
      filename: response.headers.get('content-disposition')?.match(/filename\*?=(?:UTF-8''|")?([^";]+)/)?.[1] || `incident-${id}.pdf`,
      contentType: response.headers.get('content-type') || 'application/pdf',
    };
  }

  getIncidentDocumentPrintUrl(id: number) {
    return `${this.baseUrl}/incidents/${id}/document/print`;
  }

  async getIncidentDocumentPrintHtml(id: number) {
    const response = await this.rawRequest(`/incidents/${id}/document/print`, {
      method: 'GET',
      headers: { Accept: 'text/html,*/*' },
    });

    return response.text();
  }

  sendIncidentDocumentToEmail(id: number, email?: string) {
    return this.request<void>(`/incidents/${id}/document/email`, {
      method: 'POST',
      body: JSON.stringify(email ? { email } : {}),
    });
  }
}

export const api = new ApiClient({
  getSession: readSessionFromStorage,
  onUnauthorized: () => {
    if (typeof window === 'undefined') return;
    clearStoredAuthSession();
  },
});
