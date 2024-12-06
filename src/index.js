"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractDataFromFile = void 0;
var fs = require("fs");
var path_1 = require("path");
var csv_parser_1 = require("csv-parser");
// Função para corrigir o campo JSON mal formatado
var fixJsonField = function (jsonString) {
    try {
        // Tenta fazer o parse do JSON, se falhar, tenta corrigir
        console.log("Tentando corrigir o campo JSON: ".concat(jsonString));
        return JSON.stringify(JSON.parse(jsonString));
    }
    catch (error) {
        // Se não for possível, retorna null (significa que não foi possível corrigir)
        console.error("Erro ao corrigir o campo JSON: ".concat(jsonString));
        return null;
    }
};
// Função para normalizar as chaves (já fornecida)
var normalizeKeys = function (data) {
    var normalizedData = {};
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            // Passo 1: Transforma a chave para minúsculas e remove espaços extras
            var normalizedKey = key.toLowerCase().trim();
            // Passo 2: Capitaliza a primeira letra de cada palavra subsequente (excluindo a primeira)
            normalizedKey = normalizedKey.replace(/(?:^\w|[A-Z]|\b\w)/g, function (match, index) { return (index === 0 ? match : match.toUpperCase()); });
            // Passo 3: Remove todos os espaços
            normalizedKey = normalizedKey.replace(/\s+/g, '');
            normalizedData[normalizedKey] = data[key];
        }
    }
    return normalizedData;
};
/**
 * Função genérica para processar o arquivo CSV e mapear para o tipo desejado
 * @param path - Caminho do arquivo CSV
 * @param type - Tipo genérico para mapear as linhas do CSV
 * @returns Uma lista do tipo genérico
 */
var extractDataFromFile = function (path) { return __awaiter(void 0, void 0, void 0, function () {
    var results;
    return __generator(this, function (_a) {
        results = [];
        console.log("Iniciando a leitura do arquivo CSV: ".concat(path));
        return [2 /*return*/, new Promise(function (resolve, reject) {
                fs.createReadStream(path)
                    .pipe((0, csv_parser_1.default)())
                    .on('data', function (data) {
                    console.log('Linha lida do arquivo:', data);
                    // Normaliza as chaves
                    var normalizedData = normalizeKeys(data);
                    // Verifica e corrige o campo 'metadata' se estiver mal formatado
                    if (normalizedData['metadata']) {
                        var correctedJson = fixJsonField(normalizedData['metadata']);
                        if (correctedJson !== null) {
                            console.log("Campo 'metadata' corrigido.");
                            normalizedData['metadata'] = correctedJson; // Substitui o valor pelo JSON corrigido
                        }
                        else {
                            console.log("Campo 'metadata' n\u00E3o p\u00F4de ser corrigido.");
                        }
                    }
                    results.push(normalizedData); // Adiciona o item na lista
                })
                    .on('end', function () {
                    console.log("Leitura do arquivo CSV conclu\u00EDda. Total de linhas processadas: ".concat(results.length));
                    resolve(results); // Retorna a lista de objetos do tipo genérico
                })
                    .on('error', function (err) {
                    console.error('Erro ao processar o arquivo CSV:', err);
                    reject(err); // Retorna o erro
                });
            })];
    });
}); };
exports.extractDataFromFile = extractDataFromFile;
/**
 * Função para salvar os dados processados em um novo arquivo CSV
 * @param data - Dados que serão salvos no novo arquivo CSV
 * @param outputPath - Caminho do novo arquivo CSV
 */
var saveToCsv = function (data, outputPath) {
    console.log("Salvando os dados no arquivo CSV: ".concat(outputPath));
    var headers = Object.keys(data[0]);
    var csvContent = __spreadArray([
        headers.join(',')
    ], data.map(function (row) { return headers.map(function (header) { return row[header]; }).join(','); }), true).join('\n');
    fs.writeFile(outputPath, csvContent, function (err) {
        if (err) {
            console.error('Erro ao salvar o arquivo CSV:', err);
        }
        else {
            console.log('Arquivo CSV salvo com sucesso em:', outputPath);
        }
    });
};
// Função principal para processar e corrigir o CSV
var processCsvFile = function (inputPath, outputPath) { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                console.log('Iniciando o processamento do arquivo CSV...');
                return [4 /*yield*/, (0, exports.extractDataFromFile)(inputPath)];
            case 1:
                data = _a.sent();
                // Salva os dados corrigidos em um novo arquivo CSV
                saveToCsv(data, outputPath);
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error('Erro ao processar o arquivo CSV:', error_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
// Caminhos do arquivo de entrada e saída
var inputFilePath = path_1.default.join(__dirname, 'accessories.csv'); // Caminho do arquivo de entrada
var outputFilePath = path_1.default.join(__dirname, 'accessories-formatado.csv'); // Caminho do arquivo de saída
processCsvFile(inputFilePath, outputFilePath);
