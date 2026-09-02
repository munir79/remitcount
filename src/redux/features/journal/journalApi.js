import { apiSlice } from "@/redux/api/apiSlice";
import { CREATE_JOURNAL, DELETE_DRAFT_JOURNAL, GET_ALL_JOURNALS, GET_SINGLE_JOURNAL, POST_JOURNAL, REVERSE_JOURNAL } from "@/utils/url";


export const journalApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createJournal: builder.mutation({
      query: (payload) => ({ url: CREATE_JOURNAL, method: "POST", body: payload }),
      invalidatesTags: ["Journal"],
    }),
    getAllJournals: builder.query({
      query: (params) => ({ url: GET_ALL_JOURNALS, method: "GET", params }),
      providesTags: ["Journal"],
    }),
    getSingleJournal: builder.query({
      query: (id) => ({ url: GET_SINGLE_JOURNAL(id), method: "GET" }),
      providesTags: ["Journal"],
    }),
    postJournal: builder.mutation({
      query: (id) => ({ url: POST_JOURNAL(id), method: "PATCH" }),
      invalidatesTags: ["Journal", "Account", "Ledger"],
    }),
    reverseJournal: builder.mutation({
      query: ({ id, reason }) => ({ url: REVERSE_JOURNAL(id), method: "PATCH", body: { reason } }),
      invalidatesTags: ["Journal", "Account", "Ledger"],
    }),
    deleteDraftJournal: builder.mutation({
      query: (id) => ({ url: DELETE_DRAFT_JOURNAL(id), method: "DELETE" }),
      invalidatesTags: ["Journal"],
    }),
  }),
});

export const {
  useCreateJournalMutation,
  useGetAllJournalsQuery,
  useGetSingleJournalQuery,
  usePostJournalMutation,
  useReverseJournalMutation,
  useDeleteDraftJournalMutation,
} = journalApi;