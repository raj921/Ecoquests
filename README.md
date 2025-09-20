Ecoquests is a gamified climate education platform that makes learning about environmental sustainability engaging and impactful through AI-powered personalization and interactive experiences.

🚀 Features
🌍 AI-Powered Learning

Personalized learning paths based on user interests and knowledge level

Interactive climate impact simulations

Real-time environmental data visualization

📱 Mobile-First Experience

Cross-platform compatibility (iOS & Android)

Offline access to learning materials

Progress tracking and achievements

🔄 Gamification

Points and leveling system

Badges and rewards for sustainable actions

Community challenges and leaderboards

🎥 Demo / Preview
Home Screen	Learning Path	Leaderboard

	
	

(Add screenshots/GIFs of your app in action here)

🌍 Use Cases & Impact

Ecoquests empowers learners, schools, and communities to:

🌱 Understand climate science in simple, engaging ways

♻️ Adopt sustainable habits (waste reduction, water saving, carbon tracking)

📊 Track personal and collective environmental impact

👩‍👩‍👧 Foster collaboration through community challenges

🛠 Tech Stack
Frontend

React Native with Expo

Redux for state management

Styled Components

React Navigation

Backend

FastAPI (Python)

MongoDB for data storage

JWT Authentication

Redis for caching

AI/ML

Groq AI (Llama 3.1) for NLP

Custom recommendation engine

Sentiment analysis for feedback

📦 Prerequisites

Node.js 16+

Python 3.8+

MongoDB 5.0+

Redis 6.0+

Expo CLI

🚀 Getting Started
1. Clone the repository
git clone https://github.com/raj921/Ecoquests.git
cd Ecoquests

2. Set up the backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Update with your configuration
uvicorn server:app --reload

3. Set up the frontend
cd ../frontend
npm install
cp .env.example .env  # Update with your configuration
npx expo start

🔧 Environment Variables
Backend (.env)
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
REDIS_URL=redis://localhost:6379

Frontend (.env)
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

📡 API Documentation (Example)
Get Lessons
GET /api/v1/lessons


Response

[
  {
    "id": 1,
    "title": "Climate Basics",
    "completed": false
  }
]

Submit Progress
POST /api/v1/progress
{
  "lesson_id": 1,
  "status": "completed"
}

🤖 AI Personalization

Ecoquests uses Groq AI (Llama 3.1) + a custom recommendation engine to:

Suggest climate lessons based on prior knowledge

Adapt difficulty dynamically

Analyze feedback sentiment to refine content

Flow Diagram

User Input → NLP (Groq AI) → Recommendation Engine → Personalized Learning Path

☁️ Deployment
Local with Docker
docker-compose up --build

Cloud (example with Railway/Render)

Push code to GitHub

Connect to Railway/Render

Add environment variables in dashboard

Deploy backend + frontend automatically

🧪 Running Tests
Backend
cd backend
pytest

Frontend
cd ../frontend
npm test

🤝 Community & Contributing

We welcome contributions! 🎉

Fork the repository

Create your feature branch (git checkout -b feature/AmazingFeature)

Commit your changes (git commit -m 'Add some AmazingFeature')

Push to the branch (git push origin feature/AmazingFeature)

Open a Pull Request
