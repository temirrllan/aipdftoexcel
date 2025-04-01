// src/features/auth/authApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3001/auth',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token')
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (user) => ({
        url: '/register',
        method: 'POST',
        body: user,
      }),
    }),
    login: builder.mutation({
      query: (credentials) => ({
        url: '/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    getProfile: builder.query({
      query: () => '/profile',
    }),
  }),
})

export const { useRegisterMutation, useLoginMutation, useGetProfileQuery } = authApi
