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
        
        // Ocultar sección de búsqueda de cliente si existe
        if (document.getElementById('seccionBusquedaCliente')) {
            document.getElementById('seccionBusquedaCliente').style.display = 'none';
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
    
    // Registramos información para depuración
    console.log('DEBUG - Categoría seleccionada:', {
        id: categoriaId,
        nombre: categoriaNombre,
        esCredito: esCredito,
        esCreditoConsumo: esCreditoConsumo,
        requiereCliente: requiereCliente
    });
    
    // FORZAR: Si el nombre incluye "libranza", considerarlo como crédito siempre
    if (categoriaNombre.includes('libranza')) {
        console.log('DEBUG - Forzando categoría como crédito (Libranza)');
        esCreditoConsumo = true;
    }
    
    // Aplicar porcentaje de retención automático
    document.getElementById('porcentajeRetencion').value = porcentajeRetencion;
    
    // Mostrar/ocultar sección de cliente
    // Si requiere cliente O es crédito de consumo, mostrar sección de cliente
    const mostrarCliente = requiereCliente || esCreditoConsumo;
    console.log('DEBUG - Mostrar sección cliente:', mostrarCliente);
    
    // Asegurar que la sección de cliente esté visible
    if (mostrarCliente) {
        document.getElementById('seccionCliente').style.display = 'block';
    } else {
        document.getElementById('seccionCliente').style.display = 'none';
    }
    
    // Sección de búsqueda de cliente - IMPLEMENTACIÓN DIRECTA
    if (mostrarCliente && (esCreditoConsumo || categoriaNombre.includes('libranza'))) {
        console.log('DEBUG - Debe mostrar sección de búsqueda de cliente');
        
        // Crear o mostrar sección de búsqueda de cliente
        if (!document.getElementById('seccionBusquedaCliente')) {
            console.log('DEBUG - Creando sección de búsqueda de cliente');
            
            // Crear sección de búsqueda de cliente
            const busquedaClienteHTML = `
                <div id="seccionBusquedaCliente" class="card mb-3">
                    <div class="card-header bg-primary text-white">
                        <h6 class="mb-0">Búsqueda de Cliente por Documento</h6>
                    </div>
                    <div class="card-body">
                        <div class="row align-items-end mb-3">
                            <div class="col-md-4">
                                <label for="tipoBusquedaCliente" class="form-label">Tipo de documento</label>
                                <select class="form-select" id="tipoBusquedaCliente">
                                    <option value="CC">Cédula de Ciudadanía</option>
                                    <option value="CE">Cédula de Extranjería</option>
                                    <option value="NIT">NIT</option>
                                    <option value="PASAPORTE">Pasaporte</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label for="documentoBusquedaCliente" class="form-label">Número de documento</label>
                                <input type="text" class="form-control" id="documentoBusquedaCliente" placeholder="Ingrese número de documento">
                            </div>
                            <div class="col-md-4">
                                <button type="button" class="btn btn-primary w-100" id="btnBuscarCliente">
                                    <i class="fas fa-search"></i> Buscar
                                </button>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-12 text-center">
                                <span>o</span>
                                <button type="button" class="btn btn-outline-secondary ms-2" id="btnCargarListaClientes" data-bs-toggle="collapse" data-bs-target="#collapseClientes">
                                    <i class="fas fa-list"></i> Ver lista de clientes
                                </button>
                            </div>
                        </div>
                        <div class="collapse mt-3" id="collapseClientes">
                            <div class="card card-body">
                                <div class="mb-3">
                                    <input type="text" class="form-control" id="filtroBusquedaClientes" placeholder="Buscar cliente...">
                                </div>
                                <div class="table-responsive">
                                    <table class="table table-sm table-hover">
                                        <thead>
                                            <tr>
                                                <th>Nombre</th>
                                                <th>Documento</th>
                                                <th>Teléfono</th>
                                                <th>Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody id="tablaClientes">
                                            <tr>
                                                <td colspan="4" class="text-center">Cargue la lista de clientes</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Insertar al principio de la sección de cliente
            const seccionCliente = document.getElementById('seccionCliente');
            seccionCliente.insertAdjacentHTML('afterbegin', busquedaClienteHTML);
            
            // Añadir eventos a los botones
            document.getElementById('btnBuscarCliente').addEventListener('click', buscarClientePorDocumento);
            document.getElementById('btnCargarListaClientes').addEventListener('click', cargarListaClientes);
            document.getElementById('filtroBusquedaClientes').addEventListener('input', filtrarClientes);
            
            console.log('DEBUG - Sección de búsqueda creada y eventos añadidos');
        } else {
            // Ya existe, asegurarnos que esté visible
            console.log('DEBUG - Mostrando sección de búsqueda existente');
            document.getElementById('seccionBusquedaCliente').style.display = 'block';
        }
    } else if (document.getElementById('seccionBusquedaCliente')) {
        // No es crédito de consumo, ocultar sección de búsqueda
        console.log('DEBUG - Ocultando sección de búsqueda');
        document.getElementById('seccionBusquedaCliente').style.display = 'none';
    }
    
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
    
    // Aplicar un timeout para asegurar que la interfaz se actualice correctamente
    setTimeout(function() {
        const estaVisible = document.getElementById('seccionBusquedaCliente') && 
                          window.getComputedStyle(document.getElementById('seccionBusquedaCliente')).display !== 'none';
        console.log('DEBUG - Estado final de sección búsqueda:', estaVisible ? 'VISIBLE' : 'OCULTA');
        
        // Si debería estar visible pero no lo está, forzar su visibilidad
        if (esCreditoConsumo && !estaVisible && document.getElementById('seccionBusquedaCliente')) {
            document.getElementById('seccionBusquedaCliente').style.display = 'block';
            console.log('DEBUG - Forzando visibilidad de sección búsqueda');
        }
    }, 100);
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