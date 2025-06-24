import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Checkbox, Spin, message } from 'antd';

const CategoryPanel = ({ selectedCategory, onCategorySelect }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/api/categories'); // Fetch categories from backend
        setCategories(response.data.data || []);
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
