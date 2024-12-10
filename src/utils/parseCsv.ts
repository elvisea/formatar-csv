import * as fs from 'fs';
import csvParser from 'csv-parser';
import { insertBatchToDatabase } from '../db/insert';
import { normalizeKeys } from './normalize';

const fixJsonField = (jsonString: string): string | null => {
  try {
    const cleanedJsonString = jsonString.replace(/[\s\t\r\n]+/g, ' ').trim();
    const parsedJson = JSON.parse(cleanedJsonString);
    return JSON.stringify(parsedJson);
  } catch (error) {
    console.error(`Erro ao corrigir o campo JSON: ${error}`);
    return null;
  }
};

export const extractDataFromFile = async (
  path: string,
  tableName: string,
  callbacks: { onSuccess: (count: number) => void; onFailure: (count: number) => void }
): Promise<void> => {
  let lineCount = 0;
  let batchData: any[] = [];
  let successCount = 0;
  let failureCount = 0;

  // Array para armazenar as promessas de inserção
  const insertPromises: Promise<any>[] = [];

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(path)
      .pipe(csvParser())
      .on('data', async (data) => {
        lineCount++;
        console.log(`Linha lida. Total de linhas processadas: ${lineCount}`);

        if (data['metadata']) {
          const metadata = data['metadata'];
          if (typeof metadata === 'string' && metadata.trim().startsWith('{') && metadata.trim().endsWith('}')) {
            const correctedJson = fixJsonField(metadata);
            if (correctedJson !== null) {
              data['metadata'] = correctedJson;
            } else {
              console.log(`Campo 'metadata' não pôde ser corrigido.`);
            }
          }
        }

        const normalizedData = normalizeKeys(data);
        batchData.push(normalizedData);

        // Se o batch atingir o limite, inicia o processo de inserção paralela
        if (batchData.length >= 200) {
          const currentBatch = [...batchData];  // Cria uma cópia do lote para inserção
          batchData = []; // Reseta o lote atual
          insertPromises.push(insertBatchToDatabase(currentBatch, tableName).then(() => {
            successCount += currentBatch.length;
          }).catch(() => {
            failureCount += currentBatch.length;
          }));
        }
      })
      .on('end', async () => {
        console.log(`Leitura do arquivo CSV concluída. Total de linhas processadas: ${lineCount}`);

        if (batchData.length > 0) {
          // Insere o último lote se houver dados restantes
          const currentBatch = [...batchData];
          insertPromises.push(insertBatchToDatabase(currentBatch, tableName).then(() => {
            successCount += currentBatch.length;
          }).catch(() => {
            failureCount += currentBatch.length;
          }));
        }

        // Aguarda a conclusão de todas as promessas de inserção
        await Promise.all(insertPromises);

        callbacks.onSuccess(successCount);
        callbacks.onFailure(failureCount);

        resolve();
      })
      .on('error', async (err) => {
        console.error('Erro ao processar o arquivo CSV:', err);
        reject(err);
      });
  });
};
