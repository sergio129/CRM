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
    
    // Para categorías de crédito, abrir directamente la modal de búsqueda de clientes y créditos
    if (esCreditoConsumo) {
        // Ocultar la sección de cliente y crédito en la modal principal
        document.getElementById('seccionCliente').style.display = 'none';
        document.getElementById('seccionCredito').style.display = 'none';
        
        // Abrir automáticamente la modal de búsqueda de clientes y créditos
        const clienteCreditoModal = new bootstrap.Modal(document.getElementById('clienteCreditoModal'));
        clienteCreditoModal.show();
    } 
    else if (requiereCliente) {
        // Para clientes sin crédito, mostrar la sección normal
        document.getElementById('seccionCliente').style.display = 'block';
        document.getElementById('seccionCredito').style.display = 'none';
        
        // Llenar selectores de clientes
        llenarSelectorClientes();
    } 
    else {
        // Para el resto de categorías, ocultar todo
        document.getElementById('seccionCliente').style.display = 'none';
        document.getElementById('seccionCredito').style.display = 'none';
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

// Función para calcular valores (bruto, retención, comisión, neto)
function calcularValores() {
    // Valores iniciales
    const valorBruto = parseFloat(document.getElementById('valorBruto').value) || 0;
    const porcentajeRetencion = parseFloat(document.getElementById('porcentajeRetencion').value) || 0;
    let porcentajeComision = 0;
    
    // Comisión (solo si la sección de comisión está visible)
    if (document.getElementById('seccionComision').style.display === 'block') {
        porcentajeComision = parseFloat(document.getElementById('porcentajeComision').value) || 0;
    }
    
    // Calcular valores
    const valorRetencion = (valorBruto * porcentajeRetencion) / 100;
    const valorComision = (valorBruto * porcentajeComision) / 100;
    const valorNeto = valorBruto - valorRetencion - valorComision;
    
    // Actualizar campos
    document.getElementById('valorRetencion').value = valorRetencion.toFixed(2);
    
    // Actualizar comisión si está visible
    if (document.getElementById('seccionComision').style.display === 'block') {
        document.getElementById('valorComision').value = valorComision.toFixed(2);
    }
    
    // Actualizar valor neto
    document.getElementById('valorNeto').value = valorNeto.toFixed(2);
}

// Función para guardar un nuevo ingreso
async function guardarIngreso() {
    // Validar el formulario
    const form = document.getElementById('ingresoForm');
    
    // Verificar campos requeridos
    const categoriaIngreso = document.getElementById('categoriaIngreso').value;
    const fechaIngreso = document.getElementById('fechaIngreso').value;
    const conceptoIngreso = document.getElementById('conceptoIngreso').value;
    const valorBruto = parseFloat(document.getElementById('valorBruto').value) || 0;
    const metodoPago = document.getElementById('metodoPago').value;
    
    if (!categoriaIngreso || !fechaIngreso || !conceptoIngreso || valorBruto <= 0 || !metodoPago) {
        showToast('Por favor complete todos los campos requeridos', 'error');
        return;
    }
    
    // Obtener todos los datos del formulario
    const ingresoId = document.getElementById('ingresoId').value;
    const descripcionIngreso = document.getElementById('descripcionIngreso').value;
    const estadoIngreso = document.getElementById('estadoIngreso').value;
    const porcentajeRetencion = parseFloat(document.getElementById('porcentajeRetencion').value) || 0;
    const valorRetencion = parseFloat(document.getElementById('valorRetencion').value) || 0;
    const referenciaPago = document.getElementById('referenciaPago').value;
    const valorNeto = parseFloat(document.getElementById('valorNeto').value) || 0;
    
    // Datos opcionales que pueden estar presentes o no
    let clienteId = null;
    let creditoId = null;
    let asesorId = null;
    let porcentajeComision = 0;
    let valorComision = 0;
    
    // Verificar si la sección cliente está visible
    if (document.getElementById('seccionCliente').style.display === 'block') {
        clienteId = document.getElementById('clienteIngreso').value;
        
        // Verificar si se requiere cliente
        const categoriaSeleccionada = document.getElementById('categoriaIngreso').options[document.getElementById('categoriaIngreso').selectedIndex];
        const requiereCliente = categoriaSeleccionada.dataset.cliente === 'true';
        
        if (requiereCliente && !clienteId) {
            showToast('Por favor seleccione un cliente', 'error');
            return;
        }
        
        // Verificar si la sección crédito está visible
        if (document.getElementById('seccionCredito').style.display === 'block') {
            creditoId = document.getElementById('creditoIngreso').value;
            
            // Verificar si se requiere crédito
            const esCredito = categoriaSeleccionada.dataset.credito === 'true' || 
                              categoriaSeleccionada.textContent.toLowerCase().includes('crédito') ||
                              categoriaSeleccionada.textContent.toLowerCase().includes('credito');
            
            if (esCredito && !creditoId) {
                showToast('Por favor seleccione un crédito', 'error');
                return;
            }
        }
    }
    
    // Verificar si la sección comisión está visible
    if (document.getElementById('seccionComision').style.display === 'block') {
        asesorId = document.getElementById('asesorIngreso').value;
        porcentajeComision = parseFloat(document.getElementById('porcentajeComision').value) || 0;
        valorComision = parseFloat(document.getElementById('valorComision').value) || 0;
        
        // Verificar si se requiere asesor
        if (!asesorId) {
            showToast('Por favor seleccione un asesor', 'error');
            return;
        }
    }
    
    // Crear objeto con los datos del ingreso
    const ingresoData = {
        categoria_id: categoriaIngreso,
        fecha: fechaIngreso,
        concepto: conceptoIngreso,
        descripcion: descripcionIngreso,
        valor_bruto: valorBruto,
        metodo_pago: metodoPago,
        referencia_pago: referenciaPago,
        estado: estadoIngreso,
        porcentaje_retencion: porcentajeRetencion,
        valor_retencion: valorRetencion,
        valor_neto: valorNeto
    };
    
    // Agregar datos opcionales si existen
    if (clienteId) ingresoData.cliente_id = clienteId;
    if (creditoId) ingresoData.credito_id = creditoId;
    if (asesorId) {
        ingresoData.asesor_id = asesorId;
        ingresoData.porcentaje_comision = porcentajeComision;
        ingresoData.valor_comision = valorComision;
    }
    
    try {
        // Determinar si es creación o actualización
        const method = ingresoId ? 'PUT' : 'POST';
        const url = ingresoId ? `/api/ingresos/${ingresoId}` : '/api/ingresos';
        
        // Realizar la petición
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(ingresoData)
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error al guardar el ingreso');
        }
        
        // Procesar archivos adjuntos si hay alguno
        const archivoAdjunto = document.getElementById('archivoAdjunto').files[0];
        if (archivoAdjunto) {
            await subirArchivoAdjunto(ingresoId || result.data.id, archivoAdjunto);
        }
        
        // Mostrar mensaje de éxito
        showToast(ingresoId ? 'Ingreso actualizado correctamente' : 'Ingreso registrado correctamente', 'success');
        
        // Cerrar modal
        const modalElement = document.getElementById('ingresoModal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal.hide();
        
        // Recargar lista de ingresos
        cargarIngresos();
        
    } catch (error) {
        console.error('Error al guardar ingreso:', error);
        showToast('Error al guardar: ' + error.message, 'error');
    }
}

// Función para subir archivo adjunto
async function subirArchivoAdjunto(ingresoId, archivo) {
    try {
        const formData = new FormData();
        formData.append('archivo', archivo);
        
        const response = await fetch(`/api/ingresos/${ingresoId}/adjuntos`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error al subir archivo adjunto');
        }
        
    } catch (error) {
        console.error('Error al subir archivo adjunto:', error);
        showToast('Error al subir archivo: ' + error.message, 'error');
    }
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

// Función para cargar créditos de un cliente
async function cargarCreditosCliente(clienteId) {
    if (!clienteId) return;
    
    try {
        // Mostrar indicador de carga
        document.getElementById('creditoIngreso').innerHTML = '<option value="">Cargando créditos...</option>';
        
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
        
        // Llenar selector de créditos
        const selectCredito = document.getElementById('creditoIngreso');
        selectCredito.innerHTML = '<option value="">Seleccione un crédito</option>';
        
        if (creditos.length === 0) {
            selectCredito.innerHTML += '<option value="" disabled>El cliente no tiene créditos activos</option>';
            return;
        }
        
        creditos.forEach(credito => {
            const numero = credito.loan_number || credito.numero || `CRED-${credito.id}`;
            const tipo = credito.tipo || credito.type || 'No especificado';
            const saldo = formatCurrency(credito.saldo_actual || credito.current_balance || 0);
            
            selectCredito.innerHTML += `<option value="${credito.id}" data-saldo="${credito.saldo_actual || credito.current_balance || 0}">${numero} - ${tipo} (${saldo})</option>`;
        });
        
    } catch (error) {
        console.error('Error al cargar créditos del cliente:', error);
        showToast('Error al cargar créditos: ' + error.message, 'error');
        document.getElementById('creditoIngreso').innerHTML = '<option value="">Error al cargar créditos</option>';
    }
}

// Función para cargar el detalle de cuotas de un crédito
async function cargarDetalleCuotasCredito(creditoId) {
    try {
        console.log(`Cargando detalle de cuotas para el crédito ID=${creditoId}`);
        
        // Mostrar mensaje de carga en la tabla de cuotas
        const tablaCuotas = document.querySelector('.tabla-cuotas tbody') || document.getElementById('tablaCuotas');
        if (tablaCuotas) {
            tablaCuotas.innerHTML = '<tr><td colspan="7" class="text-center"><i class="fas fa-spinner fa-spin"></i> Cargando detalle de cuotas...</td></tr>';
        }
        
        try {
            // Intentar hacer la petición a la API para obtener el detalle de cuotas
            const response = await fetch(`/api/loans/${creditoId}/installments`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache'
                }
            });
            
            console.log('Respuesta de API de cuotas:', response.status);
            
            // Si la API no existe (error 404), generar datos simulados
            if (response.status === 404) {
                console.warn('La API de cuotas no está implementada. Generando datos simulados.');
                const cuotasSimuladas = generarCuotasSimuladas(creditoId);
                mostrarCuotasEnTabla(cuotasSimuladas, tablaCuotas, creditoId);
                return;
            }
            
            if (!response.ok) {
                throw new Error(`Error al obtener cuotas del crédito: ${response.status}`);
            }
            
            const responseText = await response.text();
            console.log('Respuesta de cuotas (texto):', responseText);
            
            // Intentar parsear el JSON
            let cuotas;
            try {
                const result = JSON.parse(responseText);
                
                // Determinar la estructura de la respuesta
                if (Array.isArray(result)) {
                    cuotas = result;
                } else if (result.data && Array.isArray(result.data)) {
                    cuotas = result.data;
                } else if (result.installments && Array.isArray(result.installments)) {
                    cuotas = result.installments;
                } else {
                    console.warn('Formato de respuesta no reconocido:', result);
                    cuotas = [];
                }
                
                console.log('Cuotas obtenidas:', cuotas);
            } catch (parseError) {
                console.error('Error al parsear respuesta de cuotas:', parseError);
                throw new Error('Error al procesar la respuesta del servidor');
            }
            
            // Si no hay cuotas, mostrar mensaje
            if (!cuotas || cuotas.length === 0) {
                if (tablaCuotas) {
                    tablaCuotas.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron cuotas para este crédito</td></tr>';
                }
                return;
            }
            
            // Mostrar las cuotas en la tabla
            mostrarCuotasEnTabla(cuotas, tablaCuotas, creditoId);
            
        } catch (error) {
            console.error('Error en la petición de cuotas:', error);
            
            // Si ocurre cualquier error, generar datos simulados para poder continuar
            console.warn('Generando datos simulados por error en la petición.');
            const cuotasSimuladas = generarCuotasSimuladas(creditoId);
            mostrarCuotasEnTabla(cuotasSimuladas, tablaCuotas, creditoId);
        }
        
    } catch (error) {
        console.error('Error al cargar detalle de cuotas:', error);
        
        // Mostrar mensaje de error en la tabla
        const tablaCuotas = document.querySelector('.tabla-cuotas tbody') || document.getElementById('tablaCuotas');
        if (tablaCuotas) {
            tablaCuotas.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error al cargar cuotas: ${error.message}</td></tr>`;
        }
    }
}

// Función para generar datos de cuotas simulados basados en la información del crédito
function generarCuotasSimuladas(creditoId) {
    console.log('Generando cuotas simuladas para el crédito:', creditoId);
    
    // Obtener los datos del crédito de la variable global
    const detallesCredito = window.creditoDetallesCompletos || {};
    
    // Obtener los valores relevantes para el cálculo
    const montoTotal = detallesCredito.amount_requested || 200000;
    const totalCuotas = detallesCredito.payment_term || 36;
    const cuotasPagadas = detallesCredito.payment_term && detallesCredito.remaining_installments ? 
                         detallesCredito.payment_term - detallesCredito.remaining_installments : 2;
    const tasaInteres = detallesCredito.interest_rate || 1.6; // porcentaje mensual
    
    // Calcular valor de la cuota (capital + interés)
    const tasaMensual = tasaInteres / 100; // convertir a decimal
    const valorCuota = (montoTotal * tasaMensual * Math.pow(1 + tasaMensual, totalCuotas)) / 
                      (Math.pow(1 + tasaMensual, totalCuotas) - 1);
    
    // Crear array de cuotas
    const cuotas = [];
    let saldoRestante = montoTotal;
    
    for (let i = 1; i <= totalCuotas; i++) {
        // Calcular interés de esta cuota
        const interesCuota = saldoRestante * tasaMensual;
        // Calcular capital de esta cuota
        const capitalCuota = valorCuota - interesCuota;
        // Actualizar saldo restante
        saldoRestante -= capitalCuota;
        
        // Determinar estado de la cuota
        let estado = 'pendiente';
        if (i <= cuotasPagadas) {
            estado = 'pagado';
        } else if (i === cuotasPagadas + 1) {
            // La siguiente cuota está por vencer
            estado = 'pendiente';
        } else if (i === cuotasPagadas + 2) {
            // Una cuota más adelante
            estado = 'pendiente';
        }
        
        // Calcular fecha de vencimiento (mes actual + i meses)
        const fechaActual = new Date();
        fechaActual.setMonth(fechaActual.getMonth() + i - cuotasPagadas);
        
        // Añadir la cuota al array
        cuotas.push({
            id: i,
            installment_number: i,
            due_date: fechaActual.toISOString().split('T')[0],
            amount: valorCuota.toFixed(2),
            principal: capitalCuota.toFixed(2),
            interest: interesCuota.toFixed(2),
            status: estado
        });
    }
    
    return cuotas;
}

// Función para mostrar las cuotas en la tabla
function mostrarCuotasEnTabla(cuotas, tablaCuotas, creditoId) {
    if (!tablaCuotas) return;
    
    // Generar HTML para las cuotas
    let html = '';
    cuotas.forEach((cuota, index) => {
        // Formatear fecha
        let fechaVencimiento = '--/--/----';
        if (cuota.due_date || cuota.fecha_vencimiento) {
            try {
                const fecha = new Date(cuota.due_date || cuota.fecha_vencimiento);
                if (!isNaN(fecha.getTime())) {
                    fechaVencimiento = fecha.toLocaleDateString('es-CO');
                }
            } catch (e) {
                console.warn('Error al formatear fecha de cuota:', e);
            }
        }
        
        // Valores monetarios
        const valorCuota = formatCurrency(cuota.amount || cuota.valor || 0);
        const valorCapital = formatCurrency(cuota.principal || cuota.capital || 0);
        const valorInteres = formatCurrency(cuota.interest || cuota.interes || 0);
        
        // Estado con estilo
        let estadoClass = '';
        let estadoTexto = cuota.status || cuota.estado || 'Pendiente';
        
        switch (estadoTexto.toLowerCase()) {
            case 'pagado':
            case 'pagada':
            case 'paid':
                estadoClass = 'bg-success';
                estadoTexto = 'Pagado';
                break;
            case 'pendiente':
            case 'pending':
                estadoClass = 'bg-warning';
                estadoTexto = 'Pendiente';
                break;
            case 'vencido':
            case 'vencida':
            case 'late':
            case 'overdue':
                estadoClass = 'bg-danger';
                estadoTexto = 'Vencido';
                break;
            default:
                estadoClass = 'bg-secondary';
        }
        
        // Construir fila
        html += `
            <tr>
                <td>${cuota.installment_number || cuota.numero || (index + 1)}</td>
                <td>${fechaVencimiento}</td>
                <td>${valorCuota}</td>
                <td>${valorCapital}</td>
                <td>${valorInteres}</td>
                <td><span class="badge ${estadoClass}">${estadoTexto}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="seleccionarCuota(${creditoId}, ${cuota.id || cuota.installment_number || (index + 1)}, ${parseFloat(cuota.amount || cuota.valor || 0)})">
                        Pagar
                    </button>
                </td>
            </tr>
        `;
    });
    
    // Actualizar la tabla
    tablaCuotas.innerHTML = html;
}

// Función para seleccionar un crédito de la tabla
async function seleccionarCredito(creditoId, numeroCredito, tipoCredito, saldoActual) {
    try {
        console.log(`Seleccionando crédito: ID=${creditoId}, Número=${numeroCredito}, Tipo=${tipoCredito}, Saldo=${saldoActual}`);
        
        // Primero guardamos referencia al botón para poder restaurarlo después
        const btnSeleccionar = event ? event.currentTarget : null;
        let btnTextOriginal = '';
        
        // Mostrar indicador de carga solo si tenemos el botón
        if (btnSeleccionar) {
            btnTextOriginal = btnSeleccionar.innerHTML;
            btnSeleccionar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
            btnSeleccionar.disabled = true;
        }
        
        // Actualizar información visible en la modal
        try {
            // Mostrar sección para configurar el pago
            const seccionPago = document.getElementById('seccionConfiguracionPago');
            if (seccionPago) {
                seccionPago.style.display = 'block';
            }
            
            // Actualizar datos del crédito en la sección de pago
            const creditoInfo = document.getElementById('creditoInfoPago');
            if (creditoInfo) {
                creditoInfo.innerHTML = `
                    <strong>Crédito seleccionado:</strong> ${numeroCredito} - ${tipoCredito}<br>
                    <strong>Saldo actual:</strong> ${formatCurrency(saldoActual)}
                `;
            }
            
            // Establecer valor por defecto en el campo de monto a pagar (si existe)
            const montoPago = document.getElementById('montoPago');
            if (montoPago) {
                montoPago.value = saldoActual;
                montoPago.max = saldoActual;
            }
            
            // Guardar ID del crédito en campo oculto para su uso posterior
            const creditoIdInput = document.getElementById('creditoIdSeleccionado');
            if (creditoIdInput) {
                creditoIdInput.value = creditoId;
            }
            
            // Mostrar botón de confirmación
            const btnConfirmar = document.getElementById('btnConfirmarSeleccion');
            if (btnConfirmar) {
                btnConfirmar.style.display = 'block';
                // Asegurarnos que el botón tenga el evento click asociado
                btnConfirmar.onclick = confirmarSeleccionCredito;
            }
            
            // Ocultar la tabla de créditos para mostrar solo la sección de pago
            const tablaContainer = document.getElementById('tablaCreditosContainer');
            if (tablaContainer) {
                tablaContainer.style.display = 'none';
            }
            
            // Ocultar el botón de búsqueda de cliente
            const seccionBusqueda = document.getElementById('seccionBusquedaCliente');
            if (seccionBusqueda) {
                seccionBusqueda.style.display = 'none';
            }
        } catch (uiError) {
            console.error('Error al actualizar UI con información de crédito seleccionado:', uiError);
        }
        
        try {
            // Obtener los detalles del crédito seleccionado
            const response = await fetch(`/api/loans/${creditoId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache'
                }
            });
            
            console.log('Respuesta de API de detalles del préstamo:', response.status);
            
            if (!response.ok) {
                throw new Error(`Error al obtener detalles del crédito: ${response.status}`);
            }
            
            const responseText = await response.text();
            console.log('Respuesta texto completo:', responseText);
            
            // Intentar parsear como JSON con manejo de errores
            let detallesCredito;
            try {
                detallesCredito = JSON.parse(responseText);
                console.log('Detalles del crédito recibidos:', detallesCredito);
            } catch (parseError) {
                console.error('Error al parsear respuesta JSON:', parseError);
                throw new Error('Error al procesar la respuesta del servidor');
            }
            
            // Actualizar la tabla de amortización con los datos detallados del crédito
            // con protección adicional contra errores
            if (detallesCredito) {
                try {
                    // Actualizar tabla general de amortización
                    actualizarTablaAmortizacion(detallesCredito);
                    
                    // También guardar los detalles completos del crédito en variable global o en un campo oculto
                    window.creditoDetallesCompletos = detallesCredito;
                    
                    // Mostrar sección de tabla de amortización si existe
                    const seccionAmortizacion = document.getElementById('seccionTablaAmortizacion');
                    if (seccionAmortizacion) {
                        seccionAmortizacion.style.display = 'block';
                    }
                    
                    // Cargar detalle de cuotas del crédito
                    cargarDetalleCuotasCredito(creditoId);
                } catch (amortizacionError) {
                    console.error('Error al actualizar tabla de amortización:', amortizacionError);
                    // No propagar este error para no bloquear el flujo
                }
            }
        } catch (apiError) {
            console.error('Error al obtener detalles del crédito:', apiError);
            // Mostrar mensaje de error en la UI pero mantener el modal abierto
            const errorMsg = document.getElementById('errorCreditoMsg');
            if (errorMsg) {
                errorMsg.textContent = 'Error al cargar detalles del crédito. Por favor, inténtelo de nuevo.';
                errorMsg.style.display = 'block';
            }
        }
        
        // Siempre restaurar el botón, incluso si hay error
        if (btnSeleccionar) {
            btnSeleccionar.innerHTML = btnTextOriginal;
            btnSeleccionar.disabled = false;
        }
        
        // Mostrar mensaje de éxito
        showToast('Crédito seleccionado correctamente', 'success');
        
    } catch (error) {
        console.error('Error general en seleccionarCredito:', error);
        showToast('Ha ocurrido un error al seleccionar el crédito', 'error');
        
        // Asegurarse de restaurar cualquier UI que pueda haber quedado en estado incompleto
        const btnSeleccionar = event ? event.currentTarget : null;
        if (btnSeleccionar) {
            btnSeleccionar.innerHTML = '<i class="fas fa-check"></i> Seleccionar';
            btnSeleccionar.disabled = false;
        }
    }
}

