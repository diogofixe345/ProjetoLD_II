// TaskForm.jsx

import React, { useState } from 'react';
import { Card, Button, TextInput, Callout } from '@tremor/react';

const TaskForm = ({ onTaskCreated = () => {}, gestorId }) => {
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

        if (!taskData.DataPrevistaInicio || !taskData.DataPrevistaFim) {
            return setError("Por favor, selecione as datas de início e fim.");
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
                credentials: 'include', // ESSENCIAL: Envia o cookie para a rota protegida
                body: JSON.stringify(bodyToSend),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess("Tarefa criada com sucesso!");
                setTaskData(prev => ({ ...prev, Descricao: '', DataPrevistaInicio: '', DataPrevistaFim: '', StoryPoints: 1, OrdemExecucao: 1 }));
                onTaskCreated(); 
            } else {
                setError(data.message || "Erro desconhecido ao criar tarefa.");
            }
        } catch (error) {
            console.error('Erro na submissão:', error);
            setError("Erro de conexão ao servidor (Verifique se o Express está a correr).");
        }
    };

    return (
        <Card className="max-w-xl mx-auto mt-8 p-6 shadow-lg">
            <h3 className="text-xl font-bold mb-4">➕ Criar Nova Tarefa (Gestor ID: {gestorId})</h3>
            
            {error && <Callout color="red" className="mb-4">{error}</Callout>}
            {success && <Callout color="green" className="mb-4">{success}</Callout>}

            <form onSubmit={handleSubmit} className="space-y-4">
                
                <TextInput name="Descricao" placeholder="Descrição da Tarefa" value={taskData.Descricao} onChange={handleChange} required/>
                
                <TextInput name="StoryPoints" type="number" placeholder="Story Points" value={taskData.StoryPoints} onChange={handleChange} min="1" required/>

                <TextInput name="OrdemExecucao" type="number" placeholder="Ordem de Execução" value={taskData.OrdemExecucao} onChange={handleChange} min="1" required/>
                
                {/* Inputs de Data Nativos */}
                <label className="block text-sm font-medium text-gray-700">Data Prevista Início</label>
                <TextInput name="DataPrevistaInicio" type="date" value={taskData.DataPrevistaInicio} onChange={handleChange} required/>
                
                <label className="block text-sm font-medium text-gray-700">Data Prevista Fim</label>
                <TextInput name="DataPrevistaFim" type="date" value={taskData.DataPrevistaFim} onChange={handleChange} required/>
                
                {/* IDs Simulados */}
                <TextInput name="IdProgramador" type="number" placeholder="ID Programador (Simulado)" value={taskData.IdProgramador} onChange={handleChange} required/>
                <TextInput name="IdTipoTarefa" type="number" placeholder="ID Tipo Tarefa (Simulado)" value={taskData.IdTipoTarefa} onChange={handleChange} required/>


                <Button type="submit" size="xl" className="w-full bg-blue-500 hover:bg-blue-600">
                    Criar Tarefa
                </Button>
            </form>
        </Card>
    );
};

export default TaskForm;