import { Link } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage = () => {
	return (
		<div className="landing-container">
			<h2 className="landing-title">Welcome to the Gram Panchayat Management System</h2>
			<Link to="/auth" className="landing-button">
				Login / Register
			</Link>
		</div>
	);
};

export default LandingPage;
