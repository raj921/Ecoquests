from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from groq import Groq
import uuid
from datetime import datetime, timedelta
import asyncio
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize Gemini LLM
API_KEY = os.environ.get('GEMINI_API_KEY')
if not API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is required")

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Environment validation and startup logging
async def validate_environment():
    """Validate all required environment variables and services"""
    logger.info("🚀 Starting EcoQuest Backend Environment Validation")
    
    # Database validation
    try:
        logger.info(f"🔌 Testing MongoDB connection: {mongo_url}")
        # Test connection by pinging the database
        await db.command("ping")
        logger.info("✅ MongoDB connection successful")
    except Exception as db_error:
        logger.error(f"❌ MongoDB connection failed: {db_error}")
        logger.error("💡 Make sure MongoDB is running on localhost:27017 or update MONGO_URL in .env")
    
    # AI Provider validation - Groq is PRIMARY
    groq_key = os.environ.get('GROQ_API_KEY')
    gemini_key = os.environ.get('GEMINI_API_KEY')
    
    # Groq is the primary and required AI provider
    if groq_key and groq_key != "your_groq_api_key_here":
        logger.info("🌟 Groq API key detected - PRIMARY AI provider configured")
        logger.info("✅ EcoQuest will use Groq (Llama 3.1) for all AI features")
    else:
        logger.error("🚨 GROQ API KEY MISSING OR INVALID!")
        logger.error("💡 Groq is the primary AI provider for EcoQuest")
        logger.error("   Please add a valid GROQ_API_KEY to backend/.env")
        if groq_key:
            logger.error(f"   Current key appears to be placeholder: {groq_key[:10]}...")
    
    # Gemini as fallback only
    if gemini_key and gemini_key != "your_gemini_api_key_here":
        logger.info("🔵 Gemini API key detected - available as fallback")
        if len(gemini_key) < 30:
            logger.warning("⚠️ Gemini API key appears too short - may be invalid")
    else:
        logger.warning("⚠️ No Gemini fallback configured")
    
    # Validate primary AI provider
    if not groq_key or groq_key == "your_groq_api_key_here":
        logger.error("🚨 PRIMARY AI PROVIDER NOT CONFIGURED!")
        logger.error("   EcoQuest requires Groq API for AI features")
        logger.error("   Get your free API key at: https://console.groq.com/")
    else:
        logger.info("🤖 AI System: Groq (Primary) + Gemini (Fallback)")
    
    # Backend URL validation for frontend
    backend_url = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'http://localhost:8000')
    logger.info(f"🌐 Backend URL for frontend: {backend_url}")
    
    # CORS origins validation
    logger.info("🔒 CORS configured for development environments")
    
    logger.info("✅ Environment validation complete")
    logger.info("=" * 60)

# Run validation on startup
@app.on_event("startup")
async def startup_event():
    await validate_environment()

# Models
class OnboardingRequest(BaseModel):
    age: int
    interests: List[str]  # ["oceans", "forests", "energy", "waste", "transport"]
    knowledge_level: str  # "beginner", "intermediate", "advanced"
    learning_style: str  # "visual", "reading", "interactive", "mixed"
    location: Optional[str] = None

class OnboardingResponse(BaseModel):
    user_id: str
    personalized_path: Dict[str, Any]
    welcome_message: str

class HabitInput(BaseModel):
    user_id: str
    transport: str  # "car", "bike", "walk", "public"
    diet: str  # "meat", "vegetarian", "vegan", "pescatarian"
    energy_usage: str  # "low", "medium", "high"
    waste_habits: str  # "minimal", "average", "high"

class ImpactSimulation(BaseModel):
    daily_co2: float
    weekly_co2: float
    yearly_co2: float
    suggestions: List[str]
    positive_impact: str

class WhatIfRequest(BaseModel):
    scenario: str
    context: Optional[str] = None

