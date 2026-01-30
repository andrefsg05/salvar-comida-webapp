document.addEventListener('DOMContentLoaded', () => {
	/**
	 * Router simples baseado no fragmento da URL (`hash`), que delega
	 * em `showView` a apresentação da secção correspondente.
	 */
	function handleHashChange() {
		const name = window.location.hash.replace('#', '') || 'inicio';
		if (typeof showView !== 'undefined') {
			showView(name);
		}
	}
	handleHashChange(); 
	window.addEventListener('hashchange', handleHashChange);
	document.body.addEventListener('click', (ev) => {
		const a = ev.target.closest('a');
		if (!a) return;
		const href = a.getAttribute('href') || '';
		if (href.startsWith('#')) {
			const newHash = href.replace('#', '');
			if (window.location.hash.replace('#','') !== newHash) {
				window.location.hash = newHash;
			} else {
				if (typeof showView !== 'undefined') {
					showView(newHash || 'inicio');
				}
			}
		}
	});
});