import { useEffect, useState } from 'react';
import Sidebar from "../components/SideBar.tsx";
import { 
    Download, 
    Package, 
    AlertTriangle, 
    DollarSign,
    Clock, 
    AlertCircle
} from 'lucide-react';

import '../styles/relatorios.css';

interface EstoqueResumo {
    total_itens: number;
    valor_total_patrimonio: number;
    produtos: any[];
}

export default function Relatorios() {
    const [estoque, setEstoque] = useState<EstoqueResumo | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchRelatorios = async () => {
        try {
            const response = await fetch('http://localhost:7000/relatorios/estoque');
            const data = await response.json();
            setEstoque(data);
        } catch (error) {
            console.error("Erro ao carregar relatórios:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRelatorios();
    }, []);

    // Lógica para decidir o que exibir na coluna de validade
    const renderValidade = (dataExp: string | null) => {
        if (!dataExp) return <span>---</span>;

        const hoje = new Date();
        const dataProduto = new Date(dataExp);
        const diffTempo = dataProduto.getTime() - hoje.getTime();
        const diffDias = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));

        if (diffDias < 0) {
            return <span className="badge expirado">EXPIRADO</span>;
        } 
        
        if (diffDias <= 30) {
            return <span className="badge alerta">Expira em {diffDias} dias</span>;
        }

        // Se estiver tudo bem, mostra apenas a data
        return <span>{dataExp}</span>;
    };

    const exportarPDF = () => {
        window.open('http://localhost:7000/relatorios/estoque/pdf', '_blank');
    };

    return (
        <div className="reports-layout">
            <Sidebar />

            <main className="main-content">
                <header className="header-section">
                    <div className="header-title">
                        <h2>Relatórios e Análises</h2>
                        <p>Controle de validade e patrimônio da farmácia.</p>
                    </div>
                    <button className="btn-export" onClick={exportarPDF}>
                        <Download size={20} /> Exportar PDF
                    </button>
                </header>

                {loading ? (
                    <div className="loading-state">Processando dados...</div>
                ) : (
                    <>
                        <div className="kpi-grid">
                            <div className="kpi-card">
                                <div className="kpi-icon blue"><Package /></div>
                                <div className="kpi-data">
                                    <span>Total em Stock</span>
                                    <h3>{estoque?.total_itens} un.</h3>
                                </div>
                            </div>

                            <div className="kpi-card">
                                <div className="kpi-icon green"><DollarSign /></div>
                                <div className="kpi-data">
                                    <span>Valor Patrimonial</span>
                                    <h3>{estoque?.valor_total_patrimonio.toLocaleString('pt-PT')} Kz</h3>
                                </div>
                            </div>

                            <div className="kpi-card">
                                <div className="kpi-icon orange"><AlertTriangle size={24} /></div>
                                <div className="kpi-data">
                                    <span>Status Crítico</span>
                                    <h3>{estoque?.produtos.filter(p => p.status_nivel === 'BAIXO').length} itens</h3>
                                </div>
                            </div>
                        </div>

                        <section className="report-table-section">
                            <div className="table-header">
                                <h3>Listagem de Inventário</h3>
                            </div>
                            <table className="report-table">
                               <thead>
                                   <tr>
                                       <th>Produto</th>
                                       <th>Qtd</th>
                                       <th>Valor Total</th>
                                       <th>Status Stock</th>
                                       <th>Data Expiração / Alerta</th>
                                   </tr>
                               </thead>
                               <tbody>
                                   {estoque?.produtos.map((p, index) => (
                                       <tr key={index}>
                                           <td><strong>{p.nome}</strong></td>
                                           <td>{p.quantidade}</td>
                                           <td>{p.valor_estimado_estoque.toLocaleString('pt-PT')} Kz</td>
                                           <td>
                                               <span className={`badge ${p.status_nivel.toLowerCase()}`}>
                                                   {p.status_nivel}
                                               </span>
                                           </td>
                                           <td style={{ fontWeight: 500 }}>
                                               {renderValidade(p.data_expiracao)}
                                           </td>
                                       </tr>
                                   ))}
                               </tbody>
                            </table>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}