// src/features/assignmentKeywords/assignmentKeywordsApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const assignmentKeywordsApi = createApi({
  reducerPath: 'assignmentKeywordsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3001/assignment_keywords',
    prepareHeaders: (headers, { getState }) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getAssignmentKeywords: builder.query({
      query: () => '/', // GET-запрос на http://localhost:3001/assignment_keywords/
    }),
    addAssignmentKeyword: builder.mutation({
      query: (body) => ({
        url: '/',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useGetAssignmentKeywordsQuery,
  useAddAssignmentKeywordMutation,
} = assignmentKeywordsApi;
