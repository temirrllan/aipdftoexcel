// src/features/keywords/keywordsApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const keywordsApi = createApi({
  reducerPath: 'keywordsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3001/keywords',
    prepareHeaders: (headers, { getState }) => {
      // Пробуем получить токен из глобального состояния auth
      const tokenFromState = getState().auth && getState().auth.token;
      // Если нет в state, попытка взять токен из localStorage
      const token = tokenFromState || localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Keywords'],
  endpoints: (builder) => ({
    getKeywords: builder.query({
      query: () => '/',
      providesTags: ['Keywords'],
    }),
    addKeyword: builder.mutation({
      query: (body) => ({
        url: '/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Keywords'],
    }),
    updateKeyword: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ['Keywords'],
    }),
    deleteKeyword: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Keywords'],
    }),
  }),
});

export const {
  useGetKeywordsQuery,
  useLazyGetKeywordsQuery,
  useAddKeywordMutation,
  useUpdateKeywordMutation,
  useDeleteKeywordMutation,
} = keywordsApi;
