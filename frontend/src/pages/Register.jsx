// Register.jsx (Atualizado)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextInput, Button, Callout, Select, SelectItem } from '@tremor/react';
//                                                 ^^^^^^^^^^^^^ NOVAS IMPORTAÇÕES

function Register() {
  const [Nome, setNome] = useState('');
  const [Username, setUsername] = useState('');
  const [Password, setPassword] = useState('');
  const [Papel, setPapel] = useState('Programador'); // 🔑 NOVO ESTADO: Papel (Padrão: Programador)
  const [error, setError] = useState('');
  const [emptyFieldsError, setEmptyFieldsError] = useState(false);
  const [PasswordError, setPasswordError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);


  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return passwordRegex.test(password);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setEmptyFieldsError(false);
    setPasswordError('');
    setError('');

    // Adiciona o Papel à validação de campos vazios, se aplicável
    if (!Nome || !Username || !Password || !Papel) {
      setEmptyFieldsError(true);
      return;
    }


    if (!validatePassword(Password)) {
      setPasswordError('A senha deve conter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // 🔑 INCLUIR O PAPEL NO CORPO DA REQUISIÇÃO
        body: JSON.stringify({ Nome, Username, Password, Papel }),
      });

      const data = await response.json();

      if (response.ok) {
        // Se o registo for bem-sucedido, redireciona para a página principal
        navigate('/');
      } else {
        setError(data.message || 'Erro no registo.');
      }
    } catch (error) {
      console.error('Erro durante o registo:', error);
      setError('Erro ao fazer registo.');
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <div className='mt-14 mx-96'>
        <h2 className='mb-9 text-4xl'>Registo</h2>

        {/* Campo Nome */}
        <div className='mb-1.5'>
          <label htmlFor="nome">Nome <span className="text-red-500">*</span></label>
        </div>
        <TextInput
          error={emptyFieldsError && !Nome}
          placeholder="Nome"
          value={Nome}
          onChange={(e) => setNome(e.target.value)}
        />
        {emptyFieldsError && !Nome && (
          <Callout color="red" className='mt-2'>
            Por favor, preencha o campo Nome.
          </Callout>
        )}

        {/* Campo Username */}
        <div className='mt-3 mb-1.5'>
          <label htmlFor="username">Username <span className="text-red-500">*</span></label>
        </div>
        <TextInput
          error={emptyFieldsError && !Username}
          placeholder="Username"
          value={Username}
          onChange={(e) => setUsername(e.target.value)}
        />
        {emptyFieldsError && !Username && (
          <Callout color="red" className='mt-2'>
            Por favor, preencha o campo Username.
          </Callout>
        )}

        {/* 🔑 NOVO CAMPO: SELECÇÃO DE PAPEL */}
        <div className='mt-3 mb-1.5'>
          <label htmlFor="papel">Registar como <span className="text-red-500">*</span></label>
        </div>
        <Select 
          value={Papel} 
          onValueChange={setPapel} 
          placeholder="Selecione o seu papel"
          className="w-full"
        >
          <SelectItem value="Programador">Programador</SelectItem>
          <SelectItem value="Gestor">Gestor</SelectItem>
        </Select>


        {/* Campo Password */}
        <div className='mt-3 mb-1.5'>
          <label htmlFor="password">Password <span className="text-red-500">*</span></label>
        </div>
        <TextInput
          error={emptyFieldsError && !Password || !!PasswordError}
          placeholder="Password"
          type="password"
          value={Password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {emptyFieldsError && !Password && (
          <Callout color="red" className='mt-2'>
            Por favor, preencha o campo Password.
          </Callout>
        )}
        {PasswordError && (
          <Callout color="red" className='mt-2'>
            {PasswordError}
          </Callout>
        )}

        {error && (
          <Callout color="red" className='mt-5'>
            {error}
          </Callout>
        )}

        <div className='mt-5'>
          <Button className="bg-yellow-400 hover:bg-yellow-500 font-semibold border border-yellow-500 rounded-xl shadow-md transition-all duration-200" type='submit'>Registo</Button>
        </div>

      </div>
    </form>
  );
}

export default Register;