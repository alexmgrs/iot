// AuthContext.js
import React, { createContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [authToken, setAuthToken] = useState(localStorage.getItem('token') || null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setAuthToken(token);
            // Vous pouvez ajouter une fonction pour obtenir les détails de l'utilisateur à partir du token ici
            // ex: fetchUserDetails(token);
        }
    }, []);

    const login = (token) => {
        localStorage.setItem('token', token);
        setAuthToken(token);
        // Vous pouvez ajouter une fonction pour obtenir les détails de l'utilisateur à partir du token ici
        // ex: fetchUserDetails(token);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setAuthToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ authToken, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
