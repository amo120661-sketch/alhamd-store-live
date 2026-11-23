import React from 'react';
import { createRoot } from 'react-dom/client';
import { AdminDashboard } from './components/AdminDashboard';
import { StoreProvider } from './context/StoreContext';
import './index.css';

createRoot(document.getElementById('root')!).render(<React.StrictMode><StoreProvider><div dir="rtl" className="min-h-screen bg-[#FAFAF8] text-slate-900"><AdminDashboard /></div></StoreProvider></React.StrictMode>);
