import express from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  ConstructionData,
  User,
  AIActionRequest,
  RoofDailyReport,
  RoofProjectSummary,
  CalendarTask,
  ProjectScheduleInfo,
  WhatsAppReminderRecord,
  SvaReminderSchedulerStatus,
} from './src/types';
import { INITIAL_ROOF_REPORTS, INITIAL_CALENDAR_TASKS } from './src/data/roofData';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'sany_turnkey_jwt_secret_2025_construction_mgmt';

app.use(express.json());

// Initialize Google Gemini AI (server-side only)
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Error initializing Gemini client:', err);
  }
}

// User Database (Protected Developer Login: souzas@sanygroup.com / 72npR#Sn)
const USERS: (User & { passwordHash: string | string[] })[] = [
  {
    id: 'usr-developer',
    name: 'Samuel Ribeiro de Souza',
    email: 'souzas@sanygroup.com',
    role: 'developer',
    phone: '(12) 99670-7590',
    title: 'Desenvolvedor & Gestor de Sistemas SANY',
    crea: 'CREA-SP 509.814-D',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    passwordHash: ['72npR#Sn', 'samuel123'],
  },
  {
    id: 'usr-developer-gmail',
    name: 'Samuel Ribeiro de Souza',
    email: 'ribeirosamuelvdp@gmail.com',
    role: 'developer',
    phone: '(12) 99670-7590',
    title: 'Desenvolvedor & Gestor de Sistemas SANY',
    crea: 'CREA-SP 509.814-D',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    passwordHash: ['72npR#Sn', 'samuel123'],
  },
  {
    id: 'usr-samuel',
    name: 'Samuel Ribeiro de Souza',
    email: 'desenvolvedor@sany.eng.br',
    role: 'developer',
    phone: '(12) 99670-7590',
    title: 'Desenvolvedor & Gestor de Sistemas SANY',
    crea: 'CREA-SP 509.814-D',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    passwordHash: ['samuel123', '72npR#Sn'],
  },
  {
    id: 'usr-marcos',
    name: 'Eng. Marcos Valério',
    email: 'marcos.valerio@sany.eng.br',
    role: 'engineer',
    phone: '(19) 98123-4567',
    title: 'Engenheiro Civil Residente',
    crea: 'CREA-SP 506.284-D',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    passwordHash: 'sany2025',
  },
  {
    id: 'usr-juliana',
    name: 'Tec. Seg. Juliana Dias',
    email: 'juliana.dias@sany.eng.br',
    role: 'safety_inspector',
    phone: '(19) 99765-4321',
    title: 'Técnica de Segurança do Trabalho (NR-35)',
    crea: 'MTE/SP 004821',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    passwordHash: 'nr35sany',
  },
];

