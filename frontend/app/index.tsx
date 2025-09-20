import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Dimensions,
  Platform,
  TextInput
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

console.log('=== EcoQuest Debug Info ===');
console.log('🔍 Backend URL:', BACKEND_URL || '❌ NOT SET - Check .env file');
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('📱 Platform:', Platform.OS);
console.log('🌐 Network reachable:', true); // Add actual network check if needed

interface User {
  id: string;
  age: number;
  interests: string[];
  knowledge_level: string;
  learning_style: string;
  location?: string;
  points: number;
  level: number;
}

interface LocalAction {
  title: string;
  description: string;
  impact: string;
  difficulty: string;
}

interface Lesson {
  title: string;
  description: string;
  duration: string;
  difficulty: string;
}

interface OnboardingData {
  age: number;
  interests: string[];
  knowledge_level: string;
  learning_style: string;
  location?: string;
}

interface HabitData {
  transport: string;
  diet: string;
  energy_usage: string;
  waste_habits: string;
}

interface ImpactResult {
  daily_co2: number;
  weekly_co2: number;
  yearly_co2: number;
  suggestions: string[];
  positive_impact: string;
}

export default function EcoQuestApp() {
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'onboarding' | 'dashboard' | 'impact' | 'whatif' | 'local-actions' | 'learn-grow'>('welcome');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<string>('');
  
  // Onboarding state
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    age: 18,
    interests: [],
    knowledge_level: 'beginner',
    learning_style: 'mixed'
  });
  
  // Impact calculator state
  const [habitData, setHabitData] = useState<HabitData>({
    transport: 'car',
    diet: 'meat',
    energy_usage: 'medium',
    waste_habits: 'average'
  });
  
  const [impactResult, setImpactResult] = useState<ImpactResult | null>(null);
  const [whatIfInput, setWhatIfInput] = useState('');
  const [whatIfResponse, setWhatIfResponse] = useState('');
  
  // Learn & Grow screen state
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  
  // Local Actions screen state
  const [actionsLoading, setActionsLoading] = useState(false);
  const [actions, setActions] = useState<LocalAction[]>([]);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Fetch local actions when screen changes to local-actions
  useEffect(() => {
    if (currentScreen === 'local-actions') {
      fetchLocalActions();
    }
  }, [currentScreen, user]);

  // Fetch learning content when screen changes to learn-grow
  useEffect(() => {
    if (currentScreen === 'learn-grow') {
      fetchLearningContent();
    }
  }, [currentScreen, user]);

  const fetchLocalActions = async () => {
    console.log('📍 Fetching local actions...');
    setActionsLoading(true);
    try {
      if (!user) {
        console.warn('⚠️ No user found, using fallback local actions');
        const fallbackActions = [
          { title: 'Community Cleanup', description: 'Join local environmental cleanup', impact: 'Remove litter from local areas', difficulty: 'easy' },
          { title: 'Tree Planting Event', description: 'Participate in local tree planting', impact: 'Add green spaces to community', difficulty: 'medium' }
        ];
        setActions(fallbackActions);
        setActionsLoading(false);
        return;
      }

      const requestData = {
        location: user.location || 'your city',
        interests: user.interests || ['general']
      };
      console.log('📤 Local actions request:', JSON.stringify(requestData, null, 2));

      console.log(`🌐 Making request to: ${BACKEND_URL}/api/local-actions`);
      const response = await fetch(`${BACKEND_URL}/api/local-actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      console.log('📡 Local actions response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Local actions API error:', response.status, errorText);
        throw new Error(`Local actions failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Local actions response:', JSON.stringify(result, null, 2));
      
      if (!result.local_actions || !Array.isArray(result.local_actions)) {
        console.error('⚠️ Invalid local actions response:', result);
        throw new Error('Invalid response format from server');
      }
      
      console.log(`🎯 Setting ${result.local_actions.length} local actions`);
      setActions(result.local_actions);
      
    } catch (error) {
      console.error('💥 Local actions error:', error);
      const fallbackActions = [
        { title: 'Community Cleanup', description: 'Join local environmental cleanup', impact: 'Remove litter from local areas', difficulty: 'easy' },
        { title: 'Tree Planting Event', description: 'Participate in local tree planting', impact: 'Add green spaces to community', difficulty: 'medium' }
      ];
      console.log('📋 Using fallback local actions');
      setActions(fallbackActions);
    } finally {
      console.log('🔄 Local actions loading state reset');
      setActionsLoading(false);
    }
  };

  const fetchLearningContent = async () => {
    console.log('📚 Fetching AI-powered learning content...');
    setLessonsLoading(true);
    try {
      if (!user) {
        console.warn('⚠️ No user found for personalized content – showing starter lessons');
        const fallbackLessons: Lesson[] = [
          {
            title: 'Climate Change 101',
            description: 'A quick primer on climate science, greenhouse gases, and why warming matters.',
            duration: '10 min',
            difficulty: 'beginner',
          },
          {
            title: 'Your Carbon Footprint',
            description: 'Understand what activities contribute most to personal emissions and how to measure them.',
            duration: '12 min',
            difficulty: 'beginner',
          },
          {
            title: 'Simple Actions That Matter',
            description: 'Everyday tips with outsized impact: food choices, transportation, energy, and waste.',
            duration: '15 min',
            difficulty: 'beginner',
          },
        ];
        setLessons(fallbackLessons);
        setLessonsLoading(false);
        return;
      }

      const requestData = {
        user_id: user.id,
        topic: user.interests.length > 0 ? user.interests[0] : 'climate change'
      };
      console.log('📤 Learning content request:', JSON.stringify(requestData, null, 2));

      console.log(`🌐 Making request to: ${BACKEND_URL}/api/learning-content`);
      const response = await fetch(`${BACKEND_URL}/api/learning-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      console.log('📡 Learning content response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Learning content API error:', response.status, errorText);
        throw new Error(`Learning content failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Learning content response:', JSON.stringify(result, null, 2));
      
      if (result.error) {
        console.error('⚠️ Learning content generation error:', result.error);
        throw new Error(result.error);
      }
      
      if (!result.learning_content) {
        console.error('⚠️ Missing learning_content in response');
        throw new Error('Invalid response from server');
      }
      
      // Convert AI learning content to lesson format
      const content = result.learning_content;
      const aiLessons = [{
        title: content.title || 'AI-Generated Climate Lesson',
        description: content.content ? content.content.substring(0, 150) + '...' : 'Personalized climate education content',
        duration: '20 min',
        difficulty: user.knowledge_level || 'medium'
      }];
      
      // Add more lessons based on user interests
      user.interests.slice(1, 4).forEach((interest, index) => {
        aiLessons.push({
          title: `${interest.charAt(0).toUpperCase() + interest.slice(1)} Focus`,
          description: `Deep dive into ${interest} and climate impact`,
          duration: `${15 + index * 5} min`,
          difficulty: user.knowledge_level || 'medium'
        });
      });
      
      console.log('📖 Setting AI-generated lessons:', aiLessons.length);
      setLessons(aiLessons);
      
    } catch (error) {
      console.error('💥 Learning content error:', error);
      const fallbackLessons: Lesson[] = [
        {
          title: 'Climate Change 101',
          description: 'A quick primer on climate science, greenhouse gases, and why warming matters.',
          duration: '10 min',
          difficulty: user?.knowledge_level || 'beginner',
        },
        {
          title: 'Your Carbon Footprint',
          description: 'Understand what activities contribute most to personal emissions and how to measure them.',
          duration: '12 min',
          difficulty: user?.knowledge_level || 'beginner',
        },
        {
          title: 'Simple Actions That Matter',
          description: 'Everyday tips with outsized impact: food choices, transportation, energy, and waste.',
          duration: '15 min',
          difficulty: user?.knowledge_level || 'beginner',
        },
      ];
      setLessons(fallbackLessons);
    } finally {
      console.log('🔄 Learning content loading state reset');
      setLessonsLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const geocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (geocode.length > 0) {
          const address = geocode[0];
          setLocation(`${address.city || address.region || 'Your location'}, ${address.country || ''}`);
        }
      }
    } catch (error) {
      console.log('Location permission error:', error);
      setLocation('Location not available');
    }
  };

  const completeOnboarding = async () => {
    console.log('🚀 Starting onboarding process...');
    setLoading(true);
    try {
      const requestData = {
        ...onboardingData,
        location: location || undefined
      };
      console.log('📤 Onboarding request data:', JSON.stringify(requestData, null, 2));
  
      console.log(`🌐 Making request to: ${BACKEND_URL}/api/onboarding`);
      const response = await fetch(`${BACKEND_URL}/api/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
  
      console.log('📡 Onboarding response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Onboarding API error:', response.status, errorText);
        throw new Error(`Onboarding failed: ${response.status} ${errorText}`);
      }
  
      const result = await response.json();
      console.log('✅ Onboarding response:', JSON.stringify(result, null, 2));
      
      if (!result.user_id) {
        console.error('⚠️ Missing user_id in onboarding response');
        throw new Error('Invalid response from server');
      }
      
      const newUser = {
        id: result.user_id,
        ...onboardingData,
        points: 100,
        level: 1
      };
      console.log('👤 Setting user state:', newUser);
      setUser(newUser);
      
      setCurrentScreen('dashboard');
      const welcomeMsg = result.welcome_message || 'Welcome to EcoQuest!';
      console.log('🎉 Onboarding successful, showing welcome:', welcomeMsg);
      Alert.alert('Welcome!', welcomeMsg);
      
    } catch (error) {
      console.error('💥 Onboarding error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to complete onboarding: ${errorMessage}. Please check your connection and try again.`);
    } finally {
      console.log('🔄 Onboarding loading state reset');
      setLoading(false);
    }
  };

  const calculateImpact = async () => {
    if (!user) {
      console.warn('⚠️ No user found, cannot calculate impact');
      return;
    }
    
    console.log('📊 Starting impact calculation...');
    setLoading(true);
    try {
      const requestData = {
        user_id: user.id,
        ...habitData
      };
      console.log('📤 Impact calculation request:', JSON.stringify(requestData, null, 2));
  
      console.log(`🌐 Making request to: ${BACKEND_URL}/api/calculate-impact`);
      const response = await fetch(`${BACKEND_URL}/api/calculate-impact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
  
      console.log('📡 Impact response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Impact API error:', response.status, errorText);
        throw new Error(`Impact calculation failed: ${response.status} ${errorText}`);
      }
  
      const result = await response.json();
      console.log('✅ Impact calculation result:', JSON.stringify(result, null, 2));
      
      if (!result.daily_co2) {
        console.error('⚠️ Invalid impact response, missing daily_co2');
        throw new Error('Invalid response from server');
      }
      
      console.log('📈 Setting impact result state');
      setImpactResult(result);
      
    } catch (error) {
      console.error('💥 Impact calculation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to calculate impact: ${errorMessage}`);
    } finally {
      console.log('🔄 Impact loading state reset');
      setLoading(false);
    }
  };

  const askWhatIf = async () => {
    if (!whatIfInput.trim()) {
      console.warn('⚠️ Empty what-if input, aborting');
      return;
    }
    
    console.log(`🧠 Asking what-if: "${whatIfInput}"`);
    setLoading(true);
    try {
      const requestData = {
        scenario: whatIfInput
      };
      console.log('📤 What-if request:', JSON.stringify(requestData, null, 2));
  
      console.log(`🌐 Making request to: ${BACKEND_URL}/api/what-if`);
      const response = await fetch(`${BACKEND_URL}/api/what-if`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
  
      console.log('📡 What-if response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ What-if API error:', response.status, errorText);
        throw new Error(`What-if scenario failed: ${response.status} ${errorText}`);
      }
  
      const result = await response.json();
      console.log('✅ What-if response:', JSON.stringify(result, null, 2));
      
      if (!result.scenario_response) {
        console.error('⚠️ Missing scenario_response in what-if result');
        throw new Error('Invalid response from server');
      }
      
      console.log('💭 Setting what-if response state');
      setWhatIfResponse(result.scenario_response);
      
    } catch (error) {
      console.error('💥 What-if error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to generate scenario: ${errorMessage}`);
      setWhatIfResponse('Unable to generate response. Please try again later.');
    } finally {
      console.log('🔄 What-if loading state reset');
      setLoading(false);
    }
  };

  const renderWelcomeScreen = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>🌍 EcoQuest</Text>
          <Text style={styles.heroSubtitle}>Your AI Climate Adventure</Text>
          <Text style={styles.heroDescription}>
            Join millions in the fight against climate change. Get personalized learning, 
            track your impact, and discover actions that matter.
          </Text>
        </View>
        
        <View style={styles.featuresContainer}>
          <View style={styles.featureCard}>
            <Ionicons name="school" size={32} color="#4CAF50" />
            <Text style={styles.featureTitle}>AI-Powered Learning</Text>
            <Text style={styles.featureText}>Personalized education paths</Text>
          </View>
          
          <View style={styles.featureCard}>
            <Ionicons name="analytics" size={32} color="#2196F3" />
            <Text style={styles.featureTitle}>Impact Simulator</Text>
            <Text style={styles.featureText}>See your environmental footprint</Text>
          </View>
          
          <View style={styles.featureCard}>
            <Ionicons name="location" size={32} color="#FF9800" />
            <Text style={styles.featureTitle}>Local Actions</Text>
            <Text style={styles.featureText}>Find climate actions nearby</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={() => {
            console.log('🟢 Start Your Journey button pressed!');
            setCurrentScreen('onboarding');
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.primaryButtonText}>Start Your Journey</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  const renderOnboardingScreen = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.screenTitle}>Let's Personalize Your Journey</Text>
        
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Your Age</Text>
          <View style={styles.ageButtons}>
            {['12-17', '18-25', '26-35', '36+'].map((ageRange, index) => (
              <TouchableOpacity
                key={ageRange}
                style={[
                  styles.optionButton,
                  onboardingData.age === [15, 22, 30, 40][index] && styles.optionButtonSelected
                ]}
                onPress={() => setOnboardingData({...onboardingData, age: [15, 22, 30, 40][index]})}
              >
                <Text style={[
                  styles.optionButtonText,
                  onboardingData.age === [15, 22, 30, 40][index] && styles.optionButtonTextSelected
                ]}>
                  {ageRange}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Your Interests</Text>
          <View style={styles.interestGrid}>
            {[
              { key: 'oceans', icon: '🌊', label: 'Oceans' },
              { key: 'forests', icon: '🌲', label: 'Forests' },
              { key: 'energy', icon: '⚡', label: 'Energy' },
              { key: 'waste', icon: '♻️', label: 'Waste' },
              { key: 'transport', icon: '🚗', label: 'Transport' },
              { key: 'food', icon: '🥗', label: 'Food' }
            ].map((interest) => (
              <TouchableOpacity
                key={interest.key}
                style={[
                  styles.interestCard,
                  onboardingData.interests.includes(interest.key) && styles.interestCardSelected
                ]}
                onPress={() => {
                  const newInterests = onboardingData.interests.includes(interest.key)
                    ? onboardingData.interests.filter(i => i !== interest.key)
                    : [...onboardingData.interests, interest.key];
                  setOnboardingData({...onboardingData, interests: newInterests});
                }}
              >
                <Text style={styles.interestIcon}>{interest.icon}</Text>
                <Text style={styles.interestLabel}>{interest.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Knowledge Level</Text>
          <View style={styles.optionRow}>
            {['beginner', 'intermediate', 'advanced'].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.optionButton,
                  onboardingData.knowledge_level === level && styles.optionButtonSelected
                ]}
                onPress={() => setOnboardingData({...onboardingData, knowledge_level: level})}
              >
                <Text style={[
                  styles.optionButtonText,
                  onboardingData.knowledge_level === level && styles.optionButtonTextSelected
                ]}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} 
          onPress={completeOnboarding}
          disabled={loading || onboardingData.interests.length === 0}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Creating Your Adventure...' : 'Start Adventure'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  const renderDashboard = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <View style={styles.userStats}>
            <View style={styles.statCard}>
              <Ionicons name="trophy" size={24} color="#FFD700" />
              <Text style={styles.statNumber}>{user?.points || 0}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trending-up" size={24} color="#4CAF50" />
              <Text style={styles.statNumber}>Level {user?.level || 1}</Text>
              <Text style={styles.statLabel}>Climate Hero</Text>
            </View>
          </View>
        </View>

        <View style={styles.questGrid}>
          <TouchableOpacity 
            style={styles.questCard}
            onPress={() => setCurrentScreen('impact')}
          >
            <Ionicons name="analytics" size={40} color="#2196F3" />
            <Text style={styles.questTitle}>Impact Simulator</Text>
            <Text style={styles.questDescription}>Calculate your carbon footprint</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.questCard}
            onPress={() => setCurrentScreen('whatif')}
          >
            <Ionicons name="bulb" size={40} color="#FF9800" />
            <Text style={styles.questTitle}>What If?</Text>
            <Text style={styles.questDescription}>Explore climate scenarios</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.questCard}
            onPress={() => {
              console.log('📍 Navigating to Local Actions screen');
              setCurrentScreen('local-actions');
            }}
          >
            <Ionicons name="location" size={40} color="#9C27B0" />
            <Text style={styles.questTitle}>Local Actions</Text>
            <Text style={styles.questDescription}>Find actions near you</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.questCard}
            onPress={() => {
              console.log('📚 Navigating to Learn & Grow screen');
              setCurrentScreen('learn-grow');
            }}
          >
            <Ionicons name="school" size={40} color="#4CAF50" />
            <Text style={styles.questTitle}>Learn & Grow</Text>
            <Text style={styles.questDescription}>Personalized lessons</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  const renderImpactScreen = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentScreen('dashboard')}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Impact Simulator</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>🚗 Transport</Text>
          <View style={styles.optionRow}>
            {[
              { key: 'walk', label: 'Walk', icon: '🚶' },
              { key: 'bike', label: 'Bike', icon: '🚴' },
              { key: 'public', label: 'Public', icon: '🚌' },
              { key: 'car', label: 'Car', icon: '🚗' }
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.habitOption,
                  habitData.transport === option.key && styles.habitOptionSelected
                ]}
                onPress={() => setHabitData({...habitData, transport: option.key})}
              >
                <Text style={styles.habitIcon}>{option.icon}</Text>
                <Text style={styles.habitLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>🍽️ Diet</Text>
          <View style={styles.optionRow}>
            {[
              { key: 'vegan', label: 'Vegan', icon: '🥗' },
              { key: 'vegetarian', label: 'Vegetarian', icon: '🥕' },
              { key: 'pescatarian', label: 'Pescatarian', icon: '🐟' },
              { key: 'meat', label: 'Meat', icon: '🥩' }
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.habitOption,
                  habitData.diet === option.key && styles.habitOptionSelected
                ]}
                onPress={() => setHabitData({...habitData, diet: option.key})}
              >
                <Text style={styles.habitIcon}>{option.icon}</Text>
                <Text style={styles.habitLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} 
          onPress={calculateImpact}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Calculating...' : 'Calculate My Impact'}
          </Text>
        </TouchableOpacity>

        {impactResult && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Your Carbon Footprint</Text>
            <View style={styles.impactStats}>
              <View style={styles.impactStat}>
                <Text style={styles.impactNumber}>{impactResult.daily_co2.toFixed(1)}</Text>
                <Text style={styles.impactLabel}>kg CO₂/day</Text>
              </View>
              <View style={styles.impactStat}>
                <Text style={styles.impactNumber}>{(impactResult.yearly_co2 / 1000).toFixed(1)}</Text>
                <Text style={styles.impactLabel}>tons CO₂/year</Text>
              </View>
            </View>
            
            <Text style={styles.suggestionsTitle}>💡 Ways to Improve:</Text>
            {impactResult.suggestions.map((suggestion, index) => (
              <Text key={index} style={styles.suggestion}>{suggestion}</Text>
            ))}
            
            <View style={styles.positiveImpact}>
              <Text style={styles.positiveImpactText}>{impactResult.positive_impact}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  const renderLocalActionsScreen = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentScreen('dashboard')}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Local Actions</Text>
        </View>
        
        {actionsLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Finding actions near you...</Text>
          </View>
        ) : (
          <View style={styles.actionsContainer}>
            {actions.map((action, index) => (
              <View key={index} style={styles.actionCard}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionDescription}>{action.description}</Text>
                <Text style={styles.actionImpact}>{action.impact}</Text>
                <View style={styles.difficultyBadge}>
                  <Text style={styles.difficultyText}>{action.difficulty}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  const renderLearnGrowScreen = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentScreen('dashboard')}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Learn & Grow</Text>
        </View>

        {!user && (
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerText}>
              Complete onboarding to get personalized lessons. Showing starter lessons for now.
            </Text>
          </View>
        )}
        
        {lessonsLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading your personalized lessons...</Text>
          </View>
        ) : (
          <View style={styles.lessonsContainer}>
            {lessons.map((lesson, index) => (
              <View key={index} style={styles.lessonCard}>
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                <Text style={styles.lessonDescription}>{lesson.description}</Text>
                <View style={styles.lessonMeta}>
                  <Text style={styles.lessonDuration}>{lesson.duration}</Text>
                  <Text style={styles.lessonDifficulty}>{lesson.difficulty}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  const renderWhatIfScreen = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentScreen('dashboard')}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>What If? Scenarios</Text>
        </View>

        <Text style={styles.sectionTitle}>Ask a Climate Question</Text>
        <Text style={styles.sectionDescription}>
          Explore "what if" scenarios about climate change and environmental impact.
        </Text>

        <View style={styles.whatIfExamples}>
          <Text style={styles.examplesTitle}>Try asking:</Text>
          {[
            "What if all cars were electric?",
            "What if we stopped deforestation?",
            "What if everyone ate plant-based?",
          ].map((example, index) => (
            <TouchableOpacity
              key={index}
              style={styles.exampleButton}
              onPress={() => setWhatIfInput(example)}
            >
              <Text style={styles.exampleText}>{example}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Your Question:</Text>
          <TextInput
            style={styles.textInput}
            value={whatIfInput}
            onChangeText={setWhatIfInput}
            placeholder="Type your climate question here..."
            placeholderTextColor="#9FB3C8"
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity 
          style={[styles.primaryButton, (loading || !whatIfInput) && styles.primaryButtonDisabled]} 
          onPress={askWhatIf}
          disabled={loading || !whatIfInput}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Generating Response...' : 'Explore Scenario'}
          </Text>
        </TouchableOpacity>

        {whatIfResponse && (
          <View style={styles.responseCard}>
            <Text style={styles.responseTitle}>🌍 Climate Scenario Results</Text>
            <ScrollView style={styles.responseContainer} showsVerticalScrollIndicator={false}>
              {formatWhatIfResponse(whatIfResponse)}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  // Main render
  switch (currentScreen) {
    case 'welcome':
      return renderWelcomeScreen();
    case 'onboarding':
      return renderOnboardingScreen();
    case 'dashboard':
      return renderDashboard();
    case 'impact':
      return renderImpactScreen();
    case 'local-actions':
      return renderLocalActionsScreen();
    case 'learn-grow':
      return renderLearnGrowScreen();
    case 'whatif':
      return renderWhatIfScreen();
    default:
      return renderWelcomeScreen();
  }
}

const formatWhatIfResponse = (response: string) => {
  // Split response into paragraphs and format for display
  const paragraphs = response.split('\n\n').filter(p => p.trim());
  return paragraphs.map((paragraph, index) => (
    <View key={index} style={{ marginBottom: 16 }}>
      <Text style={styles.responseText}>{paragraph}</Text>
    </View>
  ));
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 24,
    color: '#E0E6ED',
    marginBottom: 20,
    fontWeight: '600',
  },
  heroDescription: {
    fontSize: 16,
    color: '#9FB3C8',
    textAlign: 'center',
    lineHeight: 24,
    marginHorizontal: 20,
  },
  featuresContainer: {
    marginBottom: 40,
  },
  featureCard: {
    backgroundColor: '#1B263B',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E0E6ED',
    marginTop: 12,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#9FB3C8',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    minHeight: 54, // Ensure minimum touch target
    elevation: 2, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  primaryButtonDisabled: {
    backgroundColor: '#2C5F2D',
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E0E6ED',
    marginBottom: 20,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E0E6ED',
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#9FB3C8',
    marginBottom: 20,
    lineHeight: 20,
  },
  ageButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#1B263B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1B263B',
  },
  optionButtonSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  optionButtonText: {
    color: '#9FB3C8',
    fontSize: 14,
    fontWeight: '600',
  },
  optionButtonTextSelected: {
    color: '#FFFFFF',
  },
  interestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  interestCard: {
    backgroundColor: '#1B263B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: (width - 64) / 2,
    borderWidth: 2,
    borderColor: '#1B263B',
  },
  interestCardSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  interestIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  interestLabel: {
    color: '#E0E6ED',
    fontSize: 14,
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E0E6ED',
    flex: 1,
  },
  userStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    backgroundColor: '#1B263B',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E0E6ED',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9FB3C8',
    marginTop: 2,
  },
  questGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  questCard: {
    backgroundColor: '#1B263B',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    width: (width - 56) / 2,
  },
  questTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E0E6ED',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  questDescription: {
    fontSize: 12,
    color: '#9FB3C8',
    textAlign: 'center',
  },
  habitOption: {
    backgroundColor: '#1B263B',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 70,
    borderWidth: 2,
    borderColor: '#1B263B',
  },
  habitOptionSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  habitIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  habitLabel: {
    fontSize: 12,
    color: '#E0E6ED',
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: '#1B263B',
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E0E6ED',
    marginBottom: 16,
    textAlign: 'center',
  },
  impactStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  impactStat: {
    alignItems: 'center',
  },
  impactNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  impactLabel: {
    fontSize: 14,
    color: '#9FB3C8',
    marginTop: 4,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E0E6ED',
    marginBottom: 12,
  },
  suggestion: {
    fontSize: 14,
    color: '#9FB3C8',
    marginBottom: 8,
    lineHeight: 20,
  },
  positiveImpact: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  positiveImpactText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 20,
  },
  whatIfExamples: {
    marginBottom: 24,
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E0E6ED',
    marginBottom: 12,
  },
  exampleButton: {
    backgroundColor: '#1B263B',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  exampleText: {
    color: '#9FB3C8',
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E0E6ED',
    marginBottom: 8,
  },
  textInputContainer: {
    backgroundColor: '#1B263B',
    padding: 16,
    borderRadius: 8,
    minHeight: 80,
    justifyContent: 'center',
  },
  textInput: {
    backgroundColor: '#1B263B',
    color: '#E0E6ED',
    fontSize: 14,
    lineHeight: 20,
    padding: 16,
    borderRadius: 8,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#415A77',
    textAlignVertical: 'top',
  },
  responseCard: {
    backgroundColor: '#1B263B',
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
  },
  responseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E0E6ED',
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#9FB3C8',
    textAlign: 'center',
  },
  actionsContainer: {
    padding: 20,
  },
  actionCard: {
    backgroundColor: '#1B263B',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E0E6ED',
    marginBottom: 8,
  },
  actionDescription: {
    fontSize: 14,
    color: '#9FB3C8',
    marginBottom: 4,
    lineHeight: 20,
  },
  actionImpact: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 8,
  },
  difficultyBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoBanner: {
    backgroundColor: '#14253D',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoBannerText: {
    color: '#9FB3C8',
    fontSize: 13,
    lineHeight: 18,
  },
  lessonsContainer: {
    padding: 20,
  },
  lessonCard: {
    backgroundColor: '#1B263B',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E0E6ED',
    marginBottom: 8,
  },
  lessonDescription: {
    fontSize: 14,
    color: '#9FB3C8',
    marginBottom: 12,
    lineHeight: 20,
  },
  lessonMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lessonDuration: {
    fontSize: 12,
    color: '#9FB3C8',
  },
  lessonDifficulty: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  responseContainer: {
    maxHeight: 300,
    marginTop: 16,
  },
  responseScrollView: {
    flex: 1,
  },
  responseText: {
    fontSize: 14,
    color: '#9FB3C8',
    lineHeight: 22,
  },
});