# Todo Application

A full-stack todo application built with Node.js, Express, MongoDB, and EJS.

## Features

- User authentication (register, login, logout)
- Task management (create, read, update, delete)
- Session-based authentication
- Flash messages for user feedback
- Responsive design
- MongoDB database with Mongoose ODM
- Express.js backend
- EJS templating
- Winston logging

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd todo-application
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
PORT=3000
NODE_ENV=development
```

4. Start the application:
```bash
npm start
```

## Project Structure

```
todo-application/
├── config/             # Configuration files
│   ├── database.js    # MongoDB connection
│   └── winston.js     # Logging configuration
├── controllers/        # Route controllers
│   ├── authController.js
│   └── taskController.js
├── middleware/         # Custom middleware
│   └── auth.js        # Authentication middleware
├── models/            # Mongoose models
│   ├── User.js
│   └── Task.js
├── public/            # Static files
│   ├── css/
│   └── js/
├── routes/            # Express routes
│   ├── auth.js
│   └── tasks.js
├── views/             # EJS templates
│   ├── layouts/
│   ├── auth/
│   └── tasks/
├── tests/             # Test files
│   ├── helpers/       # Test utilities
│   │   ├── testApp.js
│   │   └── testSetup.js
│   ├── auth.test.js
│   └── tasks.test.js
├── .env              # Environment variables
├── .gitignore
├── app.js            # Express application
├── package.json
└── README.md
```

## Testing

The application uses Jest and Supertest for testing. Tests are located in the `tests` directory.

### Test Setup

The test environment uses:
- MongoDB Memory Server for in-memory database
- Custom test app factory for Express application
- Test user creation with proper password hashing
- Session handling for authentication tests

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/auth.test.js
```

### Test Structure

- `tests/helpers/testSetup.js`: Database connection and test user creation
- `tests/helpers/testApp.js`: Express application factory for testing
- `tests/auth.test.js`: Authentication endpoint tests
- `tests/tasks.test.js`: Task management endpoint tests

## Authentication

The application uses:
- Passport.js for authentication
- Local strategy for email/password login
- Session-based authentication
- Bcrypt for password hashing
- Express session with MongoDB store

### Authentication Flow

1. User Registration:
   - Email and password validation
   - Password hashing with bcrypt
   - User creation in MongoDB
   - Redirect to login

2. User Login:
   - Email/password validation
   - Session creation
   - Flash messages for feedback
   - Redirect to tasks

3. Session Management:
   - Express session with MongoDB store
   - Session cookie handling
   - Automatic session expiration
   - Secure cookie settings

## API Endpoints

### Authentication

- `POST /auth/register`: Register new user
- `POST /auth/login`: User login
- `GET /auth/logout`: User logout

### Tasks

- `GET /tasks`: Get all tasks
- `POST /tasks`: Create new task
- `PUT /tasks/:id`: Update task
- `DELETE /tasks/:id`: Delete task

## Error Handling

- Express error middleware
- Winston logging
- Flash messages for user feedback
- HTTP status codes
- Validation error handling

## Security

- Password hashing with bcrypt
- Session-based authentication
- Secure cookie settings
- Input validation
- MongoDB sanitization
- XSS protection

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.