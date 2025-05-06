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

// Función para cargar créditos de un cliente
async function cargarCreditosCliente(clienteId) {
    if (!clienteId) {
        const selectCredito = document.getElementById('creditoIngreso');
        selectCredito.innerHTML = '<option value="">Seleccione un crédito</option>';
        document.getElementById('infoCredito').style.display = 'none';
        return;
    }
    
    try {
        const response = await fetch(`/api/clients/${clienteId}/loans`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al obtener créditos del cliente');
        }
        
        const creditos = await response.json();
        
        // Cargar clientes con saldos activos
        const selectCredito = document.getElementById('creditoIngreso');
        selectCredito.innerHTML = '<option value="">Seleccione un crédito</option>';
        
        // Filtrar solo créditos activos
        const creditosActivos = creditos.filter(c => c.estado === 'Activo' || c.status === 'Active');
        
        if (creditosActivos.length === 0) {
            selectCredito.innerHTML += '<option value="" disabled>No hay créditos activos</option>';
        } else {
            creditosActivos.forEach(credito => {
                const numeroCredito = credito.numero_credito || credito.loan_number || `CR-${credito.id}`;
                const saldo = formatCurrency(credito.saldo_pendiente || credito.balance_due || 0);
                
                selectCredito.innerHTML += `<option value="${credito.id}">${numeroCredito} - Saldo: ${saldo}</option>`;
            });
        }
        
        // Cargar también datos del cliente al pagador si está disponible
        const cliente = await fetch(`/api/clients/${clienteId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }).then(res => res.json());
        
        // Auto-llenar campos del pagador si existen
        if (document.getElementById('nombrePagador')) {
            document.getElementById('nombrePagador').value = cliente.full_name || '';
            document.getElementById('tipoPagador').value = cliente.tipo_documento || '';
            document.getElementById('documentoPagador').value = cliente.identification || '';
            document.getElementById('telefonoPagador').value = cliente.phone || '';
            document.getElementById('correoPagador').value = cliente.email || '';
            document.getElementById('direccionPagador').value = cliente.address || '';
        }
        
        // Limpiar info de crédito
        document.getElementById('infoCredito').style.display = 'none';
        
    } catch (error) {
        console.error('Error al cargar créditos del cliente:', error);
        showToast('Error al cargar créditos: ' + error.message, 'error');
    }
}

// Función para cargar detalles de un crédito
async function cargarDetalleCredito(creditoId) {
    const infoCredito = document.getElementById('infoCredito');
    
    if (!creditoId) {
        infoCredito.style.display = 'none';
        return;
    }
    
    try {
        infoCredito.style.display = 'block';
        infoCredito.innerHTML = `
            <div class="d-flex justify-content-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            </div>
        `;
        
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
        
        // Si hay un tipo de pago seleccionado, aplicar su lógica
        const radioTipoPago = document.querySelector('input[name="tipoPago"]:checked');
        if (radioTipoPago) {
            manejarCambioTipoPago();
            return;
        }
        
        // De lo contrario, mostrar información general del crédito
        infoCredito.innerHTML = `
            <div class="card">
                <div class="card-header bg-light">
                    <h6 class="mb-0">Información del Crédito</h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>Número de crédito:</strong> ${credito.numero_credito || credito.loan_number || `CR-${credito.id}`}</p>
                            <p><strong>Tipo de crédito:</strong> ${credito.tipo || credito.type || 'No especificado'}</p>
                            <p><strong>Fecha de aprobación:</strong> ${new Date(credito.fecha_aprobacion || credito.approval_date || credito.createdAt).toLocaleDateString('es-CO')}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Monto original:</strong> ${formatCurrency(credito.monto_aprobado || credito.amount || 0)}</p>
                            <p><strong>Saldo pendiente:</strong> ${formatCurrency(credito.saldo_pendiente || credito.balance_due || 0)}</p>
                            <p><strong>Tasa de interés:</strong> ${credito.tasa_interes || credito.interest_rate || 0}%</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error al cargar detalle del crédito:', error);
        infoCredito.innerHTML = `
            <div class="alert alert-danger">
                <h6>Error al cargar información del crédito</h6>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Función para buscar datos de pagador por documento
async function buscarPagadorPorDocumento() {
    const documento = document.getElementById('documentoPagador').value;
    const tipoDocumento = document.getElementById('tipoPagador').value;
    
    if (!documento || !tipoDocumento) {
        showToast('Ingrese el tipo y número de documento', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/clients/search?documento=${documento}&tipo=${tipoDocumento}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al buscar pagador');
        }
        
        const resultado = await response.json();
        
        if (resultado && resultado.id) {
            // Si se encuentra, llenar los campos
            document.getElementById('nombrePagador').value = resultado.full_name || '';
            document.getElementById('telefonoPagador').value = resultado.phone || '';
            document.getElementById('correoPagador').value = resultado.email || '';
            document.getElementById('direccionPagador').value = resultado.address || '';
            
            showToast('Datos del pagador cargados correctamente');
            
            // Opcionalmente, también se podría seleccionar al cliente en el selector
            if (document.getElementById('clienteIngreso')) {
                document.getElementById('clienteIngreso').value = resultado.id;
                // Disparar evento de cambio para cargar sus créditos
                document.getElementById('clienteIngreso').dispatchEvent(new Event('change'));
            }
        } else {
            showToast('No se encontró un pagador con el documento especificado', 'error');
        }
        
    } catch (error) {
        console.error('Error al buscar pagador:', error);
        showToast('Error al buscar pagador: ' + error.message, 'error');
    }
}

// Función para inicializar el formulario de ingreso
function inicializarFormularioIngreso(esNuevo = true) {
    // Reiniciar formulario
    document.getElementById('ingresoForm').reset();
    
    // Ocultar secciones condicionales
    document.getElementById('seccionCliente').style.display = 'none';
    document.getElementById('seccionCredito').style.display = 'none';
    document.getElementById('seccionComision').style.display = 'none';
    document.getElementById('infoCredito').style.display = 'none';
    
    // Ocultar sección de datos del pagador si existe
    if (document.getElementById('seccionDatosPagador')) {
        document.getElementById('seccionDatosPagador').style.display = 'none';
    }
    
    // Ocultar sección de tipo de pago si existe
    if (document.getElementById('seccionTipoPago')) {
        document.getElementById('seccionTipoPago').style.display = 'none';
    }
    
    // Establecer valores predeterminados
    document.getElementById('ingresoId').value = '';
    document.getElementById('fechaIngreso').valueAsDate = new Date();
    document.getElementById('porcentajeRetencion').value = '0';
    document.getElementById('valorRetencion').value = '0';
    document.getElementById('valorBruto').value = '0';
    document.getElementById('valorNeto').value = '0';
    
    // Configurar título del modal
    document.getElementById('ingresoModalLabel').textContent = esNuevo ? 'Nuevo Ingreso' : 'Editar Ingreso';
    
    // Llenar categorías en el selector
    const selectCategoria = document.getElementById('categoriaIngreso');
    selectCategoria.innerHTML = '<option value="">Seleccione una categoría</option>';
    
    categorias.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria.id;
        option.textContent = categoria.nombre;
        
        // Agregar atributos de datos para comportamiento condicional
        option.dataset.retencion = categoria.porcentaje_retencion || 0;
        option.dataset.cliente = categoria.requiere_cliente ? 'true' : 'false';
        option.dataset.comision = categoria.permite_comision ? 'true' : 'false';
        option.dataset.credito = categoria.es_credito ? 'true' : 'false';
        
        selectCategoria.appendChild(option);
    });
    
    // Agregar botón de búsqueda rápida para el pagador si la sección existe
    const seccionDatosPagador = document.getElementById('seccionDatosPagador');
    if (seccionDatosPagador) {
        // Verificar si ya existe el botón de búsqueda
        if (!document.getElementById('btnBuscarPagador')) {
            const inputDocumento = document.getElementById('documentoPagador');
            const parentElement = inputDocumento.parentElement;
            
            // Convertir el div en un input-group
            parentElement.classList.add('input-group');
            
            // Crear el botón de búsqueda
            const btnBuscar = document.createElement('button');
            btnBuscar.id = 'btnBuscarPagador';
            btnBuscar.type = 'button';
            btnBuscar.className = 'btn btn-outline-primary';
            btnBuscar.innerHTML = '<i class="fas fa-search"></i>';
            btnBuscar.title = 'Buscar pagador por documento';
            
            // Agregar el evento al botón
            btnBuscar.addEventListener('click', buscarPagadorPorDocumento);
            
            // Reestructurar el HTML
            inputDocumento.parentNode.insertBefore(btnBuscar, inputDocumento.nextSibling);
        }
    }
}

// Función para calcular retención, comisión y valor neto
function calcularValores() {
    const valorBruto = parseFloat(document.getElementById('valorBruto').value) || 0;
    const porcentajeRetencion = parseFloat(document.getElementById('porcentajeRetencion').value) || 0;
    const porcentajeComision = parseFloat(document.getElementById('porcentajeComision').value) || 0;
    
    // Calcular retención
    const valorRetencion = (valorBruto * porcentajeRetencion) / 100;
    document.getElementById('valorRetencion').value = valorRetencion.toFixed(2);
    
    // Calcular comisión si aplica
    let valorComision = 0;
    if (document.getElementById('seccionComision').style.display !== 'none') {
        valorComision = (valorBruto * porcentajeComision) / 100;
        document.getElementById('valorComision').value = valorComision.toFixed(2);
    }
    
    // Calcular valor neto
    const valorNeto = valorBruto - valorRetencion - valorComision;
    document.getElementById('valorNeto').value = valorNeto.toFixed(2);
}

// Función para mostrar el modal de nuevo ingreso
function nuevoIngreso() {
    inicializarFormularioIngreso(true);
    const modal = new bootstrap.Modal(document.getElementById('ingresoModal'));
    modal.show();
}

// Función para guardar un ingreso (nuevo o edición)
async function guardarIngreso() {
    try {
        // Validar formulario
        const form = document.getElementById('ingresoForm');
        if (!validarFormulario()) {
            return;
        }

        // Obtener datos del formulario
        const id = document.getElementById('ingresoId').value;
        const esNuevo = !id;
        const datos = obtenerDatosFormulario();
        
        // Agregar validación para evitar pagos duplicados
        if (esNuevo && datos.credito_id) {
            const esDuplicado = await verificarPagoDuplicado(datos);
            if (esDuplicado) {
                if (!confirm('Ya existe un pago similar para este crédito en la misma fecha. ¿Desea continuar?')) {
                    return;
                }
            }
        }

        // Preparar formData para manejar archivos
        const formData = new FormData();
        
        // Agregar campos del formulario
        Object.keys(datos).forEach(key => {
            formData.append(key, datos[key]);
        });
        
        // Agregar archivos adjuntos si existen
        const fileInput = document.getElementById('archivoAdjunto');
        if (fileInput && fileInput.files.length > 0) {
            for (let i = 0; i < fileInput.files.length; i++) {
                formData.append('archivos', fileInput.files[i]);
            }
        }
        
        // URL y método según sea nuevo o edición
        const url = esNuevo ? '/api/ingresos' : `/api/ingresos/${id}`;
        const method = esNuevo ? 'POST' : 'PUT';
        
        // Enviar solicitud
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error al guardar ingreso');
        }
        
        // Mostrar mensaje de éxito
        showToast(esNuevo ? 'Ingreso creado exitosamente' : 'Ingreso actualizado exitosamente');
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('ingresoModal'));
        modal.hide();
        
        // Actualizar tabla de ingresos
        cargarIngresos();
        
        // Si es un pago de crédito, enviar notificación al cliente
        if (datos.credito_id && datos.cliente_id) {
            enviarNotificacionCliente(datos.cliente_id, datos.credito_id, datos);
        }
        
        // Si tiene retención, programar recordatorio para el equipo contable
        if (datos.valor_retencion > 0) {
            enviarNotificacionRetencion(datos);
        }
        
    } catch (error) {
        console.error('Error al guardar ingreso:', error);
        showToast('Error al guardar ingreso: ' + error.message, 'error');
    }
}

// Función para validar el formulario
function validarFormulario() {
    const form = document.getElementById('ingresoForm');
    const categoriaId = document.getElementById('categoriaIngreso').value;
    const valorBruto = document.getElementById('valorBruto').value;
    const fechaIngreso = document.getElementById('fechaIngreso').value;
    const concepto = document.getElementById('conceptoIngreso').value;
    const metodoPago = document.getElementById('metodoPago').value;
    
    let isValid = true;
    let errorMessage = '';
    
    // Validar campos básicos
    if (!categoriaId) {
        errorMessage = 'Seleccione una categoría';
        isValid = false;
    } else if (!valorBruto || parseFloat(valorBruto) <= 0) {
        errorMessage = 'Ingrese un valor válido';
        isValid = false;
    } else if (!fechaIngreso) {
        errorMessage = 'Seleccione una fecha';
        isValid = false;
    } else if (!concepto) {
        errorMessage = 'Ingrese un concepto';
        isValid = false;
    } else if (!metodoPago) {
        errorMessage = 'Seleccione un método de pago';
        isValid = false;
    }
    
    // Validar campos según tipo de ingreso
    const seccionCliente = document.getElementById('seccionCliente');
    if (seccionCliente.style.display !== 'none') {
        const clienteId = document.getElementById('clienteIngreso').value;
        if (!clienteId) {
            errorMessage = 'Seleccione un cliente';
            isValid = false;
        }
    }
    
    const seccionCredito = document.getElementById('seccionCredito');
    if (seccionCredito.style.display !== 'none') {
        const creditoId = document.getElementById('creditoIngreso').value;
        if (!creditoId) {
            errorMessage = 'Seleccione un crédito';
            isValid = false;
        }
    }
    
    const seccionComision = document.getElementById('seccionComision');
    if (seccionComision.style.display !== 'none') {
        const asesorId = document.getElementById('asesorIngreso').value;
        if (!asesorId) {
            errorMessage = 'Seleccione un asesor';
            isValid = false;
        }
    }
    
    // Validar datos de pagador cuando se requieren
    const seccionDatosPagador = document.getElementById('seccionDatosPagador');
    if (seccionDatosPagador && seccionDatosPagador.style.display !== 'none') {
        const nombrePagador = document.getElementById('nombrePagador').value;
        const tipoPagador = document.getElementById('tipoPagador').value;
        const documentoPagador = document.getElementById('documentoPagador').value;
        
        if (!nombrePagador) {
            errorMessage = 'Ingrese el nombre del pagador';
            isValid = false;
        } else if (!tipoPagador) {
            errorMessage = 'Seleccione el tipo de documento del pagador';
            isValid = false;
        } else if (!documentoPagador) {
            errorMessage = 'Ingrese el número de documento del pagador';
            isValid = false;
        }
    }
    
    if (!isValid) {
        showToast(errorMessage, 'error');
    }
    
    return isValid;
}

// Función para obtener los datos del formulario
function obtenerDatosFormulario() {
    const datos = {
        categoria_id: document.getElementById('categoriaIngreso').value,
        concepto: document.getElementById('conceptoIngreso').value,
        descripcion: document.getElementById('descripcionIngreso').value || '',
        fecha: document.getElementById('fechaIngreso').value,
        valor_bruto: parseFloat(document.getElementById('valorBruto').value),
        valor_neto: parseFloat(document.getElementById('valorNeto').value),
        porcentaje_retencion: parseFloat(document.getElementById('porcentajeRetencion').value) || 0,
        valor_retencion: parseFloat(document.getElementById('valorRetencion').value) || 0,
        metodo_pago: document.getElementById('metodoPago').value,
        referencia_pago: document.getElementById('referenciaPago').value || '',
        estado: document.getElementById('estadoIngreso').value
    };
    
    // Agregar cliente si está visible
    const seccionCliente = document.getElementById('seccionCliente');
    if (seccionCliente.style.display !== 'none') {
        datos.cliente_id = document.getElementById('clienteIngreso').value;
    }
    
    // Agregar crédito si está visible
    const seccionCredito = document.getElementById('seccionCredito');
    if (seccionCredito.style.display !== 'none') {
        datos.credito_id = document.getElementById('creditoIngreso').value;
    }
    
    // Agregar asesor y comisión si está visible
    const seccionComision = document.getElementById('seccionComision');
    if (seccionComision.style.display !== 'none') {
        datos.asesor_id = document.getElementById('asesorIngreso').value;
        datos.porcentaje_comision = parseFloat(document.getElementById('porcentajeComision').value) || 0;
        datos.valor_comision = parseFloat(document.getElementById('valorComision').value) || 0;
    }
    
    // Agregar datos del pagador si está visible
    const seccionDatosPagador = document.getElementById('seccionDatosPagador');
    if (seccionDatosPagador && seccionDatosPagador.style.display !== 'none') {
        datos.pagador = {
            nombre: document.getElementById('nombrePagador').value,
            tipo_documento: document.getElementById('tipoPagador').value,
            documento: document.getElementById('documentoPagador').value,
            telefono: document.getElementById('telefonoPagador').value || '',
            correo: document.getElementById('correoPagador').value || '',
            direccion: document.getElementById('direccionPagador').value || ''
        };
    }
    
    // Agregar tipo de pago si está visible
    const seccionTipoPago = document.getElementById('seccionTipoPago');
    if (seccionTipoPago && seccionTipoPago.style.display !== 'none') {
        const radios = document.getElementsByName('tipoPago');
        for (const radio of radios) {
            if (radio.checked) {
                datos.tipo_pago = radio.value;
                break;
            }
        }
    }
    
    return datos;
}

// Función para verificar si un pago de crédito es duplicado
async function verificarPagoDuplicado(datos) {
    try {
        // Solo verificar pagos de crédito
        if (!datos.credito_id) {
            return false;
        }

        // Obtener fecha en formato YYYY-MM-DD
        const fechaPago = datos.fecha;
        
        // Verificar si ya existe un pago para este crédito en la misma fecha
        const response = await fetch(`/api/ingresos?creditoId=${datos.credito_id}&fechaInicio=${fechaPago}&fechaFin=${fechaPago}&estado=confirmado`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        // Si hay resultados, podría ser un duplicado
        return result.success && result.data && result.data.length > 0;
        
    } catch (error) {
        console.error('Error al verificar pago duplicado:', error);
        return false; // En caso de error, permitir continuar
    }
}

// Función para enviar notificación al cliente
async function enviarNotificacionCliente(clienteId, creditoId, datos) {
    try {
        const response = await fetch(`/api/clients/${clienteId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const cliente = await response.json();
        
        // Verificar si el cliente tiene correo electrónico
        if (!cliente.email) {
            console.warn('Cliente sin correo electrónico para enviar notificación');
            return;
        }
        
        // Enviar notificación por correo (simulado)
        console.log(`Notificación enviada a ${cliente.full_name} (${cliente.email}) sobre el pago recibido por ${formatCurrency(datos.valor_bruto)}`);
        
        // También podríamos implementar esto con una llamada API real
        // await fetch('/api/notificaciones/cliente', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Authorization': `Bearer ${token}`
        //     },
        //     body: JSON.stringify({
        //         cliente_id: clienteId,
        //         credito_id: creditoId,
        //         tipo: 'pago_recibido',
        //         datos: {
        //             monto: datos.valor_bruto,
        //             fecha: datos.fecha,
        //             concepto: datos.concepto
        //         }
        //     })
        // });
        
    } catch (error) {
        console.error('Error al enviar notificación al cliente:', error);
    }
}

// Función para enviar notificación de retención al equipo contable
function enviarNotificacionRetencion(datos) {
    // Esta función podría implementar el envío real de la notificación
    // Por ahora, solo lo simulamos
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + 30); // 30 días después
    
    console.log(`Recordatorio programado para el equipo contable sobre retención de ${formatCurrency(datos.valor_retencion)} con fecha límite ${fechaLimite.toLocaleDateString()}`);
    
    // También podríamos implementar esto con una llamada API real
    // fetch('/api/notificaciones/contable', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${token}`
    //     },
    //     body: JSON.stringify({
    //         tipo: 'retención',
    //         datos: {
    //             valor: datos.valor_retencion,
    //             concepto: datos.concepto,
    //             fecha_ingreso: datos.fecha,
    //             fecha_limite: fechaLimite.toISOString().split('T')[0]
    //         }
    //     })
    // });
}

// Función para editar un ingreso existente
async function editarIngreso(id) {
    try {
        // Mostrar spinner
        document.getElementById('ingresoModalLabel').textContent = 'Cargando información...';
        
        // Inicializar formulario como edición
        inicializarFormularioIngreso(false);
        
        // Mostrar el modal mientras se carga la información
        const modal = new bootstrap.Modal(document.getElementById('ingresoModal'));
        modal.show();
        
        // Obtener datos del ingreso
        const response = await fetch(`/api/ingresos/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al obtener datos del ingreso');
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error al obtener datos del ingreso');
        }
        
        const ingreso = result.data;
        
        // Establecer el ID del ingreso en el campo oculto
        document.getElementById('ingresoId').value = ingreso.id;
        
        // Actualizar título del modal
        document.getElementById('ingresoModalLabel').textContent = 'Editar Ingreso';
        
        // Llenar campos básicos
        document.getElementById('categoriaIngreso').value = ingreso.categoria_id;
        document.getElementById('conceptoIngreso').value = ingreso.concepto;
        document.getElementById('descripcionIngreso').value = ingreso.descripcion || '';
        
        // Formatear fecha (YYYY-MM-DD)
        const fecha = new Date(ingreso.fecha);
        const fechaFormateada = fecha.toISOString().split('T')[0];
        document.getElementById('fechaIngreso').value = fechaFormateada;
        
        // Valores monetarios
        document.getElementById('valorBruto').value = ingreso.valor_bruto;
        document.getElementById('porcentajeRetencion').value = ingreso.porcentaje_retencion || 0;
        document.getElementById('valorRetencion').value = ingreso.valor_retencion || 0;
        document.getElementById('valorNeto').value = ingreso.valor_neto;
        
        // Método de pago y referencia
        document.getElementById('metodoPago').value = ingreso.metodo_pago;
        document.getElementById('referenciaPago').value = ingreso.referencia_pago || '';
        document.getElementById('estadoIngreso').value = ingreso.estado;
        
        // Disparar evento de cambio de categoría para mostrar/ocultar secciones correspondientes
        document.getElementById('categoriaIngreso').dispatchEvent(new Event('change'));
        
        // Si tiene cliente, seleccionarlo
        if (ingreso.cliente_id) {
            document.getElementById('clienteIngreso').value = ingreso.cliente_id;
            // Cargar créditos del cliente
            await cargarCreditosCliente(ingreso.cliente_id);
            
            // Si tiene datos de pagador, llenarlos
            if (ingreso.pagador) {
                const seccionDatosPagador = document.getElementById('seccionDatosPagador');
                if (seccionDatosPagador) {
                    document.getElementById('nombrePagador').value = ingreso.pagador.nombre || '';
                    document.getElementById('tipoPagador').value = ingreso.pagador.tipo_documento || '';
                    document.getElementById('documentoPagador').value = ingreso.pagador.documento || '';
                    document.getElementById('telefonoPagador').value = ingreso.pagador.telefono || '';
                    document.getElementById('correoPagador').value = ingreso.pagador.correo || '';
                    document.getElementById('direccionPagador').value = ingreso.pagador.direccion || '';
                }
            }
        }
        
        // Si tiene crédito, seleccionarlo
        if (ingreso.credito_id) {
            document.getElementById('creditoIngreso').value = ingreso.credito_id;
            // Cargar detalles del crédito
            await cargarDetalleCredito(ingreso.credito_id);
            
            // Si tiene tipo de pago, seleccionarlo
            if (ingreso.tipo_pago) {
                const radios = document.getElementsByName('tipoPago');
                for (const radio of radios) {
                    if (radio.value === ingreso.tipo_pago) {
                        radio.checked = true;
                        // Disparar el evento para mostrar la información correspondiente
                        radio.dispatchEvent(new Event('change'));
                        break;
                    }
                }
            }
        }
        
        // Si tiene asesor y comisión, seleccionarlo
        if (ingreso.asesor_id) {
            document.getElementById('asesorIngreso').value = ingreso.asesor_id;
            document.getElementById('porcentajeComision').value = ingreso.porcentaje_comision || 0;
            document.getElementById('valorComision').value = ingreso.valor_comision || 0;
        }
        
        // Mostrar archivos adjuntos si existen
        if (ingreso.archivos_adjuntos) {
            const archivosContainer = document.getElementById('archivosContainer');
            archivosContainer.innerHTML = '';
            
            try {
                const archivos = JSON.parse(ingreso.archivos_adjuntos);
                
                if (archivos && archivos.length > 0) {
                    archivos.forEach(archivo => {
                        const archivoElement = document.createElement('div');
                        archivoElement.classList.add('archivo-item');
                        archivoElement.innerHTML = `
                            <i class="fas fa-file"></i>
                            <a href="${archivo.ruta}" target="_blank">${archivo.nombre_original}</a>
                            <button type="button" class="btn btn-sm btn-danger" onclick="eliminarArchivo(${ingreso.id}, '${archivo.nombre_sistema}')">
                                <i class="fas fa-times"></i>
                            </button>
                        `;
                        archivosContainer.appendChild(archivoElement);
                    });
                }
            } catch (e) {
                console.error('Error al parsear archivos adjuntos:', e);
            }
        }
        
    } catch (error) {
        console.error('Error al editar ingreso:', error);
        showToast('Error al editar ingreso: ' + error.message, 'error');
        
        // Cerrar modal en caso de error
        const modal = bootstrap.Modal.getInstance(document.getElementById('ingresoModal'));
        if (modal) modal.hide();
    }
}

// Función para anular un ingreso
async function anularIngreso(id) {
    if (!confirm('¿Está seguro de anular este ingreso? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/ingresos/${id}/anular`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error al anular ingreso');
        }
        
        showToast('Ingreso anulado exitosamente');
        
        // Cerrar modal de detalle si está abierto
        const modalDetalle = bootstrap.Modal.getInstance(document.getElementById('detalleIngresoModal'));
        if (modalDetalle) modalDetalle.hide();
        
        // Recargar ingresos
        cargarIngresos();
        
    } catch (error) {
        console.error('Error al anular ingreso:', error);
        showToast('Error al anular ingreso: ' + error.message, 'error');
    }
}

// Función para eliminar un archivo adjunto
async function eliminarArchivo(ingresoId, nombreArchivo) {
    if (!confirm('¿Está seguro de eliminar este archivo? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/ingresos/${ingresoId}/archivos/${nombreArchivo}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error al eliminar archivo');
        }
        
        showToast('Archivo eliminado exitosamente');
        
        // Actualizar la vista eliminando el elemento
        const archivoElement = document.querySelector(`.archivo-item a[href*="${nombreArchivo}"]`).parentNode;
        if (archivoElement) {
            archivoElement.remove();
        }
        
    } catch (error) {
        console.error('Error al eliminar archivo:', error);
        showToast('Error al eliminar archivo: ' + error.message, 'error');
    }
}

