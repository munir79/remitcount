import { apiSlice } from "@/redux/api/apiSlice";
import { GET_POS_DASHBOARD_SUMMARY } from "@/utils/url";


export const posDashboardApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getPosDashboardSummary: builder.query({
      query: (params) => ({ url: GET_POS_DASHBOARD_SUMMARY, method: "GET", params }),
      providesTags: ["Report"],
    }),
  }),
});

export const { useGetPosDashboardSummaryQuery } = posDashboardApi;