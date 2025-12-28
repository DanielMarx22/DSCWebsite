import { useState } from 'react';
import { Card, Button, Text, Stack, Flex, Box } from '@sanity/ui';
import { RefreshIcon } from '@sanity/icons';

export function SyncSquareWidget() {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSync = async () => {
        setIsLoading(true);
        setMessage('Syncing products... this may take a minute.');

        try {
            // We call the API route we created. 
            // Ensure you deployed the API route to Vercel first!
            // In local dev, use http://localhost:3000
            const baseUrl = window.location.origin;
            const res = await fetch(`${baseUrl}/api/sync-square?secret=my-secret-password`);
            const data = await res.json();

            if (data.success) {
                setMessage(`✅ Success! ${data.message}`);
            } else {
                setMessage(`❌ Error: ${data.message || data.error}`);
            }
        } catch (err) {
            setMessage('❌ Network Error: Could not reach sync API.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card padding={4} radius={2} shadow={1} tone="primary">
            <Stack space={4}>
                <Flex align="center" gap={2}>
                    <RefreshIcon style={{ fontSize: 24 }} />
                    <Text size={3} weight="bold">Square Integration</Text>
                </Flex>

                <Text size={2} muted>
                    Click below to fetch the latest products from Square and import them into Sanity.
                </Text>

                <Box>
                    <Button
                        fontSize={2}
                        icon={RefreshIcon}
                        text={isLoading ? 'Syncing...' : 'Sync Products Now'}
                        tone="primary"
                        onClick={handleSync}
                        disabled={isLoading}
                        padding={3}
                    />
                </Box>

                {message && (
                    <Text size={1} weight="medium" style={{ color: message.startsWith('✅') ? 'green' : 'red' }}>
                        {message}
                    </Text>
                )}
            </Stack>
        </Card>
    );
}