import { apiSlice } from "@/redux/api/apiSlice";
import { CREATE_CUSTOMER, DELETE_CUSTOMER, GET_ALL_CUSTOMERS, GET_SINGLE_CUSTOMER, UPDATE_CUSTOMER } from "@/utils/url";


export const customerApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createCustomer: builder.mutation({
      query: (payload) => ({ url: CREATE_CUSTOMER, method: "POST", body: payload }),
      invalidatesTags: ["Customer"],
    }),
    getAllCustomers: builder.query({
      query: (params) => ({ url: GET_ALL_CUSTOMERS, method: "GET", params }),
      providesTags: ["Customer"],
    }),
    getSingleCustomer: builder.query({
      query: (id) => ({ url: GET_SINGLE_CUSTOMER(id), method: "GET" }),
      providesTags: ["Customer"],
    }),
    updateCustomer: builder.mutation({
      query: ({ id, data }) => ({ url: UPDATE_CUSTOMER(id), method: "PATCH", body: data }),
      invalidatesTags: ["Customer"],
    }),
    deleteCustomer: builder.mutation({
      query: (id) => ({ url: DELETE_CUSTOMER(id), method: "DELETE" }),
      invalidatesTags: ["Customer"],
    }),
  }),
});

export const {
  useCreateCustomerMutation,
  useGetAllCustomersQuery,
  useGetSingleCustomerQuery,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customerApi;