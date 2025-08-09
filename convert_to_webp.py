#!/usr/bin/env python3
"""
WebP変換スクリプト
JPGファイルをWebP形式に変換します
"""

import os
import sys
import argparse
import glob

def convert_to_webp(input_dir, quality=95):
    """
    指定されたディレクトリ内のJPGファイルをWebPに変換
    
    Args:
        input_dir (str): 変換対象ディレクトリ
        quality (int): WebP品質 (0-100)
    """
    if not os.path.exists(input_dir):
        print(f"エラー: ディレクトリが見つかりません: {input_dir}")
        return False
    
    # JPGファイルを検索
    jpg_files = glob.glob(os.path.join(input_dir, "*.jpg"))
    jpeg_files = glob.glob(os.path.join(input_dir, "*.jpeg"))
    all_files = jpg_files + jpeg_files
    
    if not all_files:
        print(f"変換対象のJPG/JPEGファイルが見つかりません: {input_dir}")
        return True  # エラーではないが、変換するファイルがない
    
    converted_count = 0
    error_count = 0
    
    for jpg_file in all_files:
        try:
            # WebPファイル名を生成
            base_name = os.path.splitext(jpg_file)[0]
            webp_file = f"{base_name}.webp"
            
            # 既にWebPファイルが存在する場合はスキップ
            if os.path.exists(webp_file):
                print(f"スキップ (既存): {os.path.basename(webp_file)}")
                continue
            
            # PILが利用できない場合は変換をスキップ
            try:
                from PIL import Image
            except ImportError:
                print(f"PIL/Pillowが利用できません。WebP変換をスキップ: {os.path.basename(jpg_file)}")
                return True  # エラーとして扱わず、変換なしで続行
            
            # 画像を開いてWebPに変換
            with Image.open(jpg_file) as img:
                # RGBAモードの場合はRGBに変換
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                
                # WebPで保存
                img.save(webp_file, 'WebP', quality=quality, optimize=True)
                
                print(f"変換完了: {os.path.basename(jpg_file)} -> {os.path.basename(webp_file)}")
                converted_count += 1
                
        except Exception as e:
            print(f"変換エラー: {os.path.basename(jpg_file)} - {str(e)}")
            # WebP変換エラーは致命的エラーとしては扱わない
            continue
    
    print(f"\n変換結果: {converted_count}個成功, {error_count}個エラー")
    return True  # WebP変換の失敗はダウンロード全体の失敗とはしない

def main():
    parser = argparse.ArgumentParser(description='JPGファイルをWebPに変換')
    parser.add_argument('input_dir', help='変換対象ディレクトリ')
    parser.add_argument('-q', '--quality', type=int, default=95, 
                       help='WebP品質 (0-100, デフォルト: 95)')
    
    args = parser.parse_args()
    
    success = convert_to_webp(args.input_dir, args.quality)
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main() 