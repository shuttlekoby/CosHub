"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@heroui/card";
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Spinner } from "@heroui/spinner";
import { Chip } from "@heroui/chip";
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, DownloadIcon, HeartIcon, BookmarkIcon } from "@/components/icons";
import { getCosplayers, CosplayerData, MediaFile } from "@/lib/cosplayerStore";

export default function CosplayerGalleryPage() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;
  
  const [cosplayer, setCosplayer] = useState<CosplayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
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
              <div className="flex gap-2">
                <Chip color="secondary" variant="flat">{cosplayer.hashtag}</Chip>
                <Chip color="primary" variant="flat">{cosplayer.media.length} 画像</Chip>
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
                    <div className="opacity-0 hover:opacity-100 transition-opacity duration-300 flex gap-1">
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
    </div>
  );
} 