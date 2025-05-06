// Variables globales
let token = localStorage.getItem('token');
let categorias = [];
let ingresos = [];
let clientes = [];
let asesores = [];
let paginaActual = 1;
let totalPaginas = 1;
let limitePorPagina = 10;

// Formatear números como moneda
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Función para mostrar notificaciones toast
function showToast(message, type = 'success') {
    const toastId = 'toast-' + Date.now();
    const toastHTML = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="5000">
            <div class="toast-header ${type === 'success' ? 'bg-success' : 'bg-danger'} text-white">
                <strong class="me-auto">${type === 'success' ? 'Éxito' : 'Error'}</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    document.getElementById('toastContainer').insertAdjacentHTML('beforeend', toastHTML);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    // Auto-remove after hiding
    toastElement.addEventListener('hidden.bs.toast', function () {
        toastElement.remove();
    });
}

// Función para cargar ingresos con filtros
async function cargarIngresos(pagina = 1, filtros = {}) {
    try {
        // Construir URL con parámetros
        let url = `/api/ingresos?page=${pagina}&limit=${limitePorPagina}`;
        
        // Añadir filtros si existen
        if (filtros.fechaInicio) url += `&fechaInicio=${filtros.fechaInicio}`;
        if (filtros.fechaFin) url += `&fechaFin=${filtros.fechaFin}`;
        if (filtros.categoriaId) url += `&categoriaId=${filtros.categoriaId}`;
        if (filtros.estado) url += `&estado=${filtros.estado}`;
        if (filtros.metodoPago) url += `&metodoPago=${filtros.metodoPago}`;
        if (filtros.busqueda) url += `&busqueda=${filtros.busqueda}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error al cargar ingresos');
        }
        
        ingresos = result.data;
        paginaActual = result.meta.page;
        totalPaginas = result.meta.totalPages;
        
        // Actualizar totales en dashboard
        if (result.meta.totales) {
            const totales = result.meta.totales;
            document.getElementById('totalIngresos').textContent = formatCurrency(totales.total_bruto || 0);
            document.getElementById('totalNeto').textContent = formatCurrency(totales.total_neto || 0);
            
            // Buscar totales por estado
            let totalConfirmados = 0;
            let totalPendientes = 0;
            
            if (totales.por_estado && totales.por_estado.length > 0) {
                const confirmados = totales.por_estado.find(e => e.estado === 'confirmado');
                const pendientes = totales.por_estado.find(e => e.estado === 'pendiente');
                
                if (confirmados) totalConfirmados = confirmados.total;
                if (pendientes) totalPendientes = pendientes.total;
            }
            
            document.getElementById('totalConfirmados').textContent = formatCurrency(totalConfirmados);
            document.getElementById('totalPendientes').textContent = formatCurrency(totalPendientes);
            
            // Actualizar total de registros encontrados
            document.getElementById('totalRegistros').textContent = result.meta.total || 0;
        }
        
        // Renderizar tabla
        renderizarTabla();
        
        // Renderizar paginación
        renderizarPaginacion();
        
    } catch (error) {
        console.error('Error al cargar ingresos:', error);
        showToast('Error al cargar ingresos: ' + error.message, 'error');
    }
}

// Función para renderizar la tabla de ingresos
function renderizarTabla() {
    const tabla = document.getElementById('tablaIngresos');
    
    if (ingresos.length === 0) {
        tabla.innerHTML = '<tr><td colspan="9" class="text-center">No se encontraron ingresos con los filtros seleccionados</td></tr>';
        return;
    }
    
    let html = '';
    ingresos.forEach(ingreso => {
        const categoria = ingreso.categoria ? ingreso.categoria.nombre : 'Sin categoría';
        const fecha = new Date(ingreso.fecha).toLocaleDateString('es-CO');
        const valorBruto = formatCurrency(ingreso.valor_bruto);
        const valorNeto = formatCurrency(ingreso.valor_neto);
        const numero = ingreso.numero_comprobante || `ING-${ingreso.id}`;
        
        // Determinar clase CSS para el estado
        let estadoClass = '';
        switch (ingreso.estado) {
            case 'confirmado': estadoClass = 'bg-success'; break;
            case 'pendiente': estadoClass = 'bg-warning'; break;
            case 'anulado': estadoClass = 'bg-danger'; break;
            default: estadoClass = 'bg-secondary';
        }
        
        html += `
            <tr>
                <td>${numero}</td>
                <td>${fecha}</td>
                <td>${categoria}</td>
                <td>${ingreso.concepto}</td>
                <td class="text-end">${valorBruto}</td>
                <td class="text-end">${valorNeto}</td>
                <td>${ingreso.metodo_pago}</td>
                <td><span class="badge ${estadoClass}">${ingreso.estado}</span></td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button type="button" class="btn btn-outline-primary" onclick="verDetalleIngreso(${ingreso.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${ingreso.estado !== 'anulado' ? `
                            <button type="button" class="btn btn-outline-secondary" onclick="editarIngreso(${ingreso.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button type="button" class="btn btn-outline-danger" onclick="anularIngreso(${ingreso.id})">
                                <i class="fas fa-ban"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    });
    
    tabla.innerHTML = html;
}

