import axios from 'axios';
import { getConfig } from './config.js';

const BASE_URL = 'https://api.globalwinescore.com';

function getHeaders() {
  const token = getConfig('apiToken');
  if (!token) {
    throw new Error('API token not configured. Run: globalwinescore config set --api-token YOUR_TOKEN');
  }
  return {
    'Authorization': `Token ${token}`,
    'Accept': 'application/json'
  };
}

async function request(endpoint, params = {}) {
  try {
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      headers: getHeaders(),
      params
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Check your API token.');
    }
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Maximum 10 requests per minute.');
    }
    if (error.response?.status === 403) {
      throw new Error('Access forbidden. This endpoint may require a business plan.');
    }
    if (error.response?.data?.detail) {
      throw new Error(`API Error: ${error.response.data.detail}`);
    }
    throw new Error(`Request failed: ${error.message}`);
  }
}

// ============================================================
// Wine Scores
// ============================================================

/**
 * Get latest GlobalWineScores
 * @param {Object} filters - Query filters
 * @param {string} filters.wine_id - Wine ID filter
 * @param {string} filters.vintage - Vintage year
 * @param {string} filters.color - Wine color (red, white, pink)
 * @param {boolean} filters.is_primeurs - Filter for en primeur scores
 * @param {string} filters.lwin - L-WIN identifier
 * @param {string} filters.lwin_11 - L-WIN 11 identifier
 * @param {number} filters.limit - Results per page (default: 100)
 * @param {number} filters.offset - Pagination offset
 * @param {string} filters.ordering - Sort order (e.g., '-date', 'score')
 */
export async function getLatestScores(filters = {}) {
  const params = {};

  if (filters.wine_id) params.wine_id = filters.wine_id;
  if (filters.vintage) params.vintage = filters.vintage;
  if (filters.color) params.color = filters.color;
  if (filters.is_primeurs !== undefined) params.is_primeurs = filters.is_primeurs;
  if (filters.lwin) params.lwin = filters.lwin;
  if (filters.lwin_11) params.lwin_11 = filters.lwin_11;
  if (filters.limit) params.limit = filters.limit;
  if (filters.offset) params.offset = filters.offset;
  if (filters.ordering) params.ordering = filters.ordering;

  return await request('/globalwinescores/latest/', params);
}

/**
 * Get historical GlobalWineScores (requires business plan)
 * @param {Object} filters - Query filters (same as getLatestScores)
 */
export async function getHistoricalScores(filters = {}) {
  const params = {};

  if (filters.wine_id) params.wine_id = filters.wine_id;
  if (filters.vintage) params.vintage = filters.vintage;
  if (filters.color) params.color = filters.color;
  if (filters.is_primeurs !== undefined) params.is_primeurs = filters.is_primeurs;
  if (filters.lwin) params.lwin = filters.lwin;
  if (filters.lwin_11) params.lwin_11 = filters.lwin_11;
  if (filters.limit) params.limit = filters.limit;
  if (filters.offset) params.offset = filters.offset;
  if (filters.ordering) params.ordering = filters.ordering;

  return await request('/globalwinescores/', params);
}

/**
 * Search wines by name, appellation, or wine_id
 * This is a helper function that uses the latest scores endpoint with filters
 */
export async function searchWines(query, options = {}) {
  const filters = {
    limit: options.limit || 20,
    ordering: options.ordering || '-score',
    ...options
  };

  // The API doesn't have a direct search by name, so we'll use wine_id if provided
  // or return all with filters
  return await getLatestScores(filters);
}

/**
 * Get scores by vintage year
 */
export async function getScoresByVintage(vintage, options = {}) {
  return await getLatestScores({
    vintage,
    limit: options.limit || 50,
    ordering: options.ordering || '-score',
    ...options
  });
}

/**
 * Get scores by color
 */
export async function getScoresByColor(color, options = {}) {
  return await getLatestScores({
    color: color.toLowerCase(),
    limit: options.limit || 50,
    ordering: options.ordering || '-score',
    ...options
  });
}

/**
 * Get scores by wine ID
 */
export async function getScoresByWineId(wineId, options = {}) {
  return await getLatestScores({
    wine_id: wineId,
    ...options
  });
}

/**
 * Get scores by L-WIN identifier
 */
export async function getScoresByLwin(lwin, options = {}) {
  return await getLatestScores({
    lwin,
    ...options
  });
}

/**
 * Get top rated wines
 */
export async function getTopRated(options = {}) {
  return await getLatestScores({
    limit: options.limit || 20,
    ordering: '-score',
    ...options
  });
}
