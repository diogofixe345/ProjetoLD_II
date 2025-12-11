import React, { useState, useEffect } from 'react';
import { Card, Title, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge, Text, Button } from '@tremor/react';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from './Navbar';

function ManagerHistory() {
    const [tarefas, setTarefas] = useState([]);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch('http://localhost:3000/gestor/tarefas-concluidas', { credentials: 'include' });
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

    const handleExportCSV = async () => {
        const loadingToast = toast.loading("A gerar ficheiro...");
        try {
            const response = await fetch('http://localhost:3000/gestor/exportar-tarefas-csv', {
                method: 'GET',
                credentials: 'include',
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'tarefas_concluidas.csv';
                document.body.appendChild(a);
                a.click();
                a.remove();
                toast.success("Download iniciado!", { id: loadingToast });
            } else {
                toast.error("Erro ao exportar.", { id: loadingToast });
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro de conexão.", { id: loadingToast });
        }
    };

    return (
        <div>
            <Navbar />
            <div className="p-10 container mx-auto pt-24">
                <Toaster position="top-center" />
                
                <div className="flex justify-between items-center mb-6">
                    <Title>Histórico de Tarefas Concluídas</Title>
                    <Button size="sm" variant="primary" color="green" onClick={handleExportCSV}>
                        Exportar CSV
                    </Button>
                </div>

                <Card>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableHeaderCell>Descrição</TableHeaderCell>
                                <TableHeaderCell>Programador</TableHeaderCell>
                                <TableHeaderCell>Tipo</TableHeaderCell>
                                <TableHeaderCell className="text-center">Previsto (Dias)</TableHeaderCell>
                                <TableHeaderCell className="text-center">Real (Dias)</TableHeaderCell>
                                <TableHeaderCell className="text-center">Status</TableHeaderCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tarefas.map((t) => {
                                const atrasado = (t.DuracaoReal || 0) > (t.DuracaoPrevista || 0);
                                return (
                                    <TableRow key={t.Id} className="hover:bg-gray-50">
                                        <TableCell className="font-medium text-gray-900">
                                            {t.Descricao}
                                        </TableCell>
                                        <TableCell>
                                            <Text>{t.NomeProgramador}</Text>
                                        </TableCell>
                                        <TableCell>
                                            <Badge size="xs" color="gray">{t.Tipo || 'Geral'}</Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Text>{t.DuracaoPrevista !== null ? t.DuracaoPrevista : '-'}</Text>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Text>{t.DuracaoReal !== null ? t.DuracaoReal : '-'}</Text>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge size="sm" color={atrasado ? "red" : "emerald"}>
                                                {atrasado ? "Atrasado" : "No Prazo"}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                    {tarefas.length === 0 && (
                        <div className="text-center py-10 text-gray-500">
                            Nenhuma tarefa concluída encontrada.
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

export default ManagerHistory;