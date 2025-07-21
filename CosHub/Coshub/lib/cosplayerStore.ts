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

// ローカルストレージのキー
const STORAGE_KEY = 'coshub_cosplayers';

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

// ローカルストレージからデータを取得
export const getCosplayers = (): CosplayerData[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load cosplayers from localStorage:', error);
    return [];
  }
};

// ローカルストレージにデータを保存
export const saveCosplayers = (cosplayers: CosplayerData[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cosplayers));
  } catch (error) {
    console.error('Failed to save cosplayers to localStorage:', error);
  }
};

// 新しいコスプレイヤーを追加
export const addCosplayer = async (username: string, displayName?: string): Promise<CosplayerData> => {
  const cosplayers = getCosplayers();
  
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
  saveCosplayers(updatedCosplayers);
  
  return newCosplayer;
};

// コスプレイヤーを更新
export const updateCosplayer = (id: string, updates: Partial<CosplayerData>): void => {
  const cosplayers = getCosplayers();
  const updatedCosplayers = cosplayers.map(cosplayer =>
    cosplayer.id === id ? { ...cosplayer, ...updates } : cosplayer
  );
  saveCosplayers(updatedCosplayers);
};

// プロフィール画像を更新する関数
export const updateCosplayerAvatar = async (username: string): Promise<void> => {
  const cosplayers = getCosplayers();
  const profileImage = await getTwitterProfileImage(username);
  
  const updatedCosplayers = cosplayers.map(cosplayer =>
    cosplayer.username === username 
      ? { ...cosplayer, avatar: profileImage }
      : cosplayer
  );
  saveCosplayers(updatedCosplayers);
};

// フォロー状態を切り替え
export const toggleFollow = (id: string): void => {
  const cosplayers = getCosplayers();
  const updatedCosplayers = cosplayers.map(cosplayer =>
    cosplayer.id === id ? { ...cosplayer, isFollowed: !cosplayer.isFollowed } : cosplayer
  );
  saveCosplayers(updatedCosplayers);
};

// メディアファイルを追加
export const addMediaToCosplayer = (username: string, media: MediaFile[]): void => {
  const cosplayers = getCosplayers();
  const updatedCosplayers = cosplayers.map(cosplayer =>
    cosplayer.username === username 
      ? { ...cosplayer, media: [...cosplayer.media, ...media] }
      : cosplayer
  );
  saveCosplayers(updatedCosplayers);
};

// ダウンロード状況を更新
export const updateDownloadStatus = (username: string, status: DownloadStatus): void => {
  const cosplayers = getCosplayers();
  const updatedCosplayers = cosplayers.map(cosplayer =>
    cosplayer.username === username 
      ? { ...cosplayer, downloadStatus: status }
      : cosplayer
  );
  saveCosplayers(updatedCosplayers);
};

// コスプレイヤーを削除
export const removeCosplayer = (id: string): void => {
  const cosplayers = getCosplayers();
  const updatedCosplayers = cosplayers.filter(cosplayer => cosplayer.id !== id);
  saveCosplayers(updatedCosplayers);
};

// データをクリア
export const clearAllData = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}; 