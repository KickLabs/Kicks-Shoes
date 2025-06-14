import React, { useContext, useEffect, useState } from "react";
import { Row, Col, Button, Empty, message, Spin, Pagination } from "antd";
import { HeartFilled, HeartOutlined } from "@ant-design/icons";
import TabHeader from "../../../common/components/TabHeader";
import { ActiveTabContext } from "../../../common/components/ActiveTabContext";
import axios from "axios";
import { useAuth } from "../../../../contexts/AuthContext";
import "./FavouritesTab.css";

export default function FavouritesTab() {
  const { setActiveTab } = useContext(ActiveTabContext);
  const [favourites, setFavourites] = useState([]);
  const [unfavoritedItems, setUnfavoritedItems] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const { user } = useAuth();

  useEffect(() => {
    setActiveTab("2");
    fetchFavourites();
  }, [setActiveTab]);

  const fetchFavourites = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/favourites");
      console.log("Favourites response:", response.data);
      
      if (response.data?.success) {
        setFavourites(response.data.data || []);
        setUnfavoritedItems(new Set()); // Reset unfavorited items on fresh load
      } else {
        console.error("Invalid response format:", response.data);
        message.error("Failed to load favourite products");
        setFavourites([]);
      }
    } catch (error) {
      console.error("Error fetching favourites:", error.response || error);
      message.error(error.response?.data?.message || "Failed to load favourite products");
      setFavourites([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavourite = async (productId) => {
    try {
      const isCurrentlyFavorited = !unfavoritedItems.has(productId);
      
      if (isCurrentlyFavorited) {
        // Unfavorite
        await axios.delete(`/api/favourites/${productId}`);
        setUnfavoritedItems(prev => new Set([...prev, productId]));
        message.success("Removed from favourites");
      } else {
        // Re-favorite
        try {
          await axios.post("/api/favourites", { productId });
          setUnfavoritedItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(productId);
            return newSet;
          });
          message.success("Added to favourites");
        } catch (error) {
          if (error.response?.status === 400 && error.response?.data?.message?.includes("already in favourites")) {
            // If product is already in favorites, just update the UI state
            setUnfavoritedItems(prev => {
              const newSet = new Set(prev);
              newSet.delete(productId);
              return newSet;
            });
            message.info("Product is already in favourites");
          } else {
            throw error; // Re-throw other errors to be caught by outer catch block
          }
        }
      }
    } catch (error) {
      console.error("Error toggling favourite:", error.response || error);
      message.error(error.response?.data?.message || "Failed to update favourite status");
    }
  };

  const renderProductCard = (favourite) => {
    const product = favourite.product;
    if (!product) return null;

    const isCurrentlyFavorited = !unfavoritedItems.has(product._id);

    return (
      <Col xs={24} sm={12} md={8} key={product._id} className="product-card-col">
        <div className="product-card">
          <div className="product-image-container">
            <img
              src={product.images?.[0] || '/placeholder-image.jpg'}
              alt={product.name}
              className="product-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/placeholder-image.jpg';
              }}
            />
            <Button
              className={`favourite-button ${isCurrentlyFavorited ? 'favourited' : ''}`}
              icon={isCurrentlyFavorited ? <HeartFilled /> : <HeartOutlined />}
              onClick={() => toggleFavourite(product._id)}
            />
          </div>
          <div className="product-info">
            <h3 className="product-name">{product.name}</h3>
          </div>
        </div>
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
      <div className="profile-tab-container favourites-container">
        {displayedFavourites.length === 0 ? (
          <Empty description="No favourite products yet" />
        ) : (
          <>
            <Row gutter={[24, 24]}>
              {currentFavourites.map(renderProductCard)}
            </Row>
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