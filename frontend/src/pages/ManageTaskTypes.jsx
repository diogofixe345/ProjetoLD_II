import React, { useState, useEffect } from 'react';
import { Card, Title, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Button, TextInput, Text } from '@tremor/react';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from './Navbar';

function ManageTaskTypes() {
    const [types, setTypes] = useState([]);
    const [name, setName] = useState('');
    const [editingId, setEditingId] = useState(null);

    const fetchTypes = async () => {
        try {
            const res = await fetch('http://localhost:3000/tipos-tarefa', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setTypes(data);
            }
        } catch (error) {
            toast.error("Erro ao carregar dados.");
        }
    };

    useEffect(() => {
        fetchTypes();
    }, []);

    // Preparar Edição
    const handleEdit = (type) => {
        setName(type.Nome);
        setEditingId(type.Id);
    };

    // Cancelar Edição
    const handleCancel = () => {
        setName('');
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return toast.error("O nome é obrigatório.");

        const url = editingId 
            ? `http://localhost:3000/tipos-tarefa/${editingId}` 
            : 'http://localhost:3000/tipos-tarefa';
        
        const method = editingId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ Nome: name })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                fetchTypes();
                handleCancel(); 
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Erro de conexão.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Tem a certeza que quer eliminar este tipo?")) return;

        try {
            const res = await fetch(`http://localhost:3000/tipos-tarefa/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Eliminado com sucesso.");
                fetchTypes();
                if (editingId === id) handleCancel();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Erro de conexão.");
        }
    };

    return (
        <div>
            <Navbar />
            <div className="p-10 container mx-auto pt-24">
                <Toaster position="top-center" />
                <Title className="mb-6">Gerir Tipos de Tarefa</Title>

                <div className="flex flex-col md:flex-row gap-6 items-start">
                    
                    <Card className="flex-1">
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableHeaderCell>ID</TableHeaderCell>
                                    <TableHeaderCell>Nome</TableHeaderCell>
                                    <TableHeaderCell className="text-right"></TableHeaderCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {types.map((t) => (
                                    <TableRow key={t.Id} className="hover:bg-gray-50">
                                        <TableCell><Text>{t.Id}</Text></TableCell>
                                        <TableCell className="font-bold text-gray-700">{t.Nome}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="xs" variant="secondary" onClick={() => handleEdit(t)}>
                                                    Editar
                                                </Button>
                                                <Button size="xs" variant="secondary" color="red" onClick={() => handleDelete(t.Id)}>
                                                    X
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {types.length === 0 && <div className="p-4 text-center text-gray-500">Nenhum tipo criado.</div>}
                    </Card>

                    <Card className="w-full md:w-1/3 border-l-4 border-blue-500 sticky top-24">
                        <Title className="mb-4">
                            {editingId ? "Editar Tipo" : "Novo Tipo de Tarefa"}
                        </Title>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Nome</label>
                                <TextInput 
                                    className="mt-1"
                                    placeholder="" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button type="submit" className="flex-1" color="blue">
                                    {editingId ? "Atualizar" : "Criar"}
                                </Button>
                                {editingId && (
                                    <Button type="button" variant="light" color="gray" onClick={handleCancel}>
                                        Cancelar
                                    </Button>
                                )}
                            </div>
                        </form>
                    </Card>

                </div>
            </div>
        </div>
    );
}

export default ManageTaskTypes;