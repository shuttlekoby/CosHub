import { useState, useEffect } from 'react';

// Sanity APIからコスプレイヤー一覧を取得するフック
export function useSanityCosplayers() {
  const [cosplayers, setCosplayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCosplayers() {
      try {
        setLoading(true);
        const response = await fetch('/api/sanity-cosplayers');
        
        if (!response.ok) {
          throw new Error('コスプレイヤーデータの取得に失敗しました');
        }
        
        const data = await response.json();
        setCosplayers(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Cosplayers fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCosplayers();
  }, []);

  return { cosplayers, loading, error, refetch: () => fetchCosplayers() };
}

// Sanity APIから特定ユーザーの画像一覧を取得するフック
export function useSanityImages(username: string, limit = 20) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false
  });

  useEffect(() => {
    if (!username) return;

    async function fetchImages() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/sanity-images?username=${encodeURIComponent(username)}&limit=${limit}&offset=0`
        );
        
        if (!response.ok) {
          throw new Error('画像データの取得に失敗しました');
        }
        
        const data = await response.json();
        setImages(data.images);
        setPagination(data.pagination);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Images fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchImages();
  }, [username, limit]);

  const loadMore = async () => {
    if (!pagination.hasMore || loading) return;

    try {
      const response = await fetch(
        `/api/sanity-images?username=${encodeURIComponent(username)}&limit=${limit}&offset=${pagination.offset + limit}`
      );
      
      if (!response.ok) {
        throw new Error('追加画像データの取得に失敗しました');
      }
      
      const data = await response.json();
      setImages(prev => [...prev, ...data.images]);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Load more images error:', err);
    }
  };

  return { 
    images, 
    loading, 
    error, 
    pagination, 
    loadMore,
    refetch: () => fetchImages()
  };
}

// 画像ダウンロードと定期更新のフック
export function useImageDownload() {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState({ message: '', success: false });

  const downloadImages = async (username: string, options?: any) => {
    try {
      setDownloading(true);
      setProgress({ message: 'ダウンロード開始中...', success: false });

      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, options }),
      });

      const result = await response.json();

      if (response.ok) {
        setProgress({ 
          message: result.message || 'ダウンロード完了!', 
          success: true 
        });
        return result;
      } else {
        throw new Error(result.error || 'ダウンロードに失敗しました');
      }
    } catch (error) {
      setProgress({ 
        message: error instanceof Error ? error.message : 'ダウンロードエラー', 
        success: false 
      });
      throw error;
    } finally {
      setDownloading(false);
    }
  };

  const scheduleUpdate = async (username: string, secret: string) => {
    try {
      const response = await fetch('/api/sanity-cosplayers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, secret }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '定期更新に失敗しました');
      }

      return result;
    } catch (error) {
      console.error('Schedule update error:', error);
      throw error;
    }
  };

  return {
    downloading,
    progress,
    downloadImages,
    scheduleUpdate
  };
}