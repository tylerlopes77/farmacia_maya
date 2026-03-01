import { useEffect, useState } from 'react';
import Sidebar from "../components/SideBar.tsx";
import { 
    FileText, 
    Download, 
    TrendingUp, 
    Package, 
    AlertTriangle, 
    DollarSign 
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
                        <p>Visualize a saúde financeira e o nível de estoque da farmácia.</p>
                    </div>
                    <button className="btn-export" onClick={exportarPDF}>
                        <Download size={20} /> Exportar PDF
                    </button>
                </header>

                {loading ? (
                    <p>Gerando dados estatísticos...</p>
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
                                <div className="kpi-icon orange"><AlertTriangle /></div>
                                <div className="kpi-data">
                                    <span>Itens Críticos</span>
                                    <h3>{estoque?.produtos.filter(p => p.status_nivel === 'BAIXO').length}</h3>
                                </div>
                            </div>
                        </div>

                        {/* Visualização de Tabela */}
                        <section className="report-table-section">
                            <div className="table-header">
                                <h3>Detalhamento de Estoque</h3>
                            </div>
                            <table className="report-table">
                               <thead>
                                   <tr>
                                       <th>Produto</th>
                                       <th>Qtd</th>
                                       <th>Preço Unit.</th>
                                       <th>Valor Total</th>
                                       <th>Status</th>
                                   </tr>
                               </thead>
                               <tbody>
                                   {estoque?.produtos.map((p, index) => (
                                       <tr key={index}>
                                           <td><strong>{p.nome}</strong></td>
                                           <td>{p.quantidade}</td>
                                           <td>{p.preco} Kz</td>
                                           <td>{p.valor_estimado_estoque} Kz</td>
                                           <td>
                                               <span className={`badge ${p.status_nivel.toLowerCase()}`}>
                                                   {p.status_nivel}
                                               </span>
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