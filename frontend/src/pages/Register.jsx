import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextInput, Button, Select, SelectItem } from '@tremor/react';
import toast, { Toaster } from 'react-hot-toast';

function Register() {
  const [Nome, setNome] = useState('');
  const [Username, setUsername] = useState('');
  const [Password, setPassword] = useState('');
  const [Papel, setPapel] = useState('Gestor');
  
  const [NivelExperiencia, setNivelExperiencia] = useState('');
  const [Departamento, setDepartamento] = useState('');

  const [emptyFieldsError, setEmptyFieldsError] = useState(false);
  const [passwordInvalid, setPasswordInvalid] = useState(false);
  
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userStored = localStorage.getItem('utilizador');
    if (userStored) {
      const user = JSON.parse(userStored);
      setCurrentUser(user);
      if (user.Papel === 'Programador') {
        navigate('/');
      }
    }
  }, [navigate]);

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return passwordRegex.test(password);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setEmptyFieldsError(false);
    setPasswordInvalid(false);

    if (!Nome || !Username || !Password || !Papel) {
      setEmptyFieldsError(true);
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (Papel === 'Programador' && !NivelExperiencia) {
      toast.error("Selecione o nível de experiência.");
      return;
    }
    if (Papel === 'Gestor' && !Departamento) {
      setEmptyFieldsError(true); 
      toast.error("Preencha o departamento.");
      return;
    }

    if (!validatePassword(Password)) {
      setPasswordInvalid(true);
      toast.error('A senha deve ter 8+ caracteres, maiúscula, minúscula, número e símbolo.');
      return;
    }

    const loadingToast = toast.loading('A registar...');

    try {
      const response = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', 
        body: JSON.stringify({ 
            Nome, 
            Username, 
            Password, 
            Papel,
            NivelExperiencia: Papel === 'Programador' ? NivelExperiencia : null,
            Departamento: Papel === 'Gestor' ? Departamento : null 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message, { id: loadingToast });
        
        if (!currentUser) {
            setTimeout(() => navigate('/login'), 1500);
        } else {
            setNome(''); setUsername(''); setPassword(''); 
            setNivelExperiencia(''); setDepartamento('');
        }
      } else {
        toast.error(data.message || 'Erro no registo.', { id: loadingToast });
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro de conexão com o servidor.', { id: loadingToast });
    }
  };

  const podeCriarProgramador = currentUser && currentUser.Papel === 'Gestor';

  return (
    <form onSubmit={handleRegister}>
      <div className='mt-14 mx-96 pb-20'>
        <Toaster position="top-center" />
        
        <h2 className='mb-9 text-4xl'>
            {currentUser ? 'Criar Novo Utilizador' : 'Registo de Gestor'}
        </h2>

        <div className='mb-1.5'><label>Nome <span className="text-red-500">*</span></label></div>
        <TextInput error={emptyFieldsError && !Nome} placeholder="Nome" value={Nome} onChange={(e) => setNome(e.target.value)} />

        <div className='mt-3 mb-1.5'><label>Username <span className="text-red-500">*</span></label></div>
        <TextInput error={emptyFieldsError && !Username} placeholder="Username" value={Username} onChange={(e) => setUsername(e.target.value)} />

        <div className='mt-3 mb-1.5'><label>Papel <span className="text-red-500">*</span></label></div>
        <Select value={Papel} onValueChange={setPapel} disabled={!podeCriarProgramador}>
          <SelectItem value="Gestor">Gestor</SelectItem>
          {podeCriarProgramador && <SelectItem value="Programador">Programador</SelectItem>}
        </Select>

        {Papel === 'Gestor' && (
            <div className="mt-3">
                <div className='mb-1.5'><label>Departamento <span className="text-red-500">*</span></label></div>
                <Select 
                    value={Departamento} 
                    onValueChange={setDepartamento}
                    placeholder="Selecione o departamento"
                    error={emptyFieldsError && !Departamento} 
                >
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Administração">Administração</SelectItem>
                </Select>
            </div>
        )}

        {Papel === 'Programador' && (
            <div className="mt-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className='mb-1.5'><label className="text-blue-900 font-semibold">Nível de Experiência <span className="text-red-500">*</span></label></div>
                <Select value={NivelExperiencia} onValueChange={setNivelExperiencia}>
                    <SelectItem value="Junior">Júnior</SelectItem>
                    <SelectItem value="Senior">Sénior</SelectItem>
                </Select>
            </div>
        )}

        <div className='mt-3 mb-1.5'><label>Password <span className="text-red-500">*</span></label></div>
        <TextInput error={emptyFieldsError && !Password || passwordInvalid} placeholder="Password" type="password" value={Password} onChange={(e) => setPassword(e.target.value)} />

        <div className='mt-5'>
          <Button className="bg-yellow-400 hover:bg-yellow-500 font-semibold border border-yellow-500 rounded-xl shadow-md" type='submit'>
            {currentUser ? 'Adicionar Utilizador' : 'Registar'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default Register;