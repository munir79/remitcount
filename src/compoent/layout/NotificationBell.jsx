"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Volume2, VolumeX, X } from "lucide-react";
import { useDeleteNotificationMutation, useGetMyNotificationsQuery, useMarkAllNotificationsAsReadMutation, useMarkNotificationAsReadMutation } from "@/redux/features/notification/notificationApi";
import { useSocketEvent } from "@/socket/useSocketEvent";
import { useNotificationSound } from "@/hooks/useNotificationSound";

const formatTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { playSound, isSoundEnabled, toggleSound } = useNotificationSound();

  const { data, refetch, isLoading } = useGetMyNotificationsQuery();
  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  // ✅ Fix — Backend এর Actual Response Structure অনুযায়ী "data.data" 
  const notifications = data?.data?.data || [];
  const unreadCount = data?.data?.unreadCount || 0;

  useSocketEvent("notification", () => {
    playSound();
    refetch();
  });

  const handleClickOutside = useCallback((event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const handleToggleDropdown = () => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);
    if (willOpen && unreadCount > 0) {
      markAllAsRead();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button type="button" onClick={handleToggleDropdown} className="relative rounded-md p-2 hover:bg-neutral-100">
        <Bell className="h-5 w-5 text-neutral-500" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-96 max-h-96 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg">
          <div className="sticky top-0 flex items-center justify-between border-b border-neutral-100 bg-white px-4 py-3">
            <h3 className="text-sm font-semibold text-neutral-800">Notifications</h3>
            <button type="button" onClick={toggleSound} className="rounded p-1 hover:bg-neutral-100">
              {isSoundEnabled ? (
                <Volume2 className="h-4 w-4 text-neutral-500" />
              ) : (
                <VolumeX className="h-4 w-4 text-neutral-400" />
              )}
            </button>
          </div>

          {isLoading ? (
            <div className="px-4 py-6 text-center text-sm text-neutral-400">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-neutral-400">No notifications</div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification._id}
                className={`group flex items-start gap-3 border-b border-neutral-50 px-4 py-3 hover:bg-neutral-50 ${
                  !notification.isRead ? "bg-indigo-50/40" : ""
                }`}
              >
                {!notification.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />}
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => !notification.isRead && markAsRead(notification._id)}
                >
                  <p className="text-sm font-medium text-neutral-800">{notification.title}</p>
                  <p className="text-xs text-neutral-500">{notification.message}</p>
                  <p className="mt-1 text-xs text-neutral-400">{formatTimeAgo(notification.createdAt)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteNotification(notification._id)}
                  className="shrink-0 text-neutral-300 opacity-0 hover:text-rose-500 group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;