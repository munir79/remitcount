import { apiSlice } from "@/redux/api/apiSlice";
import { CREATE_VENDOR, DELETE_VENDOR, GET_ALL_VENDORS, GET_SINGLE_VENDOR, UPDATE_VENDOR } from "@/utils/url";


export const vendorApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createVendor: builder.mutation({
      query: (payload) => ({ url: CREATE_VENDOR, method: "POST", body: payload }),
      invalidatesTags: ["Vendor"],
    }),
    getAllVendors: builder.query({
      query: (params) => ({ url: GET_ALL_VENDORS, method: "GET", params }),
      providesTags: ["Vendor"],
    }),
    getSingleVendor: builder.query({
      query: (id) => ({ url: GET_SINGLE_VENDOR(id), method: "GET" }),
      providesTags: ["Vendor"],
    }),
    updateVendor: builder.mutation({
      query: ({ id, data }) => ({ url: UPDATE_VENDOR(id), method: "PATCH", body: data }),
      invalidatesTags: ["Vendor"],
    }),
    deleteVendor: builder.mutation({
      query: (id) => ({ url: DELETE_VENDOR(id), method: "DELETE" }),
      invalidatesTags: ["Vendor"],
    }),
  }),
});

export const {
  useCreateVendorMutation,
  useGetAllVendorsQuery,
  useGetSingleVendorQuery,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
} = vendorApi;