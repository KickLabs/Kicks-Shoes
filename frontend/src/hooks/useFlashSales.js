import { useState, useEffect } from 'react';
import { getCurrentActiveFlashSale } from '../services/flashSaleService';

export const useFlashSales = () => {
  const [activeFlashSales, setActiveFlashSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveFlashSales = async () => {
      try {
        const response = await getCurrentActiveFlashSale();
        console.log('Flash Sale API Response:', response);
        if (response.success && response.data && response.data.length > 0) {
          console.log('Active Flash Sale Data:', response.data);
          // New API returns array of products with flashSaleInfo
          // Convert to the format expected by getProductFlashSale
          const flashSalesMap = new Map();

          response.data.forEach(product => {
            if (product.flashSaleInfo) {
              const flashSaleId = product.flashSaleInfo.flashSaleId;

              if (!flashSalesMap.has(flashSaleId)) {
                flashSalesMap.set(flashSaleId, {
                  _id: flashSaleId,
                  title: product.flashSaleInfo.flashSaleTitle,
                  status: 'active',
                  endDate: product.flashSaleInfo.endDate,
                  products: [],
                });
              }

              flashSalesMap.get(flashSaleId).products.push({
                productId: product._id,
                discountPercent: product.flashSaleInfo.discountPercent,
                flashPrice: product.flashSaleInfo.flashPrice,
              });
            }
          });

          const flashSales = Array.from(flashSalesMap.values());
          setActiveFlashSales(flashSales);
        } else {
          console.log('No active flash sale data, using test data');
          // Test data for development
          const now = new Date();
          const endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
          const testFlashSale = {
            _id: 'test-flash-sale',
            title: 'Test Flash Sale',
            status: 'active',
            endDate: endDate.toISOString(),
            products: [
              {
                productId: '68592c166b62c151554c73d6',
                discountPercent: 30,
                flashPrice: 665000,
              },
            ],
          };
          setActiveFlashSales([testFlashSale]);
        }
      } catch (error) {
        console.log('Error fetching flash sales, using test data:', error);
        // Test data for development
        const now = new Date();
        const endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
        const testFlashSale = {
          _id: 'test-flash-sale',
          title: 'Test Flash Sale',
          status: 'active',
          endDate: endDate.toISOString(),
          products: [
            {
              productId: '68592c166b62c151554c73d6',
              discountPercent: 30,
              flashPrice: 665000,
            },
          ],
        };
        setActiveFlashSales([testFlashSale]);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveFlashSales();
  }, []);

  const getProductFlashSale = productId => {
    const productFlashSales = [];

    // Tìm tất cả flash sale có chứa sản phẩm này
    for (const flashSale of activeFlashSales) {
      if (!flashSale.products) continue;

      const flashSaleProduct = flashSale.products.find(p => {
        // Handle both populated and non-populated productId
        const pId = typeof p.productId === 'object' ? p.productId._id : p.productId;
        return pId === productId;
      });

      if (flashSaleProduct) {
        productFlashSales.push({
          flashPrice: flashSaleProduct.flashPrice,
          discountPercent: flashSaleProduct.discountPercent,
          endDate: flashSale.endDate,
          flashSaleId: flashSale._id,
          flashSaleTitle: flashSale.title,
        });
      }
    }

    if (productFlashSales.length === 0) {
      console.log('No flash sale found for product:', productId);
      return null;
    }

    // Nếu có nhiều flash sale, lấy giá rẻ nhất
    if (productFlashSales.length > 1) {
      console.log('Multiple flash sales found for product:', productId, productFlashSales);
      const bestDeal = productFlashSales.reduce((best, current) => {
        return current.flashPrice < best.flashPrice ? current : best;
      });
      console.log('Selected best deal:', bestDeal);
      return bestDeal;
    }

    console.log('Found flash sale for product:', productId, productFlashSales[0]);
    return productFlashSales[0];
  };

  return {
    activeFlashSales,
    loading,
    getProductFlashSale,
  };
};
