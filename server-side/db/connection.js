const {Pool} = require('pg');

const  pool = new Pool({
    user:'postgres',
    host:'localhost',
    database:'postgres',
    password:'Angolano77$',
    port:5432
});

pool.connect(async (err, client, release) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados', err.stack);
    } else {
        console.log('Conexão com o banco de dados estabelecida com sucesso pelo ' + client.user);
        release(); 
    }
});

module.exports = pool;