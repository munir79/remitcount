import { apiSlice } from "@/redux/api/apiSlice";
import { CREATE_COMPANY, GET_MY_COMPANY, UPDATE_COMPANY } from "@/utils/url";

export const companyApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createCompany: builder.mutation({
      query: (payload) => ({ url: CREATE_COMPANY, method: "POST", body: payload }),
      invalidatesTags: ["Company"],
    }),
    getMyCompany: builder.query({
      query: () => ({ url: GET_MY_COMPANY, method: "GET" }),
      providesTags: ["Company"],
    }),
    updateCompany: builder.mutation({
      query: (payload) => ({ url: UPDATE_COMPANY, method: "PATCH", body: payload }),
      invalidatesTags: ["Company", "Profile"], // Profile এ Company র Timezone — বদলালে সব Screen এ সাথে সাথে
    }),
  }),
});

export const { useCreateCompanyMutation, useGetMyCompanyQuery, useUpdateCompanyMutation } = companyApi;