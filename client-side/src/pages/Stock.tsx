import { useEffect, useState } from 'react';
import Sidebar from "../components/SideBar.tsx";
import { 
    ArrowUpCircle, 
    ArrowDownCircle, 
    AlertTriangle, 
    PackageSearch, 
    History,
    CheckCircle2,
    RefreshCw
} from 'lucide-react';

import '../styles/Stock.css';

interface Produto {
    id: number;
    nome: string;
    quantidade: number;
}

export default function Stock() {
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [alertas, setAlertas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [movimentacao, setMovimentacao] = useState({
        produto_id: '',
        quantidade: '',
        tipo: 'entrada', 
        motivo: ''
    });

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        try {
            setLoading(true);
            const [resProdutos, resAlertas] = await Promise.all([
                fetch('http://localhost:7000/produtos/listar'),
                fetch('http://localhost:7000/stock/alertas')
            ]);

            if (resProdutos.ok) setProdutos(await resProdutos.json());
            if (resAlertas.ok) {
                const dataAlertas = await resAlertas.json();
                setAlertas(dataAlertas.produtos || []);
            }
        } catch (error) {
            console.error("Erro ao sincronizar stock:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMovimentar = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const token = localStorage.getItem('token'); 

        try {
            const response = await fetch('http://localhost:7000/stock/movimentar', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    produto_id: parseInt(movimentacao.produto_id),
                    quantidade: parseInt(movimentacao.quantidade),
                    tipo: movimentacao.tipo,
                    motivo: movimentacao.motivo
                })
            });

            const result = await response.json();

            if (response.ok) {
                alert(result.message);
                setMovimentacao({ produto_id: '', quantidade: '', tipo: 'entrada', motivo: '' });
                carregarDados();
            } else {
                alert("Erro: " + (result.message || result.error));
            }
        } catch (error) {
            alert("Erro na conexão com o servidor.");
        }
    };

    return (
        <div className="stock-layout">

            <Sidebar />

            <main className="main-content">
                <header className="header-section">
                    <div>
                        <h2>Controle de Stock</h2>
                        <p>Gerencie entradas e saídas de produtos Maya.</p>
                    </div>
                    <button className="sync-btn" onClick={carregarDados}>
                        <RefreshCw size={18} /> Sincronizar
                    </button>
                </header>

                <div className="grid-stock">
                    <section className="panel">
                        <div className="panel-title">
                            <History size={20} />
                            <span>Registrar Movimentação</span>
                        </div>
                        
                        <form onSubmit={handleMovimentar}>
                            <div className="form-group">
                                <label className="form-label">Tipo de Operação</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button 
                                        type="button"
                                        className={`btn-submit ${movimentacao.tipo === 'entrada' ? 'btn-entrada' : ''}`}
                                        style={{ background: movimentacao.tipo === 'entrada' ? '#10b981' : '#f1f5f9', color: movimentacao.tipo === 'entrada' ? 'white' : '#64748b' }}
                                        onClick={() => setMovimentacao({...movimentacao, tipo: 'entrada'})}
                                    >
                                        <ArrowUpCircle size={18} /> Entrada
                                    </button>
                                    <button 
                                        type="button"
                                        className={`btn-submit ${movimentacao.tipo === 'saida' ? 'btn-saida' : ''}`}
                                        style={{ background: movimentacao.tipo === 'saida' ? '#062d27' : '#f1f5f9', color: movimentacao.tipo === 'saida' ? 'white' : '#64748b' }}
                                        onClick={() => setMovimentacao({...movimentacao, tipo: 'saida'})}
                                    >
                                        <ArrowDownCircle size={18} /> Saída
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Selecionar Produto</label>
                                <select 
                                    className="form-input" 
                                    name="produto_id" 
                                    value={movimentacao.produto_id}
                                    onChange={(e) => setMovimentacao({...movimentacao, produto_id: e.target.value})}
                                    required
                                >
                                    <option value="">Procurar produto...</option>
                                    {produtos.map(p => (
                                        <option key={p.id} value={p.id}>{p.nome} (Atual: {p.quantidade})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Quantidade</label>
                                <input 
                                    type="number" 
                                    className="form-input" 
                                    placeholder="0"
                                    value={movimentacao.quantidade}
                                    onChange={(e) => setMovimentacao({...movimentacao, quantidade: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Motivo / Observação</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="Ex: Reposição mensal ou Venda balcão"
                                    value={movimentacao.motivo}
                                    onChange={(e) => setMovimentacao({...movimentacao, motivo: e.target.value})}
                                />
                            </div>

                            <button type="submit" className={`btn-submit ${movimentacao.tipo === 'entrada' ? 'btn-entrada' : 'btn-saida'}`}>
                                <CheckCircle2 size={18} /> Confirmar {movimentacao.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                            </button>
                        </form>
                    </section>

                    {/* Alertas Críticos */}
                    <section>
                        <div className="panel-title" style={{ marginBottom: '16px' }}>
                            <AlertTriangle size={20} color="#ef4444" />
                            <span>Produtos em Nível Crítico</span>
                        </div>

                        {loading ? (
                            <p>Verificando stock...</p>
                        ) : alertas.length > 0 ? (
                            alertas.map(prod => (
                                <div key={prod.id} className="alert-card">
                                    <PackageSearch size={24} color="#ef4444" />
                                    <div className="alert-info">
                                        <h4>{prod.nome}</h4>
                                        <p>Restam apenas {prod.quantidade} unidades no inventário.</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="alert-card" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                                <CheckCircle2 size={24} color="#10b981" />
                                <div className="alert-info">
                                    <h4 style={{ color: '#166534' }}>Stock Saudável</h4>
                                    <p style={{ color: '#15803d' }}>Não há produtos abaixo do limite crítico.</p>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}