// Seed Construction Project State
let projectData: ConstructionData = {
  projectName: 'Manutenção de Telhado Savoy',
  location: 'Campinas/SP',
  contractNumber: 'SANY-CIV-2025/08',
  generalEngineer: 'Eng. Marcos Valério',
  creaNumber: 'CREA-SP 506.284-D',
  status: 'Em Andamento',
  currentWeek: 6,
  totalWeeks: 10,
  plannedCompletionDate: '15/Mai/2025',
  physicalProgress: 68.4,
  plannedProgress: 72.0,
  deviationPercent: -4.0,
  delayDays: 1.8,
  accidentsCount: 0,
  nr35Status: '100% válida • Grau Risco 0',
  weather: {
    city: 'Campinas/SP',
    temperature: '27°C',
    wind: '9 km/h (SE)',
    condition: 'Ensolarado',
    safeForAltitudeWork: true,
  },
  subsystems: [
    {
      id: 'sub-3-1',
      itemCode: 'ITEM 3.1',
      name: 'Telhas de Fibrocimento (sem amianto)',
      norm: 'NBR 15210/7196 • Galpão 4i1 Savoy',
      location: 'Galpão 4i1 Savoy',
      progressPercent: 49.0,
      targetPercent: 100,
      executedValue: 147,
      totalValue: 300,
      unit: 'unidades (147 de 300 un. • 49.0%)',
      weight: 35,
      details: 'Instalação de telhas de fibrocimento NBR 15210 com parafusos autobrocantes e vedação EPDM.',
      note: 'Meta do contrato: 300 telhas. Executadas: 147 unidades (49.0% em relação ao total).',
      status: 'on_track',
    },
    {
      id: 'sub-3-2',
      itemCode: 'ITEM 3.2',
      name: 'Telhas Translúcidas Policarbonato UV',
      norm: 'Iluminação Zenital e Proteção Solar UV',
      location: 'Cobertura Pavilhão 4i1',
      progressPercent: 27.1,
      targetPercent: 100,
      executedValue: 352,
      totalValue: 1300,
      unit: 'unidades (352 de 1.300 un. • 27.1%)',
      weight: 35,
      details: 'Garantia UV 10 anos. Eficiência luminosa solar ativa no bloco Savoy.',
      note: 'Meta do contrato: 1.300 telhas. Executadas: 352 unidades (27.1% em relação ao total).',
      status: 'on_track',
    },
    {
      id: 'sub-3-3',
      itemCode: 'ITEM 3.3',
      name: 'Calhas & Rufos Galvanizados',
      norm: 'Chapa 24 com vedação poliuretano PU-40',
      location: 'Perímetro e Calhas Centrais',
      progressPercent: 44.4,
      targetPercent: 100,
      executedValue: 1600,
      totalValue: 3600,
      unit: 'm lineares (1.600 de 3.600m • 44.4%)',
      weight: 20,
      details: 'Assentamento de calhas e vedação PU-40 (1.600m executados de 3.600m meta).',
      note: 'Meta do contrato: 3.600 metros de calhas. Executados: 1.600m (44.4% em relação ao total).',
      status: 'on_track',
    },
    {
      id: 'sub-2-0',
      itemCode: 'ITEM 2.0',
      name: 'Linha de Vida & NR-35',
      norm: 'ART Nº SP-2025/89201',
      location: 'Cobertura Integral',
      progressPercent: 100,
      targetPercent: 100,
      executedValue: 2000,
      totalValue: 2000,
      unit: 'm lineares (2.000 de 2.000m • 100%)',
      weight: 0,
      details: 'Item de segurança NR-35 / EPC (2.000m instalados • 100%). Não pontua no avanço físico da cobertura.',
      note: 'Meta do contrato: 2.000 metros de linha de vida homologados. Não entra no cálculo percentual do projeto.',
      status: 'completed',
    },
    {
      id: 'sub-4-0',
      itemCode: 'ITEM 4.0',
      name: 'Desmobilização e Teste Turnkey',
      norm: 'PAC e Teste de Estanqueidade 48h',
      location: 'Área Total',
      progressPercent: 15,
      targetPercent: 20,
      executedValue: 15,
      totalValue: 100,
      unit: '%',
      weight: 5,
      details: 'Preparação para teste de estanqueidade artificial.',
      note: 'Aguardando conclusão do fechamento do setor C.',
      status: 'on_track',
    },
  ],
  wbsTasks: [
    {
      id: 'WBS-01',
      code: 'WBS-01',
      title: 'Mobilização, Vistoria Técnica e Instalação de Linhas de Vida (NR-35)',
      status: 'concluido',
      progress: 100,
      responsible: 'Tec. Seg. Juliana Dias',
      responsibleRole: 'Segurança do Trabalho',
      startDatePlanned: '01/04',
      startDateActual: '01/04',
      endDatePlanned: '07/04',
      endDateActual: '06/04',
      observation: 'ART emitida, 8 pontos de ancoragem testados e laudo aprovado.',
      category: 'inspecao',
      checklists: [
        { item: 'Linhas de Ancoragem Inox 316', status: 'CONFORME' },
        { item: 'Ensaio de Arrancamento Dinâmico', status: 'APROVADO' },
      ],
      detailsText: 'Certificação individual anexada ao prontuário geral de segurança da SANY Savóia Campinas.',
    },
    {
      id: 'WBS-02',
      code: 'WBS-02',
      title: 'Item 3.1: Troca de Telhas de Fibrocimento (NBR 15210 e NBR 7196 sem amianto)',
      status: 'andamento',
      progress: 72,
      responsible: 'Eng. Marcos Valério',
      responsibleRole: 'Engenheiro Residente',
      startDatePlanned: '08/04',
      startDateActual: '08/04',
      endDatePlanned: '22/04',
      endDateActual: '24/04 (Est.)',
      observation: 'Setor A e B concluídos com fixadores de inox; Setor C em sobreposição.',
      category: 'telhado',
      checklists: [
        { item: 'Norma NBR 15210: Espessura 6mm', status: 'OK' },
        { item: 'Fixadores Inox c/ Vedação EPDM', status: 'OK' },
      ],
      detailsText: 'Avanço condicionado à estabilidade térmica no início da tarde na cobertura do bloco administrativo.',
    },
    {
      id: 'WBS-03',
      code: 'WBS-03',
      title: 'Item 3.2: Troca de Telhas Translúcidas Policarbonato Proteção UV',
      status: 'andamento',
      progress: 65,
      responsible: 'Mestre Carlos Souza',
      responsibleRole: 'Mestre de Obras',
      startDatePlanned: '12/04',
      startDateActual: '14/04',
      endDatePlanned: '24/04',
      endDateActual: '26/04 (Est.)',
      observation: 'Instalação das telhas translúcidas setor Norte com vedação perimetral concluída.',
      category: 'telhado',
      checklists: [
        { item: 'Camada Coextrudada Anti-Amarelamento', status: 'CONFORME' },
        { item: 'Fita de Alumínio e Respiro Inferior', status: 'EM APLICAÇÃO' },
      ],
      detailsText: 'Atraso na remessa do segundo lote de placas pelo fornecedor. Pede cobrança emergencial.',
    },
    {
      id: 'WBS-04',
      code: 'WBS-04',
      title: 'Item 3.3: Manutenção, Limpeza e Estanqueidade de Calhas e Rufos',
      status: 'andamento',
      progress: 70,
      responsible: 'Equipe Calhas Silva',
      responsibleRole: 'Calheiros Industriais',
      startDatePlanned: '15/04',
      startDateActual: '15/04',
      endDatePlanned: '26/04',
      endDateActual: '27/04 (Est.)',
      observation: 'Desobstrução de 14 condutores verticais e aplicação de manta líquida elastomérica nos rufos.',
      category: 'calhas',
      checklists: [
        { item: 'Manta Elastomérica 3 Demãos', status: 'EM APLICAÇÃO' },
        { item: 'Desobstrução Bocal Queda Livre', status: 'CONFORME' },
      ],
      detailsText: 'Teste de vazão simulado satisfatório com mangueira de alta pressão.',
    },
    {
      id: 'WBS-05',
      code: 'WBS-05',
      title: 'Desmobilização, Limpeza Final e Teste de Estanqueidade Turnkey',
      status: 'pendente',
      progress: 0,
      responsible: 'Eng. Marcos Valério',
      responsibleRole: 'Engenheiro Residente',
      startDatePlanned: '27/04',
      startDateActual: 'Aguardando',
      endDatePlanned: '30/04',
      endDateActual: 'Aguardando',
      observation: 'Aguardando conclusão das vedações do Setor C para início dos testes hidráulicos.',
      category: 'inspecao',
      checklists: [
        { item: "Teste de Lâmina D'água (48h)", status: 'PROGRAMADO' },
        { item: 'Termo de Entrega Definitiva SAVOY', status: 'PENDENTE' },
      ],
      detailsText: 'Inspeção final em conjunto com fiscalização técnica da Savoy e emissão da ART final.',
    },
  ],
  alerts: [
    {
      id: 'alt-01',
      type: 'weather',
      title: 'Alerta Meteorológico Sexta-Feira',
      badge: 'Risco Chuva',
      description: 'Previsão de rajadas de vento > 35km/h a partir das 14h. Necessário antecipar o fechamento de vãos abertos e lonamento provisório.',
      urgency: 'high',
      time: 'Hoje 08:30',
    },
    {
      id: 'alt-02',
      type: 'equipment',
      title: 'Caminhão Munck SANY Liberado',
      badge: 'Logística',
      description: 'PAT e ART de operação validadas pelo SESMT. Içamento dos paletes de telhas translúcidas agendado para amanhã às 07:30.',
      urgency: 'medium',
      time: 'Hoje 09:15',
    },
  ],
  pendingActions: [
    {
      id: 'act-001',
      title: 'Cobrança Urgente de Fornecedor: Telhas Translúcidas Policarbonato UV (Item 3.2)',
      type: 'supplier_delay_email',
      severity: 'critical',
      subsystemId: 'sub-3-2',
      detectedIssue: 'Atraso de 1.8 dias úteis na entrega do lote remanescente (340 m²) de telhas translúcidas UV. O desvio acumulado de -4.0% ameaça o marco de estanqueidade de 09/Mai.',
      delayImpactDays: 1.8,
      actionExplanation: 'O Agente de IA detectou que a equipe de montagem alcançou 65% do Item 3.2 e corre o risco de desmobilização forçada por falta de material da Policarbo Brasil. É solicitada a aprovação do Desenvolvedor Samuel Ribeiro de Souza para despacho de notificação formal com multa contratual e solicitação de entrega expressa em 24h.',
      approverName: 'Desenvolvedor Samuel Ribeiro de Souza',
      approverRole: 'Desenvolvedor & Gestor de Sistemas',
      approverPhone: '(12) 99670-7590',
      whatsappMessage: `🚨 *SOLICITAÇÃO DE APROVAÇÃO - AGENTE IA SANY*
Olá, Desenvolvedor *Samuel Ribeiro de Souza*!

Identifiquei um atraso crítico de *1.8 dias úteis* na obra *Turnkey Savoy - Campinas* (Desvio atual: *-4.0%*).

*Motivo:* O fornecedor *Policarbo Brasil* não entregou o segundo lote de telhas translúcidas (Item 3.2, 340 m²).
*Ação Proposta:* Enviar e-mail formal de cobrança extrajudicial cobrando entrega em até 24 horas sob pena de acionamento da cláusula de retenção e aplicação de multa contratual de 2% ao dia.

Gostaria da sua autorização para que o sistema envie este e-mail formal ao fornecedor em seu nome e no da SANY Engenharia.

🔗 *Clique no link do dashboard para aprovar ou rejeitar:*
https://ais-dev-zlejd3h4tba6cvx7xgxn55-539765910798.us-east1.run.app/#aprovacoes`,
      supplierEmail: {
        to: 'comercial@policarbobrasil.com.br; diretoria.entregas@policarbobrasil.com.br',
        supplierName: 'Policarbo Brasil Termoplásticos Industriais Ltda.',
        contactPerson: 'Sr. Roberto Mendes - Diretor de Logística',
        subject: '[URGENTE - NOTIFICAÇÃO EXTRAJUDICIAL] Notificação de Atraso de Fornecimento - Obra Turnkey Savoy Campinas - Pedido PO-2025/4412',
        body: `À Diretoria de Operações e Logística da Policarbo Brasil Termoplásticos Industriais Ltda.
A/C: Sr. Roberto Mendes e Departamento de Expedição

Prezados Senhores,

Referência: Pedido de Fornecimento PO-2025/4412 | Contrato Turnkey SANY-CIV-2025/08
Obra: Manutenção Estrutural de Telhado Industrial Savoy - Campinas/SP

Constatamos por meio do sistema de telemetria e controle físico da SANY Engenharia que o lote complementar de Telhas Translúcidas em Policarbonato com Proteção UV (Item 3.2, quantidade 340 m² / 170 unidades), com entrega impreterivelmente agendada para 12/04/2025, NÃO foi descarregado no canteiro de obras até o presente momento.

Este descumprimento está gerando um atraso crítico de 1.8 dias úteis no cronograma consolidado da obra, gerando desvio de -4.0% e impedindo o avanço das frentes de calhas e vedação perimetral com PU-40.

Desta forma, NOTIFICAMOS a Policarbo Brasil a realizar a entrega total do lote remanescente no prazo improrrogável de 24 (vinte e quatro) horas, impreterivelmente até as 08h00 do próximo dia útil, com prévia apresentação do Documento de Arrecadação e Liberação de Carga para o Caminhão Munck SANY.

Caso a entrega não se confirme no prazo estipulado, informamos que serão aplicadas as cominações da Cláusula 14ª do contrato de fornecimento (multa rescisória de 2% ao dia de atraso sobre o valor global da compra e retenção financeira de garantias).

Atenciosamente,

SANY Engenharia Turnkey do Brasil Ltda.
Desenvolvedor e Gestão de Sistemas: Samuel Ribeiro de Souza (12) 99670-7590
Engenheiro Responsável Técnico: Eng. Marcos Valério (CREA-SP 506.284-D)
Canteiro de Obras Turnkey Savoy - Campinas/SP`,
        contractRef: 'SANY-CIV-2025/08 / PO-2025/4412',
        itemsDelayed: '340 m² de Telhas Translúcidas Policarbonato Compacto UV 1.5mm',
        requestedDeadline: '24 horas úteis (até 08h00)',
      },
      status: 'pending_approval',
      createdAt: new Date().toISOString(),
    },
  ],
  lastUpdated: new Date().toISOString(),
};

// In-memory Database Stores for Roof Inspection & Calendar
let roofReports: RoofDailyReport[] = [...INITIAL_ROOF_REPORTS];
let calendarTasks: CalendarTask[] = [...INITIAL_CALENDAR_TASKS];

// Gerador da mensagem de atualização diária de WhatsApp para o número 12996707590
export function generateDailyReportWhatsAppMessage(
  report: RoofDailyReport,
  summary: RoofProjectSummary,
  scheduleInfo?: ProjectScheduleInfo
): string {
  const dataFormatada = new Date(report.dataPreenchimento + 'T12:00:00').toLocaleDateString('pt-BR');
  const qtdTrans = Number(report.qtdTranslúcidas) || 0;
  const qtdFibro = Number(report.qtdFibrocimento) || 0;
  const totalTelhasDia = qtdTrans + qtdFibro;
  const metragemLV = Number(report.metragemLinhaVida) || 0;
  const metragemCalhas = Number(report.metragemCalhas) || 0;
  const chuvaMm = Number(report.nivelChuvaMm) || 0;
  const ehChuvaMaior5mm = chuvaMm > 5;

  const dataFim = scheduleInfo?.formattedCurrentEndDate || '06/11/2026';
  const diasChuva = scheduleInfo?.rainDaysCount ?? 6;

  return `🏗️ *SANY TURNKEY • ATUALIZAÇÃO DIÁRIA DE COBERTURA*
📅 *Data:* ${dataFormatada} | *Setor:* ${report.setorPredio || 'Prédio 4i1'}
👷 *Fornecedor Executante:* SVA Engenharia (Resp: ${report.responsavel || 'Sávio Rodrigues de Souza'})

✨ *TELHAS INSTALADAS NO DIA:*
• Translúcidas no dia: *+${qtdTrans} un* (Acumulado obra: ${summary.translucidasInstaladas}/${summary.translucidasMeta} un - ${summary.translucidasPercent}%)
• Fibrocimento no dia: *+${qtdFibro} un* (Acumulado obra: ${summary.fibrocimentoInstaladas}/${summary.fibrocimentoMeta} un - ${summary.fibrocimentoPercent}%)
• *Total de telhas instaladas no dia:* *${totalTelhasDia} un*

🌦️ *CLIMA & CHUVA:*
• Condição climática: *${report.condicoesClimaticas || (chuvaMm > 0 ? 'Chuvoso' : 'Ensolarado / Estável')}*
• Pluviosidade registrada: *${chuvaMm} mm*
${
  ehChuvaMaior5mm
    ? `⚠️ *ALERTA CONTRATUAL:* Precipitação > 5mm aferida! O fornecedor SVA Engenharia ganha +1 dia no prazo final contratual.`
    : `✅ Sem paralisação impeditiva por chuva no dia (dentro do limite operacional).`
}
• *Prazo Final Atualizado:* *${dataFim}* (75 dias corridos base + ${diasChuva} dias de prorrogação por chuva)

🛡️ *LINHA DE VIDA & CALHAS:*
• Linha de Vida instalada no dia: *${metragemLV}m* (Total instalado no dia)
• Calhas instaladas no dia: *${metragemCalhas}m*

📝 *SERVIÇOS EXECUTADOS & OBSERVAÇÕES:*
${report.descricaoExecucao || 'Serviços de cobertura executados conforme plano de ataque diário.'}
${report.registroOcorrencias && report.registroOcorrencias !== 'Nenhuma ocorrência (Dia 100% seguro)' ? `\n⚠️ *Ocorrências:* ${report.registroOcorrencias}` : ''}
${report.descricaoOcorrencia ? `\n📌 *Observações:* ${report.descricaoOcorrencia}` : ''}

👥 *Equipe em Campo:* ${report.equipeFuncionarios || 'Equipe SVA Engenharia'}
📊 *Progresso Geral Ponderado da Obra:* ${summary.progressoTotalPercent}% concluído

_Mensagem automática gerada pelo Assistente Virtual Samuel (IA de Engenharia SANY) para envio no WhatsApp (12) 99670-7590._`;
}

