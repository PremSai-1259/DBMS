#!/bin/bash

# Healthcare Platform Backend - Setup Script

echo "=========================================="
echo "Healthcare Platform Backend Setup"
echo "=========================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not installed. Please install Node.js 14+"
    exit 1
fi
echo "✅ Node.js $(node --version) detected"

# Check MySQL
if ! command -v mysql &> /dev/null; then
    echo "⚠️  MySQL not found in PATH. Please ensure MySQL is installed."
    echo "   See README for manual setup."
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Check .env file
echo ""
if [ -f ".env" ]; then
    echo "✅ .env file found"
    echo "   Review and update the following if needed:"
    echo "   - DB_HOST, DB_USER, DB_PASSWORD, DB_NAME"
    echo "   - EMAIL_USER, EMAIL_PASSWORD"
else
    echo "⚠️  .env file not found"
    echo "   Create .env with your database credentials"
fi

# Check schema
echo ""
if [ -f "configs/schema.sql" ]; then
    echo "✅ Database schema found at configs/schema.sql"
    echo "   Run this in MySQL to create tables:"
    echo "   SOURCE configs/schema.sql;"
else
    echo "❌ Database schema not found"
    exit 1
fi

# Check directories
echo ""
echo "Setting up directories..."
mkdir -p uploads
echo "✅ /uploads directory ready"

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update .env with your database credentials"
echo "2. Run MySQL and create the database:"
echo "   mysql -u root -p < configs/schema.sql"
echo "3. Start the server:"
echo "   npm start"
echo ""
echo "Server will run on http://localhost:3000"
echo "API Documentation: API_DOCUMENTATION.md"
echo "Testing Guide: TESTING_GUIDE.md"
echo ""
