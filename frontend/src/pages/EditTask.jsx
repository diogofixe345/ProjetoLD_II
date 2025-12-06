import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, TextInput, Callout } from '@tremor/react';

const EditTask = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Pega o ID da URL
    const [taskData, setTaskData] = useState({
        Descricao: '',
        IdProgramador: '',
        OrdemExecucao: '',
        DataPrevistaInicio: '',
        DataPrevistaFim: '',
        IdTipoTarefa: '',
        StoryPoints: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Formatar data do MySQL para o input HTML (YYYY-MM-DD)
    const formatDate = (isoString) => {
        if (!isoString) return '';
        return new Date(isoString).toISOString().split('T')[0];
    };

    // Carregar dados da tarefa ao abrir a página
    useEffect(() => {
        const fetchTask = async () => {
            try {
                const response = await fetch(`http://localhost:3000/tarefas/${id}`, {
                    credentials: 'include'
                });
                const data = await response.json();
                
                if (response.ok) {
                    setTaskData({
                        ...data,
                        DataPrevistaInicio: formatDate(data.DataPrevistaInicio),
                        DataPrevistaFim: formatDate(data.DataPrevistaFim)
                    });
                } else {
                    setError("Tarefa não encontrada.");
                }
            } catch (err) {
                setError("Erro ao carregar dados da tarefa.");
            } finally {
                setLoading(false);
            }
        };
        fetchTask();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTaskData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`http://localhost:3000/tarefas/${id}`, {
                method: 'PUT', // Usamos PUT para atualizar
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(taskData),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess("Tarefa atualizada com sucesso!");
                setTimeout(() => {
                    navigate('/'); // Volta para a dashboard
                }, 1000);
            } else {
                setError(data.message || "Erro ao atualizar.");
            }
        } catch (error) {
            setError("Erro de conexão ao servidor.");
        }
    };

    if (loading) return <p className="text-center mt-10">A carregar dados...</p>;

    return (
        <Card className="max-w-xl mx-auto mt-8 p-6 shadow-lg">
            <h3 className="text-xl font-bold mb-4">Editar Tarefa #{id}</h3>
            
            {error && <Callout color="red" className="mb-4">{error}</Callout>}
            {success && <Callout color="green" className="mb-4">{success}</Callout>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <label className="text-sm text-gray-600">Descrição</label>
                <TextInput name="Descricao" value={taskData.Descricao} onChange={handleChange} required/>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-gray-600">Story Points</label>
                        <TextInput name="StoryPoints" type="number" value={taskData.StoryPoints} onChange={handleChange} min="1" required/>
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Ordem</label>
                        <TextInput name="OrdemExecucao" type="number" value={taskData.OrdemExecucao} onChange={handleChange} min="1" required/>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Data Início</label>
                        <TextInput name="DataPrevistaInicio" type="date" value={taskData.DataPrevistaInicio} onChange={handleChange} required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Data Fim</label>
                        <TextInput name="DataPrevistaFim" type="date" value={taskData.DataPrevistaFim} onChange={handleChange} required/>
                    </div>
                </div>
                
                <label className="text-sm text-gray-600">ID Programador</label>
                <TextInput name="IdProgramador" type="number" value={taskData.IdProgramador} onChange={handleChange} required/>
                
                <label className="text-sm text-gray-600">ID Tipo Tarefa</label>
                <TextInput name="IdTipoTarefa" type="number" value={taskData.IdTipoTarefa} onChange={handleChange} required/>

                <div className="flex space-x-2 pt-4">
                    <Button type="button" variant="secondary" onClick={() => navigate('/')}>
                        Cancelar
                    </Button>
                    <Button type="submit" color="blue">
                        Guardar Alterações
                    </Button>
                </div>
            </form>
        </Card>
    );
};

export default EditTask;