import { useEffect, useState } from 'react';
import SideBar from "../components/SideBar.tsx";
import { 
    Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title,
    ChartData 
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function Home() {
    const [resumo, setResumo] = useState({ total_itens: 0, valor_total_patrimonio: 0 });
    const [alertas, setAlertas] = useState<any[]>([]);
    
    // Tipagem explícita para evitar o erro 'never' e 'undefined'
    const [dadosVendas, setDadosVendas] = useState<ChartData<'bar'>>({
        labels: [],
        datasets: []
    });
    
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resEstoque, resAlertas, resVendas] = await Promise.all([
                    fetch('http://localhost:7000/relatorios/estoque'),
                    fetch('http://localhost:7000/stock/alertas'),
                    fetch('http://localhost:7000/relatorios/vendas?inicio=2024-01-01')
                ]);

                const estoqueData = await resEstoque.json();
                const alertasData = await resAlertas.json();
                const vendasData = await resVendas.json();

                setResumo({
                    total_itens: estoqueData.total_itens || 0,
                    valor_total_patrimonio: Number(estoqueData.valor_total_patrimonio) || 0
                });
                
                setAlertas(alertasData.produtos || []);

                if (vendasData.dados && vendasData.dados.length > 0) {
                    setDadosVendas({
                        labels: vendasData.dados.map((d: any) => d.nome),
                        datasets: [{
                            label: 'Receita por Produto (AOA)',
                            data: vendasData.dados.map((d: any) => Number(d.receita_total)),
                            backgroundColor: '#10b981',
                            borderRadius: 8,
                        }]
                    });
                }
                setLoading(false);
            } catch (error) {
                console.error("Erro ao buscar dados:", error);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div style={{marginLeft: '280px', padding: '40px'}}>Carregando Dashboard...</div>;

    return (
        <div className="dashboard-container">
            
            <style>{`
                .dashboard-container { display: flex; background: #f8fafc; min-height: 100vh; }
                .main-content { flex: 1; margin-left: 260px; padding: 40px; }
                .grid-top { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
                .card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                .charts-section { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
                .chart-box { background: white; padding: 25px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); min-height: 350px; }
                .alert-tag { background: #fee2e2; color: #ef4444; padding: 2px 8px; border-radius: 6px; font-weight: bold; }
            `}</style>

            <SideBar />
            
            <main className="main-content">
                
                
                <header className="header-section">
                    <h2>Visão geral da Farmácia Maya</h2>
                    <p>Controle de stock, vendas e fornecedores em tempo real.</p>
                </header>

                
                <div className="grid-top">
                    <div className="card">
                        <span style={{color: '#64748b', fontSize: '0.9rem'}}>Itens em Stock</span>
                        <h3 style={{fontSize: '1.8rem', marginTop: '10px'}}>{resumo.total_itens}</h3>
                    </div>
                    <div className="card">
                        <span style={{color: '#64748b', fontSize: '0.9rem'}}>Patrimônio Estimado</span>
                        <h3 style={{fontSize: '1.8rem', marginTop: '10px'}}>
                            {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(resumo.valor_total_patrimonio)}
                        </h3>
                    </div>
                    <div className="card" style={{borderLeft: '4px solid #ef4444'}}>
                        <span style={{color: '#64748b', fontSize: '0.9rem'}}>Alertas de Reposição</span>
                        <h3 style={{color: '#ef4444', fontSize: '1.8rem', marginTop: '10px'}}>{alertas.length}</h3>
                    </div>
                </div>

                <div className="charts-section">
                    <div className="chart-box">
                        <h4 style={{marginBottom: '20px'}}>Desempenho de Vendas</h4>
                        <div style={{height: '280px'}}> {/* Container com altura fixa para o ChartJS */}
                            { (dadosVendas.labels?.length ?? 0) > 0 ? (
                                <Bar 
                                    data={dadosVendas} 
                                    options={{ 
                                        responsive: true, 
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false } } 
                                    }} 
                                />
                            ) : <p>Sem dados de vendas.</p>}
                        </div>
                    </div>

                    <div className="chart-box">
                        <h4 style={{marginBottom: '20px'}}>Stock Crítico</h4>
                        {alertas.length > 0 ? alertas.map(prod => (
                            <div key={prod.id} style={{display:'flex', justifyContent:'space-between', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9'}}>
                                <span style={{fontWeight: '500'}}>{prod.nome}</span>
                                <span className="alert-tag">{prod.quantidade} un</span>
                            </div>
                        )) : <p>Tudo em ordem.</p>}
                    </div>
                </div>
            </main>
        </div>
    );
}