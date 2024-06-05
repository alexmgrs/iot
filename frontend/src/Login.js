import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom'; // Importe Link depuis react-router-dom
import './Login.css'; // Importe le fichier CSS

function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (event) => {
        event.preventDefault();
        try {
            const response = await axios.post('http://localhost:3001/login', { username, password });
            const token = response.data.token;
            console.log('Logged in!', response.data);

            localStorage.setItem('token', token);

            onLogin(username);
            navigate('/home');
        } catch (error) {
            console.error('Failed to login', error);
            alert('Login failed!');
        }
    };

    return (
        <div>
            <form className="Login-form" onSubmit={handleLogin}>
                <input
                    className="Login-input"
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                />
                <input
                    className="Login-input"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />
                <button className="Login-button" type="submit">Login</button>
            </form>
            <div className="Register-link"> {/* Ajoute une div pour le lien Register */}
                <span>No account? </span> {/* Texte "No account?" */}
                <Link to="/register">Register</Link> {/* Lien vers la page d'inscription */}
            </div>
        </div>
    );
}

export default Login;
