## 🗂️ Category System

Multi-level hierarchical category tree for marketplace products:

- **API Endpoints**: `/api/categories`, `/api/categories/tree`, `/api/categories/:id/children`
- **Product Filtering**: Query products by `categoryId` or `categorySlug` parameters
- **Category Structure**: 50 top-level categories + 50 subcategories (expandable)
- **Tree Format**: Self-referential parent-child relationships with depth tracking

# List2Ship API

A comprehensive Node.js REST API for a marketplace platform that manages companies, sellers, products, and categories with JWT authentication.

## 🚀 Features

- **Company Management** - Create, read, update, and delete companies
- **Seller Authentication** - JWT-based authentication system for sellers
- **Product Management** - Full CRUD operations for products with seller ownership
- **Category Management** - Product categorization system
- **Security** - Rate limiting, CORS, Helmet, and input validation
- **Database** - PostgreSQL with Prisma ORM
- **Pagination** - Built-in pagination for all list endpoints
- **Search** - Case-insensitive search functionality

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd list2ship
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup environment variables**
   The `.env` file is already configured with:

   ```env
   DATABASE_URL="postgresql://postgres@localhost:5432/list2ship"
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   JWT_EXPIRES_IN="24h"
   NODE_ENV="development"
   PORT=3000
   ```

4. **Setup PostgreSQL database**

   - Create a PostgreSQL database named `list2ship`
   - Ensure the user `postgres` has access (no password required as configured)

5. **Generate Prisma client and run migrations**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

## 🚀 Running the Application

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

The server will start on `http://localhost:3000`

## 📊 Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio

## 🗄️ Database Schema

### Companies

- `id` - Unique identifier (CUID)
- `name` - Company name (unique)
- `email` - Company email (unique)
- `phone` - Phone number (optional)
- `address` - Company address (optional)
- `description` - Company description (optional)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Sellers

- `id` - Unique identifier (CUID)
- `email` - Seller email (unique)
- `password` - Hashed password
- `firstName` - First name
- `lastName` - Last name
- `phone` - Phone number (optional)
- `isActive` - Account status (default: true)
- `companyId` - Reference to company
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Product Categories

- `id` - Unique identifier (CUID)
- `name` - Category name (unique)
- `description` - Category description (optional)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Products

- `id` - Unique identifier (CUID)
- `name` - Product name
- `description` - Product description (optional)
- `price` - Product price
- `sku` - Stock Keeping Unit (unique)
- `stock` - Available stock (default: 0)
- `isActive` - Product status (default: true)
- `categoryId` - Reference to product category
- `sellerId` - Reference to seller
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## 🔌 API Endpoints

### Health Check

- `GET /health` - API health status

### Companies

- `POST /api/companies` - Create company
- `GET /api/companies` - Get all companies (with pagination/search)
- `GET /api/companies/:id` - Get company by ID
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company

### Authentication

- `POST /api/auth/register` - Register seller
- `POST /api/auth/login` - Login seller
- `GET /api/auth/profile` - Get seller profile (protected)

### Categories

- `POST /api/categories` - Create category (protected)
- `GET /api/categories` - Get all categories (with pagination/search)
- `GET /api/categories/:id` - Get category by ID
- `PUT /api/categories/:id` - Update category (protected)
- `DELETE /api/categories/:id` - Delete category (protected)

### Products

- `POST /api/products` - Create product (protected)
- `GET /api/products` - Get all products (with pagination/search/filters)
- `GET /api/products/my/products` - Get current seller's products (protected)
- `GET /api/products/:id` - Get product by ID
- `PUT /api/products/:id` - Update product (protected, owner only)
- `PATCH /api/products/:id/stock` - Update product stock (protected, owner only)
- `DELETE /api/products/:id` - Delete product (protected, owner only)

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 📝 Testing the API

### Using cURL Commands

Refer to `api-test-commands.md` for comprehensive cURL examples.

### Using Postman

Import the `List2Ship_API.postman_collection.json` file into Postman for a complete testing collection with:

- Environment variables
- Automatic token management
- Pre-configured requests
- Test scripts

### Sample Test Flow

1. Create a company
2. Register a seller with the company ID
3. Login to get JWT token
4. Create categories using the token
5. Create products in those categories
6. Test all CRUD operations

## 📁 Project Structure

```
list2ship/
├── controllers/           # Request handlers
│   ├── authController.js
│   ├── companyController.js
│   ├── categoryController.js
│   └── productController.js
├── routes/               # Route definitions
│   ├── auth.js
│   ├── companies.js
│   ├── categories.js
│   └── products.js
├── middleware/           # Custom middleware
│   └── auth.js
├── config/              # Configuration files
│   └── database.js
├── utils/               # Utility functions
│   └── jwt.js
├── prisma/              # Database schema and migrations
│   └── schema.prisma
├── app.js              # Main application file
├── package.json        # Dependencies and scripts
├── .env               # Environment variables
├── README.md          # This file
├── api-test-commands.md        # cURL testing commands
└── List2Ship_API.postman_collection.json  # Postman collection
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - Bcrypt for password security
- **Rate Limiting** - Prevent abuse with request limiting
- **CORS** - Cross-origin resource sharing configuration
- **Helmet** - Security headers
- **Input Validation** - Comprehensive request validation
- **Error Handling** - Secure error responses

## 🔧 Configuration

### Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT token signing
- `JWT_EXPIRES_IN` - Token expiration time (default: 24h)
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)

### Database Configuration

The application uses Prisma ORM with PostgreSQL. Connection details are in the `.env` file.

## 🐛 Error Handling

The API includes comprehensive error handling:

- **400** - Bad Request (validation errors, duplicates)
- **401** - Unauthorized (invalid/missing tokens)
- **404** - Not Found (resource doesn't exist)
- **429** - Too Many Requests (rate limiting)
- **500** - Internal Server Error

## 📊 Pagination and Search

All list endpoints support:

- **Pagination**: `?page=1&limit=10`
- **Search**: `?search=keyword`
- **Filtering**: Various filters depending on the endpoint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support or questions, please create an issue in the repository.
