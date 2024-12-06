import * as fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';

// Variáveis de contagem para sucesso e falhas
let successCount = 0;
let failureCount = 0;
let lineCount = 0; // Contador de linhas processadas

// Conjunto para armazenar os IDs já processados
const processedIds: Set<string> = new Set();
const duplicateIds: { [id: string]: number } = {}; // Para contar as duplicatas

// Função para corrigir o campo JSON mal formatado e limpar espaços/tabulações
const fixJsonField = (jsonString: string): string | null => {
  try {
    const cleanedJsonString = jsonString.replace(/[\s\t\r\n]+/g, ' ').trim();
    const parsedJson = JSON.parse(cleanedJsonString); // Tenta parsear o JSON
    successCount++; // Incrementa o contador de sucesso
    return JSON.stringify(parsedJson); // Retorna o JSON corrigido
  } catch (error) {
    console.error(`Erro ao corrigir o campo JSON.`);
    failureCount++; // Incrementa o contador de falhas
    return null;
  }
};

/**
 * Função para validar e corrigir campos de data
 * Se o valor da data for inválido ou vazio, será atribuído um valor padrão (data atual)
 */
const validateDate = (dateStr: string | null | undefined): string => {
  if (!dateStr || isNaN(Date.parse(dateStr))) {
    return `${new Date().toISOString()}`; // Retorna a data atual no formato ISO
  }
  return `'${dateStr}'`; // Retorna a data original se for válida
};

/**
 * Função para gerar os comandos SQL de inserção e salvar em arquivos separados a cada 500 registros
 */
const generateSqlInsertCommands = (data: any[], outputPath: string) => {
  let fileIndex = 1; // Contador para os arquivos de saída
  let recordCount = 0; // Contador de registros processados para o arquivo atual

  let writeStream = fs.createWriteStream(`${outputPath}-${fileIndex}.sql`, { flags: 'w' });
  writeStream.write('-- Comandos de inserção para a tabela public.accessories\n');
  writeStream.write('BEGIN;\n'); // Inicia a transação

  // Gerar os comandos INSERT para cada linha
  data.forEach(row => {
    const id = row['id']; // Chave única identificadora
    if (processedIds.has(id)) {
      // Se o ID já foi processado, contamos a duplicata
      if (duplicateIds[id]) {
        duplicateIds[id]++;
      } else {
        duplicateIds[id] = 2; // Primeira repetição
      }
      return; // Ignora a inserção desse registro, pois é um ID repetido
    }

    // Adiciona o ID ao conjunto de IDs processados
    processedIds.add(id);

    // Processa e valida os campos de dados
    const values = Object.keys(row).map(key => {
      let value = row[key];

      // Verifica e corrige campos de data (como 'created_at', 'updated_at', 'deleted_at')
      if (key === 'created_at' || key === 'updated_at' || key === 'deleted_at') {
        value = validateDate(value); // Valida e corrige a data
      }

      if (value === null || value === undefined || value === '') {
        return 'NULL'; // Caso o valor seja nulo, indefinido ou vazio, insere NULL
      } else if (typeof value === 'string') {
        return `'${value.replace(/'/g, "''")}'`; // Escapa apóstrofos em valores de texto
      } else if (typeof value === 'boolean') {
        return value ? 'TRUE' : 'FALSE';
      } else if (typeof value === 'number') {
        return value.toString();
      } else {
        return `'${value}'`; // Para qualquer outro tipo, assume que é texto
      }
    }).join(', ');

    const sql = `INSERT INTO public.accessories (${Object.keys(row).join(', ')}) VALUES (${values});\n`;

    try {
      writeStream.write(sql);
      recordCount++;

      // Se atingirmos 500 registros, cria um novo arquivo SQL
      if (recordCount >= 500) {
        writeStream.write('COMMIT;\n');
        writeStream.end();

        // Cria um novo arquivo SQL
        fileIndex++;
        writeStream = fs.createWriteStream(`${outputPath}-${fileIndex}.sql`, { flags: 'w' });
        writeStream.write('-- Comandos de inserção para a tabela public.accessories\n');
        writeStream.write('BEGIN;\n');
        recordCount = 0; // Reseta o contador de registros
      }
    } catch (error) {
      console.error(`Erro ao gerar o comando SQL para a linha: ${JSON.stringify(row)}`);
      console.error(`Erro no comando SQL: ${sql}`);

      // Rollback em caso de erro
      writeStream.write('ROLLBACK;\n');
      writeStream.end();
      return; // Interrompe o processamento em caso de erro
    }
  });

  // Finaliza o arquivo SQL se ainda houver registros
  if (recordCount > 0) {
    writeStream.write('COMMIT;\n');
    writeStream.end();
  }

  console.log(`Arquivos SQL gerados com sucesso!`);
  console.log(`IDs duplicados encontrados:`, duplicateIds);
};

