# Salvar Comida - WebApp

## Descrição

**Salvar Comida** é uma iniciativa da associação de restaurantes de Évora dedicada a combater o desperdício alimentar. A plataforma conecta restaurantes que têm refeições de última hora – que estão a chegar ao fim da sua validade, mas continuam em perfeitas condições – com consumidores que procuram produtos de qualidade a preços mais acessíveis.

### Principais Funcionalidades

- **Área Pública**: Consulta de ofertas e restaurantes disponíveis sem necessidade de autenticação
- **Área do Cliente**: Sistema de login para clientes reservarem ofertas de forma personalizada
- **Área do Restaurante**: Dashboard para restaurantes cadastrarem e gerirem suas ofertas
- **Área de Administração**: Painel completo para administradores monitorizarem toda a plataforma
- **Filtros Inteligentes**: Sistema de filtragem por restaurante, nome de comida e pesquisa textual
- **Design Responsivo**: Interface adaptável a dispositivos móveis, tablets e desktop
- **Single Page Application (SPA)**: Navegação fluida sem recarregamento de página

---

## Tech Stack

### Frontend
- **HTML** - Estrutura semântica e acessível
- **CSS** - Estilização moderna com variáveis CSS, Flexbox e Grid Layout
- **JavaScript** - Lógica da aplicação em Vanilla JS

### Backend/API
- **API REST** - Integração com endpoints da Universidade de Évora
- **JSON** - Formato de troca de dados

### Arquitetura
- **SPA (Single Page Application)** - Navegação baseada em hash routing
- **Modular JavaScript** - Código organizado em módulos IIFE (Immediately Invoked Function Expressions)
- **AJAX/XMLHttpRequest** - Comunicação assíncrona com a API

---

## Estrutura do Projeto

```
Salvar Comida WebApp/
│
├── src/
│   ├── main.html              # Ficheiro HTML principal com todas as secções
│   ├── styles.css             # Folha de estilos global da aplicação
│   │
│   ├── img/                   # Recursos visuais
│   │   ├── logo.png          # Logotipo da plataforma
│   │   ├── info.png          # Imagem informativa
│   │   └── uni_logo.png      # Logotipo da Universidade de Évora
│   │
│   └── js/                    # Scripts JavaScript modulares
│       ├── api.js            # Definição de endpoints da API
│       ├── global.js         # Funções globais, estado e utilitários
│       ├── public.js         # Lógica da área pública
│       ├── client.js         # Lógica da área do cliente
│       ├── restaurant.js     # Lógica da área do restaurante
│       ├── admin.js          # Lógica da área administrativa
│       └── main.js           # Inicialização e router principal
│
└── README.md                  # Documentação do projeto
```

### Descrição Detalhada dos Ficheiros

#### HTML
- **`main.html`** - Documento principal que contém toda a estrutura da aplicação:
  - Header com navegação principal
  - Secção "Início" com landing page e informações institucionais
  - Secção "Público" para listagem de ofertas e restaurantes
  - Secção "Cliente" com sistema de login e dashboard pessoal
  - Secção "Restaurante" para gestão de ofertas
  - Secção "Admin" com painéis de controlo
  - Modal de detalhe de ofertas
  - Footer com informações de contacto e créditos

#### CSS
- **`styles.css`** - Estilos organizados em secções:
  1. Variáveis de tema (cores, espaçamentos, sombras)
  2. Reset e estilos base
  3. Header e navegação
  4. Conteúdo principal
  5. Footer
  6. Componentes reutilizáveis (cards, botões, formulários)
  7. Landing page
  8. Área pública e filtros
  9. Modal de ofertas
  10. Áreas específicas (cliente, restaurante, admin)
  11. Media queries para responsividade

#### JavaScript

- **`api.js`** - Centraliza todos os endpoints da API REST:
  - Endpoints de restaurantes (list, search, get)
  - Endpoints de clientes (list)
  - Endpoints de ofertas (list, search, get, insert, reserve)
  - Endpoints administrativos (listas completas)

- **`global.js`** - Core da aplicação com funcionalidades partilhadas:
  - Estado global da aplicação (`appState`, `ofertasState`, `adminState`)
  - Funções de comunicação com API (`apiGet`, `apiPost`)
  - Funções auxiliares de extração de IDs
  - Funções de carregamento de dados (`loadOfertas`, `loadRestaurantes`, `loadClientes`)
  - Criação de elementos DOM (`createOfertaCard`, `createRestaurantCard`, `createClienteCard`)
  - Sistema de navegação (`showView`, `handleHashChange`)
  - Gestão da modal de detalhe de ofertas
  - Sistema de paginação/lazy-loading para listas de ofertas

- **`public.js`** - Área pública da aplicação:
  - Carregamento de opções de restaurantes para filtros
  - Sistema de filtros (por restaurante e pesquisa de comida)
  - Alternância entre vista de ofertas e restaurantes
  - Aplicação de filtros em tempo real

- **`client.js`** - Área do cliente autenticado:
  - Sistema de autenticação de clientes (username + ID)
  - Dashboard personalizado do cliente
  - Funcionalidade de reserva de ofertas
  - Filtros específicos da área do cliente
  - Gestão de sessão do cliente

- **`restaurant.js`** - Área do restaurante:
  - Sistema de login por seleção de restaurante
  - Dashboard do restaurante
  - Formulário de inserção de novas ofertas
  - Validação de dados de ofertas
  - Integração com API para criar ofertas

- **`admin.js`** - Área administrativa:
  - Autenticação de administrador
  - Dashboard com vista de restaurantes, clientes e ofertas
  - Sistema de filtros administrativos
  - Renderização paginada de listas
  - Visualização de metadados administrativos (proprietário, data de registo)

