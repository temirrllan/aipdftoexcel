// src/features/keywords/keywordsApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const keywordsApi = createApi({
  reducerPath: 'keywordsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3001/keywords',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token')
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  endpoints: (builder) => ({
    getKeywords: builder.query({
      query: () => '/',
    }),
    addKeyword: builder.mutation({
      query: (keyword) => ({
        url: '/',
        method: 'POST',
        body: keyword,
      }),
    }),
    updateKeyword: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: patch,
      }),
    }),
    deleteKeyword: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
    }),
  }),
})

export const {
  useGetKeywordsQuery,
  useAddKeywordMutation,
  useUpdateKeywordMutation,
  useDeleteKeywordMutation,
} = keywordsApi
