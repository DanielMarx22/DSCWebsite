import { defineField, defineType } from 'sanity'

export const subscriber = defineType({
    name: 'subscriber',
    title: 'Newsletter Subscribers',
    type: 'document',
    fields: [
        defineField({
            name: 'email',
            title: 'Email Address',
            type: 'string',
            validation: (Rule) => Rule.required().email(),
        }),
        defineField({
            name: 'joinedAt',
            title: 'Joined At',
            type: 'datetime',
            initialValue: () => new Date().toISOString(),
        }),
    ],
    preview: {
        select: {
            title: 'email',
            subtitle: 'joinedAt',
        },
    },
})