import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const authFilePath = path.join(process.cwd(), '.auth', 'twitter-cookies.json')
    
    try {
      const authData = await fs.readFile(authFilePath, 'utf-8')
      const auth = JSON.parse(authData)
      
      // 基本的な検証（トークンが存在するかどうか）
      const isValid = auth.authToken && auth.ct0Token && 
                     auth.authToken.trim().length > 10 && 
                     auth.ct0Token.trim().length > 10
      
      return NextResponse.json({
        isValid,
        hasAuth: true,
        message: isValid ? '認証情報が設定されています' : '認証情報が無効です'
      })
    } catch (fileError) {
      // ファイルが存在しない場合
      return NextResponse.json({
        isValid: false,
        hasAuth: false,
        message: '認証情報が設定されていません'
      })
    }
  } catch (error) {
    console.error('Auth status check error:', error)
    return NextResponse.json(
      { 
        isValid: false,
        hasAuth: false,
        error: '認証状態の確認に失敗しました' 
      },
      { status: 500 }
    )
  }
} 