// Función para cargar el detalle de cuotas de un crédito
async function cargarDetalleCuotasCredito(creditoId) {
    try {
        console.log(`Cargando detalle de cuotas para el crédito ID=${creditoId}`);
        
        // Mostrar mensaje de carga en la tabla de cuotas
        const tablaCuotas = document.querySelector('.tabla-cuotas tbody') || document.getElementById('tablaCuotas');
        if (tablaCuotas) {
            tablaCuotas.innerHTML = '<tr><td colspan="7" class="text-center"><i class="fas fa-spinner fa-spin"></i> Cargando detalle de cuotas...</td></tr>';
        }
        
        try {
            // Intentar hacer la petición a la API para obtener el detalle de cuotas
            const response = await fetch(`/api/loans/${creditoId}/installments`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache'
                }
            });
            
            console.log('Respuesta de API de cuotas:', response.status);
            
            // Si la API no existe (error 404), generar datos simulados
            if (response.status === 404) {
                console.warn('La API de cuotas no está implementada. Generando datos simulados.');
                const cuotasSimuladas = generarCuotasSimuladas(creditoId);
                mostrarCuotasEnTabla(cuotasSimuladas, tablaCuotas, creditoId);
                return;
            }
            
            if (!response.ok) {
                throw new Error(`Error al obtener cuotas del crédito: ${response.status}`);
            }
            
            const responseText = await response.text();
            console.log('Respuesta de cuotas (texto):', responseText);
            
            // Intentar parsear el JSON
            let cuotas;
            try {
                const result = JSON.parse(responseText);
                
                // Determinar la estructura de la respuesta
                if (Array.isArray(result)) {
                    cuotas = result;
                } else if (result.data && Array.isArray(result.data)) {
                    cuotas = result.data;
                } else if (result.installments && Array.isArray(result.installments)) {
                    cuotas = result.installments;
                } else {
                    console.warn('Formato de respuesta no reconocido:', result);
                    cuotas = [];
                }
                
                console.log('Cuotas obtenidas:', cuotas);
            } catch (parseError) {
                console.error('Error al parsear respuesta de cuotas:', parseError);
                throw new Error('Error al procesar la respuesta del servidor');
            }
            
            // Si no hay cuotas, mostrar mensaje
            if (!cuotas || cuotas.length === 0) {
                if (tablaCuotas) {
                    tablaCuotas.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron cuotas para este crédito</td></tr>';
                }
                return;
            }
            
            // Mostrar las cuotas en la tabla
            mostrarCuotasEnTabla(cuotas, tablaCuotas, creditoId);
            
        } catch (error) {
            console.error('Error en la petición de cuotas:', error);
            
            // Si ocurre cualquier error, generar datos simulados para poder continuar
            console.warn('Generando datos simulados por error en la petición.');
            const cuotasSimuladas = generarCuotasSimuladas(creditoId);
            mostrarCuotasEnTabla(cuotasSimuladas, tablaCuotas, creditoId);
        }
        
    } catch (error) {
        console.error('Error al cargar detalle de cuotas:', error);
        
        // Mostrar mensaje de error en la tabla
        const tablaCuotas = document.querySelector('.tabla-cuotas tbody') || document.getElementById('tablaCuotas');
        if (tablaCuotas) {
            tablaCuotas.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error al cargar cuotas: ${error.message}</td></tr>`;
        }
    }
}

// Función para generar datos de cuotas simulados basados en la información del crédito
function generarCuotasSimuladas(creditoId) {
    console.log('Generando cuotas simuladas para el crédito:', creditoId);
    
    // Obtener los datos del crédito de la variable global
    const detallesCredito = window.creditoDetallesCompletos || {};
    
    // Obtener los valores relevantes para el cálculo
    const montoTotal = detallesCredito.amount_requested || 200000;
    const totalCuotas = detallesCredito.payment_term || 36;
    const cuotasPagadas = detallesCredito.payment_term && detallesCredito.remaining_installments ? 
                         detallesCredito.payment_term - detallesCredito.remaining_installments : 2;
    const tasaInteres = detallesCredito.interest_rate || 1.6; // porcentaje mensual
    
    // Calcular valor de la cuota (capital + interés)
    const tasaMensual = tasaInteres / 100; // convertir a decimal
    const valorCuota = (montoTotal * tasaMensual * Math.pow(1 + tasaMensual, totalCuotas)) / 
                      (Math.pow(1 + tasaMensual, totalCuotas) - 1);
    
    // Crear array de cuotas
    const cuotas = [];
    let saldoRestante = montoTotal;
    
    for (let i = 1; i <= totalCuotas; i++) {
        // Calcular interés de esta cuota
        const interesCuota = saldoRestante * tasaMensual;
        // Calcular capital de esta cuota
        const capitalCuota = valorCuota - interesCuota;
        // Actualizar saldo restante
        saldoRestante -= capitalCuota;
        
        // Determinar estado de la cuota
        let estado = 'pendiente';
        if (i <= cuotasPagadas) {
            estado = 'pagado';
        } else if (i === cuotasPagadas + 1) {
            // La siguiente cuota está por vencer
            estado = 'pendiente';
        } else if (i === cuotasPagadas + 2) {
            // Una cuota más adelante
            estado = 'pendiente';
        }
        
        // Calcular fecha de vencimiento (mes actual + i meses)
        const fechaActual = new Date();
        fechaActual.setMonth(fechaActual.getMonth() + i - cuotasPagadas);
        
        // Añadir la cuota al array
        cuotas.push({
            id: i,
            installment_number: i,
            due_date: fechaActual.toISOString().split('T')[0],
            amount: valorCuota.toFixed(2),
            principal: capitalCuota.toFixed(2),
            interest: interesCuota.toFixed(2),
            status: estado
        });
    }
    
    return cuotas;
}

// Función para mostrar las cuotas en la tabla
function mostrarCuotasEnTabla(cuotas, tablaCuotas, creditoId) {
    if (!tablaCuotas) return;
    
    // Generar HTML para las cuotas
    let html = '';
    cuotas.forEach((cuota, index) => {
        // Formatear fecha
        let fechaVencimiento = '--/--/----';
        if (cuota.due_date || cuota.fecha_vencimiento) {
            try {
                const fecha = new Date(cuota.due_date || cuota.fecha_vencimiento);
                if (!isNaN(fecha.getTime())) {
                    fechaVencimiento = fecha.toLocaleDateString('es-CO');
                }
            } catch (e) {
                console.warn('Error al formatear fecha de cuota:', e);
            }
        }
        
        // Valores monetarios
        const valorCuota = formatCurrency(cuota.amount || cuota.valor || 0);
        const valorCapital = formatCurrency(cuota.principal || cuota.capital || 0);
        const valorInteres = formatCurrency(cuota.interest || cuota.interes || 0);
        
        // Estado con estilo
        let estadoClass = '';
        let estadoTexto = cuota.status || cuota.estado || 'Pendiente';
        
        switch (estadoTexto.toLowerCase()) {
            case 'pagado':
            case 'pagada':
            case 'paid':
                estadoClass = 'bg-success';
                estadoTexto = 'Pagado';
                break;
            case 'pendiente':
            case 'pending':
                estadoClass = 'bg-warning';
                estadoTexto = 'Pendiente';
                break;
            case 'vencido':
            case 'vencida':
            case 'late':
            case 'overdue':
                estadoClass = 'bg-danger';
                estadoTexto = 'Vencido';
                break;
            default:
                estadoClass = 'bg-secondary';
        }
        
        // Construir fila
        html += `
            <tr>
                <td>${cuota.installment_number || cuota.numero || (index + 1)}</td>
                <td>${fechaVencimiento}</td>
                <td>${valorCuota}</td>
                <td>${valorCapital}</td>
                <td>${valorInteres}</td>
                <td><span class="badge ${estadoClass}">${estadoTexto}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="seleccionarCuota(${creditoId}, ${cuota.id || cuota.installment_number || (index + 1)}, ${parseFloat(cuota.amount || cuota.valor || 0)})">
                        Pagar
                    </button>
                </td>
            </tr>
        `;
    });
    
    // Actualizar la tabla
    tablaCuotas.innerHTML = html;
}

// Función para seleccionar una cuota específica para pago
function seleccionarCuota(creditoId, cuotaId, valorCuota) {
    try {
        console.log(`Seleccionando cuota: CréditoID=${creditoId}, CuotaID=${cuotaId}, Valor=${valorCuota}`);
        
        // Establecer valor en el campo de monto a pagar
        const montoPago = document.getElementById('montoPago');
        if (montoPago) {
            montoPago.value = valorCuota;
        }
        
        // Seleccionar opción de "Pago de cuota" en tipo de pago
        const radioPagoCuota = document.getElementById('pagoCuota');
        if (radioPagoCuota) {
            radioPagoCuota.checked = true;
        }
        
        // Actualizar concepto específico si existe
        const conceptoEspecifico = document.getElementById('conceptoEspecifico');
        if (conceptoEspecifico) {
            conceptoEspecifico.value = `Pago cuota ${cuotaId} de crédito`;
        }
        
        // Guardar ID de cuota en campo oculto si existe
        const cuotaIdInput = document.getElementById('cuotaIdSeleccionada');
        if (cuotaIdInput) {
            cuotaIdInput.value = cuotaId;
        } else {
            // Si no existe el campo, crear uno oculto
            const input = document.createElement('input');
            input.type = 'hidden';
            input.id = 'cuotaIdSeleccionada';
            input.name = 'cuotaIdSeleccionada';
            input.value = cuotaId;
            document.body.appendChild(input);
        }
        
        // Hacer scroll hasta la sección de configuración de pago
        const seccionPago = document.getElementById('seccionConfiguracionPago');
        if (seccionPago) {
            seccionPago.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Mostrar mensaje de selección
        showToast(`Cuota ${cuotaId} seleccionada para pago`, 'success');
        
    } catch (error) {
        console.error('Error al seleccionar cuota:', error);
        showToast('Error al seleccionar cuota', 'error');
    }
}

// Función para confirmar la selección del crédito y cerrar el modal
function confirmarSeleccionCredito() {
    try {
        console.log('Confirmando selección de crédito');
        
        // Obtener valores de los campos
        const creditoId = document.getElementById('creditoIdSeleccionado').value;
        const montoPago = parseFloat(document.getElementById('montoPago').value) || 0;
        
        if (!creditoId) {
            showToast('Por favor seleccione un crédito primero', 'error');
            return;
        }
        
        if (montoPago <= 0) {
            showToast('Por favor ingrese un monto válido para el pago', 'error');
            return;
        }
        
        // Recuperar información del crédito
        const detallesCredito = window.creditoDetallesCompletos || {};
        const numeroCredito = detallesCredito.loan_number || '';
        const tipoCredito = detallesCredito.interest_type || '';
        
        // Actualizar la información básica en el formulario principal
        actualizarInfoCreditoSeleccionado(creditoId, numeroCredito, tipoCredito, montoPago);
        
        // Ahora sí cerrar el modal
        const creditoModal = document.getElementById('clienteCreditoModal');
        if (creditoModal) {
            const bsModal = bootstrap.Modal.getInstance(creditoModal);
            if (bsModal) {
                bsModal.hide();
            } else {
                // Alternativa si no se obtiene la instancia
                $(creditoModal).modal('hide');
            }
        }
        
        // Asegurarse de que cualquier modal backdrop se elimine
        document.querySelectorAll('.modal-backdrop').forEach(el => {
            el.remove();
        });
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        // Mostrar mensaje de éxito
        showToast('Pago configurado correctamente', 'success');
        
    } catch (error) {
        console.error('Error al confirmar selección:', error);
        showToast('Error al configurar el pago', 'error');
    }
}

// Añadir inicialización para confirmar pago cuando el documento esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Buscar el botón de confirmar pago y asignarle el evento
    const btnConfirmarPago = document.getElementById('btnConfirmarPago');
    if (btnConfirmarPago) {
        btnConfirmarPago.addEventListener('click', confirmarSeleccionCredito);
    }

    // Buscar también por el ID btnConfirmarPagoCredito
    const btnConfirmarPagoCredito = document.getElementById('btnConfirmarPagoCredito');
    if (btnConfirmarPagoCredito) {
        console.log('Asignando evento click a btnConfirmarPagoCredito');
        btnConfirmarPagoCredito.addEventListener('click', confirmarSeleccionCredito);
    }

    // Asignar eventos dinámicamente cuando se abra el modal
    $('#clienteCreditoModal').on('shown.bs.modal', function () {
        console.log('Modal de crédito abierta - asignando eventos');
        
        // Buscar por todos los posibles IDs de botones
        const posiblesIdsBotones = ['btnConfirmarPago', 'btnConfirmarSeleccion', 'btnConfirmarPagoCredito'];
        
        posiblesIdsBotones.forEach(id => {
            const boton = document.getElementById(id);
            if (boton) {
                console.log(`Encontrado botón con ID ${id} - asignando evento`);
                boton.onclick = confirmarSeleccionCredito;
            }
        });
    });
});

// Buscar cliente por documento
async function buscarClientePorDocumento() {
    const tipoDocumento = document.getElementById('tipoBusquedaCliente').value;
    const numeroDocumento = document.getElementById('documentoBusquedaCliente').value.trim();
    
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
        
        // Seleccionar el cliente encontrado
        const selectCliente = document.getElementById('clienteIngreso');
        
        // Verificar si ya existe en la lista
        let existe = false;
        for (let i = 0; i < selectCliente.options.length; i++) {
            if (selectCliente.options[i].value == cliente.id) {
                selectCliente.selectedIndex = i;
                existe = true;
                break;
            }
        }
        
        // Si no existe, agregar a la lista
        if (!existe) {
            // Crear nombre completo
            const nombreCompleto = cliente.full_name || 
                `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim();
            const documento = cliente.id_number || cliente.identification || 'Sin documento';
            
            const option = new Option(`${nombreCompleto} - ${documento}`, cliente.id);
            selectCliente.add(option);
            option.selected = true;
        }
        
        // Trigger change event para cargar créditos si aplica
        if (document.createEvent) {
            var event = document.createEvent('HTMLEvents');
            event.initEvent('change', true, false);
            selectCliente.dispatchEvent(event);
        } else {
            selectCliente.fireEvent('onchange');
        }
        
        showToast('Cliente encontrado', 'success');
        
    } catch (error) {
        console.error('Error al buscar cliente:', error);
        showToast(`No se encontró el cliente con documento ${numeroDocumento}`, 'error');
    }
}

