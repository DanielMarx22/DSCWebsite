import { defineField, defineType } from "sanity"

export default defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
    
    // --- NEW FILTERING LOGIC START ---
    defineField({
      name: 'category',
      title: 'Main Category',
      type: 'string',
      description: 'The high-level bucket this item belongs to.',
      options: {
        list: [
            { title: 'Fish', value: 'fish' },
            { title: 'Corals', value: 'corals' },
            { title: 'Inverts', value: 'inverts' },
            { title: 'Supplies', value: 'supplies' },
        ],
        layout: 'radio', 
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tags',
      title: 'Tags / Keywords',
      description: 'Type a tag and hit Enter (e.g. "Tang", "LPS", "Reef Safe", "Algae Eater"). These will become filters on the website.',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    }),
    // --- NEW FILTERING LOGIC END ---

    defineField({
      name: 'description',
      title: 'Description',
      type: 'blockContent', // Or 'text' if you aren't using rich text
    }),
    
    // --- STRIPE / SQUARE INTEGRATION FIELDS ---
    // We keep these flexible so they work for both Stripe (now) and Square (later)
    defineField({
      name: 'sku',
      title: 'SKU / Stripe ID',
      description: 'The Product ID from Stripe or Square',
      type: 'string',
    }),
    defineField({
        name: 'price',
        title: 'Price (Fallback)',
        description: 'Used for sorting. Real price comes from Stripe/Square.',
        type: 'number',
    }),
    defineField({
        name: 'inventory',
        title: 'Inventory Count (Sanity Fallback)',
        description: 'For manual control if needed. Real stock checks usually happen via API.',
        type: 'number',
        initialValue: 0
    }),
  ],
})