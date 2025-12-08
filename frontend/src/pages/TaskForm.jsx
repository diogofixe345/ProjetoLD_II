import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, TextInput, Callout } from '@tremor/react';

// Função de validação de data
const validateDate = (dateString) => {
    // Regex para YYYY-MM-DD, garantindo 4 dígitos no ano
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) {
        return false;
    }
    // Verifica se é uma data válida (ex: não permite 2023-02-30)
    const date = new Date(dateString + 'T00:00:00'); 
    return date.toISOString().startsWith(dateString);
};

const TaskForm = ({ onTaskCreated = () => {}, gestorId }) => {
    const navigate = useNavigate();
    const [taskData, setTaskData] = useState({
        Descricao: '',
        IdProgramador: 1, 
        OrdemExecucao: 1,
        DataPrevistaInicio: '', 
        DataPrevistaFim: '',    
        IdTipoTarefa: 1, 
        StoryPoints: 1
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTaskData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const { DataPrevistaInicio, DataPrevistaFim } = taskData;
        
        // 1. Validação de Formato (4 dígitos no ano)
        if (!validateDate(DataPrevistaInicio) || !validateDate(DataPrevistaFim)) {
            return setError("O formato das datas deve ser YYYY-MM-DD e o ano deve ter 4 dígitos. Por favor, insira datas válidas.");
        }

        // 2. Validação de Lógica (Início antes do Fim)
        if (new Date(DataPrevistaInicio) > new Date(DataPrevistaFim)) {
            return setError("A Data Prevista de Início não pode ser posterior à Data Prevista de Fim.");
        }

        const bodyToSend = {
            ...taskData,
            StoryPoints: parseInt(taskData.StoryPoints, 10), 
            OrdemExecucao: parseInt(taskData.OrdemExecucao, 10)
        };

        try {
            const response = await fetch('http://localhost:3000/tarefas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(bodyToSend),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess("Tarefa criada com sucesso!");
                setTaskData(prev => ({ ...prev, Descricao: '', DataPrevistaInicio: '', DataPrevistaFim: '', StoryPoints: 1, OrdemExecucao: 1 }));
                onTaskCreated(); 

                setTimeout(() => {
                    navigate('/');
                }, 1000);
            } else {
                // Se o erro for 401, a mensagem do backend será mais clara (Não autenticado)
                setError(data.message || "Erro desconhecido ao criar tarefa.");
            }
        } catch (error) {
            console.error('Erro na submissão:', error);
            setError("Erro de conexão ao servidor (Verifique se o Express está a correr).");
        }
    };

    return (
        <Card className="max-w-xl mx-auto mt-8 p-6 shadow-lg">
            <h3 className="text-xl font-bold mb-4">Criar Nova Tarefa</h3>
            
            {error && <Callout color="red" className="mb-4">{error}</Callout>}
            {success && <Callout color="green" className="mb-4">{success}</Callout>}

            <form onSubmit={handleSubmit} className="space-y-4">
                
                <TextInput name="Descricao" placeholder="Descrição da Tarefa" value={taskData.Descricao} onChange={handleChange} required/>
                
                <TextInput name="StoryPoints" type="number" placeholder="Story Points" value={taskData.StoryPoints} onChange={handleChange} min="1" required/>

                <TextInput name="OrdemExecucao" type="number" placeholder="Ordem de Execução" value={taskData.OrdemExecucao} onChange={handleChange} min="1" required/>
                
                <label className="block text-sm font-medium text-gray-700">Data Prevista Início</label>
                <TextInput name="DataPrevistaInicio" type="date" value={taskData.DataPrevistaInicio} onChange={handleChange} required/>
                
                <label className="block text-sm font-medium text-gray-700">Data Prevista Fim</label>
                <TextInput name="DataPrevistaFim" type="date" value={taskData.DataPrevistaFim} onChange={handleChange} required/>
                
                <TextInput name="IdProgramador" type="number" placeholder="ID Programador" value={taskData.IdProgramador} onChange={handleChange} required/>
                <TextInput name="IdTipoTarefa" type="number" placeholder="ID Tipo Tarefa" value={taskData.IdTipoTarefa} onChange={handleChange} required/>


                <Button type="submit" size="xl" className="w-full bg-yellow-400 hover:bg-yellow-500 border-yellow-400 hover:border-yellow-500">
                    Criar Tarefa
                </Button>
            </form>
        </Card>
    );
};

export default TaskForm;