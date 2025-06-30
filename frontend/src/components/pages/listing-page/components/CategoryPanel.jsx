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

const CategoryPanel = ({ selectedCategory, onCategorySelect }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axiosInstance.get('/categories'); // tương ứng với router.get("/", ...) bên backend
        setCategories(response.data.data || []); // backend của bạn trả về { data: [...] }
      } catch (error) {
        console.error('Failed to fetch categories', error);
        message.error('Could not load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

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
