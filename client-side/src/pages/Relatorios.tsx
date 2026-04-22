import { useEffect, useState } from 'react';
import Sidebar from "../components/SideBar.tsx";
import { 
    Download, 
    Package, 
    AlertTriangle, 
    DollarSign,
    ArrowDownRight,
    ArrowUpRight,
    Activity,
    User,
    Mail 
} from 'lucide-react';
import '../styles/relatorios.css';

interface Produto {
    nome: string;
    quantidade: number;
    valor_estimado_estoque: number;
    status_nivel: string;
    data_expiracao: string;
    categoria: string;          
    data_criacao: string;    
}

interface EstoqueResumo {
    total_itens: number;
    valor_total_patrimonio: number;
    produtos: Produto[];
}

interface Movimentacao {
    id: number;
    produto_nome: string;
    tipo: 'entrada' | 'saida';
    quantidade: number;
    data_mov: string;
    funcionario_nome: string; 
}

export default function Relatorios() {
    const [estoque, setEstoque] = useState<EstoqueResumo | null>(null);
    const [historico, setHistorico] = useState<Movimentacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'patrimonio' | 'entradas' | 'saidas'>('patrimonio');

    const fetchData = async () => {
        try {
            const [resEstoque, resHistorico] = await Promise.all([
                fetch('http://localhost:7000/relatorios/estoque'),
                fetch('http://localhost:7000/stock/historico')
            ]);

            if (resEstoque.ok) setEstoque(await resEstoque.json());
            if (resHistorico.ok) setHistorico(await resHistorico.json());
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const renderValidade = (dataExp: string | null) => {
        if (!dataExp) return <span>---</span>;
        const hoje = new Date();
        const dataProduto = new Date(dataExp);
        const diffDias = Math.ceil((dataProduto.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDias < 0) return <span className="badge expirado">EXPIRADO</span>;
        if (diffDias <= 30) return <span className="badge alerta">Expira em {diffDias} dias</span>;
        return <span>{new Date(dataExp).toLocaleDateString('pt-PT')}</span>;
    };

    const exportarPDF = () => {
        window.open('http://localhost:7000/relatorios/estoque/pdf', '_blank');
    };

    const formatarDataHora = (dataIso: string) => {
        const d = new Date(dataIso);
        return d.toLocaleDateString('pt-PT') + ' às ' + d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    };

    const entradas = historico.filter(h => h.tipo === 'entrada');
    const saidas = historico.filter(h => h.tipo === 'saida');

    return (
        <div className="reports-layout">
            <Sidebar />

            <main className="main-content">
                <header className="header-section">
                    <div className="header-title">
                        <h2>Relatórios e Análises</h2>
                        <p>Controle de patrimônio e auditoria de fluxo de stock.</p>
                    </div>
                    {activeTab === 'patrimonio' && (
                        <button className="btn-export" onClick={exportarPDF}>
                            <Download size={20} /> Exportar PDF
                        </button>
                    )}
                </header>

                {loading ? (
                    <div className="loading-state">Processando dados da infraestrutura...</div>
                ) : (
                    <>
                        <div className="kpi-grid">
                            <div className="kpi-card">
                                <div className="kpi-icon blue"><Package /></div>
                                <div className="kpi-data">
                                    <span>Total em Stock</span>
                                    <h3>{estoque?.total_itens || 0} un.</h3>
                                </div>
                            </div>
                            <div className="kpi-card">
                                <div className="kpi-icon green"><DollarSign /></div>
                                <div className="kpi-data">
                                    <span>Valor Patrimonial</span>
                                    <h3>{estoque?.valor_total_patrimonio?.toLocaleString('pt-PT')} Kz</h3>
                                </div>
                            </div>
                            <div className="kpi-card">
                                <div className="kpi-icon orange"><AlertTriangle size={24} /></div>
                                <div className="kpi-data">
                                    <span>Status Crítico</span>
                                    <h3>{estoque?.produtos.filter(p => p.status_nivel === 'BAIXO').length || 0} itens</h3>
                                </div>
                            </div>
                        </div>

                        <div className="tabs-container" style={{ display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                            <button 
                                onClick={() => setActiveTab('patrimonio')} 
                                style={{ padding: '10px 20px', border: 'none', background: activeTab === 'patrimonio' ? '#10b981' : 'transparent', color: activeTab === 'patrimonio' ? 'white' : '#64748b', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <Activity size={18}/> Stock & Patrimônio
                            </button>
                            <button 
                                onClick={() => setActiveTab('entradas')} 
                                style={{ padding: '10px 20px', border: 'none', background: activeTab === 'entradas' ? '#3b82f6' : 'transparent', color: activeTab === 'entradas' ? 'white' : '#64748b', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <ArrowDownRight size={18}/> Relatório de Entradas
                            </button>
                            <button 
                                onClick={() => setActiveTab('saidas')} 
                                style={{ padding: '10px 20px', border: 'none', background: activeTab === 'saidas' ? '#ef4444' : 'transparent', color: activeTab === 'saidas' ? 'white' : '#64748b', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <ArrowUpRight size={18}/> Relatório de Saídas
                            </button>
                        </div>

                        <section className="report-table-section">
                            {activeTab === 'patrimonio' && (
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th>Produto</th>
                                            <th>Categoria</th> 
                                            <th>Qtd</th>
                                            <th>Valor Total</th>
                                            <th>Status Stock</th>
                                            <th>Data Expiração</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {estoque?.produtos.map((p, index) => (
                                            <tr key={index}>
                                                <td><strong>{p.nome}</strong></td>
                                                <td><span className="categoria-tag">{p.categoria}</span></td>
                                                <td>{p.quantidade}</td>
                                                <td>{p.valor_estimado_estoque.toLocaleString('pt-PT')} Kz</td>
                                                <td>
                                                    <span className={`badge ${p.status_nivel.toLowerCase()}`}>
                                                        {p.status_nivel}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 500 }}>{renderValidade(p.data_expiracao)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {(activeTab === 'entradas' || activeTab === 'saidas') && (
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th>Produto</th>
                                            <th>Quantidade</th>
                                            <th>Data e Hora</th>
                                            <th>Responsável</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(activeTab === 'entradas' ? entradas : saidas).length === 0 ? (
                                            <tr><td colSpan={4} style={{textAlign: 'center'}}>Nenhum registo encontrado.</td></tr>
                                        ) : (activeTab === 'entradas' ? entradas : saidas).map((h) => (
                                            <tr key={h.id}>
                                                <td><strong>{h.produto_nome}</strong></td>
                                                <td style={{color: h.tipo === 'entrada' ? '#3b82f6' : '#ef4444', fontWeight: 'bold'}}>
                                                    {h.tipo === 'entrada' ? '+' : '-'}{h.quantidade} un.
                                                </td>
                                                <td>{formatarDataHora(h.data_mov)}</td>
                                                <td style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                                    <span/> {h.funcionario_nome || 'Sistema'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}