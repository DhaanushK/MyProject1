import axios from '../config/axios';

const loginUser = async (credentials) => {
    try {
        const response = await axios.post('/api/auth/login', credentials);
        if (response.data.token) {
            localStorage.setItem('user_token', response.data.token);
            return response.data;
        }
    } catch (error) {
        if (error.response?.data?.message === 'invalid_grant') {
            throw new Error('Invalid credentials or account not found');
        }
        throw error;
    }
};

export { loginUser };
