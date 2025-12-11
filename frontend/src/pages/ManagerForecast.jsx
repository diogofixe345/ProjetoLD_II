import React, { useState, useEffect } from 'react';
import { Card, Title, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Text, Badge, Metric } from '@tremor/react';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from './Navbar';

function ManagerForecast() {
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('http://localhost:3000/gestor/previsao-todo', { credentials: 'include' });
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                } else {
                    toast.error("Erro ao calcular previsões.");
                }
            } catch (error) {
                console.error(error);
                toast.error("Erro de conexão.");
            }
        };

        fetchData();
    }, []);

    if (!data) return <div className="text-center pt-20">A calcular estatísticas...</div>;

    return (
        <div>
            <Navbar />
            <div className="p-10 container mx-auto pt-24">
                <Toaster position="top-center" />
                
                <Title className="mb-2">Previsão de Esforço (ToDo)</Title>
                <Text className="mb-6">Estimativa baseada no histórico de produtividade da equipa por Story Points.</Text>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card decoration="top" decorationColor="blue">
                        <Text>Tempo Total Previsto</Text>
                        <Metric>{data.totalPrevisto} Dias</Metric>
                        <Text className="mt-2 text-xs text-gray-500">Para concluir todas as tarefas em ToDo</Text>
                    </Card>
                    <Card decoration="top" decorationColor="indigo">
                        <Text>Total Tarefas Pendentes</Text>
                        <Metric>{data.detalhes.length}</Metric>
                    </Card>

                </div>

                <Card>
                    <Title className="mb-4">Detalhe por Tarefa</Title>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableHeaderCell>Tarefa</TableHeaderCell>
                                <TableHeaderCell>Programador</TableHeaderCell>
                                <TableHeaderCell className="text-center">Story Points</TableHeaderCell>
                                <TableHeaderCell className="text-center">Estimativa (Dias)</TableHeaderCell>
                                <TableHeaderCell className="text-right">Base do Cálculo</TableHeaderCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.detalhes.map((item) => (
                                <TableRow key={item.Id}>
                                    <TableCell className="font-medium text-gray-900">{item.Descricao}</TableCell>
                                    <TableCell>{item.NomeProgramador || 'Não Atribuído'}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge color="gray">{item.StoryPoints}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Text className="font-bold">{item.EstimativaDias}</Text>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge size="xs" color={item.Metodo === 'Média Direta' ? 'emerald' : 'amber'}>
                                            {item.Metodo}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {data.detalhes.length === 0 && (
                        <div className="text-center py-6 text-gray-500">Não existem tarefas em ToDo para estimar.</div>
                    )}
                </Card>
            </div>
        </div>
    );
}

export default ManagerForecast;