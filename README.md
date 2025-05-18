# PDFToolPro Backend

This is the backend server for PDFToolPro, a PDF manipulation tool.

## Features

- User authentication (register, login)
- Visit tracking
- Tool usage statistics
- API endpoints for PDF manipulation

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your MongoDB connection string and other required variables

3. Start the server:
   ```
   npm start
   ```

## API Endpoints

- `/api/register` - Register a new user
- `/api/login` - User login
- `/api/visit` - Track page visits
- `/api/tool-usage` - Track tool usage
- `/api/tool-usage/stats` - Get tool usage statistics

## Deployment

This server is configured for easy deployment on Render.com.
