// Mock data for products
export const products = [
  {
    id: 1,
    name: "Adidas Ultra boost",
    type: "Sneaker",
    price: 110.4,
    summary: "Long distance running requires a lot from athletes.",
    sales: 1269,
    remaining: 1269,
    image: "nikeproduct.png",
  },
  {
    id: 2,
    name: "ADIZERO SL RUNNING",
    type: "Running",
    price: 64.4,
    summary: "Long distance running requires a lot from athletes.",
    sales: 1269,
    remaining: 1269,
    image: "nikeproduct.png",
  },
  {
    id: 3,
    name: "Nike Air Max 270",
    type: "Lifestyle",
    price: 150.0,
    summary:
      "The Nike Air Max 270 delivers visible cushioning under every step.",
    sales: 2150,
    remaining: 850,
    image: "nikeproduct.png",
  },
  {
    id: 4,
    name: "Nike ZoomX Vaporfly",
    type: "Running",
    price: 250.0,
    summary: "The Nike ZoomX Vaporfly is designed for elite runners.",
    sales: 980,
    remaining: 120,
    image: "nikeproduct.png",
  },
  {
    id: 5,
    name: "Adidas Forum Low",
    type: "Lifestyle",
    price: 89.99,
    summary: "Classic basketball shoe with modern comfort.",
    sales: 1560,
    remaining: 440,
    image: "nikeproduct.png",
  },
  {
    id: 6,
    name: "Nike Dunk Low",
    type: "Lifestyle",
    price: 115.0,
    summary: "The Nike Dunk Low brings back the classic basketball design.",
    sales: 3200,
    remaining: 800,
    image: "nikeproduct.png",
  },
  {
    id: 7,
    name: "Adidas Samba",
    type: "Lifestyle",
    price: 99.99,
    summary: "Iconic indoor soccer shoe with timeless style.",
    sales: 2800,
    remaining: 1200,
    image: "nikeproduct.png",
  },
  {
    id: 8,
    name: "Nike Air Force 1",
    type: "Lifestyle",
    price: 100.0,
    summary: "The radiance lives on in the Nike Air Force 1.",
    sales: 4500,
    remaining: 1500,
    image: "nikeproduct.png",
  },
  {
    id: 9,
    name: "Adidas Gazelle",
    type: "Lifestyle",
    price: 85.0,
    summary: "Classic training shoe with suede upper.",
    sales: 1800,
    remaining: 700,
    image: "nikeproduct.png",
  },
  {
    id: 10,
    name: "Nike Air Jordan 1",
    type: "Basketball",
    price: 170.0,
    summary: "The Air Jordan 1 revolutionized basketball footwear.",
    sales: 3600,
    remaining: 400,
    image: "nikeproduct.png",
  },
  {
    id: 11,
    name: "Adidas Superstar",
    type: "Lifestyle",
    price: 90.0,
    summary: "The iconic shell toe design that started it all.",
    sales: 4200,
    remaining: 1800,
    image: "nikeproduct.png",
  },
  {
    id: 12,
    name: "Nike Blazer Mid",
    type: "Lifestyle",
    price: 95.0,
    summary: "The Nike Blazer Mid brings back the classic basketball look.",
    sales: 2100,
    remaining: 900,
    image: "nikeproduct.png",
  },
  {
    id: 13,
    name: "Adidas NMD R1",
    type: "Lifestyle",
    price: 130.0,
    summary: "Modern running-inspired lifestyle shoe.",
    sales: 1600,
    remaining: 400,
    image: "nikeproduct.png",
  },
  {
    id: 14,
    name: "Nike Air Max 90",
    type: "Lifestyle",
    price: 130.0,
    summary:
      "The Nike Air Max 90 features a larger window for more visible air.",
    sales: 2800,
    remaining: 1200,
    image: "nikeproduct.png",
  },
  {
    id: 15,
    name: "Adidas Stan Smith",
    type: "Lifestyle",
    price: 85.0,
    summary: "The iconic tennis shoe with minimalist design.",
    sales: 3400,
    remaining: 1600,
    image: "nikeproduct.png",
  },
  {
    id: 16,
    name: "Nike Air Max 97",
    type: "Lifestyle",
    price: 175.0,
    summary: "The Nike Air Max 97 features a full-length visible air unit.",
    sales: 1900,
    remaining: 600,
    image: "nikeproduct.png",
  },
  {
    id: 17,
    name: "Adidas Yeezy Boost 350",
    type: "Lifestyle",
    price: 230.0,
    summary: "The Yeezy Boost 350 features a Primeknit upper.",
    sales: 1200,
    remaining: 300,
    image: "nikeproduct.png",
  },
  {
    id: 18,
    name: "Nike Air Jordan 4",
    type: "Basketball",
    price: 200.0,
    summary: "The Air Jordan 4 features a unique mesh panel design.",
    sales: 1500,
    remaining: 500,
    image: "nikeproduct.png",
  },
  {
    id: 19,
    name: "Adidas Ultraboost 22",
    type: "Running",
    price: 180.0,
    summary: "The Ultraboost 22 features responsive Boost cushioning.",
    sales: 900,
    remaining: 100,
    image: "nikeproduct.png",
  },
  {
    id: 20,
    name: "Nike Zoom Fly 5",
    type: "Running",
    price: 160.0,
    summary: "The Nike Zoom Fly 5 is designed for long-distance running.",
    sales: 800,
    remaining: 200,
    image: "nikeproduct.png",
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
];

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
