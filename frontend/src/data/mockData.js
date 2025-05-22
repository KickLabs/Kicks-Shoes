// Mock data for products
export const products = [
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
      isOnSale: true,
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
    isNew: false,
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
      isOnSale: true,
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
    isNew: false,
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
      isOnSale: true,
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
  {
    id: 5,
    name: "Reebok Classic Leather",
    summary: "Timeless leather sneaker with classic design",
    description:
      "The Reebok Classic Leather features premium leather construction",
    brand: "Reebok",
    category_id: "cat1",
    store_id: "store5",
    sku: "#RCL",
    tags: ["Reebok", "Classic", "Lifestyle"],
    status: true,
    price: {
      regular: 75.0,
      discountPercent: 0,
      isOnSale: false,
    },
    stock: 25,
    sales: 2000,
    variants: {
      sizes: ["US 7", "US 8", "US 9", "US 10"],
      colors: ["White", "Black", "Navy"],
    },
    images: [
      "https://th.bing.com/th/id/OIP.-yP72Ukowrdlq4B4HDzAhgHaHa?rs=1&pid=ImgDetMain",
      "https://th.bing.com/th/id/OIP.6pVPhRqi-OTi9Ru3yHSJYgHaFM?pid=ImgDet&w=474&h=332&rs=1",
      "https://th.bing.com/th/id/OIP.3UuYSuGwiNR2ms7XT4TeHAHaHa?pid=ImgDet&w=474&h=474&rs=1",
    ],
    rating: 4.1,
    isNew: false,
  },
  {
    id: 6,
    name: "Converse Chuck Taylor",
    summary: "The iconic canvas sneaker that never goes out of style",
    description: "The Converse Chuck Taylor All Star is a timeless classic",
    brand: "Converse",
    category_id: "cat1",
    store_id: "store6",
    sku: "#CCT",
    tags: ["Converse", "Chuck Taylor", "Lifestyle"],
    status: true,
    price: {
      regular: 55.0,
      discountPercent: 0,
      isOnSale: false,
    },
    stock: 50,
    sales: 5000,
    variants: {
      sizes: ["US 7", "US 8", "US 9", "US 10", "US 11"],
      colors: ["Black", "White", "Red"],
    },
    images: [
      "https://cdn.shopify.com/s/files/1/0324/6781/2487/products/shopify-full-image-2000x2000_64b62176-dbb2-423e-8938-443da9aa7c1d_1024x.png?v=1590288081",
      "https://sneakernews.com/wp-content/uploads/2020/12/adidas-Ultra-Boost-1.0-DNA-H68156-8.jpg?w=1140",
      "https://th.bing.com/th/id/OIP.3UuYSuGwiNR2ms7XT4TeHAHaHa?pid=ImgDet&w=474&h=474&rs=1",
    ],
    rating: 4.6,
    isNew: true,
  },
  {
    id: 7,
    name: "Vans Old Skool",
    summary: "Classic skate shoe with the iconic side stripe",
    description:
      "The Vans Old Skool features the iconic side stripe and durable canvas",
    brand: "Vans",
    category_id: "cat1",
    store_id: "store7",
    sku: "#VOS",
    tags: ["Vans", "Old Skool", "Skateboarding"],
    status: true,
    price: {
      regular: 65.0,
      discountPercent: 0,
      isOnSale: false,
    },
    stock: 30,
    sales: 3500,
    variants: {
      sizes: ["US 7", "US 8", "US 9", "US 10"],
      colors: ["Black", "White", "Navy"],
    },
    images: [
      "https://th.bing.com/th/id/R.b9b56fb6a4c44722886b49eff30b1f97?rik=MxhhVsDYUpwZSw&pid=ImgRaw&r=0",
      "https://th.bing.com/th/id/OIP.6pVPhRqi-OTi9Ru3yHSJYgHaFM?pid=ImgDet&w=474&h=332&rs=1",
      "https://th.bing.com/th/id/OIP.3UuYSuGwiNR2ms7XT4TeHAHaHa?pid=ImgDet&w=474&h=474&rs=1",
    ],
    rating: 4.3,
    isNew: false,
  },
  {
    id: 8,
    name: "Adidas Samba",
    summary: "Iconic indoor soccer shoe with timeless style",
    description: "The Adidas Samba is a classic indoor soccer shoe",
    brand: "Adidas",
    category_id: "cat1",
    store_id: "store8",
    sku: "#AS",
    tags: ["Adidas", "Samba", "Soccer"],
    status: true,
    price: {
      regular: 99.99,
      discountPercent: 0,
      isOnSale: false,
    },
    stock: 15,
    sales: 2800,
    variants: {
      sizes: ["US 7", "US 8", "US 9", "US 10"],
      colors: ["White", "Black", "Green"],
    },
    images: [
      "https://th.bing.com/th/id/OIP.81YGmCDrRsgih3_rHL6qxgHaHa?rs=1&pid=ImgDetMain",
      "https://th.bing.com/th/id/OIP.6pVPhRqi-OTi9Ru3yHSJYgHaFM?pid=ImgDet&w=474&h=332&rs=1",
      "https://th.bing.com/th/id/OIP.3UuYSuGwiNR2ms7XT4TeHAHaHa?pid=ImgDet&w=474&h=474&rs=1",
    ],
    rating: 4.4,
    isNew: false,
  },
  {
    id: 9,
    name: "Nike Air Jordan 1",
    summary: "The Air Jordan 1 revolutionized basketball footwear",
    description: "The Air Jordan 1 is the shoe that started it all",
    brand: "Nike",
    category_id: "cat1",
    store_id: "store9",
    sku: "#NAJ1",
    tags: ["Nike", "Air Jordan", "Basketball"],
    status: true,
    price: {
      regular: 170.0,
      discountPercent: 0,
      isOnSale: false,
    },
    stock: 25,
    sales: 3600,
    variants: {
      sizes: ["US 7", "US 8", "US 9", "US 10", "US 11"],
      colors: ["Red", "Black", "White"],
    },
    images: [
      "https://th.bing.com/th/id/OIP.rg3jj-AOPenukfG6CV2JwAHaHa?rs=1&pid=ImgDetMain",
      "https://th.bing.com/th/id/OIP.6pVPhRqi-OTi9Ru3yHSJYgHaFM?pid=ImgDet&w=474&h=332&rs=1",
      "https://th.bing.com/th/id/OIP.3UuYSuGwiNR2ms7XT4TeHAHaHa?pid=ImgDet&w=474&h=474&rs=1",
    ],
    rating: 4.8,
    isNew: false,
  },
  {
    id: 10,
    name: "Adidas Yeezy Boost 350",
    summary: "Revolutionary design meets comfort",
    description: "The Yeezy Boost 350 features a Primeknit upper",
    brand: "Adidas",
    category_id: "cat1",
    store_id: "store10",
    sku: "#AYB350",
    tags: ["Adidas", "Yeezy", "Lifestyle"],
    status: true,
    price: {
      regular: 230.0,
      discountPercent: 0,
      isOnSale: false,
    },
    stock: 5,
    sales: 1200,
    variants: {
      sizes: ["US 7", "US 8", "US 9", "US 10"],
      colors: ["Black", "White", "Grey"],
    },
    images: [
      "https://sneakernews.com/wp-content/uploads/2019/04/adidas-yeezy-boost-350-v2-black-fu9013-release-date-6.jpg",
      "https://th.bing.com/th/id/OIP.6pVPhRqi-OTi9Ru3yHSJYgHaFM?pid=ImgDet&w=474&h=332&rs=1",
      "https://th.bing.com/th/id/OIP.3UuYSuGwiNR2ms7XT4TeHAHaHa?pid=ImgDet&w=474&h=474&rs=1",
    ],
    rating: 4.7,
    isNew: false,
  },
  {
    id: 11,
    name: "Nike Air Force 1",
    summary: "The classic white sneaker",
    description: "The Nike Air Force 1 is a timeless classic",
    brand: "Nike",
    category_id: "cat1",
    store_id: "store11",
    sku: "#NAF1",
    tags: ["Nike", "Air Force", "Lifestyle"],
    status: true,
    price: {
      regular: 100.0,
      discountPercent: 0,
      isOnSale: false,
    },
    stock: 30,
    sales: 4500,
    variants: {
      sizes: ["US 7", "US 8", "US 9", "US 10", "US 11"],
      colors: ["White", "Black", "Red"],
    },
    images: [
      "https://th.bing.com/th/id/R.04955c245a52516cf9a17190aee595e8?rik=XU21QMl3VZldlw&riu=http%3a%2f%2fimages.nike.com%2fis%2fimage%2fDotCom%2fCW2288_111_A_PREM%3fhei%3d3144%26wid%3d3144%26fmt%3djpg%26bgc%3dF5F5F5%26iccEmbed%3d1&ehk=frYGYsDc2TeDApdId9KFvTcUeryITlEAq%2bNPRgrpd7Q%3d&risl=&pid=ImgRaw&r=0",
      "https://th.bing.com/th/id/OIP.6pVPhRqi-OTi9Ru3yHSJYgHaFM?pid=ImgDet&w=474&h=332&rs=1",
      "https://th.bing.com/th/id/OIP.3UuYSuGwiNR2ms7XT4TeHAHaHa?pid=ImgDet&w=474&h=474&rs=1",
    ],
    rating: 4.5,
    isNew: false,
  },
];

