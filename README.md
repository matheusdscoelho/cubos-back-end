---
# 🎬 Cubos Filmes - API Backend

Este é o backend do projeto **Cubos Filmes**, uma API RESTful desenvolvida com **Node.js** e **Express** que permite gerenciar um catálogo de filmes. Ela possibilita:

- 📄 Criar, listar e deletar filmes.
- 👥 Compartilhar filmes entre usuários.
- 🛡️ Autenticação de usuários com JWT.
- ☁️ Upload de imagens de filmes para a AWS S3.
- 📧 Envio automático de e-mails com lembretes de estreia.
- 🕒 Tarefas automáticas com agendamento via cron.

---

## 🚀 Tecnologias e Bibliotecas

### 🧩 Dependências principais

| Pacote | Finalidade |
|--------|------------|
| **express** | Framework para construir a API HTTP. |
| **@prisma/client** | ORM para acesso ao banco de dados de forma segura e eficiente. |
| **@aws-sdk/client-s3** | Cliente AWS SDK para upload de arquivos na Amazon S3. |
| **bcryptjs** | Para criptografar senhas de forma segura. |
| **cors** | Middleware que habilita o CORS (Cross-Origin Resource Sharing). |
| **dotenv** | Carrega variáveis de ambiente do `.env` para `process.env`. |
| **jsonwebtoken** | Geração e validação de tokens JWT para autenticação. |
| **multer** | Manipulação de upload de arquivos (ex: imagens de filmes). |
| **node-cron** | Agendador de tarefas baseado em cron (ex: envio de e-mails diários). |
| **nodemailer** | Envio de e-mails via SMTP, usado para notificações como estreias. |

### 🛠️ Dependências de desenvolvimento

| Pacote | Finalidade |
|--------|------------|
| **typescript** | Linguagem usada no projeto, com tipagem estática. |
| **ts-node-dev** | Reinicia o servidor automaticamente em desenvolvimento com suporte a TypeScript. |
| **prisma** | CLI do Prisma usada para gerar o client e executar migrações. |
| **@types/\*** | Tipagens TypeScript para bibliotecas usadas. Necessárias para autocompletar e validação de tipos. |

---

## 📦 Instalação

1. Clone o projeto:
```bash
git clone https://github.com/seu-usuario/seu-repositorio.git
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o banco de dados e a AWS no arquivo `.env`:
```env
DATABASE_URL="..."
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="..."
S3_BUCKET_NAME="..."
JWT_SECRET="..."
EMAIL_HOST="..."
EMAIL_PORT=..."
EMAIL_USER="..."
EMAIL_PASS="..."
```

4. Gere o client do Prisma e execute as migrações:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

5. Rode o servidor:
```bash
npm run dev
```

---

## 📬 Endpoints principais

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/movies` | Lista todos os filmes. |
| `POST` | `/movies` | Cria um novo filme. |
| `POST` | `/auth/register` | Cadastra um novo usuário. |
| `POST` | `/auth/login` | Autentica e retorna um token JWT. |

---

## ✨ Funcionalidades em destaque

- Upload de imagens com **Multer + AWS S3**
- Segurança com **JWT e senhas criptografadas**
- **Envio automático de e-mails** no dia da estreia dos filmes
- Agendamento de tarefas com **node-cron**

---

## 🧪 Testes e ferramentas recomendadas

- [Postman](https://www.postman.com/) ou [Insomnia](https://insomnia.rest/) para testar a API.
- [MailHog](https://github.com/mailhog/MailHog) ou similar para capturar e-mails em ambiente de dev.

---

## 🧑‍💻 Autor

**Matheus Coelho**  
Desenvolvido como parte do projeto Cubos Filmes.

---

## 📄 Licença

Este projeto está sob a licença MIT.
---