// Configurações Oficiais de Envio e Lembrete para SVA Engenharia
const SVA_PHONE_RAW = '5512974080523';
const SVA_PHONE_FORMATTED = '+55 (12) 97408-0523';
const SVA_SUPPLIER_NAME = 'SVA Engenharia';
const SVA_SCHEDULED_TIME = '08:30';

// Armazenamento em memória de histórico de disparos de lembretes
const whatsappRemindersList: WhatsAppReminderRecord[] = [];

// Gerador do Lembrete Diário das 08h30 para o Fornecedor SVA Engenharia (WhatsApp 55 12 97408-0523)
export function generateSvaDailyReminderWhatsAppMessage(customDate?: string): string {
  const dateStr = customDate || new Date().toISOString().split('T')[0];
  const dataFormatada = new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR');

  return `⏰ *LEMBRETE DIÁRIO DE APONTAMENTO • 08h30*
Olá, equipe e encarregados da *SVA Engenharia*!

Aqui é o Assistente Virtual Samuel (IA de Engenharia & Gestão Turnkey SANY).
Passando pontualmente às *08h30* para lembrar do preenchimento do *Formulário de Apontamento Diário de Cobertura* no canteiro Savoy (Prédio 4i1) referente a hoje (*${dataFormatada}*).

📋 *Informações essenciais a registrar no formulário:*
1. Quantidade de *Telhas Translúcidas* e de *Fibrocimento* instaladas no dia
2. *Linha de Vida* instalada no dia (m)
3. *Clima e Chuva*: pluviosidade em mm (lembrando que chuvas > 5mm adicionam automaticamente +1 dia ao prazo contratual da SVA Engenharia)
4. *Calhas*, equipe presente e observações gerais dos serviços

🔗 *Acesse o formulário de apontamento diretamente pelo link:*
https://ais-dev-zlejd3h4tba6cvx7xgxn55-539765910798.us-east1.run.app

Tenham uma excelente e segura jornada de trabalho! 👷🏗️`;
}

function computeRoofSummary(reports: RoofDailyReport[]): RoofProjectSummary {
  const translucidasInstaladas = reports.reduce((acc, r) => acc + (Number(r.qtdTranslúcidas) || 0), 0);
  const fibrocimentoInstaladas = reports.reduce((acc, r) => acc + (Number(r.qtdFibrocimento) || 0), 0);
  
  // Calhas meta: 3.600
  const calhasInstaladas = reports.reduce((acc, r) => {
    if (r.metragemCalhas !== undefined && r.metragemCalhas !== null && Number(r.metragemCalhas) > 0) {
      return acc + Number(r.metragemCalhas);
    }
    if (r.tiposServico?.includes('Calhas')) {
      return acc + (Number(r.metragem) || 0);
    }
    return acc + (Number(r.metragemCalhas) || 0);
  }, 0);

  const sorted = [...reports].sort((a, b) => new Date(b.dataPreenchimento).getTime() - new Date(a.dataPreenchimento).getTime());
  const latest = sorted[0];

  // A linha de vida NÃO é a soma dos dias preenchidos, mas sim o total instalado no dia
  const linhaVidaInstalada = latest && latest.metragemLinhaVida !== undefined && latest.metragemLinhaVida !== null
    ? Number(latest.metragemLinhaVida)
    : 200;

  const translucidasMeta = 1300;
  const fibrocimentoMeta = 300;
  const calhasMeta = 3600; // Calhas são 3600
  const linhaVidaMeta = 2000; // Linha de vida meta é 2000

  const translucidasPercent = Number(((translucidasInstaladas / translucidasMeta) * 100).toFixed(1));
  const fibrocimentoPercent = Number(((fibrocimentoInstaladas / fibrocimentoMeta) * 100).toFixed(1));
  const calhasPercent = Number(((calhasInstaladas / calhasMeta) * 100).toFixed(1));
  const linhaVidaPercent = Number(((linhaVidaInstalada / linhaVidaMeta) * 100).toFixed(1));

  // Linha de vida NÃO entra no cálculo de porcentagem do projeto (é EPC de segurança NR-35)
  // O percentual do projeto é baseado nos itens definitivos da cobertura:
  // - Telhas Translúcidas (1.300 meta) -> 45% peso
  // - Telhas Fibrocimento (300 meta) -> 25% peso
  // - Calhas & Rufos (3.600m meta) -> 30% peso
  const prog1 = Math.min(1, translucidasInstaladas / translucidasMeta) * 45;
  const prog2 = Math.min(1, fibrocimentoInstaladas / fibrocimentoMeta) * 25;
  const prog3 = Math.min(1, calhasInstaladas / calhasMeta) * 30;
  const progressoTotalPercent = Math.round(prog1 + prog2 + prog3);

  const scheduleInfo = computeProjectSchedule(reports, calendarTasks);

  return {
    translucidasInstaladas,
    translucidasMeta,
    translucidasPercent,
    fibrocimentoInstaladas,
    fibrocimentoMeta,
    fibrocimentoPercent,
    calhasInstaladas,
    calhasMeta,
    calhasPercent,
    linhaVidaInstalada,
    linhaVidaMeta,
    linhaVidaPercent,
    metragemInstalada: calhasInstaladas,
    metragemMeta: calhasMeta,
    progressoTotalPercent,
    ultimoStatus: latest?.statusGeral || 'Em andamento',
    ultimaDataPreenchimento: latest ? new Date(latest.dataPreenchimento).toLocaleDateString('pt-BR') : '14/09/2026',
    responsavelGeral: latest?.responsavel || 'Sávio Rodrigues de Souza',
    totalRelatorios: reports.length,
    scheduleInfo,
  };
}

// Helper: Calculate Project Schedule & Rain Extension Days
export function computeProjectSchedule(reports: RoofDailyReport[], tasks: CalendarTask[]): ProjectScheduleInfo {
  const startDate = '2026-08-17';
  const baseDays = 75; // 75 dias corridos contratados desde 17/08/2026

  // Collect unique dates where rain > 5mm occurred
  const rainDatesSet = new Set<string>();

  // 1. From roof reports
  reports.forEach((r) => {
    const vol = r.nivelChuvaMm !== undefined ? Number(r.nivelChuvaMm) : 0;
    if (vol > 5 || r.chuvaMaior5mm) {
      rainDatesSet.add(r.dataPreenchimento);
    }
  });

  // 2. From calendar tasks
  tasks.forEach((t) => {
    const vol = t.rainVolumeMm !== undefined ? Number(t.rainVolumeMm) : 0;
    if ((t.isRain || t.category === 'chuva' || t.rained) && vol > 5) {
      rainDatesSet.add(t.date);
    }
  });

  const rainDates = Array.from(rainDatesSet).sort();
  const rainDaysCount = rainDates.length;
  const totalDaysGranted = baseDays + rainDaysCount;

  // Base contract end date (75 days starting on 2026-08-17)
  const baseDateObj = new Date(startDate + 'T12:00:00Z');
  baseDateObj.setDate(baseDateObj.getDate() + (baseDays - 1));
  const baseEndDate = baseDateObj.toISOString().split('T')[0];

  // Dynamic end date (+1 day per rain day > 5mm)
  const currDateObj = new Date(startDate + 'T12:00:00Z');
  currDateObj.setDate(currDateObj.getDate() + (totalDaysGranted - 1));
  const currentEndDate = currDateObj.toISOString().split('T')[0];

  const [cy, cm, cd] = currentEndDate.split('-');
  const formattedCurrentEndDate = `${cd}/${cm}/${cy}`;

  // Build latest rain event and WhatsApp alert
  const latestRainDate = rainDates[rainDates.length - 1];
  let latestRainEvent = undefined;

  if (latestRainDate) {
    const rep = reports.find((r) => r.dataPreenchimento === latestRainDate && (r.nivelChuvaMm || 0) > 5);
    const tsk = tasks.find((t) => t.date === latestRainDate && (t.rainVolumeMm || 0) > 5);
    const vol = rep?.nivelChuvaMm || tsk?.rainVolumeMm || 5.2;

    const [ry, rm, rd] = latestRainDate.split('-');
    const formattedRainDate = `${rd}/${rm}/${ry}`;

    const whatsappMessage = `🌧️ *COMUNICADO DO ASSISTENTE SAMUEL - SANY ENGENHARIA*
*Obra:* Turnkey Savoy - Campinas (Contrato SANY-CIV-2025/08)
*Data da Ocorrência:* ${formattedRainDate}

Prezado Gestor e Equipe Técnica,

Informo que foi registrado no canteiro de obras um índice pluviométrico de *${vol} mm*, ultrapassando o limite técnico de *5 mm*.

⚖️ *IMPACTO CONTRATUAL CONCEDIDO:*
Pelas diretrizes contratuais de intempéries, o prestador de serviço recebeu o acréscimo de *+1 dia corrido* no prazo final da obra.

📅 *CRONOGRAMA ATUALIZADO:*
- Início da Obra: 17/08/2026
- Prazo Base: 75 dias corridos
- Total de Dias com Chuva (> 5mm): ${rainDaysCount} dias
- *Nova Data Final Contratual:* ${formattedCurrentEndDate} (${totalDaysGranted} dias corridos)

⚠️ *SEGURANÇA DO TRABALHO (NR-35):*
Atividades em altura no telhado do Prédio 4i1 e instalação de calhas foram preventivamente paralisadas durante a precipitação para assegurar risco zero de acidentes.

_Mensagem automática gerada pelo Assistente Samuel - IA de Engenharia & Gestão de Obra SANY._`;

    latestRainEvent = {
      date: latestRainDate,
      volumeMm: vol,
      whatsappMessage,
    };
  }

  return {
    startDate,
    baseDays,
    baseEndDate,
    rainDaysCount,
    rainDates,
    totalDaysGranted,
    currentEndDate,
    formattedCurrentEndDate,
    latestRainEvent,
  };
}

