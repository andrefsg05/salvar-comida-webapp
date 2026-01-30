// Estado global da aplicação (entidades autenticadas e informações comuns)
const appState = { 
    currentClient: null, 
    currentRestaurante: null,
    currentAdmin: null
};

// Estado usado para controlar a paginação / lazy-load das listas de ofertas em várias vistas
window.ofertasState = {};
// Estado auxiliar para a área administrativa (pode guardar filtros, paginação, seleção, etc.)
window.adminState = {};

/**
 * Efetua uma requisição HTTP GET para o endpoint `url`.
 * Retorna uma Promise que resolve com o JSON parseado, ou um objeto { error: '...' } em caso de falha.
 */
function apiGet(url, timeout = 15000) {
    return new Promise((resolve) => {
        try {
            var xhttp = new XMLHttpRequest();
            // Trata o ciclo de vida da requisição quando o readyState muda
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4) {
                    if (this.status == 200) {
                        try { resolve(JSON.parse(xhttp.responseText)); } catch (err) { resolve({ error: 'Invalid JSON response' }); }
                    } else {
                        let parsed = null;
                        try { parsed = JSON.parse(xhttp.responseText); } catch (_) { parsed = null; }
                        const msg = parsed && parsed.error ? parsed.error : `HTTP ${this.status}`;
                        resolve({ error: `Request failed: ${msg}` });
                    }
                }
            };
            xhttp.open('GET', url, true);
            xhttp.timeout = timeout;
            xhttp.ontimeout = function() { resolve({ error: 'Request timeout' }); };
            xhttp.onerror = function() { resolve({ error: 'Network error' }); };
            xhttp.send();
        } catch (err) {
            resolve({ error: String(err) });
        }
    });
}

/**
 * Efetua uma requisição HTTP POST para o endpoint `url` usando JSON no corpo.
 * Retorna Promise com o JSON parseado de resposta ou {error: '...'} em caso de falha.
 */
function apiPost(url, body = {}, timeout = 15000) {
    return new Promise((resolve) => {
        try {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4) {
                    if (this.status == 200) {
                        try { resolve(JSON.parse(xhttp.responseText)); } catch (err) { resolve({ error: 'Invalid JSON response' }); }
                    } else {
                        let parsed = null;
                        try { parsed = JSON.parse(xhttp.responseText); } catch (_) { parsed = null; }
                        const msg = parsed && parsed.error ? parsed.error : `HTTP ${this.status}`;
                        resolve({ error: `Request failed: ${msg}` });
                    }
                }
            };
            xhttp.open('POST', url, true);
            xhttp.timeout = timeout;
            // Definimos um Content-Type; se o backend aceitar JSON, idealmente seria 'application/json'.
            // Mantemos o cabeçalho atual por compatibilidade com o backend existente.
            xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhttp.ontimeout = function() { resolve({ error: 'Request timeout' }); };
            xhttp.onerror = function() { resolve({ error: 'Network error' }); };
            xhttp.send(JSON.stringify(body));
        } catch (err) { resolve({ error: String(err) }); }
    });
}

/**
 * Extrai o ID do cliente a partir do objeto cliente (estrutura da API).
 */
function getClientId(cliente) {
    return cliente.cliente_id;
}
/**
 * Extrai o ID do restaurante a partir do objeto restaurante (estrutura da API).
 */
function getRestauranteId(restaurante) {
    return restaurante.restaurante_id;
}

/**
 * Mostra um texto temporário de "a carregar" dentro do elemento lista especificado.
 * Usado antes de iniciar requisições para melhorar a UX.
 */
function setListElementLoading(id, text = 'A carregar...') {
    const c = document.getElementById(id);
    if (!c) return; c.innerHTML = `<p>${text}</p>`;
}

/**
 * Mostra uma mensagem de erro dentro do elemento de lista identificado por `id`.
 */
function showListElementError(id, message) {
    const c = document.getElementById(id);
    if (!c) return; c.innerHTML = `<div class="msg msg-error">${message}</div>`;
}

