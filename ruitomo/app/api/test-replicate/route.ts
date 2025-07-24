import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

export async function GET(request: NextRequest) {
  if (!REPLICATE_API_TOKEN) {
    return NextResponse.json({ 
      success: false, 
      error: "REPLICATE_API_TOKEN not found in environment variables" 
    }, { status: 500 });
  }

  const replicate = new Replicate({
    auth: REPLICATE_API_TOKEN,
  });

  try {
    console.log("Testing Replicate API connection...");
    console.log("API Token exists:", !!REPLICATE_API_TOKEN);
    console.log("Token length:", REPLICATE_API_TOKEN.length);
    
    // 簡単なテスト画像生成を試行
    const output = await replicate.run(
      "ideogram-ai/ideogram-v3-quality",
      {
        input: {
          prompt: "a simple red circle on white background",
          width: 1024,
          height: 768,
          style_type: "Auto",
          magic_prompt_option: "On",
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Replicate API is working correctly",
      hasToken: !!REPLICATE_API_TOKEN,
      tokenLength: REPLICATE_API_TOKEN.length,
      testResult: Array.isArray(output) ? output[0] : output,
    });

  } catch (error) {
    console.error("Replicate API test failed:", error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      hasToken: !!REPLICATE_API_TOKEN,
      tokenLength: REPLICATE_API_TOKEN.length,
      errorDetails: {
        hasInsufficientCredit: errorMessage.includes('Insufficient credit'),
        has402: errorMessage.includes('402'),
        hasPaymentRequired: errorMessage.includes('Payment Required'),
        isRateLimit: errorMessage.includes('rate limit'),
      }
    }, { status: 500 });
  }
} 