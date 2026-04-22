import { useState, useEffect, useCallback } from 'react';
import SideBar from '../components/SideBar.tsx';
import { Trash2, ShieldCheck, UserPlus, X, Check, Save } from 'lucide-react';
import '../styles/AcountManager.css';

interface User {
    id: number;
    nome: string;
    email: string;
    role: string; 
    role_id: number;
}

export default function AccountManager() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingUser, setEditingUser] = useState<number>();
    
    const [users, setUsers] = useState<User[]>([]);
    const [formData, setFormData] = useState({ nome: '', email: '', password: '', role_id: 3 });
    
    const API_URL = 'http://localhost:7000';
    const token = localStorage.getItem('token');

    // 1. LISTAR (Filtrando o Root)
    const fetchUsers = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/admin/utilizadores`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (response.ok) {
                // Filtra para não mostrar o Root (ID 1 ou Role 1) na listagem
                const filtered = data.filter((u: User) => u.role_id !== 1);
                setUsers(filtered);
            }
        } catch (err) {
            console.error("Erro ao conectar ao servidor:", err);
        }
    }, [token]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // Abrir modal para novo
    const openCreateModal = () => {
        setIsEditMode(false);
        setFormData({ nome: '', email: '', password: '', role_id: 3 });
        setIsModalOpen(true);
    };

    // Abrir modal para editar
    const openEditModal = (user: User) => {
        setIsEditMode(true);
        setEditingUser(user.id);
        setFormData({ nome: user.nome, email: user.email, password: '', role_id: user.role_id });
        setIsModalOpen(true);
    };

    // 2. CRIAR / EDITAR (Submit Único)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const url = isEditMode 
            ? `${API_URL}/admin/utilizadores/editar/${editingUser}`
            : `${API_URL}/admin/utilizadores/add`;
            
        const method = isEditMode ? 'PATCH' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                window.alert(isEditMode ? "Dados atualizados!" : "Colaborador registado!");
                setIsModalOpen(false);
                fetchUsers(); 
            } else {
                const error = await response.json();
                window.alert(error.message || "Erro na operação");
            }
        } catch (err) {
            window.alert("Erro de conexão.");
        }
    };

    // 3. EXCLUIR
    const handleDelete = async (id: number) => {
        if (!window.confirm("Remover este acesso permanentemente?")) return;
        try {
            const response = await fetch(`${API_URL}/admin/utilizadores/excluir/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setUsers(prev => prev.filter(u => u.id !== id));
            }
        } catch (err) {
            console.error("Erro ao excluir:", err);
        }
    };

    const getRoleClass = (role: string) => {
        const r = role?.toLowerCase() || '';
        if (r.includes('admin')) return 'badge-admin';
        if (r.includes('responsável')) return 'badge-farmaceutico';
        return 'badge-tecnico';
    };

    return (
        <div className="account-container">
            <SideBar />
            
            <main className="main-content">
                <header className="header-section">
                    <div>
                        <h1>Gestão de Contas</h1>
                        <p style={{color: 'var(--text-muted)'}}>Staff & Permissões</p>
                    </div>
                    <button className="btn-primary" onClick={openCreateModal}>
                        <UserPlus size={18} /> Novo Acesso
                    </button>
                </header>

                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Colaborador</th>
                                <th>Email</th>
                                <th>Cargo</th>
                                <th style={{textAlign: 'center'}}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td className="font-bold">{user.nome}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`badge ${getRoleClass(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="actions-cell">
                                        <button 
                                            className="btn-icon edit" 
                                            onClick={() => openEditModal(user)}
                                            title="Editar Colaborador"
                                        >
                                            <ShieldCheck size={18} />
                                        </button>
                                        <button 
                                            className="btn-icon delete" 
                                            onClick={() => handleDelete(user.id)}
                                            title="Remover"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="close-btn" onClick={() => setIsModalOpen(false)}>
                            <X size={20} />
                        </div>
                        
                        <h2>{isEditMode ? 'Editar Acesso' : 'Novo Colaborador'}</h2>
                        
                        <form style={{marginTop: '2rem'}} onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Nome Completo</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.nome}
                                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Email</label>
                                <input 
                                    type="email" 
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>

                            {!isEditMode && (
                                <div className="form-group">
                                    <label>Senha Provisória</label>
                                    <input 
                                        type="password" 
                                        required={!isEditMode}
                                        placeholder="Mínimo 6 caracteres"
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label>Nível de Acesso</label>
                                <select 
                                    value={formData.role_id}
                                    onChange={(e) => setFormData({...formData, role_id: Number(e.target.value)})}
                                >
                                    <option value="2">Farmacêutico Responsável</option>
                                    <option value="3">Técnico de Farmácia</option>
                                </select>
                            </div>

                            <button type="submit" className="btn-primary" style={{width: '100%', justifyContent: 'center'}}>
                                {isEditMode ? <Save size={18} /> : <Check size={18} />}
                                {isEditMode ? ' Atualizar Dados' : ' Ativar Conta'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}