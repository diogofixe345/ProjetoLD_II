// Login.jsx

import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { TextInput, Button, Callout } from '@tremor/react';

function Login() {
    const [Username, setUsername] = useState('');
    const [Password, setPassword] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null); 
    const [error, setError] = useState('');
    const [emptyFieldsError, setEmptyFieldsError] = useState(false);

    useEffect(() => {
        const loggedInUser = localStorage.getItem('utilizador');
        if (loggedInUser) {
            try {
                const user = JSON.parse(loggedInUser);
                setUserData(user);
                setIsLoggedIn(true);
            } catch (e) {
                localStorage.removeItem('utilizador'); 
                setIsLoggedIn(false);
            }
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setEmptyFieldsError(false);
        setError('');

        if (!Username || !Password) {
            setEmptyFieldsError(true);
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Inclui credenciais para receber o cookie de sessão
                body: JSON.stringify({ Username, Password }),
            });
            
            const data = await response.json();

            if (response.ok) {
                setIsLoggedIn(true);
                setUserData(data); 
                localStorage.setItem('utilizador', JSON.stringify(data)); 
            } else {
                setError(data.message || 'Erro de autenticação.');
            }
        } catch (error) {
            setError('Erro de conexão ao servidor.');
        }
    };
    
    if (isLoggedIn) {
        return <Navigate to="/" />; 
    }

    return (
        <form onSubmit={handleLogin}>
            <div className='mt-14 mx-96'>
                <h2 className='mb-9 text-4xl'>Login</h2>
                <div className='mb-1.5'><label htmlFor="Username">Username <span className="text-red-500">*</span></label></div>
                <TextInput
                    error={emptyFieldsError && !Username || !!error}
                    placeholder="Username"
                    value={Username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                {emptyFieldsError && !Username && (<Callout color="red" className='mt-2'>Por favor, preencha o campo Username.</Callout>)}

                <div className='mt-3 mb-1.5'><label htmlFor="Password">Password <span className="text-red-500">*</span></label></div>
                <TextInput
                    error={emptyFieldsError && !Password || !!error}
                    placeholder="Password"
                    type="password"
                    value={Password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                {emptyFieldsError && !Password && (<Callout color="red" className='mt-2'>Por favor, preencha o campo Password.</Callout>)}

                {error && (<Callout color="red" className='mt-5'>{error}</Callout>)}

                <div className='mt-5'>
                    <Button className="bg-yellow-400 hover:bg-yellow-500 font-semibold border border-yellow-500 rounded-xl shadow-md transition-all duration-200" type='submit'>Login</Button>
                </div>
            </div>
        </form>
    );
}

export default Login;