const API_BASE_URL = "http://localhost:8000/api";

export const API_ROUTES = {
	BASE_URL: API_BASE_URL,
	AUTH: {
		LOGIN: `${API_BASE_URL}/login`,
		REGISTER: `${API_BASE_URL}/register`,
		REFRESH: `${API_BASE_URL}/refresh`,
	},
	USERS: `${API_BASE_URL}/users`,
};

export default API_ROUTES;