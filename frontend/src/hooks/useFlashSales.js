import { useState, useEffect, useCallback, useRef } from 'react';
import { getCurrentActiveFlashSale } from '../services/flashSaleService';

export const useFlashSales = (refreshInterval = 60000) => {
  // Refresh every minute by default (60000ms = 1 minute)
  const [activeFlashSales, setActiveFlashSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const lastRefreshRef = useRef(Date.now());

  const fetchActiveFlashSales = useCallback(
    async (force = false) => {
      // Don't refresh if it's been less than refreshInterval since last refresh
      if (!force && Date.now() - lastRefreshRef.current < refreshInterval) {
        return;
      }

      try {
        setLoading(true);
        const response = await getCurrentActiveFlashSale();
        console.log('Flash Sale API Response:', response);

        if (response.success && response.data && response.data.length > 0) {
          console.log('Active Flash Sale Data:', response.data);

          // Filter out expired flash sales
          const now = new Date();
          const validFlashSales = response.data.filter(
            product => product.flashSaleInfo && new Date(product.flashSaleInfo.endDate) > now
          );

          // Convert to the format expected by getProductFlashSale
          const flashSalesMap = new Map();

          validFlashSales.forEach(product => {
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
          lastRefreshRef.current = Date.now();
        } else {
          // No active flash sales - this is normal, not an error
          setActiveFlashSales([]);
          lastRefreshRef.current = Date.now();
        }
      } catch (error) {
        console.error('Error fetching flash sales:', error);
        setActiveFlashSales([]);
      } finally {
        setLoading(false);
      }
    },
    [refreshInterval]
  );

  // Initial fetch and setup periodic refresh
  useEffect(() => {
    fetchActiveFlashSales(true); // Force initial fetch

    // Set up periodic refresh
    const refreshTimer = setInterval(() => {
      fetchActiveFlashSales();
    }, refreshInterval);

    // Cleanup
    return () => {
      clearInterval(refreshTimer);
    };
  }, [fetchActiveFlashSales, refreshInterval]);

  // Function to manually trigger a refresh
  const refreshFlashSales = useCallback(() => {
    return fetchActiveFlashSales(true);
  }, [fetchActiveFlashSales]);

  // Function to get flash sale info for a specific product
  const getProductFlashSale = useCallback(
    productId => {
      if (!productId) return null;

      // Check if any active flash sale contains this product
      for (const flashSale of activeFlashSales) {
        const productInfo = flashSale.products.find(p => p.productId === productId);

        if (productInfo) {
          // Verify the flash sale hasn't expired
          if (new Date(flashSale.endDate) > new Date()) {
            return {
              ...productInfo,
              flashSaleId: flashSale._id,
              flashSaleTitle: flashSale.title,
              endDate: flashSale.endDate,
            };
          }
        }
      }

      return null;
    },
    [activeFlashSales]
  );

  return {
    activeFlashSales,
    loading,
    getProductFlashSale,
    refreshFlashSales,
  };
};
