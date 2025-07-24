"use client";

import { useState, useEffect } from "react";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Image } from "@heroui/image";
import { Avatar } from "@heroui/avatar";
import { Tabs, Tab } from "@heroui/tabs";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Pagination } from "@heroui/pagination";
import { Progress } from "@heroui/progress";
import { Chip } from "@heroui/chip";
import { title, subtitle } from "../../components/primitives";
import { SearchIcon, HeartIcon, DownloadIcon } from "../../components/icons";
import { 
  CosplayerData, 
  MediaFile, 
  DownloadStatus,
  getCosplayers,
  addCosplayer,
  updateDownloadStatus,
  addMediaToCosplayer,
  updateCosplayerAvatar
} from "../../lib/cosplayerStore";

export default function CreatePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("gallery");
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [cosplayers, setCosplayers] = useState<CosplayerData[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // 拡張フォーム用のstate
  const { 
    isOpen: isAddFormOpen, 
    onOpen: onAddFormOpen, 
    onClose: onAddFormClose 
  } = useDisclosure();
  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    bio: "",
    followers: "",
    following: "",
    customAvatar: "",
    location: "",
    twitterLink: "",
    instagramLink: "",
    verified: false
  });

  // プロフィール編集用のstate
  const { 
    isOpen: isEditFormOpen, 
    onOpen: onEditFormOpen, 
    onClose: onEditFormClose 
  } = useDisclosure();
  const [editingCosplayer, setEditingCosplayer] = useState<CosplayerData | null>(null);
  const [editFormData, setEditFormData] = useState({
    displayName: "",
    bio: "",
    followers: "",
    following: "",
    customAvatar: "",
    location: "",
    twitterLink: "",
    instagramLink: "",
    verified: false
  });

  // 画像編集用のstate
  const { 
    isOpen: isImageEditOpen, 
    onOpen: onImageEditOpen, 
    onClose: onImageEditClose 
  } = useDisclosure();
  const [editingImage, setEditingImage] = useState<{media: MediaFile, cosplayer: CosplayerData} | null>(null);
  const [imageEditData, setImageEditData] = useState({
    title: "",
    description: "",
    likes: "",
    tags: "",
    uploadDate: ""
  });

  // 初回読み込み時にローカルストレージからデータを取得
  useEffect(() => {
    const savedCosplayers = getCosplayers();
    setCosplayers(savedCosplayers);
  }, []);

  const filteredCosplayers = cosplayers.filter(cosplayer =>
    cosplayer.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cosplayer.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleImageClick = (image: any, cosplayer: any) => {
    setSelectedImage({ ...image, cosplayer });
    onOpen();
  };

  // 新しいユーザーを追加
  const handleAddUser = async () => {
    if (!newUsername.trim()) return;

    const username = newUsername.trim().replace('@', '');
    
    // 既存ユーザーをチェック
    if (cosplayers.find(c => c.username === username)) {
      alert('このユーザーは既に追加されています');
      return;
    }

    try {
      // 新しいコスプレイヤーを追加（ローカルストレージに保存）
      const newCosplayer = await addCosplayer(username, username);
      
      // ステートを更新
      setCosplayers(prev => [...prev, newCosplayer]);
      setNewUsername("");

      // 既存ファイルをチェック
      await loadExistingFiles(username);
    } catch (error) {
      console.error('ユーザー追加エラー:', error);
      alert('ユーザーの追加に失敗しました');
    }
  };

  // 既存ファイルの読み込み
  const loadExistingFiles = async (username: string) => {
    try {
      const response = await fetch(`/api/download?username=${username}`);
      const data = await response.json();

      if (data.files && data.files.length > 0) {
        const mediaFiles = data.files.map((file: any) => ({
          ...file,
          likes: Math.floor(Math.random() * 2000) + 100
        }));
        
        // ローカルストレージに保存
        addMediaToCosplayer(username, mediaFiles);
        
        // ステートを更新
        setCosplayers(getCosplayers());
      }
    } catch (error) {
      console.error('既存ファイルの読み込みエラー:', error);
    }
  };

  // メディアダウンロード
  const handleDownload = async (username: string) => {
    // ダウンロード状態を更新
    const status: DownloadStatus = {
      isDownloading: true,
      progress: 10,
      message: 'ダウンロード開始...'
    };
    updateDownloadStatus(username, status);
    setCosplayers(getCosplayers());

    try {
      // プログレス更新のシミュレーション
      const progressInterval = setInterval(() => {
        const currentCosplayers = getCosplayers();
        const cosplayer = currentCosplayers.find(c => c.username === username);
        if (cosplayer && cosplayer.downloadStatus) {
          const newProgress = Math.min(cosplayer.downloadStatus.progress + 10, 90);
          const updatedStatus: DownloadStatus = {
            isDownloading: true,
            progress: newProgress,
            message: newProgress < 30 ? 'ツイートを取得中...' : 
                    newProgress < 60 ? '画像をダウンロード中...' : 
                    newProgress < 90 ? 'WebPに変換中...' : '最終処理中...'
          };
          updateDownloadStatus(username, updatedStatus);
          setCosplayers(getCosplayers());
        }
      }, 1000);

      // 実際のダウンロード実行
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          options: {
            imageOnly: true,
            count: 100,
            highQuality: true
          }
        }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // 成功時の状態更新
        const mediaFiles = data.files.map((file: any) => ({
          ...file,
          likes: Math.floor(Math.random() * 2000) + 100
        }));
        
        // メディアファイルを追加
        addMediaToCosplayer(username, mediaFiles);
        
        // ダウンロード状況を更新
        const successStatus: DownloadStatus = {
          isDownloading: false,
          progress: 100,
          message: data.source === 'sample' 
            ? `${data.downloadedCount}個のサンプル画像を生成しました`
            : `${data.downloadedCount}個のファイルをダウンロード完了`,
          additionalInfo: data.source === 'twmd' ? '実際のTwitter画像' :
                         data.source === 'manual' ? '手動保存画像' :
                         'サンプルデータ'
        };
        updateDownloadStatus(username, successStatus);
        
        // ステートを更新
        setCosplayers(getCosplayers());

        // 成功通知
        if (data.source === 'sample') {
          console.log(`📝 ${username}: サンプルデータを生成しました`);
        } else {
          console.log(`✅ ${username}: 実際のデータをダウンロードしました`);
        }
      } else {
        throw new Error(data.message || 'ダウンロードに失敗しました');
      }

    } catch (error) {
      console.error(`❌ ${username} ダウンロードエラー:`, error);
      
      // エラーの種類を判定してユーザーフレンドリーなメッセージを作成
      let errorMessage = 'エラーが発生しました';
      let suggestions: string[] = [];

      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = 'ネットワーク接続エラー';
        suggestions = [
          'インターネット接続を確認してください',
          'VPNを使用している場合は一時的に無効にしてください',
          'ページを再読み込みして再試行してください'
        ];
      } else if (error instanceof Error) {
        if (error.message.includes('user not found')) {
          errorMessage = 'ユーザーが見つかりません';
          suggestions = [
            'ユーザー名のスペルを確認してください',
            'ユーザーが存在するかTwitterで確認してください',
            '@マークは不要です'
          ];
        } else if (error.message.includes('Rate limit')) {
          errorMessage = 'アクセス制限に達しました';
          suggestions = [
            '1分ほど待ってから再試行してください',
            '一度に大量のリクエストを送信しないでください'
          ];
        } else if (error.message.includes('Authentication')) {
          errorMessage = '認証エラー';
          suggestions = [
            'プライベートアカウントの場合はアクセスできません',
            'ページを再読み込みして再試行してください'
          ];
        } else {
          errorMessage = error.message;
          suggestions = [
            'ページを再読み込みして再試行してください',
            '問題が継続する場合は開発者にお問い合わせください'
          ];
        }
      }

      // エラー状態を更新
      const errorStatus: DownloadStatus = {
        isDownloading: false,
        progress: 0,
        message: errorMessage,
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestions
      };
      updateDownloadStatus(username, errorStatus);
      setCosplayers(getCosplayers());

      // 詳細ログ（開発環境のみ）
      if (process.env.NODE_ENV === 'development') {
        console.group(`🐛 ${username} 詳細エラー情報`);
        console.error('Error object:', error);
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
        console.groupEnd();
      }
    }
  };

  // プロフィール画像を更新
  const handleUpdateAvatar = async (username: string) => {
    try {
      await updateCosplayerAvatar(username);
      // ステートを更新
      setCosplayers(getCosplayers());
    } catch (error) {
      console.error('プロフィール画像更新エラー:', error);
      alert('プロフィール画像の更新に失敗しました');
    }
  };

  // 拡張フォーム用のハンドラー
  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAdvancedAdd = async () => {
    if (!formData.username.trim()) {
      alert('ユーザー名を入力してください');
      return;
    }

    try {
      // 既存チェック
      const existingCosplayer = cosplayers.find(c => c.username === formData.username);
      if (existingCosplayer) {
        alert('このユーザーは既に追加されています');
        return;
      }

      const newCosplayer: CosplayerData = {
        id: `${Date.now()}-${formData.username}`,
        username: formData.username,
        displayName: formData.displayName || formData.username,
        avatar: formData.customAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.username)}&background=667eea&color=fff&size=400&font-size=0.6&bold=true`,
        bio: formData.bio || `コスプレイヤー @${formData.username}`,
        hashtag: `#${formData.username}コス`,
        following: parseInt(formData.following) || Math.floor(Math.random() * 50) + 1,
        followers: formData.followers || `${(Math.random() * 300 + 10).toFixed(1)}K`,
        isFollowed: false,
        media: [],
        downloadStatus: {
          isDownloading: false,
          progress: 0,
          message: '待機中'
        },
        addedAt: Date.now(),
        
        // 拡張フィールド
        customAvatar: formData.customAvatar,
        isManuallyEdited: true,
        location: formData.location,
        socialLinks: {
          twitter: formData.twitterLink ? `https://twitter.com/${formData.twitterLink}` : undefined,
          instagram: formData.instagramLink ? `https://instagram.com/${formData.instagramLink}` : undefined,
        },
        stats: {
          verified: formData.verified,
          totalPosts: 0,
          avgLikes: 0,
        }
      };

      // cosplayerStoreを使わず直接追加
      const updatedCosplayers = [...cosplayers, newCosplayer];
      setCosplayers(updatedCosplayers);
      
      // localStorageに保存
      if (typeof window !== 'undefined') {
        localStorage.setItem('coshub_cosplayers', JSON.stringify(updatedCosplayers));
      }

      // フォームリセットとモーダル閉じる
      setFormData({
        username: "",
        displayName: "",
        bio: "",
        followers: "",
        following: "",
        customAvatar: "",
        location: "",
        twitterLink: "",
        instagramLink: "",
        verified: false
      });
      onAddFormClose();

      // メディアの読み込み
      await loadExistingFiles(formData.username);

    } catch (error) {
      console.error('ユーザー追加エラー:', error);
      alert('ユーザーの追加に失敗しました');
    }
  };

  // プロフィール編集用のハンドラー
  const handleEditProfile = (cosplayer: CosplayerData) => {
    setEditingCosplayer(cosplayer);
    setEditFormData({
      displayName: cosplayer.displayName,
      bio: cosplayer.bio || "",
      followers: cosplayer.followers || "",
      following: cosplayer.following?.toString() || "",
      customAvatar: cosplayer.customAvatar || "",
      location: cosplayer.location || "",
      twitterLink: cosplayer.socialLinks?.twitter?.replace('https://twitter.com/', '') || "",
      instagramLink: cosplayer.socialLinks?.instagram?.replace('https://instagram.com/', '') || "",
      verified: cosplayer.stats?.verified || false
    });
    onEditFormOpen();
  };

  const handleEditFormChange = (field: string, value: string | boolean) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveEdit = async () => {
    if (!editingCosplayer) return;

    try {
      const updatedCosplayer: CosplayerData = {
        ...editingCosplayer,
        displayName: editFormData.displayName || editingCosplayer.username,
        bio: editFormData.bio,
        followers: editFormData.followers,
        following: parseInt(editFormData.following) || editingCosplayer.following,
        customAvatar: editFormData.customAvatar,
        avatar: editFormData.customAvatar || editingCosplayer.avatar,
        location: editFormData.location,
        isManuallyEdited: true,
        socialLinks: {
          ...editingCosplayer.socialLinks,
          twitter: editFormData.twitterLink ? `https://twitter.com/${editFormData.twitterLink}` : undefined,
          instagram: editFormData.instagramLink ? `https://instagram.com/${editFormData.instagramLink}` : undefined,
        },
        stats: {
          ...editingCosplayer.stats,
          verified: editFormData.verified,
        }
      };

      // cosplayerを更新
      const updatedCosplayers = cosplayers.map(c => 
        c.id === editingCosplayer.id ? updatedCosplayer : c
      );
      setCosplayers(updatedCosplayers);

      // localStorageに保存
      if (typeof window !== 'undefined') {
        localStorage.setItem('coshub_cosplayers', JSON.stringify(updatedCosplayers));
      }

      onEditFormClose();
      setEditingCosplayer(null);

    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      alert('プロフィールの更新に失敗しました');
    }
  };

  // 画像編集用のハンドラー
  const handleEditImage = (media: MediaFile, cosplayer: CosplayerData) => {
    setEditingImage({ media, cosplayer });
    setImageEditData({
      title: media.title || "",
      description: media.description || "",
      likes: media.likes?.toString() || "",
      tags: media.tags?.join(", ") || "",
      uploadDate: media.uploadDate || new Date().toISOString().split('T')[0]
    });
    onImageEditOpen();
  };

  const handleImageEditChange = (field: string, value: string) => {
    setImageEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveImageEdit = async () => {
    if (!editingImage) return;

    try {
      const updatedMedia: MediaFile = {
        ...editingImage.media,
        title: imageEditData.title,
        description: imageEditData.description,
        likes: parseInt(imageEditData.likes) || editingImage.media.likes || 0,
        tags: imageEditData.tags.split(",").map(tag => tag.trim()).filter(tag => tag),
        uploadDate: imageEditData.uploadDate,
        isEdited: true
      };

      // コスプレイヤーのメディアリストを更新
      const updatedCosplayer = {
        ...editingImage.cosplayer,
        media: editingImage.cosplayer.media.map(m => 
          m.filename === editingImage.media.filename ? updatedMedia : m
        )
      };

      // cosplayersリスト全体を更新
      const updatedCosplayers = cosplayers.map(c => 
        c.id === editingImage.cosplayer.id ? updatedCosplayer : c
      );
      setCosplayers(updatedCosplayers);

      // localStorageに保存
      if (typeof window !== 'undefined') {
        localStorage.setItem('coshub_cosplayers', JSON.stringify(updatedCosplayers));
      }

      onImageEditClose();
      setEditingImage(null);

    } catch (error) {
      console.error('画像情報更新エラー:', error);
      alert('画像情報の更新に失敗しました');
    }
  };

  const allMedia = filteredCosplayers.flatMap(cosplayer =>
    cosplayer.media.map(media => ({ ...media, cosplayer }))
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ヘッダーセクション */}
      <section className="text-center mb-12">
        <div className="inline-block max-w-4xl">
          <span className={title({ size: "lg" })}>コスプレイヤー&nbsp;</span>
          <span className={title({ size: "lg", color: "pink" })}>管理&nbsp;</span>
          <br />
          <span className={title({ size: "lg" })}>Create</span>
          <div className={subtitle({ class: "mt-4" })}>
            コスプレイヤーを追加し、画像・動画をダウンロード管理
          </div>
        </div>

        {/* ユーザー追加 */}
        <div className="max-w-md mx-auto mt-8 flex flex-col gap-4">
          {/* シンプル追加 */}
          <div className="flex gap-2">
            <Input
              placeholder="@ユーザー名を入力..."
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              variant="bordered"
              size="lg"
            />
            <Button 
              color="primary" 
              size="lg"
              onPress={handleAddUser}
              isDisabled={!newUsername.trim()}
            >
              追加
            </Button>
          </div>
          
          {/* 詳細追加ボタン */}
          <Button 
            color="secondary" 
            variant="bordered"
            size="lg"
            onPress={onAddFormOpen}
            className="w-full"
          >
            📝 詳細情報を入力して追加
          </Button>
        </div>

        {/* 検索バー */}
        <div className="max-w-md mx-auto mt-4">
          <Input
            placeholder="コスプレイヤーを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startContent={<SearchIcon className="text-default-400" />}
            variant="bordered"
            size="lg"
          />
        </div>
      </section>

      {/* タブナビゲーション */}
      <div className="flex justify-center mb-8">
        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={(key) => setSelectedTab(key as string)}
          color="primary"
          variant="underlined"
          size="lg"
        >
          <Tab key="gallery" title={`ギャラリー (${allMedia.length})`} />
          <Tab key="cosplayers" title={`コスプレイヤー (${filteredCosplayers.length})`} />
        </Tabs>
      </div>

      {/* ギャラリータブ */}
      {selectedTab === "gallery" && (
        <section>
          {allMedia.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {allMedia.map((media, index) => (
                <Card 
                  key={`${media.cosplayer.username}-${media.filename}-${index}`}
                  className="cursor-pointer hover:scale-105 transition-transform group"
                  isPressable
                  onPress={() => handleImageClick(media, media.cosplayer)}
                >
                  <CardBody className="p-0 relative">
                    <Image
                      src={media.url}
                      alt="Cosplay"
                      className="object-cover w-full h-64"
                      loading="lazy"
                    />
                    {/* 編集ボタンオーバーレイ */}
                    <div 
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        isIconOnly
                        size="sm"
                        color="secondary"
                        variant="solid"
                        className="bg-white/80 backdrop-blur-sm"
                        onPress={() => handleEditImage(media, media.cosplayer)}
                      >
                        ✏️
                      </Button>
                    </div>
                    {/* 編集済みインジケーター */}
                    {media.isEdited && (
                      <div className="absolute top-2 left-2">
                        <span className="text-tiny bg-success text-white px-2 py-1 rounded-full">
                          編集済み
                        </span>
                      </div>
                    )}
                  </CardBody>
                  <CardFooter className="flex flex-col gap-2 p-3">
                    {/* タイトル（編集されている場合のみ表示） */}
                    {media.title && (
                      <h4 className="text-sm font-semibold text-left w-full truncate">
                        {media.title}
                      </h4>
                    )}
                    
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-2">
                        <Avatar src={media.cosplayer.avatar} size="sm" />
                        <span className="text-sm font-medium">{media.cosplayer.displayName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <HeartIcon size={16} className="text-red-500" />
                          <span className="text-sm">{media.likes || 0}</span>
                        </div>
                        {media.tags && media.tags.length > 0 && (
                          <span className="text-tiny bg-primary-100 text-primary-600 px-2 py-1 rounded">
                            {media.tags.length} タグ
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 説明（編集されている場合のみ表示） */}
                    {media.description && (
                      <p className="text-tiny text-default-500 text-left w-full line-clamp-2">
                        {media.description}
                      </p>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">まだダウンロードされた画像がありません</p>
              <p className="text-sm text-gray-400 mt-2">コスプレイヤータブからユーザーを追加してダウンロードしてください</p>
            </div>
          )}
        </section>
      )}

      {/* コスプレイヤータブ */}
      {selectedTab === "cosplayers" && (
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredCosplayers.map((cosplayer) => (
              <Card key={cosplayer.username} className="p-6">
                <CardBody className="flex flex-col items-center text-center">
                  <Avatar 
                    src={cosplayer.avatar || `https://via.placeholder.com/100x100?text=${cosplayer.username.charAt(0).toUpperCase()}`}
                    size="lg" 
                    className="mb-4"
                  />
                  <h3 className="text-xl font-bold">{cosplayer.displayName}</h3>
                  <p className="text-gray-500">@{cosplayer.username}</p>
                  
                  {/* ダウンロード状況 */}
                  {cosplayer.downloadStatus && (
                    <div className="w-full mt-4 space-y-3">
                      {cosplayer.downloadStatus.isDownloading ? (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">{cosplayer.downloadStatus.message}</span>
                            <Chip size="sm" color="warning">
                              {cosplayer.downloadStatus.progress}%
                            </Chip>
                          </div>
                          <Progress 
                            value={cosplayer.downloadStatus.progress} 
                            color="primary" 
                            size="sm"
                          />
                        </div>
                      ) : cosplayer.downloadStatus.error ? (
                        <div className="bg-danger-50 dark:bg-danger-950/50 p-3 rounded-lg border border-danger-200 dark:border-danger-800 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-danger-700 dark:text-danger-300 font-medium">
                              ❌ {cosplayer.downloadStatus.message}
                            </span>
                            <Chip size="sm" color="danger">
                              エラー
                            </Chip>
                          </div>
                          
                          {cosplayer.downloadStatus.suggestions && cosplayer.downloadStatus.suggestions.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs font-medium text-danger-700 dark:text-danger-300 mb-1">
                                💡 解決方法:
                              </div>
                              <ul className="text-xs text-danger-600 dark:text-danger-400 space-y-1">
                                {cosplayer.downloadStatus.suggestions.map((suggestion, index) => (
                                  <li key={index} className="flex items-start gap-1">
                                    <span className="flex-shrink-0 mt-0.5">•</span>
                                    <span>{suggestion}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-success-50 dark:bg-success-950/50 p-3 rounded-lg border border-success-200 dark:border-success-800">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-success-700 dark:text-success-300 font-medium">
                              ✅ {cosplayer.downloadStatus.message}
                            </span>
                            <Chip size="sm" color="success">
                              {cosplayer.media.length}個
                            </Chip>
                          </div>
                          
                          {cosplayer.downloadStatus.additionalInfo && (
                            <div className="text-xs text-success-600 dark:text-success-400 mt-2">
                              📊 データソース: {cosplayer.downloadStatus.additionalInfo}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* プレビュー画像 */}
                  {cosplayer.media.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-4 w-full">
                      {cosplayer.media.slice(0, 3).map((media, index) => (
                        <Image
                          key={index}
                          src={media.url}
                          alt="Preview"
                          className="aspect-square object-cover cursor-pointer"
                          onClick={() => handleImageClick(media, cosplayer)}
                        />
                      ))}
                    </div>
                  )}

                  {/* ボタン */}
                  <div className="mt-4 w-full flex flex-col gap-2">
                    <Button
                      color="primary"
                      variant="flat"
                      startContent={<DownloadIcon size={16} />}
                      onPress={() => handleDownload(cosplayer.username)}
                      isDisabled={cosplayer.downloadStatus?.isDownloading}
                      isLoading={cosplayer.downloadStatus?.isDownloading}
                    >
                      {cosplayer.downloadStatus?.isDownloading ? 'ダウンロード中...' : 'メディアをダウンロード'}
                    </Button>
                    
                    <Button
                      color="secondary"
                      variant="bordered"
                      size="sm"
                      onPress={() => handleUpdateAvatar(cosplayer.username)}
                    >
                      🖼️ アイコン更新
                    </Button>
                    
                    <Button
                      color="warning"
                      variant="bordered"
                      size="sm"
                      onPress={() => handleEditProfile(cosplayer)}
                    >
                      ✏️ プロフィール編集
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ページネーション */}
      {allMedia.length > 20 && (
        <div className="flex justify-center mt-12">
          <Pagination
            page={currentPage}
            total={Math.ceil(allMedia.length / 20)}
            onChange={setCurrentPage}
            showControls
            color="primary"
          />
        </div>
      )}

      {/* 画像詳細モーダル */}
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        size="2xl"
        placement="center"
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <Avatar src={selectedImage?.cosplayer?.avatar} size="sm" />
              <div>
                <p className="font-bold">{selectedImage?.cosplayer?.displayName}</p>
                <p className="text-gray-500 text-sm">@{selectedImage?.cosplayer?.username}</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="p-0">
            {selectedImage && (
              <Image
                src={selectedImage.url}
                alt="Cosplay Detail"
                className="w-full object-cover"
              />
            )}
          </ModalBody>
          <ModalFooter>
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-2">
                <HeartIcon size={20} className="text-red-500" />
                <span>{selectedImage?.likes} いいね</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  color="secondary" 
                  variant="flat"
                  onPress={() => {
                    if (selectedImage && selectedImage.cosplayer) {
                      onClose(); // 現在のモーダルを閉じる
                      handleEditImage(selectedImage, selectedImage.cosplayer);
                    }
                  }}
                >
                  ✏️ 編集
                </Button>
                <Button 
                  color="primary" 
                  variant="flat"
                  as="a"
                  href={selectedImage?.url}
                  download
                >
                  <DownloadIcon size={16} />
                  ダウンロード
                </Button>
                <Button color="danger" variant="light" onPress={onClose}>
                  閉じる
                </Button>
              </div>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 拡張フォームモーダル */}
      <Modal 
        isOpen={isAddFormOpen} 
        onClose={onAddFormClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold">詳細情報を入力してコスプレイヤーを追加</h2>
            <p className="text-small text-default-500">より詳しい情報を設定できます</p>
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              {/* 基本情報 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="ユーザー名 *"
                  placeholder="例: cosplayer_name"
                  value={formData.username}
                  onChange={(e) => handleFormChange('username', e.target.value)}
                  variant="bordered"
                  startContent="@"
                  isRequired
                />
                <Input
                  label="表示名"
                  placeholder="例: みなみ"
                  value={formData.displayName}
                  onChange={(e) => handleFormChange('displayName', e.target.value)}
                  variant="bordered"
                />
              </div>

              {/* プロフィール文 */}
              <Textarea
                label="プロフィール文"
                placeholder="コスプレイヤーの紹介文を入力..."
                value={formData.bio}
                onChange={(e) => handleFormChange('bio', e.target.value)}
                variant="bordered"
                maxRows={3}
              />

              {/* フォロー数・フォロワー数 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="フォロワー数"
                  placeholder="例: 45.6K または 45600"
                  value={formData.followers}
                  onChange={(e) => handleFormChange('followers', e.target.value)}
                  variant="bordered"
                />
                <Input
                  label="フォロー数"
                  placeholder="例: 123"
                  value={formData.following}
                  onChange={(e) => handleFormChange('following', e.target.value)}
                  variant="bordered"
                  type="number"
                />
              </div>

              {/* カスタムアバター・活動地域 */}
              <div className="grid grid-cols-1 gap-4">
                <Input
                  label="カスタムアイコンURL"
                  placeholder="https://example.com/avatar.jpg"
                  value={formData.customAvatar}
                  onChange={(e) => handleFormChange('customAvatar', e.target.value)}
                  variant="bordered"
                />
                <Input
                  label="活動地域"
                  placeholder="例: 東京都"
                  value={formData.location}
                  onChange={(e) => handleFormChange('location', e.target.value)}
                  variant="bordered"
                />
              </div>

              {/* ソーシャルリンク */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Twitter"
                  placeholder="ユーザー名のみ"
                  value={formData.twitterLink}
                  onChange={(e) => handleFormChange('twitterLink', e.target.value)}
                  variant="bordered"
                  startContent="@"
                />
                <Input
                  label="Instagram"
                  placeholder="ユーザー名のみ"
                  value={formData.instagramLink}
                  onChange={(e) => handleFormChange('instagramLink', e.target.value)}
                  variant="bordered"
                  startContent="@"
                />
              </div>

              {/* プレビュー */}
              {formData.username && (
                <div className="mt-4 p-4 border-2 border-dashed border-default-200 rounded-lg">
                  <h4 className="text-small font-semibold mb-2">プレビュー:</h4>
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={formData.customAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.username)}&background=667eea&color=fff&size=400&font-size=0.6&bold=true`}
                      size="md"
                      isBordered
                    />
                    <div>
                      <p className="font-semibold">{formData.displayName || formData.username}</p>
                      <p className="text-small text-default-500">@{formData.username}</p>
                      {formData.location && (
                        <p className="text-tiny text-default-400">📍 {formData.location}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onAddFormClose}>
              キャンセル
            </Button>
            <Button 
              color="primary" 
              onPress={handleAdvancedAdd}
              isDisabled={!formData.username.trim()}
            >
              追加
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* プロフィール編集モーダル */}
      <Modal 
        isOpen={isEditFormOpen} 
        onClose={onEditFormClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold">プロフィール編集</h2>
            <p className="text-small text-default-500">@{editingCosplayer?.username}の情報を編集</p>
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              {/* 基本情報 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="表示名"
                  placeholder="例: みなみ"
                  value={editFormData.displayName}
                  onChange={(e) => handleEditFormChange('displayName', e.target.value)}
                  variant="bordered"
                />
                <Input
                  label="活動地域"
                  placeholder="例: 東京都"
                  value={editFormData.location}
                  onChange={(e) => handleEditFormChange('location', e.target.value)}
                  variant="bordered"
                />
              </div>

              {/* プロフィール文 */}
              <Textarea
                label="プロフィール文"
                placeholder="コスプレイヤーの紹介文を編集..."
                value={editFormData.bio}
                onChange={(e) => handleEditFormChange('bio', e.target.value)}
                variant="bordered"
                maxRows={3}
              />

              {/* フォロー数・フォロワー数 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="フォロワー数"
                  placeholder="例: 45.6K または 45600"
                  value={editFormData.followers}
                  onChange={(e) => handleEditFormChange('followers', e.target.value)}
                  variant="bordered"
                />
                <Input
                  label="フォロー数"
                  placeholder="例: 123"
                  value={editFormData.following}
                  onChange={(e) => handleEditFormChange('following', e.target.value)}
                  variant="bordered"
                  type="number"
                />
              </div>

              {/* カスタムアバター */}
              <Input
                label="カスタムアイコンURL"
                placeholder="https://example.com/avatar.jpg"
                value={editFormData.customAvatar}
                onChange={(e) => handleEditFormChange('customAvatar', e.target.value)}
                variant="bordered"
              />

              {/* ソーシャルリンク */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Twitter"
                  placeholder="ユーザー名のみ"
                  value={editFormData.twitterLink}
                  onChange={(e) => handleEditFormChange('twitterLink', e.target.value)}
                  variant="bordered"
                  startContent="@"
                />
                <Input
                  label="Instagram"
                  placeholder="ユーザー名のみ"
                  value={editFormData.instagramLink}
                  onChange={(e) => handleEditFormChange('instagramLink', e.target.value)}
                  variant="bordered"
                  startContent="@"
                />
              </div>

              {/* プレビュー */}
              {editingCosplayer && (
                <div className="mt-4 p-4 border-2 border-dashed border-default-200 rounded-lg">
                  <h4 className="text-small font-semibold mb-2">プレビュー:</h4>
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={editFormData.customAvatar || editingCosplayer.avatar}
                      size="md"
                      isBordered
                    />
                    <div>
                      <p className="font-semibold">{editFormData.displayName || editingCosplayer.username}</p>
                      <p className="text-small text-default-500">@{editingCosplayer.username}</p>
                      {editFormData.location && (
                        <p className="text-tiny text-default-400">📍 {editFormData.location}</p>
                      )}
                      <p className="text-tiny text-default-500 mt-1">{editFormData.bio}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onEditFormClose}>
              キャンセル
            </Button>
            <Button 
              color="primary" 
              onPress={handleSaveEdit}
            >
              保存
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 画像編集モーダル */}
      <Modal 
        isOpen={isImageEditOpen} 
        onClose={onImageEditClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold">画像情報編集</h2>
            {editingImage && (
              <p className="text-small text-default-500">
                {editingImage.cosplayer.displayName} - {editingImage.media.filename}
              </p>
            )}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              {/* 画像プレビュー */}
              {editingImage && (
                <div className="flex justify-center">
                  <Image
                    src={editingImage.media.url}
                    alt="編集中の画像"
                    className="max-w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* 基本情報 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="タイトル"
                  placeholder="例: 春の桜コスプレ"
                  value={imageEditData.title}
                  onChange={(e) => handleImageEditChange('title', e.target.value)}
                  variant="bordered"
                />
                <Input
                  label="いいね数"
                  placeholder="例: 1250"
                  value={imageEditData.likes}
                  onChange={(e) => handleImageEditChange('likes', e.target.value)}
                  variant="bordered"
                  type="number"
                  startContent="💖"
                />
              </div>

              {/* 説明 */}
              <Textarea
                label="説明"
                placeholder="この画像についての説明を入力..."
                value={imageEditData.description}
                onChange={(e) => handleImageEditChange('description', e.target.value)}
                variant="bordered"
                maxRows={3}
              />

              {/* タグと日付 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="タグ"
                  placeholder="例: コスプレ, 春, 桜"
                  value={imageEditData.tags}
                  onChange={(e) => handleImageEditChange('tags', e.target.value)}
                  variant="bordered"
                  description="カンマ区切りで入力"
                />
                <Input
                  label="投稿日"
                  value={imageEditData.uploadDate}
                  onChange={(e) => handleImageEditChange('uploadDate', e.target.value)}
                  variant="bordered"
                  type="date"
                />
              </div>

              {/* 統計情報プレビュー */}
              <div className="mt-4 p-4 border-2 border-dashed border-default-200 rounded-lg">
                <h4 className="text-small font-semibold mb-2">プレビュー:</h4>
                <div className="space-y-2">
                  {imageEditData.title && (
                    <p className="font-semibold">{imageEditData.title}</p>
                  )}
                  {imageEditData.description && (
                    <p className="text-small text-default-600">{imageEditData.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-small">
                    <span className="flex items-center gap-1">
                      💖 {imageEditData.likes || 0} いいね
                    </span>
                    {imageEditData.uploadDate && (
                      <span className="text-default-400">
                        📅 {new Date(imageEditData.uploadDate).toLocaleDateString('ja-JP')}
                      </span>
                    )}
                  </div>
                  {imageEditData.tags && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {imageEditData.tags.split(",").map((tag, index) => (
                        <span key={index} className="text-tiny bg-default-100 px-2 py-1 rounded">
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onImageEditClose}>
              キャンセル
            </Button>
            <Button 
              color="primary" 
              onPress={handleSaveImageEdit}
            >
              保存
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
} 