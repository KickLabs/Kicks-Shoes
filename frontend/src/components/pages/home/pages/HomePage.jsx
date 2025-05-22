import ProductCard from "../../../common/components/ProductCard";

// DUMMY DATA FOR TESTING LIST PRODUCTS
const products = [
  {
    image:
      "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/3bbecbdf584e40398446a8bf0117cf62_9366/Giay_Samba_OG_trang_B75806_01_00_standard.jpg",
    isNew: true,
    name: "ADIDAS 4DFWD X PARLEY RUNNING SHOES",
    price: 125,
    onViewProduct: () => window.open("https://adidas.com/product1", "_blank"),
  },
  {
    image:
      "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/3bbecbdf584e40398446a8bf0117cf62_9366/Giay_Samba_OG_trang_B75806_01_00_standard.jpg",
    isNew: false,
    isSale: true,
    salePercent: 12,
    name: "NIKE AIR ZOOM PEGASUS",
    price: 110,
    onViewProduct: () => window.open("https://nike.com/product2", "_blank"),
  },
  {
    image:
      "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/3bbecbdf584e40398446a8bf0117cf62_9366/Giay_Samba_OG_trang_B75806_01_00_standard.jpg",
    isNew: true,
    name: "PUMA ULTRA RIDE",
    price: 99,
    onViewProduct: () => window.open("https://puma.com/product3", "_blank"),
  },
  {
    image:
      "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/3bbecbdf584e40398446a8bf0117cf62_9366/Giay_Samba_OG_trang_B75806_01_00_standard.jpg",
    isNew: true,
    name: "PUMA ULTRA RIDE",
    price: 99,
    onViewProduct: () => window.open("https://puma.com/product3", "_blank"),
  },
];

const HomePage = () => {
  return (
    // DUMMY DATA FOR TESTING LIST PRODUCTS
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        padding: 32,
        gap: 24,
      }}
    >
      {products.map((product) => (
        <ProductCard key={product.name} product={product} />
      ))}
    </div>
  );
};

export default HomePage;
