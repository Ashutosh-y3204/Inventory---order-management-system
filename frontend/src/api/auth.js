import client from './client'

export const authApi = {
  login: (email, password) => client.post('/auth/login', { email, password }),
  signup: (name, email, password) => client.post('/auth/signup', { name, email, password }),
  me: () => client.get('/auth/me'),
}
