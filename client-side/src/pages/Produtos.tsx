import { useEffect, useState, FormEvent } from 'react';
import Sidebar from '../components/SideBar.tsx';
import '../styles/produtos.css';
import { Plus, Trash2, X, Package, DollarSign, Users, Calendar, Search, Tag, Factory } from 'lucide-react';

interface Produto {
    id: number;
    nome: string;
    preco: string | number;
    quantidade: number;
    fornecedor_id?: number;
    data_fabricacao?: string | null;
    data_expiracao?: string | null;
    categoria: string;
    data_criacao: string;
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
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        nome: '',
        preco: '',
        quantidade: '',
        fornecedor_id: '',
        data_fabricacao: '',
        data_expiracao: '',
        categoria: '',
        data_criacao: new Date().toISOString().split('T')[0]
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
        } catch (error) {
            console.error("Erro ao buscar dados", error);
        } finally {
            setLoading(false);
        }
    };

    // --- LÓGICA DE FILTRO ---
    const produtosFiltrados = produtos.filter((p) => {
        const termo = searchTerm.toLowerCase();
        return (
            p.nome.toLowerCase().includes(termo) || 
            (p.categoria && p.categoria.toLowerCase().includes(termo))
        );
    });

    const formatCurrency = (value: string | number) => {
        return new Intl.NumberFormat('pt-AO', { 
            style: 'currency', 
            currency: 'AOA' 
        }).format(Number(value));
    };

    const handleSubmitCreate = async (e: FormEvent) => {
        e.preventDefault();
        
        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        const dataExp = new Date(formData.data_expiracao);
        const diffDias = Math.ceil((dataExp.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDias <= 10) {
            alert(" Erro: O produto deve ter no mínimo 11 dias de validade.");
            return;
        }

        if (formData.data_fabricacao && new Date(formData.data_fabricacao) >= dataExp) {
            alert(" Erro: A data de fabricação não pode ser posterior à data de expiração.");
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
                setFormData({ nome:'', preco:'', quantidade:'', fornecedor_id:'', data_fabricacao: '', data_expiracao:'', categoria:'', data_criacao: new Date().toISOString().split('T')[0] });
                fetchData(); 
            } else {
                const err = await response.json();
                alert(`Erro: ${err.message}`);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Tem certeza que deseja eliminar este produto?")) return;
        try {
            const response = await fetch(`http://localhost:7000/produtos/excluir/${id}`, { method: 'DELETE' });
            if (response.ok) fetchData();
        } catch (error) {
            alert("Erro ao conectar com o servidor.");
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="page-layout">
            <Sidebar />
            <main className="main-content">
                <header className="page-header">
                    <div className="header-title">
                        <h2>Gestão de Produtos</h2>
                        <p>Controle total do inventário Farmácia Maya.</p>
                    </div>

                    <div className="search-wrapper" style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                        <Search 
                            size={18} 
                            className="search-icon" 
                            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} 
                        />
                        <input 
                            type="text" 
                            placeholder="Pesquisar por nome ou categoria..." 
                            className="form-input" 
                            style={{ paddingLeft: '40px', width: '100%' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={20} /> Novo Produto
                    </button>
                </header>

                <div className="table-wrapper">
                    {loading ? (
                        <div style={{ padding: '20px', textAlign: 'center' }}>Carregando inventário...</div>
                    ) : (
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Produto / Categoria</th>
                                    <th>Preço Un.</th>
                                    <th>Stock</th>
                                    <th>Fabricação / Expiração</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {produtosFiltrados.length > 0 ? (
                                    produtosFiltrados.map((p) => (
                                        <tr key={p.id}>
                                            <td>
                                                <div className="product-name" style={{ fontWeight: 600 }}>{p.nome}</div>
                                                <div className="category-tag" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#64748b' }}>
                                                    <Tag size={12}/> {p.categoria || 'Sem categoria'}
                                                </div>
                                            </td>
                                            <td>{formatCurrency(p.preco)}</td>
                                            <td>
                                                <span className={`stock-badge ${p.quantidade <= 5 ? 'stock-low' : 'stock-ok'}`}>
                                                    {p.quantidade} un.
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{fontSize: '0.85rem'}}>
                                                    <span title="Fabricação" style={{color: '#64748b'}}>{p.data_fabricacao || 'N/A'}</span><br/>
                                                    <span title="Expiração" style={{fontWeight: 600, color: '#e11d48'}}>{p.data_expiracao || '---'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <button onClick={()=> handleDelete(p.id)} className="btn-icon delete" title="Eliminar">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                                            Nenhum produto encontrado com o termo "{searchTerm}".
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
                            <button className="btn-close" onClick={() => setShowModal(false)}><X size={24} /></button>
                        </header>

                        <form onSubmit={handleSubmitCreate}>
                            <div className="form-group">
                                <label className="form-label"><Package size={18}/> Nome do Produto</label>
                                <input type="text" name="nome" className="form-input" value={formData.nome} onChange={handleInputChange} required />
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label"><Tag size={18}/> Categoria</label>
                                    <select name="categoria" className="form-input" value={formData.categoria} onChange={handleInputChange} required>
                                        <option value="">Selecione...</option>
                                        <option value="Medicamentos">Medicamentos</option>
                                        <option value="Suplementos">Suplementos</option>
                                        <option value="Higiene">Higiene</option>
                                        <option value="Cosméticos">Cosméticos</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label"><Calendar size={18}/> Data de Registro</label>
                                    <input type="date" name="data_criacao" className="form-input" value={formData.data_criacao} onChange={handleInputChange} />
                                </div>
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label"><Factory size={18}/> Data de Fabricação</label>
                                    <input type="date" name="data_fabricacao" className="form-input" value={formData.data_fabricacao} onChange={handleInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label"><Calendar size={18}/> Data de Expiração</label>
                                    <input type="date" name="data_expiracao" className="form-input" value={formData.data_expiracao} onChange={handleInputChange} required />
                                </div>
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label"><DollarSign size={18}/> Preço (AOA)</label>
                                    <input type="number" name="preco" className="form-input" value={formData.preco} onChange={handleInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label"><Package size={18}/> Qtd Inicial</label>
                                    <input type="number" name="quantidade" className="form-input" value={formData.quantidade} onChange={handleInputChange} required />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label"><Users size={18}/> Fornecedor</label>
                                <select name="fornecedor_id" className="form-input" value={formData.fornecedor_id} onChange={handleInputChange} required>
                                    <option value="">Selecione...</option>
                                    {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                                </select>
                            </div>

                            <button type="submit" className="btn-primary btn-submit">Finalizar Cadastro</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}