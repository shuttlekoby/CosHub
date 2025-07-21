"use client";

import React from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";

export default function TestPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">HeroUI テストページ</h1>
      
      <Card className="max-w-[340px]">
        <CardHeader className="justify-between">
          <div className="flex gap-5">
            <Avatar
              isBordered
              radius="full"
              size="md"
              src="https://via.placeholder.com/100x100?text=M"
            />
            <div className="flex flex-col gap-1 items-start justify-center">
              <h4 className="text-small font-semibold leading-none text-default-600">みなも</h4>
              <h5 className="text-small tracking-tight text-default-400">@M_I_N_A_M_O_</h5>
            </div>
          </div>
          <Button
            color="primary"
            radius="full"
            size="sm"
            variant="solid"
          >
            フォロー
          </Button>
        </CardHeader>
        <CardBody className="px-3 py-0 text-small text-default-400">
          <p>コスプレイヤー・グラビアアイドル 🌸 オリジナル衣装多数 ✨ 撮影依頼DM💕</p>
          <span className="pt-2">
            #コスプレ #グラビア
            <span aria-label="emoji" className="py-2 ml-2" role="img">
              🌸
            </span>
          </span>
        </CardBody>
        <CardFooter className="gap-3">
          <div className="flex gap-1">
            <p className="font-semibold text-default-400 text-small">892</p>
            <p className="text-default-400 text-small">フォロー中</p>
          </div>
          <div className="flex gap-1">
            <p className="font-semibold text-default-400 text-small">125K</p>
            <p className="text-default-400 text-small">フォロワー</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 