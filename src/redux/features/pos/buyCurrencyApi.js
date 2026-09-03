import { apiSlice } from "@/redux/api/apiSlice";
import { CANCEL_BUY_CURRENCY, GET_ALL_BUY_CURRENCY, GET_SINGLE_BUY_CURRENCY, POST_BUY_CURRENCY } from "@/utils/url";


export const buyCurrencyApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createBuyCurrency: builder.mutation({
      query: (payload) => ({ url: CREATE_BUY_CURRENCY, method: "POST", body: payload }),
      invalidatesTags: ["BuyCurrency"],
    }),
    getAllBuyCurrency: builder.query({
      query: (params) => ({ url: GET_ALL_BUY_CURRENCY, method: "GET", params }),
      providesTags: ["BuyCurrency"],
    }),
    getSingleBuyCurrency: builder.query({
      query: (id) => ({ url: GET_SINGLE_BUY_CURRENCY(id), method: "GET" }),
      providesTags: ["BuyCurrency"],
    }),
    postBuyCurrency: builder.mutation({
      query: (id) => ({ url: POST_BUY_CURRENCY(id), method: "PATCH" }),
      invalidatesTags: ["BuyCurrency", "CurrencyStock", "Account", "Report"],
    }),
    cancelBuyCurrency: builder.mutation({
      query: ({ id, reason }) => ({ url: CANCEL_BUY_CURRENCY(id), method: "PATCH", body: { reason } }),
      invalidatesTags: ["BuyCurrency", "CurrencyStock", "Account", "Report"],
    }),
  }),
});

export const {
  useCreateBuyCurrencyMutation,
  useGetAllBuyCurrencyQuery,
  useGetSingleBuyCurrencyQuery,
  usePostBuyCurrencyMutation,
  useCancelBuyCurrencyMutation,
} = buyCurrencyApi;