// Mock data for orders
export const orders = [
  {
    id: 1,
    customer: "John Doe",
    date: "2024-03-20",
    amount: 110.4,
    status: "Completed",
    items: [
      {
        productId: 1,
        name: "Adidas Ultra boost",
        quantity: 1,
        price: 110.4,
      },
    ],
  },
  {
    id: 2,
    customer: "Jane Smith",
    date: "2024-03-19",
    amount: 250.0,
    status: "Processing",
    items: [
      {
        productId: 4,
        name: "Nike ZoomX Vaporfly",
        quantity: 1,
        price: 250.0,
      },
    ],
  },
  {
    id: 3,
    customer: "Mike Johnson",
    date: "2024-03-18",
    amount: 179.98,
    status: "Completed",
    items: [
      {
        productId: 5,
        name: "Adidas Forum Low",
        quantity: 2,
        price: 89.99,
      },
    ],
  },
  {
    id: 4,
    customer: "Sarah Wilson",
    date: "2024-03-17",
    amount: 345.0,
    status: "Completed",
    items: [
      {
        productId: 10,
        name: "Nike Air Jordan 1",
        quantity: 1,
        price: 170.0,
      },
      {
        productId: 15,
        name: "Adidas Stan Smith",
        quantity: 1,
        price: 85.0,
      },
      {
        productId: 20,
        name: "Nike Zoom Fly 5",
        quantity: 1,
        price: 90.0,
      },
    ],
  },
  {
    id: 5,
    customer: "David Brown",
    date: "2024-03-16",
    amount: 130.0,
    status: "Processing",
    items: [
      {
        productId: 14,
        name: "Nike Air Max 90",
        quantity: 1,
        price: 130.0,
      },
    ],
  },
  {
    id: 6,
    customer: "Emily Davis",
    date: "2024-03-15",
    amount: 460.0,
    status: "Completed",
    items: [
      {
        productId: 18,
        name: "Nike Air Jordan 4",
        quantity: 1,
        price: 200.0,
      },
      {
        productId: 17,
        name: "Adidas Yeezy Boost 350",
        quantity: 1,
        price: 230.0,
      },
    ],
  },
  {
    id: 7,
    customer: "Robert Taylor",
    date: "2024-03-14",
    amount: 85.0,
    status: "Completed",
    items: [
      {
        productId: 9,
        name: "Adidas Gazelle",
        quantity: 1,
        price: 85.0,
      },
    ],
  },
  {
    id: 8,
    customer: "Lisa Anderson",
    date: "2024-03-13",
    amount: 200.0,
    status: "Processing",
    items: [
      {
        productId: 8,
        name: "Nike Air Force 1",
        quantity: 2,
        price: 100.0,
      },
    ],
  },
  {
    id: 9,
    customer: "James Wilson",
    date: "2024-03-12",
    amount: 180.0,
    status: "Completed",
    items: [
      {
        productId: 19,
        name: "Adidas Ultraboost 22",
        quantity: 1,
        price: 180.0,
      },
    ],
  },
  {
    id: 10,
    customer: "Maria Garcia",
    date: "2024-03-11",
    amount: 260.0,
    status: "Completed",
    items: [
      {
        productId: 3,
        name: "Nike Air Max 270",
        quantity: 1,
        price: 150.0,
      },
      {
        productId: 7,
        name: "Adidas Samba",
        quantity: 1,
        price: 99.99,
      },
    ],
  },
  {
    id: 11,
    customer: "Thomas Lee",
    date: "2024-03-10",
    amount: 115.0,
    status: "Processing",
    items: [
      {
        productId: 6,
        name: "Nike Dunk Low",
        quantity: 1,
        price: 115.0,
      },
    ],
  },
  {
    id: 12,
    customer: "Jennifer White",
    date: "2024-03-09",
    amount: 175.0,
    status: "Completed",
    items: [
      {
        productId: 16,
        name: "Nike Air Max 97",
        quantity: 1,
        price: 175.0,
      },
    ],
  },
  {
    id: 13,
    customer: "William Clark",
    date: "2024-03-08",
    amount: 130.0,
    status: "Processing",
    items: [
      {
        productId: 13,
        name: "Adidas NMD R1",
        quantity: 1,
        price: 130.0,
      },
    ],
  },
  {
    id: 14,
    customer: "Patricia Martinez",
    date: "2024-03-07",
    amount: 180.0,
    status: "Completed",
    items: [
      {
        productId: 11,
        name: "Adidas Superstar",
        quantity: 2,
        price: 90.0,
      },
    ],
  },
  {
    id: 15,
    customer: "Michael Thompson",
    date: "2024-03-06",
    amount: 95.0,
    status: "Completed",
    items: [
      {
        productId: 12,
        name: "Nike Blazer Mid",
        quantity: 1,
        price: 95.0,
      },
    ],
  },
  {
    id: 16,
    customer: "Elizabeth Hall",
    date: "2024-03-05",
    amount: 340.0,
    status: "Processing",
    items: [
      {
        productId: 2,
        name: "ADIZERO SL RUNNING",
        quantity: 2,
        price: 64.4,
      },
      {
        productId: 20,
        name: "Nike Zoom Fly 5",
        quantity: 1,
        price: 160.0,
      },
    ],
  },
  {
    id: 17,
    customer: "Daniel Allen",
    date: "2024-03-04",
    amount: 200.0,
    status: "Completed",
    items: [
      {
        productId: 18,
        name: "Nike Air Jordan 4",
        quantity: 1,
        price: 200.0,
      },
    ],
  },
  {
    id: 18,
    customer: "Susan Young",
    date: "2024-03-03",
    amount: 85.0,
    status: "Processing",
    items: [
      {
        productId: 15,
        name: "Adidas Stan Smith",
        quantity: 1,
        price: 85.0,
      },
    ],
  },
  {
    id: 19,
    customer: "Joseph King",
    date: "2024-03-02",
    amount: 230.0,
    status: "Completed",
    items: [
      {
        productId: 17,
        name: "Adidas Yeezy Boost 350",
        quantity: 1,
        price: 230.0,
      },
    ],
  },
  {
    id: 20,
    customer: "Margaret Wright",
    date: "2024-03-01",
    amount: 160.0,
    status: "Processing",
    items: [
      {
        productId: 20,
        name: "Nike Zoom Fly 5",
        quantity: 1,
        price: 160.0,
      },
    ],
  },
  {
    id: 21,
    customer: "Christopher Lee",
    date: "2024-02-29",
    amount: 89.99,
    status: "Completed",
    items: [
      {
        productId: 21,
        name: "New Balance 574",
        quantity: 1,
        price: 89.99,
      },
    ],
  },
  {
    id: 22,
    customer: "Jessica Taylor",
    date: "2024-02-28",
    amount: 110.0,
    status: "Processing",
    items: [
      {
        productId: 22,
        name: "Puma RS-X",
        quantity: 1,
        price: 110.0,
      },
    ],
  },
  {
    id: 23,
    customer: "Andrew Wilson",
    date: "2024-02-27",
    amount: 150.0,
    status: "Completed",
    items: [
      {
        productId: 23,
        name: "Reebok Classic Leather",
        quantity: 2,
        price: 75.0,
      },
    ],
  },
  {
    id: 24,
    customer: "Sophia Brown",
    date: "2024-02-26",
    amount: 165.0,
    status: "Processing",
    items: [
      {
        productId: 24,
        name: "Converse Chuck Taylor All Star",
        quantity: 3,
        price: 55.0,
      },
    ],
  },
  {
    id: 25,
    customer: "Matthew Davis",
    date: "2024-02-25",
    amount: 130.0,
    status: "Completed",
    items: [
      {
        productId: 25,
        name: "Vans Old Skool",
        quantity: 2,
        price: 65.0,
      },
    ],
  },
];

