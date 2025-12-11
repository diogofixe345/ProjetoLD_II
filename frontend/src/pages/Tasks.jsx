import React, { useEffect, useState, useCallback } from 'react';
import { Card, Button } from '@tremor/react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import toast, { Toaster } from 'react-hot-toast';

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
    const navigate = useNavigate();

    const fetchTarefas = useCallback(async () => {
        if (!currentUser) {
            setTarefas([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('http://localhost:3000/tarefas', { credentials: 'include' });
            
            if (res.ok) {
                const data = await res.json();
                setTarefas(Array.isArray(data) ? data : []);
            } else {
                setTarefas([]);
                if (res.status === 401) {
                    toast.error("Sessão expirada. Faça login novamente.");
                    localStorage.removeItem('utilizador');
                    navigate('/login');
                } else {
                    toast.error("Erro ao obter tarefas.");
                }
            }
        } catch (error) {
            console.error("Erro ao carregar tarefas:", error);
            toast.error("Não foi possível carregar as tarefas.");
            setTarefas([]);
        } finally {
            setLoading(false);
        }
    }, [currentUser, navigate]);

    useEffect(() => {
        fetchTarefas();
    }, [fetchTarefas]);

    const eliminarTarefa = async (id) => {
        if (!window.confirm("Tem a certeza que quer eliminar esta tarefa?")) return;

        try {
            const response = await fetch(`http://localhost:3000/tarefas/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (response.ok) {
                setTarefas(tarefas.filter(t => t.Id !== id));
                toast.success("Tarefa eliminada com sucesso!");
            } else {
                const errorData = await response.json();
                toast.error(`Erro: ${errorData.message}`);
            }
        } catch (error) {
            console.error("Erro:", error);
            toast.error("Erro de conexão ao eliminar tarefa.");
        }
    };

    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const ordemColunas = { 'ToDo': 0, 'Doing': 1, 'Done': 2 };
        const indexOrigem = ordemColunas[source.droppableId];
        const indexDestino = ordemColunas[destination.droppableId];

        if (Math.abs(indexDestino - indexOrigem) > 1) {
            toast.error("Não é permitido saltar etapas! Mova uma coluna de cada vez.", { icon: '🚫' });
            return;
        }

        const novoEstado = destination.droppableId;
        const tarefaId = parseInt(draggableId);

        const tarefasAtualizadas = tarefas.map(t => 
            t.Id === tarefaId ? { ...t, EstadoAtual: novoEstado } : t
        );
        setTarefas(tarefasAtualizadas);

        try {
            const response = await fetch(`http://localhost:3000/tarefas/${tarefaId}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ novoEstado }),
            });

            if (!response.ok) {
                const err = await response.json();
                toast.error("Erro: " + (err.message || "Erro desconhecido"));
                fetchTarefas(); 
            }
        } catch (error) {
            console.error("Erro de rede:", error);
            toast.error("Erro de conexão.");
            fetchTarefas(); 
        }
    };

    const colunas = ['ToDo', 'Doing', 'Done'];
    const isGestor = currentUser && currentUser.Papel === 'Gestor';

    if (!currentUser) return <div className="p-10 text-center">Acesso Restrito</div>;
    if (loading) return <p className="text-center mt-10">A carregar tarefas...</p>;

    return (
        <div className="container mx-auto p-4">
            <Toaster position="top-center" reverseOrder={false} />
            <h1 className="text-3xl font-bold text-center mt-10 mb-8">Kanban de Tarefas</h1>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex justify-between space-x-4">
                    {colunas.map(coluna => {
                        const tarefasDaColuna = tarefas.filter(t => t.EstadoAtual === coluna);

                        return (
                            <Droppable key={coluna} droppableId={coluna}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`w-1/3 p-4 rounded-lg shadow-inner min-h-[400px] transition-colors ${
                                            snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-50'
                                        }`}
                                    >
                                        <h2 className={`text-xl font-semibold mb-4 text-center p-2 rounded-md ${
                                            coluna === 'ToDo' ? 'bg-red-200 text-red-800' :
                                            coluna === 'Doing' ? 'bg-yellow-200 text-yellow-800' :
                                            'bg-green-200 text-green-800'
                                        }`}>
                                            {coluna} ({tarefasDaColuna.length})
                                        </h2>

                                        {tarefasDaColuna.map((t, index) => {
                                            const isMyTask = t.IdProgramador === currentUser.Id;
                                            const canDrag = isGestor || isMyTask;

                                            return (
                                                <Draggable key={t.Id} draggableId={t.Id.toString()} index={index} isDragDisabled={!canDrag}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            style={{ ...provided.draggableProps.style, opacity: snapshot.isDragging ? 0.8 : 1 }}
                                                        >
                                                            <Card className={`mb-4 p-3 shadow-md border-t-4 transition-shadow ${canDrag ? 'border-blue-500 cursor-grab hover:shadow-lg' : 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-80'}`}>
                                                                <div className="flex justify-between items-start">
                                                                    <p className="text-lg font-bold">{t.Descricao}</p>
                                                                    {!canDrag && <span className="text-gray-400 text-xs">🔒</span>}
                                                                </div>
                                                                <p className="text-sm text-gray-600">Dev: {t.NomeProgramador}</p>
                                                                <p className="text-sm text-gray-600">Tipo: {t.Tipo}</p>
                                                                
                                                                <div className="my-2 border-t pt-2 text-xs text-gray-500">
                                                                    <p>Início: {t.DataPrevistaInicio ? t.DataPrevistaInicio.slice(0, 10) : '-'}</p>
                                                                    <p>Fim: {t.DataPrevistaFim ? t.DataPrevistaFim.slice(0, 10) : '-'}</p>
                                                                    <p className="font-semibold mt-1">Ordem: {t.OrdemExecucao} | SP: {t.StoryPoints}</p>
                                                                </div>

                                                                <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100">
                                                                    {!isGestor && (
                                                                        <Button 
                                                                            onClick={() => navigate(`/task/${t.Id}`)} 
                                                                            className="flex-1" 
                                                                            color="slate" 
                                                                            size="xs" 
                                                                            variant="secondary"
                                                                        >
                                                                            Ver Detalhes
                                                                        </Button>
                                                                    )}

                                                                    {isGestor && (
                                                                        <>
                                                                            <Button onClick={() => navigate(`/edittask/${t.Id}`)} className="flex-1" color="blue" size="xs" variant="secondary">Editar</Button>
                                                                            {t.EstadoAtual === 'Done' && (
                                                                                <Button onClick={() => eliminarTarefa(t.Id)} className="flex-1" color="red" size="xs" variant="secondary">Eliminar</Button>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </Card>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            );
                                        })}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        );
                    })}
                </div>
            </DragDropContext>
        </div>
    );
}

export default Tasks;