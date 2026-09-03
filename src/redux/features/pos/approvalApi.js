import { apiSlice } from "@/redux/api/apiSlice";
import { CREATE_APPROVAL_REQUEST, GET_ALL_APPROVAL_REQUESTS, GET_SINGLE_APPROVAL_REQUEST, REVIEW_APPROVAL_REQUEST } from "@/utils/url";


export const approvalApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createApprovalRequest: builder.mutation({
      query: (payload) => ({ url: CREATE_APPROVAL_REQUEST, method: "POST", body: payload }),
      invalidatesTags: ["ApprovalRequest"],
    }),
    reviewApprovalRequest: builder.mutation({
      query: ({ id, decision, reviewNote }) => ({
        url: REVIEW_APPROVAL_REQUEST(id),
        method: "PATCH",
        body: { decision, reviewNote },
      }),
      invalidatesTags: [
        "ApprovalRequest", "Send", "BuyCurrency", "SellCurrency",
        "OtherIncomePos", "PosExpense", "Account", "Report",
      ],
    }),
    getAllApprovalRequests: builder.query({
      query: (params) => ({ url: GET_ALL_APPROVAL_REQUESTS, method: "GET", params }),
      providesTags: ["ApprovalRequest"],
    }),
    getSingleApprovalRequest: builder.query({
      query: (id) => ({ url: GET_SINGLE_APPROVAL_REQUEST(id), method: "GET" }),
      providesTags: ["ApprovalRequest"],
    }),
  }),
});

export const {
  useCreateApprovalRequestMutation,
  useReviewApprovalRequestMutation,
  useGetAllApprovalRequestsQuery,
  useGetSingleApprovalRequestQuery,
} = approvalApi;