class LocalActionRequest(BaseModel):
    location: str
    interests: List[str]

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    age: int
    interests: List[str]
    knowledge_level: str
    learning_style: str
    location: Optional[str] = None
    points: int = 0
    level: int = 1
    completed_quests: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserProgress(BaseModel):
    user_id: str
    current_co2_footprint: float
    daily_habits: Dict[str, str]
    completed_actions: List[str] = []
    streak_days: int = 0
    last_activity: datetime = Field(default_factory=datetime.utcnow)

# Utility functions
def calculate_co2_impact(transport: str, diet: str, energy: str, waste: str) -> dict:
    # CO2 calculations (kg CO2 per day)
    transport_values = {"car": 6.5, "bike": 0.0, "walk": 0.0, "public": 2.1}
    diet_values = {"meat": 7.2, "vegetarian": 3.8, "vegan": 2.9, "pescatarian": 4.1}
    energy_values = {"low": 2.1, "medium": 4.8, "high": 8.2}
    waste_values = {"minimal": 0.8, "average": 2.3, "high": 4.1}
    
    daily_co2 = (
        transport_values.get(transport, 6.5) +
        diet_values.get(diet, 7.2) +
        energy_values.get(energy, 4.8) +
        waste_values.get(waste, 2.3)
    )
    
    return {
        "daily_co2": daily_co2,
        "weekly_co2": daily_co2 * 7,
        "yearly_co2": daily_co2 * 365
    }

def generate_suggestions(transport: str, diet: str, energy: str, waste: str) -> List[str]:
    suggestions = []
    
    if transport == "car":
        suggestions.append("🚴 Try biking or walking for short trips - save 6.5kg CO2/day")
    if diet == "meat":
        suggestions.append("🥗 Reduce meat consumption 2-3 days/week - save up to 3kg CO2/day")
    if energy == "high":
        suggestions.append("💡 Switch to LED bulbs and unplug devices - save 2-4kg CO2/day")
    if waste == "high":
        suggestions.append("♻️ Start composting and reduce packaging - save 1-2kg CO2/day")
    
    return suggestions

async def generate_ai_content(prompt: str, system_message: str = "You are an expert climate educator.") -> str:
    """Generate AI content using Groq (Llama 3.1) as primary AI provider"""
    logger.info(f"🤖 AI content generation started. Prompt length: {len(prompt)} chars")
    logger.debug(f"System message: {system_message[:50]}...")
    
    try:
        # Use Groq API as primary AI provider
        groq_api_key = os.environ.get('GROQ_API_KEY')
        if not groq_api_key or groq_api_key == "your_groq_api_key_here":
            raise ValueError("Groq API key not configured properly")
            
        logger.info("🌟 Using Groq AI (primary provider)")
        client = Groq(api_key=groq_api_key)
        
        # For structured JSON responses (onboarding), use special format
        if "personalized climate education path" in prompt.lower():
            messages = [
                {"role": "system", "content": system_message},
                {"role": "user", "content": f"Generate a JSON response for climate onboarding: {prompt}"}
            ]
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: client.chat.completions.create(
                    model="llama-3.1-70b-versatile",
                    messages=messages,
                    temperature=0.7,
                    max_tokens=800,
                    response_format={"type": "json_object"}
                )
            )
            content = response.choices[0].message.content.strip()
            logger.info(f"✅ Groq JSON response received, length: {len(content)} chars")
            return content
        else:
            # Regular chat for what-if scenarios and other content
            messages = [
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt}
            ]
            logger.info("🌟 Calling Groq API (regular chat)")
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=messages,
                    temperature=0.8,
                    max_tokens=500,
                    stream=False
                )
            )
            content = response.choices[0].message.content.strip()
            logger.info(f"✅ Groq response received, length: {len(content)} chars")
            return content
        
    except Exception as e:
        logger.error(f"❌ Groq AI generation error: {e}")
        # Only fallback to Gemini if Groq fails, not if key is missing
        try:
            gemini_api_key = os.environ.get('GEMINI_API_KEY')
            if gemini_api_key and gemini_api_key != "your_gemini_api_key_here":
                logger.warning("🔵 Falling back to Gemini AI due to Groq error")
                import google.generativeai as genai
                genai.configure(api_key=gemini_api_key)
                model = genai.GenerativeModel('gemini-1.5-flash')
                full_prompt = f"{system_message}\n\nUser Query: {prompt}"
                response = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: model.generate_content(full_prompt)
                )
                content = response.text.strip() if response.text else "Sorry, I couldn't generate a response."
                logger.info(f"✅ Gemini fallback response received, length: {len(content)} chars")
                return content
        except Exception as fallback_error:
            logger.error(f"❌ Gemini fallback also failed: {fallback_error}")
        
        # If all AI providers fail, return error message (no mock data)
        error_msg = "AI service is currently unavailable. Please ensure Groq API key is properly configured."
        logger.error(f"🚨 All AI providers failed, returning error: {error_msg}")
        return error_msg

