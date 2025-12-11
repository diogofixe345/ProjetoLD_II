import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, TextInput, Title } from '@tremor/react';
import toast, { Toaster } from 'react-hot-toast';


const validateDate = (dateString) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

const TaskForm = ({ onTaskCreated = () => {} }) => {
    const navigate = useNavigate();
    const { id } = useParams(); 
    
    const [programadores, setProgramadores] = useState([]);
    const [tiposTarefa, setTiposTarefa] = useState([]); 
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const [taskData, setTaskData] = useState({
        Descricao: '',
        IdProgramador: '',
        NomeProgramador: '', 
        OrdemExecucao: 1,
        DataPrevistaInicio: '', 
        DataPrevistaFim: '',    
        IdTipoTarefa: '',
        Tipo: '', 
        StoryPoints: ''
    });


    useEffect(() => {
        const userStr = localStorage.getItem('utilizador');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user.Papel === 'Programador' && id) {
                setIsReadOnly(true);
            }
        }
    }, [id]);


    useEffect(() => {
        if (id) {
            setIsLoading(true);
            fetch(`http://localhost:3000/tarefas/${id}`, { credentials: 'include' })
                .then(res => res.json())
                .then(data => {
                    const format = (d) => d ? d.split('T')[0] : '';
                    setTaskData({
                        ...data,
                        DataPrevistaInicio: format(data.DataPrevistaInicio),
                        DataPrevistaFim: format(data.DataPrevistaFim),
                        NomeProgramador: data.NomeProgramador,
                        Tipo: data.Tipo 
                    });
                })
                .catch(() => toast.error("Erro ao carregar tarefa."))
                .finally(() => setIsLoading(false));
        }
    }, [id]);

    useEffect(() => {
        if (!isReadOnly) {
            const fetchProgramadores = async () => {
                try {
                    const response = await fetch('http://localhost:3000/meus-programadores', { credentials: 'include' });
                    if (response.ok) {
                        const data = await response.json();
                        setProgramadores(data);
                        if (!id && data.length > 0) {
                            setTaskData(prev => ({ ...prev, IdProgramador: data[0].Id }));
                        }
                    }
                } catch (error) {
                    console.error("Erro:", error);
                }
            };

            const fetchTipos = async () => {
                try {
                    const response = await fetch('http://localhost:3000/tipos-tarefa', { credentials: 'include' });
                    if (response.ok) {
                        const data = await response.json();
                        setTiposTarefa(data);
                        if (!id && data.length > 0) {
                            setTaskData(prev => ({ ...prev, IdTipoTarefa: data[0].Id }));
                        }
                    }
                } catch (error) {
                    console.error("Erro:", error);
                }
            };

            fetchProgramadores();
            fetchTipos();
        }
    }, [isReadOnly, id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTaskData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isReadOnly) return;

        const { DataPrevistaInicio, DataPrevistaFim, IdProgramador, IdTipoTarefa } = taskData;
        
        if (!IdProgramador) return toast.error("Selecione um programador.");
        if (!IdTipoTarefa) return toast.error("Selecione um tipo de tarefa.");
        if (!validateDate(DataPrevistaInicio) || !validateDate(DataPrevistaFim)) return toast.error("Datas inválidas.");
        if (new Date(DataPrevistaInicio) > new Date(DataPrevistaFim)) return toast.error("Data início superior à fim.");

        const bodyToSend = {
            ...taskData,
            StoryPoints: parseInt(taskData.StoryPoints, 10), 
            OrdemExecucao: parseInt(taskData.OrdemExecucao, 10),
            IdProgramador: parseInt(IdProgramador, 10),
            IdTipoTarefa: parseInt(IdTipoTarefa, 10)
        };

        const loadingToast = toast.loading('A guardar...');

        try {
            const url = id ? `http://localhost:3000/tarefas/${id}` : 'http://localhost:3000/tarefas';
            const method = id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(bodyToSend),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Sucesso!", { id: loadingToast });
                if (!id) onTaskCreated(); 
                setTimeout(() => navigate('/'), 1000);
            } else {
                toast.error(data.message || "Erro.", { id: loadingToast });
            }
        } catch (error) {
            toast.error("Erro de conexão.", { id: loadingToast });
        }
    };

    return (
        <Card className="max-w-xl mx-auto mt-8 p-6 shadow-lg">
            <Toaster position="top-center" reverseOrder={false} />

            <Title className="mb-4 text-xl font-bold">
                {id ? (isReadOnly ? 'Detalhes da Tarefa' : 'Editar Tarefa') : 'Criar Nova Tarefa'}
            </Title>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <TextInput 
                        name="Descricao" 
                        value={taskData.Descricao} 
                        onChange={handleChange} 
                        disabled={isReadOnly}
                        required
                    />
                </div>
                
                <div className="flex gap-4">
                    <div className="w-1/2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Story Points</label>
                        <TextInput 
                            name="StoryPoints" 
                            type="number" 
                            value={taskData.StoryPoints} 
                            onChange={handleChange} 
                            disabled={isReadOnly}
                            required
                        />
                    </div>
                    <div className="w-1/2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
                        <TextInput 
                            name="OrdemExecucao" 
                            type="number" 
                            value={taskData.OrdemExecucao} 
                            onChange={handleChange} 
                            disabled={isReadOnly}
                            required
                        />
                    </div>
                </div>
                
                <div className="flex gap-4">
                    <div className="w-1/2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
                        <TextInput 
                            name="DataPrevistaInicio" 
                            type="date" 
                            value={taskData.DataPrevistaInicio} 
                            onChange={handleChange} 
                            disabled={isReadOnly}
                            required
                        />
                    </div>
                    <div className="w-1/2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
                        <TextInput 
                            name="DataPrevistaFim" 
                            type="date" 
                            value={taskData.DataPrevistaFim} 
                            onChange={handleChange} 
                            disabled={isReadOnly}
                            required
                        />
                    </div>
                </div>
                
                <div className="flex gap-4">
                    <div className="w-1/2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Programador</label>
                        {isReadOnly ? (
                            <TextInput value={taskData.NomeProgramador || '...'} disabled />
                        ) : (
                            <select 
                                name="IdProgramador" 
                                value={taskData.IdProgramador} 
                                onChange={handleChange} 
                                disabled={isReadOnly}
                                required
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 text-sm"
                            >
                                <option value="" disabled>Selecione...</option>
                                {programadores.map((prog) => (
                                    <option key={prog.Id} value={prog.Id}>{prog.Nome}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="w-1/2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Tarefa</label>
                        {isReadOnly ? (
                            <TextInput value={taskData.Tipo || '...'} disabled />
                        ) : (
                            <select 
                                name="IdTipoTarefa" 
                                value={taskData.IdTipoTarefa} 
                                onChange={handleChange} 
                                disabled={isReadOnly}
                                required
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 text-sm"
                            >
                                <option value="" disabled>Selecione...</option>
                                {tiposTarefa.map((tipo) => (
                                    <option key={tipo.Id} value={tipo.Id}>{tipo.Nome}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex gap-2">
                    {isReadOnly ? (
                        <Button 
                            type="button" 
                            size="xl" 
                            className="w-full bg-gray-500 hover:bg-gray-600 border-none"
                            onClick={() => navigate('/')}
                        >
                            Voltar
                        </Button>
                    ) : (
                        <Button 
                            type="submit" 
                            size="xl" 
                            className="w-full bg-yellow-400 hover:bg-yellow-500 border-yellow-400 text-black font-semibold"
                        >
                            {id ? 'Guardar Alterações' : 'Criar Tarefa'}
                        </Button>
                    )}
                </div>
            </form>
        </Card>
    );
};

export default TaskForm;