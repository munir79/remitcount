import { apiSlice } from "@/redux/api/apiSlice";
import { CANCEL_SEND, CREATE_SEND, GET_ALL_SENDS, GET_SINGLE_SEND, POST_SEND } from "@/utils/url";


export const sendApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createSend: builder.mutation({
      query: (payload) => ({ url: CREATE_SEND, method: "POST", body: payload }),
      invalidatesTags: ["Send"],
    }),
    getAllSends: builder.query({
      query: (params) => ({ url: GET_ALL_SENDS, method: "GET", params }),
      providesTags: ["Send"],
    }),
    getSingleSend: builder.query({
      query: (id) => ({ url: GET_SINGLE_SEND(id), method: "GET" }),
      providesTags: ["Send"],
    }),
    postSend: builder.mutation({
      query: (id) => ({ url: POST_SEND(id), method: "PATCH" }),
      invalidatesTags: ["Send", "Account", "Customer", "Vendor", "Report"],
    }),
    cancelSend: builder.mutation({
      query: ({ id, reason }) => ({ url: CANCEL_SEND(id), method: "PATCH", body: { reason } }),
      invalidatesTags: ["Send", "Account", "Report"],
    }),
  }),
});

export const {
  useCreateSendMutation,
  useGetAllSendsQuery,
  useGetSingleSendQuery,
  usePostSendMutation,
  useCancelSendMutation,
} = sendApi;