export const discounts = [
  {
    id: 1,
    code: "SUMMER2024",
    percentage: 20,
    totalDiscount: 100,
    totalUsed: 45,
    minimumAmount: 50.0,
    maximumDiscount: 100.0,
    status: "Active",
  },
  {
    id: 2,
    code: "WELCOME10",
    percentage: 10,
    totalDiscount: 100,
    totalUsed: 32,
    minimumAmount: 30.0,
    maximumDiscount: 50.0,
    status: "Active",
  },
  {
    id: 3,
    code: "SPRING15",
    percentage: 15,
    totalDiscount: 100,
    totalUsed: 28,
    minimumAmount: 75.0,
    maximumDiscount: 75.0,
    status: "Active",
  },
  {
    id: 4,
    code: "FLASH25",
    percentage: 25,
    totalDiscount: 100,
    totalUsed: 15,
    minimumAmount: 100.0,
    maximumDiscount: 150.0,
    status: "Active",
  },
  {
    id: 5,
    code: "LOYALTY20",
    percentage: 20,
    totalDiscount: 100,
    totalUsed: 40,
    minimumAmount: 60.0,
    maximumDiscount: 80.0,
    status: "Active",
  },
  {
    id: 6,
    code: "HOLIDAY30",
    percentage: 30,
    totalDiscount: 100,
    totalUsed: 20,
    minimumAmount: 150.0,
    maximumDiscount: 200.0,
    status: "Active",
  },
  {
    id: 7,
    code: "NEWUSER15",
    percentage: 15,
    totalDiscount: 100,
    totalUsed: 25,
    minimumAmount: 40.0,
    maximumDiscount: 60.0,
    status: "Active",
  },
  {
    id: 8,
    code: "BULK25",
    percentage: 25,
    totalDiscount: 100,
    totalUsed: 18,
    minimumAmount: 200.0,
    maximumDiscount: 250.0,
    status: "Active",
  },
  {
    id: 9,
    code: "CLEARANCE40",
    percentage: 40,
    totalDiscount: 100,
    totalUsed: 12,
    minimumAmount: 80.0,
    maximumDiscount: 120.0,
    status: "Active",
  },
  {
    id: 10,
    code: "WEEKEND20",
    percentage: 20,
    totalDiscount: 100,
    totalUsed: 35,
    minimumAmount: 50.0,
    maximumDiscount: 70.0,
    status: "Active",
  },
  {
    id: 11,
    code: "SPORTS15",
    percentage: 15,
    totalDiscount: 100,
    totalUsed: 22,
    minimumAmount: 70.0,
    maximumDiscount: 90.0,
    status: "Active",
  },
  {
    id: 12,
    code: "FAMILY25",
    percentage: 25,
    totalDiscount: 100,
    totalUsed: 15,
    minimumAmount: 150.0,
    maximumDiscount: 180.0,
    status: "Active",
  },
  {
    id: 13,
    code: "STUDENT10",
    percentage: 10,
    totalDiscount: 100,
    totalUsed: 45,
    minimumAmount: 30.0,
    maximumDiscount: 40.0,
    status: "Active",
  },
  {
    id: 14,
    code: "MILITARY20",
    percentage: 20,
    totalDiscount: 100,
    totalUsed: 18,
    minimumAmount: 50.0,
    maximumDiscount: 60.0,
    status: "Active",
  },
  {
    id: 15,
    code: "BIRTHDAY15",
    percentage: 15,
    totalDiscount: 100,
    totalUsed: 30,
    minimumAmount: 40.0,
    maximumDiscount: 50.0,
    status: "Active",
  },
];

