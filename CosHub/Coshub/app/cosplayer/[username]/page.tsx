"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@heroui/card";
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Spinner } from "@heroui/spinner";
import { Chip } from "@heroui/chip";
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, DownloadIcon, HeartIcon, BookmarkIcon, TrashIcon } from "@/components/icons";

// Sanity API レスポンス型定義
interface SanityCosplayer {
  id: string;
  username: string;
  displayName: string;
  imageCount: number;
  lastUpdated: string;
  profileImage: string;
}

interface SanityImage {
  _id: string;
  imageAsset: any;
  originalFilename: string;
  uploadedAt: string;
  metadata: {
    lqip: string;
    dimensions: { width: number; height: number; aspectRatio: number };
    format: string;
    size: number;
  };
  imageUrl: string;
}

export default function CosplayerGalleryPage() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;
  
  const [cosplayer, setCosplayer] = useState<SanityCosplayer | null>(null);
  const [images, setImages] = useState<SanityImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [deletingImages, setDeletingImages] = useState<Set<string>>(new Set());
  const [showControls, setShowControls] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();
  
  useEffect(() => {
    if (username) {
      const loadCosplayerData = async () => {
        try {
          setLoading(true);
          
          // コスプレイヤー情報を取得
          const cosplayersResponse = await fetch('/api/sanity-cosplayers');
          if (cosplayersResponse.ok) {
            const cosplayers = await cosplayersResponse.json();
            const foundCosplayer = cosplayers.find((c: SanityCosplayer) => c.username === username);
            setCosplayer(foundCosplayer || null);
          }
          
          // 画像一覧を取得（全画像取得）
          const imagesResponse = await fetch(`/api/sanity-images?username=${username}&limit=1000`);
          if (imagesResponse.ok) {
            const imageData = await imagesResponse.json();
            console.log('🎯 取得した画像データ:', imageData);
            console.log('🎯 画像数:', imageData.images?.length || 0);
            setImages(imageData.images || []);
          } else {
            console.error('❌ 画像取得エラー:', imagesResponse.status, imagesResponse.statusText);
          }
        } catch (error) {
          console.error('Failed to load cosplayer data:', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadCosplayerData();
    }
  }, [username]);

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    onOpen();
  };

  const handleNextImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const handlePrevImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const handleDownloadImage = () => {
    if (images[currentImageIndex]) {
      const image = images[currentImageIndex];
      const link = document.createElement('a');
      link.href = image.imageUrl;
      link.download = image.originalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDeleteCosplayer = async () => {
    console.log('削除機能は開発中です');
    // TODO: Sanityでのコスプレイヤー削除機能を実装
    onDeleteModalClose();
  };

  const handleDeleteImage = async (filename: string) => {
    console.log('画像削除機能は開発中です:', filename);
    // TODO: Sanityでの画像削除機能を実装
  };

  // スワイプ機能のためのタッチイベント処理
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && images.length > 0) {
      handleNextImage();
    }
    if (isRightSwipe && images.length > 0) {
      handlePrevImage();
    }
  };

  // コントロール表示の切り替え
  const toggleControls = () => {
    setShowControls(!showControls);
  };

  // コントロール自動非表示タイマー
  useEffect(() => {
    if (showControls && isOpen) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls, isOpen]);

  // モーダルが開いたときにコントロールを表示
  useEffect(() => {
    if (isOpen) {
      setShowControls(true);
    }
  }, [isOpen]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!cosplayer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">コスプレイヤーが見つかりません</h1>
        <Button onPress={() => router.push("/")} startContent={<ArrowLeftIcon />}>
          ホームに戻る
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-default-100">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-lg bg-background/80 border-b border-divider">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="light"
              startContent={<ArrowLeftIcon className="w-4 h-4" />}
              onPress={() => router.push("/")}
            >
              戻る
            </Button>
            <div className="flex items-center gap-4">
              <Avatar
                src={cosplayer.profileImage}
                size="md"
                isBordered
              />
              <div>
                <h1 className="text-xl font-bold">{cosplayer.displayName}</h1>
                <p className="text-small text-default-500">@{cosplayer.username}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar
              src={cosplayer.profileImage}
              size="lg"
              className="w-24 h-24"
              isBordered
            />
            <div className="flex-1">
              <div className="flex flex-col gap-2 mb-4">
                <h2 className="text-2xl font-bold">{cosplayer.displayName}</h2>
                <p className="text-default-500">@{cosplayer.username}</p>
                <p className="text-default-600">最終更新: {new Date(cosplayer.lastUpdated).toLocaleDateString('ja-JP')}</p>
              </div>
              <div className="flex gap-2 mb-4">
                <Chip color="primary" variant="flat">{images.length} 画像</Chip>
                <Chip color="secondary" variant="flat">{cosplayer.imageCount} 総画像数</Chip>
              </div>
              <div className="flex gap-2">
                <Button
                  color="danger"
                  variant="light"
                  size="sm"
                  onPress={onDeleteModalOpen}
                >
                  削除 (開発中)
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Gallery Grid */}
        {(() => {
          console.log('🎯 レンダリング時の画像数:', images.length);
          return null;
        })()}
        {images.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-default-500 text-lg">まだ画像がありません</p>
            <p className="text-default-400">Createページでメディアをダウンロードしてください</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
            {images.map((image, index) => (
              <div
                key={image._id}
                className="break-inside-avoid cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                onClick={() => handleImageClick(index)}
              >
                <Card className="overflow-hidden">
                  <img
                    src={image.imageUrl}
                    alt={`${cosplayer.username} - ${image.originalFilename}`}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-300 flex items-end justify-end p-2">
                    <div 
                      className="opacity-0 hover:opacity-100 transition-opacity duration-300 flex gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        isIconOnly
                        size="sm"
                        variant="solid"
                        color="danger"
                        className="bg-black/50"
                      >
                        <HeartIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="solid"
                        color="primary"
                        className="bg-black/50"
                      >
                        <BookmarkIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="solid"
                        color="warning"
                        className="bg-red-500/90 hover:bg-red-600"
                        onPress={() => handleDeleteImage(image.originalFilename)}
                        isLoading={deletingImages.has(image.originalFilename)}
                        isDisabled={deletingImages.has(image.originalFilename)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slideshow Modal */}
      <Modal
        size="full"
        isOpen={isOpen}
        onClose={onClose}
        hideCloseButton
        classNames={{
          base: "bg-black/90",
          wrapper: "items-center justify-center",
        }}
      >
        <ModalContent className="max-w-none max-h-none w-full h-full bg-transparent">
          {/* Header - コントロール表示時のみ表示 */}
          {showControls && (
            <ModalHeader className="absolute top-4 left-4 z-50 transition-opacity duration-300">
              <div className="flex items-center gap-4 text-white">
                <Button
                  isIconOnly
                  variant="flat"
                  color="default"
                  className="bg-black/50 text-white hover:bg-black/70"
                  onPress={onClose}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </Button>
                <div>
                  <p className="font-semibold">{cosplayer.displayName}</p>
                  <p className="text-sm opacity-80">
                    {currentImageIndex + 1} / {images.length}
                  </p>
                </div>
              </div>
            </ModalHeader>
          )}

          <ModalBody 
            className="p-0 flex items-center justify-center overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div 
              className="relative w-full h-full flex items-center justify-center"
              onClick={toggleControls}
            >
              {/* Navigation Buttons - PC用 & コントロール表示時のみ */}
              {images.length > 1 && showControls && (
                <>
                  <Button
                    isIconOnly
                    variant="flat"
                    size="lg"
                    className="absolute left-4 z-50 bg-black/50 text-white hover:bg-black/70 transition-all duration-300 hidden md:flex"
                    onPress={handlePrevImage}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ChevronLeftIcon className="w-6 h-6" />
                  </Button>
                  <Button
                    isIconOnly
                    variant="flat"
                    size="lg"
                    className="absolute right-4 z-50 bg-black/50 text-white hover:bg-black/70 transition-all duration-300 hidden md:flex"
                    onPress={handleNextImage}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ChevronRightIcon className="w-6 h-6" />
                  </Button>
                </>
              )}

              {/* Main Image - PC表示修正 */}
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={images[currentImageIndex]?.imageUrl}
                  alt={`${cosplayer.username} - ${images[currentImageIndex]?.originalFilename || currentImageIndex + 1}`}
                  className="max-w-full max-h-[90vh] w-auto h-auto object-contain select-none"
                  style={{ maxHeight: 'calc(100vh - 80px)' }}
                  draggable={false}
                />
              </div>

              {/* スワイプヒント - モバイル用 */}
              {images.length > 1 && showControls && (
                <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 md:hidden">
                  <p className="text-white/70 text-sm">← スワイプで画像切り替え →</p>
                </div>
              )}
            </div>
          </ModalBody>

          {/* Footer - コントロール表示時のみ表示 */}
          {showControls && (
            <ModalFooter className="absolute bottom-4 right-4 z-50 transition-opacity duration-300">
              <div className="flex gap-2">
                <Button
                  variant="flat"
                  color="primary"
                  startContent={<DownloadIcon className="w-4 h-4" />}
                  onPress={handleDownloadImage}
                  className="bg-black/50 text-white hover:bg-black/70"
                  onClick={(e) => e.stopPropagation()}
                >
                  ダウンロード
                </Button>
                <Button
                  isIconOnly
                  variant="flat"
                  color="danger"
                  className="bg-black/50 text-white hover:bg-black/70"
                  onClick={(e) => e.stopPropagation()}
                >
                  <HeartIcon className="w-4 h-4" />
                </Button>
                <Button
                  isIconOnly
                  variant="flat"
                  color="primary"
                  className="bg-black/50 text-white hover:bg-black/70"
                  onClick={(e) => e.stopPropagation()}
                >
                  <BookmarkIcon className="w-4 h-4" />
                </Button>
              </div>
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose}>
        <ModalContent>
          <ModalHeader>
            <h3 className="text-lg font-semibold text-danger">完全削除の確認</h3>
          </ModalHeader>
          <ModalBody>
            <p className="text-default-700">
              <strong>{cosplayer.displayName} (@{cosplayer.username})</strong> を完全に削除しますか？
            </p>
            <div className="mt-4 p-4 bg-danger-50 border border-danger-200 rounded-lg">
              <p className="text-sm text-danger-800">
                <strong>⚠️ 警告：</strong><br />
                この操作は取り消せません。以下のデータが完全に削除されます：
              </p>
              <ul className="mt-2 text-xs text-danger-700 list-disc list-inside space-y-1">
                <li>コスプレイヤーのプロフィール情報</li>
                <li>ダウンロードされた画像・動画ファイル ({images.length}個)</li>
                <li>フォロー状態などの設定</li>
              </ul>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={onDeleteModalClose}
            >
              キャンセル
            </Button>
            <Button
              color="danger"
              onPress={handleDeleteCosplayer}
            >
              完全削除する
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
} 