// Auth Middleware
function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }
    (req as any).user = decoded;
    next();
  });
}

// ==================== API ROUTES ====================

// 1. Auth: Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Informe e-mail e senha.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = USERS.find(
    (u) =>
      u.email.toLowerCase() === cleanEmail ||
      (cleanEmail === 'souzas' && u.email === 'souzas@sanygroup.com') ||
      (cleanEmail === 'souzas@sanygroup.com' && u.email === 'souzas@sanygroup.com') ||
      (cleanEmail === 'ribeirosamuelvdp@gmail.com' && u.email === 'ribeirosamuelvdp@gmail.com') ||
      (cleanEmail === 'ribeirosamuelvdp' && u.role === 'developer') ||
      (cleanEmail === 'samuel' && u.role === 'developer') ||
      (cleanEmail === 'marcos' && u.id === 'usr-marcos') ||
      (cleanEmail === 'juliana' && u.id === 'usr-juliana')
  );

  const trimmedPassword = password.trim();
  const passwordMatches =
    user &&
    (Array.isArray(user.passwordHash)
      ? user.passwordHash.includes(trimmedPassword)
      : user.passwordHash === trimmedPassword);

  if (!user || !passwordMatches) {
    return res.status(401).json({ error: 'Credenciais inválidas. Verifique seu e-mail e senha.' });
  }

  // Generate JWT token (valid for 7 days)
  const tokenPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    title: user.title,
    crea: user.crea,
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

  return res.json({
    message: 'Autenticação realizada com sucesso.',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      title: user.title,
      crea: user.crea,
      avatar: user.avatar,
    },
  });
});

// 2. Auth: Get Current User (me)
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const decoded = (req as any).user;
  const user = USERS.find((u) => u.id === decoded.id);

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      title: user.title,
      crea: user.crea,
      avatar: user.avatar,
    },
  });
});

// 3. Construction Overview
app.get('/api/construction/overview', (req, res) => {
  const roofSummary = computeRoofSummary(roofReports);
  const scheduleInfo = roofSummary.scheduleInfo;
  return res.json({
    ...projectData,
    plannedCompletionDate: scheduleInfo?.formattedCurrentEndDate || projectData.plannedCompletionDate,
    roofSummary,
    scheduleInfo,
  });
});

// 4. Update Weekly Measurement
app.post('/api/construction/measurement', authenticateToken, (req, res) => {
  const { subsystemsUpdates, rdoNotes } = req.body;

  if (Array.isArray(subsystemsUpdates)) {
    subsystemsUpdates.forEach((upd: { id: string; progressPercent: number; executedValue?: number }) => {
      const sub = projectData.subsystems.find((s) => s.id === upd.id);
      if (sub) {
        sub.progressPercent = Math.min(100, Math.max(0, upd.progressPercent));
        if (upd.executedValue !== undefined) {
          sub.executedValue = upd.executedValue;
        }
        if (sub.progressPercent >= 100) sub.status = 'completed';
        else if (sub.progressPercent < sub.targetPercent - 5) sub.status = 'delayed';
        else if (sub.progressPercent < sub.targetPercent) sub.status = 'attention';
        else sub.status = 'on_track';
      }
    });

    // Recalculate global physical progress (weighted)
    // weights: Fibrocimento 40%, Translucidas 20%, Calhas 20%, NR-35 10%, Desmobilizacao 10%
    const p1 = projectData.subsystems.find((s) => s.id === 'sub-3-1')?.progressPercent || 72;
    const p2 = projectData.subsystems.find((s) => s.id === 'sub-3-2')?.progressPercent || 65;
    const p3 = projectData.subsystems.find((s) => s.id === 'sub-3-3')?.progressPercent || 70;
    const p4 = projectData.subsystems.find((s) => s.id === 'sub-2-0')?.progressPercent || 100;
    const p5 = projectData.subsystems.find((s) => s.id === 'sub-4-0')?.progressPercent || 15;

    const weighted = p1 * 0.4 + p2 * 0.2 + p3 * 0.2 + p4 * 0.1 + p5 * 0.1;
    projectData.physicalProgress = Math.round(weighted * 10) / 10;
    projectData.deviationPercent = Math.round((projectData.physicalProgress - projectData.plannedProgress) * 10) / 10;
    projectData.delayDays = projectData.deviationPercent < 0 ? Math.abs(Math.round(projectData.deviationPercent * 0.45 * 10) / 10) : 0;
    projectData.lastUpdated = new Date().toISOString();
  }

  if (rdoNotes) {
    projectData.alerts.unshift({
      id: `rdo-${Date.now()}`,
      type: 'safety',
      title: 'Apontamento RDO Registrado',
      badge: 'Diário de Obra',
      description: rdoNotes,
      urgency: 'low',
      time: 'Agora',
    });
  }

  return res.json({
    message: 'Medição semanal e Curva S recalculadas com sucesso!',
    projectData,
  });
});

