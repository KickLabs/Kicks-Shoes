import { Col, Row, Spin, Alert } from 'antd';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './ProductDetailPage.css';
import { RecommendSection } from '../../cart/components/RecommendSection';
import ProductImageGallery from '../components/ProductImageGallery';
import ProductInfoSection from '../components/ProductInfoSection';
import CommentSection from '../components/CommentSection';
import axios from 'axios';

const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`/api/products/public/${id}`);
        setProduct(response.data.data);
      } catch (err) {
        setError(err?.response?.data?.message || 'Không thể tải sản phẩm');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product?.variants?.colors?.length) {
      setSelectedColor(product.variants.colors[0]);
    }
  }, [product]);

  if (loading) return <Spin size="large" />;
  if (error) return <Alert type="error" message={error} />;
  if (!product) return <div>Product is not exist</div>;

  return (
    <div className="product-detail-container">
      <Row gutter={[32, 32]}>
        <Col span={14}>
          <ProductImageGallery inventory={product.inventory} selectedColor={selectedColor} />
        </Col>
        <Col span={10}>
          <ProductInfoSection
            product={product}
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
          />
        </Col>
      </Row>
      <RecommendSection />
      <CommentSection />
    </div>
  );
};

export default ProductDetailPage;
