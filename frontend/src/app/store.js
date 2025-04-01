// src/app/store.js
import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { keywordsApi } from '../features/keywords/keywordsApi'
// Если у вас есть другие API, например authApi, импортируйте и его тоже:
// import { authApi } from '../features/auth/authApi'

export const store = configureStore({
  reducer: {
    // Добавляем reducer RTK Query
    [keywordsApi.reducerPath]: keywordsApi.reducer,
    // Если есть другой API:
    // [authApi.reducerPath]: authApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      keywordsApi.middleware,
      // Если есть другой API:
      // authApi.middleware
    ),
})

// Это необязательно, но полезно для автоматического рефетчинга при фокусе и т.п.
setupListeners(store.dispatch)
