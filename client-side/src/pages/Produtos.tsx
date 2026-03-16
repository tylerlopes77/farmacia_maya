import { useEffect, useState, FormEvent } from 'react';
import Sidebar from '../components/SideBar.tsx';
import '../styles/produtos.css';

// Adicionado o ícone Search
import { Plus, Trash2, X, Package, DollarSign, Users, Calendar, Search } from 'lucide-react';

interface Produto {
    id: number;
    nome: string;
    preco: string | number;
    quantidade: number;
    fornecedor_id?: number;
    data_expiracao?: string | null;
}

interface Fornecedor {
    id: number;
    nome: string;
}

export default function Produtos() {
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    // 1. Estado para o termo de pesquisa
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        nome: '',
        preco: '',
        quantidade: '',
        fornecedor_id: '',
        data_expiracao: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [resProdutos, resFornecedores] = await Promise.all([
                fetch('http://localhost:7000/produtos/listar'),
                fetch('http://localhost:7000/fornecedores') 
            ]);

            if (resProdutos.ok) setProdutos(await resProdutos.json());
            if (resFornecedores.ok) setFornecedores(await resFornecedores.json());
            
            setLoading(false);
        } catch (error) {
            console.error("Erro ao buscar dados:", error);
            setLoading(false);
        }
    };

    // 2. Lógica de Filtragem (calculada a cada renderização)
    const produtosFiltrados = produtos.filter((p) =>
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toString().includes(searchTerm)
    );

    const handleEliminar = async (id: number) => {
        if (window.confirm("Tem a certeza que deseja eliminar este produto?")) {
            try {
                await fetch(`http://localhost:7000/produtos/excluir/${id}`, { method: 'DELETE' });
                setProdutos(produtos.filter(p => p.id !== id));
            } catch (error) {
                alert("Erro ao eliminar produto.");
            }
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({...formData , [e.target.name] :e.target.value });
    };

    const handleSubmitCreate = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!formData.nome || !formData.preco || !formData.quantidade || !formData.fornecedor_id || !formData.data_expiracao) {
            alert("Por favor, preencha todos os campos.");
            return;
        }

        try {
            const response = await fetch('http://localhost:7000/produtos/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    preco: parseFloat(formData.preco),
                    quantidade: parseInt(formData.quantidade),
                    fornecedor_id: parseInt(formData.fornecedor_id),
                })
            });

            if (response.ok) {
                alert("Produto cadastrado com sucesso!");
                setShowModal(false);
                setFormData({ nome: '', preco: '', quantidade: '', fornecedor_id: '', data_expiracao: '' }); 
                fetchData(); 
            } else {
                const err = await response.json();
                alert(`Erro: ${err.message || 'Falha ao cadastrar'}`);
            }
        } catch (error) {
            console.error("Erro no cadastro:", error);
        }
    };

    const formatCurrency = (value: string | number) => {
        return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(Number(value));
    };

    return (
        <div className="page-layout">
            <Sidebar />

            <main className="main-content">
                <header className="page-header">
                    <div className="header-title">
                        <h2>Gestão de Produtos</h2>
                        <p>Gerencie o inventário da Farmácia Maya.</p>
                    </div>

                    {/* 3. Barra de Pesquisa */}
                    <div className="search-wrapper" style={{ flex: 1, maxWidth: '400px', margin: '0 20px', position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                        <input 
                            type="text" 
                            placeholder="Pesquisar por nome ou ID..." 
                            className="form-input" 
                            style={{ paddingLeft: '40px', marginBottom: 0, width: '100%' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={20} />
                        Novo Produto
                    </button>
                </header>

                <div className="table-wrapper">
                    {loading ? (
                        <div style={{padding: '40px', textAlign: 'center', color: 'var(--text-secondary)'}}>Carregando inventário...</div>
                    ) : (
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Produto</th>
                                    <th>Preço Un.</th>
                                    <th>Status de Stock</th>
                                    <th>Ações</th>
                                    <th>Data de expiração</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* 4. Mapear a lista filtrada em vez da original */}
                                {produtosFiltrados.length > 0 ? (
                                    produtosFiltrados.map((p) => (
                                        <tr key={p.id}>
                                            <td>
                                                <div className="product-name">{p.nome}</div>
                                                <div style={{fontSize:'0.85rem', color:'var(--text-secondary)', marginTop:'4px'}}>ID: #{p.id}</div>
                                            </td>
                                            <td style={{fontFamily: 'monospace', fontWeight: 600}}>{formatCurrency(p.preco)}</td>
                                            <td>
                                                <span className={`stock-badge ${p.quantidade <= 5 ? 'stock-low' : 'stock-ok'}`}>
                                                    {p.quantidade} unidades
                                                </span>
                                            </td>
                                            <td>
                                                <div className="actions-cell">
                                                    <button className="btn-icon delete" title="Eliminar" onClick={() => handleEliminar(p.id)}>
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{fontFamily: 'monospace', fontWeight: 600}}>
                                                    {p.data_expiracao || '---'} 
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                                            Nenhum produto encontrado para "{searchTerm}"
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <header className="modal-header">
                            <h3>Cadastrar Novo Produto</h3>
                            <button className="btn-close" onClick={() => setShowModal(false)}>
                                <X size={24} />
                            </button>
                        </header>

                        <form onSubmit={handleSubmitCreate}>
                            <div className="form-group">
                                <label className="form-label"><Package size={18}/> Nome do Medicamento/Produto</label>
                                <input type="text" name="nome" className="form-input" placeholder="Ex: Paracetamol 500mg" value={formData.nome} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label"><Calendar size={18}/> Data de expiração </label>
                                    <input type="date" name="data_expiracao" className="form-input" value={formData.data_expiracao} onChange={handleInputChange} />
                            </div>

                            <div className="form-group" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                                <div>
                                    <label className="form-label"><DollarSign size={18}/> Preço (AOA)</label>
                                    <input type="number" name="preco" className="form-input" placeholder="0.00" step="0.01" value={formData.preco} onChange={handleInputChange} required />
                                </div>
                                <div>
                                    <label className="form-label"><Package size={18}/> Qtd. Inicial</label>
                                    <input type="number" name="quantidade" className="form-input" placeholder="0" value={formData.quantidade} onChange={handleInputChange} required />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label"><Users size={18}/> Fornecedor</label>
                                <select name="fornecedor_id" className="form-input" value={formData.fornecedor_id} onChange={handleInputChange} required style={{backgroundColor: 'white'}}>
                                    <option value="">Selecione um fornecedor...</option>
                                    {fornecedores.map(f => (
                                        <option key={f.id} value={f.id}>{f.nome}</option>
                                    ))}
                                </select>
                            </div>

                            <button type="submit" className="btn-primary btn-submit">
                                Confirmar Cadastro
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}