# Routes
@api_router.post("/onboarding", response_model=OnboardingResponse)
async def complete_onboarding(request: OnboardingRequest):
    logger.info(f"🟢 Onboarding request received: age={request.age}, interests={request.interests}, knowledge_level={request.knowledge_level}, location={request.location}")
    try:
        # Create user
        user = User(
            age=request.age,
            interests=request.interests,
            knowledge_level=request.knowledge_level,
            learning_style=request.learning_style,
            location=request.location
        )
        
        # Save user to database
        result = await db.users.insert_one(user.dict())
        logger.info(f"📝 User created in DB: id={user.id}, insert_result={result.inserted_id}")
        
        # Generate personalized learning path with AI
        ai_prompt = f"""
        Create a personalized climate education path for a {request.age}-year-old with {request.knowledge_level} knowledge level.
        Their interests include: {', '.join(request.interests)}.
        They prefer {request.learning_style} learning style.
        
        Generate a JSON response with:
        - welcome_message: Encouraging welcome (max 100 words)
        - learning_modules: 5 modules tailored to their interests and level
        - first_quest: An engaging first activity
        - daily_tip: One practical climate tip
        
        Keep it motivational and age-appropriate.
        """
        
        logger.info(f"🤖 Generating AI content for onboarding with prompt length: {len(ai_prompt)} chars")
        ai_response = await generate_ai_content(ai_prompt, "You are an expert climate educator creating personalized learning paths.")
        logger.info(f"✅ AI response received, length: {len(ai_response)} chars")
        
        # Parse AI response or use fallback
        try:
            personalized_path = json.loads(ai_response)
            logger.info(f"✅ AI JSON parsed successfully: keys={list(personalized_path.keys())}")
        except Exception as parse_error:
            logger.warning(f"⚠️ AI JSON parsing failed: {parse_error}, using fallback")
            # Fallback personalized path
            # Handle empty interests safely
            interests_text = ", ".join(request.interests[:2]) if request.interests else "climate change and sustainability"
            first_interest = request.interests[0] if request.interests else "climate"
            
            personalized_path = {
                "welcome_message": f"Welcome to EcoQuest! Ready to become a climate hero? Based on your interests in {interests_text}, we've created an exciting journey just for you!",
                "learning_modules": [
                    {"title": "Climate Basics", "icon": "🌍", "progress": 0},
                    {"title": f"{first_interest.title()} Deep Dive", "icon": "🔍", "progress": 0},
                    {"title": "Carbon Footprint", "icon": "👣", "progress": 0},
                    {"title": "Green Solutions", "icon": "🌱", "progress": 0},
                    {"title": "Take Action", "icon": "⚡", "progress": 0}
                ],
                "first_quest": "Calculate your carbon footprint and discover 3 easy ways to reduce it today!",
                "daily_tip": "Did you know? Unplugging devices when not in use can save up to 10% on your electricity bill!"
            }
        
        logger.info(f"🟢 Onboarding successful for user: {user.id}")
        return OnboardingResponse(
            user_id=user.id,
            personalized_path=personalized_path,
            welcome_message=personalized_path.get("welcome_message", "Welcome to EcoQuest!")
        )
        
    except Exception as e:
        logging.error(f"Onboarding error: {e}")
        raise HTTPException(status_code=500, detail="Onboarding failed")

