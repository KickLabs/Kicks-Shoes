import { useState } from "react";
import { Row, Col, Image } from "antd";
import "./ProductImageGallery.css";

const ProductImageGallery = ({ images }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div>
      <Image.PreviewGroup items={images}>
        <Image
          src={images[activeIndex]}
          width="100%"
          height={500}
          style={{ objectFit: "cover", borderRadius: 16 }}
        />
      </Image.PreviewGroup>

      <Row gutter={[16, 16]} className="thumbnail-row">
        {images.map((img, index) => (
          <Col key={index}>
            <Image
              src={img}
              width={100}
              height={100}
              preview={false}
              onClick={() => setActiveIndex(index)}
              className={`thumbnail-img ${
                activeIndex === index ? "active" : ""
              }`}
              style={{
                borderRadius: 12,
                cursor: "pointer",
                border:
                  activeIndex === index
                    ? "2px solid #1677ff"
                    : "1px solid #ccc",
                objectFit: "cover"
              }}
            />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ProductImageGallery;
