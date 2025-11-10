import React, { useState, useEffect } from 'react';
import './WeatherWidget.css';
import WeatherRecommendationModal from './WeatherRecommendationModal';
import { useWeatherRecommendation } from '../../contexts/WeatherRecommendationContext';

const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [showModal, setShowModal] = useState(false);
  const [showExpandedText, setShowExpandedText] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const [hasShownText, setHasShownText] = useState(false);
  const { prefetchRecommendations, loading: prefetchLoading, cache } = useWeatherRecommendation();

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('Browser does not support geolocation');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        fetchWeather(latitude, longitude);
        setLocationPermission('granted');
      },
      error => {
        console.error('Location error:', error);
        setLocationPermission('denied');
        setError('Unable to access location. Please allow location access.');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // Cache 5 minutes
      }
    );
  };

  const fetchWeather = async (lat, lon) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/weather/current?lat=${lat}&lon=${lon}`
      );

      if (!response.ok) {
        throw new Error('Unable to fetch weather data');
      }

      const data = await response.json();
      if (data.success) {
        setWeather(data.data);
        setError(null);

        // 🚀 Auto pre-fetch recommendations in background for all genders
        console.log('⚡ Starting background pre-fetch of recommendations...');
        prefetchRecommendations(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = iconCode => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  const getWeatherMessage = () => {
    if (!weather) return '';
    const description = weather.description.toLowerCase();

    // Detect weather condition
    if (
      description.includes('rain') ||
      description.includes('drizzle') ||
      description.includes('shower')
    ) {
      return 'Rainy! Got your outfit ready?';
    } else if (description.includes('sun') || description.includes('clear')) {
      return 'Sunny! Got your outfit ready?';
    } else if (description.includes('cloud')) {
      return 'Cloudy! Got your outfit ready?';
    } else if (description.includes('snow')) {
      return 'Snowy! Got your outfit ready?';
    } else if (description.includes('storm') || description.includes('thunder')) {
      return 'Stormy! Got your outfit ready?';
    } else {
      return 'Got your outfit ready?';
    }
  };

  const handleWidgetClick = () => {
    if (weather && !loading) {
      setShowModal(true);
    }
  };

  // Check if at least one recommendation is loaded
  const hasRecommendations = cache.male !== null || cache.female !== null || cache.unisex !== null;

  // Show expanded text when recommendations are ready (only once)
  useEffect(() => {
    if (hasRecommendations && weather && !hasShownText) {
      console.log('✨ Showing expanded text animation...');
      console.log('Weather:', weather.description);
      setHasShownText(true);

      const showTimer = setTimeout(() => {
        setShowExpandedText(true);
        console.log('📝 Text should be visible now');

        // Start hiding animation after 2.5 seconds
        const hideTimer = setTimeout(() => {
          setIsHiding(true);
          console.log('🔚 Starting hide animation');

          // Remove element after animation completes
          setTimeout(() => {
            setShowExpandedText(false);
            setIsHiding(false);
          }, 500);
        }, 2500);

        return () => clearTimeout(hideTimer);
      }, 500);

      return () => clearTimeout(showTimer);
    }
  }, [hasRecommendations, weather, hasShownText]);

  // Don't show widget if loading or no data
  if (loading || prefetchLoading) {
    return null; // Hide widget while loading
  }

  if (error || locationPermission === 'denied') {
    return null; // Hide widget on error
  }

  // Only show widget when we have both weather AND recommendations
  if (!weather || !hasRecommendations) {
    return null;
  }

  return (
    <>
      <div
        className="weather-widget"
        onClick={handleWidgetClick}
        role="button"
        tabIndex={0}
        title={`${weather.location}: ${weather.temperature}°C - ${weather.description}`}
      >
        {/* Notification dot indicator */}
        {/* <div className="weather-widget__notification-dot"></div> */}

        {/* Expanded text message */}
        {showExpandedText && (
          <div
            className={`weather-widget__expanded-text ${isHiding ? 'weather-widget__expanded-text--hiding' : ''}`}
          >
            {getWeatherMessage()}
          </div>
        )}

        <div className="weather-widget__container">
          <div className="weather-widget__icon">
            <img
              src={getWeatherIcon(weather.icon)}
              alt={weather.description}
              className="weather-widget__icon-img"
            />
            <div className="weather-widget__info">
              <div className="weather-widget__temp">{weather.temperature}°</div>
            </div>
          </div>
        </div>
        <div className="weather-widget__hint">
          <span className="weather-widget__hint-icon">✨</span>
          {prefetchLoading ? 'Loading suggestions...' : 'Outfit Suggestions'}
        </div>
      </div>

      {showModal && (
        <WeatherRecommendationModal weather={weather} onClose={() => setShowModal(false)} />
      )}
    </>
  );
};

export default WeatherWidget;
