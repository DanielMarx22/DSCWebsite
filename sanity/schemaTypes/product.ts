import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Product Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'Price (USD)',
      type: 'number',
    }),
    defineField({
      name: 'inventory',
      title: 'Inventory Count',
      type: 'number',
      initialValue: 0,
    }),
    // 👇 THIS IS THE ARRAY WE FIXED EARLIER
    defineField({
      name: 'images',
      title: 'Product Images',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Fish', value: 'fish' },
          { title: 'Corals', value: 'corals' },
          { title: 'Inverts', value: 'inverts' },
          { title: 'Supplies', value: 'supplies' },
        ],
      },
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'short_description',
      title: 'Short Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'description',
      title: 'Full Description', 
      type: 'array', 
      of: [{ type: 'block' }] 
    }),
    defineField({
      name: 'stripeId',
      title: 'Stripe ID (Legacy)', 
      type: 'string',
      hidden: true, 
    }),

    // 2. Hide the old Single Image (Junk data, but easier to hide than delete)
    defineField({
      name: 'image', 
      title: 'Legacy Image',
      type: 'image',
      hidden: true, 
    }),
  ],

  preview: {
    select: {
      title: 'title',
      // 👇 CHANGE 1: Grab the entire array, not just the first item
      images: 'images', 
      price: 'price',
    },
    prepare(selection) {
      const { title, images, price } = selection;
      return {
        title,
        subtitle: price ? `$${price}` : 'Price not set',
        // 👇 CHANGE 2: Manually check if the list exists and pick the first one
        media: images && images[0] ? images[0] : null,
      };
    },
  },
})