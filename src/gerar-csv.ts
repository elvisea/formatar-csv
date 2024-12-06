import fs from 'fs';
import path from 'path';
import { faker } from '@faker-js/faker'; // Biblioteca alternativa para gerar dados fictícios

// Função para gerar um único registro fictício
const generateRecord = (id: number) => {
  return {
    id: faker.string.uuid(),
    brand: faker.company.name(),
    category: faker.commerce.department(),
    collection_id: Math.floor(Math.random() * 10001),
    description: faker.lorem.sentence(),
    discountable: faker.datatype.boolean(),
    external_id: Math.floor(Math.random() * 10001),
    general_category: faker.commerce.productMaterial(),
    general_category_id: Math.floor(Math.random() * 10001),
    gtin: Math.floor(Math.random() * 1001),
    handle: faker.commerce.productName(),
    height: Math.floor(Math.random() * 1001),
    hs_code: Math.floor(Math.random() * 1001),
    is_giftcard: faker.datatype.boolean(),
    length: Math.floor(Math.random() * 1001),
    material: faker.commerce.productMaterial(),
    mid_code: Math.floor(Math.random() * 10001),
    metadata: JSON.stringify({ key: faker.lorem.word(), value: faker.lorem.word() }), // JSON mal formatado
    price: faker.commerce.price(),
    quantity_available: Math.floor(Math.random() * 1001),
    status: "available",
    subtitle: faker.lorem.sentence(),
    thumbnail: faker.image.url(),
    title: faker.commerce.productName(),
    type_id: Math.floor(Math.random() * 10001),
    universal_fitment: faker.datatype.boolean(),
    update_source: 4,
    deleted_at: null,
    updated_at: new Date(),
    created_at: new Date(),
    weight: Math.floor(Math.random() * 1001),
    width: Math.floor(Math.random() * 1001),
    origin_country: faker.address.country(),
    warranty_doc: Math.floor(Math.random() * 10001),
    brand_logo: faker.image.url(),
    category_combined_id: Math.floor(Math.random() * 10001),
  };
};

// Função para gerar o arquivo CSV com 50.000 registros
const generateCsvFile = (numRecords: number) => {
  const records: any[] = [];
  const headers = Object.keys(generateRecord(1)); // Obter as chaves da estrutura de um registro fictício

  // Gerar os registros fictícios
  for (let i = 1; i <= numRecords; i++) {
    records.push(generateRecord(i));
  }

  const writeStream = fs.createWriteStream(path.join(__dirname, 'accessories_50000.csv'));

  // Escrever os cabeçalhos no arquivo CSV
  writeStream.write(headers.join(',') + '\n');

  // Escrever os registros no arquivo CSV
  records.forEach((record) => {
    const row = headers.map((header) => {
      return `"${record[header] ? record[header].toString().replace(/"/g, '""') : ''}"`; // Escapa as aspas
    }).join(',');
    writeStream.write(row + '\n');
  });

  writeStream.end();
  console.log('Arquivo CSV gerado com 50.000 registros fictícios.');
};

// Gerar arquivo CSV com 50.000 registros
generateCsvFile(50000);
