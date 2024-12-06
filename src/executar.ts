import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';


// Configuração do PostgreSQL (modifique conforme sua configuração)
const client = new Client({
  host: 'localhost', // ou o endereço do seu servidor PostgreSQL
  port: 5432,
  user: 'middleware_sundancae_user', // substitua pelo seu usuário
  password: 'middleware_sundancae_password', // substitua pela sua senha
  database: 'middleware_sundancae_database', // substitua pelo nome do seu banco
});

// Função para executar arquivos SQL no banco de dados
const executeSqlFromFiles = async (directoryPath: string) => {
  try {
    // Conectando ao banco de dados
    await client.connect();
    console.log('Conectado ao banco de dados com sucesso!');

    // Lê todos os arquivos no diretório especificado
    const files = fs.readdirSync(directoryPath);

    // Filtra arquivos que possuem a extensão .sql
    const sqlFiles = files.filter(file => file.endsWith('.sql'));

    console.log(`Encontrados ${sqlFiles.length} arquivos SQL para processar.`);

    // Processa cada arquivo SQL
    for (let i = 0; i < sqlFiles.length; i++) {
      const file = sqlFiles[i];
      const filePath = path.join(directoryPath, file);

      console.log(`Lendo arquivo SQL: ${file}`);
      const sqlQuery = fs.readFileSync(filePath, 'utf-8'); // Lê o conteúdo do arquivo SQL

      try {
        // Executa o conteúdo do arquivo SQL
        console.log(`Executando comandos do arquivo: ${file}`);
        await client.query(sqlQuery);
        console.log(`Arquivo ${file} executado com sucesso.`);
      } catch (err) {
        console.error(`Erro ao executar o arquivo ${file}:`, err);
      }
    }

    console.log("Todos os arquivos SQL foram processados com sucesso.");
  } catch (err) {
    console.error('Erro ao conectar ou executar os arquivos SQL:', err);
  } finally {
    // Finaliza a conexão com o banco de dados
    await client.end();
    console.log('Conexão com o banco de dados encerrada.');
  }
};

// Caminho para o diretório raiz onde os arquivos SQL foram gerados
const sqlFilesDirectory = path.join(__dirname, '/');

// Inicia a execução dos arquivos SQL
executeSqlFromFiles(sqlFilesDirectory);
