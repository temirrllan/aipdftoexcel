import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'keywordsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3001/keywords',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token'); // или откуда вы берете токен
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getKeywords: builder.query({ query: () => '/' }),
    addKeyword: builder.mutation({
      query: (body) => ({
        url: '/',
        method: 'POST',
        body,
      }),
    }),
    // ... updateKeyword, deleteKeyword
  }),
});

export const {
  useGetKeywordsQuery,
  useLazyGetKeywordsQuery,
  useAddKeywordMutation,
  // ...
} = apiSlice;
