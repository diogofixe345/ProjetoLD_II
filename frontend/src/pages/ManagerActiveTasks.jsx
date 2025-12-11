import React, { useState, useEffect } from 'react';
import { Card, Title, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge, Text } from '@tremor/react';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from './Navbar';

function ManagerActiveTasks() {
    const [tarefas, setTarefas] = useState([]);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await fetch('http://localhost:3000/gestor/tarefas-em-curso', { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    setTarefas(data);
                } else {
                    toast.error("Erro ao carregar tarefas.");
                }
            } catch (error) {
                console.error(error);
                toast.error("Erro de conexão.");
            }
        };

        fetchTasks();
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
                
                <Title className="mb-6">Monitorização de Prazos (Tarefas Ativas)</Title>

                <Card>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableHeaderCell>Descrição</TableHeaderCell>
                                <TableHeaderCell>Programador</TableHeaderCell>
                                <TableHeaderCell>Estado</TableHeaderCell>
                                <TableHeaderCell>Data Fim Prevista</TableHeaderCell>
                                <TableHeaderCell className="text-center">Situação (Dias)</TableHeaderCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tarefas.map((t) => {

                                const dias = t.DiasDiferenca;
                                const isDelayed = dias < 0;
                                const isToday = dias === 0;

                                return (
                                    <TableRow key={t.Id} className="hover:bg-gray-50">
                                        <TableCell className="font-medium text-gray-900">
                                            {t.Descricao}
                                            <div className="text-xs text-gray-500 mt-1">{t.Tipo}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Text>{t.NomeProgramador}</Text>
                                        </TableCell>
                                        <TableCell>
                                            <Badge size="xs" color={t.EstadoAtual === 'Doing' ? 'yellow' : 'gray'}>
                                                {t.EstadoAtual}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Text>{formatDate(t.DataPrevistaFim)}</Text>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {isToday ? (
                                                <Badge size="sm" color="yellow">Termina Hoje</Badge>
                                            ) : isDelayed ? (
                                                <Badge size="sm" color="red">
                                                    {Math.abs(dias)} dias de Atraso
                                                </Badge>
                                            ) : (
                                                <Badge size="sm" color="green">
                                                    Faltam {dias} dias
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                    {tarefas.length === 0 && (
                        <div className="text-center py-10 text-gray-500">
                            Não existem tarefas ativas neste momento.
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

export default ManagerActiveTasks;