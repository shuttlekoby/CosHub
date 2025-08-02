import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'cosplayerImage',
  title: 'コスプレ画像',
  type: 'document',
  fields: [
    defineField({
      name: 'cosplayer',
      title: 'コスプレイヤー',
      type: 'reference',
      to: [{type: 'cosplayer'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'タイトル',
      type: 'string',
      description: '画像の説明やキャラクター名',
    }),
    defineField({
      name: 'imageAsset',
      title: '画像',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'character',
      title: 'キャラクター',
      type: 'string',
      description: 'コスプレしているキャラクター名',
    }),
    defineField({
      name: 'series',
      title: '作品名',
      type: 'string',
      description: 'アニメ・ゲーム・漫画の作品名',
    }),
    defineField({
      name: 'tags',
      title: 'タグ',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'isPublished',
      title: '公開',
      type: 'boolean',
      initialValue: true,
      description: 'サイトに表示するかどうか',
    }),
    defineField({
      name: 'isFeatured',
      title: '注目画像',
      type: 'boolean',
      initialValue: false,
      description: 'トップページやギャラリーで強調表示',
    }),
    defineField({
      name: 'uploadedAt',
      title: 'アップロード日時',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'originalFilename',
      title: '元ファイル名',
      type: 'string',
    }),
    defineField({
      name: 'sourceUrl',
      title: '元URL',
      type: 'url',
      description: 'Twitter、Instagram等の元投稿URL',
    }),
    defineField({
      name: 'metadata',
      title: 'メタデータ',
      type: 'object',
      fields: [
        defineField({
          name: 'width',
          title: '横幅',
          type: 'number',
        }),
        defineField({
          name: 'height',
          title: '縦幅',
          type: 'number',
        }),
        defineField({
          name: 'format',
          title: 'フォーマット',
          type: 'string',
        }),
        defineField({
          name: 'size',
          title: 'ファイルサイズ (bytes)',
          type: 'number',
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      character: 'character',
      cosplayer: 'cosplayer.displayName',
      cosplayerUsername: 'cosplayer.username',
      media: 'imageAsset',
      isPublished: 'isPublished',
      isFeatured: 'isFeatured',
    },
    prepare(selection) {
      const {title, character, cosplayer, cosplayerUsername, media, isPublished, isFeatured} = selection
      const statusIcon = isPublished ? (isFeatured ? '⭐' : '🟢') : '🔴'
      const displayTitle = title || character || 'Untitled'
      const displaySubtitle = cosplayer || cosplayerUsername || 'Unknown'
      
      return {
        title: `${statusIcon} ${displayTitle}`,
        subtitle: `by ${displaySubtitle}`,
        media,
      }
    },
  },
})