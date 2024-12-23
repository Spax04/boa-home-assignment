import {
  reactExtension,
  BlockStack,
  Checkbox,
  Button,
  Text,
  Banner,
  useCartLines,
  useApi,
  useStorage,
} from '@shopify/ui-extensions-react/checkout';
import { useState } from 'react';

export default reactExtension('purchase.checkout.block.render', () => <Extension />);

function Extension() {
  const cartLines = useCartLines();
  const { sessionToken } = useApi();
  const storage = useStorage();

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' |  'critical', content: string} | null>(null);

  const handleCheckboxChange = (variantId: string) => {
    setSelectedItems(prev => {
      if (prev.includes(variantId)) {
        return prev.filter(id => id !== variantId);
      }
      return [...prev, variantId];
    });
  };

  const handleSave = async () => {
    if (selectedItems.length === 0) return;
    
    setIsSaving(true);
    setMessage(null);

    try {
      const token = await sessionToken.get();
      if (!token) {
        throw new Error('Authentication failed');
      }
      const selectedProducts = cartLines
      .filter(line => selectedItems.includes(line.merchandise.id))
      .map(line => {
        const numericId = line.merchandise.id.match(/\/(\d+)$/)?.[1]; 
        return {
          id: Number(numericId),
          quantity: line.quantity,
        };
      });

      await storage.write('savedCart', JSON.stringify({
        items: selectedProducts
      }));

      try {
        const timestamp = Math.floor(Date.now() / 1000).toString();

        console.log(token);

        const appProxyUrl = new URL('/api/app_proxy/save-cart', 'https://acm-quarter-plasma-tuesday.trycloudflare.com');

        const response = await fetch(appProxyUrl.toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Access-Control-Allow-Origin': '*',
          },
          credentials: 'include',
          body: JSON.stringify({
            items: selectedProducts,
            timestamp,
          }),
        });

        const responseText = await response.text();

        if (!response.ok) {
          let errorMessage = 'Failed to save to backend';
          if(response.status === 401){
            setMessage({
              type: 'critical',
              content: 'Unauthorized. Please log in to save items.'
            });
          }
          try {
            const errorData = responseText ? JSON.parse(responseText) : null;
            errorMessage = errorData?.message || errorMessage;
          } catch (e) {
            console.error('Error parsing response:', e);
          }
          throw new Error(errorMessage);
        }

        setMessage({
          type: 'success',
          content: `Saved ${selectedProducts.length} items for later`
        });
      } catch (backendError) {
        console.error('Backend save error:', backendError);
        
      }

      setSelectedItems([]);
    } catch (error) {
      console.error('Save cart error:', error);
      setMessage({
        type: 'critical',
        content: error instanceof Error ? error.message : 'Unable to save items. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (cartLines.length === 0) {
    return (
      <BlockStack spacing="loose" padding="base">
        <Text>Add items to your cart to save them for later.</Text>
      </BlockStack>
    );
  }

  return (
    <BlockStack border="base" padding="base" spacing="loose">
      <Text size="medium" emphasis="bold">Save items for later</Text>
      
      {message && (
        <Banner status={message.type}>
          {message.content}
        </Banner>
      )}
      
      <BlockStack spacing="tight">
        {cartLines.map((line) => (
          <Checkbox
            key={line.merchandise.id}
            name={`save-${line.merchandise.id}`}
            checked={selectedItems.includes(line.merchandise.id)}
            onChange={() => handleCheckboxChange(line.merchandise.id)}
            disabled={isSaving}
          >
            <Text>{line.merchandise.title}</Text>
          </Checkbox>
        ))}
      </BlockStack>

      <Button
        onPress={handleSave}
        disabled={isSaving || selectedItems.length === 0}
      >
        {isSaving ? 'Saving...' : `Save ${selectedItems.length} Selected Items`}
      </Button>
    </BlockStack>
  );
}