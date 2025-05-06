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

// Función para abrir el modal de nuevo ingreso
function nuevoIngreso() {
    // Reiniciar el formulario
    const formIngreso = document.getElementById('formIngreso');
    if (formIngreso) {
        formIngreso.reset();
    } else {
        // Si no encontramos el formulario con ID 'formIngreso', buscar por el ID 'ingresoForm'
        const ingresoForm = document.getElementById('ingresoForm');
        if (ingresoForm) {
            ingresoForm.reset();
        }
    }
    
    // Reiniciar campos adicionales
    if (document.getElementById('infoCredito')) {
        document.getElementById('infoCredito').style.display = 'none';
    }
    
    // Ocultar secciones condicionales inicialmente
    if (document.getElementById('seccionCliente')) {
        document.getElementById('seccionCliente').style.display = 'none';
    }
    if (document.getElementById('seccionCredito')) {
        document.getElementById('seccionCredito').style.display = 'none';
    }
    if (document.getElementById('seccionComision')) {
        document.getElementById('seccionComision').style.display = 'none';
    }
    
    // Ocultar secciones adicionales si existen
    if (document.getElementById('seccionDatosPagador')) {
        document.getElementById('seccionDatosPagador').style.display = 'none';
    }
    if (document.getElementById('seccionTipoPago')) {
        document.getElementById('seccionTipoPago').style.display = 'none';
    }
    if (document.getElementById('seccionBusquedaCliente')) {
        document.getElementById('seccionBusquedaCliente').style.display = 'none';
    }
    
    // Establecer fecha actual
    const hoy = new Date().toISOString().split('T')[0];
    if (document.getElementById('fechaIngreso')) {
        document.getElementById('fechaIngreso').value = hoy;
    }
    
    // Cambiar título del modal
    if (document.getElementById('ingresoModalLabel')) {
        document.getElementById('ingresoModalLabel').textContent = 'Nuevo Ingreso';
    }
    
    // Mostrar botón de guardar y ocultar botón de actualizar
    if (document.getElementById('btnGuardarIngreso')) {
        document.getElementById('btnGuardarIngreso').style.display = 'block';
    }
    if (document.getElementById('btnActualizarIngreso')) {
        document.getElementById('btnActualizarIngreso').style.display = 'none';
    }
    
    // Eliminar ID existente si hay campo oculto
    if (document.getElementById('ingresoIdHidden')) {
        document.getElementById('ingresoIdHidden').value = '';
    }
    if (document.getElementById('ingresoId')) {
        document.getElementById('ingresoId').value = '';
    }
    
    // Establecer método de pago por defecto
    if (document.getElementById('metodoPagoIngreso')) {
        document.getElementById('metodoPagoIngreso').value = 'efectivo';
    }
    if (document.getElementById('metodoPago')) {
        document.getElementById('metodoPago').value = 'efectivo';
    }
    
    // Abrir modal
    try {
        const modalElement = document.getElementById('ingresoModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    } catch (e) {
        console.error("Error al abrir modal:", e);
        // Intentar alternativa con jQuery
        try {
            $('#ingresoModal').modal('show');
        } catch (e2) {
            console.error("Error al abrir modal con jQuery:", e2);
            alert("No se pudo abrir la modal. Por favor, revisa la consola para más detalles.");
        }
    }
}

// Función para manejar cambios en la categoría seleccionada
function manejarCambioCategoria() {
    console.log('Función manejarCambioCategoria ejecutada');
    
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
        
        // Ocultar el botón de búsqueda de cliente de crédito
        if (document.getElementById('btnBuscarClienteCredito')) {
            document.getElementById('btnBuscarClienteCredito').style.display = 'none';
        }
        
        return;
    }
    
    // Obtener datos de la categoría
    const categoriaId = categoriaSeleccionada.value;
    const categoriaNombre = categoriaSeleccionada.textContent.trim().toLowerCase();
    
    // Obtener atributos de datos
    const porcentajeRetencion = categoriaSeleccionada.dataset.retencion || 0;
    const requiereCliente = categoriaSeleccionada.dataset.cliente === 'true' || false;
    const permiteComision = categoriaSeleccionada.dataset.comision === 'true' || false;
    const esCredito = categoriaSeleccionada.dataset.credito === 'true' || false;
    
    // Verificar si es crédito de consumo por nombre (más confiable)
    const esCreditoConsumo = 
        categoriaNombre.includes('crédito') || 
        categoriaNombre.includes('credito') || 
        categoriaNombre.includes('consumo') ||
        categoriaNombre.includes('libranza') ||
        categoriaNombre.includes('libre inversión') ||
        categoriaNombre.includes('libre inversion') ||
        categoriaNombre.includes('intereses') ||
        esCredito;
    
    console.log('DEBUG - Categoría seleccionada:', {
        id: categoriaId,
        nombre: categoriaNombre,
        esCredito: esCredito,
        esCreditoConsumo: esCreditoConsumo,
        requiereCliente: requiereCliente
    });
    
    // Aplicar porcentaje de retención automático
    document.getElementById('porcentajeRetencion').value = porcentajeRetencion;
    
    // Mostrar sección cliente en todos los casos que se requiera
    if (requiereCliente && !esCreditoConsumo) {
        // Para clientes sin crédito, mostrar la sección normal
        document.getElementById('seccionCliente').style.display = 'block';
        
        // Ocultar créditos y botón de crédito
        document.getElementById('seccionCredito').style.display = 'none';
        if (document.getElementById('btnBuscarClienteCredito')) {
            document.getElementById('btnBuscarClienteCredito').style.display = 'none';
        }
        
        // Llenar selectores de clientes
        llenarSelectorClientes();
    } 
    else if (esCreditoConsumo) {
        // Para créditos, mostrar sección cliente y botón de búsqueda de crédito
        document.getElementById('seccionCliente').style.display = 'block';
        
        // Mostrar solo el botón de búsqueda de cliente de crédito
        const btnBuscarClienteCredito = document.getElementById('btnBuscarClienteCredito');
        if (btnBuscarClienteCredito) {
            btnBuscarClienteCredito.style.display = 'block';
            console.log('Botón de búsqueda de cliente de crédito MOSTRADO');
            // Asegurarse que no haya estilos que oculten el botón
            btnBuscarClienteCredito.style.visibility = 'visible';
            btnBuscarClienteCredito.style.opacity = '1';
        } else {
            console.error('El elemento btnBuscarClienteCredito no existe en el DOM');
        }
        
        // Ocultar secciones de cliente y crédito que ahora se manejan desde la modal
        document.getElementById('seccionCredito').style.display = 'none';
        if (document.getElementById('seccionDatosPagador')) {
            document.getElementById('seccionDatosPagador').style.display = 'none';
        }
    } 
    else {
        // Para el resto de categorías, ocultar todo
        document.getElementById('seccionCliente').style.display = 'none';
        document.getElementById('seccionCredito').style.display = 'none';
        if (document.getElementById('btnBuscarClienteCredito')) {
            document.getElementById('btnBuscarClienteCredito').style.display = 'none';
        }
    }
    
    // Mostrar/ocultar sección de comisión
    document.getElementById('seccionComision').style.display = permiteComision ? 'block' : 'none';
    
    // Si permite comisión, llenar selector de asesores
    if (permiteComision) {
        llenarSelectorAsesores();
    }
    
    // Recalcular valores si ya hay un valor bruto
    calcularValores();
}

