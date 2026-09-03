import { apiSlice } from "@/redux/api/apiSlice";
import { CREATE_CURRENCY_STOCK, GET_ALL_CURRENCY_STOCKS } from "@/utils/url";

export const currencyStockApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createCurrencyStock: builder.mutation({
      query: (payload) => ({ url: CREATE_CURRENCY_STOCK, method: "POST", body: payload }),
      invalidatesTags: ["CurrencyStock"],
    }),
    getAllCurrencyStocks: builder.query({
      query: (params) => ({ url: GET_ALL_CURRENCY_STOCKS, method: "GET", params }),
      providesTags: ["CurrencyStock"],
    }),
  }),
});

export const { useCreateCurrencyStockMutation, useGetAllCurrencyStocksQuery } = currencyStockApi;