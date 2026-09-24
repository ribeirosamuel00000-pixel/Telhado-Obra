# Guia de Deploy no Vercel via GitHub com Firebase em Tempo Real (Multi-Dispositivos)

Este projeto está 100% configurado para sincronização instantânea entre múltiplos aparelhos (celulares, tablets, notebooks) utilizando o **Google Firebase Firestore** com escuta ativa via WebSockets (`onSnapshot`).

---

## 1. Como Exportar para o GitHub

1. No canto superior direito do Google AI Studio, clique em **Export** (ou faça o push do seu repositório Git local).
2. Selecione seu repositório no GitHub (ou crie um novo repositório, por exemplo `sany-turnkey-savoy`).
3. O repositório conterá automaticamente os arquivos de configuração:
   - `firebase-applet-config.json` (com as credenciais seguras do Firestore já embutidas)
   - `vercel.json` (roteamento SPA pronto)
   - `.env.example` (lista de variáveis de ambiente opcionais)

---

## 2. Como Fazer o Deploy no Vercel em 2 Minutos

1. Acesse [vercel.com](https://vercel.com) e faça login com sua conta do GitHub.
2. Clique em **"Add New..."** ➔ **"Project"**.
3. Selecione o repositório que você acabou de exportar.
4. O Vercel detectará automaticamente o framework **Vite**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **(Opcional) Variáveis de Ambiente no Vercel:**
   O projeto já possui as credenciais pré-configuradas em código como fallback inteligente. No entanto, se você quiser definir explicitamente no painel do Vercel (**Settings ➔ Environment Variables**), adicione:
   - `VITE_FIREBASE_PROJECT_ID`: `gen-lang-client-0486469536`
   - `VITE_FIREBASE_DATABASE_ID`: `ai-studio-sanyturnkeygesto-07b1d634-7f94-4597-a18a-2b9609af574f`
   - `VITE_FIREBASE_API_KEY`: `AIzaSyBj8hp9-5dWo7rf4LBFHcMM5Hp3SNQ-1uQ`
   - `VITE_FIREBASE_AUTH_DOMAIN`: `gen-lang-client-0486469536.firebaseapp.com`
   - `VITE_FIREBASE_STORAGE_BUCKET`: `gen-lang-client-0486469536.firebasestorage.app`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`: `138390740913`
   - `VITE_FIREBASE_APP_ID`: `1:138390740913:web:5dd55766dd21ff05282790`
6. Clique em **"Deploy"**. Em menos de 1 minuto seu site estará no ar com link público HTTPS!

---

## 3. Como Funciona a Atualização em Tempo Real em Múltiplos Aparelhos

- **Escuta Ativa (WebSockets `onSnapshot`):**
  Quando o encarregado no telhado envia um RDO pelo celular, a gravação vai direto para o Firestore (`roof_reports`).
- **Propagação Instantânea:**
  O Firestore dispara um evento para todos os navegadores abertos no site (celular do engenheiro, computador do diretor na sede, tablet na portaria).
- **Zero Recarga Necessária:**
  O Gráfico Curva S, o contador de telhas instaladas, os cartões de progresso e o calendário de dias de chuva atualizam sozinhos na tela em fração de segundos.
