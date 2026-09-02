import { apiSlice } from "@/redux/api/apiSlice";
import { ADD_STAFF, FORGOT_PASSWORD, GET_ALL_STAFF, GET_MY_PROFILE, RESET_PASSWORD, SIGN_IN, SIGN_UP, UPDATE_STAFF, VERIFY_OTP } from "@/utils/url";


export const authApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    signUp: builder.mutation({
      query: (payload) => ({ url: SIGN_UP, method: "POST", body: payload }),
    }),
    signIn: builder.mutation({
      query: (payload) => ({ url: SIGN_IN, method: "POST", body: payload }),
    }),
    forgotPassword: builder.mutation({
      query: (payload) => ({ url: FORGOT_PASSWORD, method: "POST", body: payload }),
    }),
    verifyOtp: builder.mutation({
      query: (payload) => ({ url: VERIFY_OTP, method: "POST", body: payload }),
    }),
    resetPassword: builder.mutation({
      query: (payload) => ({ url: RESET_PASSWORD, method: "POST", body: payload }),
    }),
    getMyProfile: builder.query({
      query: () => ({ url: GET_MY_PROFILE, method: "GET" }),
      providesTags: ["Profile"],
    }),
    getAllStaff: builder.query({
      query: (params) => ({ url: GET_ALL_STAFF, method: "GET", params }),
      providesTags: ["Staff"],
    }),
    addStaff: builder.mutation({
      query: (payload) => ({ url: ADD_STAFF, method: "POST", body: payload }),
      invalidatesTags: ["Staff"],
    }),
    updateStaff: builder.mutation({
      query: ({ id, data }) => ({ url: UPDATE_STAFF(id), method: "PATCH", body: data }),
      invalidatesTags: ["Staff"],
    }),
  }),
});

export const {
  useSignUpMutation,
  useSignInMutation,
  useForgotPasswordMutation,
  useVerifyOtpMutation,
  useResetPasswordMutation,
  useLazyGetMyProfileQuery,
  useGetAllStaffQuery,
  useAddStaffMutation,
  useUpdateStaffMutation,
} = authApi;