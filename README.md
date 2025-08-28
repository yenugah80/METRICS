# MyFoodMatrics

AI-powered nutrition tracking application that revolutionizes food logging through image recognition, barcode scanning, and voice input. Get comprehensive nutritional analysis with personalized insights including diet compatibility, allergen detection, sustainability scoring, and unlimited AI-generated recipes.

## 🚀 Features

- **Smart Food Analysis**: Snap photos, scan barcodes, or use voice logging for instant nutrition data
- **AI Chef Assistant**: Unlimited recipe generation with personalized recommendations
- **Comprehensive Tracking**: Detailed macro/micronutrient analysis with health scoring
- **Diet Compatibility**: Automatic checking for dietary restrictions and allergies
- **Sustainability Metrics**: Environmental impact tracking for conscious eating
- **Progress Tracking**: Gamified achievement system with daily/weekly goals
- **Multi-Platform**: Web app + Flutter mobile app for seamless cross-device experience

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + Node.js + PostgreSQL + Drizzle ORM
- **Mobile**: Flutter + Dart for iOS/Android
- **AI**: OpenAI GPT-4 for food analysis and recipe generation
- **Auth**: JWT-based authentication system
- **Storage**: Cloud object storage for meal images
- **Database**: PostgreSQL with automated ETL pipelines

## ⚡ Quickstart

```bash
# 1. Clone and install dependencies
git clone https://github.com/yenugah80/METRICS.git
cd METRICS
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your database URL, OpenAI API key, JWT secret

# 3. Start database (optional - if using Docker)
docker compose up -d

# 4. Run database migrations
npm run db:push

# 5. Start the full application
npm run dev
```

The app will be available at `http://localhost:5000`

## 🎨 Frontend Development

```bash
# Navigate to client directory
cd client

# Install dependencies (if not done from root)
npm install

# Start development server
npm run dev

# The frontend will be available at http://localhost:5173
# Hot reload enabled for rapid development
```

**Key Frontend Technologies:**
- React 18 with TypeScript
- Vite for fast builds and HMR
- TanStack Query for API state management
- shadcn/ui + Radix UI for components
- Tailwind CSS for styling
- Wouter for lightweight routing

## 🔧 Backend Development

```bash
# Navigate to server directory
cd server

# Install dependencies (if not done from root)
npm install

# Start development server with hot reload
npm run dev

# API will be available at http://localhost:5000/api
# Auto-restarts on file changes
```

**Key Backend Features:**
- Express.js REST API
- JWT authentication with refresh tokens
- PostgreSQL with Drizzle ORM
- OpenAI integration for food analysis
- ETL pipelines for nutrition data
- Comprehensive error handling

## 📱 Mobile Development

```bash
# Navigate to mobile app directory
cd flutter_nutrition_app

# Install Flutter dependencies
flutter pub get

# Run on connected device/simulator
flutter run

# For specific platforms:
flutter run -d android
flutter run -d ios
```

**Mobile App Features:**
- Native camera integration
- Health data synchronization
- Offline-first architecture
- Push notifications
- Biometric authentication

## 🗄️ Database Setup

### Using Neon (Recommended)
1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string to `DATABASE_URL` in `.env`

### Using Local PostgreSQL
```bash
# Install PostgreSQL
brew install postgresql  # macOS
sudo apt install postgresql  # Ubuntu

# Create database
createdb myfoodmatrics

# Update .env
DATABASE_URL=postgresql://username:password@localhost:5432/myfoodmatrics
```

### Using Docker
```bash
# Start PostgreSQL container
docker run -d \
  --name myfoodmatrics-db \
  -e POSTGRES_DB=myfoodmatrics \
  -e POSTGRES_USER=dev \
  -e POSTGRES_PASSWORD=devpass \
  -p 5432:5432 \
  postgres:15

# Update .env
DATABASE_URL=postgresql://dev:devpass@localhost:5432/myfoodmatrics
```

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL=your_postgresql_connection_string

# Authentication
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long

# AI Integration
OPENAI_API_KEY=your_openai_api_key

# Application
NODE_ENV=development
PORT=5000

# Optional: Payment Processing
STRIPE_SECRET_KEY=your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

## 📁 Project Structure

```
MyFoodMatrics/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── pages/            # Route components
│   │   ├── hooks/            # Custom React hooks
│   │   └── lib/              # Utilities
├── server/                    # Express backend
│   ├── routes/               # API endpoints
│   ├── etl/                  # Data pipelines
│   ├── middleware/           # Custom middleware
│   └── *.ts                  # Core services
├── flutter_nutrition_app/     # Mobile app
│   └── lib/                  # Flutter source
├── shared/                    # Shared TypeScript types
└── attached_assets/           # User uploads
```

## 🧪 Testing

```bash
# Run backend tests
npm run test

# Run frontend tests
cd client && npm run test

# Run mobile tests
cd flutter_nutrition_app && flutter test
```

## 🚀 Deployment

### Web Application
```bash
# Build for production
npm run build

# Deploy to your preferred platform:
# - Vercel: vercel deploy
# - Netlify: netlify deploy
# - Railway: railway deploy
```

### Mobile Application
```bash
# Build Android APK
cd flutter_nutrition_app
flutter build apk

# Build iOS (requires Xcode)
flutter build ios
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Demo**: [Live Demo](https://myfoodmatrics.com)
- **Documentation**: [Full Docs](https://docs.myfoodmatrics.com)
- **API Reference**: [API Docs](https://api.myfoodmatrics.com/docs)

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/yenugah80/METRICS/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yenugah80/METRICS/discussions)
- **Email**: support@myfoodmatrics.com