// Buscar cliente por documento en el modal de cliente/crédito
async function buscarClientePorDocumentoModal() {
    const tipoDocumento = document.getElementById('tipoBusquedaClienteModal').value;
    const numeroDocumento = document.getElementById('documentoBusquedaClienteModal').value.trim();
    
    if (!numeroDocumento) {
        showToast('Por favor ingrese un número de documento', 'error');
        return;
    }
    
    try {
        // Primero, limpiar cualquier mensaje de error previo
        const errorElements = document.querySelectorAll('.error');
        errorElements.forEach(el => {
            el.style.display = 'none';
        });
        
        // Mostrar indicador de carga o deshabilitar botón
        const btnBuscar = document.getElementById('btnBuscarClienteModal');
        const btnTextOriginal = btnBuscar.innerHTML;
        btnBuscar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
        btnBuscar.disabled = true;
        
        // Log para depurar
        console.log(`Buscando cliente con tipo: ${tipoDocumento}, numero: ${numeroDocumento}`);
        
        const response = await fetch(`/api/clients/document/${tipoDocumento}/${numeroDocumento}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        
        // Log para depurar
        console.log('Respuesta recibida:', response.status);
        
        // Restablecer el botón
        btnBuscar.innerHTML = btnTextOriginal;
        btnBuscar.disabled = false;
        
        // MODIFICADO: Verificar si la respuesta no es exitosa
        if (!response.ok) {
            throw new Error(`No se encontró el cliente con documento ${numeroDocumento}`);
        }
        
        // Obtener los datos JSON de la respuesta
        const result = await response.json();
        console.log('Respuesta parseada:', result);
        
        // Verificar si la respuesta tiene datos válidos
        let cliente;
        
        if (result.success === true && result.data) {
            // Formato estándar de la API
            cliente = result.data;
        } else if (result.id) {
            // Formato alternativo donde los datos vienen directamente
            cliente = result;
        } else {
            throw new Error('Formato de respuesta no válido o cliente no encontrado');
        }
        
        // Verificar que tenemos un cliente válido con ID
        if (!cliente || !cliente.id) {
            throw new Error('Datos del cliente incompletos');
        }
        
        console.log('Cliente encontrado exitosamente:', cliente);
        
        // Ocultar TODOS los mensajes de error
        document.querySelectorAll('.alert-danger').forEach(el => {
            el.style.display = 'none';
        });
        
        // Asegurarse de que NO se muestre el error en el modal
        const errorContainer = document.querySelector('#clienteCreditoModal .error');
        if (errorContainer) {
            errorContainer.style.display = 'none';
            errorContainer.textContent = '';
        }
        
        // Llenar los campos del modal con la información del cliente
        if (document.getElementById('nombrePagadorModal')) {
            document.getElementById('nombrePagadorModal').value = cliente.full_name || '';
        }
        if (document.getElementById('telefonoPagadorModal')) {
            document.getElementById('telefonoPagadorModal').value = cliente.phone || cliente.telefono_movil || '';
        }
        if (document.getElementById('correoPagadorModal')) {
            document.getElementById('correoPagadorModal').value = cliente.email || '';
        }
        if (document.getElementById('direccionPagadorModal')) {
            document.getElementById('direccionPagadorModal').value = cliente.address || '';
        }
        
        // CORREGIDO: Actualizar correctamente el selector de clientes
        // Usar la clase select2 para identificar el elemento correcto
        const selectClienteCredito = document.querySelector('#clienteCreditoModal.form-select.select2');
        
        if (selectClienteCredito) {
            // Crear nombre completo
            const nombreCompleto = cliente.full_name || 
                `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim();
            const documento = cliente.id_number || cliente.identification || 'Sin documento';
            
            // Método 1: Usando directamente innerHTML para actualizar las opciones
            selectClienteCredito.innerHTML = '';
            selectClienteCredito.innerHTML += `<option value="">Seleccione un cliente</option>`;
            selectClienteCredito.innerHTML += `<option value="${cliente.id}">${nombreCompleto} - ${documento}</option>`;
            selectClienteCredito.value = cliente.id;
            
            // Si está usando Select2, actualizar la interfaz
            if (window.jQuery && $.fn.select2) {
                $(selectClienteCredito).val(cliente.id).trigger('change');
            }
            
            console.log(`Cliente ${nombreCompleto} agregado al selector de créditos`);
        } else {
            console.error('No se encontró el selector de clientes en el modal');
        }
        
        // Mostrar sección de datos del pago si existe
        if (document.getElementById('datosPagoCredito')) {
            document.getElementById('datosPagoCredito').style.display = 'block';
        }
        
        // Cargar los créditos del cliente si tiene ID
        if (cliente.id) {
            await cargarCreditosTabla(cliente.id);
        }
        
        showToast(`Cliente encontrado: ${cliente.full_name}`, 'success');
        
    } catch (error) {
        console.error('Error al buscar cliente:', error);
        showToast(`${error.message}`, 'error');
        
        // Crear o actualizar mensaje de error en el modal
        let errorDiv = document.querySelector('#clienteCreditoModal .error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error alert alert-danger mt-2';
            const modalBody = document.querySelector('#clienteCreditoModal .modal-body');
            if (modalBody) {
                modalBody.insertBefore(errorDiv, modalBody.firstChild);
            }
        }
        
        // Asegurar que el mensaje de error se muestra
        if (errorDiv) {
            errorDiv.textContent = `${error.message}`;
            errorDiv.style.display = 'block';
        }
        
        // Limpiar campos
        if (document.getElementById('nombrePagadorModal')) {
            document.getElementById('nombrePagadorModal').value = '';
        }
        if (document.getElementById('telefonoPagadorModal')) {
            document.getElementById('telefonoPagadorModal').value = '';
        }
        if (document.getElementById('correoPagadorModal')) {
            document.getElementById('correoPagadorModal').value = '';
        }
        if (document.getElementById('direccionPagadorModal')) {
            document.getElementById('direccionPagadorModal').value = '';
        }
        
        // Ocultar sección de datos del pago
        if (document.getElementById('datosPagoCredito')) {
            document.getElementById('datosPagoCredito').style.display = 'none';
        }
        
        // Limpiar la tabla de créditos
        document.getElementById('tablaCreditos').innerHTML = '<tr><td colspan="6" class="text-center">No se encontraron créditos</td></tr>';
    }
}

