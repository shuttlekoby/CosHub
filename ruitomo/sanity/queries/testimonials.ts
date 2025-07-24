import { groq } from "next-sanity";
import { sectionHeaderQuery } from "./section-header";

// @sanity-typegen-ignore
export const testimonialsQuery = groq`
  _type == "testimonials" => {
    _type,
    _key,
    padding,
    colorVariant,
    ${sectionHeaderQuery},
    layout,
    testimonials[]{
      quote,
      rating,
      author {
        name,
        title,
        company,
        avatar {
          ...,
          asset-> {
            _id,
            url,
            mimeType,
            metadata {
              lqip,
              dimensions {
                width,
                height
              }
            }
          },
          alt
        }
      }
    }
  }
`; 