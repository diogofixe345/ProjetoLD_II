import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('utilizador');
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);
      } catch (e) {
        console.error("Erro ao ler dados do utilizador", e);
      }
    }
  }, []);

  const isGestor = user && user.Papel === 'Gestor';
  const isProgramador = user && user.Papel === 'Programador';

  return (
    <nav className="bg-gray-700 fixed z-50 h-[60px] content-center w-full">
      <div className="mx-12">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <a href="/" className="text-white font-bold text-xl">iTask</a>
          </div>

          <div className="hidden md:flex items-center space-x-10">
            {user ? (
              <div className='flex items-center gap-8'>
                
                {isGestor && (
                  <div className="flex gap-8 mr-4">
                    <Link to="/manage-types" className="text-white hover:text-gray-300">Gestão Tipos de Tarefas</Link>
                    <Link to="/equipa" className="text-white text-lg transition duration-300 hover:text-gray-300">Equipa</Link>
                    <Link to="/manager-forecast" className="text-white text-lg transition duration-300 hover:text-gray-300">Previsão</Link>
                    <Link to="/manager-active-tasks" className="text-white text-lg transition duration-300 hover:text-gray-300">Prazos</Link>
                    <Link to="/manager-history" className="text-white text-lg transition duration-300 hover:text-gray-300">Histórico de Trefas Concluidas</Link>
                    <a href="/taskform" className="text-white text-lg transition duration-300 hover:text-gray-300">Criar Tarefa</a>
                    <a href="/register" className="text-white text-lg transition duration-300 hover:text-gray-300">Registo</a>
                  </div>
                )}

                {isProgramador && (
                  <div className="flex gap-8 mr-4">
                    <Link to="/history" className="text-white text-lg transition duration-300 hover:text-gray-300">
                        Tarefas Concluidas
                    </Link>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Link to={'/conta'}> 
                    <img
                      src="./src/images/profile_image.jpg"
                      alt="Conta"
                      className="h-10 w-10 rounded-full border-2 border-transparent hover:border-white transition-all object-cover"
                    />
                  </Link>
                  <Link to={'/conta'}>
                    <span className="text-white font-semibold text-lg">
                        {user.Nome}
                    </span> 
                  </Link>
                </div>

              </div>
            ) : (
              <div className="flex gap-8">
                <a href="/login" className="text-white text-lg transition duration-300 hover:text-gray-300">Login</a>
                <a href="/register" className="text-white text-lg transition duration-300 hover:text-gray-300">Registo</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;