// Función para renderizar la paginación
function renderizarPaginacion() {
    const paginacion = document.getElementById('paginacion');
    
    if (totalPaginas <= 1) {
        paginacion.innerHTML = '';
        return;
    }
    
    let html = `
        <li class="page-item ${paginaActual === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="cambiarPagina(${paginaActual - 1})">Anterior</a>
        </li>
    `;
    
    // Mostrar máximo 5 páginas
    const maxPages = 5;
    const startPage = Math.max(1, paginaActual - Math.floor(maxPages / 2));
    const endPage = Math.min(totalPaginas, startPage + maxPages - 1);
    
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <li class="page-item ${paginaActual === i ? 'active' : ''}">
                <a class="page-link" href="#" onclick="cambiarPagina(${i})">${i}</a>
            </li>
        `;
    }
    
    html += `
        <li class="page-item ${paginaActual === totalPaginas ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="cambiarPagina(${paginaActual + 1})">Siguiente</a>
        </li>
    `;
    
    paginacion.innerHTML = html;
}

// Función para cambiar de página
function cambiarPagina(pagina) {
    if (pagina < 1 || pagina > totalPaginas) return;
    
    const filtros = obtenerFiltros();
    cargarIngresos(pagina, filtros);
}

// Función para obtener los filtros actuales
function obtenerFiltros() {
    const fechaRango = document.getElementById('fechaRango').value;
    let fechaInicio = '';
    let fechaFin = '';
    
    if (fechaRango) {
        const fechas = fechaRango.split(' - ');
        if (fechas.length === 2) {
            fechaInicio = moment(fechas[0], 'DD/MM/YYYY').format('YYYY-MM-DD');
            fechaFin = moment(fechas[1], 'DD/MM/YYYY').format('YYYY-MM-DD');
        }
    }
    
    return {
        fechaInicio,
        fechaFin,
        categoriaId: document.getElementById('categoriaFiltro').value,
        estado: document.getElementById('estadoFiltro').value,
        metodoPago: document.getElementById('metodoFiltro').value,
        busqueda: document.getElementById('busquedaTexto').value
    };
}

// Función para cargar las categorías
async function cargarCategorias() {
    try {
        const response = await fetch('/api/categorias-ingreso', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error al cargar categorías');
        }
        
        categorias = result.data.filter(cat => cat.es_activo);
        
        // Llenar select de categorías en filtro
        const selectCategoriaFiltro = document.getElementById('categoriaFiltro');
        selectCategoriaFiltro.innerHTML = '<option value="">Todas las categorías</option>';
        
        categorias.forEach(categoria => {
            selectCategoriaFiltro.innerHTML += `<option value="${categoria.id}">${categoria.nombre}</option>`;
        });
        
        // Inicializar select2 para categorías
        $('.select2').select2({
            theme: 'bootstrap-5'
        });
        
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        showToast('Error al cargar categorías: ' + error.message, 'error');
    }
}

// Función para cargar clientes
async function cargarClientes() {
    try {
        const response = await fetch('/api/clients', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        // Verificar el formato de la respuesta
        // Si result es un array, usarlo directamente; si tiene una propiedad data, usar result.data
        if (Array.isArray(result)) {
            clientes = result;
        } else if (result.data) {
            clientes = result.data;
        } else if (result.success === false) {
            throw new Error(result.error || 'Error al cargar clientes');
        } else {
            console.warn('Formato de respuesta no reconocido:', result);
            clientes = [];
        }
        
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        showToast('Error al cargar clientes: ' + error.message, 'error');
    }
}

// Función para cargar asesores (empleados)
async function cargarAsesores() {
    try {
        const response = await fetch('/api/employees', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        // Verificar el formato de la respuesta
        // Si result contiene employees, usarlo; si es un array, usarlo directamente,
        // si tiene una propiedad data, usar result.data
        if (result.employees) {
            asesores = result.employees;
        } else if (Array.isArray(result)) {
            asesores = result;
        } else if (result.data) {
            asesores = result.data;
        } else if (result.success === false) {
            throw new Error(result.error || 'Error al cargar asesores');
        } else {
            console.warn('Formato de respuesta no reconocido:', result);
            asesores = [];
        }
        
    } catch (error) {
        console.error('Error al cargar asesores:', error);
        showToast('Error al cargar asesores: ' + error.message, 'error');
    }
}

// Función para cargar los créditos activos de un cliente
async function cargarCreditosCliente(clienteId) {
    if (!clienteId) {
        document.getElementById('creditoIngreso').innerHTML = '<option value="">Seleccione un crédito</option>';
        document.getElementById('infoCredito').style.display = 'none';
        return;
    }
    
    try {
        // Mostrar indicador de carga en el select de créditos
        const selectCreditos = document.getElementById('creditoIngreso');
        selectCreditos.innerHTML = '<option value="">Cargando créditos...</option>';
        selectCreditos.disabled = true;
        
        const response = await fetch(`/api/clients/${clienteId}/loans?active=true`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        selectCreditos.disabled = false;
        
        if (!response.ok) {
            throw new Error('Error al cargar créditos del cliente');
        }
        
        const creditos = await response.json();
        
        // Verificar formato de respuesta y obtener array de créditos
        let creditosArray = creditos;
        if (creditos.data) {
            creditosArray = creditos.data;
        }
        
        // Si no hay créditos, mostrar mensaje
        if (!Array.isArray(creditosArray) || creditosArray.length === 0) {
            selectCreditos.innerHTML = '<option value="">No hay créditos activos</option>';
            document.getElementById('infoCredito').style.display = 'block';
            document.getElementById('infoCredito').innerHTML = `
                <div class="alert alert-info">
                    <p>El cliente seleccionado no tiene créditos activos.</p>
                </div>
            `;
            return;
        }
        
        // Llenar selector con los créditos activos
        selectCreditos.innerHTML = '<option value="">Seleccione un crédito</option>';
        
        creditosArray.forEach(credito => {
            const numero = credito.numero_credito || credito.loan_number || `CR-${credito.id}`;
            const monto = formatCurrency(credito.monto_aprobado || credito.amount || 0);
            const saldo = formatCurrency(credito.saldo_pendiente || credito.balance_due || 0);
            
            selectCreditos.innerHTML += `
                <option value="${credito.id}">
                    ${numero} - ${monto} (Saldo: ${saldo})
                </option>
            `;
        });
        
        // Si solo hay un crédito, seleccionarlo automáticamente
        if (creditosArray.length === 1) {
            selectCreditos.value = creditosArray[0].id;
            // Disparar evento de cambio para cargar detalles del crédito
            selectCreditos.dispatchEvent(new Event('change'));
        }
        
    } catch (error) {
        console.error('Error al cargar créditos del cliente:', error);
        const selectCreditos = document.getElementById('creditoIngreso');
        selectCreditos.innerHTML = '<option value="">Error al cargar créditos</option>';
        selectCreditos.disabled = false;
        
        document.getElementById('infoCredito').style.display = 'block';
        document.getElementById('infoCredito').innerHTML = `
            <div class="alert alert-danger">
                <p>Error al cargar créditos: ${error.message}</p>
            </div>
        `;
    }
}

// Función para cargar los detalles de un crédito específico
async function cargarDetalleCredito(creditoId) {
    if (!creditoId) {
        document.getElementById('infoCredito').style.display = 'none';
        return;
    }
    
    // Mostrar sección de crédito si no está visible
    document.getElementById('seccionCredito').style.display = 'block';
    
    // Cargar la tabla de amortización
    cargarTablaAmortizacion(creditoId);
}

// Función para buscar cliente por documento
async function buscarClientePorDocumento() {
    const tipoDocumento = document.getElementById('tipoBusquedaCliente').value;
    const numeroDocumento = document.getElementById('documentoBusquedaCliente').value.trim();
    
    if (!numeroDocumento) {
        showToast('Por favor ingrese el número de documento', 'error');
        return;
    }
    
    try {
        // Mostrar indicador de carga
        document.getElementById('btnBuscarCliente').innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Buscando...';
        document.getElementById('btnBuscarCliente').disabled = true;
        
        const response = await fetch(`/api/clients/search?tipo=${tipoDocumento}&documento=${numeroDocumento}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        // Restaurar botón
        document.getElementById('btnBuscarCliente').innerHTML = '<i class="fas fa-search"></i> Buscar';
        document.getElementById('btnBuscarCliente').disabled = false;
        
        if (!response.ok) {
            throw new Error('Error al buscar cliente');
        }
        
        const resultado = await response.json();
        
        // Verificar si se encontró el cliente
        if (resultado && resultado.id) {
            // Seleccionar el cliente en el select
            const selectCliente = document.getElementById('clienteIngreso');
            
            // Verificar si el cliente ya existe en el select
            let clienteExiste = false;
            for (let i = 0; i < selectCliente.options.length; i++) {
                if (selectCliente.options[i].value == resultado.id) {
                    selectCliente.selectedIndex = i;
                    clienteExiste = true;
                    break;
                }
            }
            
            // Si el cliente no existe en el select, añadirlo
            if (!clienteExiste) {
                const option = document.createElement('option');
                option.value = resultado.id;
                option.text = `${resultado.full_name || resultado.nombre + ' ' + (resultado.apellido || '')} - ${resultado.identification || resultado.numero_documento || 'Sin documento'}`;
                option.selected = true;
                selectCliente.add(option);
            }
            
            // Disparar evento change para cargar créditos del cliente
            selectCliente.dispatchEvent(new Event('change'));
            
            // Si existe la sección de datos del pagador, llenarla con los datos del cliente
            if (document.getElementById('nombrePagador')) {
                document.getElementById('nombrePagador').value = resultado.full_name || resultado.nombre + ' ' + (resultado.apellido || '');
                document.getElementById('tipoPagador').value = resultado.tipo_documento || tipoDocumento;
                document.getElementById('documentoPagador').value = resultado.identification || resultado.numero_documento || numeroDocumento;
                document.getElementById('telefonoPagador').value = resultado.phone || '';
                document.getElementById('correoPagador').value = resultado.email || '';
                document.getElementById('direccionPagador').value = resultado.address || '';
            }
            
            showToast('Cliente encontrado y seleccionado correctamente');
        } else {
            showToast('No se encontró ningún cliente con el documento especificado', 'error');
        }
        
    } catch (error) {
        console.error('Error al buscar cliente:', error);
        document.getElementById('btnBuscarCliente').innerHTML = '<i class="fas fa-search"></i> Buscar';
        document.getElementById('btnBuscarCliente').disabled = false;
        showToast('Error al buscar cliente: ' + error.message, 'error');
    }
}