@api_router.post("/calculate-impact")
async def calculate_impact(request: HabitInput):
    logger.info(f"📊 Impact calculation request: user={request.user_id}, transport={request.transport}, diet={request.diet}, energy={request.energy_usage}, waste={request.waste_habits}")
    try:
        # Calculate CO2 impact
        impact_data = calculate_co2_impact(
            request.transport, request.diet,
            request.energy_usage, request.waste_habits
        )
        logger.info(f"🔢 CO2 calculation: daily={impact_data['daily_co2']:.1f}kg, yearly={impact_data['yearly_co2']:.0f}kg")
        
        # Generate suggestions
        suggestions = generate_suggestions(
            request.transport, request.diet,
            request.energy_usage, request.waste_habits
        )
        logger.info(f"💡 Generated {len(suggestions)} suggestions")
        
        # Generate positive impact message with AI
        ai_prompt = f"""
        A user has a daily CO2 footprint of {impact_data['daily_co2']:.1f}kg.
        Create an encouraging message about the positive impact if 1000 similar users made better choices.
        Keep it under 50 words and inspiring.
        """
        
        logger.info("🤖 Generating positive impact message")
        positive_impact = await generate_ai_content(ai_prompt)
        
        # Save user progress
        progress = UserProgress(
            user_id=request.user_id,
            current_co2_footprint=impact_data['daily_co2'],
            daily_habits={
                "transport": request.transport,
                "diet": request.diet,
                "energy": request.energy_usage,
                "waste": request.waste_habits
            }
        )
        
        db_result = await db.user_progress.replace_one(
            {"user_id": request.user_id},
            progress.dict(),
            upsert=True
        )
        logger.info(f"💾 User progress saved: matched={db_result.matched_count}, modified={db_result.modified_count}")
        
        logger.info(f"🟢 Impact calculation successful for user: {request.user_id}")
        return ImpactSimulation(
            daily_co2=impact_data['daily_co2'],
            weekly_co2=impact_data['weekly_co2'],
            yearly_co2=impact_data['yearly_co2'],
            suggestions=suggestions,
            positive_impact=positive_impact
        )
        
    except Exception as e:
        logging.error(f"Impact calculation error: {e}")
        raise HTTPException(status_code=500, detail="Impact calculation failed")

@api_router.post("/what-if")
async def what_if_scenario(request: WhatIfRequest):
    logger.info(f"🧠 What-if scenario request: '{request.scenario[:50]}...'")
    try:
        ai_prompt = f"""
        Create an engaging "What if?" climate scenario response for: "{request.scenario}"
        
        Include:
        - A brief, engaging narrative (100-150 words)
        - Key environmental impact numbers
        - Connection to user's daily life
        - One actionable step they can take
        
        Make it inspiring and scientifically grounded but accessible.
        """
        
        logger.info("🤖 Generating what-if scenario response")
        response = await generate_ai_content(ai_prompt)
        logger.info(f"✅ What-if response generated, length: {len(response)} chars")
        return {"scenario_response": response}
        
    except Exception as e:
        logging.error(f"What-if scenario error: {e}")
        raise HTTPException(status_code=500, detail="Scenario generation failed")

