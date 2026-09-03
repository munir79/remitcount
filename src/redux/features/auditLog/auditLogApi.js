import { apiSlice } from "@/redux/api/apiSlice";
import { GET_AUDIT_LOGS } from "@/utils/url";


export const auditLogApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getAuditLogs: builder.query({
      query: (params) => ({ url: GET_AUDIT_LOGS, method: "GET", params }),
      providesTags: ["AuditLog"],
    }),
  }),
});

export const { useGetAuditLogsQuery } = auditLogApi;