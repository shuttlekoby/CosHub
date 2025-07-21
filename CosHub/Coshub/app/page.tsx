"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { SearchIcon } from "@/components/icons";
import { CosplayerData, getCosplayers, toggleFollow } from "@/lib/cosplayerStore";
import { GalleryIcon, TrendIcon, HeartIcon, BookmarkIcon } from "@/components/tab-icons";



export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [cosplayers, setCosplayers] = useState<CosplayerData[]>([]);

  // 初回読み込み時にローカルストレージからデータを取得
  useEffect(() => {
    const savedCosplayers = getCosplayers();
    setCosplayers(savedCosplayers);
  }, []);

  const handleFollow = (id: string) => {
    toggleFollow(id);
    setCosplayers(getCosplayers());
  };

  const handleProfileClick = (username: string) => {
    router.push(`/cosplayer/${username}`);
  };

  // フィルタリング・ソート
  const filteredCosplayers = cosplayers.filter(cosplayer => {
    const matchesSearch = cosplayer.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cosplayer.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedTab === "saved") {
      return matchesSearch && cosplayer.isFollowed;
    }
    
    return matchesSearch;
  }).sort((a, b) => {
    if (sortBy === "popular") {
      const followersA = parseFloat((a.followers || '0').replace('K', ''));
      const followersB = parseFloat((b.followers || '0').replace('K', ''));
      return followersB - followersA;
    } else if (sortBy === "latest") {
      return a.displayName.localeCompare(b.displayName); // 簡易ソート
    }
    return 0;
  });

  const ProfileCard = ({ cosplayer }: { cosplayer: CosplayerData }) => (
    <Card 
      className="max-w-[340px] hover:scale-105 transition-transform cursor-pointer"
      isPressable
      onPress={() => handleProfileClick(cosplayer.username)}
    >
      <CardHeader className="justify-between">
        <div className="flex gap-5">
          <Avatar
            isBordered
            radius="full"
            size="md"
            src={cosplayer.avatar}
          />
          <div className="flex flex-col gap-1 items-start justify-center">
            <h4 className="text-small font-semibold leading-none text-default-600">
              {cosplayer.displayName}
            </h4>
            <h5 className="text-small tracking-tight text-default-400">
              @{cosplayer.username}
            </h5>
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <Button
            className={cosplayer.isFollowed ? "bg-transparent text-foreground border-default-200" : ""}
            color="primary"
            radius="full"
            size="sm"
            variant={cosplayer.isFollowed ? "bordered" : "solid"}
            onPress={() => handleFollow(cosplayer.id)}
          >
            {cosplayer.isFollowed ? "フォロー中" : "フォロー"}
          </Button>
        </div>
      </CardHeader>
      <CardBody className="px-3 py-0 text-small text-default-400">
        <p>{cosplayer.bio}</p>
        <span className="pt-2">
          {cosplayer.hashtag}
          <span aria-label="sparkles" className="py-2 ml-2" role="img">
            ✨
          </span>
        </span>
      </CardBody>
      <CardFooter className="gap-3">
        <div className="flex gap-1">
          <p className="font-semibold text-default-400 text-small">{cosplayer.following}</p>
          <p className="text-default-400 text-small">フォロー中</p>
        </div>
        <div className="flex gap-1">
          <p className="font-semibold text-default-400 text-small">{cosplayer.followers}</p>
          <p className="text-default-400 text-small">フォロワー</p>
        </div>
      </CardFooter>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">
          CosHub
        </h1>
        <p className="text-gray-600 text-lg">
          お気に入りのコスプレイヤーを発見しよう
        </p>
      </div>

      {/* 検索・ソート */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 max-w-4xl mx-auto">
        <div className="flex-1">
          <Input
            placeholder="コスプレイヤーを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startContent={<SearchIcon className="text-default-400" />}
            variant="bordered"
            className="w-full"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            placeholder="ソート"
            selectedKeys={[sortBy]}
            onSelectionChange={(keys) => setSortBy(Array.from(keys)[0] as string)}
            variant="bordered"
          >
            <SelectItem key="popular">人気順</SelectItem>
            <SelectItem key="latest">最新順</SelectItem>
          </Select>
        </div>
      </div>

      {/* タブ */}
      <div className="flex justify-center mb-8">
        <Tabs
          aria-label="コンテンツタブ"
          color="primary"
          variant="bordered"
          selectedKey={selectedTab}
          onSelectionChange={(key) => setSelectedTab(key as string)}
        >
          <Tab
            key="all"
            title={
              <div className="flex items-center space-x-2">
                <GalleryIcon />
                <span>すべて</span>
              </div>
            }
          />
          <Tab
            key="latest"
            title={
              <div className="flex items-center space-x-2">
                <TrendIcon />
                <span>最新</span>
              </div>
            }
          />
          <Tab
            key="popular"
            title={
              <div className="flex items-center space-x-2">
                <HeartIcon />
                <span>人気</span>
              </div>
            }
          />
          <Tab
            key="saved"
            title={
              <div className="flex items-center space-x-2">
                <BookmarkIcon />
                <span>保存済み</span>
              </div>
            }
          />
        </Tabs>
      </div>

      {/* プロフィールグリッド */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {filteredCosplayers.map((cosplayer) => (
          <div key={cosplayer.id} className="flex justify-center">
            <ProfileCard cosplayer={cosplayer} />
          </div>
        ))}
      </div>

      {/* 結果が空の場合 */}
      {filteredCosplayers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">該当するコスプレイヤーが見つかりませんでした</p>
          <p className="text-gray-400 text-sm mt-2">検索条件を変更してみてください</p>
        </div>
      )}
    </div>
  );
}
