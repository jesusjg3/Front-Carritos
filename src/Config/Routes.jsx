const API_BASE_URL = "http://localhost:8000/api";

export const API_ROUTES = {
	BASE_URL: API_BASE_URL,

	// Auth
	AUTH: {
		LOGIN: `${API_BASE_URL}/login`,
		REGISTER: `${API_BASE_URL}/register`,
		ME: `${API_BASE_URL}/me`,
		LOGOUT: `${API_BASE_URL}/logout`,
		CHECK_EMAIL: `${API_BASE_URL}/check-email`,
		REFRESH: `${API_BASE_URL}/refresh`,
	},

	// Users & Drivers
	USERS: `${API_BASE_URL}/users`,
	DRIVERS: `${API_BASE_URL}/users/drivers`,

	// Trips
	TRIPS: `${API_BASE_URL}/trips`,
	TRIPS_REQUEST: `${API_BASE_URL}/trips/request`,

	// Roles
	ROLES: `${API_BASE_URL}/rols`,

	// States
	STATES: `${API_BASE_URL}/states`,

	// Tabs
	TABS: `${API_BASE_URL}/tabs`,

	// Destinations
	DESTINATIONS: `${API_BASE_URL}/destinations`,

	// Ratings
	RATINGS: `${API_BASE_URL}/ratings`,
};

export default API_ROUTES;
