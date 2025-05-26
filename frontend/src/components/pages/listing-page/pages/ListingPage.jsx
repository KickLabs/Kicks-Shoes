import { useState } from "react";
import { Pagination } from "antd";
import { getProducts, getTotalProducts } from "../../../../data/mockData";
import FilterSidebar from "../components/FilterSidebar";
import ProductCard from "../../../common/components/ProductCard";

const ListingPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;
  const currentProducts = getProducts(currentPage, pageSize);
  const totalProducts = getTotalProducts();

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div style={{ display: "flex", padding: 32, gap: 32 }}>
      <FilterSidebar
        refineOptions={["Mens", "Casual"]}
        sizes={[
          { value: 38 },
          { value: 39, disabled: true },
          { value: 40, disabled: true },
          { value: 41 },
          { value: 42 },
          { value: 43 },
          { value: 44 },
          { value: 45 },
          { value: 46 },
          { value: 47 },
        ]}
        colors={[
          "#5475FB",
          "#FFA52F",
          "#3B3B3B",
          "#2F4835",
          "#1F1F1F",
          "#E2774D",
          "#C4C4C4",
          "#747E8A",
          "#92552A",
          "#B37245",
        ]}
        categories={[
          "Casual shoes",
          "Runners",
          "Hiking",
          "Sneaker",
          "Basketball",
          "Golf",
          "Outdoor",
        ]}
        genders={["Men", "Women"]}
        priceRange={[0, 1000]}
      />

      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 24,
            justifyContent: "center",
          }}
        >
          {currentProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 32,
          }}
        >
          <Pagination
            current={currentPage}
            total={totalProducts}
            pageSize={pageSize}
            onChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default ListingPage;
