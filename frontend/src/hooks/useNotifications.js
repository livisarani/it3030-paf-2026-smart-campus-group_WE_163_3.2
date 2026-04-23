// src/hooks/useNotifications.js
import { useState, useEffect, useCallback } from 'react'
import { notificationsApi } from '../api/index.js'

const POLL_INTERVAL = 30_000 // 30 s

export function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount,   setUnreadCount]   = useState(0)
  const [loading,       setLoading]       = useState(false)
  const [page,          setPage]          = useState(0)
  const [totalPages,    setTotalPages]    = useState(1)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await notificationsApi.getUnreadCount()
      setUnreadCount(data.unreadCount)
    } catch { /* silent */ }
  }, [])

  const fetchNotifications = useCallback(async (pageNum = 0, unreadOnly = false) => {
    setLoading(true)
    try {
      const { data } = await notificationsApi.getAll({
        page: pageNum, size: 15, unread: unreadOnly || undefined
      })
      setNotifications(pageNum === 0 ? data.content : prev => [...prev, ...data.content])
      setTotalPages(data.totalPages)
      setPage(pageNum)
    } finally {
      setLoading(false)
    }
  }, [])

  const markRead = useCallback(async (id) => {
    await notificationsApi.markRead(id)
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const markAllRead = useCallback(async () => {
    await notificationsApi.markAllRead()
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }, [])

  const deleteRead = useCallback(async () => {
    await notificationsApi.deleteRead()
    setNotifications(prev => prev.filter(n => !n.isRead))
  }, [])

  const loadMore = useCallback(() => {
    if (page + 1 < totalPages && !loading) fetchNotifications(page + 1)
  }, [page, totalPages, loading, fetchNotifications])

  // Initial load + polling
  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()
    const id = setInterval(fetchUnreadCount, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [fetchNotifications, fetchUnreadCount])

  return {
    notifications, unreadCount, loading,
    hasMore: page + 1 < totalPages,
    fetchNotifications, markRead, markAllRead, deleteRead, loadMore
  }
}
