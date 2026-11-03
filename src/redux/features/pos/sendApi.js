import { apiSlice } from "@/redux/api/apiSlice";
import {
  CANCEL_SEND,
  CREATE_BENEFICIARY,
  CREATE_SEND,
  GET_ALL_SENDS,
  GET_CUSTOMER_BENEFICIARIES,
  GET_SEND_RECEIPT,
  GET_SINGLE_SEND,
  POST_SEND,
  UPDATE_BENEFICIARY,
} from "@/utils/url";

export const sendApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createSend: builder.mutation({
      query: (payload) => ({ url: CREATE_SEND, method: "POST", body: payload }),
      // postNow দিলে Post ও হয় — তাই Balance/Report ও Refresh
      invalidatesTags: ["Send", "Beneficiary", "Account", "Customer", "Vendor", "Report"],
    }),
    getAllSends: builder.query({
      query: (params) => ({ url: GET_ALL_SENDS, method: "GET", params }),
      providesTags: ["Send"],
    }),
    getSingleSend: builder.query({
      query: (id) => ({ url: GET_SINGLE_SEND(id), method: "GET" }),
      providesTags: ["Send"],
    }),
    getSendReceipt: builder.query({
      query: (id) => ({ url: GET_SEND_RECEIPT(id), method: "GET" }),
      providesTags: ["Send"],
    }),
    postSend: builder.mutation({
      query: (id) => ({ url: POST_SEND(id), method: "PATCH" }),
      invalidatesTags: ["Send", "Beneficiary", "Account", "Customer", "Vendor", "Report"],
    }),
    cancelSend: builder.mutation({
      query: ({ id, reason }) => ({ url: CANCEL_SEND(id), method: "PATCH", body: { reason } }),
      invalidatesTags: ["Send", "Account", "Customer", "Vendor", "Report"],
    }),

    // ===== Saved Receiver =====
    getCustomerBeneficiaries: builder.query({
      query: (customer) => ({ url: GET_CUSTOMER_BENEFICIARIES, method: "GET", params: { customer } }),
      providesTags: ["Beneficiary"],
    }),
    createBeneficiary: builder.mutation({
      query: (payload) => ({ url: CREATE_BENEFICIARY, method: "POST", body: payload }),
      invalidatesTags: ["Beneficiary"],
    }),
    updateBeneficiary: builder.mutation({
      query: ({ id, data }) => ({ url: UPDATE_BENEFICIARY(id), method: "PATCH", body: data }),
      invalidatesTags: ["Beneficiary"],
    }),
  }),
});

export const {
  useCreateSendMutation,
  useGetAllSendsQuery,
  useGetSingleSendQuery,
  useGetSendReceiptQuery,
  usePostSendMutation,
  useCancelSendMutation,
  useGetCustomerBeneficiariesQuery,
  useCreateBeneficiaryMutation,
  useUpdateBeneficiaryMutation,
} = sendApi;
