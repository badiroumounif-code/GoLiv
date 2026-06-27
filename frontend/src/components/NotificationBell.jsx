import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;
const POLL_INTERVAL_MS = 15000;

function formatRelativeTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} j`;
  return date.toLocaleDateString("fr-FR");
}

export default function NotificationBell() {
  const { token, isAuthenticated, authFetch } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastSeenIdRef = useRef(null);
  const wrapperRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await authFetch(`${API_URL}/api/notifications?limit=20`);
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data);

      // toast the newest unread notification only if it's new since last fetch
      if (data.length > 0) {
        const newest = data[0];
        if (lastSeenIdRef.current && newest.id !== lastSeenIdRef.current && !newest.read) {
          toast(newest.title, { description: newest.message });
        }
        lastSeenIdRef.current = newest.id;
      }
    } catch (e) {
      // silently ignore polling errors
    }
  }, [token, authFetch]);

  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await authFetch(`${API_URL}/api/notifications/unread-count`);
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.count || 0);
    } catch (e) {
      // ignore
    }
  }, [token, authFetch]);

  // Polling
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchUnreadCount();
    fetchNotifications();
    const id = setInterval(() => {
      fetchUnreadCount();
      fetchNotifications();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isAuthenticated, fetchUnreadCount, fetchNotifications]);

  // Click outside to close
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleToggle = () => {
    setOpen((v) => !v);
    if (!open) fetchNotifications();
  };

  const markAsRead = async (id) => {
    try {
      const res = await authFetch(`${API_URL}/api/notifications/${id}/read`, { method: "PATCH" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (e) { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      const res = await authFetch(`${API_URL}/api/notifications/read-all`, { method: "PATCH" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (e) { /* ignore */ }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative p-2 rounded-full text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition-colors"
        aria-label="Notifications"
        data-testid="notification-bell"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full"
            data-testid="notification-badge"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-[340px] sm:w-[380px] bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50"
          data-testid="notification-panel"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="font-heading font-semibold text-slate-900">Notifications</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-sky-600 hover:text-sky-700 font-medium px-2 py-1 rounded inline-flex items-center gap-1"
                  data-testid="mark-all-read-btn"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Tout marquer lu
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto" data-testid="notification-list">
            {notifications.length === 0 ? (
              <div className="px-6 py-10 text-center text-slate-500 text-sm">
                Aucune notification pour le moment
              </div>
            ) : (
              notifications.map((n) => {
                const inner = (
                  <div
                    className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                      n.read ? "bg-white" : "bg-sky-50/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                          n.read ? "bg-slate-300" : "bg-sky-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 truncate">{n.title}</p>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{formatRelativeTime(n.created_at)}</p>
                      </div>
                      {!n.read && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            markAsRead(n.id);
                          }}
                          className="p-1 text-slate-400 hover:text-sky-600"
                          title="Marquer comme lu"
                          data-testid={`mark-read-${n.id}`}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
                return n.link ? (
                  <Link
                    key={n.id}
                    to={n.link}
                    onClick={() => {
                      setOpen(false);
                      if (!n.read) markAsRead(n.id);
                    }}
                    data-testid={`notification-item-${n.id}`}
                  >
                    {inner}
                  </Link>
                ) : (
                  <div key={n.id} data-testid={`notification-item-${n.id}`}>{inner}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
