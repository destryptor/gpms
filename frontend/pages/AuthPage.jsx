import { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/AuthPage.css';

const AuthPage = () => {
	const [isLogin, setIsLogin] = useState(true);
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [role, setRole] = useState('');
	const [loading, setLoading] = useState(false);

	const [name, setName] = useState('');
	const [dateOfBirth, setDateOfBirth] = useState('');
	const [sex, setSex] = useState('');
	const [occupation, setOccupation] = useState('');
	const [qualification, setQualification] = useState('');
	const [address, setAddress] = useState('');
	const [phoneNumber, setPhoneNumber] = useState('');
	const [income, setIncome] = useState('');

	const [monitorType, setMonitorType] = useState('');
	const [contact, setContact] = useState('');
	const [website, setWebsite] = useState('');

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!username.trim() || !password.trim()) {
			alert('Username and password are required!');
			return;
		}

		if (!isLogin && !role) {
			alert('Please select a role!');
			return;
		}

		if (!isLogin && password !== confirmPassword) {
			alert('Passwords do not match!');
			return;
		}

		const endpoint = isLogin ? '/login' : '/register';
		const payload = { username, password, role };

		if (role === 'citizen') {
			Object.assign(payload, { name, date_of_birth: dateOfBirth, sex, occupation, qualification, address, phone_number: phoneNumber, income });
		} else if (role === 'government_monitor') {
			Object.assign(payload, { name, type: monitorType, contact, website });
		}

		setLoading(true);

		try {
			const response = await fetch(`http://localhost:5000${endpoint}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});

			const data = await response.json();
			if (response.ok) {
				alert(data.message);
			} else {
				alert(data.error || 'Something went wrong. Please try again.');
			}
		} catch (err) {
			alert('Server error. Please try again later.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='auth-container'>
			<h2 className='auth-title'>{isLogin ? 'Login' : 'Register'}</h2>
			<form className='auth-form' onSubmit={handleSubmit}>
				<input type='text' placeholder='Username' className='auth-input' required value={username} onChange={(e) => setUsername(e.target.value)} />
				<input type='password' placeholder='Password' className='auth-input' required value={password} onChange={(e) => setPassword(e.target.value)} />
				{!isLogin && (
					<>
						<input type='password' placeholder='Confirm Password' className='auth-input' required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
						<div className='role-selection'>
							<label>
								<input type='radio' name='role' value='citizen' checked={role === 'citizen'} onChange={(e) => setRole(e.target.value)} />
								Citizen
							</label>
							{/* <label>
								<input type='radio' name='role' value='panchayat_employee' checked={role === 'panchayat_employee'} onChange={(e) => setRole(e.target.value)} />
								Panchayat Employee
							</label> */}
							<label>
								<input type='radio' name='role' value='government_monitor' checked={role === 'government_monitor'} onChange={(e) => setRole(e.target.value)} />
								Government Monitor
							</label>
						</div>

						{(role === 'citizen') && (
							<>
								<input type='text' placeholder='Full Name' className='auth-input' required value={name} onChange={(e) => setName(e.target.value)} />
								<input type='date' placeholder='Date of Birth' className='auth-input' required value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
								<select className='auth-input' required value={sex} onChange={(e) => setSex(e.target.value)}>
									<option value=''>Select Gender</option>
									<option value='Male'>Male</option>
									<option value='Female'>Female</option>
									<option value='Other'>Other</option>
								</select>
								<input type='text' placeholder='Occupation' className='auth-input' value={occupation} onChange={(e) => setOccupation(e.target.value)} />
								<select className='auth-input' required value={qualification} onChange={(e) => setQualification(e.target.value)}>
									<option value=''>Select Qualification</option>
									<option value='None'>None</option>
									<option value='Class 10'>Class 10</option>
									<option value='Class 12'>Class 12</option>
									<option value='Diploma'>Diploma</option>
									<option value='Undergraduate'>Undergraduate</option>
									<option value='Postgraduate'>Postgraduate</option>
									<option value='Doctorate (PhD)'>Doctorate (PhD)</option>
								</select>
								<input type='text' placeholder='Address' className='auth-input' required value={address} onChange={(e) => setAddress(e.target.value)} />
								<input type='text' placeholder='Phone Number' className='auth-input' value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
								<input type='number' placeholder='Income' className='auth-input' value={income} onChange={(e) => setIncome(e.target.value)} />
							</>
						)}

						{role === 'government_monitor' && (
							<>
								<input type='text' placeholder='Full Name' className='auth-input' required value={name} onChange={(e) => setName(e.target.value)} />
								<input type='text' placeholder='Type' className='auth-input' required value={monitorType} onChange={(e) => setMonitorType(e.target.value)} />
								<input type='text' placeholder='Contact' className='auth-input' required value={contact} onChange={(e) => setContact(e.target.value)} />
								<input type='url' placeholder='Website' className='auth-input' value={website} onChange={(e) => setWebsite(e.target.value)} />
							</>
						)}
					</>
				)}

				<button className='auth-button' disabled={loading}>
					{loading ? 'Processing...' : isLogin ? 'Login' : 'Register'}
				</button>
			</form>

			<button className='auth-toggle' onClick={() => {
					setUsername('');
					setPassword('');
					setIsLogin(!isLogin)
				}}>
				{isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
			</button>
		</div>
	);
};

export default AuthPage;