/**
 * Cria um card DOM que representa um restaurante.
 * - O botão "Ver ofertas" altera filtros/estado consoante a vista (admin / público / cliente).
 */
function createRestaurantCard(restaurante, targetId) { 
    const card = document.createElement('article');
    card.className = 'card';
    const body = document.createElement('div');
    body.className = 'card-body';
    const h = document.createElement('h3'); h.textContent = restaurante.nome; h.className = 'card-title';
    const p = document.createElement('p'); p.textContent = restaurante.localizacao.morada; p.className = 'card-subtitle';
    body.appendChild(h); body.appendChild(p);
    const c = document.createElement('p');
    c.className = 'card-subtitle';
    c.textContent = `Coordenadas: ${restaurante.localizacao.lat}, ${restaurante.localizacao.long}`;
    body.appendChild(c);
    const footer = document.createElement('div'); footer.className = 'card-footer';
    const btn = document.createElement('button');
    btn.textContent = 'Ver ofertas';
    btn.className = 'btn-rest-ver-ofertas';
    
    // O comportamento do clique no botão depende do `targetId`, atualizando a UI e filtros
    btn.onclick = () => {
        const restauranteId = String(getRestauranteId(restaurante));

        if (targetId === 'admin-list-restaurantes' && typeof showAdminSelectedView !== 'undefined') {
            const adminViewSelect = document.getElementById('admin-view-select');
            const adminFilterInput = document.getElementById('admin-filter-input');
            if (adminViewSelect) { adminViewSelect.value = 'ofertas'; }
            if (adminFilterInput) { adminFilterInput.value = restauranteId; }
            showAdminSelectedView();
        } else if (targetId === 'lista-restaurantes' && typeof updatePublicViewMode !== 'undefined') {
            const tipoSel = document.getElementById('filtro-tipo-lista');
            const restSel = document.getElementById('filtro-restaurante-select');
            if (tipoSel) tipoSel.value = 'ofertas';
            if (restSel && restauranteId) restSel.value = restauranteId;
            updatePublicViewMode();
        } else if (targetId === 'cliente-lista-restaurantes' && typeof updateClientViewMode !== 'undefined') {
            const tipoSel = document.getElementById('cliente-filtro-tipo-publico');
            const restSel = document.getElementById('cliente-filtro-restaurante-select');
            if (tipoSel) tipoSel.value = 'ofertas';
            if (restSel && restauranteId) restSel.value = restauranteId;
            updateClientViewMode();
        }
    };
    
    footer.appendChild(btn);

    // No contexto admin, mostramos metadados adicionais (proprietário, data de registo)
    if (targetId === 'admin-list-restaurantes') {
        const adminMeta = document.createElement('div');
        adminMeta.className = 'card-meta-admin';
        let owner = restaurante.proprietario;
        if (owner) {
            const ownerEl = document.createElement('div'); ownerEl.className = 'meta-owner'; ownerEl.textContent = 'Proprietário: ' + owner; adminMeta.appendChild(ownerEl);
        }
        let reg = restaurante.data_de_registo;
        if (reg) {
            reg = String(reg);
            const regEl = document.createElement('div'); regEl.className = 'meta-registro'; regEl.textContent = 'Data de registo: ' + reg; adminMeta.appendChild(regEl);
        }
        if (adminMeta.children && adminMeta.children.length) { body.appendChild(adminMeta); }
    }
    card.appendChild(body); card.appendChild(footer);
    
    return card; 
}

/**
 * Cria um card DOM que representa uma oferta. Coloca dados-chave como propriedades no elemento
 * para permitir acessá-los facilmente ao mostrar a janela de detalhe sem ter que procurar no DOM.
 */
