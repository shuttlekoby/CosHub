#!/usr/bin/env python3
"""
Web scraping script for collecting articles
"""

import json
import sys
from typing import Dict, List, Optional
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from fake_useragent import UserAgent


class WebScraper:
    def __init__(self):
        self.ua = UserAgent()
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': self.ua.random
        })

    def scrape_article(self, url: str) -> Optional[Dict]:
        """単一記事をスクレイピング"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 基本的な記事情報を抽出
            article = {
                'url': url,
                'title': self._extract_title(soup),
                'content': self._extract_content(soup),
                'published_date': self._extract_date(soup),
                'image_url': self._extract_image(soup, url),
                'scraped_at': None  # データベースで設定
            }
            
            return article
            
        except Exception as e:
            print(f"Error scraping {url}: {str(e)}", file=sys.stderr)
            return None

    def _extract_title(self, soup: BeautifulSoup) -> str:
        """タイトルを抽出"""
        selectors = [
            'h1',
            '.title',
            '.post-title',
            '[class*="title"]',
            'title'
        ]
        
        for selector in selectors:
            element = soup.select_one(selector)
            if element and element.get_text(strip=True):
                return element.get_text(strip=True)
        
        return "タイトルなし"

    def _extract_content(self, soup: BeautifulSoup) -> str:
        """コンテンツを抽出"""
        selectors = [
            '.content',
            '.post-content',
            '.article-body',
            '.entry-content',
            'article p',
            'main p'
        ]
        
        content_parts = []
        for selector in selectors:
            elements = soup.select(selector)
            if elements:
                for elem in elements:
                    text = elem.get_text(strip=True)
                    if text and len(text) > 20:  # 短すぎるテキストは除外
                        content_parts.append(text)
                break
        
        return ' '.join(content_parts) if content_parts else "コンテンツなし"

    def _extract_date(self, soup: BeautifulSoup) -> Optional[str]:
        """投稿日を抽出"""
        date_selectors = [
            'time[datetime]',
            '.date',
            '.published',
            '[class*="date"]'
        ]
        
        for selector in date_selectors:
            element = soup.select_one(selector)
            if element:
                # datetime属性がある場合
                if element.get('datetime'):
                    return element.get('datetime')
                # テキストから日付を取得
                date_text = element.get_text(strip=True)
                if date_text:
                    return date_text
        
        return None

    def _extract_image(self, soup: BeautifulSoup, base_url: str) -> Optional[str]:
        """メイン画像のURLを抽出"""
        img_selectors = [
            'meta[property="og:image"]',
            '.featured-image img',
            '.post-image img',
            'article img',
            'main img'
        ]
        
        for selector in img_selectors:
            element = soup.select_one(selector)
            if element:
                # meta tagの場合
                if element.name == 'meta':
                    img_url = element.get('content')
                else:
                    img_url = element.get('src') or element.get('data-src')
                
                if img_url:
                    # 相対URLを絶対URLに変換
                    return urljoin(base_url, img_url)
        
        return None


def main():
    """メイン関数"""
    if len(sys.argv) < 2:
        print("Usage: python scraper.py <url>", file=sys.stderr)
        sys.exit(1)
    
    url = sys.argv[1]
    scraper = WebScraper()
    
    article = scraper.scrape_article(url)
    if article:
        print(json.dumps(article, ensure_ascii=False, indent=2))
    else:
        sys.exit(1)


if __name__ == "__main__":
    main() 