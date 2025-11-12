// Tasks.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { Card, Button, Callout } from '@tremor/react';
import TaskForm from './TaskForm'; 

const getLoggedInUser = () => {
    const userStr = localStorage.getItem('utilizador');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            return null;
        }
    }
    return null;
};


function Tasks() {
    const [tarefas, setTarefas] = useState([]);
    const [currentUser, setCurrentUser] = useState(getLoggedInUser());
    const [loading, setLoading] = useState(true);

    const fetchTarefas = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3000/tarefas', {
                credentials: 'include' // Essencial para o cookie
            });
            const data = await res.json();
            setTarefas(data);
        } catch (error) {
            console.error("Erro ao carregar tarefas:", error);
            setTarefas([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTarefas();
    }, [fetchTarefas]);

    const moverTarefa = async (id, estadoAtual) => {
        let novoEstado;
        if (estadoAtual === 'ToDo') {
            novoEstado = 'Doing';
        } else if (estadoAtual === 'Doing') {
            novoEstado = 'Done';
        } else {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/tarefas/${id}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Essencial para o cookie
                body: JSON.stringify({ novoEstado }),
            });

            if (response.ok) {
                setTarefas(tarefas.map(t => t.Id === id ? { ...t, EstadoAtual: novoEstado } : t));
            } else {
                const errorData = await response.json();
                alert(`Erro ao mover tarefa: ${errorData.message}`);
            }
        } catch (error) {
            console.error("Erro de rede ao mover tarefa:", error);
        }
    };

    const colunas = ['ToDo', 'Doing', 'Done'];
    const isGestor = currentUser && currentUser.Papel === 'Gestor';
    {isGestor && (
     <TaskForm onTaskCreated={fetchTarefas} gestorId={currentUser.Id} />
)}
    if (loading) return <p className="text-center mt-10">A carregar tarefas...</p>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold text-center mt-10 mb-8">Kanban de Tarefas</h1>
            
            <div className="flex justify-between space-x-4">
                {colunas.map(coluna => (
                    <div key={coluna} className="w-1/3 bg-gray-50 p-4 rounded-lg shadow-inner">
                        <h2 className={`text-xl font-semibold mb-4 text-center p-2 rounded-md ${
                            coluna === 'ToDo' ? 'bg-red-200 text-red-800' : 
                            coluna === 'Doing' ? 'bg-yellow-200 text-yellow-800' : 
                            'bg-green-200 text-green-800'
                        }`}>{coluna} ({tarefas.filter(t => t.EstadoAtual === coluna).length})</h2>
                        
                        {tarefas.filter(t => t.EstadoAtual === coluna).map(t => (
                            <Card key={t.Id} className="mb-4 p-3 shadow-md border-t-4 border-blue-500">
                                <p className="text-lg font-bold">{t.Descricao}</p>
                                <p className="text-sm text-gray-600">Prog.: {t.NomeProgramador} | Tipo: {t.Tipo}</p>
                                <p className="text-xs text-gray-500">SP: {t.StoryPoints}</p>
                                
                                {(coluna === 'ToDo' || coluna === 'Doing') && (
                                    <Button
                                        onClick={() => moverTarefa(t.Id, coluna)}
                                        className="mt-3 w-full"
                                        color={coluna === 'ToDo' ? 'yellow' : 'green'}
                                        size="xs"
                                    >
                                        Mover para {coluna === 'ToDo' ? 'Doing' : 'Done'}
                                    </Button>
                                )}
                            </Card>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Tasks;