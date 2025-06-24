import { useState, useEffect } from 'react';
import { Row, Col, Image } from 'antd';
import './ProductImageGallery.css';

const ProductImageGallery = ({ inventory, selectedColor }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [filteredImages, setFilteredImages] = useState([]);

  useEffect(() => {
    if (!inventory || !selectedColor) return;

    const match = inventory.find(item => item.color === selectedColor);
    if (match && Array.isArray(match.images)) {
      setFilteredImages(match.images);
      setActiveIndex(0);
    } else {
      setFilteredImages([]);
    }
  }, [inventory, selectedColor]);

  if (!filteredImages || filteredImages.length === 0) {
    return <div>Không có hình ảnh cho màu "{selectedColor}"</div>;
  }

  return (
    <div>
      <Image.PreviewGroup items={filteredImages}>
        <Image
          src={filteredImages[activeIndex]}
          width="100%"
          height={500}
          style={{ objectFit: 'cover', borderRadius: 16 }}
        />
      </Image.PreviewGroup>

      <Row gutter={[16, 16]} className="thumbnail-row">
        {filteredImages.map((img, index) => (
          <Col key={index}>
            <Image
              src={img}
              width={100}
              height={100}
              preview={false}
              onClick={() => setActiveIndex(index)}
              className={`thumbnail-img ${activeIndex === index ? 'active' : ''}`}
              style={{
                borderRadius: 12,
                cursor: 'pointer',
                border: activeIndex === index ? '2px solid #1677ff' : '1px solid #ccc',
                objectFit: 'cover',
              }}
            />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ProductImageGallery;
