import React, { useState, useEffect, useRef } from 'react';
import { Card, Title, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Text, Badge, Button, TextInput, Select, SelectItem } from '@tremor/react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from './Navbar';

function ManageTeam() {
    const [programadores, setProgramadores] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const navigate = useNavigate();
    
    const formRef = useRef(null);

    const fetchTeam = async () => {
        try {
            const res = await fetch('http://localhost:3000/gerir-programadores', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setProgramadores(data);
            } else {
                toast.error("Erro ao carregar a equipa.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro de conexão.");
        }
    };

    useEffect(() => {
        fetchTeam();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Tem a certeza? O utilizador e as suas tarefas serão apagados permanentemente.")) return;

        try {
            const res = await fetch(`http://localhost:3000/programadores/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (res.ok) {
                toast.success("Programador eliminado.");
                setProgramadores(programadores.filter(p => p.Id !== id));
                if (editingUser && editingUser.Id === id) setEditingUser(null);
            } else {
                const err = await res.json();
                toast.error(err.message || "Erro ao eliminar.");
            }
        } catch (error) {
            toast.error("Erro de conexão.");
        }
    };

    const handleEditClick = (user) => {
        setEditingUser(user);
        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:3000/programadores/${editingUser.Id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    Nome: editingUser.Nome,
                    NivelExperiencia: editingUser.NivelExperiencia
                })
            });

            if (res.ok) {
                toast.success("Dados atualizados!");
                setEditingUser(null);
                fetchTeam();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                toast.error("Erro ao atualizar dados.");
            }
        } catch (error) {
            toast.error("Erro de conexão.");
        }
    };

    return (
        <div> 
            <Navbar />
            <br />
            <br />
            <div className="p-10 container mx-auto pb-24">
                <Toaster position="top-center" />
                
                <div className="flex justify-between items-center mb-6">
                    <Title>Gestão de Equipa</Title>

                </div>


                <div className="flex flex-col gap-8">
                    
                    <Card className="w-full shadow-md">
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableHeaderCell>Nome</TableHeaderCell>
                                    <TableHeaderCell>Username</TableHeaderCell>
                                    <TableHeaderCell>Nível</TableHeaderCell>
                                    <TableHeaderCell className="text-right">Ações</TableHeaderCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {programadores.map((item) => (
                                    <TableRow key={item.Id} className="hover:bg-gray-50 transition-colors">
                                        <TableCell className="font-medium text-gray-900">{item.Nome}</TableCell>
                                        <TableCell>
                                            <Text>{item.Username}</Text>
                                        </TableCell>
                                        <TableCell>
                                            <Badge size="xs" color={
                                                item.NivelExperiencia === 'Senior' ? 'purple' : 
                                                item.NivelExperiencia === 'Pleno' ? 'blue' : 'emerald'
                                            }>
                                                {item.NivelExperiencia}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">

                                                <Button size="xs" variant="secondary" color="blue" onClick={() => handleEditClick(item)}>
                                                    Editar
                                                </Button>
                                                <Button size="xs" variant="secondary" color="red" onClick={() => handleDelete(item.Id)}>
                                                    Remover
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {programadores.length === 0 && (
                            <div className="text-center py-6 text-gray-500">
                                Ainda não tem programadores na sua equipa.
                            </div>
                        )}
                    </Card>

                    {editingUser && (
                        <div ref={formRef} className="w-full transform transition-all duration-500 ease-in-out">
                            <Card className="w-full border-t-4 border-blue-500 shadow-xl bg-blue-50/50">
                                <div className="flex justify-between items-center mb-4 border-b pb-2">
                                    <Title>Editar Programador: <span className="text-blue-600">{editingUser.Username}</span></Title>
                                    <Button size="xs" variant="light" color="gray" onClick={() => setEditingUser(null)}>✕ Fechar</Button>
                                </div>
                                
                                <form onSubmit={handleUpdate} className="space-y-6">
                                    {/* Grid para aproveitar a largura total */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                                            <TextInput 
                                                value={editingUser.Nome} 
                                                onChange={(e) => setEditingUser({...editingUser, Nome: e.target.value})} 
                                                required
                                                placeholder="Nome do programador"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nível de Experiência</label>
                                            <Select 
                                                value={editingUser.NivelExperiencia} 
                                                onValueChange={(val) => setEditingUser({...editingUser, NivelExperiencia: val})}
                                            >
                                                <SelectItem value="Junior">Junior</SelectItem>
                                                <SelectItem value="Senior">Senior</SelectItem>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-2">
                                        <Button type="submit" color="blue" size="md">
                                            Guardar Alterações
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ManageTeam;