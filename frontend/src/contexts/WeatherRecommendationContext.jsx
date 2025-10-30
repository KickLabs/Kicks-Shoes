import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const WeatherRecommendationContext = createContext(null);

export const useWeatherRecommendation = () => {
  const context = useContext(WeatherRecommendationContext);
  if (!context) {
    throw new Error('useWeatherRecommendation must be used within WeatherRecommendationProvider');
  }
  return context;
};

export const WeatherRecommendationProvider = ({ children }) => {
  const [cache, setCache] = useState({
    male: null,
    female: null,
    unisex: null,
  });
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(null);

  // Load cache from localStorage on mount
  useEffect(() => {
    const savedCache = localStorage.getItem('weatherRecommendationCache');
    const savedWeather = localStorage.getItem('weatherData');
    const savedTime = localStorage.getItem('weatherRecommendationTime');

    if (savedCache && savedWeather && savedTime) {
      const cacheAge = Date.now() - parseInt(savedTime);
      // Cache valid for 30 minutes
      if (cacheAge < 30 * 60 * 1000) {
        setCache(JSON.parse(savedCache));
        setWeather(JSON.parse(savedWeather));
        setLastFetchTime(parseInt(savedTime));
      } else {
        // Clear expired cache
        localStorage.removeItem('weatherRecommendationCache');
        localStorage.removeItem('weatherData');
        localStorage.removeItem('weatherRecommendationTime');
      }
    }
  }, []);

  /**
   * Pre-fetch recommendations for all genders
   */
  const prefetchRecommendations = useCallback(async weatherData => {
    if (!weatherData) return;

    setWeather(weatherData);
    setLoading(true);

    const genders = ['male', 'female', 'unisex'];
    const results = {};

    try {
      // Fetch all genders in parallel
      const promises = genders.map(async gender => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/weather/recommendations`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                temperature: weatherData.temperature,
                weather: weatherData.main,
                gender: gender,
                humidity: weatherData.humidity,
                windSpeed: weatherData.windSpeed,
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              results[gender] = data.data;
            }
          }
        } catch (error) {
          console.error(`Error fetching recommendations for ${gender}:`, error);
          results[gender] = null;
        }
      });

      await Promise.all(promises);

      // Save to state and localStorage
      setCache(results);
      const now = Date.now();
      setLastFetchTime(now);

      localStorage.setItem('weatherRecommendationCache', JSON.stringify(results));
      localStorage.setItem('weatherData', JSON.stringify(weatherData));
      localStorage.setItem('weatherRecommendationTime', now.toString());

      console.log('✅ Pre-fetched recommendations for all genders:', results);
    } catch (error) {
      console.error('Error pre-fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get cached recommendation for specific gender
   */
  const getRecommendation = useCallback(
    gender => {
      return cache[gender];
    },
    [cache]
  );

  /**
   * Refresh recommendations (manual reload)
   */
  const refreshRecommendations = useCallback(async () => {
    if (weather) {
      // Clear cache first
      setCache({
        male: null,
        female: null,
        unisex: null,
      });
      localStorage.removeItem('weatherRecommendationCache');

      // Re-fetch
      await prefetchRecommendations(weather);
    }
  }, [weather, prefetchRecommendations]);

  /**
   * Check if cache is available for gender
   */
  const isCached = useCallback(
    gender => {
      return cache[gender] !== null;
    },
    [cache]
  );

  /**
   * Get cache age in minutes
   */
  const getCacheAge = useCallback(() => {
    if (!lastFetchTime) return null;
    return Math.floor((Date.now() - lastFetchTime) / 1000 / 60);
  }, [lastFetchTime]);

  const value = {
    cache,
    weather,
    loading,
    lastFetchTime,
    prefetchRecommendations,
    getRecommendation,
    refreshRecommendations,
    isCached,
    getCacheAge,
  };

  return (
    <WeatherRecommendationContext.Provider value={value}>
      {children}
    </WeatherRecommendationContext.Provider>
  );
};
