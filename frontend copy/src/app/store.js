// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice'; // ваш редьюсер для аутентификации
import { authApi } from '../features/auth/authApi';       // RTK Query-сервис для auth
import { keywordsApi } from '../features/keywords/keywordsApi'; // для ключевых слов (контрагент)
import { assignmentKeywordsApi } from '../features/assignmentKeywords/assignmentKeywordsApi'; // для правил по назначению платежа

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [keywordsApi.reducerPath]: keywordsApi.reducer,
    [assignmentKeywordsApi.reducerPath]: assignmentKeywordsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      keywordsApi.middleware,
      assignmentKeywordsApi.middleware
    ),
});
