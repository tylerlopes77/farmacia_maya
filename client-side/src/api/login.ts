export const login = async (email: string, password: string) => {
    if (!email || !password) {
        return { error: true, message: 'Preencha todos os campos, por favor!' };
    }

    const data = { email, password };

    try {
        const response = await fetch('http://localhost:7000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            return { error: true, message: result.message || 'Erro ao fazer login' };
        }

        localStorage.setItem('token', result.token); 

        return { error: false, message: 'Login realizado com sucesso!' };

    } catch (error) {
        console.log(error);
        return { error: true, message: 'Servidor offline ou erro de rede.' };
    }
};