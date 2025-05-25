

export const newProducts = [
  {
    id: 1,
    name: "Adidas Ultra Boost",
    summary: "Long distance running requires a lot from athletes.",
    description: "Premium running shoes with responsive Boost cushioning",
    brand: "Adidas",
    category_id: "cat1",
    store_id: "store1",
    sku: "#32A53",
    tags: ["Adidas", "Shoes", "Sneakers", "Ultraboost"],
    status: true,
    price: {
      regular: 110.4,
      discountPercent: 10,
      isOnSale: false,
    },
    stock: 21,
    sales: 1269,
    variants: {
      sizes: ["US 7", "US 8", "US 9", "US 10", "US 11"],
      colors: ["Black", "White", "Blue"],
    },
    images: [
      "https://sneakernews.com/wp-content/uploads/2020/12/adidas-Ultra-Boost-1.0-DNA-H68156-8.jpg?w=1140",
      "https://th.bing.com/th/id/OIP.6pVPhRqi-OTi9Ru3yHSJYgHaFM?pid=ImgDet&w=474&h=332&rs=1",
      "https://th.bing.com/th/id/OIP.3UuYSuGwiNR2ms7XT4TeHAHaHa?pid=ImgDet&w=474&h=474&rs=1",
    ],
    rating: 4.5,
    isNew: true,
  },
  {
    id: 2,
    name: "Nike Air Max 270",
    summary:
      "The Nike Air Max 270 delivers visible cushioning under every step",
    description:
      "The Nike Air Max 270 features a large window and visible air unit for maximum cushioning",
    brand: "Nike",
    category_id: "cat1",
    store_id: "store2",
    sku: "#NKM270",
    tags: ["Nike", "Air Max", "Lifestyle"],
    status: true,
    price: {
      regular: 150.0,
      discountPercent: 0,
      isOnSale: false,
    },
    stock: 30,
    sales: 2150,
    variants: {
      sizes: ["US 7", "US 8", "US 9", "US 10"],
      colors: ["Red", "Black", "White"],
    },
    images: [
      "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/gorfwjchoasrrzr1fggt/air-max-270-shoes-nnTrqDGR.png",
      "https://th.bing.com/th/id/OIP.6pVPhRqi-OTi9Ru3yHSJYgHaFM?pid=ImgDet&w=474&h=332&rs=1",
      "https://th.bing.com/th/id/OIP.3UuYSuGwiNR2ms7XT4TeHAHaHa?pid=ImgDet&w=474&h=474&rs=1",
    ],
    rating: 4.3,
    isNew: true,
  },
  {
    id: 3,
    name: "Puma RS-X",
    summary: "Retro-inspired design with modern technology",
    description: "The Puma RS-X combines retro style with modern comfort",
    brand: "Puma",
    category_id: "cat1",
    store_id: "store3",
    sku: "#PRSX",
    tags: ["Puma", "RS-X", "Lifestyle"],
    status: true,
    price: {
      regular: 137.5,
      discountPercent: 20,
      isOnSale: false,
    },
    stock: 15,
    sales: 1200,
    variants: {
      sizes: ["US 8", "US 9", "US 10", "US 11"],
      colors: ["Blue", "White", "Red"],
    },
    images: [
      "https://woker.vtexassets.com/arquivos/ids/411653-800-800?v=638351355999630000&width=800&height=800&aspect=true",
      "https://th.bing.com/th/id/OIP.6pVPhRqi-OTi9Ru3yHSJYgHaFM?pid=ImgDet&w=474&h=332&rs=1",
      "https://th.bing.com/th/id/OIP.3UuYSuGwiNR2ms7XT4TeHAHaHa?pid=ImgDet&w=474&h=474&rs=1",
    ],
    rating: 4.2,
    isNew: true,
  },
  {
    id: 4,
    name: "New Balance 574",
    summary: "Classic New Balance design with modern comfort",
    description:
      "The New Balance 574 combines timeless style with contemporary comfort",
    brand: "New Balance",
    category_id: "cat1",
    store_id: "store4",
    sku: "#NB574",
    tags: ["New Balance", "574", "Lifestyle"],
    status: true,
    price: {
      regular: 105.99,
      discountPercent: 15,
      isOnSale: false,
    },
    stock: 20,
    sales: 1500,
    variants: {
      sizes: ["US 7", "US 8", "US 9", "US 10", "US 11"],
      colors: ["Grey", "Navy", "Red"],
    },
    images: [
      "https://th.bing.com/th/id/OIP.5wdGyg6Ucq07qSwk7yeN8wHaHa?rs=1&pid=ImgDetMain",
      "https://th.bing.com/th/id/OIP.6pVPhRqi-OTi9Ru3yHSJYgHaFM?pid=ImgDet&w=474&h=332&rs=1",
      "https://th.bing.com/th/id/OIP.3UuYSuGwiNR2ms7XT4TeHAHaHa?pid=ImgDet&w=474&h=474&rs=1",
    ],
    rating: 4.4,
    isNew: true,
  },
]

export const reviewData = [
  {
    title: "Good Quality",
    comment: "I highly recommend shopping from kicks",
    rating: 5.0,
    image: "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?q=80&w=1965&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    userImage: "https://randomuser.me/api/portraits/men/32.jpg",
    userName: "John Doe"
  },
  {
    title: "Amazing Comfort",
    comment: "Feels great on my feet, perfect fit.",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80",
    userImage: "https://randomuser.me/api/portraits/women/65.jpg",
    userName: "Alice Smith"
  },
  {
    title: "Stylish Look",
    comment: "Love the color combination and design.",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1556906781-9a412961c28c?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    userImage: "https://randomuser.me/api/portraits/men/85.jpg",
    userName: "Mark Johnson"
  }
];