// Función para cargar la lista completa de clientes
async function cargarListaClientes() {
    try {
        const tablaClientes = document.getElementById('tablaClientes');
        tablaClientes.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p>Cargando clientes...</p>
                </td>
            </tr>
        `;
        
        // Si ya tenemos los clientes cargados globalmente, usarlos
        if (clientes && clientes.length > 0) {
            renderizarTablaClientes(clientes);
            return;
        }
        
        // Si no, cargarlos
        const response = await fetch('/api/clients', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar clientes');
        }
        
        const resultado = await response.json();
        
        // Verificar formato de respuesta
        let clientesData = [];
        if (Array.isArray(resultado)) {
            clientesData = resultado;
        } else if (resultado.data && Array.isArray(resultado.data)) {
            clientesData = resultado.data;
        } else {
            throw new Error('Formato de respuesta no reconocido');
        }
        
        // Actualizar clientes globales y renderizar
        clientes = clientesData;
        renderizarTablaClientes(clientes);
        
    } catch (error) {
        console.error('Error al cargar lista de clientes:', error);
        document.getElementById('tablaClientes').innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-danger">
                    Error al cargar clientes: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Función para renderizar la tabla de clientes
function renderizarTablaClientes(clientesData) {
    const tablaClientes = document.getElementById('tablaClientes');
    
    if (!clientesData || clientesData.length === 0) {
        tablaClientes.innerHTML = '<tr><td colspan="4" class="text-center">No se encontraron clientes</td></tr>';
        return;
    }
    
    let html = '';
    clientesData.forEach(cliente => {
        const nombre = cliente.full_name || `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim();
        const documento = cliente.identification || cliente.numero_documento || 'Sin documento';
        const telefono = cliente.phone || cliente.telefono || 'N/A';
        
        html += `
            <tr>
                <td>${nombre}</td>
                <td>${documento}</td>
                <td>${telefono}</td>
                <td>
                    <button type="button" class="btn btn-sm btn-primary" onclick="seleccionarCliente(${cliente.id})">
                        <i class="fas fa-check"></i> Seleccionar
                    </button>
                </td>
            </tr>
        `;
    });
    
    tablaClientes.innerHTML = html;
}

