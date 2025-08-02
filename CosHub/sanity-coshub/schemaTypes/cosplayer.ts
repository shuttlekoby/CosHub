import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'cosplayer',
  title: 'コスプレイヤー',
  type: 'document',
  fields: [
    defineField({
      name: 'username',
      title: 'ユーザー名',
      type: 'string',
      validation: (Rule) => Rule.required(),
      description: 'Twitter/Instagram等のユーザー名（@なし）',
    }),
    defineField({
      name: 'displayName',
      title: '表示名',
      type: 'string',
      description: '実際の名前やニックネーム',
    }),
    defineField({
      name: 'profileImage',
      title: 'プロフィール画像',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'description',
      title: '説明',
      type: 'text',
      rows: 4,
      description: 'コスプレイヤーの説明・プロフィール',
    }),
    defineField({
      name: 'socialLinks',
      title: 'SNSリンク',
      type: 'object',
      fields: [
        {
          name: 'twitter',
          title: 'Twitter',
          type: 'url',
        },
        {
          name: 'instagram',
          title: 'Instagram',
          type: 'url',
        },
        {
          name: 'tiktok',
          title: 'TikTok',
          type: 'url',
        },
      ],
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
      name: 'isActive',
      title: 'アクティブ',
      type: 'boolean',
      initialValue: true,
      description: 'サイトに表示するかどうか',
    }),
    defineField({
      name: 'lastUpdated',
      title: '最終更新日',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'imageCount',
      title: '画像数',
      type: 'number',
      initialValue: 0,
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: 'displayName',
      subtitle: 'username',
      imageCount: 'imageCount',
      media: 'profileImage',
      isActive: 'isActive',
    },
    prepare(selection) {
      const {title, subtitle, imageCount, media, isActive} = selection
      const statusIcon = isActive ? '🟢' : '🔴'
      return {
        title: `${statusIcon} ${title || subtitle}`,
        subtitle: `@${subtitle} | ${imageCount}枚の画像`,
        media,
      }
    },
  },
})