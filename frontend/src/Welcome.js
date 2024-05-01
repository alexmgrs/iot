import React from 'react';
import { Link } from 'react-router-dom';

function Welcome() {
    return (
        <div>
            <h1>Welcome to Our Application</h1>
            <div>
                <Link to="/login">Login</Link> | <Link to="/register">Register</Link>
            </div>
        </div>
    );
}

export default Welcome;