function createOfertaCard(oferta) {
    const card = document.createElement('article');
    card.className = 'card oferta-click';
    // Armazenamos as propriedades diretamente no cartão para recuperação rápida ao abrir a janela
    // de detalhe da oferta sem realizar lookups adicionais.
    card.ofertaId = oferta.oferta_id;
    card.nomeOferta = oferta.nome;
    card.descricaoOferta = oferta.descricao;
    card.unidadesOferta = oferta.unidades;
    card.restauranteNome = (oferta.restaurante && oferta.restaurante.nome) ? oferta.restaurante.nome : (oferta.restaurante_nome || '');
    card.moradaRestaurante = (oferta.restaurante && oferta.restaurante.localizacao && oferta.restaurante.localizacao.morada) ? oferta.restaurante.localizacao.morada : (oferta.morada || '');
    if (oferta.restaurante && oferta.restaurante.localizacao && oferta.restaurante.localizacao.lat != null && oferta.restaurante.localizacao.long != null) {
        card.coordsRestaurante = `${oferta.restaurante.localizacao.lat}, ${oferta.restaurante.localizacao.long}`;
    } else {
        card.coordsRestaurante = oferta.coordenadas || '';
    }
    const img = document.createElement('img'); img.src = oferta.foto; img.alt = oferta.nome; card.appendChild(img); 
    const body = document.createElement('div'); body.className = 'card-body';
    const h = document.createElement('h3'); h.className = 'card-title'; h.textContent = oferta.nome;
    const p = document.createElement('p'); p.className = 'card-subtitle'; p.textContent = oferta.descricao;
    const meta = document.createElement('div'); meta.className = 'card-meta'; meta.textContent = `Unidades: ${oferta.unidades}`;
    body.appendChild(h); body.appendChild(p); body.appendChild(meta);
    card.appendChild(body);
    return card;
}

/**
 * Cria um card DOM com informação de um cliente. Em contexto admin, também mostra data de registo.
 */
function createClienteCard(cliente, targetId) {
    const card = document.createElement('article');
    card.className = 'card';
    const body = document.createElement('div'); body.className = 'card-body';
    const h = document.createElement('h3'); h.className = 'card-title'; h.textContent = cliente.nome;
    const meta = document.createElement('div'); meta.className = 'card-subtitle';
    const idVal = getClientId(cliente);
    meta.textContent = 'ID: ' + idVal;
    body.appendChild(h); body.appendChild(meta);
    if (targetId === 'admin-list-clientes') {
        let reg = cliente.data_de_registo;
        if (reg) {
                reg = String(reg);
                const regEl = document.createElement('div'); regEl.className = 'meta-registro'; regEl.textContent = 'Data registo: ' + reg; const adminMeta = document.createElement('div'); adminMeta.className = 'card-meta-admin'; adminMeta.appendChild(regEl); body.appendChild(adminMeta);
            }
    }
    card.appendChild(body);
    return card;
}

/**
 * Carrega a lista de restaurantes a partir da API e renderiza no elemento com `targetId`.
 * Suporta filtragem por string de pesquisa (params.q ou params.search).
 */
function loadRestaurantes(params = {}, targetId = 'lista-restaurantes') {
    setListElementLoading(targetId, 'A carregar restaurantes...');
    return apiGet(API.restaurante_list).then(res => {
        if (!res || res.error) {
            showListElementError(targetId, res ? (res.error || 'Erro desconhecido') : 'Resposta vazia');
            return [];
        }
        let restaurantes = res.restaurante_set;

        // Se foi passado um parâmetro de pesquisa, filtra nome e morada dos restaurantes
        if (params && Object.keys(params).length) {
            const q = (params.q || params.search || '').toString().trim().toLowerCase();
            if (q) {
                restaurantes = restaurantes.filter(restaurante => {
                    const nome = (restaurante.nome).toString().toLowerCase();
                    const morada = restaurante.localizacao.morada.toString().toLowerCase();
                    return nome.includes(q) || morada.includes(q);
                });
            }
        }

        const listElement = document.getElementById(targetId);
        if (!listElement) return restaurantes;
        listElement.innerHTML = '';
        if (!Array.isArray(restaurantes) || restaurantes.length === 0) { listElement.innerHTML = '<p>Sem restaurantes.</p>'; return restaurantes; }
        restaurantes.forEach(restaurante => listElement.appendChild(createRestaurantCard(restaurante, targetId)));
        return restaurantes;
    }).catch(err => { showListElementError(targetId, String(err)); return []; });
}

