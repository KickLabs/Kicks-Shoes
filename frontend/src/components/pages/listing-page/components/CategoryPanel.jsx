// import { Checkbox } from "antd";

// const CategoryPanel = ({ categories }) => (
//   <Checkbox.Group style={{ display: "flex", flexDirection: "column" }}>
//     {categories.map((cat) => (
//       <Checkbox key={cat} value={cat}>
//         {cat}
//       </Checkbox>
//     ))}
//   </Checkbox.Group>
// );

// export default CategoryPanel;
import React, { useEffect, useState } from 'react';
import axiosInstance from '@/services/axiosInstance';

import { Checkbox, Spin, message } from 'antd';

const CategoryPanel = ({ selectedCategory, onCategorySelect, productType = 'all' }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axiosInstance.get('/categories');
        const allCategories = response.data.data || [];

        // Filter categories based on product type
        let filteredCategories = allCategories;

        if (productType !== 'all') {
          // Filter categories that match the product type
          filteredCategories = allCategories.filter(cat => {
            // Assuming categories have a productType field or we can infer from the name
            // You may need to adjust this logic based on your category schema
            return cat.productType === productType || !cat.productType;
          });
        }

        setCategories(filteredCategories);
      } catch (error) {
        console.error('Failed to fetch categories', error);
        message.error('Could not load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [productType]);

  if (loading) return <Spin />;

  return (
    <Checkbox.Group style={{ display: 'flex', flexDirection: 'column' }}>
      {categories.map(cat => (
        <Checkbox
          key={cat._id}
          value={cat._id} // Use the category ID as the value
          checked={selectedCategory === cat._id} // Check if the category is selected
          onChange={() => onCategorySelect(cat._id)} // Pass the selected category ID to parent
        >
          {cat.name}
        </Checkbox>
      ))}
    </Checkbox.Group>
  );
};

export default CategoryPanel;