// Función para filtrar clientes en la tabla
function filtrarClientes() {
    const filtro = document.getElementById('filtroBusquedaClientes').value.toLowerCase();
    
    if (!clientes || clientes.length === 0) {
        return;
    }
    
    // Filtrar por nombre o documento
    const clientesFiltrados = clientes.filter(cliente => {
        const nombre = cliente.full_name || `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim();
        const documento = cliente.identification || cliente.numero_documento || '';
        
        return nombre.toLowerCase().includes(filtro) || documento.toLowerCase().includes(filtro);
    });
    
    // Renderizar tabla con clientes filtrados
    renderizarTablaClientes(clientesFiltrados);
}

// Función para seleccionar un cliente desde la tabla
function seleccionarCliente(clienteId) {
    // Buscar el cliente en la lista
    const cliente = clientes.find(c => c.id === clienteId);
    
    if (!cliente) {
        showToast('No se pudo encontrar la información del cliente', 'error');
        return;
    }
    
    const selectCliente = document.getElementById('clienteIngreso');
    
    // Verificar si el cliente ya existe en el select
    let clienteExiste = false;
    for (let i = 0; i < selectCliente.options.length; i++) {
        if (selectCliente.options[i].value == clienteId) {
            selectCliente.selectedIndex = i;
            clienteExiste = true;
            break;
        }
    }
    
    // Si el cliente no existe en el select, añadirlo
    if (!clienteExiste) {
        const option = document.createElement('option');
        option.value = clienteId;
        option.text = `${cliente.full_name || cliente.nombre + ' ' + (cliente.apellido || '')} - ${cliente.identification || cliente.numero_documento || 'Sin documento'}`;
        option.selected = true;
        selectCliente.add(option);
    }
    
    // Disparar evento change para cargar créditos del cliente
    selectCliente.dispatchEvent(new Event('change'));
    
    // Si existe la sección de datos del pagador, llenarla con los datos del cliente
    if (document.getElementById('nombrePagador')) {
        document.getElementById('nombrePagador').value = cliente.full_name || cliente.nombre + ' ' + (cliente.apellido || '');
        document.getElementById('tipoPagador').value = cliente.tipo_documento || 'CC';
        document.getElementById('documentoPagador').value = cliente.identification || cliente.numero_documento || '';
        document.getElementById('telefonoPagador').value = cliente.phone || cliente.telefono || '';
        document.getElementById('correoPagador').value = cliente.email || cliente.correo || '';
        document.getElementById('direccionPagador').value = cliente.address || cliente.direccion || '';
    }
    
    // Ocultar la lista de clientes
    const collapseClientes = document.getElementById('collapseClientes');
    const bsCollapse = bootstrap.Collapse.getInstance(collapseClientes);
    if (bsCollapse) {
        bsCollapse.hide();
    }
    
    showToast('Cliente seleccionado correctamente');
}

// Función para manejar cambios en la categoría seleccionada
function manejarCambioCategoria() {
    const selectCategoria = document.getElementById('categoriaIngreso');
    const categoriaSeleccionada = selectCategoria.options[selectCategoria.selectedIndex];
    
    // Si no hay categoría seleccionada, ocultar todas las secciones condicionales
    if (!categoriaSeleccionada || categoriaSeleccionada.value === '') {
        // Reset all sections
        document.getElementById('seccionCliente').style.display = 'none';
        document.getElementById('seccionCredito').style.display = 'none';
        document.getElementById('seccionComision').style.display = 'none';
        document.getElementById('porcentajeRetencion').value = '0';
        document.getElementById('infoCredito').style.display = 'none';
        
        // Ocultar sección de datos del pagador si existe
        if (document.getElementById('seccionDatosPagador')) {
            document.getElementById('seccionDatosPagador').style.display = 'none';
        }
        
        // Ocultar sección de tipo de pago si existe
        if (document.getElementById('seccionTipoPago')) {
            document.getElementById('seccionTipoPago').style.display = 'none';
        }
        return;
    }
    
    // Obtener datos de la categoría
    const categoriaId = categoriaSeleccionada.value;
    const categoriaNombre = categoriaSeleccionada.textContent.trim().toLowerCase();
    
    // Obtener atributos de datos
    // Si el dataset no está configurado correctamente, usaremos el nombre como respaldo
    const porcentajeRetencion = categoriaSeleccionada.dataset.retencion || 0;
    const requiereCliente = categoriaSeleccionada.dataset.cliente === 'true' || false;
    const permiteComision = categoriaSeleccionada.dataset.comision === 'true' || false;
    const esCredito = categoriaSeleccionada.dataset.credito === 'true' || false;
    
    // Verificar si es crédito de consumo por nombre (backup por si el dataset no está configurado)
    const esCreditoConsumo = 
        categoriaNombre.includes('crédito') || 
        categoriaNombre.includes('credito') || 
        categoriaNombre.includes('consumo') ||
        categoriaNombre.includes('libranza') ||
        categoriaNombre.includes('libre inversión') ||
        categoriaNombre.includes('libre inversion') ||
        esCredito;
    
    console.log('Categoría seleccionada ID:', categoriaId);
    console.log('Categoría seleccionada nombre:', categoriaNombre);
    console.log('Es crédito de consumo:', esCreditoConsumo);
    console.log('Requiere cliente:', requiereCliente);
    
    // Aplicar porcentaje de retención automático
    document.getElementById('porcentajeRetencion').value = porcentajeRetencion;
    
    // Mostrar/ocultar sección de cliente
    // Si requiere cliente O es crédito de consumo, mostrar sección de cliente
    const mostrarCliente = requiereCliente || esCreditoConsumo;
    console.log('Mostrar sección cliente:', mostrarCliente);
    
    document.getElementById('seccionCliente').style.display = mostrarCliente ? 'block' : 'none';
    
    // Mostrar/ocultar sección de datos del pagador completos
    if (document.getElementById('seccionDatosPagador')) {
        document.getElementById('seccionDatosPagador').style.display = esCreditoConsumo ? 'block' : 'none';
    } else {
        // Si el elemento no existe y es un crédito de consumo, crearlo
        if (esCreditoConsumo) {
            const seccionCredito = document.getElementById('seccionCredito');
            if (seccionCredito) {
                const datosPagadorHTML = `
                    <div id="seccionDatosPagador" class="mb-3">
                        <h6 class="mb-3">Datos del Pagador</h6>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="nombrePagador" class="form-label">Nombre completo</label>
                                <input type="text" class="form-control" id="nombrePagador" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="tipoPagador" class="form-label">Tipo de documento</label>
                                <select class="form-select" id="tipoPagador" required>
                                    <option value="">Seleccione...</option>
                                    <option value="CC">Cédula de Ciudadanía</option>
                                    <option value="CE">Cédula de Extranjería</option>
                                    <option value="NIT">NIT</option>
                                    <option value="PASAPORTE">Pasaporte</option>
                                </select>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="documentoPagador" class="form-label">Número de documento</label>
                                <input type="text" class="form-control" id="documentoPagador" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="telefonoPagador" class="form-label">Teléfono</label>
                                <input type="tel" class="form-control" id="telefonoPagador">
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="correoPagador" class="form-label">Correo electrónico</label>
                                <input type="email" class="form-control" id="correoPagador">
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="direccionPagador" class="form-label">Dirección</label>
                                <input type="text" class="form-control" id="direccionPagador">
                            </div>
                        </div>
                    </div>
                `;
                
                // Insertar antes de la sección de crédito
                seccionCredito.insertAdjacentHTML('beforebegin', datosPagadorHTML);
            }
        }
    }
    
    // Mostrar/ocultar sección de tipo de pago
    if (document.getElementById('seccionTipoPago')) {
        document.getElementById('seccionTipoPago').style.display = esCreditoConsumo ? 'block' : 'none';
    } else {
        // Si el elemento no existe y es un crédito de consumo, crearlo
        if (esCreditoConsumo) {
            const seccionCredito = document.getElementById('seccionCredito');
            if (seccionCredito) {
                const tipoPagoHTML = `
                    <div id="seccionTipoPago" class="mb-3">
                        <h6 class="mb-3">Tipo de Pago</h6>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="tipoPago" id="tipoPagoTotal" value="total" checked>
                            <label class="form-check-label" for="tipoPagoTotal">Pago total</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="tipoPago" id="tipoPagoParcial" value="parcial">
                            <label class="form-check-label" for="tipoPagoParcial">Pago parcial</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="tipoPago" id="tipoPagoCuota" value="cuota">
                            <label class="form-check-label" for="tipoPagoCuota">Pago de cuota</label>
                        </div>
                    </div>
                `;
                
                // Insertar después de la sección de crédito
                seccionCredito.insertAdjacentHTML('afterend', tipoPagoHTML);
                
                // Agregar evento para manejar el cambio de tipo de pago
                document.querySelectorAll('input[name="tipoPago"]').forEach(radio => {
                    radio.addEventListener('change', manejarCambioTipoPago);
                });
            }
        }
    }
    
    // Mostrar/ocultar sección de crédito
    const mostrarCredito = esCredito || esCreditoConsumo;
    document.getElementById('seccionCredito').style.display = mostrarCredito ? 'block' : 'none';
    
    // Mostrar/ocultar sección de comisión
    document.getElementById('seccionComision').style.display = permiteComision ? 'block' : 'none';
    
    // Si requiere cliente, llenar selector de clientes
    if (mostrarCliente) {
        const selectCliente = document.getElementById('clienteIngreso');
        selectCliente.innerHTML = '<option value="">Seleccione un cliente</option>';
        
        clientes.forEach(cliente => {
            // Usar full_name si está disponible, o combinar nombre y apellido si existen
            const nombreCompleto = cliente.full_name || 
                                  `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim();
            const documento = cliente.identification || cliente.id_number || 'Sin documento';
            
            selectCliente.innerHTML += `<option value="${cliente.id}">${nombreCompleto} - ${documento}</option>`;
        });
    }
    
    // Si permite comisión, llenar selector de asesores
    if (permiteComision) {
        const selectAsesor = document.getElementById('asesorIngreso');
        selectAsesor.innerHTML = '<option value="">Seleccione un asesor</option>';
        
        asesores.forEach(asesor => {
            // Usar full_name si está disponible, o combinar nombre y apellido si existen
            const nombreCompleto = asesor.full_name || 
                                 `${asesor.nombre || ''} ${asesor.apellido || ''}`.trim();
            const documento = asesor.id_number || 'Sin documento';
            
            selectAsesor.innerHTML += `<option value="${asesor.id}">${nombreCompleto} - ${documento}</option>`;
        });
    }
    
    // Recalcular valores si ya hay un valor bruto
    calcularValores();
}

