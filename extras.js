/* Herramientas de estudio: enlaces directos, informe imprimible y tablas CSV. */
(() => {
  const shareButton = document.querySelector('#shareBtn');
  const printButton = document.querySelector('#printBtn');
  const result = document.querySelector('#resultSection');
  const printInputs = document.querySelector('#printInputs');
  const route = () => `#${encodeURIComponent(currentGroup.id)}/${encodeURIComponent(currentModule.id)}`;

  function openRoute() {
    const match = /^#([^/]+)\/([^/]+)$/.exec(location.hash);
    if (!match) return;
    try {
      const group = groups.find(item => item.id === decodeURIComponent(match[1]));
      const module = group?.modules.find(item => item.id === decodeURIComponent(match[2]));
      if (module && (currentGroup !== group || currentModule !== module)) {
        currentGroup = group;
        currentModule = module;
        render();
      }
    } catch (_) { /* Conserva el módulo actual si el enlace está mal formado. */ }
  }

  const originalSelectGroup = selectGroup;
  selectGroup = function (group) {
    originalSelectGroup(group);
    history.pushState(null, '', route());
  };
  const originalSelectModule = selectModule;
  selectModule = function (module) {
    originalSelectModule(module);
    history.pushState(null, '', route());
  };
  window.addEventListener('popstate', openRoute);
  window.addEventListener('hashchange', openRoute);
  openRoute();

  shareButton.addEventListener('click', async () => {
    const url = new URL(route(), location.href).href;
    try {
      await navigator.clipboard.writeText(url);
      shareButton.textContent = 'Enlace copiado ✓';
    } catch (_) {
      const field = document.createElement('textarea');
      field.value = url;
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.append(field);
      field.select();
      const copied = document.execCommand('copy');
      field.remove();
      shareButton.textContent = copied ? 'Enlace copiado ✓' : 'Copia la dirección del navegador';
      if (!copied) history.replaceState(null, '', route());
    }
    setTimeout(() => { shareButton.textContent = 'Copiar enlace'; }, 2500);
  });

  printButton.addEventListener('click', () => {
    const title = document.createElement('h3');
    title.textContent = 'Datos utilizados';
    printInputs.replaceChildren(title);
    document.querySelectorAll('#inputFields [data-key]').forEach(field => {
      const line = document.createElement('p');
      const label = document.createElement('strong');
      label.textContent = `${document.querySelector(`label[for="${field.id}"]`)?.textContent || field.dataset.key}: `;
      line.append(label, document.createTextNode(field.selectedOptions?.[0]?.textContent || field.value));
      printInputs.append(line);
    });
    window.print();
  });

  function csvCell(value) {
    const text = String(value).trim();
    const safe = /^[=+@]/.test(text) || (/^-/.test(text) && !/^-\d/.test(text)) ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
  }
  function downloadCSV() {
    const table = result.querySelector('table');
    if (!table) return;
    const lines = [...table.rows].map(row => [...row.cells].map(cell => csvCell(cell.textContent)).join(','));
    const blob = new Blob(['\ufeff', lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `atomo-${currentModule.id}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function addCSVButton() {
    const heading = result.querySelector('.table-wrap h4');
    if (!heading || heading.querySelector('button')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'export-btn';
    button.textContent = 'Descargar CSV ↓';
    button.setAttribute('aria-label', 'Descargar tabla como CSV');
    button.addEventListener('click', downloadCSV);
    heading.append(button);
  }
  new MutationObserver(addCSVButton).observe(result, { childList: true, subtree: true });
  addCSVButton();
})();