// Función para cargar los créditos en la tabla del modal
async function cargarCreditosTabla(clienteId) {
    if (!clienteId) return;
    
    try {
        // Mostrar indicador de carga
        document.getElementById('tablaCreditos').innerHTML = '<tr><td colspan="6" class="text-center">Cargando créditos...</td></tr>';
        
        const response = await fetch(`/api/loans/client/${clienteId}?active=true`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Respuesta de API de préstamos:', response.status);
        
        const responseText = await response.text();
        console.log('Respuesta completa de préstamos:', responseText);
        
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error('Error al parsear JSON de préstamos:', e);
            throw new Error('Error al procesar la respuesta del servidor');
        }
        
        console.log('Préstamos parseados:', result);
        
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
        
        console.log('Créditos a mostrar:', creditos);
        
        // Mostrar los créditos en la tabla
        const tablaCreditos = document.getElementById('tablaCreditos');
        
        if (creditos.length === 0) {
            tablaCreditos.innerHTML = '<tr><td colspan="6" class="text-center">El cliente no tiene créditos activos</td></tr>';
            return;
        }
        
        let html = '';
        creditos.forEach(credito => {
            const numero = credito.loan_number || credito.numero || `CRED-${credito.id}`;
            const tipo = credito.interest_type || credito.tipo || 'No especificado';
            
            // Usar amount_requested para el monto inicial del préstamo
            const monto = formatCurrency(credito.amount_requested || credito.monto || 0);
            
            // Usar total_due para el saldo actual
            const saldo = formatCurrency(credito.total_due || credito.saldo_actual || credito.current_balance || 0);
            
            const estado = credito.loan_status || credito.estado || credito.status || 'Activo';
            
            html += `
                <tr>
                    <td>${numero}</td>
                    <td>${tipo}</td>
                    <td>${monto}</td>
                    <td>${saldo}</td>
                    <td>${estado}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="seleccionarCredito(${credito.id}, '${numero}', '${tipo}', ${credito.total_due || credito.saldo_actual || credito.current_balance || 0})">
                            <i class="fas fa-check"></i> Seleccionar
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tablaCreditos.innerHTML = html;
        
    } catch (error) {
        console.error('Error al cargar créditos del cliente:', error);
        showToast('Error al cargar créditos: ' + error.message, 'error');
        document.getElementById('tablaCreditos').innerHTML = '<tr><td colspan="6" class="text-center">Error al cargar créditos</td></tr>';
    }
}

// Cargar lista completa de clientes
async function cargarListaClientes() {
    try {
        const tablaClientes = document.getElementById('tablaClientes');
        tablaClientes.innerHTML = '<tr><td colspan="4" class="text-center">Cargando clientes...</td></tr>';
        
        // Si ya tenemos los clientes cargados, no hacer otra petición
        if (clientes.length > 0) {
            renderizarTablaClientes(clientes);
            return;
        }
        
        await cargarClientes();
        renderizarTablaClientes(clientes);
        
    } catch (error) {
        console.error('Error al cargar lista de clientes:', error);
        showToast('Error al cargar clientes: ' + error.message, 'error');
        document.getElementById('tablaClientes').innerHTML = '<tr><td colspan="4" class="text-center">Error al cargar clientes</td></tr>';
    }
}

// Renderizar tabla de clientes
function renderizarTablaClientes(listaClientes) {
    const tablaClientes = document.getElementById('tablaClientes');
    
    if (listaClientes.length === 0) {
        tablaClientes.innerHTML = '<tr><td colspan="4" class="text-center">No se encontraron clientes</td></tr>';
        return;
    }
    
    let html = '';
    listaClientes.forEach(cliente => {
        // Crear nombre completo
        const nombreCompleto = cliente.full_name || 
            `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim();
        const documento = cliente.id_number || cliente.identification || 'Sin documento';
        const telefono = cliente.telefono || cliente.phone || 'No especificado';
        
        html += `
            <tr>
                <td>${nombreCompleto}</td>
                <td>${documento}</td>
                <td>${telefono}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="seleccionarClienteTabla(${cliente.id}, '${nombreCompleto}', '${documento}')">
                        <i class="fas fa-check"></i> Seleccionar
                    </button>
                </td>
            </tr>
        `;
    });
    
    tablaClientes.innerHTML = html;
}

// Seleccionar cliente desde la tabla
function seleccionarClienteTabla(id, nombre, documento) {
    // Seleccionar en el dropdown
    const selectCliente = document.getElementById('clienteIngreso');
    
    // Verificar si ya existe
    let existe = false;
    for (let i = 0; i < selectCliente.options.length; i++) {
        if (selectCliente.options[i].value == id) {
            selectCliente.selectedIndex = i;
            existe = true;
            break;
        }
    }
    
    // Si no existe, agregar
    if (!existe) {
        const option = new Option(`${nombre} - ${documento}`, id);
        selectCliente.add(option);
        option.selected = true;
    }
    
    // Ocultar tabla de clientes
    const collapseClientes = document.getElementById('collapseClientes');
    const bsCollapse = bootstrap.Collapse.getInstance(collapseClientes);
    if (bsCollapse) {
        bsCollapse.hide();
    } else {
        $(collapseClientes).collapse('hide');
    }
    
    // Trigger change event para cargar créditos
    if (document.createEvent) {
        var event = document.createEvent('HTMLEvents');
        event.initEvent('change', true, false);
        selectCliente.dispatchEvent(event);
    } else {
        selectCliente.fireEvent('onchange');
    }
    
    showToast('Cliente seleccionado', 'success');
}

// Filtrar clientes en la tabla
function filtrarClientes() {
    const filtro = document.getElementById('filtroBusquedaClientes').value.toLowerCase();
    
    // Si no hay filtro, mostrar todos
    if (!filtro) {
        renderizarTablaClientes(clientes);
        return;
    }
    
    // Filtrar clientes
    const clientesFiltrados = clientes.filter(cliente => {
        const nombreCompleto = cliente.full_name || 
            `${cliente.nombre || ''} ${cliente.apellido || ''}`.toLowerCase();
        const documento = (cliente.id_number || cliente.identification || '').toLowerCase();
        
        return nombreCompleto.includes(filtro) || documento.includes(filtro);
    });
    
    renderizarTablaClientes(clientesFiltrados);
}

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
    
    // Evento para buscar cliente por documento
    document.getElementById('btnBuscarCliente').addEventListener('click', buscarClientePorDocumento);
    
    // Evento para buscar cliente por documento en el modal
    document.getElementById('btnBuscarClienteModal').addEventListener('click', buscarClientePorDocumentoModal);
    
    // Evento para cargar lista completa de clientes
    document.getElementById('btnCargarListaClientes').addEventListener('click', cargarListaClientes);
    
    // Evento para filtrar clientes en la tabla
    document.getElementById('filtroBusquedaClientes').addEventListener('input', filtrarClientes);
});

