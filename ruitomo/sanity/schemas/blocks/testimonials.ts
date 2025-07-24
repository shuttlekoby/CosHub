import { defineField, defineType } from "sanity";
import { MessageSquareQuote } from "lucide-react";

export default defineType({
  name: "testimonials",
  title: "Testimonials",
  type: "object",
  icon: MessageSquareQuote,
  fields: [
    defineField({
      name: "padding",
      type: "section-padding",
    }),
    defineField({
      name: "colorVariant",
      type: "color-variant",
      title: "Color Variant",
      description: "Select a background color variant",
    }),
    defineField({
      name: "sectionHeader",
      type: "section-header",
      title: "Section Header",
    }),
    defineField({
      name: "testimonials",
      type: "array",
      title: "Testimonials",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "quote",
              type: "text",
              title: "Quote",
              description: "The testimonial text",
              validation: (rule) => rule.required().error("Quote is required"),
            }),
            defineField({
              name: "author",
              type: "object",
              title: "Author",
              fields: [
                defineField({
                  name: "name",
                  type: "string",
                  title: "Name",
                  validation: (rule) => rule.required().error("Author name is required"),
                }),
                defineField({
                  name: "title",
                  type: "string",
                  title: "Job Title",
                }),
                defineField({
                  name: "company",
                  type: "string",
                  title: "Company",
                }),
                defineField({
                  name: "avatar",
                  type: "image",
                  title: "Avatar",
                  options: {
                    hotspot: true,
                  },
                  fields: [
                    {
                      name: "alt",
                      type: "string",
                      title: "Alternative text",
                    }
                  ]
                }),
              ],
            }),
            defineField({
              name: "rating",
              type: "number",
              title: "Rating",
              description: "Rating out of 5 stars",
              options: {
                list: [
                  { title: "1 star", value: 1 },
                  { title: "2 stars", value: 2 },
                  { title: "3 stars", value: 3 },
                  { title: "4 stars", value: 4 },
                  { title: "5 stars", value: 5 },
                ],
                layout: "radio",
                direction: "horizontal",
              },
              initialValue: 5,
            }),
          ],
          preview: {
            select: {
              title: "author.name",
              subtitle: "quote",
              media: "author.avatar",
            },
            prepare({ title, subtitle, media }) {
              return {
                title: title || "Testimonial",
                subtitle: subtitle ? `"${subtitle.substring(0, 60)}..."` : "No quote",
                media,
              };
            },
          },
        },
      ],
      validation: (rule) => rule.min(1).error("At least one testimonial is required"),
    }),
    defineField({
      name: "layout",
      type: "string",
      title: "Layout",
      options: {
        list: [
          { title: "Grid (3 columns)", value: "grid" },
          { title: "Carousel", value: "carousel" },
          { title: "Single Column", value: "single" },
        ],
        layout: "radio",
      },
      initialValue: "grid",
    }),
  ],
  preview: {
    select: {
      title: "sectionHeader.title",
      testimonialsCount: "testimonials",
    },
    prepare({ title, testimonialsCount }) {
      const count = testimonialsCount?.length || 0;
      return {
        title: "Testimonials",
        subtitle: title || `${count} testimonial${count !== 1 ? "s" : ""}`,
      };
    },
  },
}); 