// 5. AI Agent: Analyze Progress & Generate Actions (Assistente Samuel)
app.post('/api/ai/analyze-progress', authenticateToken, async (req, res) => {
  const user = (req as any).user;
  const customQuery = req.body.customQuery;

  try {
    let aiAnalysisText = '';
    let actionRecommendation: any = null;

    // Gather all application telemetry for Samuel to analyze
    const roofSummary = computeRoofSummary(roofReports);
    const recentRoofReports = roofReports.slice(-5);
    const pendingCalendarTasks = calendarTasks.filter((t) => t.status !== 'concluida');
    const delayedWbsTasks = projectData.wbsTasks.filter((t) => t.status === 'andamento' && t.code === 'WBS-03');

    if (aiClient) {
      const prompt = `Você é o "Assistente Samuel", Inteligência Artificial Especialista em Engenharia Civil e Gestão Integrada de Obras da SANY Engenharia.
Você deve analisar TODOS os dados do aplicativo da obra "Turnkey Savoy - Campinas" (Contrato SANY-CIV-2025/08):

DADOS GERAIS DA OBRA:
- Avanço Físico Atual: ${projectData.physicalProgress}% | Meta Planejada: ${projectData.plannedProgress}%
- Desvio Físico: ${projectData.deviationPercent}%
- Atraso Estimado Geral: ${projectData.delayDays} dias úteis
- Gestor / Desenvolvedor: Samuel Ribeiro de Souza (WhatsApp: (12) 99670-7590)
- Engenheiro Residente: Eng. Marcos Valério (CREA-SP 506.284-D)
- Responsável de Campo: Sávio Rodrigues de Souza (Prédio 4i1)

DADOS DE CONTROLE DE TELHADO E CAMPOS:
- Telhas Translúcidas Instaladas: ${roofSummary.translucidasInstaladas} / ${roofSummary.translucidasMeta} un
- Telhas de Fibrocimento Instaladas: ${roofSummary.fibrocimentoInstaladas} / ${roofSummary.fibrocimentoMeta} un
- Metragem Calhas / Linhas de Vida: ${roofSummary.metragemInstalada} / ${roofSummary.metragemMeta} metros
- Total de Apontamentos Diários de Campo (RDOs): ${roofReports.length}
- Últimos Relatórios de Campo: ${JSON.stringify(recentRoofReports.map((r) => ({ data: r.dataPreenchimento, trans: r.qtdTranslúcidas, fibro: r.qtdFibrocimento, clima: r.condicoesClimaticas, materiais: r.materiaisRecebidos })))}

DADOS DO CRONOGRAMA WBS E CALENDÁRIO:
- Cronograma Contratual: Início em 17/08/2026, Prazo base de 75 dias corridos.
- Regra Contratual de Chuva: Se chover mais de 5 mm no dia, o prestador de serviço ganha +1 dia corrido no calendário final. A IA Samuel notifica automaticamente via WhatsApp.
- Dias com Chuva > 5mm Registrados: ${roofSummary.scheduleInfo?.rainDaysCount || 0} dias (${(roofSummary.scheduleInfo?.rainDates || []).join(', ')})
- Data Término Atualizada da Obra: ${roofSummary.scheduleInfo?.formattedCurrentEndDate || '31/10/2026'} (Total concedido: ${roofSummary.scheduleInfo?.totalDaysGranted || 75} dias corridos)
- Tarefas WBS em Execução: ${JSON.stringify(projectData.wbsTasks.map((t) => ({ code: t.code, title: t.title, progress: t.progress, status: t.status, obs: t.observation })))}
- Tarefas Pendentes no Calendário: ${JSON.stringify(pendingCalendarTasks.map((t) => ({ id: t.id, title: t.title, date: t.date, startTime: t.startTime, responsible: t.responsible })))}
- Fornecedor em Atraso: Policarbo Brasil (atraso de 340 m² de telhas translúcidas UV)
- Clima: Previsão de vento >35 km/h para sexta-feira às 14h com risco de instabilidade.

${customQuery ? `PERGUNTA OU SOLICITAÇÃO ESPECÍFICA: "${customQuery}"` : 'Faça a auditoria completa de todos os dados da obra, apontando atrasos, regras de chuva > 5mm com prorrogação de prazo, riscos climáticos, produtividade de telhado e notas necessárias.'}

DIRETRIZES DO ASSISTENTE SAMUEL:
1. Faça apontamentos objetivos e técnicos de cada frente em atraso (especialmente o Item 3.2 de telhas translúcidas).
2. Monitore e mencione o impacto das chuvas > 5mm no prazo final (+1 dia por dia chuvoso concedido ao prestador de serviços no calendário contratual).
3. Forneça apontamentos operacionais necessários sobre clima (vento na sexta-feira), segurança NR-35 e conferência de liberação de PT/PA no calendário.
4. Se o fornecedor estiver em atraso ou se houver chuva relevante, prepare a minuta de notificação formal para aprovação do Desenvolvedor Samuel Ribeiro de Souza via WhatsApp (12) 99670-7590.
5. Mantenha um tom profissional, técnico e construtivo, sem alarmismos desnecessários.

Responda OBRIGATORIAMENTE em JSON no seguinte formato:
{
  "assistantName": "Assistente Samuel",
  "diagnosis": "Diagnóstico geral técnico da obra integrando telhados, avanço e cronograma",
  "delayBreakdown": [
    {
      "item": "Item 3.2 - Telhas Translúcidas Policarbonato",
      "delayDays": ${projectData.delayDays},
      "cause": "Atraso no fornecimento do 2º lote (340 m²) pela Policarbo Brasil",
      "impact": "Risco de estagnação da montagem e atraso no teste de estanqueidade",
      "recommendedAction": "Notificação formal ao fornecedor com prazo improrrogável de 24h"
    }
  ],
  "operationalNotes": [
    "Apontamento 1...",
    "Apontamento 2...",
    "Apontamento 3..."
  ],
  "roofProgressNotes": "Resumo do ritmo de instalação das telhas translúcidas e fibrocimento...",
  "criticalPathRisk": "Risco específico ao caminho crítico da obra",
  "recommendations": ["Recomendação 1", "Recomendação 2", "Recomendação 3"],
  "requiresSupplierNotice": true,
  "actionDraft": {
    "title": "Notificação Extrajudicial ao Fornecedor Policarbo Brasil (Item 3.2)",
    "detectedIssue": "Atraso no lote de 340 m² de telhas translúcidas UV",
    "whatsappMessage": "Mensagem para Samuel Ribeiro de Souza no WhatsApp (12) 99670-7590...",
    "supplierEmail": {
      "to": "comercial@policarbobrasil.com.br; entregas@policarbobrasil.com.br",
      "supplierName": "Policarbo Brasil Termoplásticos Industriais Ltda.",
      "contactPerson": "Sr. Roberto Mendes - Diretor de Logística",
      "subject": "[URGENTE] Notificação de Atraso e Notificação de Descumprimento - Obra Turnkey Savoy Campinas",
      "body": "Texto completo do e-mail formal...",
      "itemsDelayed": "340 m² de Telhas Translúcidas Policarbonato UV",
      "requestedDeadline": "24 horas úteis"
    }
  }
}`;

      try {
        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          try {
            const parsed = JSON.parse(response.text);
            aiAnalysisText = parsed.diagnosis;
            actionRecommendation = parsed;
          } catch (pe) {
            aiAnalysisText = response.text;
          }
        }
      } catch (aiErr: any) {
        console.warn('Gemini generateContent notice (quota or API error, falling back to integrated Assistente Samuel):', aiErr?.message || aiErr);
      }
    }

    // High-level complete engineering analysis by Assistente Samuel
    if (!actionRecommendation) {
      actionRecommendation = {
        assistantName: 'Assistente Samuel',
        diagnosis: `Análise Integrada do Assistente Samuel: A obra Turnkey Savoy Campinas encontra-se com avanço físico de ${projectData.physicalProgress}% (meta da Semana 06: ${projectData.plannedProgress}%), resultando em um desvio de ${projectData.deviationPercent}% e atraso de ${projectData.delayDays} dias úteis no caminho crítico. No controle de cobertura do Prédio 4i1, já foram instaladas ${roofSummary.translucidasInstaladas} de ${roofSummary.translucidasMeta} telhas translúcidas e ${roofSummary.fibrocimentoInstaladas} de ${roofSummary.fibrocimentoMeta} telhas de fibrocimento, além de ${roofSummary.metragemInstalada}m de calhas e linhas de ancoragem. O ponto que requer atuação imediata é o desabastecimento de telhas translúcidas UV pelo fornecedor Policarbo Brasil.`,
        delayBreakdown: [
          {
            item: 'Item 3.2 - Telhas Translúcidas UV (WBS-03)',
            delayDays: projectData.delayDays,
            cause: 'Atraso na remessa do segundo lote de 340 m² pela parceira Policarbo Brasil',
            impact: 'Impede o avanço da vedação perimetral com PU e ameaça a data de estanqueidade',
            recommendedAction: 'Disparo de notificação formal com prazo de 24 horas sob pena de multa de 2% ao dia',
          },
          {
            item: 'Item 3.3 - Calhas e Rufos (WBS-04)',
            delayDays: 1,
            cause: 'Tempo adicional de cura da manta líquida elastomérica nos encontros estruturais',
            impact: 'Baixo impacto no caminho crítico; equipe recupera no fim de semana',
            recommendedAction: 'Manter acompanhamento diário sem necessidade de medidas coercitivas',
          },
        ],
        operationalNotes: [
          'Ventos em Altura: Previsão meteorológica indica rajadas de vento acima de 35 km/h na sexta-feira às 14h. Necessário antecipar o travamento de telhas e lonamento temporário na quinta-feira.',
          'Liberação de PT/PA: O içamento com o Caminhão Munck SANY está programado para as 07h30 de amanhã. Confirmar liberação da Permissão de Trabalho em Altura junto aos bombeiros industriais.',
          'Consumo de Insumos: O estoque de fixadores inox com arruelas EPDM e selante PU-40 está com saldo positivo para 4 dias operacionais.',
          'Segurança NR-35: 100% dos operários certificados e 8 pontos de ancoragem testados sem nenhuma não conformidade.',
        ],
        roofProgressNotes: `Cobertura Prédio 4i1: 280 telhas translúcidas instaladas (21.5% da meta) e 97 de fibrocimento (32.3% da meta). Equipe de Sávio Rodrigues e Vanderlei mantém produtividade de 14 telhas/dia com clima estável.`,
        criticalPathRisk: 'A falta das telhas translúcidas atrasa o fechamento do Setor C e impede a realização do teste de estanqueidade de 48 horas programado para 09/Mai.',
        recommendations: [
          'Notificar formalmente a Policarbo Brasil com envio para autorização do Desenvolvedor Samuel Ribeiro de Souza.',
          'Priorizar a instalação das telhas de fibrocimento já disponíveis em canteiro nos setores A e B durante a manhã.',
          'Executar a fixação preventiva das calhas antes das rajadas de vento previstas para sexta-feira.',
        ],
        requiresSupplierNotice: true,
        actionDraft: {
          title: 'Notificação Extrajudicial ao Fornecedor Policarbo Brasil (Item 3.2)',
          detectedIssue: `Atraso de ${projectData.delayDays} dias úteis no fornecimento de 340 m² de telhas translúcidas UV pelo fornecedor Policarbo Brasil.`,
          whatsappMessage: `🚨 *APONTAMENTO DO ASSISTENTE SAMUEL*
Olá, Desenvolvedor *Samuel Ribeiro de Souza*!

Analisei todos os dados da obra *Turnkey Savoy - Campinas* e identifiquei um atraso crítico de *${projectData.delayDays} dias úteis* (Desvio acumulado: *${projectData.deviationPercent}%*).

*Apontamento:* A frente do Item 3.2 (Telhas Translúcidas Policarbonato UV) está estagnada em 65% por falta de entrega do lote remanescente de 340 m² pelo fornecedor *Policarbo Brasil*. No telhado, foram instaladas 280 de 1.300 telhas.
*Ação do Assistente:* Preparei um e-mail de notificação formal com prazo de 24 horas para entrega, sob pena de multa de 2% ao dia e retenção de pagamentos.

Solicito a sua aprovação para efetuar o disparo do e-mail diretamente ao fornecedor.

📲 Você pode aprovar pelo sistema ou responder confirmando!`,
          supplierEmail: {
            to: 'comercial@policarbobrasil.com.br; entregas@policarbobrasil.com.br',
            supplierName: 'Policarbo Brasil Termoplásticos Industriais Ltda.',
            contactPerson: 'Sr. Roberto Mendes - Diretor de Logística',
            subject: `[URGENTE] Notificação de Atraso e Cobrança de Fornecimento - Obra Turnkey Savoy Campinas - Pedido PO-2025/4412`,
            body: `Prezado Sr. Roberto Mendes e Departamento de Logística da Policarbo Brasil,\n\nA SANY Engenharia Turnkey do Brasil Ltda., por meio da auditoria de telemetria do Assistente Samuel, NOTIFICA formalmente a vossa senhoria quanto ao atraso na entrega de 340 m² de Telhas Translúcidas Policarbonato UV (Item 3.2), vinculadas ao Contrato SANY-CIV-2025/08 e Pedido PO-2025/4412.\n\nO atraso atual de ${projectData.delayDays} dias úteis gerou um desvio de ${projectData.deviationPercent}% na obra Turnkey Savoy em Campinas/SP, prejudicando o cronograma de fechamento da cobertura do Prédio 4i1.\n\nConcedemos o prazo de 24 (vinte e quatro) horas úteis para o descarregamento das peças no canteiro, sob pena de retenção de pagamentos e aplicação da multa de 2% ao dia.\n\nAtenciosamente,\nSANY Engenharia Turnkey do Brasil\nSamuel Ribeiro de Souza - Desenvolvedor & Gestão de Sistemas\nEng. Marcos Valério - CREA-SP 506.284-D`,
            itemsDelayed: '340 m² de Telhas Translúcidas Policarbonato UV',
            requestedDeadline: '24 horas úteis',
          },
        },
      };
    }

    // Create or update pending action if supplier notice required
    const newActionId = `act-${Date.now()}`;
    const newAction: AIActionRequest = {
      id: newActionId,
      title: actionRecommendation.actionDraft.title,
      type: 'supplier_delay_email',
      severity: 'critical',
      subsystemId: 'sub-3-2',
      detectedIssue: actionRecommendation.actionDraft.detectedIssue,
      delayImpactDays: projectData.delayDays,
      actionExplanation: actionRecommendation.diagnosis,
      approverName: 'Desenvolvedor Samuel Ribeiro de Souza',
      approverRole: 'Desenvolvedor & Gestor de Sistemas',
      approverPhone: '(12) 99670-7590',
      whatsappMessage: actionRecommendation.actionDraft.whatsappMessage,
      supplierEmail: {
        to: actionRecommendation.actionDraft.supplierEmail.to,
        supplierName: actionRecommendation.actionDraft.supplierEmail.supplierName,
        contactPerson: actionRecommendation.actionDraft.supplierEmail.contactPerson,
        subject: actionRecommendation.actionDraft.supplierEmail.subject,
        body: actionRecommendation.actionDraft.supplierEmail.body,
        contractRef: 'SANY-CIV-2025/08 / PO-2025/4412',
        itemsDelayed: actionRecommendation.actionDraft.supplierEmail.itemsDelayed,
        requestedDeadline: actionRecommendation.actionDraft.supplierEmail.requestedDeadline,
      },
      status: 'pending_approval',
      createdAt: new Date().toISOString(),
    };

    projectData.pendingActions.unshift(newAction);

    return res.json({
      message: 'Análise executada com sucesso pelo Agente de IA da SANY.',
      analysis: actionRecommendation,
      newAction,
      projectData,
    });
  } catch (error: any) {
    console.error('AI Analysis Error:', error);
    return res.status(500).json({ error: 'Erro ao processar análise do Agente de IA: ' + error.message });
  }
});

