(function() {
    const filtroTipoPublico = document.getElementById('filtro-tipo-lista');
    const filtroRestSelect = document.getElementById('filtro-restaurante-select');
    const filtroRestLabel = document.getElementById('label-filtro-restaurante');
    const filtroRestauranteInput = document.getElementById('filtro-restaurante-input');
    const filtroComidaInput = document.getElementById('filtro-comida-input');
    const listElementOfertasPublic = document.getElementById('lista-ofertas');
    const listElementRestaurantesPublic = document.getElementById('lista-restaurantes');

    /**
     * Carrega a lista de restaurantes para o `<select>` de filtro da área
     * pública, permitindo filtrar ofertas por restaurante.
     */
    function LoadPublicRestauranteOptions() {
        if (!filtroRestSelect) return;
        filtroRestSelect.innerHTML = '<option value="">Todos os restaurantes</option>';
        apiGet(API.restaurante_list).then(res => {
            if (!res || res.error) return;
            const restaurantes = res.restaurante_set;
            restaurantes.forEach(restaurante => {
                const id = String(getRestauranteId(restaurante));
                if (!id) return;
                const opt = document.createElement('option');
                opt.value = id;
                opt.textContent = restaurante.nome;
                filtroRestSelect.appendChild(opt);
            });
        });
    }

    /**
     * Recolhe os filtros atuais (restaurante e pesquisa de comida) e invoca
     * `loadOfertas` para atualizar a lista de ofertas públicas.
     */
    function applyOfertasFilter() {
        const rid = filtroRestSelect ? filtroRestSelect.value : '';
        const q = filtroComidaInput ? filtroComidaInput.value.trim() : '';
        const params = {};
        if (rid) params.restaurante = rid;
        if (q) params.q = q;

        loadOfertas(params, 'lista-ofertas');
    }

    /**
     * Alterna a vista pública entre lista de ofertas e lista de restaurantes,
     * ajustando a visibilidade dos filtros e dos respetivos contentores.
     */
    window.updatePublicViewMode = function() {
        const mode = filtroTipoPublico ? filtroTipoPublico.value : 'ofertas';
        if (mode === 'restaurantes') {
            if (listElementOfertasPublic) listElementOfertasPublic.style.display = 'none';
            if (listElementRestaurantesPublic) listElementRestaurantesPublic.style.display = '';
            if (filtroRestLabel) filtroRestLabel.style.display = 'none';
            if (filtroRestSelect) filtroRestSelect.style.display = 'none';
            if (filtroComidaInput) filtroComidaInput.style.display = 'none';
            if (filtroRestauranteInput) filtroRestauranteInput.style.display = '';
            const btn = document.getElementById('btn-ofertas-mais');
            if (btn) btn.style.display = 'none';
            loadRestaurantes({}, 'lista-restaurantes');
        } else {
            if (listElementOfertasPublic) listElementOfertasPublic.style.display = '';
            if (listElementRestaurantesPublic) listElementRestaurantesPublic.style.display = 'none';
            if (filtroRestLabel) filtroRestLabel.style.display = '';
            if (filtroRestSelect) filtroRestSelect.style.display = '';
            if (filtroComidaInput) filtroComidaInput.style.display = '';
            if (filtroRestauranteInput) filtroRestauranteInput.style.display = 'none';

            applyOfertasFilter();
        }
    }


    if (filtroRestSelect) {
        LoadPublicRestauranteOptions();
        filtroRestSelect.addEventListener('change', applyOfertasFilter);
    }
    if (filtroComidaInput) {
        filtroComidaInput.addEventListener('input', applyOfertasFilter);
        filtroComidaInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                filtroComidaInput.value = '';
                applyOfertasFilter();
            }
        });
    }

    if (filtroRestauranteInput) {
        filtroRestauranteInput.style.display = 'none';
        const runRest = () => { loadRestaurantes({ q: filtroRestauranteInput.value.trim() }, 'lista-restaurantes'); };
        filtroRestauranteInput.addEventListener('input', runRest);
        filtroRestauranteInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') { filtroRestauranteInput.value = ''; runRest(); } });
    }

    if (filtroTipoPublico) {
        filtroTipoPublico.addEventListener('change', window.updatePublicViewMode);
        window.updatePublicViewMode();
    }

})();