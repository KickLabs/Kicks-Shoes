import React, { useContext, useEffect, useState } from 'react';
import { Row, Col, Empty, message, Spin, Pagination } from 'antd';
import TabHeader from '../../../common/components/TabHeader';
import { ActiveTabContext } from '../../../common/components/ActiveTabContext';
import { favouriteService } from '../../../../services/favouriteService';
import { useAuth } from '../../../../contexts/AuthContext';
import FavouriteCard from '../../../common/components/FavouriteCard';
import './FavouritesTab.css';

export default function FavouritesTab() {
  const { setActiveTab } = useContext(ActiveTabContext);
  const [favourites, setFavourites] = useState([]);
  const [unfavoritedItems, setUnfavoritedItems] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const { user } = useAuth();

  useEffect(() => {
    setActiveTab('2');
    fetchFavourites();
  }, [setActiveTab]);

  const fetchFavourites = async () => {
    try {
      // Check if user is logged in before making API call
      const userInfo = localStorage.getItem('userInfo');
      if (!userInfo) {
        message.error('Please login to view favourites');
        setFavourites([]);
        return;
      }

      setLoading(true);
      const response = await favouriteService.getFavourites();
      console.log('Favourites response:', response);

      if (response?.success) {
        setFavourites(response.data || []);
        setUnfavoritedItems(new Set()); // Reset unfavorited items on fresh load
      } else {
        console.error('Invalid response format:', response);
        message.error('Failed to load favourite products');
        setFavourites([]);
      }
    } catch (error) {
      console.error('Error fetching favourites:', error);
      message.error(error.message || 'Failed to load favourite products');
      setFavourites([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromFavourites = productId => {
    setFavourites(prev => prev.filter(fav => fav.product._id !== productId));
    message.success('Removed from favourites');
  };

  const renderProductCard = favourite => {
    const product = favourite.product;
    if (!product) return null;

    return (
      <Col xs={24} sm={12} md={8} key={product._id} className="product-card-col">
        <FavouriteCard product={product} onRemoveFromFavourites={handleRemoveFromFavourites} />
      </Col>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  const displayedFavourites = favourites.filter(fav => fav.product);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFavourites = displayedFavourites.slice(startIndex, endIndex);

  return (
    <>
      <TabHeader breadcrumb="Favourites" />
      <div
        style={{ backgroundColor: 'none' }}
        className="profile-tab-container favourites-container"
      >
        {displayedFavourites.length === 0 ? (
          <Empty description="No favourite products yet" />
        ) : (
          <>
            <Row gutter={[24, 24]}>{currentFavourites.map(renderProductCard)}</Row>
            {displayedFavourites.length > itemsPerPage && (
              <div className="pagination-container">
                <Pagination
                  current={currentPage}
                  total={displayedFavourites.length}
                  pageSize={itemsPerPage}
                  onChange={setCurrentPage}
                  showSizeChanger={false}
                />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
