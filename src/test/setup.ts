import { beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";

class TestStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear() {
    this.store.clear();
  }

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
}

const installTestStorage = () => {
  const storage = new TestStorage();

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });

  if (typeof window !== "undefined") {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: storage,
    });
  }
};

installTestStorage();

const { useAuthStore } = await import("@/features/auth/useAuthStore");

beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({
    user: null,
    role: null,
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    hasHydrated: true,
  });
});
