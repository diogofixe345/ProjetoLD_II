import React, { useState, useEffect } from 'react';
import { Card, Title, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge, Text } from '@tremor/react';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from './Navbar'; 

function CompletedTasks() {
    const [tarefas, setTarefas] = useState([]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch('http://localhost:3000/tarefas-concluidas', { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    setTarefas(data);
                } else {
                    toast.error("Erro ao carregar histórico.");
                }
            } catch (error) {
                console.error(error);
                toast.error("Erro de conexão.");
            }
        };

        fetchHistory();
    }, []);

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString('pt-PT');
    };

    return (
        <div>
            <Navbar />
            <div className="p-10 container mx-auto pt-24">
                <Toaster position="top-center" />
                
                <Title className="mb-6">O Meu Histórico de Tarefas</Title>

                <Card>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableHeaderCell>Descrição</TableHeaderCell>
                                <TableHeaderCell>Tipo</TableHeaderCell>
                                <TableHeaderCell>Story Points</TableHeaderCell>
                                <TableHeaderCell>Data Início (Real)</TableHeaderCell>
                                <TableHeaderCell>Data Fim (Real)</TableHeaderCell>
                                <TableHeaderCell className="text-center">Duração</TableHeaderCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tarefas.map((t) => (
                                <TableRow key={t.Id} className="hover:bg-gray-50">
                                    <TableCell className="font-medium text-gray-900">
                                        {t.Descricao}
                                    </TableCell>
                                    <TableCell>
                                        <Badge size="xs" color="blue">{t.Tipo || 'Geral'}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Text>{t.StoryPoints}</Text>
                                    </TableCell>
                                    <TableCell>
                                        <Text>{formatDate(t.DataRealInicio)}</Text>
                                    </TableCell>
                                    <TableCell>
                                        <Text>{formatDate(t.DataRealFim)}</Text>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge size="sm" color={t.DuracaoDias > 5 ? "red" : "green"}>
                                            {t.DuracaoDias !== null ? `${t.DuracaoDias} dias` : '-'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {tarefas.length === 0 && (
                        <div className="text-center py-10 text-gray-500">
                            Ainda não tem tarefas concluídas.
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

export default CompletedTasks;