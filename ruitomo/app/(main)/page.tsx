import Blocks from "@/components/blocks";
import { fetchSanityPageBySlug } from "@/sanity/lib/fetch";
import { generatePageMetadata } from "@/sanity/lib/metadata";
import MissingSanityPage from "@/components/ui/missing-sanity-page";
import { About3 } from "@/components/about3";
import { Hero45 } from "@/components/hero45";

export async function generateMetadata() {
  try {
    const page = await fetchSanityPageBySlug({ slug: "index" });
    return generatePageMetadata({ page, slug: "index" });
  } catch (error) {
    return {
      title: "Ruitomo - Schema UI Starter",
      description: "Schema UI Starter with Sanity CMS",
    };
  }
}

export default async function IndexPage() {
  try {
    const page = await fetchSanityPageBySlug({ slug: "index" });

    if (!page) {
      // 応急処置: 基本的なホームページを表示
      return (
        <>
          <Hero45 heading="Welcome to Ruitomo" />
          <About3 />
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
            <div className="container mx-auto px-4 py-16">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-6">
                  Welcome to Ruitomo
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  Schema UI Starter with Sanity CMS
                </p>
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
                  <h2 className="text-2xl font-semibold mb-4">🎉 デプロイ成功！</h2>
                  <p className="text-gray-700 mb-4">
                    Sanity CMSとの連携を設定するには、以下にアクセスしてください：
                  </p>
                  <a 
                    href="/studio" 
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Sanity Studio にアクセス
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <Hero45 heading="Welcome to Ruitomo" />
        <About3 />
        <Blocks blocks={page?.blocks ?? []} />
      </>
    );
  } catch (error) {
    // エラーが発生した場合の応急処置
    return (
      <>
        <Hero45 heading="Welcome to Ruitomo" />
        <About3 />
        <div className="min-h-screen bg-red-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-800 mb-4">接続エラー</h1>
            <p className="text-red-600 mb-4">Sanityとの接続に問題があります。</p>
            <a 
              href="/studio" 
              className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              Sanity Studio を確認
            </a>
          </div>
        </div>
      </>
    );
  }
}
