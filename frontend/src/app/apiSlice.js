// src/app/apiSlice.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api', // уникальный ключ в сторе
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:3001' }),
  endpoints: (builder) => ({
    registerUser: builder.mutation({
      query: (credentials) => ({
        url: '/auth/register',
        method: 'POST',
        body: credentials,
      }),
    }),
    loginUser: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
  }),
});

export const { useRegisterUserMutation, useLoginUserMutation } = apiSlice;
