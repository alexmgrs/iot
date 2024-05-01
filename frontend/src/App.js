import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import Home from './Home';
import Welcome from './Welcome';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');

    const handleLogin = (usernameFromLogin) => {
        setUsername(usernameFromLogin);
        setIsLoggedIn(true);
    };

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login onLogin={handleLogin} />} />
                <Route path="/register" element={<Register />} />
                <Route path="/home" element={isLoggedIn ? <Home username={username} /> : <Navigate replace to="/login" />} />
                <Route path="/" element={<Welcome />} />
            </Routes>
        </Router>
    );
}

export default App;
