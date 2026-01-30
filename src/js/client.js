(function() {
    /**
     * Reserva uma oferta para um cliente através da API.
     */
    function reserveOfertaClient(ofertaId, clienteId, unidades = 1) {
        if (!ofertaId) return Promise.resolve({ error: 'ofertaId missing' });
        if (!clienteId) return Promise.resolve({ error: 'clienteId missing' });
        const body = { 
            oferta_id: parseInt(ofertaId),
            cliente_id: parseInt(clienteId),
            unidades: parseInt(unidades)
        };
        
        return apiPost(API.oferta_reserve, body).then(res => {
            if (res && res.reserva_id) {
                return { status: 'ok', reserva_id: res.reserva_id };
            }
            return res;
        }).catch(err => ({ error: String(err) }));
    }
    window.reserveOfertaClient = reserveOfertaClient;

    /**
     * Mostra o dashboard do cliente autenticado e atualiza os elementos de UI
     * (nome, ID e área de ofertas), carregando também os filtros iniciais.
     */
    function showClientDashboard(client) {
        if (!client) return;
        appState.currentClient = client;
        const login = document.getElementById('cliente-login');
        const dash = document.getElementById('cliente-dashboard');
        const offersArea = document.getElementById('cliente-offers-area');
        
        if (login) login.style.display = 'none';
        if (dash) dash.style.display = '';
        if (offersArea) offersArea.style.display = '';
        const nameEl = document.getElementById('cliente-nome');
        const idEl = document.getElementById('cliente-id-label');
        if (nameEl) nameEl.textContent = 'Cliente: ' + client.nome;
        if (idEl) idEl.textContent = 'ID: ' + getClientId(client);

        try { alert('Login efetuado com sucesso — bem-vindo ' + client.nome + '!'); } catch (e) {}
        loadClientRestaurantOptions(); 
        updateClientViewMode(); 
    }
    
    /**
     * Regressa ao ecrã de login do cliente, limpando o estado atual.
     */
    window.showClientLogin = function() {
        appState.currentClient = null;
        const login = document.getElementById('cliente-login');
        const dash = document.getElementById('cliente-dashboard');
        if (login) login.style.display = '';
        if (dash) dash.style.display = 'none';
        const nameEl = document.getElementById('cliente-nome');
        const idEl = document.getElementById('cliente-id-label');
        if (nameEl) nameEl.textContent = 'Cliente: —';
        if (idEl) idEl.textContent = 'ID: —';
    }

    const clientFiltroTipoPublico = document.getElementById('cliente-filtro-tipo-publico');
    const clientFiltroRestSelect = document.getElementById('cliente-filtro-restaurante-select');
    const clientFiltroRestLabel = document.getElementById('cliente-label-filtro-restaurante');
    const clientFiltroRestauranteInput = document.getElementById('cliente-filtro-restaurante-input');
    const clientFiltroComidaInput = document.getElementById('cliente-filtro-comida-input');
    const clientListElementOfertas = document.getElementById('cliente-lista-ofertas');
    const clientListElementRestaurantes = document.getElementById('cliente-lista-restaurantes');

    /**
     * Carrega restaurantes para o `<select>` de filtro da área do cliente.
     */
    function loadClientRestaurantOptions() {
        if (!clientFiltroRestSelect) return;
        clientFiltroRestSelect.innerHTML = '<option value="">Todos os restaurantes</option>';
        apiGet(API.restaurante_list).then(res => {
            if (!res || res.error) return;
            const restaurantes = res.restaurante_set;
            
            restaurantes.forEach(restaurante => {
                const id = getRestauranteId(restaurante) != null ? String(getRestauranteId(restaurante)) : '';
                if (!id) return;
                const opt = document.createElement('option');
                opt.value = id;
                opt.textContent = restaurante.nome || ('Restaurante ' + id);
                clientFiltroRestSelect.appendChild(opt);
            });
        });
    }

    /**
     * Aplica os filtros de restaurante e pesquisa de comida na lista de ofertas
     * do cliente, chamando `loadOfertas` com os parâmetros adequados.
     */
    function applyClientOfertasFilter() {
        const rid = clientFiltroRestSelect ? clientFiltroRestSelect.value : '';
        const q = clientFiltroComidaInput ? clientFiltroComidaInput.value.trim() : '';
        const params = {};
        if (rid) params.restaurante = rid;
        if (q) params.q = q;
        loadOfertas(params, 'cliente-lista-ofertas'); // Assume-se que 'loadOfertas' esta definido globalmente.
    }

    /**
     * Alterna a vista do dashboard do cliente entre a lista de ofertas e
     * a lista de restaurantes, ajustando filtros e conteúdo apresentados.
     */
    window.updateClientViewMode = function() {
        const mode = clientFiltroTipoPublico ? clientFiltroTipoPublico.value : 'ofertas';
        
        if (mode === 'restaurantes') {
            if (clientListElementOfertas) clientListElementOfertas.style.display = 'none';
            if (clientListElementRestaurantes) clientListElementRestaurantes.style.display = '';
            if (clientFiltroRestLabel) clientFiltroRestLabel.style.display = 'none';
            if (clientFiltroRestSelect) clientFiltroRestSelect.style.display = 'none';
            if (clientFiltroComidaInput) clientFiltroComidaInput.style.display = 'none';
            if (clientFiltroRestauranteInput) clientFiltroRestauranteInput.style.display = '';
            const btn = document.getElementById('btn-cliente-ofertas-mais');
            if (btn) btn.style.display = 'none';
            loadRestaurantes({}, 'cliente-lista-restaurantes'); // Assume-se que 'loadRestaurantes' esta definido globalmente.
            
        } else {
            if (clientListElementOfertas) clientListElementOfertas.style.display = '';
            if (clientListElementRestaurantes) clientListElementRestaurantes.style.display = 'none';
            if (clientFiltroRestLabel) clientFiltroRestLabel.style.display = '';
            if (clientFiltroRestSelect) clientFiltroRestSelect.style.display = '';
            if (clientFiltroComidaInput) clientFiltroComidaInput.style.display = '';
            if (clientFiltroRestauranteInput) clientFiltroRestauranteInput.style.display = 'none';
            applyClientOfertasFilter();
        }
    }
    
    /**
     * Tenta autenticar um cliente comparando ID e username com a lista vinda
     * da API. Em caso de sucesso, abre o dashboard do cliente.
     */
    function tryClientLogin(username, id) {
        const msgEl = document.getElementById('cliente-login-msg');
        if (msgEl) { msgEl.style.display = 'none'; msgEl.textContent = ''; }
        if (!username || !id) { return Promise.resolve(null); }
        return loadClientes().then(clientes => {
            const qId = String(id).trim();
            const qUser = String(username).trim().toLowerCase();
            
            const found = clientes.find(cliente => {
                const cid = String(getClientId(cliente)).trim();
                const uname = String(cliente.username).trim().toLowerCase();
                return cid === qId && uname === qUser;
            });
            
            if (!found) {
                if (msgEl) { msgEl.style.display = ''; msgEl.textContent = 'Credenciais inválidas. Certifique-se que o ID e username correspondem ao mesmo cliente.'; }
                return null;
            }
            showClientDashboard(found);
            return found;
        });
    }


    const formLogin = document.getElementById('form-cliente-login');
    if (formLogin) {
        formLogin.addEventListener('submit', (ev) => {
            ev.preventDefault();
            const username = document.getElementById('cliente-username').value || '';
            const id = document.getElementById('cliente-id').value || '';
            tryClientLogin(username, id);
        });
    }
    if (clientFiltroTipoPublico) { clientFiltroTipoPublico.addEventListener('change', window.updateClientViewMode); }
    if (clientFiltroRestSelect) { clientFiltroRestSelect.addEventListener('change', applyClientOfertasFilter); }
    if (clientFiltroComidaInput) {
        clientFiltroComidaInput.addEventListener('input', applyClientOfertasFilter);
        clientFiltroComidaInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') { clientFiltroComidaInput.value = ''; applyClientOfertasFilter(); } });
    }
    if (clientFiltroRestauranteInput) {
        clientFiltroRestauranteInput.style.display = 'none';
        const runClientRest = () => { loadRestaurantes({ q: clientFiltroRestauranteInput.value.trim() }, 'cliente-lista-restaurantes'); };
        
        clientFiltroRestauranteInput.addEventListener('input', runClientRest);
        clientFiltroRestauranteInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') { clientFiltroRestauranteInput.value = ''; runClientRest(); } });
    }
    
})();