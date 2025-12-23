import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'paymentSettings',
    title: 'Payment Settings',
    type: 'document',
    fields: [
        defineField({
            name: 'enabledMethods',
            title: 'Accepted Payment Methods',
            description: 'Select which payment logos to display at checkout.',
            type: 'array',
            of: [{ type: 'string' }],
            options: {
                list: [
                    { title: 'Visa', value: 'visa' },
                    { title: 'Mastercard', value: 'mastercard' },
                    { title: 'American Express', value: 'amex' },
                    { title: 'Discover', value: 'discover' },
                    { title: 'Apple Pay', value: 'applepay' },
                    { title: 'Google Pay', value: 'googlepay' },
                    { title: 'Venmo', value: 'venmo' },
                    { title: 'Store Gift Card', value: 'giftcard' },
                ],
                layout: 'grid',
            },
        }),
    ],
})