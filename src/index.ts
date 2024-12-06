import * as fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';

// Variáveis de contagem para sucesso e falhas
let successCount = 0;
let failureCount = 0;
let lineCount = 0; // Contador de linhas processadas

// Função para corrigir o campo JSON mal formatado e limpar espaços/tabulações
const fixJsonField = (jsonString: string): string | null => {
  try {
    // Remove espaços, tabulações e quebras de linha antes de tentar parsear
    const cleanedJsonString = jsonString.replace(/[\s\t\r\n]+/g, ' ').trim();

    console.log(`Tentando corrigir o campo JSON...`);
    const parsedJson = JSON.parse(cleanedJsonString); // Tenta parsear o JSON
    successCount++; // Incrementa o contador de sucesso
    return JSON.stringify(parsedJson); // Retorna o JSON corrigido
  } catch (error) {
    // Se não for possível, retorna null (indica falha na correção)
    console.error(`Erro ao corrigir o campo JSON.`);
    failureCount++; // Incrementa o contador de falhas
    return null;
  }
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

        // A cada 500 registros, salvar e limpar a memória
        if (results.length >= 500) { // Diminuir para 500 registros
          saveToCsvStream(results, 'partial_output.csv');
          results.length = 0; // Limpa os resultados para liberar memória
        }
      })
      .on('end', () => {
        if (results.length > 0) {
          saveToCsvStream(results, 'final_output.csv'); // Salva o restante dos dados
        }
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

    // Salva os dados corrigidos em um novo arquivo CSV
    saveToCsvStream(data, outputPath);

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
const outputFilePath = path.join(__dirname, '../accessories-formatado.csv'); // Novo arquivo na raiz

processCsvFile(inputFilePath, outputFilePath);
