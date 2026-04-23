// src/api/auth.js
import client from './client'

export const authApi = {
  getMe:         ()            => client.get('/auth/me'),
  refresh:       (token)       => client.post('/auth/refresh', { refreshToken: token }),
  logout:        ()            => client.post('/auth/logout'),
}

// src/api/notifications.js – exported separately below
export const notificationsApi = {
  getAll:        (params)      => client.get('/notifications', { params }),
  getUnreadCount:()            => client.get('/notifications/unread-count'),
  markRead:      (id)          => client.patch(`/notifications/${id}/read`),
  markAllRead:   ()            => client.patch('/notifications/read-all'),
  deleteRead:    ()            => client.delete('/notifications/read'),
}

// src/api/roles.js
export const rolesApi = {
  getAllUsers:   (params)      => client.get('/admin/users', { params }),
  getUserRoles:  (id)          => client.get(`/admin/users/${id}/roles`),
  updateRoles:   (id, roles)   => client.put(`/admin/users/${id}/roles`, { roles }),
}
