import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const keywordsApi = createApi({
  reducerPath: 'keywordsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3001/keywords',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Keywords'], // Объявляем типы тегов
  endpoints: (builder) => ({
    getKeywords: builder.query({
      query: () => '/',
      providesTags: ['Keywords'], // При получении, помечаем данными этот тег
    }),
    addKeyword: builder.mutation({
      query: (keyword) => ({
        url: '/',
        method: 'POST',
        body: keyword,
      }),
      invalidatesTags: ['Keywords'], // При добавлении инвалидируем тег, чтобы refetch прошёлся
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
