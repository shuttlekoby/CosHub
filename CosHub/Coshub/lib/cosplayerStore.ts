// コスプレイヤーデータの型定義
export interface CosplayerData {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  hashtag?: string;
  following?: number;
  followers?: string;
  isFollowed: boolean;
  media: MediaFile[];
  downloadStatus?: DownloadStatus;
  addedAt: number; // タイムスタンプ
  
  // 手動編集可能フィールド
  customAvatar?: string;      // カスタムアイコンURL
  isManuallyEdited?: boolean; // 手動編集されたかどうか
  location?: string;          // 活動地域
  socialLinks?: {             // ソーシャルリンク
    twitter?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
  };
  stats?: {                   // 詳細統計（手動設定）
    totalPosts?: number;
    avgLikes?: number;
    verified?: boolean;
  };
}

export interface MediaFile {
  filename: string;
  url: string;
  type: string;
  likes?: number;
  title?: string;          // 画像タイトル（手動設定）
  description?: string;    // 画像説明（手動設定）
  uploadDate?: string;     // アップロード日（手動設定）
  tags?: string[];         // タグ（手動設定）
  isEdited?: boolean;      // 手動編集されたかどうか
}

export interface DownloadStatus {
  isDownloading: boolean;
  progress: number;
  message: string;
  error?: string;
}

// Twitterプロフィール画像を取得する関数
export const getTwitterProfileImage = async (username: string): Promise<string> => {
  // 複数のサービスを試す（フォールバック付き）
  const services = [
    `https://unavatar.io/twitter/${username}`,
    `https://avatars.io/twitter/${username}`,
    `https://unavatar.io/x/${username}`, // X (Twitter) 用
    `https://ui-avatars.com/api/?name=${username}&background=667eea&color=fff&size=400&font-size=0.6&bold=true`, // 美しい生成アバター
    `https://avatars.dicebear.com/api/initials/${username}.svg?background=%23667eea&color=%23ffffff`, // SVGアバター
  ];

  for (let i = 0; i < services.length; i++) {
    try {
      // AbortControllerを使用してタイムアウトを実装
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // タイムアウトを8秒に延長
      
      const response = await fetch(services[i], {
        method: 'HEAD', // 画像が存在するかチェック
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`Profile image found for ${username} using service ${i + 1}: ${services[i]}`);
        return services[i];
      }
    } catch (error) {
      console.log(`Service ${i + 1} failed for ${username}:`, error);
      continue;
    }
  }

  // すべて失敗した場合は美しいフォールバック画像
  console.log(`Using fallback image for ${username}`);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&color=fff&size=400&font-size=0.6&bold=true`;
};

// twmdを使った追加のメディア取得機能（補助的）
export const getTwitterUserMediaWithTwmd = async (username: string, count: number = 1): Promise<string[]> => {
  try {
    const response = await fetch(`/api/download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        downloadImages: true,
        downloadVideos: false,
        maxTweets: count
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch media with twmd');
    }

    const data = await response.json();
    return data.files ? data.files.map((file: any) => file.url) : [];
  } catch (error) {
    console.error('Error fetching media with twmd:', error);
    return [];
  }
};

// ローカルストレージのキー
const STORAGE_KEY = 'coshub_cosplayers';

// 同期システムを使ったデータ取得
export const getCosplayers = async (): Promise<CosplayerData[]> => {
  if (typeof window === 'undefined') return [];
  
  try {
    // 1. localStorageからデータを読み込み
    const stored = localStorage.getItem(STORAGE_KEY);
    const localData = stored ? JSON.parse(stored) : [];
    
    // 2. 同期システムを使って最新データを取得
    const { syncData } = await import('./syncStorage');
    const syncedData = syncData(localData);
    
    // 3. 同期されたデータをlocalStorageに保存
    if (syncedData !== localData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(syncedData));
    }
    
    return syncedData;
  } catch (error) {
    console.error('Failed to load cosplayers:', error);
    // フォールバック: localStorageから直接読み込み
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }
};

// データ保存と同期
export const saveCosplayers = async (cosplayers: CosplayerData[]): Promise<void> => {
  if (typeof window === 'undefined') return;
  
  try {
    // 1. localStorageに保存
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cosplayers));
    
    // 2. 同期システムでクッキーにも保存
    const { saveToSyncCookie } = await import('./syncStorage');
    saveToSyncCookie(cosplayers);
  } catch (error) {
    console.error('Failed to save cosplayers:', error);
  }
};