// Función para ver detalles de un ingreso
async function verDetalleIngreso(id) {
    try {
        // Obtener el contenedor donde se mostrará la información
        const container = document.getElementById('detalleIngresoContent');
        
        // Mostrar spinner mientras se carga
        container.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p>Cargando información del ingreso...</p>
            </div>
        `;
        
        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('detalleIngresoModal'));
        modal.show();
        
        // Obtener datos del ingreso
        const response = await fetch(`/api/ingresos/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al obtener datos del ingreso');
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error al obtener datos del ingreso');
        }
        
        const ingreso = result.data;
        
        // Formatear fecha
        const fecha = new Date(ingreso.fecha).toLocaleDateString('es-CO');
        // Formatear montos
        const valorBruto = formatCurrency(ingreso.valor_bruto);
        const valorRetencion = formatCurrency(ingreso.valor_retencion || 0);
        const valorComision = formatCurrency(ingreso.valor_comision || 0);
        const valorNeto = formatCurrency(ingreso.valor_neto);
        
        // Determinar clase CSS para el estado
        let estadoClass = '';
        switch (ingreso.estado) {
            case 'confirmado': estadoClass = 'bg-success'; break;
            case 'pendiente': estadoClass = 'bg-warning'; break;
            case 'anulado': estadoClass = 'bg-danger'; break;
            default: estadoClass = 'bg-secondary';
        }
        
        // Construir HTML para mostrar archivos adjuntos
        let archivosHTML = '<p>No hay archivos adjuntos.</p>';
        
        if (ingreso.archivos_adjuntos) {
            try {
                const archivos = JSON.parse(ingreso.archivos_adjuntos);
                
                if (archivos && archivos.length > 0) {
                    archivosHTML = '<div class="list-group">';
                    archivos.forEach(archivo => {
                        archivosHTML += `
                            <a href="${archivo.ruta}" class="list-group-item list-group-item-action" target="_blank">
                                <i class="fas fa-file me-2"></i>
                                ${archivo.nombre_original}
                            </a>
                        `;
                    });
                    archivosHTML += '</div>';
                }
            } catch (e) {
                console.error('Error al parsear archivos adjuntos:', e);
            }
        }
        
        // Construir HTML para la tarjeta de información
        const infoHTML = `
            <div class="card mb-4">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">Información General</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>N° Comprobante:</strong> ${ingreso.numero_comprobante || `ING-${ingreso.id}`}</p>
                            <p><strong>Fecha:</strong> ${fecha}</p>
                            <p><strong>Categoría:</strong> ${ingreso.Categoria ? ingreso.Categoria.nombre : 'No especificada'}</p>
                            <p><strong>Concepto:</strong> ${ingreso.concepto}</p>
                            <p><strong>Estado:</strong> <span class="badge ${estadoClass}">${ingreso.estado}</span></p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Valor Bruto:</strong> ${valorBruto}</p>
                            <p><strong>Retención:</strong> ${valorRetencion}</p>
                            <p><strong>Comisión:</strong> ${valorComision}</p>
                            <p><strong>Valor Neto:</strong> ${valorNeto}</p>
                            <p><strong>Método de Pago:</strong> ${ingreso.metodo_pago}</p>
                            ${ingreso.referencia_pago ? `<p><strong>Referencia:</strong> ${ingreso.referencia_pago}</p>` : ''}
                        </div>
                    </div>
                    ${ingreso.descripcion ? `
                        <div class="row mt-3">
                            <div class="col-12">
                                <h6>Descripción:</h6>
                                <p>${ingreso.descripcion}</p>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Construir HTML para la tarjeta de cliente/crédito si aplica
        let clienteHTML = '';
        if (ingreso.Cliente) {
            clienteHTML = `
                <div class="card mb-4">
                    <div class="card-header bg-info text-white">
                        <h5 class="mb-0">Información del Cliente</h5>
                    </div>
                    <div class="card-body">
                        <p><strong>Cliente:</strong> ${ingreso.Cliente.full_name}</p>
                        <p><strong>Documento:</strong> ${ingreso.Cliente.identification}</p>
                        ${ingreso.Cliente.phone ? `<p><strong>Teléfono:</strong> ${ingreso.Cliente.phone}</p>` : ''}
                        
                        ${ingreso.pagador ? `
                            <hr>
                            <h6>Datos del Pagador:</h6>
                            <p><strong>Nombre:</strong> ${ingreso.pagador.nombre}</p>
                            <p><strong>Documento:</strong> ${ingreso.pagador.tipo_documento} ${ingreso.pagador.documento}</p>
                            ${ingreso.pagador.telefono ? `<p><strong>Teléfono:</strong> ${ingreso.pagador.telefono}</p>` : ''}
                            ${ingreso.pagador.correo ? `<p><strong>Correo:</strong> ${ingreso.pagador.correo}</p>` : ''}
                            ${ingreso.pagador.direccion ? `<p><strong>Dirección:</strong> ${ingreso.pagador.direccion}</p>` : ''}
                        ` : ''}
                        
                        ${ingreso.Credito ? `
                            <hr>
                            <h6>Información del Crédito:</h6>
                            <p><strong>Número de Crédito:</strong> ${ingreso.Credito.numero_credito || ingreso.Credito.loan_number || `CR-${ingreso.Credito.id}`}</p>
                            <p><strong>Tipo de Crédito:</strong> ${ingreso.Credito.tipo || ingreso.Credito.type || 'No especificado'}</p>
                            <p><strong>Tipo de Pago:</strong> ${ingreso.tipo_pago || 'No especificado'}</p>
                        ` : ''}
                    </div>
                </div>
            `;
        }
        
        // Construir HTML para la tarjeta de asesor/comisión si aplica
        let asesorHTML = '';
        if (ingreso.Asesor) {
            asesorHTML = `
                <div class="card mb-4">
                    <div class="card-header bg-success text-white">
                        <h5 class="mb-0">Información de Comisión</h5>
                    </div>
                    <div class="card-body">
                        <p><strong>Asesor:</strong> ${ingreso.Asesor.full_name}</p>
                        <p><strong>Documento:</strong> ${ingreso.Asesor.id_number}</p>
                        <p><strong>Porcentaje de Comisión:</strong> ${ingreso.porcentaje_comision || 0}%</p>
                        <p><strong>Valor de Comisión:</strong> ${valorComision}</p>
                    </div>
                </div>
            `;
        }
        
        // Construir HTML para la tarjeta de archivos adjuntos
        const archivosCardHTML = `
            <div class="card mb-4">
                <div class="card-header bg-secondary text-white">
                    <h5 class="mb-0">Archivos Adjuntos</h5>
                </div>
                <div class="card-body">
                    ${archivosHTML}
                </div>
            </div>
        `;
        
        // Construir HTML completo
        container.innerHTML = `
            ${infoHTML}
            ${clienteHTML}
            ${asesorHTML}
            ${archivosCardHTML}
        `;
        
        // Configurar botones de acción según el estado
        const btnEditar = document.getElementById('btnEditarDesdeDetalle');
        const btnAnular = document.getElementById('btnAnularDesdeDetalle');
        
        btnEditar.dataset.id = ingreso.id;
        btnAnular.dataset.id = ingreso.id;
        
        if (ingreso.estado === 'anulado') {
            btnEditar.style.display = 'none';
            btnAnular.style.display = 'none';
        } else {
            btnEditar.style.display = 'inline-block';
            btnAnular.style.display = 'inline-block';
        }
        
    } catch (error) {
        console.error('Error al ver detalle del ingreso:', error);
        
        // Mostrar mensaje de error en el modal
        const container = document.getElementById('detalleIngresoContent');
        container.innerHTML = `
            <div class="alert alert-danger">
                <h5>Error al cargar los detalles</h5>
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
});