/**
 * Carrega ofertas e, renderiza chunks de 4 itens de cada vez.
 * Também faz lookup de restaurantes para ligar informações de restaurante às ofertas.
 */
function loadOfertas(params = {}, targetId = 'lista-ofertas') {
    setListElementLoading(targetId, 'A carregar ofertas...');
    return Promise.all([
        apiGet(API.oferta_list),
        apiGet(API.restaurante_list)
    ]).then(([ofertaRes, restRes]) => {
        if (!ofertaRes || ofertaRes.error) {
            showListElementError(targetId, ofertaRes ? (ofertaRes.error || 'Erro desconhecido') : 'Resposta vazia');
            return;
        }
        let ofertas = ofertaRes.oferta_set;
        const restaurantes = (restRes && !restRes.error) ? restRes.restaurante_set : [];
        const restauranteById = new Map();
        restaurantes.forEach(restaurante => {
            const id = String(getRestauranteId(restaurante));
            if (!id) return;
            restauranteById.set(id, restaurante);
        });

        // Aplica filtros por restaurante e texto (nome/descrição).
        if (params && Object.keys(params).length) {
            if (params.restaurante != null && params.restaurante !== "") {
                const restauranteId = String(params.restaurante);
                ofertas = ofertas.filter(oferta => {
                    const rid = String(oferta.restaurante_id);
                    return rid === restauranteId;
                });
            }
            const q = (params.q || params.search || '').toString().trim().toLowerCase();
            if (q) {
                ofertas = ofertas.filter(oferta => {
                    const nome = (oferta.nome).toString().toLowerCase();
                    const descricao = (oferta.descricao).toString().toLowerCase();
                    const rid = String(oferta.restaurante_id).toLowerCase();
                    return nome.includes(q) || descricao.includes(q) || rid.includes(q);
                });
            }
        }
        const listElement = document.getElementById(targetId);
        if (!listElement) return ofertas;

        // Inicializa / atualiza o estado das ofertas usado para renderização em pedaços
        if (!window.ofertasState) window.ofertasState = {};
        window.ofertasState[targetId] = {
            all: ofertas.map(oferta => {
                const ofertaComRestaurante = Object.assign({}, oferta);
                const rid = ofertaComRestaurante.restaurante_id != null ? String(ofertaComRestaurante.restaurante_id) : String(ofertaComRestaurante.restaurante || '');
                const restauranteInfo = rid && restauranteById.has(rid) ? restauranteById.get(rid) : null;
                if (restauranteInfo) { ofertaComRestaurante.restaurante = restauranteInfo; }
                return ofertaComRestaurante;
            }),
            shown: 0
        };

        // Renderiza o próximo bloco de 4 ofertas e atualiza o botão "mostrar mais"
        function renderNextChunk() {
            const state = window.ofertasState[targetId];
            if (!state) return;
            const start = state.shown;
            const next = state.all.slice(start, start + 4);
            next.forEach(o => {
                listElement.appendChild(createOfertaCard(o));
            });
            state.shown += next.length;
            attachOfertaWindowHandlers();

            const btnId = (targetId === 'cliente-lista-ofertas') ? 'btn-cliente-ofertas-mais' : 'btn-ofertas-mais';
            const btn = document.getElementById(btnId);
            if (btn) {
                if (state.shown >= state.all.length) btn.style.display = 'none';
                else btn.style.display = '';
            }
        }

        // Limpa o conteúdo da lista antes de renderizar o primeiro bloco
        listElement.innerHTML = '';
        renderNextChunk();

        // Liga o botão "Mostrar mais" correto (público ou cliente)
        const moreBtnId = (targetId === 'cliente-lista-ofertas')
            ? 'btn-cliente-ofertas-mais'
            : 'btn-ofertas-mais';
        const moreBtn = document.getElementById(moreBtnId);
        if (moreBtn && !moreBtn.__boundMostrarMais) {
            moreBtn.addEventListener('click', renderNextChunk);
            moreBtn.__boundMostrarMais = true;
        }

        return ofertas;
    }).catch(err => { showListElementError(targetId, String(err)); return []; });
}

