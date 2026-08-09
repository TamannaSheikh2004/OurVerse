/**
 * Centralized API & Socket.IO Base URL Configuration
 * In local development (Vite dev proxy): API_BASE_URL is empty ('') and calls rely on Vite proxy.
 * In production (Netlify -> Render): VITE_API_URL is set to 'https://ourverse-backend.onrender.com'.
 */
export const API_BASE_URL: string = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
