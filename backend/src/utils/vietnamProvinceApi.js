/**
 * Vietnam Province API v2 Service
 * Updated to handle the latest province mergers in Vietnam
 * Districts have been removed from the administrative structure
 */

// Base URL for Vietnam Province API - using working endpoint
const BASE_URL = 'https://provinces.open-api.vn/api/v2';

/**
 * Fetch all provinces/cities with latest mergers
 * @returns {Promise<Array>} List of provinces
 */
export const fetchProvinces = async () => {
  try {
    console.log('Fetching provinces from:', `${BASE_URL}/p/`);
    const response = await fetch(`${BASE_URL}/p/`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Provinces data received:', data.slice(0, 3)); // Log first 3 items for debugging

    // This API returns array directly
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching provinces:', error);
    throw new Error('Unable to load province/city list');
  }
};

/**
 * Fetch wards/communes for a specific province
 * Note: Using depth=3 to get wards directly from province
 * @param {string} provinceCode - Province code
 * @returns {Promise<Array>} List of wards/communes
 */
export const fetchWards = async provinceCode => {
  try {
    console.log('Fetching wards for province:', provinceCode);
    const response = await fetch(`${BASE_URL}/p/${provinceCode}?depth=2`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Province data received:', data);
    console.log('Data structure check - districts:', data.districts);

    // Extract all wards from all districts in the province
    const allWards = [];
    if (data.districts && Array.isArray(data.districts)) {
      data.districts.forEach(district => {
        console.log('Processing district:', district.name, 'wards:', district.wards?.length || 0);
        if (district.wards && Array.isArray(district.wards)) {
          allWards.push(...district.wards);
        }
      });
    }

    console.log('Total extracted wards:', allWards.length);
    console.log('First few wards:', allWards.slice(0, 3));

    // If no wards found through districts, check if wards are directly in the data
    if (allWards.length === 0) {
      console.log('No wards found in districts, checking direct wards in data...');
      if (data.wards && Array.isArray(data.wards)) {
        console.log('Found direct wards:', data.wards.length);
        allWards.push(...data.wards);
      } else if (Array.isArray(data)) {
        console.log('Data is array, checking if it contains wards...');
        allWards.push(...data);
      }
    }

    console.log('Final wards count:', allWards.length);
    return allWards;
  } catch (error) {
    console.error('Error fetching wards:', error);
    throw new Error('Unable to load ward/commune list');
  }
};

/**
 * Get province details by code
 * @param {string} provinceCode - Province code
 * @returns {Promise<Object>} Province details
 */
export const getProvinceById = async provinceCode => {
  try {
    const response = await fetch(`${BASE_URL}/p/${provinceCode}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data || {};
  } catch (error) {
    console.error('Error fetching province details:', error);
    throw new Error('Unable to load province/city details');
  }
};

/**
 * Search provinces by name
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Filtered provinces
 */
export const searchProvinces = async searchTerm => {
  try {
    const provinces = await fetchProvinces();

    if (!searchTerm) return provinces;

    const normalizedSearch = searchTerm.toLowerCase().trim();

    return provinces.filter(
      province =>
        province.name?.toLowerCase().includes(normalizedSearch) ||
        province.codename?.toLowerCase().includes(normalizedSearch)
    );
  } catch (error) {
    console.error('Error searching provinces:', error);
    throw new Error('Unable to search province/city');
  }
};

/**
 * Search wards by name within a province
 * @param {string} provinceCode - Province code
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Filtered wards
 */
export const searchWards = async (provinceCode, searchTerm) => {
  try {
    const wards = await fetchWards(provinceCode);

    if (!searchTerm) return wards;

    const normalizedSearch = searchTerm.toLowerCase().trim();

    return wards.filter(
      ward =>
        ward.name?.toLowerCase().includes(normalizedSearch) ||
        ward.codename?.toLowerCase().includes(normalizedSearch)
    );
  } catch (error) {
    console.error('Error searching wards:', error);
    throw new Error('Unable to search ward/commune');
  }
};

/**
 * Format province display name
 * @param {Object} province - Province object
 * @returns {string} Formatted display name
 */
export const formatProvinceName = province => {
  if (!province) return '';
  return province.name || '';
};

/**
 * Format ward display name
 * @param {Object} ward - Ward object
 * @returns {string} Formatted display name
 */
export const formatWardName = ward => {
  if (!ward) return '';
  return ward.name || '';
};

/**
 * Get full address string
 * @param {Object} options - Address components
 * @param {Object} options.ward - Ward object
 * @param {Object} options.province - Province object
 * @param {string} options.detailedAddress - Detailed address
 * @returns {string} Full formatted address
 */
export const getFullAddress = ({ ward, province, detailedAddress }) => {
  const addressParts = [];

  if (detailedAddress) {
    addressParts.push(detailedAddress);
  }

  if (ward) {
    addressParts.push(formatWardName(ward));
  }

  if (province) {
    addressParts.push(formatProvinceName(province));
  }

  return addressParts.join(', ');
};

// Export default object with all functions
export default {
  fetchProvinces,
  fetchWards,
  getProvinceById,
  searchProvinces,
  searchWards,
  formatProvinceName,
  formatWardName,
  getFullAddress,
};
