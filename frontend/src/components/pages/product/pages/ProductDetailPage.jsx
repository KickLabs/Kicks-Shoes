import { Col, Row } from "antd";
import { useParams } from "react-router-dom";
import { products } from "../../../../data/mockData";
import "./ProductDetailPage.css";
import { RecommendSection } from "../../cart/components/RecommendSection";
import ProductImageGallery from "../components/ProductImageGallery";
import ProductInfoSection from "../components/ProductInfoSection";

const ProductDetailPage = () => {
  const { id } = useParams();
  const product = products.find((p) => p.id === parseInt(id));

  if (!product) return <div>Product not found</div>;

  return (
    <>
      <div className="product-detail-container">
        <Row gutter={[32, 32]}>
          <Col span={14}>
            <ProductImageGallery images={product.images} />
          </Col>
          <Col span={10}>
            <ProductInfoSection product={product} />
          </Col>
        </Row>
        <RecommendSection />
      </div>
    </>
  );
};

export default ProductDetailPage;
