import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

if (!BACKEND_URL) {
  throw new Error(
    'VITE_BACKEND_URL is not set. Copy frontend/.env.example to frontend/.env and set it to your backend URL.'
  );
}

export const socket = io(BACKEND_URL);

export function emit(event, payload) {
  return new Promise((resolve) => {
    socket.emit(event, payload, (response) => resolve(response));
  });
}
