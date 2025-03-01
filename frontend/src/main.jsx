import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import Layout from '../components/Layout.jsx';
import LandingPage from '../pages/LandingPage.jsx';
import AuthPage from '../pages/AuthPage.jsx';
import './index.css';
import Dashboard from '../pages/Dashboard.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<BrowserRouter>
			<Routes>
				<Route path='/' element={<Layout />}>
					<Route index element={<LandingPage />} />
				</Route>
				<Route path='/auth' element={<AuthPage />} />
				<Route path='/dashboard/*' element={<Dashboard />} />
			</Routes>
		</BrowserRouter>
	</React.StrictMode>
);
