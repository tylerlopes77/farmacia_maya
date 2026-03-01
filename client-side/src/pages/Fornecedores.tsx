import { useEffect, useState } from 'react';
import Sidebar from "../components/SideBar.tsx";
import { 
    Plus, 
    Mail, 
    Phone, 
    MapPin, 
    Edit, 
    Trash2, 
    X, 
    Building2 
} from 'lucide-react';

import '../styles/fornecedores.css';

interface Fornecedor {
    id: number;
    nome: string;
    contato: string;
    endereco: string;
}

export default function Fornecedores() {
    const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        nome: '',
        contato: '',
        endereco: '',
    });

    const getFornecedores = async () => {
        const url = 'http://localhost:7000/fornecedores';
        
        try {
            const response = await fetch(url ,{
                method:'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if(response.ok){
                const result = await response.json();
                console.log(result)
                setFornecedores(result);
                return;
            }            
        } catch (error) {
            alert('Erro ao buscar os fornecedores na bd ! \n Motivo do erro : ' + error);
            console.log(error);
        }finally{
            setLoading(false);
        }

    }

    useEffect(()=>{
        getFornecedores();
    },[]);


    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 

    const baseUrl = 'http://localhost:7000/fornecedores';
    const url = editingId 
        ? `${baseUrl}/editar/${editingId}` 
        : `${baseUrl}/add`;
    
    const method = editingId ? 'PATCH' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        if (response.ok) {
            alert(editingId ? 'Fornecedor atualizado!' : 'Fornecedor cadastrado com sucesso!');
            
            setShowModal(false);
            setFormData({ nome: '', contato: '', endereco: '' });
            getFornecedores(); 
        } else {
            const errorData = await response.json();
            alert(`Erro: ${errorData.message || 'Falha na operação'}`);
        }
    } catch (error) {
        console.error("Erro ao salvar:", error);
        alert("Erro de conexão com o servidor.");
    }
};

    const handleEliminar = async (id: number) => {
        if (!window.confirm("Tem certeza que deseja eliminar este fornecedor?")) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:7000/fornecedores/excluir/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                alert("Fornecedor eliminado com sucesso!");
                setFornecedores(prev => prev.filter(f => f.id !== id));
            } else {
                const errorData = await response.json();
                alert(errorData.message || "Erro ao eliminar fornecedor.");
        }
        } catch (error) {
            console.error("Erro na requisição:", error);
            alert("Erro de conexão com o servidor.");
    }
};

    const openEditModal = (f: Fornecedor) => {
    setEditingId(f.id);
    
    setFormData({
        nome: f.nome,
        contato: f.contato,
        endereco: f.endereco
    });    
    setShowModal(true);
};


    return (
        <div className="supplier-layout">

            <Sidebar />

            <main className="main-content">
                <header className="header-section">
                    <div className="header-title">
                        <h2>Gestão de Fornecedores</h2>
                        <p>Controle os parceiros e origens dos seus produtos.</p>
                    </div>
                    <button className="btn-add" onClick={() => { setEditingId(null); setFormData({nome:'',  contato:'', endereco:''}); setShowModal(true); }}>
                        <Plus size={20} /> Novo Fornecedor
                    </button>
                </header>

                {loading ? (
                    <p>A carregar fornecedores...</p>
                ) : (
                    <div className="supplier-grid">
                        {fornecedores.map(f => (
                            <div key={f.id} className="supplier-card">
                                <div className="card-header">
                                    <div className="icon-box"><Building2 size={24} /></div>
                                    <div className="card-info">
                                        <h3>{f.nome}</h3>
                                        <span style={{fontSize: '0.8rem', color: '#94a3b8'}}>ID: #{f.id}</span>
                                    </div>
                                </div>

                                <div className="contact-item"><Phone size={16} /> {f.contato}</div>
                                <div className="contact-item"><MapPin size={16} /> {f.endereco}</div>

                                <div className="card-actions">
                                    <button className="action-btn" onClick={() => openEditModal(f)}>
                                        <Edit size={16} /> Editar
                                    </button>
                                    <button className="action-btn btn-delete" onClick={() => handleEliminar(f.id)}>
                                        <Trash2 size={16} /> Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Modal de Cadastro/Edição */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom: '24px'}}>
                            <h3>{editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h3>
                            <button onClick={() => setShowModal(false)} style={{background:'none', border:'none', cursor:'pointer'}}><X /></button>
                        </div>
                        <form onSubmit={handleSubmit} >
                            <div className="form-group">
                                <label>Nome da Empresa</label>
                                <input type="text" className="form-input" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required />
                            </div>

                            <div className="form-group">
                                <label>Telefone</label>
                                <input type="text" className="form-input" value={formData.contato} onChange={e => setFormData({...formData, contato: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Endereço / Sede</label>
                                <input type="text" className="form-input" value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} />
                            </div>
                            <button type="submit" className="btn-add" style={{width: '100%', justifyContent: 'center', marginTop: '10px'}}>
                                {editingId ? 'Guardar Alterações' : 'Cadastrar Fornecedor'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}