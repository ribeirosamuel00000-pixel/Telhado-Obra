# Agente de pesquisa de peças automotivas

## Objetivo
Adicionar ao sistema uma área chamada **Peças & Ofertas** para pesquisar uma peça por marca, modelo, ano e motorização do carro, retornando exatamente três ofertas comparáveis com preço, frete, economia, promoção/cupom e link.

## Abordagem de implementação
- Criar `src/components/PartsResearchTab.tsx` como fluxo independente de busca e comparação.
- Usar um catálogo local determinístico para a primeira versão demonstrável; os resultados serão identificados como demonstração para não inventar disponibilidade ou cupons.
- Gerar links de busca externos com os parâmetros do veículo/peça e exibir a origem de cada anúncio.
- Preparar a interface para uma futura integração com APIs oficiais de marketplaces, mantendo no produto o aviso de que cupons precisam ser confirmados na página de origem.
- Adicionar a aba ao `App.tsx` e o rótulo ao `Header.tsx`.
- Manter a autenticação, as abas existentes e a identidade visual do projeto.

## Design
- **Movimento:** dashboard operacional editorial, com sensação de central de inteligência de compras.
- **Princípios:** clareza de decisão, densidade informativa controlada, confiança explícita e ação rápida.
- **Paleta:** marinho quase preto para contexto, vermelho telha como cor proprietária de ação, âmbar para promoções e verde para economia/verificação.
- **Layout:** cabeçalho de busca em faixa escura, resumo de economia em cartões e comparação em lista vertical com destaque para a melhor oferta.
- **Elementos de assinatura:** marcador numerado de melhor oferta, pill “compatibilidade” e faixa de transparência sobre fonte/cupom.
- **Interação:** preencher o mínimo de dados, buscar com um toque, reordenar por preço/frete e abrir links sem perder o contexto.
- **Animação:** transições curtas em hover, indicador de carregamento e entrada suave dos resultados; sem movimento decorativo excessivo.
- **Tipografia:** sistema sans do projeto, com números de preço em peso forte e labels em caixa alta mono para reforçar leitura técnica.
- **Essência da marca:** “encontre a peça certa antes de pagar mais”; direto, técnico, cuidadoso.
- **Voz:** “Compare antes de fechar.” / “Cupom só vale quando confirmado na loja.”
- **Marca:** usar o vermelho já existente como assinatura, sem criar uma nova marca paralela.

## Estrutura
- `src/components/PartsResearchTab.tsx`: estado do formulário, catálogo demonstrativo, ordenação, cards e links.
- `src/App.tsx`: rota/aba local `pecas` e renderização.
- `src/components/Header.tsx`: label da nova área.
- `plan.md`: decisões de implementação e transparência de dados.