/**
 * Função para salvar os dados processados em um novo arquivo CSV
 * Salvando linha por linha para evitar sobrecarga de memória
 */
const saveToCsvStream = (data: any[], outputPath: string) => {
  const writeStream = fs.createWriteStream(outputPath, { flags: 'w' });
  const headers = Object.keys(data[0]);

  // Escrever cabeçalhos no arquivo de saída
  writeStream.write(headers.join(',') + '\n');

  // Escrever as linhas de dados
  data.forEach(row => {
    writeStream.write(headers.map(header => {
      return row[header] !== undefined ? row[header] : ''; // Garante que os valores das colunas estejam alinhados
    }).join(',') + '\n');
  });

  writeStream.end(); // Finaliza a escrita do arquivo
  console.log('Arquivo CSV salvo com sucesso em:', outputPath);
};

// Função para fazer uma pausa (sleep) de 20 segundos
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Função genérica para processar o arquivo CSV
export const extractDataFromFile = async <T>(path: string): Promise<T[]> => {
  const results: T[] = [];
  console.log(`Iniciando a leitura do arquivo CSV: ${path}`);

  return new Promise<T[]>((resolve, reject) => {
    fs.createReadStream(path)
      .pipe(csvParser())
      .on('data', (data) => {
        lineCount++; // Incrementa o contador de linhas
        console.log(`Linha lida com sucesso. Total de linhas processadas: ${lineCount}`);

        // Imprimir o valor do campo 'id' para ver seus formatos
        console.log(`Campo 'id' da linha: ${data['id']}`);

        // Verifica o campo 'metadata' e corrige o JSON mal formatado
        if (data['metadata']) {
          const metadata = data['metadata'];
          if (typeof metadata === 'string' && metadata.trim().startsWith('{') && metadata.trim().endsWith('}')) {
            const correctedJson = fixJsonField(metadata);
            if (correctedJson !== null) {
              console.log(`Campo 'metadata' corrigido.`);
              data['metadata'] = correctedJson; // Corrige o campo 'metadata'
            } else {
              console.log(`Campo 'metadata' não pôde ser corrigido.`);
            }
          }
        }

        results.push(data as T); // Adiciona o item na lista
      })
      .on('end', () => {
        console.log(`Leitura do arquivo CSV concluída. Total de linhas processadas: ${lineCount}`);
        resolve(results);
      })
      .on('error', async (err) => {
        console.error('Erro ao processar o arquivo CSV:', err);
        // Aguarda 20 segundos antes de continuar
        await sleep(20000);
        console.log("Continuando o processamento após 20 segundos...");
        reject(err); // Após a pausa, podemos rejeitar o erro ou continuar dependendo do comportamento desejado.
      });
  });
};

// Função principal para processar e corrigir o CSV
const processCsvFile = async (inputPath: string, outputPath: string) => {
  const startTime = Date.now(); // Marca o início do processo

  try {
    console.log('Iniciando o processamento do arquivo CSV...');

    // Extrai os dados do arquivo CSV
    const data = await extractDataFromFile<any>(inputPath);

    // Gera os comandos SQL de inserção e salva em arquivos separados a cada 500 registros
    generateSqlInsertCommands(data, outputPath);

    // Exibe o resumo de correções
    console.log(`Resumo das correções nos campos JSON:`);
    console.log(`Correções bem-sucedidas: ${successCount}`);
    console.log(`Correções falhadas: ${failureCount}`);

    const endTime = Date.now(); // Marca o final do processo
    const duration = (endTime - startTime) / 1000; // Calcula a duração em segundos
    console.log(`Processamento concluído em ${duration} segundos.`);

  } catch (error) {
    console.error('Erro ao processar o arquivo CSV:', error);
  }
};

// Caminhos do arquivo de entrada e saída
const inputFilePath = path.join(__dirname, '../accessories.csv'); // Caminho correto para a raiz
const outputFilePath = path.join(__dirname, '../accessories_inserts'); // Nome base do arquivo SQL

processCsvFile(inputFilePath, outputFilePath);
