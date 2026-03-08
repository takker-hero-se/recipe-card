const STORAGE_VERSION = 1;

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn(`Failed to save to localStorage: ${key}`);
  }
}

export function exportAllData(): string {
  const data: Record<string, unknown> = {
    version: STORAGE_VERSION,
    exportedAt: new Date().toISOString(),
  };
  const keys = ['rp_settings', 'rp_recipes', 'rp_mealplans', 'rp_flyerprices', 'rp_inventory'];
  keys.forEach(key => {
    const item = localStorage.getItem(key);
    if (item) data[key] = JSON.parse(item);
  });
  return JSON.stringify(data, null, 2);
}

export function importAllData(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr);
    Object.entries(data).forEach(([key, value]) => {
      if (key.startsWith('rp_')) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    });
    return true;
  } catch {
    return false;
  }
}
