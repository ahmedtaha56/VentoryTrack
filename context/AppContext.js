// context/AppContext.tsx
import React, { useReducer, createContext } from 'react';

export const AppContext = createContext();

const initialState = {
  products: [],
  categories: [],
  suppliers: [],
  stockLogs: [],
  sales: [],
  notifications: [],
  user: null,
  dataVersion: 0,
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'INVALIDATE_DATA':
      return {
        ...state,
        dataVersion: state.dataVersion + 1,
      };

    // Product Actions
    case 'SET_PRODUCTS':
      return {
        ...state,
        products: action.payload,
      };

    case 'ADD_PRODUCT':
      return {
        ...state,
        products: [action.payload, ...state.products],
      };

    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map((product) =>
          product.id === action.payload.id ? action.payload : product
        ),
      };

    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter((product) => product.id !== action.payload),
      };

    // Category Actions
    case 'SET_CATEGORIES':
      return {
        ...state,
        categories: action.payload,
      };

    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [action.payload, ...state.categories],
      };

    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map((category) =>
          category.id === action.payload.id ? action.payload : category
        ),
      };

    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter((category) => category.id !== action.payload),
      };

    // Supplier Actions
    case 'SET_SUPPLIERS':
      return {
        ...state,
        suppliers: action.payload,
      };

    case 'ADD_SUPPLIER':
      return {
        ...state,
        suppliers: [action.payload, ...state.suppliers],
      };

    case 'UPDATE_SUPPLIER':
      return {
        ...state,
        suppliers: state.suppliers.map((supplier) =>
          supplier.id === action.payload.id ? action.payload : supplier
        ),
      };

    case 'DELETE_SUPPLIER':
      return {
        ...state,
        suppliers: state.suppliers.filter((supplier) => supplier.id !== action.payload),
      };

    // Stock Log Actions
    case 'SET_STOCK_LOGS':
      return {
        ...state,
        stockLogs: action.payload,
      };

    case 'ADD_STOCK_LOG':
      return {
        ...state,
        stockLogs: [action.payload, ...state.stockLogs],
      };

    case 'STOCK_IN':
      return {
        ...state,
        products: state.products.map((product) =>
          product.id === action.payload.productId
            ? { ...product, quantity: product.quantity + action.payload.quantity }
            : product
        ),
      };

    case 'STOCK_OUT':
      return {
        ...state,
        products: state.products.map((product) =>
          product.id === action.payload.productId
            ? { ...product, quantity: product.quantity - action.payload.quantity }
            : product
        ),
      };

    // Sales Actions
    case 'SET_SALES':
      return {
        ...state,
        sales: action.payload,
      };

    case 'ADD_SALE':
      return {
        ...state,
        sales: [action.payload, ...state.sales],
      };

    // User Actions
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
      };

    case 'LOGOUT':
      return initialState;

    default:
      return state;
  }
};

const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