/**
 * Carrega a lista de clientes da API e retorna um array (ou [] em caso de erro).
 */
function loadClientes() {
    return apiGet(API.cliente_list).then(res => {
        if (!res || res.error) return [];
        const clientes = res.cliente_set;
        return Array.isArray(clientes) ? clientes : [];
    }).catch(() => []);
}

const sections = Array.from(document.querySelectorAll('main#app > section'));
const navLinks = Array.from(document.querySelectorAll('nav.main-nav a'));

/**
 * Mostra a vista definida por `viewId`, esconde as restantes e atualiza a classe `active`
 * nos links de navegação. Também aciona atualizações específicas de cada vista.
 */
function showView(viewId) {
    let found = false;
    sections.forEach(s => {
        if (s.id === viewId) {
            s.style.display = 'block';
            found = true;
        } else {
            s.style.display = 'none';
        }
    });

    navLinks.forEach(a => {
        const target = a.getAttribute('href') || '';
        if (target === '#' + viewId) a.classList.add('active');
        else a.classList.remove('active');
    });

    if (!found && viewId !== 'inicio') { showView('inicio'); }

    if (viewId !== 'cliente' && appState.currentClient && typeof showClientLogin !== 'undefined') { showClientLogin(); }
    if (viewId !== 'admin' && appState.currentAdmin && typeof showAdminLogin !== 'undefined') { showAdminLogin(); }
    if (viewId !== 'restaurante' && appState.currentRestaurante && typeof showRestauranteLogin !== 'undefined') { showRestauranteLogin(); }

    if (viewId === 'public' && typeof updatePublicViewMode !== 'undefined') {
         updatePublicViewMode();
    }
}

// Atualiza a vista ativa quando o hash na URL mudar
function handleHashChange() {
    const name = window.location.hash.replace('#', '') || 'inicio';
    showView(name);
}

// ID da oferta atualmente visualizada na janela de detalhe
let activeOfertaId = null; 

/**
 * Anexa manipuladores de evento aos cards de oferta e controla a janela de detalhe de oferta.
 * - Preenche os campos da janela com informações do card clicado
 * - Implementa a lógica do botão "Reservar" (validações, mudança de vista, chamadas à API)
 */
