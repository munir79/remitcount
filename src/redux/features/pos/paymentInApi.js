import { apiSlice } from "@/redux/api/apiSlice";
import { CANCEL_PAYMENT_IN, CREATE_PAYMENT_IN, GET_ALL_PAYMENT_IN, GET_PAYMENT_IN_DUES, GET_PAYMENT_IN_RECEIPT, GET_SINGLE_PAYMENT_IN, POST_PAYMENT_IN } from "@/utils/url";

// Payment এর পর বাকি, Balance, Drawer — সব বদলায়
const AFTER_PAYMENT = ["PaymentIn", "SellCurrency", "Send", "OtherIncomePos", "Customer", "Vendor", "Account", "Report", "CashierSession"];

export const paymentInApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createPaymentIn: builder.mutation({
      query: (payload) => ({ url: CREATE_PAYMENT_IN, method: "POST", body: payload }),
      invalidatesTags: AFTER_PAYMENT,
    }),
    getAllPaymentIn: builder.query({
      query: (params) => ({ url: GET_ALL_PAYMENT_IN, method: "GET", params }),
      providesTags: ["PaymentIn"],
    }),
    getSinglePaymentIn: builder.query({
      query: (id) => ({ url: GET_SINGLE_PAYMENT_IN(id), method: "GET" }),
      providesTags: ["PaymentIn"],
    }),
    postPaymentIn: builder.mutation({
      query: (id) => ({ url: POST_PAYMENT_IN(id), method: "PATCH" }),
      invalidatesTags: AFTER_PAYMENT,
    }),
    cancelPaymentIn: builder.mutation({
      query: ({ id, reason }) => ({ url: CANCEL_PAYMENT_IN(id), method: "PATCH", body: { reason } }),
      invalidatesTags: AFTER_PAYMENT,
    }),
    // "নাম ধরে" — Customer / Supplier এর সব খোলা বাকি, পুরনোটা আগে
    getPaymentInDues: builder.query({
      query: (params) => ({ url: GET_PAYMENT_IN_DUES, method: "GET", params }),
      providesTags: ["PaymentIn"],
    }),
    getPaymentInReceipt: builder.query({
      query: (id) => ({ url: GET_PAYMENT_IN_RECEIPT(id), method: "GET" }),
      providesTags: ["PaymentIn"],
    }),
  }),
});

export const {
  useCreatePaymentInMutation,
  useGetAllPaymentInQuery,
  useGetSinglePaymentInQuery,
  usePostPaymentInMutation,
  useCancelPaymentInMutation,
  useGetPaymentInDuesQuery,
  useGetPaymentInReceiptQuery,
} = paymentInApi;
