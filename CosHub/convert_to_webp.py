#!/usr/bin/env python3
"""
高画質WebP変換ツール
JPG/PNG画像を高画質WebP形式に変換します
"""

import os
import sys
from pathlib import Path
from PIL import Image
import argparse

def convert_to_webp(input_path, output_path=None, quality=95, keep_original=False):
    """
    画像をWebP形式に変換
    
    Args:
        input_path: 入力ファイルパス
        output_path: 出力ファイルパス（Noneの場合は自動生成）
        quality: WebP品質（0-100）
        keep_original: 元ファイルを保持するか
    """
    try:
        # 画像を開く
        with Image.open(input_path) as img:
            # RGBに変換（WebPはRGBAもサポートしますが、互換性のため）
            if img.mode not in ('RGB', 'RGBA'):
                img = img.convert('RGB')
            
            # 出力パスを決定
            if output_path is None:
                output_path = Path(input_path).with_suffix('.webp')
            
            # WebPとして保存（高画質設定）
            img.save(
                output_path, 
                'WEBP', 
                quality=quality,
                method=6,  # 最高圧縮効率
                lossless=False  # 高品質だが圧縮あり
            )
            
            # ファイルサイズ情報
            original_size = os.path.getsize(input_path)
            webp_size = os.path.getsize(output_path)
            reduction = (1 - webp_size / original_size) * 100
            
            print(f"✅ 変換完了: {Path(input_path).name}")
            print(f"   📁 出力: {output_path}")
            print(f"   📊 サイズ: {original_size//1024}KB → {webp_size//1024}KB ({reduction:.1f}% 削減)")
            
            # 元ファイルを削除
            if not keep_original:
                os.remove(input_path)
                print(f"   🗑  元ファイル削除: {Path(input_path).name}")
            
            return True
            
    except Exception as e:
        print(f"❌ エラー: {input_path} - {str(e)}")
        return False

def convert_directory(directory, quality=95, keep_original=False):
    """
    ディレクトリ内の全画像をWebPに変換
    """
    directory = Path(directory)
    if not directory.exists():
        print(f"❌ ディレクトリが見つかりません: {directory}")
        return
    
    # サポートされる拡張子
    supported_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.gif'}
    
    # 変換対象ファイルを検索
    image_files = []
    for ext in supported_extensions:
        image_files.extend(directory.rglob(f'*{ext}'))
        image_files.extend(directory.rglob(f'*{ext.upper()}'))
    
    if not image_files:
        print(f"❌ 変換対象の画像ファイルが見つかりません: {directory}")
        return
    
    print(f"🚀 {len(image_files)}個のファイルを変換開始...")
    print(f"📁 対象ディレクトリ: {directory}")
    print(f"🎯 品質設定: {quality}")
    print("-" * 50)
    
    success_count = 0
    for image_file in image_files:
        if convert_to_webp(image_file, quality=quality, keep_original=keep_original):
            success_count += 1
    
    print("-" * 50)
    print(f"✅ 変換完了: {success_count}/{len(image_files)} ファイル")

def main():
    parser = argparse.ArgumentParser(description='高画質WebP変換ツール')
    parser.add_argument('path', help='変換する画像ファイルまたはディレクトリ')
    parser.add_argument('-q', '--quality', type=int, default=95, 
                       help='WebP品質 (0-100, デフォルト: 95)')
    parser.add_argument('-k', '--keep', action='store_true', 
                       help='元ファイルを保持する')
    parser.add_argument('-o', '--output', help='出力ファイル名（単一ファイルの場合）')
    
    args = parser.parse_args()
    
    path = Path(args.path)
    
    if not path.exists():
        print(f"❌ パスが見つかりません: {path}")
        sys.exit(1)
    
    print("🎨 高画質WebP変換ツール")
    print("=" * 50)
    
    if path.is_file():
        # 単一ファイルの変換
        convert_to_webp(path, args.output, args.quality, args.keep)
    elif path.is_dir():
        # ディレクトリの一括変換
        convert_directory(path, args.quality, args.keep)
    else:
        print(f"❌ 無効なパス: {path}")
        sys.exit(1)

if __name__ == '__main__':
    main() 