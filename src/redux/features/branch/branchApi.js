import { apiSlice } from "@/redux/api/apiSlice";
import { CREATE_BRANCH, GET_ALL_BRANCHES, GET_SINGLE_BRANCH, UPDATE_BRANCH } from "@/utils/url";


export const branchApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createBranch: builder.mutation({
      query: (payload) => ({ url: CREATE_BRANCH, method: "POST", body: payload }),
      invalidatesTags: ["Branch"],
    }),
    getAllBranches: builder.query({
      query: (params) => ({ url: GET_ALL_BRANCHES, method: "GET", params }),
      providesTags: ["Branch"],
    }),
    getSingleBranch: builder.query({
      query: (id) => ({ url: GET_SINGLE_BRANCH(id), method: "GET" }),
      providesTags: ["Branch"],
    }),
    updateBranch: builder.mutation({
      query: ({ id, data }) => ({ url: UPDATE_BRANCH(id), method: "PATCH", body: data }),
      invalidatesTags: ["Branch"],
    }),
  }),
});

export const {
  useCreateBranchMutation,
  useGetAllBranchesQuery,
  useGetSingleBranchQuery,
  useUpdateBranchMutation,
} = branchApi;