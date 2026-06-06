'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const priorityOrder = { high: 0, normal: 1, low: 2 }
const priorityColors = {
  high:   'border-red-500/50 bg-red-500/5',
  normal: 'border-gray-700 bg-gray-900',
  low:    'border-gray-800 bg-gray-950',
}
const priorityBadge = {
  high:   'bg-red-500/20 text-red-400',
  normal: 'bg-gray-700 text-gray-400',
  low:    'bg-gray-800 text-gray-500',
}

export default function NotificationBar() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)
  const [polling, setPolling]             = useState(false)
  const [selected, setSelected]           = useState(null)
  const [draftLoading, setDraftLoading]   = useState(false)
  const [draft, setDraft]                 = useState('')
  const [sending, setSending]             = useState(false)
  const [unreadCount, setUnreadCount]     = useState(0)
  const [open, setOpen]                   = useState(false)

  useEffect(() => {
    fetchNotifications()
    // Auto-poll every 3 minutes
    const interval = setInterval(pollGmail, 3 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  async function fetchNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('received_at', { ascending: false })

    const sorted = (data || []).sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    )
    setNotifications(sorted)
    setUnreadCount(sorted.filter(n => !n.is_read).length)
    setLoading(false)
  }

  async function pollGmail() {
    setPolling(true)
    await fetch('/api/gmail/poll')
    await fetchNotifications()
    setPolling(false)
  }

  async function markRead(notification) {
  setSelected(notification)
  setDraft('')
}

  async function setPriority(notificationId, priority) {
    await supabase
      .from('notifications')
      .update({ priority })
      .eq('notification_id', notificationId)
    setNotifications(prev =>
      prev
        .map(n => n.notification_id === notificationId ? { ...n, priority } : n)
        .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    )
    if (selected?.notification_id === notificationId) {
      setSelected(prev => ({ ...prev, priority }))
    }
  }

  async function generateDraft() {
    if (!selected) return
    setDraftLoading(true)
    setDraft('')

    const res = await fetch('/api/ai/email-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromName:  selected.from_name,
        fromEmail: selected.from_email,
        subject:   selected.subject,
        body:      selected.body,
      }),
    })

    const data = await res.json()
    setDraft(data.draft || '')

    // Save draft to DB
    await supabase
      .from('notifications')
      .update({ reply_draft: data.draft })
      .eq('notification_id', selected.notification_id)

    setDraftLoading(false)
  }

  async function sendReply() {
    if (!draft || !selected) return
    setSending(true)

    await fetch('/api/gmail/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to:      selected.from_email,
        subject: selected.subject,
        body:    draft,
      }),
    })

    setSending(false)
    alert('Reply sent successfully!')
    setSelected(null)
    setDraft('')
  }

  return (
    <div className="mb-6">
      {/* Header bar */}
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-5 py-3 cursor-pointer hover:border-gray-700 transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold text-sm">📬 Email Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); pollGmail() }}
            disabled={polling}
            className="text-xs text-gray-400 hover:text-orange-400 transition disabled:opacity-50"
          >
            {polling ? 'Checking...' : '↻ Check now'}
          </button>
          <span className="text-gray-500 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Notification list */}
      {open && (
        <div className="mt-2 border border-gray-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-gray-500 text-sm">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              No emails yet. Click Check now or wait for auto-poll.
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {notifications.map(notification => (
                <div
                  key={notification.notification_id}
                  className={`p-4 cursor-pointer hover:bg-gray-800/50 transition border-l-4 ${priorityColors[notification.priority]} ${
                    !notification.is_read ? 'border-l-orange-500' : 'border-l-transparent'
                  }`}
                  onClick={() => markRead(notification)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
                        )}
                        <p className={`text-sm font-medium truncate ${notification.is_read ? 'text-gray-400' : 'text-white'}`}>
                          {notification.subject}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityBadge[notification.priority]}`}>
                          {notification.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        From: {notification.from_name || notification.from_email}
                        {' · '}
                        {notification.received_at
                          ? new Date(notification.received_at).toLocaleString()
                          : ''}
                      </p>
                    </div>

                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${priorityBadge[notification.priority]}`}>
  {notification.priority === 'high' ? '🔴 High' : notification.priority === 'low' ? '⚪ Low' : '🟡 Normal'}
</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected email detail + AI reply */}
      {selected && (
        <div className="mt-3 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold">{selected.subject}</h3>
              <p className="text-gray-400 text-sm mt-1">
                From: {selected.from_name} &lt;{selected.from_email}&gt;
              </p>
              <p className="text-gray-500 text-xs mt-0.5">
                {selected.received_at ? new Date(selected.received_at).toLocaleString() : ''}
              </p>
            </div>
<div className="flex items-center gap-3">
  {!selected.is_read && (
    <button
      onClick={async () => {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('notification_id', selected.notification_id)
        setNotifications(prev =>
          prev.map(n =>
            n.notification_id === selected.notification_id
              ? { ...n, is_read: true } : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
        setSelected(prev => ({ ...prev, is_read: true }))
      }}
      className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg px-3 py-1.5 transition"
    >
      ✓ Mark as Read
    </button>
  )}
  {selected.is_read && (
    <span className="text-xs text-gray-600">✓ Read</span>
  )}
  <button
    onClick={() => { setSelected(null); setDraft('') }}
    className="text-gray-500 hover:text-white text-lg transition"
  >
    ✕
  </button>
</div>
          </div>

          {/* Email body */}
          <div className="bg-gray-800 rounded-xl p-4 mb-4">
            <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
              {selected.body}
            </p>
          </div>

          {/* AI Draft Reply */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm font-medium">AI Reply Draft</p>
              <button
                onClick={generateDraft}
                disabled={draftLoading}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg px-4 py-2 transition"
              >
                {draftLoading ? 'Generating...' : '✦ Generate AI Draft'}
              </button>
            </div>

            {draftLoading && (
              <div className="bg-gray-800 animate-pulse rounded-xl h-24 flex items-center justify-center">
                <span className="text-gray-500 text-sm">Gemini is drafting a reply...</span>
              </div>
            )}

            {draft && (
              <div>
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  rows={8}
                  className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
                />
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={sendReply}
                    disabled={sending}
                    className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-lg px-6 py-2 text-sm transition"
                  >
                    {sending ? 'Sending...' : '📤 Send Reply'}
                  </button>
                  <button
                    onClick={generateDraft}
                    disabled={draftLoading}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-lg px-5 py-2 text-sm transition"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}