// 新しいコスプレイヤーを追加
export const addCosplayer = async (username: string, displayName?: string): Promise<CosplayerData> => {
  const cosplayers = await getCosplayers();
  
  // 既存チェック
  const existingCosplayer = cosplayers.find(c => c.username === username);
  if (existingCosplayer) {
    return existingCosplayer;
  }
  
  // 実際のTwitterプロフィール画像を取得
  let profileImage: string;
  try {
    profileImage = await getTwitterProfileImage(username);
  } catch (error) {
    console.error(`Failed to get profile image for ${username}:`, error);
    profileImage = `https://picsum.photos/200/200?random=${username.charCodeAt(0)}`;
  }
  
  // 新しいコスプレイヤーデータを作成
  const newCosplayer: CosplayerData = {
    id: `${Date.now()}-${username}`,
    username,
    displayName: displayName || username,
    avatar: profileImage,
    bio: `コスプレイヤー @${username}`,
    hashtag: `#${username}コス`,
    following: Math.floor(Math.random() * 50) + 1,
    followers: `${(Math.random() * 300 + 10).toFixed(1)}K`,
    isFollowed: false,
    media: [],
    downloadStatus: {
      isDownloading: false,
      progress: 0,
      message: '待機中'
    },
    addedAt: Date.now()
  };
  
  const updatedCosplayers = [...cosplayers, newCosplayer];
  await saveCosplayers(updatedCosplayers);
  
  return newCosplayer;
};

// コスプレイヤーを更新
export const updateCosplayer = async (id: string, updates: Partial<CosplayerData>): Promise<void> => {
  const cosplayers = await getCosplayers();
  const updatedCosplayers = cosplayers.map(cosplayer =>
    cosplayer.id === id ? { ...cosplayer, ...updates } : cosplayer
  );
  await saveCosplayers(updatedCosplayers);
};

// プロフィール画像を更新する関数
export const updateCosplayerAvatar = async (username: string): Promise<void> => {
  const cosplayers = await getCosplayers();
  const cosplayer = cosplayers.find(c => c.username === username);
  
  if (!cosplayer) {
    throw new Error('Cosplayer not found');
  }

  const profileImage = await getTwitterProfileImage(username);
  await updateCosplayer(cosplayer.id, { avatar: profileImage });
};

// フォロー状態を切り替え
export const toggleFollow = async (id: string): Promise<void> => {
  const cosplayers = await getCosplayers();
  const cosplayer = cosplayers.find(c => c.id === id);
  
  if (!cosplayer) {
    throw new Error('Cosplayer not found');
  }

  await updateCosplayer(id, { isFollowed: !cosplayer.isFollowed });
};

// メディアファイルを追加
export const addMediaToCosplayer = async (username: string, media: MediaFile[]): Promise<void> => {
  const cosplayers = await getCosplayers();
  const cosplayer = cosplayers.find(c => c.username === username);
  
  if (!cosplayer) {
    throw new Error('Cosplayer not found');
  }

  const updatedMedia = [...cosplayer.media, ...media];
  await updateCosplayer(cosplayer.id, { media: updatedMedia });
};

// ダウンロード状況を更新
export const updateDownloadStatus = async (username: string, status: DownloadStatus): Promise<void> => {
  const cosplayers = await getCosplayers();
  const cosplayer = cosplayers.find(c => c.username === username);
  
  if (!cosplayer) {
    throw new Error('Cosplayer not found');
  }

  await updateCosplayer(cosplayer.id, { downloadStatus: status });
};

// コスプレイヤーを削除
export const removeCosplayer = async (id: string): Promise<void> => {
  const cosplayers = await getCosplayers();
  const updatedCosplayers = cosplayers.filter(cosplayer => cosplayer.id !== id);
  await saveCosplayers(updatedCosplayers);
};

// データをクリア
export const clearAllData = async (): Promise<void> => {
  const cosplayers = await getCosplayers();
  
  // 全てのコスプレイヤーを削除
  for (const cosplayer of cosplayers) {
    await removeCosplayer(cosplayer.id);
  }
}; 

// ブラウザサイドの互換性のための同期版関数（既存のコードとの互換性のため）
export const getCosplayersSync = (): CosplayerData[] => {
  console.warn('getCosplayersSync is deprecated. Use getCosplayers() instead.');
  return [];
}; 