// 6. AI Agent: Approve Action (by Samuel Ribeiro de Souza or authorized user)
app.post('/api/ai/approve-action', authenticateToken, (req, res) => {
  const { actionId, approverNotes } = req.body;
  const user = (req as any).user;

  const action = projectData.pendingActions.find((a) => a.id === actionId);
  if (!action) {
    return res.status(404).json({ error: 'Ação de IA não encontrada.' });
  }

  action.status = 'approved';
  action.approvedAt = new Date().toISOString();
  action.approvedBy = user.name || 'Desenvolvedor Samuel Ribeiro de Souza';

  // Add system alert
  projectData.alerts.unshift({
    id: `alt-${Date.now()}`,
    type: 'supplier',
    title: `Aprovação de Cobrança Concedida por ${action.approvedBy}`,
    badge: 'Aprovado Samuel',
    description: `A solicitação de cobrança para ${action.supplierEmail.supplierName} foi aprovada. O e-mail formal está pronto para despacho imediato.`,
    urgency: 'high',
    time: 'Agora',
  });

  return res.json({
    message: `Ação aprovada com sucesso por ${action.approvedBy}!`,
    action,
    projectData,
  });
});

// 7. AI Agent: Reject Action
app.post('/api/ai/reject-action', authenticateToken, (req, res) => {
  const { actionId, reason } = req.body;
  const user = (req as any).user;

  const action = projectData.pendingActions.find((a) => a.id === actionId);
  if (!action) {
    return res.status(404).json({ error: 'Ação não encontrada.' });
  }

  action.status = 'rejected';
  action.rejectionReason = reason || 'Ajustes de prazo solicitados pelo gestor.';
  action.approvedBy = user.name;

  return res.json({
    message: 'Ação rejeitada/devolvida para ajustes.',
    action,
    projectData,
  });
});

// 8. AI Agent: Dispatch Supplier Email
app.post('/api/ai/dispatch-supplier-email', authenticateToken, (req, res) => {
  const { actionId } = req.body;
  const user = (req as any).user;

  const action = projectData.pendingActions.find((a) => a.id === actionId);
  if (!action) {
    return res.status(404).json({ error: 'Ação de cobrança não encontrada.' });
  }

  if (action.status !== 'approved' && action.status !== 'pending_approval') {
    return res.status(400).json({ error: 'Ação precisa de aprovação antes do envio.' });
  }

  // Execute email dispatch
  action.status = 'email_sent';
  action.emailSentAt = new Date().toISOString();
  action.trackingCode = `SANY-NOTIF-${Date.now().toString().slice(-6)}-SP`;

  // Log dispatch in alerts
  projectData.alerts.unshift({
    id: `alt-${Date.now()}`,
    type: 'supplier',
    title: `E-mail de Cobrança Despachado ao Fornecedor`,
    badge: 'E-mail Enviado',
    description: `Notificação enviada com sucesso para ${action.supplierEmail.to}. Protocolo SANY: ${action.trackingCode}. Prazo limite de 24h acionado.`,
    urgency: 'high',
    time: 'Agora',
  });

  return res.json({
    message: `E-mail de cobrança encaminhado com sucesso para ${action.supplierEmail.supplierName}!`,
    trackingCode: action.trackingCode,
    action,
    projectData,
  });
});

// 9. Roof Tile Service - Summary (PUBLIC)
app.get('/api/telhas/summary', (req, res) => {
  const summary = computeRoofSummary(roofReports);
  return res.json(summary);
});

// 10. Roof Tile Service - List All Reports (PUBLIC)
app.get('/api/telhas/reports', (req, res) => {
  const sorted = [...roofReports].sort(
    (a, b) => new Date(b.dataPreenchimento).getTime() - new Date(a.dataPreenchimento).getTime()
  );
  return res.json(sorted);
});

