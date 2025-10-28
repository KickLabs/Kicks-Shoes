import React, { useState } from 'react';
import { Button, Input, message } from 'antd';
import { SearchOutlined, BulbOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './OutfitSuggestionSection.css';

const { TextArea } = Input;

const OutfitSuggestionSection = () => {
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGetSuggestion = () => {
    if (!context.trim()) {
      message.warning('Please tell us where you are going!');
      return;
    }

    setLoading(true);

    // Navigate to outfit suggestion page with context
    navigate('/outfit-suggestion', {
      state: {
        context: context.trim(),
        timestamp: Date.now(),
      },
    });

    setLoading(false);
  };

  return (
    <div className="outfit-suggestion-section">
      <div className="outfit-suggestion-container">
        <div className="outfit-suggestion-content">
          <div className="outfit-suggestion-header">
            <div className="outfit-suggestion-icon">
              <BulbOutlined />
            </div>
            <h2 className="outfit-suggestion-title">Don't know what to wear? Let us help!</h2>
            <p className="outfit-suggestion-subtitle">
              Just tell us where you're going and we'll find the perfect outfit for you
            </p>
          </div>

          <div className="outfit-suggestion-form">
            <div className="form-group">
              <TextArea
                placeholder="Tell us where you're going... (e.g., 'Going to a business meeting', 'Date night at a restaurant', 'Casual day at the mall')"
                value={context}
                onChange={e => setContext(e.target.value)}
                rows={3}
                maxLength={200}
                showCount
                className="context-input"
              />
            </div>

            <Button
              type="primary"
              size="large"
              icon={<SearchOutlined />}
              onClick={handleGetSuggestion}
              loading={loading}
              className="suggestion-button"
            >
              Get Outfit Suggestions
            </Button>
          </div>
        </div>

        <div className="outfit-suggestion-visual">
          <div className="visual-placeholder">
            <img
              src="/src/assets/images/fitClothes.png"
              alt="Outfit suggestion visual"
              className="outfit-visual-image"
            />
            <p className="visual-text">Complete outfit suggestions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutfitSuggestionSection;
