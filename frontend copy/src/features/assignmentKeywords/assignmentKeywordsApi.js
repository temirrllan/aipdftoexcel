import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const assignmentKeywordsApi = createApi({
  reducerPath: 'assignmentKeywordsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3001/assignment_keywords',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['AssignmentKeyword'],
  endpoints: (builder) => ({
    getAssignmentKeywords: builder.query({
      query: () => `/`,
      providesTags: (result) =>
        result
          ? [...result.map((item) => ({ type: 'AssignmentKeyword', id: item.id })), { type: 'AssignmentKeyword', id: 'LIST' }]
          : [{ type: 'AssignmentKeyword', id: 'LIST' }],
    }),
    addAssignmentKeyword: builder.mutation({
      query: (body) => ({
        url: `/`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'AssignmentKeyword', id: 'LIST' }],
    }),
    updateAssignmentKeyword: builder.mutation({
      query: ({ id, assignment, category }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: { assignment, category },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'AssignmentKeyword', id }],
    }),
    deleteAssignmentKeyword: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'AssignmentKeyword', id }],
    }),
  }),
});

export const {
  useGetAssignmentKeywordsQuery,
  useAddAssignmentKeywordMutation,
  useUpdateAssignmentKeywordMutation,
  useDeleteAssignmentKeywordMutation,
} = assignmentKeywordsApi;