function attachOfertaWindowHandlers() {
    const windowEl = document.getElementById('oferta-window');
    if (!windowEl) return;
    const nomeEl = document.getElementById('oferta-window-nome');
    const descEl = document.getElementById('oferta-window-descricao');
    const restEl = document.getElementById('oferta-window-restaurante');
    const moradaEl = document.getElementById('oferta-window-morada');
    const coordsEl = document.getElementById('oferta-window-coords');
    const unidadesEl = document.getElementById('oferta-window-unidades');
    const imgEl = document.getElementById('oferta-window-imagem');
    const btn = document.getElementById('oferta-window-reservar');

    function hide() {
        windowEl.classList.remove('oferta-window-visible');
        windowEl.setAttribute('aria-hidden', 'true');
    }
    
    const currentView = (window.location.hash.replace('#','') || 'inicio');
    const isAdminView = currentView === 'admin';

    if (btn) {
        btn.style.display = isAdminView ? 'none' : '';
        
        if (!isAdminView && !btn.__boundReserveHandler) { 
            btn.onclick = () => {
                const viewOnReserveClick = (window.location.hash.replace('#','') || 'inicio');

                // Se não estivermos na vista cliente, redirecionamos para ela
                if (viewOnReserveClick !== 'cliente') {
                    if (!confirm('Precisa de entrar na área do cliente para reservar. Quer entrar agora?')) return;
                    hide();
                    setTimeout(() => { window.location.hash = 'cliente'; }, 0);
                    return;
                }

                if (viewOnReserveClick === 'cliente' && typeof reserveOfertaClient !== 'undefined') {
                    const ofertaId = activeOfertaId;
                    if (!ofertaId) { alert('ID da oferta não encontrado — não foi possível reservar.'); return; }
                    if (!confirm('Confirmar reserva da oferta "' + (document.getElementById('oferta-window-nome')?.textContent || ofertaId) + '" ?')) return;

                    btn.disabled = true;
                    const prev = btn.textContent;
                    btn.textContent = 'A reservar...';

                    const cliente = appState.currentClient;
                    if (!cliente) {
                        alert('Precisa de entrar na área do cliente antes de reservar.');
                        btn.disabled = false;
                        btn.textContent = prev;
                        hide();
                        setTimeout(() => { window.location.hash = 'cliente'; }, 0);
                        return;
                    }

                    const clienteId = getClientId(cliente);
                    if (!clienteId) {
                        btn.disabled = false;
                        btn.textContent = prev;
                        alert('ID do cliente não encontrado — não foi possível reservar.');
                        return;
                    }
                    reserveOfertaClient(ofertaId, clienteId).then(result => {
                        btn.disabled = false;
                        btn.textContent = prev;
                        if (!result || result.error) {
                            alert('Reserva falhou: ' + (result && (result.error || result.mensagem) ? (result.error || result.mensagem) : 'erro desconhecido'));
                        } else {
                            alert(result.status === 'ok' ? ('Reserva efetuada com sucesso! ID da reserva: ' + result.reserva_id) : 'Reserva falhou: resposta inesperada do servidor.');
                            hide();
                        }
                    }).catch(err => {
                        btn.disabled = false;
                        btn.textContent = prev;
                        alert('Erro: ' + err);
                    });
                    return;
                }
            };
            btn.__boundReserveHandler = true;
        }
    }

    // Liga um handler de clique em todos os cards de oferta criados dinamicamente.
    // Ao clicar num card, abrimos a "janela" de detalhe e preenchermos os campos
    // com as propriedades previamente guardadas no elemento DOM pelo createOfertaCard.
    const cards = document.querySelectorAll('.oferta-click');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            if (!windowEl) return;
            
            activeOfertaId = card.ofertaId;

            const isAdminClick = window.location.hash.replace('#','') === 'admin';
            if (btn) { btn.style.display = isAdminClick ? 'none' : ''; }
            
            nomeEl.textContent = card.nomeOferta;
            descEl.textContent = card.descricaoOferta;
            unidadesEl.innerHTML = '<b>Unidades:</b> ' + card.unidadesOferta;
            restEl.innerHTML = '<b>Restaurante:</b> ' + card.restauranteNome;
            moradaEl.innerHTML = '<b>Morada:</b> ' + card.moradaRestaurante;
            coordsEl.innerHTML = '<b>Coordenadas:</b> ' + card.coordsRestaurante;

            if (imgEl) {
                const img = card.querySelector('img');
                if (img) {
                    imgEl.src = img.src;
                    imgEl.style.display = '';
                } else {
                    imgEl.src = '';
                    imgEl.style.display = 'none';
                }
            }

            windowEl.classList.add('oferta-window-visible');
            windowEl.setAttribute('aria-hidden', 'false');
        });
    });

    windowEl.onclick = (ev) => { if (ev.target === windowEl) hide(); };

    if (!window.__ofertaTooltipEscBound) {
        window.addEventListener('keydown', (ev) => {
            if (ev.key === 'Escape') hide();
        });
        window.__ofertaTooltipEscBound = true;
    }
}