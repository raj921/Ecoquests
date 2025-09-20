# 🌱 Ecoquests

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![React Native](https://img.shields.io/badge/React_Native-0.71.0-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)

A gamified climate education platform that makes learning about environmental sustainability engaging and impactful through AI-powered personalization and interactive experiences.

## 🚀 Features

### 🌍 AI-Powered Learning
- Personalized learning paths based on user interests and knowledge level
- Interactive climate impact simulations
- Real-time environmental data visualization

### 📱 Mobile-First Experience
- Cross-platform compatibility (iOS & Android)
- Offline access to learning materials
- Progress tracking and achievements

### 🔄 Gamification
- Points and leveling system
- Badges and rewards for sustainable actions
- Community challenges and leaderboards

## 🛠 Tech Stack

### Frontend
- React Native with Expo
- Redux for state management
- Styled Components
- React Navigation

### Backend
- FastAPI (Python)
- MongoDB for data storage
- JWT Authentication
- Redis for caching

### AI/ML
- Groq AI (Llama 3.1) for natural language processing
- Custom recommendation engine
- Sentiment analysis for feedback

## 📦 Prerequisites

- Node.js 16+
- Python 3.8+
- MongoDB 5.0+
- Redis 6.0+
- Expo CLI

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/raj921/Ecoquests.git
cd Ecoquests
```

### 2. Set up the backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Update with your configuration
uvicorn server:app --reload
```

### 3. Set up the frontend
```bash
cd ../frontend
npm install
cp .env.example .env  # Update with your configuration
npx expo start
```

## 🔧 Environment Variables

### Backend (`.env`)
```env
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
REDIS_URL=redis://localhost:6379
```

### Frontend (`.env`)
```env
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## 🧪 Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd ../frontend
npm test
```




## 🙏 Acknowledgments

- [React Native](https://reactnative.dev/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Groq AI](https://groq.com/)
- Icons by [Feather Icons](https://feathericons.com/)