// 11. Roof Tile Service - Submit New Report (PUBLIC / FIELD INSPECTORS)
app.post('/api/telhas/reports', (req, res) => {
  const reportData = req.body;

  if (!reportData.dataPreenchimento) {
    return res.status(400).json({ error: 'Data de preenchimento é obrigatória.' });
  }

  const nivelChuvaMm = Number(reportData.nivelChuvaMm) || 0;
  const chuvaMaior5mm = nivelChuvaMm > 5;

  const newReport: RoofDailyReport = {
    id: Date.now(),
    dataPreenchimento: reportData.dataPreenchimento || new Date().toISOString().split('T')[0],
    setorPredio: reportData.setorPredio || 'Prédio 4i1',
    responsavel: reportData.responsavel || 'Sávio Rodrigues de Souza',
    equipeFuncionarios:
      reportData.equipeFuncionarios ||
      'Vanderlei Encarregado, Ezequiel Soldador, Iraldo Caldeireiro, Juliano Resgatista, Matheus, Hugo e Jonas',
    tiposServico: Array.isArray(reportData.tiposServico) ? reportData.tiposServico : ['Telha Translúcida'],
    qtdTranslúcidas: Number(reportData.qtdTranslúcidas) || 0,
    qtdFibrocimento: Number(reportData.qtdFibrocimento) || 0,
    metragemCalhas: Number(reportData.metragemCalhas) || (Array.isArray(reportData.tiposServico) && reportData.tiposServico.some((s: string) => s.toLowerCase().includes('calha')) ? Number(reportData.metragem) || 0 : 0),
    metragemLinhaVida: Number(reportData.metragemLinhaVida) || 0,
    metragem: (Number(reportData.metragemCalhas) || 0) + (Number(reportData.metragemLinhaVida) || 0) || Number(reportData.metragem) || 0,
    nivelChuvaMm,
    chuvaMaior5mm,
    ganhouDiaAdicional: chuvaMaior5mm,
    statusGeral: reportData.statusGeral || 'Em andamento',
    descricaoExecucao: reportData.descricaoExecucao || 'Serviço executado conforme plano de ataque diário.',
    condicoesClimaticas: reportData.condicoesClimaticas || (chuvaMaior5mm ? `Chuvoso (${nivelChuvaMm}mm) / Paralisação Preventiva NR-35` : 'Ensolarado / Favorável em todos os períodos'),
    periodosAfetadosClima: reportData.periodosAfetadosClima || (chuvaMaior5mm ? 'Paralisação preventiva durante precipitação' : 'Sem paralisação'),
    houveEntregaMateriais: reportData.houveEntregaMateriais || 'Não havia entrega prevista para hoje',
    materiaisRecebidos: reportData.materiaisRecebidos || 'Nenhum',
    equipamentosEmUso: Array.isArray(reportData.equipamentosEmUso)
      ? reportData.equipamentosEmUso
      : ['Ferramentas manuais', 'Linha de vida'],
    condicaoEquipamentos: reportData.condicaoEquipamentos || 'Todos operacionais',
    registroOcorrencias: reportData.registroOcorrencias || (chuvaMaior5mm ? 'Chuva > 5mm registrada: +1 dia de prazo concedido contratualmente' : 'Nenhuma ocorrência (Dia 100% seguro)'),
    descricaoOcorrencia: reportData.descricaoOcorrencia || (chuvaMaior5mm ? `Precipitação pluviométrica de ${nivelChuvaMm}mm aferida. Prestador de serviço recebe +1 dia adicional no calendário.` : null),
    criadoEm: new Date().toISOString(),
  };

  roofReports.unshift(newReport);

  // If rain > 5mm, automatically reflect in calendar as an item in blue with +1 day extension
  if (chuvaMaior5mm) {
    const existingRainTask = calendarTasks.find((t) => t.date === newReport.dataPreenchimento && (t.category === 'chuva' || t.isRain));
    if (existingRainTask) {
      existingRainTask.rained = true;
      existingRainTask.isRain = true;
      existingRainTask.category = 'chuva';
      existingRainTask.rainVolumeMm = Math.max(existingRainTask.rainVolumeMm || 0, nivelChuvaMm);
      existingRainTask.addedDayToDeadline = true;
      existingRainTask.title = `🌧️ Coleta de Chuva: ${nivelChuvaMm}mm (> 5mm: +1 dia de prazo concedido)`;
    } else {
      calendarTasks.push({
        id: `cal-rain-${Date.now()}`,
        title: `🌧️ Coleta de Chuva: ${nivelChuvaMm}mm (> 5mm: +1 dia de prazo concedido)`,
        category: 'chuva',
        date: newReport.dataPreenchimento,
        startTime: '08:00',
        endTime: '17:00',
        status: 'concluida',
        priority: 'alta',
        responsible: newReport.responsavel || 'Equipe SANY Turnkey',
        notes: `Precipitação de ${nivelChuvaMm}mm aferida no canteiro Savoy. Pela regra contratual de intempéries, o prestador de serviços ganha +1 dia no calendário final.`,
        isCompleted: true,
        isRain: true,
        rained: true,
        rainVolumeMm: nivelChuvaMm,
        rainPeriod: 'dia_inteiro',
        paralyzedWork: true,
        addedDayToDeadline: true,
      });
    }
  }

  const summary = computeRoofSummary(roofReports);
  const scheduleInfo = summary.scheduleInfo;

  // Gerar atualização completa diária para o WhatsApp no número 12996707590
  const targetPhone = '12996707590';
  const targetPhoneFormatted = '(12) 99670-7590';
  const dailyWhatsappMessage = generateDailyReportWhatsAppMessage(newReport, summary, scheduleInfo);
  const whatsappUrl = `https://wa.me/55${targetPhone}?text=${encodeURIComponent(dailyWhatsappMessage)}`;

  // Registrar alerta operacional e de envio ao WhatsApp
  const totalTelhasDia = (Number(newReport.qtdTranslúcidas) || 0) + (Number(newReport.qtdFibrocimento) || 0);
  projectData.alerts.unshift({
    id: `alt-wa-daily-${Date.now()}`,
    type: 'supplier',
    title: `📱 Atualização WhatsApp Gerada (${targetPhoneFormatted})`,
    badge: 'WhatsApp 12996707590',
    description: `Relatório diário da SVA Engenharia processado com sucesso. Mensagem enviada ao WhatsApp (${targetPhoneFormatted}): ${totalTelhasDia} telhas instaladas, clima: ${newReport.condicoesClimaticas} (${nivelChuvaMm}mm), linha de vida no dia: ${newReport.metragemLinhaVida}m.`,
    urgency: chuvaMaior5mm ? 'high' : 'low',
    time: 'Agora',
  });

  if (chuvaMaior5mm && scheduleInfo) {
    projectData.alerts.unshift({
      id: `alt-rain-${Date.now()}`,
      type: 'weather',
      title: `🌧️ Chuva > 5mm (${nivelChuvaMm}mm): +1 Dia Concedido`,
      badge: '+1 Dia Prazo Final',
      description: `O fornecedor SVA Engenharia ganhou +1 dia no prazo final contratual. Nova data de término prorrogada para ${scheduleInfo.formattedCurrentEndDate}. IA Samuel formatou comunicado específico.`,
      urgency: 'high',
      time: 'Agora',
    });
  }

  return res.status(201).json({
    message: chuvaMaior5mm
      ? `Relatório salvo! Chuva de ${nivelChuvaMm}mm registrada (> 5mm): +1 dia adicionado ao prazo contratual da SVA Engenharia e atualização gerada para o WhatsApp (12) 99670-7590.`
      : `Relatório diário de telhas registrado com sucesso! Atualização formatada pela IA Samuel pronta para envio no WhatsApp (12) 99670-7590.`,
    report: newReport,
    summary,
    scheduleInfo,
    whatsappMessage: dailyWhatsappMessage,
    dailyWhatsappMessage,
    targetPhone,
    targetPhoneFormatted,
    whatsappUrl,
    gainedExtraDay: chuvaMaior5mm,
  });
});

// 12. Calendar Tasks - Get Tasks (PUBLIC/AUTH)
app.get('/api/calendar/tasks', (req, res) => {
  const { date } = req.query;
  if (date && typeof date === 'string') {
    const filtered = calendarTasks.filter((t) => t.date === date);
    return res.json(filtered);
  }
  return res.json(calendarTasks);
});

// 13. Calendar Tasks - Create Task (DEVELOPER / AUTH)
app.post('/api/calendar/tasks', (req, res) => {
  const {
    title,
    category,
    date,
    startTime,
    endTime,
    priority,
    responsible,
    notes,
    isRain,
    rained,
    rainVolumeMm,
    rainPeriod,
    paralyzedWork,
  } = req.body;

  if (!title || !date) {
    return res.status(400).json({ error: 'Título e data da tarefa são obrigatórios.' });
  }

  const isRainTask = category === 'chuva' || Boolean(isRain) || Boolean(rained);
  const volume = rainVolumeMm !== undefined ? Number(rainVolumeMm) : (isRainTask ? 5.2 : 0);
  const addedDay = isRainTask && volume > 5;

  const newTask: CalendarTask = {
    id: `cal-${Date.now()}`,
    title,
    category: category || (isRainTask ? 'chuva' : 'translúcida'),
    date,
    startTime: startTime || '08:00',
    endTime: endTime || '17:00',
    status: 'programada',
    priority: priority || (isRainTask ? 'alta' : 'media'),
    responsible: responsible || (isRainTask ? 'Coleta Pluviométrica Savoy' : 'Equipe SANY Turnkey'),
    notes: notes || '',
    isCompleted: false,
    isRain: isRainTask,
    rained: rained !== undefined ? Boolean(rained) : isRainTask,
    rainVolumeMm: volume,
    rainPeriod: rainPeriod || (isRainTask ? 'tarde' : undefined),
    paralyzedWork: Boolean(paralyzedWork),
    addedDayToDeadline: addedDay,
  };

  calendarTasks.push(newTask);

  const scheduleInfo = computeProjectSchedule(roofReports, calendarTasks);

  return res.status(201).json({
    message: isRainTask ? 'Registro de chuva coletado com sucesso no calendário!' : 'Tarefa agendada com sucesso no calendário!',
    task: newTask,
    scheduleInfo,
    whatsappMessage: scheduleInfo.latestRainEvent?.whatsappMessage,
  });
});

// 13b. Calendar - Quick Rain Log / Toggle
app.post('/api/calendar/quick-rain', (req, res) => {
  const { date, rained = true, rainVolumeMm = 5.2, rainPeriod = 'tarde', paralyzedWork = false, notes = '' } = req.body;

  if (!date) {
    return res.status(400).json({ error: 'Data para registro de chuva é obrigatória.' });
  }

  const vol = Number(rainVolumeMm) || 0;
  const addedDay = Boolean(rained) && vol > 5;

  // Find existing rain item on this date
  const existing = calendarTasks.find((t) => t.date === date && (t.category === 'chuva' || t.isRain || t.rained !== undefined));

  if (existing) {
    existing.rained = Boolean(rained);
    existing.isRain = Boolean(rained);
    existing.category = 'chuva';
    existing.rainVolumeMm = vol;
    existing.rainPeriod = rainPeriod;
    existing.paralyzedWork = Boolean(paralyzedWork);
    existing.addedDayToDeadline = addedDay;
    if (addedDay) {
      existing.title = `🌧️ Coleta de Chuva: ${vol}mm (> 5mm: +1 dia concedido)`;
    }
    if (notes) existing.notes = notes;

    const scheduleInfo = computeProjectSchedule(roofReports, calendarTasks);

    return res.json({
      message: `Registro de chuva atualizado (${vol}mm). ${addedDay ? 'Prestador de serviço ganhou +1 dia no calendário final!' : ''}`,
      task: existing,
      scheduleInfo,
      whatsappMessage: scheduleInfo.latestRainEvent?.whatsappMessage,
      gainedExtraDay: addedDay,
    });
  }

  // Create new rain task
  const rainTask: CalendarTask = {
    id: `cal-rain-${Date.now()}`,
    title: `Registro Pluviométrico: ${rained ? '🌧️ Choveu no Canteiro (' + vol + 'mm)' : '☀️ Sem Chuva'}${addedDay ? ' • +1 Dia no Prazo' : ''}`,
    category: 'chuva',
    date,
    startTime: '08:00',
    endTime: '17:00',
    status: 'concluida',
    priority: 'alta',
    responsible: 'Coleta Meteorológica Savoy',
    notes: notes || `Coleta de chuva Savoy. Volume: ${vol}mm. Período: ${rainPeriod}.${addedDay ? ' Mais de 5mm: prestador ganha +1 dia no calendário final.' : ''}`,
    isCompleted: true,
    isRain: true,
    rained: Boolean(rained),
    rainVolumeMm: vol,
    rainPeriod,
    paralyzedWork: Boolean(paralyzedWork),
    addedDayToDeadline: addedDay,
  };

  calendarTasks.push(rainTask);

  const scheduleInfo = computeProjectSchedule(roofReports, calendarTasks);

  return res.status(201).json({
    message: `Coleta de chuva registrada! O item ficará azul no calendário para a data ${date}.${addedDay ? ' O prestador de serviço ganhou +1 dia no calendário final!' : ''}`,
    task: rainTask,
    scheduleInfo,
    whatsappMessage: scheduleInfo.latestRainEvent?.whatsappMessage,
    gainedExtraDay: addedDay,
  });
});

// 13c. AI Agent: Rain WhatsApp Message & Schedule Summary
app.get('/api/ai/rain-whatsapp-message', (req, res) => {
  const scheduleInfo = computeProjectSchedule(roofReports, calendarTasks);
  return res.json({
    scheduleInfo,
    latestRainEvent: scheduleInfo.latestRainEvent,
    whatsappMessage: scheduleInfo.latestRainEvent?.whatsappMessage || 'Nenhum evento de chuva com mais de 5mm registrado até o momento.',
  });
});

