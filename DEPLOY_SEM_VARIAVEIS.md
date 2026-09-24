# Deploy 100% Automático via Firebase (Zero Variáveis de Ambiente)

Este projeto foi configurado para funcionar **direto da caixa** sem que você precise digitar ou cadastrar **nenhuma variável de ambiente** no Vercel, no Manus ou no GitHub!

---

### Por que você NÃO precisa configurar nada de variáveis?

1. **Credenciais Oficiais Já Embutidas no Código (`src/firebase.ts`):**
   - O identificador do seu banco Firestore (`ai-studio-sanyturnkeygesto-07b1d634-7f94-4597-a18a-2b9609af574f`), o ID do projeto (`gen-lang-client-0486469536`) e a chave pública do cliente já estão inseridos diretamente no código-fonte compilado.

2. **Comunicação Direta Client-to-Firebase:**
   - Cada aparelho (celular Android, iPhone, tablet ou computador) se conecta diretamente ao banco de dados na nuvem da Google via WebSocket (`onSnapshot`).
   - Não depende de servidor local ou intermediário.

3. **Sincronização em Tempo Real Multi-Aparelhos:**
   - Quando alguém preenche o formulário pelo celular em campo, o Firebase grava o documento na nuvem e em menos de 1 segundo todos os outros aparelhos abertos atualizam os dados, o gráfico Curva S e o total de telhas automaticamente sem precisar atualizar a página.

---

### Como Lançar no Manus ou no Vercel:

1. **No GitHub / Manus / Vercel:**
   - Basta importar ou colar o repositório deste projeto.
   - O comando de build padrão é `npm run build` e a pasta de saída é `dist`.
   - **Não precisa adicionar nenhuma Environment Variable (variável de ambiente).** Deixe a seção de variáveis vazia!
2. Clique em **Deploy**.
3. O link gerado já estará funcionando e salvando diretamente no seu Firebase Firestore!
