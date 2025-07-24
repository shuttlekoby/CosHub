#!/usr/bin/env python3

def create_env_file():
    # 環境変数を辞書として定義（一行で記述）
    env_vars = {
        "NEXT_PUBLIC_SANITY_PROJECT_ID": "xn1y8koq",
        "NEXT_PUBLIC_SANITY_DATASET": "production",
        "NEXT_PUBLIC_SANITY_API_VERSION": "2024-05-10",
        "SANITY_API_READ_TOKEN": "skJAalBkGtw3kYDtjV84I6l3Xi5mmPD7ZbVDwMofWNGiARg7DpeEPMPiholwzoFxxlkZXTqqd0xr1SY2Rk9OMSNz3ooibDwzZxFptY7DTIMkneeUjuDgMNW2XpGJ8qAD7leHBTYLtALDrcNDpwviuYD52fkmoluQD4AMZh3KX2oUg9PFZsdh",
        "ANTHROPIC_API_KEY": "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",
        "REPLICATE_API_TOKEN": "r8_CmBQIGM5I1fz2OVM7Rgi1k4WrBfmMJY2rCxvo"
    }
    
    with open('.env.local', 'w') as f:
        for key, value in env_vars.items():
            f.write(f"{key}={value}\n")
    
    print("✅ 環境変数ファイルが正常に作成されました")
    print(f"✅ {len(env_vars)}個の環境変数が設定されました")

if __name__ == "__main__":
    create_env_file()