// Función auxiliar para llenar el selector de clientes
function llenarSelectorClientes() {
    const selectCliente = document.getElementById('clienteIngreso');
    selectCliente.innerHTML = '<option value="">Seleccione un cliente</option>';
    
    clientes.forEach(cliente => {
        // Usar full_name si está disponible, o combinar nombre y apellido
        const nombreCompleto = cliente.full_name || 
                              `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim();
        const documento = cliente.identification || cliente.id_number || 'Sin documento';
        
        selectCliente.innerHTML += `<option value="${cliente.id}">${nombreCompleto} - ${documento}</option>`;
    });
}

// Función auxiliar para llenar el selector de asesores
function llenarSelectorAsesores() {
    const selectAsesor = document.getElementById('asesorIngreso');
    selectAsesor.innerHTML = '<option value="">Seleccione un asesor</option>';
    
    asesores.forEach(asesor => {
        const nombreCompleto = asesor.full_name || 
                             `${asesor.nombre || ''} ${asesor.apellido || ''}`.trim();
        const documento = asesor.id_number || 'Sin documento';
        
        selectAsesor.innerHTML += `<option value="${asesor.id}">${nombreCompleto} - ${documento}</option>`;
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
        console.log('Categorías cargadas:', categorias.length);
        
        // Llenar select de categorías en filtro
        const selectCategoriaFiltro = document.getElementById('categoriaFiltro');
        if (selectCategoriaFiltro) {
            selectCategoriaFiltro.innerHTML = '<option value="">Todas las categorías</option>';
            
            categorias.forEach(categoria => {
                selectCategoriaFiltro.innerHTML += `<option value="${categoria.id}">${categoria.nombre}</option>`;
            });
        }
        
        // Llenar select de categorías en el modal de nuevo ingreso
        const selectCategoriaIngreso = document.getElementById('categoriaIngreso');
        if (selectCategoriaIngreso) {
            selectCategoriaIngreso.innerHTML = '<option value="">Seleccione una categoría</option>';
            
            categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.id;
                option.textContent = categoria.nombre;
                
                // Agregar atributos de datos para usar en manejarCambioCategoria
                option.dataset.retencion = categoria.porcentaje_retencion || 0;
                option.dataset.cliente = categoria.requiere_cliente || false;
                option.dataset.comision = categoria.permite_comision || false;
                option.dataset.credito = categoria.es_credito || false;
                
                selectCategoriaIngreso.appendChild(option);
            });
        }
        
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

// Funciones para la modal de búsqueda de cliente y selección de crédito
async function buscarClientePorDocumentoModal() {
    const tipoDocumento = document.getElementById('tipoBusquedaClienteModal').value;
    const numeroDocumento = document.getElementById('documentoBusquedaClienteModal').value.trim();
    
    if (!numeroDocumento) {
        showToast('Por favor ingrese un número de documento', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/clients/document/${tipoDocumento}/${numeroDocumento}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error('Cliente no encontrado');
        }
        
        const cliente = result.data;
        
        // Llenar los campos con los datos del cliente
        document.getElementById('nombrePagadorModal').value = cliente.full_name || 
            `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim();
        document.getElementById('telefonoPagadorModal').value = cliente.telefono || cliente.phone || '';
        document.getElementById('correoPagadorModal').value = cliente.correo || cliente.email || '';
        document.getElementById('direccionPagadorModal').value = cliente.direccion || cliente.address || '';
        
        // Seleccionar el cliente en el selector de créditos
        const selectClienteCredito = document.getElementById('clienteCreditoModal');
        
        // Verificar si el cliente ya existe en el selector
        let existe = false;
        for (let i = 0; i < selectClienteCredito.options.length; i++) {
            if (selectClienteCredito.options[i].value == cliente.id) {
                selectClienteCredito.selectedIndex = i;
                existe = true;
                break;
            }
        }
        
        // Si no existe, agregar el cliente al selector
        if (!existe) {
            const nombreCompleto = cliente.full_name || 
                `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim();
            const documento = cliente.id_number || cliente.identification || 'Sin documento';
            
            const option = new Option(`${nombreCompleto} - ${documento}`, cliente.id);
            selectClienteCredito.add(option);
            option.selected = true;
        }
        
        // Cargar los créditos del cliente
        cargarCreditosClienteModal(cliente.id);
        
    } catch (error) {
        console.error('Error al buscar cliente:', error);
        showToast(`No se encontró el cliente con documento ${numeroDocumento}`, 'error');
    }
}

// Cargar créditos de un cliente en la modal
async function cargarCreditosClienteModal(clienteId) {
    if (!clienteId) return;
    
    try {
        const response = await fetch(`/api/loans/client/${clienteId}?active=true`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        let creditos = [];
        
        // Determinar la estructura de la respuesta
        if (Array.isArray(result)) {
            creditos = result;
        } else if (result.data && Array.isArray(result.data)) {
            creditos = result.data;
        } else if (result.loans && Array.isArray(result.loans)) {
            creditos = result.loans;
        } else if (!result.success) {
            throw new Error(result.error || 'Error al cargar créditos');
        }
        
        const tablaCreditos = document.getElementById('tablaCreditos');
        
        if (creditos.length === 0) {
            tablaCreditos.innerHTML = '<tr><td colspan="6" class="text-center">Este cliente no tiene créditos activos</td></tr>';
            return;
        }
        
        let html = '';
        creditos.forEach(credito => {
            const numero = credito.loan_number || credito.numero || `CRED-${credito.id}`;
            const tipo = credito.tipo || credito.type || 'No especificado';
            const monto = formatCurrency(credito.monto || credito.amount || 0);
            const saldo = formatCurrency(credito.saldo_actual || credito.current_balance || 0);
            const estado = credito.estado || credito.status || 'Activo';
            
            html += `
                <tr>
                    <td>${numero}</td>
                    <td>${tipo}</td>
                    <td>${monto}</td>
                    <td>${saldo}</td>
                    <td>${estado}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="seleccionarCreditoModal(${credito.id}, '${numero}', '${tipo}', ${credito.saldo_actual || credito.current_balance || 0})">
                            <i class="fas fa-check"></i> Seleccionar
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tablaCreditos.innerHTML = html;
        
    } catch (error) {
        console.error('Error al cargar créditos:', error);
        showToast('Error al cargar créditos: ' + error.message, 'error');
        document.getElementById('tablaCreditos').innerHTML = '<tr><td colspan="6" class="text-center">Error al cargar créditos</td></tr>';
    }
}

// Seleccionar un crédito en la modal
function seleccionarCreditoModal(creditoId, numero, tipo, saldo) {
    // Guardar el crédito seleccionado
    creditoSeleccionado = {
        id: creditoId,
        numero: numero,
        tipo: tipo,
        saldo: saldo
    };
    
    // Mostrar la sección de datos del pago
    document.getElementById('datosPagoCredito').style.display = 'block';
    
    // Actualizar información del crédito seleccionado
    document.getElementById('creditoSeleccionadoInfo').textContent = `Crédito seleccionado: ${numero} (${tipo})`;
    
    // Mostrar información detallada del crédito
    document.getElementById('infoCreditoModal').innerHTML = `
        <h6 class="mb-3">Información del Crédito</h6>
        <div class="row">
            <div class="col-md-6">
                <p><strong>Número:</strong> ${numero}</p>
                <p><strong>Tipo:</strong> ${tipo}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Saldo actual:</strong> ${formatCurrency(saldo)}</p>
            </div>
        </div>
    `;
    
    // Establecer valor por defecto en el campo de valor a pagar
    document.getElementById('valorPagoModal').value = saldo;
    
    // Establecer fecha actual en el campo de fecha de pago
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaPagoModal').value = hoy;
}

// Confirmar el pago y transferir datos a la modal principal
function confirmarPagoCredito() {
    // Verificar que se haya seleccionado un crédito
    if (!creditoSeleccionado) {
        showToast('Debe seleccionar un crédito', 'error');
        return;
    }
    
    // Obtener datos del formulario
    const valorPago = parseFloat(document.getElementById('valorPagoModal').value);
    const fechaPago = document.getElementById('fechaPagoModal').value;
    
    // Validar datos
    if (isNaN(valorPago) || valorPago <= 0) {
        showToast('El valor a pagar debe ser mayor a cero', 'error');
        return;
    }
    
    if (!fechaPago) {
        showToast('Debe seleccionar una fecha de pago', 'error');
        return;
    }
    
    // Obtener el tipo de pago seleccionado
    let tipoPago = '';
    const radiosTipoPago = document.getElementsByName('tipoPagoModal');
    for (const radio of radiosTipoPago) {
        if (radio.checked) {
            tipoPago = radio.value;
            break;
        }
    }
    
    // Transferir datos a la modal principal
    
    // 1. Establecer el valor bruto
    document.getElementById('valorBruto').value = valorPago;
    
    // 2. Establecer la fecha
    document.getElementById('fechaIngreso').value = fechaPago;
    
    // 3. Establecer el concepto con información del crédito
    document.getElementById('conceptoIngreso').value = `Pago ${tipoPago} de crédito ${creditoSeleccionado.numero} (${creditoSeleccionado.tipo})`;
    
    // 4. Establecer descripción
    const nombreCliente = document.getElementById('nombrePagadorModal').value;
    document.getElementById('descripcionIngreso').value = `Pago realizado por ${nombreCliente}. Saldo anterior: ${formatCurrency(creditoSeleccionado.saldo)}`;
    
    // 5. Calcular valores
    calcularValores();
    
    // Cerrar la modal de crédito
    const clienteCreditoModal = bootstrap.Modal.getInstance(document.getElementById('clienteCreditoModal'));
    clienteCreditoModal.hide();
    
    // Mostrar mensaje de éxito
    showToast('Datos de pago configurados correctamente', 'success');
}

// Variable global para almacenar el crédito seleccionado
let creditoSeleccionado = null;

// Inicialización de componentes y manejadores de eventos
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Inicializando módulo de ingresos...');
    
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

    // Inicializar evento para manejar cambio de categoría usando jQuery y Select2
    $(document).ready(function() {
        console.log('Inicializando eventos Select2...');
        
        // Usar evento select2:select para categorías
        $('#categoriaIngreso').on('select2:select', function (e) {
            console.log('Categoría seleccionada via select2:select');
            manejarCambioCategoria();
        });
        
        // También mantener el evento change normal para compatibilidad
        $('#categoriaIngreso').on('change', function() {
            console.log('Categoría cambiada via onChange');
            manejarCambioCategoria();
        });
    });
    
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
    
    // Eventos para la modal de búsqueda de cliente y selección de crédito
    document.getElementById('btnBuscarClienteModal').addEventListener('click', buscarClientePorDocumentoModal);
    document.getElementById('btnConfirmarPagoCredito').addEventListener('click', confirmarPagoCredito);
    
    // Evento para cambiar de cliente en la modal de crédito
    document.getElementById('clienteCreditoModal').addEventListener('change', function() {
        const clienteId = this.value;
        if (clienteId) {
            cargarCreditosClienteModal(clienteId);
        }
    });
    
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