export const users = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    phone: "123-456-7890",
    role: "Admin",
    status: "Active",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "098-765-4321",
    role: "User",
    status: "Active",
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike@example.com",
    phone: "555-123-4567",
    role: "User",
    status: "Active",
  },
  {
    id: 4,
    name: "Sarah Wilson",
    email: "sarah@example.com",
    phone: "555-987-6543",
    role: "Admin",
    status: "Inactive",
  },
  {
    id: 5,
    name: "David Brown",
    email: "david@example.com",
    phone: "555-456-7890",
    role: "User",
    status: "Active",
  },
  {
    id: 6,
    name: "Emily Davis",
    email: "emily@example.com",
    phone: "555-789-0123",
    role: "User",
    status: "Active",
  },
  {
    id: 7,
    name: "Robert Taylor",
    email: "robert@example.com",
    phone: "555-234-5678",
    role: "User",
    status: "Inactive",
  },
  {
    id: 8,
    name: "Lisa Anderson",
    email: "lisa@example.com",
    phone: "555-345-6789",
    role: "User",
    status: "Active",
  },
  {
    id: 9,
    name: "James Wilson",
    email: "james@example.com",
    phone: "555-456-7890",
    role: "Admin",
    status: "Active",
  },
  {
    id: 10,
    name: "Maria Garcia",
    email: "maria@example.com",
    phone: "555-567-8901",
    role: "User",
    status: "Active",
  },
  {
    id: 11,
    name: "Thomas Lee",
    email: "thomas@example.com",
    phone: "555-678-9012",
    role: "User",
    status: "Inactive",
  },
  {
    id: 12,
    name: "Jennifer White",
    email: "jennifer@example.com",
    phone: "555-789-0123",
    role: "User",
    status: "Active",
  },
  {
    id: 13,
    name: "William Clark",
    email: "william@example.com",
    phone: "555-890-1234",
    role: "User",
    status: "Active",
  },
  {
    id: 14,
    name: "Patricia Martinez",
    email: "patricia@example.com",
    phone: "555-901-2345",
    role: "User",
    status: "Active",
  },
  {
    id: 15,
    name: "Michael Thompson",
    email: "michael@example.com",
    phone: "555-012-3456",
    role: "User",
    status: "Inactive",
  },
  {
    id: 16,
    name: "Elizabeth Hall",
    email: "elizabeth@example.com",
    phone: "555-123-4567",
    role: "User",
    status: "Active",
  },
  {
    id: 17,
    name: "Daniel Allen",
    email: "daniel@example.com",
    phone: "555-234-5678",
    role: "User",
    status: "Active",
  },
  {
    id: 18,
    name: "Susan Young",
    email: "susan@example.com",
    phone: "555-345-6789",
    role: "User",
    status: "Inactive",
  },
  {
    id: 19,
    name: "Joseph King",
    email: "joseph@example.com",
    phone: "555-456-7890",
    role: "User",
    status: "Active",
  },
  {
    id: 20,
    name: "Margaret Wright",
    email: "margaret@example.com",
    phone: "555-567-8901",
    role: "User",
    status: "Active",
  },
];

// Helper functions
export const getAllProducts = () => {
  return products;
};
export const getProducts = (page = 1, pageSize = 9) => {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return products.slice(startIndex, endIndex);
};

export const getProductById = (id) => {
  return products.find((product) => product.id === id);
};

export const getOrders = (page = 1, pageSize = 10) => {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return orders.slice(startIndex, endIndex);
};

export const getOrderById = (id) => {
  return orders.find((order) => order.id === id);
};

export const getTotalProducts = () => {
  return products.length;
};

export const getTotalOrders = () => {
  return orders.length;
};

export const getDiscounts = (page = 1, pageSize = 10) => {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return discounts.slice(startIndex, endIndex);
};

export const getDiscountById = (id) => {
  return discounts.find((discount) => discount.id === id);
};

export const getTotalDiscounts = () => {
  return discounts.length;
};

export const getUsers = (page = 1, pageSize = 9) => {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return users.slice(startIndex, endIndex);
};

export const getUserById = (id) => {
  return users.find((user) => user.id === id);
};

export const getTotalUsers = () => {
  return users.length;
};
