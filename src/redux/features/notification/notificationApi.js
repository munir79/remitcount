import { apiSlice } from "@/redux/api/apiSlice";
import { DELETE_NOTIFICATION, GET_MY_NOTIFICATIONS, MARK_ALL_AS_READ, MARK_AS_READ } from "@/utils/url";


export const notificationApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getMyNotifications: builder.query({
      query: () => ({ url: GET_MY_NOTIFICATIONS, method: "GET" }),
      providesTags: ["Notification"],
    }),
    markNotificationAsRead: builder.mutation({
      query: (id) => ({ url: MARK_AS_READ(id), method: "PATCH" }),
      invalidatesTags: ["Notification"],
    }),
    markAllNotificationsAsRead: builder.mutation({
      query: () => ({ url: MARK_ALL_AS_READ, method: "PATCH" }),
      invalidatesTags: ["Notification"],
    }),
    deleteNotification: builder.mutation({
      query: (id) => ({ url: `${DELETE_NOTIFICATION}/${id}`, method: "DELETE" }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useGetMyNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
} = notificationApi;