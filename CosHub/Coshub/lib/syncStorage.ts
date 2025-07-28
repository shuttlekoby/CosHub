// クライアントサイド同期システム
import { CosplayerData } from './cosplayerStore';

const SYNC_KEY = 'coshub_sync_data';
const LAST_SYNC_KEY = 'coshub_last_sync';

// URLパラメータによるデータ共有
export function shareDataViaURL(data: CosplayerData[]): string {
  const compressed = JSON.stringify(data);
  const encoded = btoa(compressed);
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?sync=${encoded}`;
}

// URLからデータを復元
export function loadDataFromURL(): CosplayerData[] | null {
  if(typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  const syncData = urlParams.get('sync');
  
  if (!syncData) return null;
  
  try {
    const decoded = atob(syncData);
    const data = JSON.parse(decoded) as CosplayerData[];
    
    // データを localStorage に保存
    localStorage.setItem(SYNC_KEY, JSON.stringify(data));
    localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    
    // URLからパラメータを削除（履歴を汚染しないため）
    window.history.replaceState({}, '', window.location.pathname);
    
    return data;
  } catch (error) {
    console.error('Failed to load data from URL:', error);
    return null;
  }
}

// Cookieベースの簡易同期
export function saveToSyncCookie(data: CosplayerData[]): void {
  if (typeof document === 'undefined') return;
  
  try {
    const compressed = JSON.stringify(data);
    // 最大4KBまでの制限を考慮
    if (compressed.length > 4000) {
      console.warn('Data too large for cookie sync');
      return;
    }
    
    const expires = new Date();
    expires.setDate(expires.getDate() + 30); // 30日間有効
    
    document.cookie = `${SYNC_KEY}=${btoa(compressed)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    document.cookie = `${LAST_SYNC_KEY}=${Date.now()}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  } catch (error) {
    console.error('Failed to save sync cookie:', error);
  }
}

// Cookieからデータを読み込み
export function loadFromSyncCookie(): CosplayerData[] | null {
  if (typeof document === 'undefined') return null;
  
  try {
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    const syncData = cookies[SYNC_KEY];
    if (!syncData) return null;
    
    const decoded = atob(syncData);
    const data = JSON.parse(decoded) as CosplayerData[];
    
    return data;
  } catch (error) {
    console.error('Failed to load from sync cookie:', error);
    return null;
  }
}

// 統合同期システム
export function syncData(localData: CosplayerData[]): CosplayerData[] {
  // 1. URLからデータを読み込み
  const urlData = loadDataFromURL();
  if (urlData && urlData.length > 0) {
    console.log('Loaded data from URL sync');
    return urlData;
  }
  
  // 2. Cookieからデータを読み込み
  const cookieData = loadFromSyncCookie();
  if (cookieData && cookieData.length > localData.length) {
    console.log('Loaded data from cookie sync');
    return cookieData;
  }
  
  // 3. ローカルデータを他の端末と同期
  if (localData.length > 0) {
    saveToSyncCookie(localData);
  }
  
  return localData;
}

// 同期リンクを生成
export function generateSyncLink(data: CosplayerData[]): string {
  return shareDataViaURL(data);
}

// 自動同期の設定
export function setupAutoSync(): void {
  if (typeof window === 'undefined') return;
  
  // ページ読み込み時にURL同期をチェック
  window.addEventListener('load', () => {
    const urlData = loadDataFromURL();
    if (urlData) {
      // カスタムイベントを発火して他のコンポーネントに通知
      window.dispatchEvent(new CustomEvent('coshub-sync-update', { 
        detail: { data: urlData } 
      }));
    }
  });
} 