@api_router.post("/local-actions")
async def get_local_actions(request: LocalActionRequest):
    logger.info(f"📍 Local actions request: location={request.location}, interests={request.interests}")
    try:
        ai_prompt = f"""
        Generate 5 specific local environmental actions for someone in {request.location}
        interested in {', '.join(request.interests)}.
        
        Format as JSON array with objects containing:
        - title: Action title
        - description: Brief description
        - impact: Environmental benefit
        - difficulty: "easy", "medium", "hard"
        
        Focus on realistic, location-specific actions.
        """
        
        logger.info("🤖 Generating local actions with AI")
        response = await generate_ai_content(ai_prompt)
        logger.info(f"✅ Local actions AI response length: {len(response)} chars")
        
        try:
            actions = json.loads(response)
            logger.info(f"✅ Local actions JSON parsed: {len(actions) if isinstance(actions, list) else 'invalid'} items")
        except Exception as parse_error:
            logger.warning(f"⚠️ Local actions JSON parsing failed: {parse_error}, using fallback")
            # Fallback actions
            actions = [
                {
                    "title": "Join a local beach/park cleanup",
                    "description": "Connect with environmental groups in your area",
                    "impact": "Remove 50+ pieces of litter per hour",
                    "difficulty": "easy"
                },
                {
                    "title": "Start a community garden",
                    "description": "Transform unused space into green areas",
                    "impact": "Absorb 40kg CO2 per year per plot",
                    "difficulty": "medium"
                }
            ]
        
        logger.info(f"🟢 Local actions successful: {len(actions)} actions returned")
        return {"local_actions": actions}
        
    except Exception as e:
        logging.error(f"Local actions error: {e}")
        raise HTTPException(status_code=500, detail="Local actions retrieval failed")

@api_router.get("/user/{user_id}")
async def get_user(user_id: str):
    logger.info(f"👤 Get user request: {user_id}")
    try:
        user = await db.users.find_one({"id": user_id})
        if not user:
            logger.warning(f"⚠️ User not found: {user_id}")
            raise HTTPException(status_code=404, detail="User not found")
        logger.info(f"✅ User retrieved successfully: {user_id}")
        return User(**user)
    except Exception as e:
        logger.error(f"❌ Get user error for {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user")

@api_router.post("/learning-content")
async def get_learning_content(request: dict):
    """Generate AI-powered learning content based on user preferences"""
    logger.info(f"📚 Learning content request: {request}")
    try:
        user_id = request.get("user_id")
        topic = request.get("topic", "climate change")
        
        # Get user data for personalization
        user = await db.users.find_one({"id": user_id}) if user_id else None
        
        if user:
            ai_prompt = f"""
            Create engaging learning content about {topic} for a {user['age']}-year-old with {user['knowledge_level']} knowledge level.
            Their interests include: {', '.join(user['interests'])}.
            They prefer {user['learning_style']} learning style.
            
            Generate a JSON response with:
            - title: Engaging lesson title
            - content: Educational content (200-300 words)
            - key_points: 3-5 key takeaways
            - action_items: 2-3 actionable steps
            - fun_fact: One interesting climate fact
            - quiz_question: One multiple choice question with 4 options and correct answer
            
            Make it age-appropriate and engaging.
            """
        else:
            ai_prompt = f"""
            Create engaging learning content about {topic} for general audience.
            
            Generate a JSON response with:
            - title: Engaging lesson title
            - content: Educational content (200-300 words)
            - key_points: 3-5 key takeaways
            - action_items: 2-3 actionable steps
            - fun_fact: One interesting climate fact
            - quiz_question: One multiple choice question with 4 options and correct answer
            """
        
        logger.info("🤖 Generating learning content with AI")
        response = await generate_ai_content(ai_prompt, "You are an expert climate educator creating engaging learning content.")
        logger.info(f"✅ Learning content generated, length: {len(response)} chars")
        
        try:
            content = json.loads(response)
            logger.info(f"✅ Learning content JSON parsed successfully")
            return {"learning_content": content}
        except Exception as parse_error:
            logger.warning(f"⚠️ Learning content JSON parsing failed: {parse_error}")
            return {"error": "Failed to generate structured learning content"}
        
    except Exception as e:
        logger.error(f"❌ Learning content error: {e}")
        raise HTTPException(status_code=500, detail="Learning content generation failed")

@api_router.get("/")
async def root():
    return {"message": "EcoQuest API is running! 🌍"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        "http://localhost:19006",  # Expo dev server
        "http://localhost:8081",   # React Native Metro
        "http://192.168.1.*",      # Local network for Expo
        "capacitor://localhost",   # Capacitor iOS
        "http://localhost",        # Web fallback
        "exp://*.*.*.*:*"          # Expo Go
    ],
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()