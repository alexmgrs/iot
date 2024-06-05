import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Importe Link depuis react-router-dom
import './Register.css'; // Importe le fichier CSS

function Register() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = async (event) => {
        event.preventDefault();
        try {
            const response = await axios.post('http://localhost:3001/register', { email, username, password });
            console.log('User registered!', response.data);
            alert('Registration successful!');
        } catch (error) {
            console.error('Failed to register', error);
            alert('Registration failed!');
        }
    };

    return (
        <div>
            <form className="Register-form" onSubmit={handleRegister}>
                <input
                    className="Register-input"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />
                <input
                    className="Register-input"
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                />
                <input
                    className="Register-input"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />
                <button className="Register-button" type="submit">Register</button>
            </form>
            <div className="Login-link"> {/* Ajoute une div pour le lien Login */}
                <span>Already an account? </span> {/* Texte "Already an account?" */}
                <Link to="/login">Login</Link> {/* Lien vers la page de connexion */}
            </div>
        </div>
    );
}

export default Register;
