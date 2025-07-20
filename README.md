# Kicks Shoes E-commerce Project

A full-stack e-commerce application for selling shoes, built with React (Frontend) and Node.js (Backend).

## Project Structure

```
kicks-shoes/
├── frontend/           # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/           # Node.js backend
│   ├── routes/
│   ├── models/
│   ├── controllers/
│   ├── middleware/
│   ├── server.js
│   └── package.json
│
└── package.json
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd kicks-shoes
```

2. Install dependencies for all parts of the project:

```bash
npm run install-all --legacy-peer-deps
```

3. Create a `.env` file in the backend directory with the following variables:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

## Running the Application

1. Start both frontend and backend concurrently:

```bash
npm start
```

Or run them separately:

2. Start the backend:

```bash
npm run server
```

3. Start the frontend:

```bash
npm run client
```

The frontend will be available at `http://localhost:3000`
The backend API will be available at `http://localhost:5000`

## Features

- User authentication (Register/Login)
- Product listing and details
- Shopping cart functionality
- Order management
- Admin dashboard (coming soon)

## Technologies Used

### Frontend

- React
- Vite
- React Router
- Redux Toolkit
- Axios

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- JWT Authentication
- Multer (for file uploads)
