import type { PandaDocConfig } from '@/lib/pandadoc/config';
import { getDocumentDetails, updateDocumentQuote } from '@/lib/pandadoc/client';

/** Fill the first quote line item (Quote builder templates — drives Collect "Auto" amount). */
export async function applyDocumentQuoteLineItem(
  config: PandaDocConfig,
  documentId: string,
  productName: string,
  price: number,
): Promise<boolean> {
  const details = await getDocumentDetails(config, documentId);
  const quote = details.pricing?.quotes?.[0];
  if (!quote?.id) return false;

  const section = quote.sections?.[0];
  const existingItem = section?.items?.[0];

  await updateDocumentQuote(config, documentId, quote.id, {
    sections: [
      {
        id: section?.id,
        items: [
          {
            id: existingItem?.id,
            sku: existingItem?.sku || '#',
            name: productName,
            description: existingItem?.description || '',
            qty: 1,
            price,
            options: {
              selected: true,
              qty_editable: false,
              optional: false,
            },
          },
        ],
      },
    ],
  });

  return true;
}
