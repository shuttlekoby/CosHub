"use client";

import React, { useState } from "react";

// シンプルなプロフィールカードコンポーネント
function ProfileCard({ cosplayer, onFollow }: any) {
  return (
    <div className="max-w-sm mx-auto bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <img 
              src={cosplayer.avatar} 
              alt={cosplayer.displayName}
              className="w-12 h-12 rounded-full border-2 border-pink-200"
            />
            <div>
              <h4 className="font-semibold text-gray-800">{cosplayer.displayName}</h4>
              <h5 className="text-sm text-gray-500">@{cosplayer.username}</h5>
            </div>
          </div>
          <button
            onClick={() => onFollow(cosplayer.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              cosplayer.isFollowed 
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {cosplayer.isFollowed ? "フォロー中" : "フォロー"}
          </button>
        </div>
        
        <p className="text-gray-600 text-sm mb-3">{cosplayer.bio}</p>
        
        <div className="text-sm text-gray-500 mb-3">
          {cosplayer.hashtags} <span className="ml-2">{cosplayer.emoji}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <div>
            <span className="font-semibold text-gray-700">{cosplayer.following}</span>
            <span className="text-gray-500 ml-1">フォロー中</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">{cosplayer.followers}</span>
            <span className="text-gray-500 ml-1">フォロワー</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ダミーデータ
const dummyCosplayers = [
  {
    id: "1",
    username: "M_I_N_A_M_O_",
    displayName: "みなも",
    avatar: "https://i.pravatar.cc/150?img=1",
    bio: "コスプレイヤー・グラビアアイドル 🌸 オリジナル衣装多数 ✨ 撮影依頼DM💕",
    followers: "125K",
    following: "892",
    isFollowed: false,
    hashtags: "#コスプレ #グラビア",
    emoji: "🌸"
  },
  {
    id: "2", 
    username: "cos_akane",
    displayName: "あかね",
    avatar: "https://i.pravatar.cc/150?img=2",
    bio: "アニメコスプレ専門🎭 週末イベント参加 🎪 リプ返し頑張ります！",
    followers: "89K",
    following: "643",
    isFollowed: true,
    hashtags: "#アニコス #イベント",
    emoji: "🎭"
  },
  {
    id: "3",
    username: "yuki_cos",
    displayName: "雪乃ゆき",
    avatar: "https://i.pravatar.cc/150?img=3",
    bio: "ゲームキャラコス🎮 自作衣装にこだわり ⚔️ ROM専用アカウント",
    followers: "67K",
    following: "234",
    isFollowed: false,
    hashtags: "#ゲームコス #自作衣装",
    emoji: "🎮"
  },
  {
    id: "4",
    username: "sakura_idol",
    displayName: "さくら",
    avatar: "https://i.pravatar.cc/150?img=4",
    bio: "アイドル系コスプレ💖 ライブ配信も📺 いいねありがとう！",
    followers: "156K",
    following: "1.2K",
    isFollowed: false,
    hashtags: "#アイドルコス #配信",
    emoji: "💖"
  },
  {
    id: "5",
    username: "luna_cosplay",
    displayName: "ルナ",
    avatar: "https://i.pravatar.cc/150?img=5",
    bio: "月をテーマにしたコスプレ🌙 ファンタジー系多め ✨ 撮影会主催",
    followers: "73K",
    following: "456",
    isFollowed: true,
    hashtags: "#ファンタジー #撮影会",
    emoji: "🌙"
  },
  {
    id: "6",
    username: "rei_kawaii",
    displayName: "れい",
    avatar: "https://i.pravatar.cc/150?img=6",
    bio: "かわいい系コスプレ🎀 メイド衣装好き 👗 グッズ制作も",
    followers: "91K",
    following: "789",
    isFollowed: false,
    hashtags: "#かわいい #メイド",
    emoji: "🎀"
  }
];

export default function Home() {
  const [cosplayers, setCosplayers] = useState(dummyCosplayers);
  const [searchQuery, setSearchQuery] = useState("");

  const handleFollowToggle = (id: string) => {
    setCosplayers(prev => prev.map(cosplayer => 
      cosplayer.id === id 
        ? { ...cosplayer, isFollowed: !cosplayer.isFollowed }
        : cosplayer
    ));
  };

  const filteredCosplayers = cosplayers.filter(cosplayer =>
    cosplayer.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cosplayer.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-blue-600">コスプレ</span>
          <span className="text-pink-500">ギャラリー</span>
          <span className="text-blue-600">CosHub</span>
        </h1>
        <p className="text-gray-600 mb-6">お気に入りのコスプレイヤーを発見しよう</p>
        
        {/* 検索バー */}
        <div className="max-w-md mx-auto mb-8">
          <input
            type="text"
            placeholder="コスプレイヤーを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* プロフィールグリッド */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredCosplayers.map((cosplayer) => (
            <ProfileCard
              key={cosplayer.id}
              cosplayer={cosplayer}
              onFollow={handleFollowToggle}
            />
          ))}
        </div>
      </div>

      {/* 結果件数 */}
      <div className="text-center mt-8">
        <p className="text-gray-500">
          {filteredCosplayers.length} 人のコスプレイヤーを表示中
        </p>
      </div>
    </div>
  );
} 