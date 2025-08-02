import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'CosHub 管理画面',

  projectId: 'ayxenmsy',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .id('root')
          .title('コンテンツ管理')
          .items([
            S.listItem()
              .id('cosplayers')
              .title('🎭 コスプレイヤー')
              .child(
                S.documentTypeList('cosplayer')
                  .title('コスプレイヤー一覧')
                  .filter('_type == "cosplayer"')
                  .defaultOrdering([{field: 'lastUpdated', direction: 'desc'}])
              ),
            S.listItem()
              .id('cosplayer-images')
              .title('📸 コスプレ画像')
              .child(
                S.documentTypeList('cosplayerImage')
                  .title('画像一覧')
                  .filter('_type == "cosplayerImage"')
                  .defaultOrdering([{field: 'uploadedAt', direction: 'desc'}])
              ),
            S.divider(),
            S.listItem()
              .id('featured-images')
              .title('⭐ 注目画像')
              .child(
                S.documentTypeList('cosplayerImage')
                  .title('注目画像一覧')
                  .filter('_type == "cosplayerImage" && isFeatured == true')
                  .defaultOrdering([{field: 'uploadedAt', direction: 'desc'}])
              ),
            S.listItem()
              .id('unpublished-images')
              .title('🔄 非公開画像')
              .child(
                S.documentTypeList('cosplayerImage')
                  .title('非公開画像一覧')
                  .filter('_type == "cosplayerImage" && isPublished == false')
                  .defaultOrdering([{field: 'uploadedAt', direction: 'desc'}])
              ),
          ])
    }),
    visionTool({
      title: 'GROQ クエリエディタ',
    }),
  ],

  schema: {
    types: schemaTypes,
  },
})
