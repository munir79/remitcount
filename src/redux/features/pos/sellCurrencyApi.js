import { apiSlice } from "@/redux/api/apiSlice";
import { CANCEL_SELL_CURRENCY, CREATE_SELL_CURRENCY, GET_ALL_SELL_CURRENCY, GET_SINGLE_SELL_CURRENCY, POST_SELL_CURRENCY } from "@/utils/url";


export const sellCurrencyApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createSellCurrency: builder.mutation({
      query: (payload) => ({ url: CREATE_SELL_CURRENCY, method: "POST", body: payload }),
      invalidatesTags: ["SellCurrency"],
    }),
    getAllSellCurrency: builder.query({
      query: (params) => ({ url: GET_ALL_SELL_CURRENCY, method: "GET", params }),
      providesTags: ["SellCurrency"],
    }),
    getSingleSellCurrency: builder.query({
      query: (id) => ({ url: GET_SINGLE_SELL_CURRENCY(id), method: "GET" }),
      providesTags: ["SellCurrency"],
    }),
    postSellCurrency: builder.mutation({
      query: (id) => ({ url: POST_SELL_CURRENCY(id), method: "PATCH" }),
      invalidatesTags: ["SellCurrency", "CurrencyStock", "Account", "Report"],
    }),
    cancelSellCurrency: builder.mutation({
      query: ({ id, reason }) => ({ url: CANCEL_SELL_CURRENCY(id), method: "PATCH", body: { reason } }),
      invalidatesTags: ["SellCurrency", "CurrencyStock", "Account", "Report"],
    }),
  }),
});

export const {
  useCreateSellCurrencyMutation,
  useGetAllSellCurrencyQuery,
  useGetSingleSellCurrencyQuery,
  usePostSellCurrencyMutation,
  useCancelSellCurrencyMutation,
} = sellCurrencyApi;