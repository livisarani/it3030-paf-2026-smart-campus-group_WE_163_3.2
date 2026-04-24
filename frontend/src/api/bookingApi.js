import api from './axiosConfig';

export const bookingApi = {
  // Create a new booking
  createBooking: (bookingData) => api.post('/bookings', bookingData),
  
  // Get current user's bookings
  getUserBookings: (userId) => api.get(`/bookings/my?userId=${userId}`),
  
  // Get booking by ID
  getBookingById: (id) => api.get(`/bookings/${id}`),
  
  // Approve booking (Admin only)
  approveBooking: (id, reason) => api.put(`/bookings/${id}/approve`, { reason }),
  
  // Reject booking (Admin only)
  rejectBooking: (id, reason) => api.put(`/bookings/${id}/reject`, { reason }),
  
  // Cancel booking
  cancelBooking: (id, reason) => api.put(`/bookings/${id}/cancel`, { reason }),

  // Delete booking request (Admin only; approved/rejected/cancelled only)
  deleteBooking: (id) => api.delete(`/bookings/${id}`),

  // Generate a PDF report for booking requests (Admin only)
  generateReport: (filters) =>
    api.get('/bookings/report', {
      params: filters,
      responseType: 'blob',
    }),
  
  // Get all bookings with filters (Admin only)
  getAllBookings: (filters) => {
    const params = new URLSearchParams();
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.resourceId) params.append('resourceId', filters.resourceId);
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    return api.get(`/bookings?${params.toString()}`);
  },
  
  // Check for conflicts
  checkConflict: (resourceId, startTime, endTime) => 
    api.get(`/bookings/check-conflict?resourceId=${resourceId}&startTime=${startTime}&endTime=${endTime}`),
};