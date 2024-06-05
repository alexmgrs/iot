import React from 'react';
import { Link } from 'react-router-dom';
import './Welcome.css'; // Importez le fichier CSS

function Welcome() {
    return (
        <div className="Welcome-container">
            <h1 className="Welcome-heading">Welcome to Our Application</h1>
            <div className="Welcome-links">
                <Link to="/login">Login</Link> | <Link to="/register">Register</Link>
            </div>
        </div>
    );
}

export default Welcome;