// Función para actualizar la tabla de amortización con los detalles del crédito
function actualizarTablaAmortizacion(detallesCredito) {
    try {
        console.log('Actualizando tabla de amortización con datos:', detallesCredito);

        // Actualizar los campos de la sección "Tabla de Amortización"
        document.getElementById('valorTotalCredito').innerText = formatCurrency(detallesCredito.amount_requested || 0);
        
        // Calcular valor por cuota si está disponible, o usar null
        const valorCuota = detallesCredito.installment_amount || 
                        (detallesCredito.total_due && detallesCredito.remaining_installments ? 
                        detallesCredito.total_due / detallesCredito.remaining_installments : 0);
        
        document.getElementById('valorPorCuota').innerText = formatCurrency(valorCuota);
        
        // Calcular intereses generados (o usar 0 si no está disponible)
        const intereses = detallesCredito.amount_requested ? 
                        (detallesCredito.total_due - detallesCredito.amount_requested) : 0;
        
        document.getElementById('interesesGenerados').innerText = formatCurrency(intereses);
        
        // Cuotas pagadas y por pagar
        const cuotasTotales = detallesCredito.payment_term || 0;
        const cuotasPendientes = detallesCredito.remaining_installments || 0;
        const cuotasPagadas = cuotasTotales - cuotasPendientes;
        
        document.getElementById('cuotasPagadas').innerText = cuotasPagadas;
        document.getElementById('cuotasPorPagar').innerText = cuotasPendientes;
        
        // Próximo vencimiento (si está disponible)
        // Intentar diferentes formatos de fechas en la respuesta
        let proximoVencimiento = '--/--/----';
        
        if (detallesCredito.next_payment_date) {
            const fecha = new Date(detallesCredito.next_payment_date);
            if (!isNaN(fecha.getTime())) {
                proximoVencimiento = fecha.toLocaleDateString('es-CO');
            }
        }
        
        document.getElementById('proximoVencimiento').innerText = proximoVencimiento;
        
        // Mostrar sección de tabla de amortización
        document.querySelector('.tabla-amortizacion').style.display = 'block';
        
        console.log('Tabla de amortización actualizada correctamente');
        
    } catch (error) {
        console.error('Error al actualizar tabla de amortización:', error);
        // No lanzar excepción para evitar que se detenga el flujo
    }
}

