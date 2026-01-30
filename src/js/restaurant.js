
(function() {

	/**
	 * Envia uma nova oferta do restaurante para a API e devolve
	 * o resultado da operação.
	 */
	function insertOfertaRestaurante(payload) {
		if (!payload || typeof payload !== 'object') return Promise.resolve({ error: 'payload missing' });
		return apiPost(API.oferta_insert, payload).then(res => {
			if (!res || res.error) return res;
			const ofertaId = res.oferta_id;
			return { status: 'ok', oferta_id: ofertaId, raw: res };
		}).catch(err => ({ error: String(err) }));
	}
	

	/**
	 * Carrega a lista de restaurantes e preenche o `<select>` usado no
	 * login do restaurante.
	 */
	function LoadRestauranteSelector() {
		const sel = document.getElementById('restaurante-select-login');
		if (!sel) return;
		sel.innerHTML = '<option value="">-- Selecionar --</option>';
		apiGet(API.restaurante_list).then(res => {
			if (!res || res.error) return;
			const restaurantes = res.restaurante_set;
			restaurantes.forEach(restaurante => {
				const id = String(getRestauranteId(restaurante));
				const name = restaurante.nome;
				const opt = document.createElement('option');
				opt.value = id;
				opt.textContent = name;
				sel.appendChild(opt);
			});
		}).catch(() => {});
	}


	/**
	 * Mostra a tela de login do restaurante, esconde o dashboard atual e
	 * limpa o estado e o formulário de criação de ofertas.
	 */
	window.showRestauranteLogin = function() {
        appState.currentRestaurante = null;
        const restLoginBox = document.getElementById('restaurante-login');
        const restDashboard = document.getElementById('restaurante-dashboard');
        const restDashboardTitle = document.getElementById('restaurante-dashboard-title');
        
        if (restLoginBox) restLoginBox.style.display = '';
        if (restDashboard) restDashboard.style.display = 'none';
        if (restDashboardTitle) restDashboardTitle.textContent = 'Restaurante: —';
        
		const formRestOferta = document.getElementById('form-restaurante-oferta');
		if (formRestOferta) formRestOferta.reset();
	}
	

	const btnRestLogin = document.getElementById('btn-restaurante-login');
	const restSelect = document.getElementById('restaurante-select-login');
	const restLoginMsg = document.getElementById('restaurante-login-msg');
	const restLoginBox = document.getElementById('restaurante-login');
	const restDashboard = document.getElementById('restaurante-dashboard');
	const restDashboardTitle = document.getElementById('restaurante-dashboard-title');

	if (btnRestLogin && restSelect) {
		btnRestLogin.addEventListener('click', () => {
			const val = (restSelect.value || '').trim();
			if (!val) {
				if (restLoginMsg) { restLoginMsg.style.display = ''; restLoginMsg.textContent = 'Selecione um restaurante antes de entrar.'; }
				return;
			}

			const opt = restSelect.options[restSelect.selectedIndex];
			const rName = opt.textContent;
			appState.currentRestaurante = { restaurante_id: val, nome: rName };
			if (restLoginMsg) { restLoginMsg.style.display = 'none'; restLoginMsg.textContent = ''; }
			if (restLoginBox) restLoginBox.style.display = 'none';
			if (restDashboard) restDashboard.style.display = '';
			if (restDashboardTitle) restDashboardTitle.textContent = 'Restaurante: ' + rName;
			try { alert('Login efetuado com sucesso — ' + rName); } catch (e) {}
		});
	}

	const formRestOferta = document.getElementById('form-restaurante-oferta');
	const restOfertaMsg = document.getElementById('restaurante-oferta-msg');

	if (formRestOferta) {
		formRestOferta.addEventListener('submit', (ev) => {
			// Impede o submit nativo do formulário (que recarregaria a página)
			ev.preventDefault();
			if (!appState.currentRestaurante) {
				if (restOfertaMsg) { restOfertaMsg.style.display = ''; restOfertaMsg.textContent = 'Faça login primeiro.'; }
				return;
			}
			const nome = String(document.getElementById('oferta-nome').value || '').trim();
			const foto = String(document.getElementById('oferta-foto').value || '').trim();
			const descricao = String(document.getElementById('oferta-descricao').value || '').trim();
			const unidades = parseInt(document.getElementById('oferta-unidades').value || '0');

			if (!nome || !foto || !descricao || isNaN(unidades) || unidades <= 0) {
				if (restOfertaMsg) { restOfertaMsg.style.display = ''; restOfertaMsg.textContent = 'Preencha todos os campos obrigatórios (Nome, Foto, Descrição, Unidades) com valores válidos.'; }
				return;
			}
			
			try { new URL(foto); } catch (e) { if (restOfertaMsg) { restOfertaMsg.style.display=''; restOfertaMsg.textContent='A URL da foto não é válida.'; } return; }
			const payload = { nome, foto, descricao, unidades, restaurante_id: parseInt(appState.currentRestaurante.restaurante_id) };
			if (restOfertaMsg) { restOfertaMsg.style.display=''; restOfertaMsg.textContent='A enviar oferta...'; }
			insertOfertaRestaurante(payload).then(res => {
				if (!res || res.error) {
					if (restOfertaMsg) restOfertaMsg.textContent = 'Erro ao inserir oferta: ' + (res && res.error ? res.error : 'erro desconhecido');
					return;
				}
				if (restOfertaMsg) restOfertaMsg.textContent = 'Oferta inserida com sucesso.';
				try { alert('Oferta "' + nome + '" inserida com sucesso.'); } catch (e) { /* ignore if alerts blocked */ }
				formRestOferta.reset();
			}).catch(err => { if (restOfertaMsg) restOfertaMsg.textContent = 'Erro: ' + String(err); });
		});
	}

	LoadRestauranteSelector();
})();