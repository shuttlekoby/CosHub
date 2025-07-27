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
import { getCosplayers, CosplayerData, MediaFile, removeCosplayer } from "@/lib/cosplayerStore";

export default function CosplayerGalleryPage() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;
  
  const [cosplayer, setCosplayer] = useState<CosplayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [deletingImages, setDeletingImages] = useState<Set<string>>(new Set());
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();
  
  useEffect(() => {
    if (username) {
      const cosplayers = getCosplayers();
      const foundCosplayer = cosplayers.find(c => c.username === username);
      setCosplayer(foundCosplayer || null);
      setLoading(false);
    }
  }, [username]);

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    onOpen();
  };

  const handleNextImage = () => {
    if (cosplayer && cosplayer.media.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % cosplayer.media.length);
    }
  };

  const handlePrevImage = () => {
    if (cosplayer && cosplayer.media.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + cosplayer.media.length) % cosplayer.media.length);
    }
  };

  const handleDownloadImage = () => {
    if (cosplayer && cosplayer.media[currentImageIndex]) {
      const image = cosplayer.media[currentImageIndex];
      const link = document.createElement('a');
      link.href = image.url;
      link.download = image.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDeleteCosplayer = async () => {
    if (!cosplayer) return;
    
    try {
      // ローカルストレージから削除
      removeCosplayer(cosplayer.id);
      
      // ダウンロードされたファイルも削除する場合
      const response = await fetch(`/api/cosplayer/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cosplayer.username })
      });
      
      if (response.ok) {
        alert('コスプレイヤーとダウンロードファイルを完全に削除しました');
      } else {
        alert('データは削除されましたが、ファイル削除でエラーが発生しました');
      }
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
    
    onDeleteModalClose();
    router.push('/');
  };

  const handleDeleteImage = async (filename: string) => {
    if (!cosplayer) return;
    
    // 削除中状態に追加
    setDeletingImages(prev => new Set(prev).add(filename));
    
    try {
      const response = await fetch('/api/cosplayer/delete-image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: cosplayer.username, 
          filename 
        })
      });
      
      if (response.ok) {
        // ローカルストレージからも削除
        const updatedCosplayer = { 
          ...cosplayer, 
          media: cosplayer.media.filter(media => media.filename !== filename) 
        };
        setCosplayer(updatedCosplayer);
        
        // ローカルストレージも更新
        const cosplayers = getCosplayers();
        const updatedCosplayers = cosplayers.map(c => 
          c.id === cosplayer.id ? updatedCosplayer : c
        );
        localStorage.setItem('cosplayers', JSON.stringify(updatedCosplayers));
        
        console.log(`画像 ${filename} を削除しました`);
      } else {
        const error = await response.json();
        alert(`画像削除に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error('画像削除エラー:', error);
      alert('画像削除に失敗しました');
    } finally {
      // 削除中状態から削除
      setDeletingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(filename);
        return newSet;
      });
    }
  };

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
                src={cosplayer.avatar}
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
              src={cosplayer.avatar}
              size="lg"
              className="w-24 h-24"
              isBordered
            />
            <div className="flex-1">
              <div className="flex flex-col gap-2 mb-4">
                <h2 className="text-2xl font-bold">{cosplayer.displayName}</h2>
                <p className="text-default-500">@{cosplayer.username}</p>
                <p className="text-default-600">{cosplayer.bio}</p>
                <div className="flex gap-4 text-sm">
                  <span><strong>{cosplayer.following}</strong> フォロー中</span>
                  <span><strong>{cosplayer.followers}</strong> フォロワー</span>
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                <Chip color="secondary" variant="flat">{cosplayer.hashtag}</Chip>
                <Chip color="primary" variant="flat">{cosplayer.media.length} 画像</Chip>
              </div>
              <div className="flex gap-2">
                <Button
                  color="danger"
                  variant="light"
                  size="sm"
                  onPress={onDeleteModalOpen}
                >
                  完全削除
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Gallery Grid */}
        {cosplayer.media.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-default-500 text-lg">まだ画像がありません</p>
            <p className="text-default-400">Createページでメディアをダウンロードしてください</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
            {cosplayer.media.map((image, index) => (
              <div
                key={index}
                className="break-inside-avoid cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                onClick={() => handleImageClick(index)}
              >
                <Card className="overflow-hidden">
                  <img
                    src={image.url}
                    alt={`${cosplayer.username} - ${index + 1}`}
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
                        onPress={() => handleDeleteImage(image.filename)}
                        isLoading={deletingImages.has(image.filename)}
                        isDisabled={deletingImages.has(image.filename)}
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
          <ModalHeader className="absolute top-4 left-4 z-50">
            <div className="flex items-center gap-4 text-white">
              <Button
                isIconOnly
                variant="flat"
                color="default"
                className="bg-black/50 text-white"
                onPress={onClose}
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </Button>
              <div>
                <p className="font-semibold">{cosplayer.displayName}</p>
                <p className="text-sm opacity-80">
                  {currentImageIndex + 1} / {cosplayer.media.length}
                </p>
              </div>
            </div>
          </ModalHeader>

          <ModalBody className="p-0 flex items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Navigation Buttons */}
              {cosplayer.media.length > 1 && (
                <>
                  <Button
                    isIconOnly
                    variant="flat"
                    size="lg"
                    className="absolute left-4 z-50 bg-black/50 text-white"
                    onPress={handlePrevImage}
                  >
                    <ChevronLeftIcon className="w-6 h-6" />
                  </Button>
                  <Button
                    isIconOnly
                    variant="flat"
                    size="lg"
                    className="absolute right-4 z-50 bg-black/50 text-white"
                    onPress={handleNextImage}
                  >
                    <ChevronRightIcon className="w-6 h-6" />
                  </Button>
                </>
              )}

              {/* Main Image */}
              <img
                src={cosplayer.media[currentImageIndex]?.url}
                alt={`${cosplayer.username} - ${currentImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </ModalBody>

          <ModalFooter className="absolute bottom-4 right-4 z-50">
            <div className="flex gap-2">
              <Button
                variant="flat"
                color="primary"
                startContent={<DownloadIcon className="w-4 h-4" />}
                onPress={handleDownloadImage}
                className="bg-black/50 text-white"
              >
                ダウンロード
              </Button>
              <Button
                isIconOnly
                variant="flat"
                color="danger"
                className="bg-black/50 text-white"
              >
                <HeartIcon className="w-4 h-4" />
              </Button>
              <Button
                isIconOnly
                variant="flat"
                color="primary"
                className="bg-black/50 text-white"
              >
                <BookmarkIcon className="w-4 h-4" />
              </Button>
            </div>
          </ModalFooter>
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
                <li>ダウンロードされた画像・動画ファイル ({cosplayer.media.length}個)</li>
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