import { useState } from 'react';
import { login } from '../api/login.ts'; 
import '../styles/MainLoginScreenStyle.css';
import { useNavigate } from 'react-router-dom';

export default function MainLoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState(''); 
    const [isError, setIsError] = useState(false); 
    const navigation = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const res = await login(email, password);
        
        setMessage(res.message);
        setIsError(res.error || false);

        if (!res.error) {
            navigation('/home');
        }
    };

    return (
        <div className="login-container">
            <div className="banner-side">
                <div className="logo-icon">✱</div>
                <div>
                    <h1>Olá<br />Novamente! 👋</h1>
                    <p>Gerencie produtos, stock e fornecedores com total controle...</p>
                </div>
                <div className="footer-text">© 2026 Farmácia Maya.</div>
            </div>

            <div className="form-side">
                <div className="form-wrapper">
                    <div className="brand-name">Farmácia Maya</div>
                    <div className="welcome-section">
                        <h2>Bem-vindo de volta!</h2>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div className="input-group">
                            <label>Email</label>
                            <input 
                                type="email" 
                                onChange={(e) => setEmail(e.target.value)} 
                                placeholder="exemplo@gmail.com"
                            />
                        </div>

                        <div className="input-group">
                            <label>Senha</label>
                            <input 
                                type="password" 
                                onChange={(e) => setPassword(e.target.value)} 
                                placeholder="••••••••"
                            />
                        </div>

                        {message && (
                            <p style={{ color: isError ? 'red' : 'green', marginBottom: '10px' }}>
                                {message}
                            </p>
                        )}

                        <button type="submit" className="btn-login">
                            Entrar agora
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}