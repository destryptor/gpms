import { Outlet, Link } from 'react-router-dom';
import '../styles/Layout.css';

const Layout = () => {
	return (
		<div className="layout">
			<nav className="navbar">
				<h1 className="title">Gram Panchayat System</h1>
				<Link to="/auth" className="login-button">Login</Link>
			</nav>
			<main className="main-content">
				<Outlet />
			</main>
		</div>
	);
};

export default Layout;
