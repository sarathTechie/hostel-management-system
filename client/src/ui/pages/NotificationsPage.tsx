import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Empty, ErrorBox, Loading, PageHead } from '../common';
import { api } from '../api';
import type { User } from '../types';
import '../notifications.css';

type Notification = {
  id: string;
  title: string;
  message: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

type NotificationInbox = { notifications: Notification[]; unreadCount: number };

export default function NotificationsPage({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState('');
  const { data, isLoading, isError } = useQuery<NotificationInbox>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((response) => response.data),
  });
  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: () => setActionError('Could not update this notification. Please try again.'),
  });
  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: () => setActionError('Could not update your notifications. Please try again.'),
  });
  const notifications = data?.notifications ?? [];

  return (
    <>
      <PageHead
        eyebrow="PERSONAL INBOX"
        title="Notifications"
        desc={`Updates for ${user.name}. ${data?.unreadCount ?? 0} unread.`}
        action={Boolean(data?.unreadCount) && (
          <button className="secondary" disabled={markAllRead.isPending} onClick={() => {
            setActionError('');
            markAllRead.mutate();
          }}>
            Mark all as read
          </button>
        )}
      />
      {actionError && <div className="alert" role="alert">{actionError}</div>}
      {isLoading ? <Loading /> : isError ? <ErrorBox /> : notifications.length === 0 ? (
        <Empty title="You’re all caught up" text="New leave-request updates will appear here." />
      ) : (
        <section className="panel notification-list" aria-label="Notifications">
          {notifications.map((notification) => (
            <article className={`notification-item${notification.readAt ? '' : ' unread'}`} key={notification.id}>
              <div>
                <h2>{notification.title}</h2>
                <p>{notification.message}</p>
                <time dateTime={notification.createdAt}>{new Date(notification.createdAt).toLocaleString()}</time>
              </div>
              <div className="notification-actions">
                {notification.href && <Link className="text-action" to={notification.href}>Open</Link>}
                {!notification.readAt && (
                  <button className="text-action" disabled={markRead.isPending} onClick={() => {
                    setActionError('');
                    markRead.mutate(notification.id);
                  }}>
                    Mark read
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </>
  );
}
