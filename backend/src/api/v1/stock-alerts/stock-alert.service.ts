import { StockAlertModel } from './stock-alert.model.js';

export const notifyBackInStock = async (
  products: Array<{ _id: unknown; stock?: number; name?: string; title?: string; slug?: string }>,
) => {
  for (const product of products) {
    const stock = Number(product.stock || 0);
    if (stock <= 0) continue;
    const productId = String(product._id);
    const alerts = await StockAlertModel.find({ productId, active: true, notifiedAt: null }).limit(200);
    if (!alerts.length) continue;

    const title = product.name || product.title || 'Product';
    for (const alert of alerts) {
      console.log(`[stock-alert] Back in stock: ${title} → ${alert.email}`);
      alert.notifiedAt = new Date();
      alert.active = false;
      await alert.save();
    }
  }
};
