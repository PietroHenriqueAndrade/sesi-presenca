// 1. OBRIGATÓRIO: Carrega o .env para dentro do ambiente de testes do Jest
require('dotenv').config(); 

const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/database/client'); // Importa o Prisma para desligá-lo no final

describe('Testes de Integração - Módulo IA', () => {
  
  // 2. Aumenta o tempo limite do Jest para 10 segundos 
  // (Pois o teste de Health Check pode demorar até 5s se o Python estiver desligado)
  jest.setTimeout(10000); 

  // 3. Limpeza: Desliga o banco de dados após os testes para o terminal não ficar travado
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Deve barrar o acesso à IA se a API KEY não for fornecida', async () => {
    const res = await request(app)
      .post('/api/v1/ia/registrar-presenca')
      .send({
        alunoId: 'fake-id',
        turmaId: 'fake-turma',
        faceScore: 0.99
      });

    // Esperamos um 401 Unauthorized porque o header de Authorization está vazio
    expect(res.statusCode).toEqual(401); 
  });

  it('Health Check deve retornar status online ou offline', async () => {
    const res = await request(app).get('/api/v1/ia/health');
    
    // Pode retornar 200 (Python ligado) ou 503 (Python desligado). 
    // O importante é que a rota EXISTA e não retorne 404 ou estoure um erro 500.
    expect([200, 503]).toContain(res.statusCode);
  });
});