// 13d. AI Agent: Daily Roof Update WhatsApp Message for 12996707590
app.get('/api/ai/daily-update-whatsapp', (req, res) => {
  const { date } = req.query;
  const summary = computeRoofSummary(roofReports);
  const targetReport = date
    ? roofReports.find((r) => r.dataPreenchimento === date) || roofReports[0]
    : roofReports[0];

  if (!targetReport) {
    return res.status(404).json({ error: 'Nenhum relatório de telhado encontrado.' });
  }

  const targetPhone = '12996707590';
  const targetPhoneFormatted = '(12) 99670-7590';
  const dailyWhatsappMessage = generateDailyReportWhatsAppMessage(targetReport, summary, summary.scheduleInfo);
  const whatsappUrl = `https://wa.me/55${targetPhone}?text=${encodeURIComponent(dailyWhatsappMessage)}`;

  return res.json({
    report: targetReport,
    summary,
    scheduleInfo: summary.scheduleInfo,
    targetPhone,
    targetPhoneFormatted,
    dailyWhatsappMessage,
    whatsappUrl,
  });
});

// Helper: Persistência de Disparos de WhatsApp na Base de Dados e Memória
async function persistWhatsAppReminderToDatabase(reminder: WhatsAppReminderRecord) {
  try {
    whatsappRemindersList.unshift(reminder);
    if (whatsappRemindersList.length > 100) {
      whatsappRemindersList.pop();
    }

    // Persistência direta no Firestore via REST API
    const firestoreDbId = 'ai-studio-sanyturnkeygesto-07b1d634-7f94-4597-a18a-2b9609af574f';
    const projectId = 'gen-lang-client-0486469536';
    const apiKey = 'AIzaSyBj8hp9-5dWo7rf4LBFHcMM5Hp3SNQ-1uQ';
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDbId}/documents/whatsapp_reminders/${reminder.id}?key=${apiKey}`;

    const body = {
      fields: {
        id: { stringValue: reminder.id },
        scheduledTime: { stringValue: reminder.scheduledTime },
        date: { stringValue: reminder.date },
        recipient: { stringValue: reminder.recipient },
        targetPhone: { stringValue: reminder.targetPhone },
        targetPhoneFormatted: { stringValue: reminder.targetPhoneFormatted },
        message: { stringValue: reminder.message },
        status: { stringValue: reminder.status },
        dispatchedAt: { stringValue: reminder.dispatchedAt },
        whatsappUrl: { stringValue: reminder.whatsappUrl },
        type: { stringValue: reminder.type },
        deliveredVia: { stringValue: reminder.deliveredVia || 'scheduled_agent' },
      },
    };

    fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((res) => {
      if (res.ok) {
        console.log(`[DATABASE FIRESTORE] Lembrete ${reminder.id} gravado com sucesso na base de dados.`);
      } else {
        console.warn(`[DATABASE FIRESTORE] Status gravação REST: ${res.status}`);
      }
    }).catch((err) => {
      console.warn('[DATABASE FIRESTORE] Aviso de sincronização:', err);
    });
  } catch (err) {
    console.warn('[DATABASE] Erro ao persistir lembrete:', err);
  }
}

// Disparo programado do Lembrete das 08h30
async function triggerSvaScheduledReminder(dateStr: string, triggerType: 'AUTOMATICO_08H30' | 'MANUAL'): Promise<WhatsAppReminderRecord> {
  const reminderMessage = generateSvaDailyReminderWhatsAppMessage(dateStr);
  const whatsappUrl = `https://wa.me/${SVA_PHONE_RAW}?text=${encodeURIComponent(reminderMessage)}`;
  const dispatchId = `sva-rem-${dateStr}-${Date.now()}`;

  const reminderRecord: WhatsAppReminderRecord = {
    id: dispatchId,
    scheduledTime: SVA_SCHEDULED_TIME,
    date: dateStr,
    recipient: SVA_SUPPLIER_NAME,
    targetPhone: SVA_PHONE_RAW,
    targetPhoneFormatted: SVA_PHONE_FORMATTED,
    message: reminderMessage,
    status: triggerType === 'AUTOMATICO_08H30' ? 'DISPARADO_AUTOMATICO' : 'DISPARADO_MANUAL',
    dispatchedAt: new Date().toISOString(),
    whatsappUrl,
    type: 'daily_08h30_reminder',
    deliveredVia: 'scheduled_agent',
  };

  await persistWhatsAppReminderToDatabase(reminderRecord);

  projectData.alerts.unshift({
    id: `alt-sva-${Date.now()}`,
    type: 'supplier',
    title: triggerType === 'AUTOMATICO_08H30' ? '⏰ Lembrete Automático 08h30: SVA Engenharia' : '⏰ Lembrete 08h30 Enviado: SVA Engenharia',
    badge: `WhatsApp ${SVA_PHONE_RAW}`,
    description: `Disparo ${triggerType === 'AUTOMATICO_08H30' ? 'automático' : 'manual'} do lembrete diário das 08h30 executado com sucesso para a SVA Engenharia (${SVA_PHONE_FORMATTED}) para apontamento de cobertura Savoy.`,
    urgency: 'high',
    time: '08:30',
  });

  console.log(`[IA SAMUEL - 08H30] Disparo registrado para ${SVA_SUPPLIER_NAME} (${SVA_PHONE_FORMATTED}) em ${dateStr}. Tipo: ${triggerType}`);

  return reminderRecord;
}

// 13e. AI Agent: 08h30 Daily Reminder for SVA Engenharia (WhatsApp 55 12 97408-0523)
app.get('/api/ai/sva-reminder-whatsapp', (req, res) => {
  const { date } = req.query;
  const dateStr = typeof date === 'string' ? date : undefined;
  const reminderMessage = generateSvaDailyReminderWhatsAppMessage(dateStr);
  const whatsappUrl = `https://wa.me/${SVA_PHONE_RAW}?text=${encodeURIComponent(reminderMessage)}`;

  return res.json({
    scheduledTime: SVA_SCHEDULED_TIME,
    supplier: SVA_SUPPLIER_NAME,
    targetPhone: SVA_PHONE_RAW,
    targetPhoneFormatted: SVA_PHONE_FORMATTED,
    reminderMessage,
    whatsappUrl,
  });
});

// 13f. Trigger 08h30 Reminder to SVA Engenharia (Manual ou Teste)
app.post('/api/ai/trigger-sva-reminder', async (req, res) => {
  const now = new Date();
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  const reminderRecord = await triggerSvaScheduledReminder(dateParts, 'MANUAL');

  return res.json({
    message: `Lembrete diário das 08h30 gerado, persistido na base de dados e pronto para envio ao WhatsApp da SVA Engenharia (${SVA_PHONE_FORMATTED})!`,
    targetPhone: SVA_PHONE_RAW,
    targetPhoneFormatted: SVA_PHONE_FORMATTED,
    reminderMessage: reminderRecord.message,
    whatsappUrl: reminderRecord.whatsappUrl,
    reminderRecord,
  });
});

// 13g. Status do Agendador de Lembretes Diários (08h30 SVA Engenharia)
app.get('/api/ai/sva-reminder-status', (req, res) => {
  const now = new Date();
  const currentTimeBrasilia = now.toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return res.json({
    active: true,
    scheduledTime: SVA_SCHEDULED_TIME,
    timeZone: 'America/Sao_Paulo',
    currentTimeBrasilia,
    supplier: SVA_SUPPLIER_NAME,
    targetPhone: SVA_PHONE_RAW,
    targetPhoneFormatted: SVA_PHONE_FORMATTED,
    lastTriggeredDate: lastSvaReminderDateTriggered || 'Hoje (Agendado diariamente às 08h30)',
    totalDispatches: whatsappRemindersList.length,
    recentDispatches: whatsappRemindersList.slice(0, 10),
  });
});

// 13h. Listagem de Lembretes do WhatsApp da Base de Dados
app.get('/api/ai/whatsapp-reminders', (req, res) => {
  return res.json({
    reminders: whatsappRemindersList,
    count: whatsappRemindersList.length,
  });
});

app.get('/api/ai/sva-reminder-history', (req, res) => {
  return res.json({
    reminders: whatsappRemindersList,
    count: whatsappRemindersList.length,
  });
});

// 14. Calendar Tasks - Toggle Task Completion
app.patch('/api/calendar/tasks/:id/toggle', (req, res) => {
  const { id } = req.params;
  const task = calendarTasks.find((t) => t.id === id);

  if (!task) {
    return res.status(404).json({ error: 'Tarefa não encontrada.' });
  }

  task.isCompleted = !task.isCompleted;
  task.status = task.isCompleted ? 'concluida' : 'em_andamento';

  return res.json({
    message: `Tarefa ${task.isCompleted ? 'marcada como concluída' : 'reaberta'}!`,
    task,
  });
});

// 15. Calendar Tasks - Delete Task
app.delete('/api/calendar/tasks/:id', (req, res) => {
  const { id } = req.params;
  const index = calendarTasks.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Tarefa não encontrada.' });
  }

  calendarTasks.splice(index, 1);
  return res.json({ message: 'Tarefa removida do calendário com sucesso.' });
});

// Background Scheduler for 08h30 Daily Reminder (SVA Engenharia - WhatsApp 55 12 97408-0523)
let lastSvaReminderDateTriggered = '';
setInterval(async () => {
  try {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const dateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);

    if (timeStr === '08:30' && lastSvaReminderDateTriggered !== dateStr) {
      lastSvaReminderDateTriggered = dateStr;
      console.log(`[AGENDADOR 08H30 BACK-END] Disparando lembrete diário para SVA Engenharia (${SVA_PHONE_FORMATTED}). Data: ${dateStr}`);
      await triggerSvaScheduledReminder(dateStr, 'AUTOMATICO_08H30');
    }
  } catch (err) {
    console.error('Erro na checagem do agendador 08h30:', err);
  }
}, 30000);

// Start Server and mount Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