// Función para actualizar la información del crédito seleccionado en el formulario principal
function actualizarInfoCreditoSeleccionado(creditoId, numeroCredito, tipoCredito, montoPago) {
    try {
        console.log(`Actualizando información de crédito seleccionado: ID=${creditoId}, Número=${numeroCredito}, Monto=${montoPago}`);
        
        // Mostrar sección de crédito
        document.getElementById('seccionCredito').style.display = 'block';
        document.getElementById('infoCredito').style.display = 'block';
        
        // Actualizar campos visibles
        document.getElementById('infoCredito').innerHTML = `
            <div class="alert alert-info">
                <strong>Crédito seleccionado:</strong> ${numeroCredito} - ${tipoCredito}<br>
                <strong>Monto a pagar:</strong> ${formatCurrency(montoPago)}
            </div>
        `;
        
        // Actualizar campo oculto si existe
        if (document.getElementById('creditoIdInput')) {
            document.getElementById('creditoIdInput').value = creditoId;
        }
        
        // Actualizar campo de valor bruto con el monto a pagar
        document.getElementById('valorBruto').value = montoPago;
        
        // Trigger el cálculo de valores
        calcularValores();
        
        // Establecer concepto apropiado
        document.getElementById('conceptoIngreso').value = `Pago de crédito ${numeroCredito}`;
        
    } catch (error) {
        console.error('Error al actualizar info de crédito seleccionado:', error);
    }
}