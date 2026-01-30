(function() {
    /**
     * Renderiza um conjunto de itens de uma lista do painel de administração
     * (restaurantes, clientes ou ofertas), suportando o comportamento de
     * "Mostrar mais" para a lista de ofertas.
     */
    window.renderAdminListChunk = function(targetId, chunkSize = 4) {

        const state = window.adminState[targetId];
        const listElement = document.getElementById(targetId);
        if (!state || !listElement) return;

        const start = state.shown;
        const effectiveChunkSize = (targetId === 'admin-list-ofertas') ? chunkSize : state.all.length;
        const next = state.all.slice(start, start + effectiveChunkSize);
        
        let createCard;
        if (targetId === 'admin-list-restaurantes') createCard = createRestaurantCard;
        else if (targetId === 'admin-list-clientes') createCard = createClienteCard;
        else if (targetId === 'admin-list-ofertas') createCard = createOfertaCard;
        else return;

        next.forEach(item => {
            listElement.appendChild(createCard(item, targetId));
        });
        state.shown += next.length;

        const btn = document.getElementById('btn-admin-mostrar-mais');
        if (btn) {
            if (targetId === 'admin-list-ofertas') {
                if (state.shown >= state.all.length) btn.style.display = 'none';
                else btn.style.display = '';
                btn.__activeTarget = targetId;
            } else {
                btn.style.display = 'none';
                btn.__activeTarget = null;
            }
        }
        if (btn && !btn.__boundAdminMostrarMais) {
            btn.addEventListener('click', () => {
                if (btn.__activeTarget === 'admin-list-ofertas') { window.renderAdminListChunk(btn.__activeTarget); }
            });
            btn.__boundAdminMostrarMais = true;
        }
        if (targetId === 'admin-list-ofertas' && typeof attachOfertaWindowHandlers !== 'undefined') { attachOfertaWindowHandlers(); }
    }

    /**
     * Carrega a lista de restaurantes para o painel de administração,
     * aplica o filtro de pesquisa e atualiza o respetivo contentor.
     */
    function loadAdminRestaurantes(q = '') {
        const targetId = 'admin-list-restaurantes';
        if (!adminListRestaurantes) return Promise.resolve([]);
        setListElementLoading(targetId, 'A carregar restaurantes...');
        return apiGet(API.admin_restaurante_list).then(res => {
            if (!res || res.error) { showListElementError(targetId, res ? (res.error || 'Desconhecido') : 'Resposta vazia'); return []; }
            
            let restaurantes = res.restaurante_set;
            
            if (q) {
                const qq = String(q).trim().toLowerCase();
                restaurantes = restaurantes.filter(restaurante => {
                    const nome = (restaurante.nome || '').toString().toLowerCase();
                    const morada = (restaurante.localizacao && restaurante.localizacao.morada) ? restaurante.localizacao.morada.toString().toLowerCase() : '';
                    const id = (getRestauranteId(restaurante) || '').toString();
                    return nome.includes(qq) || morada.includes(qq) || id.includes(qq);
                });
            }
            if (!window.adminState) window.adminState = {};
            window.adminState[targetId] = { all: restaurantes, shown: 0 };
            adminListRestaurantes.innerHTML = '';
            if (restaurantes.length === 0) { adminListRestaurantes.innerHTML = '<p>Sem restaurantes.</p>'; }
            window.renderAdminListChunk(targetId);
            return restaurantes;

        }).catch(err => { showListElementError(targetId, 'Erro: ' + String(err)); return []; });
    }

    /**
     * Carrega a lista de clientes para o painel de administração,
     * aplica o filtro de pesquisa e atualiza o respetivo contentor.
     */
    function loadAdminClientes(q = '') {
        const targetId = 'admin-list-clientes';
        if (!adminListClientes) return Promise.resolve([]);
        setListElementLoading(targetId, 'A carregar clientes...');
        
        return apiGet(API.admin_cliente_list).then(res => {
            if (!res || res.error) { showListElementError(targetId, res ? (res.error || 'Desconhecido') : 'Resposta vazia'); return []; }
            
            let clientes = res.cliente_set;
            
            if (q) {
                const qq = String(q).trim().toLowerCase();
                clientes = clientes.filter(cliente => {
                    const nome = (cliente.nome || cliente.username || '').toString().toLowerCase();
                    const morada = (cliente.morada || (cliente.endereco && cliente.endereco.morada) || '').toString().toLowerCase();
                    const id = (getClientId(cliente) || '').toString();
                    return nome.includes(qq) || morada.includes(qq) || id.includes(qq);
                });
            }
            
            if (!window.adminState) window.adminState = {};
            window.adminState[targetId] = { all: clientes, shown: 0 };
            adminListClientes.innerHTML = '';
            if (clientes.length === 0) { adminListClientes.innerHTML = '<p>Sem clientes.</p>'; }
            
            window.renderAdminListChunk(targetId);
            return clientes;
            
        }).catch(err => { showListElementError(targetId, 'Erro: ' + String(err)); return []; });
    }

    /**
     * Carrega ofertas e restaurantes em paralelo, associa o restaurante a
     * cada oferta, aplica o filtro de pesquisa e atualiza o contentor.
     */
    function loadAdminOfertas(q = '') {
        const targetId = 'admin-list-ofertas';
        if (!adminListOfertas) return Promise.resolve([]);
        setListElementLoading(targetId, 'A carregar ofertas...');
        
        return Promise.all([ apiGet(API.admin_oferta_list), apiGet(API.restaurante_list) ]).then(([ofertaRes, restRes]) => {
            if (!ofertaRes || ofertaRes.error) { showListElementError(targetId, ofertaRes ? (ofertaRes.error || 'Desconhecido') : 'Resposta vazia'); return []; }
            
            let ofertas = ofertaRes.oferta_set;
            const restaurants = (restRes && !restRes.error) ? (restRes.restaurante_set) : [];
            const restaurantById = new Map();
            restaurants.forEach(restaurant => {
                const id = getRestauranteId(restaurant) != null ? String(getRestauranteId(restaurant)) : null;
                if (!id) return;
                restaurantById.set(id, restaurant);
            });

            ofertas = ofertas.map(oferta => {
                const ofertaComRestaurante = Object.assign({}, oferta);
                const rid = ofertaComRestaurante.restaurante_id != null ? String(ofertaComRestaurante.restaurante_id) : String(ofertaComRestaurante.restaurante || '');
                const restauranteInfo = rid && restaurantById.has(rid) ? restaurantById.get(rid) : null;
                if (restauranteInfo) { ofertaComRestaurante.restaurante = restauranteInfo; ofertaComRestaurante.restaurante_nome = restauranteInfo.nome; }
                return ofertaComRestaurante;
            });

            if (q) {
                const qq = String(q).trim().toLowerCase();
                ofertas = ofertas.filter(oferta => {
                    const nome = (oferta.nome || '').toString().toLowerCase();
                    const descricao = (oferta.descricao || '').toString().toLowerCase();
                    const restNome = (oferta.restaurante_nome || '').toString().toLowerCase();
                    const rid = String(oferta.restaurante_id || oferta.restaurante || '').toLowerCase();
                    const oid = String(oferta.oferta_id || oferta.id || oferta.id_oferta || oferta._id || '').toLowerCase();
                    return nome.includes(qq) || descricao.includes(qq) || restNome.includes(qq) || rid.includes(qq) || oid.includes(qq);
                });
            }
            
            if (!window.adminState) window.adminState = {};
            window.adminState[targetId] = { all: ofertas, shown: 0 };
            adminListOfertas.innerHTML = '';
            if (ofertas.length === 0) { adminListOfertas.innerHTML = '<p>Sem ofertas.</p>'; }
            
            window.renderAdminListChunk(targetId);
            return ofertas;
            
        }).catch(err => { showListElementError(targetId, 'Erro: ' + String(err)); return []; });
    }
    
    /**
     * Mostra a lista de restaurantes, clientes ou ofertas conforme o
     * valor selecionado no `<select>` e recarrega os dados com o filtro atual.
     */
    window.showAdminSelectedView = function() {
        if (!adminViewSelect) return;
        const val = adminViewSelect.value || 'ofertas';
        
        if (adminListRestaurantes) adminListRestaurantes.style.display = (val === 'restaurantes') ? '' : 'none';
        if (adminListClientes) adminListClientes.style.display = (val === 'clientes') ? '' : 'none';
        if (adminListOfertas) adminListOfertas.style.display = (val === 'ofertas') ? '' : 'none';
        
        const q = adminFilterInput ? adminFilterInput.value.trim() : '';
        
        if (val === 'restaurantes') return loadAdminRestaurantes(q); 
        if (val === 'clientes') return loadAdminClientes(q);
        return loadAdminOfertas(q);
    }

    /**
     * Regressa ao ecrã de login de administrador, limpando o estado e
     * escondendo o dashboard.
     */
    window.showAdminLogin = function() {
        appState.currentAdmin = null;
        if (adminLoginBox) adminLoginBox.style.display = '';
        if (adminDashboard) adminDashboard.style.display = 'none';
        if (adminLoginMsg) { adminLoginMsg.style.display = 'none'; adminLoginMsg.textContent = ''; }
    }
    
    const btnAdminLogin = document.getElementById('btn-admin-login');
    const adminLoginBox = document.getElementById('admin-login');
    const adminLoginMsg = document.getElementById('admin-login-msg');
    const adminDashboard = document.getElementById('admin-dashboard');
    const adminViewSelect = document.getElementById('admin-view-select');
    const adminFilterInput = document.getElementById('admin-filter-input');
    const adminListRestaurantes = document.getElementById('admin-list-restaurantes');
    const adminListClientes = document.getElementById('admin-list-clientes');
    const adminListOfertas = document.getElementById('admin-list-ofertas');
    
    if (btnAdminLogin && adminLoginBox && adminDashboard) {
        btnAdminLogin.addEventListener('click', () => {
            appState.currentAdmin = { auth: true };
            adminLoginBox.style.display = 'none';
            adminDashboard.style.display = '';
            if (adminLoginMsg) { adminLoginMsg.style.display = 'none'; adminLoginMsg.textContent = ''; }
            if (adminViewSelect) adminViewSelect.value = 'ofertas';
            window.showAdminSelectedView();
            try { alert('Login como administrador efetuado com sucesso.'); } catch (e) {}
        });
    }

    if (adminViewSelect) {
        adminViewSelect.addEventListener('change', window.showAdminSelectedView);
    }

    if (adminFilterInput) {
        const run = () => { window.showAdminSelectedView(); };
        adminFilterInput.addEventListener('input', run);
        adminFilterInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') { adminFilterInput.value = ''; run(); } });
    }

})();