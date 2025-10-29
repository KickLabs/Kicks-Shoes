import { useState, useEffect } from 'react';
import { Row, Col, Image } from 'antd';
import './ProductImageGallery.css';

const ProductImageGallery = ({ colorOptions, selectedColor }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [filteredImages, setFilteredImages] = useState([]);

  useEffect(() => {
    if (!colorOptions || !selectedColor) return;

    const match = colorOptions.find(item => item.color === selectedColor);
    if (match && Array.isArray(match.images)) {
      setFilteredImages(match.images);
      setActiveIndex(0);
    } else {
      setFilteredImages([]);
    }
  }, [colorOptions, selectedColor]);

  if (!filteredImages || filteredImages.length === 0) {
    // Tìm mainImage của sản phẩm làm ảnh dự phòng (nếu có)
    const fallbackImage =
      colorOptions && colorOptions.length > 0 && colorOptions[0].images.length > 0
        ? colorOptions[0].images[0]
        : null;

    if (fallbackImage) {
      return (
        <Image
          src={fallbackImage}
          width="100%"
          height={500}
          style={{ objectFit: 'cover', borderRadius: 16 }}
        />
      );
    }
    return <div>Không có hình ảnh cho sản phẩm này.</div>;
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
