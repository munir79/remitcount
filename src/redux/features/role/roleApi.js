import { apiSlice } from "@/redux/api/apiSlice";
import { CREATE_ROLE, DELETE_ROLE, GET_ALL_PERMISSIONS, GET_ALL_ROLES, GET_SINGLE_ROLE, UPDATE_ROLE } from "@/utils/url";

export const roleApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createRole: builder.mutation({
      query: (payload) => ({ url: CREATE_ROLE, method: "POST", body: payload }),
      invalidatesTags: ["Role"],
    }),
    getAllRoles: builder.query({
      query: () => ({ url: GET_ALL_ROLES, method: "GET" }),
      providesTags: ["Role"],
    }),
    getSingleRole: builder.query({
      query: (id) => ({ url: GET_SINGLE_ROLE(id), method: "GET" }),
      providesTags: ["Role"],
    }),
    updateRole: builder.mutation({
      query: ({ id, data }) => ({ url: UPDATE_ROLE(id), method: "PATCH", body: data }),
      invalidatesTags: ["Role"],
    }),
    deleteRole: builder.mutation({
      query: (id) => ({ url: DELETE_ROLE(id), method: "DELETE" }),
      invalidatesTags: ["Role"],
    }),
    getAllPermissions: builder.query({
      query: () => ({ url: GET_ALL_PERMISSIONS, method: "GET" }),
      providesTags: ["Permission"],
    }),
  }),
});

export const {
  useCreateRoleMutation,
  useGetAllRolesQuery,
  useGetSingleRoleQuery,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetAllPermissionsQuery,
} = roleApi;