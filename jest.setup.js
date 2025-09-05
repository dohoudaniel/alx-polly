// Jest setup file for ALX Polly security tests

// Mock environment variables for testing
process.env.ADMIN_EMAILS = 'admin@example.com,admin@alx-polly.com';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock Next.js modules that aren't available in test environment
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Global test utilities
global.FormData = class FormData {
  constructor() {
    this.data = new Map();
  }
  
  append(key, value) {
    if (this.data.has(key)) {
      const existing = this.data.get(key);
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        this.data.set(key, [existing, value]);
      }
    } else {
      this.data.set(key, value);
    }
  }
  
  get(key) {
    const value = this.data.get(key);
    return Array.isArray(value) ? value[0] : value;
  }
  
  getAll(key) {
    const value = this.data.get(key);
    return Array.isArray(value) ? value : value ? [value] : [];
  }
};