- **`main.js`** - Inicialização da aplicação:
  - Event listener para DOM ready
  - Configuração do router baseado em hash
  - Gestão de eventos de navegação
  - Interceptação de cliques em links

---

## Lógica da Aplicação

### Arquitetura e Fluxo

A aplicação segue uma arquitetura **Single Page Application (SPA)** baseada em **hash routing**, onde toda a navegação acontece sem recarregamento da página.

```
┌─────────────────────────────────────────────────────────┐
│                    main.html (DOM)                       │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────▼─────┐           ┌────▼──────┐
    │  Header  │           │   Main    │
    │  + Nav   │           │ (Secções) │
    └──────────┘           └────┬──────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │           │           │           │           │
    ┌───▼───┐  ┌───▼───┐  ┌───▼────┐  ┌──▼──────┐  ┌─▼────┐
    │Início │  │Público│  │Cliente │  │Restaurant│  │Admin │
    └───────┘  └───┬───┘  └───┬────┘  └──┬───────┘  └─┬────┘
                   │          │          │            │
              ┌────▼──────────▼──────────▼────────────▼───┐
              │         JavaScript Modules                 │
              │  ┌──────────────────────────────────────┐ │
              │  │ global.js (Core + Estado + API Calls)│ │
              │  └──────────────────────────────────────┘ │
              │  ┌─────┬─────────┬──────────┬─────────┐  │
              │  │     │         │          │         │  │
              │  │api  │public   │client    │restaurant│  │
              │  │.js  │.js      │.js       │.js      │  │
              │  └─────┴─────────┴──────────┴─────────┘  │
              │              │ admin.js │                 │
              │              └──────────┘                 │
              └────────────────┬──────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   API REST Backend  │
                    │  (Universidade UÉ)  │
                    └─────────────────────┘
```

### Fluxo de Dados por Área

#### Área Pública
```
Utilizador seleciona filtros
    ↓
updatePublicViewMode() / applyOfertasFilter()
    ↓
loadOfertas(params) ou loadRestaurantes(params)
    ↓
API GET → Restaurantes + Ofertas
    ↓
Merge de dados (oferta + info restaurante)
    ↓
Renderização lazy-load (4 items de cada vez)
    ↓
Utilizador clica em oferta → Modal de detalhe
```

#### Área do Cliente
```
1. LOGIN:
   Input (username + ID) → tryClientLogin()
      ↓
   API: loadClientes() → Validação local
      ↓
   Match → showClientDashboard(cliente)
      ↓
   appState.currentClient = cliente

2. NAVEGAÇÃO:
   Dashboard → Mesmo sistema de filtros que área pública
   
3. RESERVA:
   Clique em "Reservar" na modal
      ↓
   Validação: cliente autenticado?
      ↓
   reserveOfertaClient(ofertaId, clienteId, unidades)
      ↓
   API POST /oferta/reserve
      ↓
   Confirmação → Alert com ID da reserva
```

#### Área do Restaurante
```
1. LOGIN:
   Seleção de restaurante no dropdown
      ↓
   loadRestauranteSelector() → API GET restaurantes
      ↓
   Clique "Entrar" → appState.currentRestaurante = {...}

2. INSERIR OFERTA:
   Preenchimento do formulário
      ↓
   Validação: campos obrigatórios + URL válida
      ↓
   insertOfertaRestaurante(payload)
      ↓
   API POST /oferta/insert
      ↓
   Confirmação → Reset do formulário
```

#### Área de Administração
```
1. LOGIN:
   Clique no botão → appState.currentAdmin = { auth: true }
   (Login simplificado para demonstração)

2. VISUALIZAÇÃO:
   Seleção no dropdown: Restaurantes | Clientes | Ofertas
      ↓
   showAdminSelectedView()
      ↓
   loadAdminRestaurantes(q) ou
   loadAdminClientes(q) ou
   loadAdminOfertas(q)
      ↓
   API: admin_restaurante_list, admin_cliente_list, admin_oferta_list
      ↓
   Filtro por query (nome, morada, ID)
      ↓
   renderAdminListChunk() → Renderização paginada
```

### Padrões de Design Utilizados

1. **Module Pattern (IIFE)**: Cada ficheiro JS usa funções anónimas auto-executáveis para evitar poluição do escopo global

2. **Observer Pattern**: Event listeners para mudanças de hash, inputs, cliques

3. **Lazy Loading**: Carregamento progressivo de listas longas

4. **State Management**: Objeto global `appState` centraliza estado da aplicação

5. **API Abstraction**: Funções `apiGet` e `apiPost` encapsulam lógica de comunicação

6. **Component Pattern**: Funções `create*Card()` para criar elementos DOM reutilizáveis

---

## Como Utilizar

### Pré-requisitos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexão à internet (para comunicação com a API)

### Instalação e Execução

1. **Clone o repositório**
   ```bash
   git clone https://github.com/andrefsg05/salvar-comida-webapp.git
   cd salvar-comida-webapp
   ```

2. **Abra o ficheiro HTML**
   ```bash
   # Pode abrir diretamente no navegador
   open src/main.html
   
   # Ou usar um servidor HTTP local (recomendado)
   python -m http.server 8000
   # Aceda: http://localhost:8000/src/main.html
   ```

---

## Âmbito do Projeto

Este projeto foi desenvolvido no âmbito da disciplina de **Tecnologias Web** da **Universidade de Évora**, com o objetivo de aplicar conhecimentos de desenvolvimento web frontend e integração com APIs REST.

### Autores
- André Gonçalves
- André Zhan