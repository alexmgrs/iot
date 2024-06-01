import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (event) => {
        event.preventDefault();
        try {
            const response = await axios.post('http://localhost:3001/login', { username, password });
            const token = response.data.token;  // Assurez-vous que le backend retourne le token avec la clé 'token'
            console.log('Logged in!', response.data);

            localStorage.setItem('token', token);  // Stocke le token dans le localStorage

            onLogin(username);  // Assurez-vous que cela met à jour l'état approprié pour isLoggedIn
            navigate('/home');  // Redirige vers Home après la connexion
        } catch (error) {
            console.error('Failed to login', error);
            alert('Login failed!');
        }
    };

    return (
        <form onSubmit={handleLogin}>
            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
            />
            <button type="submit">Login</button>
        </form>
    );
}

export default Login;
