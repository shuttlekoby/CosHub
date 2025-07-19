import { defineField, defineType } from "sanity";
import { Package } from "lucide-react";
import { orderRankField } from "@sanity/orderable-document-list";

export default defineType({
  name: "product",
  type: "document",
  title: "Product",
  icon: Package,
  groups: [
    {
      name: "content",
      title: "Content",
    },
    {
      name: "details",
      title: "Details",
    },
    {
      name: "seo",
      title: "SEO",
    },
    {
      name: "settings",
      title: "Settings",
    },
  ],
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Product Name",
      group: "content",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "settings",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      group: "content",
    }),
    defineField({
      name: "content",
      title: "Content",
      type: "blockContent",
      group: "content",
    }),
    defineField({
      name: "image",
      title: "Product Image",
      type: "image",
      group: "content",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "number",
      group: "details",
    }),
    defineField({
      name: "currency",
      title: "Currency",
      type: "string",
      group: "details",
      options: {
        list: [
          { title: "Japanese Yen", value: "JPY" },
          { title: "US Dollar", value: "USD" },
          { title: "Euro", value: "EUR" },
        ],
      },
      initialValue: "JPY",
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "category" }],
      group: "details",
    }),
    defineField({
      name: "inStock",
      title: "In Stock",
      type: "boolean",
      group: "details",
      initialValue: true,
    }),
    defineField({
      name: "featured",
      title: "Featured Product",
      type: "boolean",
      group: "settings",
      initialValue: false,
    }),
    defineField({
      name: "meta_title",
      title: "Meta Title",
      type: "string",
      group: "seo",
    }),
    defineField({
      name: "meta_description",
      title: "Meta Description",
      type: "text",
      group: "seo",
    }),
    defineField({
      name: "ogImage",
      title: "Open Graph Image - [1200x630]",
      type: "image",
      group: "seo",
    }),
    orderRankField({ type: "product" }),
  ],
  preview: {
    select: {
      title: "title",
      media: "image",
      price: "price",
      currency: "currency",
    },
    prepare({ title, media, price, currency }) {
      return {
        title,
        subtitle: price ? `${price} ${currency}` : "Price not set",
        media,
      };
    },
  },
}); 