// Función para manejar cambios en el tipo de pago
function manejarCambioTipoPago() {
    const tipoPago = document.querySelector('input[name="tipoPago"]:checked').value;
    const creditoId = document.getElementById('creditoIngreso').value;
    const infoCredito = document.getElementById('infoCredito');
    
    // Si no hay crédito seleccionado, no hacer nada
    if (!creditoId) {
        return;
    }
    
    // Comportamiento según el tipo de pago
    switch (tipoPago) {
        case 'total':
            // Para pago total, cargar el saldo completo pendiente
            cargarSaldoTotalCredito(creditoId);
            break;
        case 'parcial':
            // Para pago parcial, permitir ingresar un monto personalizado
            mostrarCampoPagoParcial();
            break;
        case 'cuota':
            // Para pago de cuota, mostrar la tabla de amortización para seleccionar la cuota
            mostrarTablaCuotas(creditoId);
            break;
    }
}

// Función para cargar el saldo total del crédito
async function cargarSaldoTotalCredito(creditoId) {
    try {
        const response = await fetch(`/api/loans/${creditoId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al obtener información del crédito');
        }
        
        const credito = await response.json();
        
        // Actualizar el valor bruto con el saldo total pendiente
        document.getElementById('valorBruto').value = credito.saldo_pendiente || credito.balance_due || 0;
        
        // Mostrar resumen del pago total
        const infoCredito = document.getElementById('infoCredito');
        infoCredito.style.display = 'block';
        infoCredito.innerHTML = `
            <div class="alert alert-info">
                <h6>Resumen de Pago Total</h6>
                <p><strong>Saldo total pendiente:</strong> ${formatCurrency(credito.saldo_pendiente || credito.balance_due || 0)}</p>
                <p class="mb-0"><small>Este pago cancelará completamente el crédito.</small></p>
            </div>
        `;
        
        // Recalcular valores automáticamente
        calcularValores();
        
    } catch (error) {
        console.error('Error al cargar saldo total:', error);
        showToast('Error al cargar información del crédito: ' + error.message, 'error');
    }
}

// Función para mostrar campo de pago parcial
function mostrarCampoPagoParcial() {
    const infoCredito = document.getElementById('infoCredito');
    infoCredito.style.display = 'block';
    infoCredito.innerHTML = `
        <div class="alert alert-warning">
            <h6>Pago Parcial</h6>
            <p>Ingrese el monto que desea abonar al crédito.</p>
            <p class="mb-0"><small>Este pago reducirá el saldo pendiente del crédito.</small></p>
        </div>
    `;
    
    // Enfoque en el campo de valor bruto para que el usuario ingrese el monto
    document.getElementById('valorBruto').focus();
}

// Función para mostrar tabla de cuotas (amortización)
async function mostrarTablaCuotas(creditoId) {
    try {
        const response = await fetch(`/api/loans/${creditoId}/payment-schedule`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al obtener plan de pagos');
        }
        
        const planPagos = await response.json();
        
        // Mostrar tabla de amortización
        const infoCredito = document.getElementById('infoCredito');
        infoCredito.style.display = 'block';
        
        // Encontrar la siguiente cuota pendiente
        const cuotaPendiente = planPagos.find(cuota => cuota.estado === 'pendiente');
        
        if (cuotaPendiente) {
            // Actualizar el valor bruto con el valor de la cuota pendiente
            document.getElementById('valorBruto').value = cuotaPendiente.monto_cuota || cuotaPendiente.amount || 0;
            
            // Mostrar información de la cuota
            infoCredito.innerHTML = `
                <div class="alert alert-info">
                    <h6>Información de Cuota</h6>
                    <p><strong>Número de cuota:</strong> ${cuotaPendiente.numero_cuota || cuotaPendiente.number}</p>
                    <p><strong>Fecha de vencimiento:</strong> ${new Date(cuotaPendiente.fecha_vencimiento || cuotaPendiente.due_date).toLocaleDateString('es-CO')}</p>
                    <p><strong>Valor de la cuota:</strong> ${formatCurrency(cuotaPendiente.monto_cuota || cuotaPendiente.amount || 0)}</p>
                    <p class="mb-0"><small>Este pago aplicará a la cuota mostrada.</small></p>
                </div>
            `;
            
            // Agregar referencia a la cuota en un campo oculto
            if (!document.getElementById('cuotaIdHidden')) {
                const hiddenField = document.createElement('input');
                hiddenField.type = 'hidden';
                hiddenField.id = 'cuotaIdHidden';
                hiddenField.name = 'cuota_id';
                infoCredito.appendChild(hiddenField);
            }
            document.getElementById('cuotaIdHidden').value = cuotaPendiente.id;
        } else {
            infoCredito.innerHTML = `
                <div class="alert alert-warning">
                    <h6>No hay cuotas pendientes</h6>
                    <p>Este crédito no tiene cuotas pendientes de pago.</p>
                </div>
            `;
        }
        
        // Mostrar tabla completa de amortización
        infoCredito.innerHTML += `
            <div class="mt-3">
                <h6>Plan de Pagos</h6>
                <div class="table-responsive">
                    <table class="table table-sm table-striped">
                        <thead>
                            <tr>
                                <th>Cuota</th>
                                <th>Vencimiento</th>
                                <th>Monto</th>
                                <th>Capital</th>
                                <th>Interés</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${planPagos.map(cuota => `
                                <tr class="${cuota.estado === 'pendiente' ? 'table-warning' : cuota.estado === 'pagado' ? 'table-success' : ''}">
                                    <td>${cuota.numero_cuota || cuota.number}</td>
                                    <td>${new Date(cuota.fecha_vencimiento || cuota.due_date).toLocaleDateString('es-CO')}</td>
                                    <td>${formatCurrency(cuota.monto_cuota || cuota.amount || 0)}</td>
                                    <td>${formatCurrency(cuota.capital || 0)}</td>
                                    <td>${formatCurrency(cuota.interes || cuota.interest || 0)}</td>
                                    <td>${cuota.estado || cuota.status}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        // Recalcular valores automáticamente
        calcularValores();
        
    } catch (error) {
        console.error('Error al mostrar tabla de cuotas:', error);
        showToast('Error al cargar plan de pagos: ' + error.message, 'error');
        
        const infoCredito = document.getElementById('infoCredito');
        infoCredito.style.display = 'block';
        infoCredito.innerHTML = `
            <div class="alert alert-danger">
                <h6>Error al cargar plan de pagos</h6>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Función para cargar la tabla de amortización completa del crédito
async function cargarTablaAmortizacion(creditoId) {
    if (!creditoId) return;
    
    try {
        // Mostrar spinner mientras se carga
        const infoCredito = document.getElementById('infoCredito');
        infoCredito.style.display = 'block';
        infoCredito.innerHTML = `
            <div class="d-flex justify-content-center p-3">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="ms-2 mb-0">Cargando plan de pagos...</p>
            </div>
        `;
        
        // Obtener información del crédito
        const responseCredito = await fetch(`/api/loans/${creditoId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!responseCredito.ok) {
            throw new Error('Error al obtener información del crédito');
        }
        
        const credito = await responseCredito.json();
        
        // Obtener tabla de amortización
        const responsePlan = await fetch(`/api/loans/${creditoId}/payment-schedule`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!responsePlan.ok) {
            throw new Error('Error al obtener plan de pagos');
        }
        
        const planPagos = await responsePlan.json();
        
        // Calcular totales
        let totalPagado = 0;
        let totalPendiente = 0;
        let cuotasPagadas = 0;
        let cuotasPendientes = 0;
        
        planPagos.forEach(cuota => {
            if (cuota.estado === 'pagado' || cuota.status === 'paid') {
                totalPagado += parseFloat(cuota.monto_cuota || cuota.amount || 0);
                cuotasPagadas++;
            } else {
                totalPendiente += parseFloat(cuota.monto_cuota || cuota.amount || 0);
                cuotasPendientes++;
            }
        });
        
        // Encontrar la siguiente cuota pendiente
        const proximaCuota = planPagos.find(cuota => 
            cuota.estado === 'pendiente' || cuota.status === 'pending'
        );
        
        // Mostrar información del crédito
        let htmlInfo = `
            <div class="card">
                <div class="card-header bg-primary text-white">
                    <h6 class="mb-0">Información del Crédito</h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>Número:</strong> ${credito.numero_credito || credito.loan_number || `CR-${credito.id}`}</p>
                            <p><strong>Monto original:</strong> ${formatCurrency(credito.monto_aprobado || credito.amount || 0)}</p>
                            <p><strong>Plazo:</strong> ${credito.plazo || credito.term || 0} meses</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Tasa anual:</strong> ${credito.tasa_interes || credito.interest_rate || 0}%</p>
                            <p><strong>Saldo pendiente:</strong> ${formatCurrency(credito.saldo_pendiente || credito.balance_due || 0)}</p>
                            <p><strong>Estado:</strong> ${credito.estado || credito.status || 'Activo'}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card mt-3">
                <div class="card-header bg-info text-white">
                    <h6 class="mb-0">Resumen de Pagos</h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>Cuotas pagadas:</strong> ${cuotasPagadas} de ${planPagos.length}</p>
                            <p><strong>Total pagado:</strong> ${formatCurrency(totalPagado)}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Cuotas pendientes:</strong> ${cuotasPendientes}</p>
                            <p><strong>Total pendiente:</strong> ${formatCurrency(totalPendiente)}</p>
                        </div>
                    </div>`;
                    
        if (proximaCuota) {
            htmlInfo += `
                <div class="alert alert-warning mt-2">
                    <strong>Próxima cuota:</strong> N° ${proximaCuota.numero_cuota || proximaCuota.number}
                    <br>
                    <strong>Vencimiento:</strong> ${new Date(proximaCuota.fecha_vencimiento || proximaCuota.due_date).toLocaleDateString('es-CO')}
                    <br>
                    <strong>Valor:</strong> ${formatCurrency(proximaCuota.monto_cuota || proximaCuota.amount || 0)}
                </div>
            `;
        }
                    
        htmlInfo += `
                </div>
            </div>
            
            <div class="card mt-3">
                <div class="card-header bg-light">
                    <h6 class="mb-0">Tabla de Amortización</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-sm table-striped table-hover mb-0">
                            <thead>
                                <tr>
                                    <th>N° Cuota</th>
                                    <th>Vencimiento</th>
                                    <th>Capital</th>
                                    <th>Intereses</th>
                                    <th>Valor Cuota</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
        `;
                                
        // Generar filas de la tabla de amortización
        for (let cuota of planPagos) {
            // Determinar clase CSS según estado
            let rowClass = '';
            const estado = cuota.estado || cuota.status || '';
            if (estado.toLowerCase() === 'pagado' || estado.toLowerCase() === 'paid') {
                rowClass = 'table-success';
            } else if (estado.toLowerCase() === 'pendiente' || estado.toLowerCase() === 'pending') {
                const fechaVencimiento = new Date(cuota.fecha_vencimiento || cuota.due_date);
                const hoy = new Date();
                
                if (fechaVencimiento < hoy) {
                    rowClass = 'table-danger'; // Vencida
                } else {
                    rowClass = 'table-warning'; // Pendiente
                }
            }
            
            htmlInfo += `
                <tr class="${rowClass}">
                    <td>${cuota.numero_cuota || cuota.number}</td>
                    <td>${new Date(cuota.fecha_vencimiento || cuota.due_date).toLocaleDateString('es-CO')}</td>
                    <td>${formatCurrency(cuota.capital || 0)}</td>
                    <td>${formatCurrency(cuota.interes || cuota.interest || 0)}</td>
                    <td>${formatCurrency(cuota.monto_cuota || cuota.amount || 0)}</td>
                    <td>${cuota.estado || cuota.status || 'Pendiente'}</td>
                </tr>
            `;
        }
                                
        htmlInfo += `
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        // Actualizar el HTML
        infoCredito.innerHTML = htmlInfo;
        
        // Cuando se selecciona un crédito, pre-seleccionar "Pago de cuota" por defecto
        if (document.getElementById('tipoPagoCuota')) {
            document.getElementById('tipoPagoCuota').checked = true;
            
            // Si estamos en modo de pago de cuota, usar el valor de la próxima cuota como valor del pago
            if (proximaCuota) {
                document.getElementById('valorBruto').value = proximaCuota.monto_cuota || proximaCuota.amount || 0;
                
                // Recalcular valores
                calcularValores();
                
                // Agregar referencia a la cuota en un campo oculto
                if (!document.getElementById('cuotaIdHidden')) {
                    const hiddenField = document.createElement('input');
                    hiddenField.type = 'hidden';
                    hiddenField.id = 'cuotaIdHidden';
                    hiddenField.name = 'cuota_id';
                    document.getElementById('infoCredito').appendChild(hiddenField);
                }
                document.getElementById('cuotaIdHidden').value = proximaCuota.id;
            }
        }
        
    } catch (error) {
        console.error('Error al cargar tabla de amortización:', error);
        document.getElementById('infoCredito').innerHTML = `
            <div class="alert alert-danger">
                <h6>Error al cargar plan de pagos</h6>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Inicialización de componentes y manejadores de eventos
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar token
    if (!token) {
        window.location.href = '/login';
        return;
    }
    
    // Inicializar DateRangePicker para filtro de fechas
    $('#fechaRango').daterangepicker({
        locale: {
            format: 'DD/MM/YYYY',
            applyLabel: 'Aplicar',
            cancelLabel: 'Cancelar',
            fromLabel: 'Desde',
            toLabel: 'Hasta',
            customRangeLabel: 'Rango personalizado',
            daysOfWeek: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
            monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        },
        opens: 'left',
        autoUpdateInput: false
    });
    
    $('#fechaRango').on('apply.daterangepicker', function(ev, picker) {
        $(this).val(picker.startDate.format('DD/MM/YYYY') + ' - ' + picker.endDate.format('DD/MM/YYYY'));
    });
    
    $('#fechaRango').on('cancel.daterangepicker', function(ev, picker) {
        $(this).val('');
    });
    
    // Cargar datos iniciales
    await Promise.all([
        cargarCategorias(),
        cargarClientes(),
        cargarAsesores()
    ]);
    
    // Cargar ingresos iniciales
    cargarIngresos();
    
    // Evento para buscar con filtros
    document.getElementById('btnBuscar').addEventListener('click', function() {
        const filtros = obtenerFiltros();
        cargarIngresos(1, filtros);
    });
    
    // Evento para limpiar filtros
    document.getElementById('btnLimpiarFiltros').addEventListener('click', function() {
        document.getElementById('fechaRango').value = '';
        document.getElementById('categoriaFiltro').value = '';
        document.getElementById('estadoFiltro').value = '';
        document.getElementById('metodoFiltro').value = '';
        document.getElementById('busquedaTexto').value = '';
        
        // Reiniciar select2
        $('#categoriaFiltro').val('').trigger('change');
        
        // Cargar ingresos sin filtros
        cargarIngresos();
    });
    
    // Evento para abrir modal de nuevo ingreso
    document.getElementById('btnNuevoIngreso').addEventListener('click', nuevoIngreso);
    
    // Evento para guardar ingreso
    document.getElementById('btnGuardarIngreso').addEventListener('click', guardarIngreso);
    
    // Evento para manejar cambio de categoría
    document.getElementById('categoriaIngreso').addEventListener('change', manejarCambioCategoria);
    
    // Evento para manejar cambio de valor bruto, porcentaje de retención o comisión
    document.getElementById('valorBruto').addEventListener('input', calcularValores);
    document.getElementById('porcentajeRetencion').addEventListener('input', calcularValores);
    document.getElementById('porcentajeComision').addEventListener('input', calcularValores);
    
    // Evento para manejar cambio de cliente
    document.getElementById('clienteIngreso').addEventListener('change', function() {
        const clienteId = this.value;
        cargarCreditosCliente(clienteId);
    });
    
    // Evento para manejar cambio de crédito
    document.getElementById('creditoIngreso').addEventListener('change', function() {
        const creditoId = this.value;
        cargarDetalleCredito(creditoId);
    });
    
    // Evento para editar desde modal de detalle
    document.getElementById('btnEditarDesdeDetalle').addEventListener('click', function() {
        const id = this.dataset.id;
        
        // Cerrar modal de detalle
        const modalElement = document.getElementById('detalleIngresoModal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal.hide();
        
        // Abrir modal de edición
        editarIngreso(id);
    });
    
    // Evento para anular desde modal de detalle
    document.getElementById('btnAnularDesdeDetalle').addEventListener('click', function() {
        const id = this.dataset.id;
        anularIngreso(id);
    });
    
    // Evento para abrir modal de administrar categorías
    document.getElementById('btnAdministrarCategorias').addEventListener('click', function() {
        // Implementar en próxima actualización
        alert('Funcionalidad en desarrollo');
    });
    
    // Evento para buscar cliente por documento
    document.getElementById('btnBuscarCliente').addEventListener('click', buscarClientePorDocumento);
    
    // Evento para cargar lista completa de clientes
    document.getElementById('btnCargarListaClientes').addEventListener('click', cargarListaClientes);
    
    // Evento para filtrar clientes en la tabla
    document.getElementById('filtroBusquedaClientes').addEventListener('input', filtrarClientes);
});