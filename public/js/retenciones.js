// Variables globales
let token = localStorage.getItem('token');
let categorias = [];
let retencionConfig = {
    fechaLimiteEnvio: new Date(),
    ultimaActualizacion: new Date(),
    observaciones: ''
};

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

// Función para cargar los conceptos de retención
async function cargarConceptos() {
    try {
        const response = await fetch('/api/retenciones/conceptos', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error al cargar conceptos de retención');
        }
        
        categorias = result.data;
        
        const tablaConceptos = document.getElementById('tablaConceptos');
        if (categorias.length === 0) {
            tablaConceptos.innerHTML = '<tr><td colspan="5" class="text-center">No hay conceptos de retención configurados</td></tr>';
            return;
        }
        
        let html = '';
        categorias.forEach(categoria => {
            html += `
                <tr>
                    <td>${categoria.nombre}</td>
                    <td>${categoria.descripcion || '-'}</td>
                    <td class="text-center">
                        <span class="badge ${categoria.porcentaje_retencion > 0 ? 'bg-success' : 'bg-secondary'}">
                            ${categoria.porcentaje_retencion}%
                        </span>
                    </td>
                    <td>
                        <span class="badge ${categoria.es_activo ? 'bg-success' : 'bg-danger'}">
                            ${categoria.es_activo ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="editarPorcentaje(${categoria.id}, '${categoria.nombre}', ${categoria.porcentaje_retencion})">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tablaConceptos.innerHTML = html;
        
        // Actualizar contador de conceptos activos
        const conceptosActivos = categorias.filter(c => c.es_activo).length;
        document.getElementById('conceptosActivos').textContent = conceptosActivos;
        
    } catch (error) {
        console.error('Error al cargar conceptos:', error);
        showToast('Error al cargar conceptos de retención: ' + error.message, 'error');
    }
}

// Función para editar el porcentaje de retención
function editarPorcentaje(id, nombre, porcentaje) {
    document.getElementById('editarCategoriaId').value = id;
    document.getElementById('editarCategoriaNombre').value = nombre;
    document.getElementById('editarPorcentajeRetencion').value = porcentaje;
    
    const modal = new bootstrap.Modal(document.getElementById('editarPorcentajeModal'));
    modal.show();
}

// Función para guardar el porcentaje de retención
async function guardarPorcentaje() {
    try {
        const categoriaId = document.getElementById('editarCategoriaId').value;
        const porcentaje = document.getElementById('editarPorcentajeRetencion').value;
        
        if (!categoriaId || porcentaje === '') {
            throw new Error('Datos incompletos');
        }
        
        const response = await fetch(`/api/retenciones/conceptos/${categoriaId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                porcentaje_retencion: parseFloat(porcentaje)
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error al actualizar porcentaje');
        }
        
        // Cerrar el modal
        const modalElement = document.getElementById('editarPorcentajeModal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal.hide();
        
        // Mostrar mensaje de éxito
        showToast('Porcentaje de retención actualizado correctamente');
        
        // Recargar conceptos
        cargarConceptos();
        
    } catch (error) {
        console.error('Error al guardar porcentaje:', error);
        showToast('Error al guardar porcentaje: ' + error.message, 'error');
    }
}

// Función para cargar los datos de retenciones
async function cargarDatosRetenciones() {
    try {
        // Obtener el mes actual y el primer/último día
        const hoy = new Date();
        const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        
        const formatoFecha = (fecha) => {
            return fecha.toISOString().split('T')[0];
        };
        
        // Consultar las retenciones del mes actual
        const response = await fetch(`/api/retenciones/reporte?fechaInicio=${formatoFecha(primerDiaMes)}&fechaFin=${formatoFecha(ultimoDiaMes)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error al cargar datos de retenciones');
        }
        
        // Actualizar totales en tarjetas
        const datos = result.data;
        
        // Total retenido (histórico)
        document.getElementById('totalRetenido').textContent = formatCurrency(datos.resumen.totalRetencion || 0);
        
        // Retenciones del mes actual
        document.getElementById('retencionesDelMes').textContent = formatCurrency(datos.resumen.totalRetencion || 0);
        
        // Cargar datos de configuración si existen
        if (datos.config) {
            retencionConfig = datos.config;
            
            // Actualizar fecha de envío a la DIAN
            if (retencionConfig.fechaLimiteEnvio) {
                const fechaFormateada = moment(retencionConfig.fechaLimiteEnvio).format('DD/MM/YYYY');
                document.getElementById('fechaEnvioDian').textContent = fechaFormateada;
                
                // Actualizar fecha en la alerta
                document.getElementById('alertaFechaLimite').textContent = fechaFormateada;
                
                // Calcular días restantes
                const hoy = moment();
                const fechaLimite = moment(retencionConfig.fechaLimiteEnvio);
                const diasRestantes = fechaLimite.diff(hoy, 'days');
                
                document.getElementById('countdownDias').textContent = diasRestantes > 0 ? diasRestantes : 0;
                
                // Cambiar estilo de alerta si está muy cerca o pasada
                const alertaElement = document.getElementById('fechaLimiteAlerta');
                if (diasRestantes <= 0) {
                    alertaElement.classList.remove('bg-warning-subtle');
                    alertaElement.classList.add('bg-danger-subtle');
                    alertaElement.style.borderLeftColor = '#dc3545';
                } else if (diasRestantes <= 5) {
                    alertaElement.style.borderLeftColor = '#dc3545';
                }
            }
            
            // Actualizar campo de fecha en configuración
            if (retencionConfig.fechaLimiteEnvio) {
                document.getElementById('fechaLimiteEnvio').value = moment(retencionConfig.fechaLimiteEnvio).format('YYYY-MM-DD');
            }
            
            // Actualizar observaciones en configuración
            if (retencionConfig.observaciones) {
                document.getElementById('observacionesConfig').value = retencionConfig.observaciones;
            }
        }
        
    } catch (error) {
        console.error('Error al cargar datos de retenciones:', error);
        showToast('Error al cargar datos de retenciones: ' + error.message, 'error');
    }
}

// Función para generar reporte de retenciones
async function generarReporte(e) {
    if (e) e.preventDefault();
    
    try {
        const fechaInicio = document.getElementById('reporteFechaInicio').value;
        const fechaFin = document.getElementById('reporteFechaFin').value;
        const formato = document.getElementById('reporteFormato').value;
        
        if (!fechaInicio || !fechaFin) {
            throw new Error('Debe seleccionar un rango de fechas');
        }
        
        // Si el formato es Excel, descargar directamente
        if (formato === 'excel') {
            window.location.href = `/api/retenciones/reporte?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}&formato=excel&token=${token}`;
            return;
        }
        
        // Si es JSON, mostrar en la página
        const response = await fetch(`/api/retenciones/reporte?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error al generar reporte');
        }
        
        // Mostrar resultados en la página
        const datos = result.data;
        
        // Mostrar totales
        document.getElementById('resumenTotalRetenciones').textContent = formatCurrency(datos.resumen.totalRetencion || 0);
        document.getElementById('resumenOperaciones').textContent = datos.resumen.cantidadRegistros || 0;
        document.getElementById('resumenBaseGravable').textContent = formatCurrency(datos.resumen.totalBruto || 0);
        
        // Generar tabla de conceptos
        const tablaCuerpo = document.getElementById('resumenConceptosBody');
        if (!datos.resumen.porConcepto || datos.resumen.porConcepto.length === 0) {
            tablaCuerpo.innerHTML = '<tr><td colspan="5" class="text-center">No hay datos para mostrar</td></tr>';
        } else {
            let html = '';
            datos.resumen.porConcepto.forEach(concepto => {
                html += `
                    <tr>
                        <td>${concepto.nombre}</td>
                        <td class="text-center">${concepto.cantidad}</td>
                        <td class="text-end">${formatCurrency(concepto.totalBruto)}</td>
                        <td class="text-center">${concepto.totalBruto > 0 ? ((concepto.totalRetencion / concepto.totalBruto) * 100).toFixed(2) + '%' : '0%'}</td>
                        <td class="text-end">${formatCurrency(concepto.totalRetencion)}</td>
                    </tr>
                `;
            });
            tablaCuerpo.innerHTML = html;
        }
        
        // Mostrar sección de resultados
        document.getElementById('reporteResultado').style.display = 'block';
        
    } catch (error) {
        console.error('Error al generar reporte:', error);
        showToast('Error al generar reporte: ' + error.message, 'error');
    }
}

// Función para guardar configuración
async function guardarConfiguracion(e) {
    if (e) e.preventDefault();
    
    try {
        const fechaLimiteEnvio = document.getElementById('fechaLimiteEnvio').value;
        const observaciones = document.getElementById('observacionesConfig').value;
        
        if (!fechaLimiteEnvio) {
            throw new Error('Debe ingresar una fecha límite');
        }
        
        const response = await fetch('/api/retenciones/configuracion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                fechaLimiteEnvio,
                observaciones
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error al guardar configuración');
        }
        
        // Actualizar configuración local
        retencionConfig = result.data;
        
        // Mostrar mensaje de éxito
        showToast('Configuración guardada correctamente');
        
        // Recargar datos
        cargarDatosRetenciones();
        
    } catch (error) {
        console.error('Error al guardar configuración:', error);
        showToast('Error al guardar configuración: ' + error.message, 'error');
    }
}

// Inicializar configuración por defecto del reporte
function initReporteForm() {
    // Establecer fechas del mes actual por defecto
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    
    const formatoFecha = (fecha) => {
        return fecha.toISOString().split('T')[0];
    };
    
    document.getElementById('reporteFechaInicio').value = formatoFecha(primerDiaMes);
    document.getElementById('reporteFechaFin').value = formatoFecha(ultimoDiaMes);
}

// Manejadores de eventos
document.addEventListener('DOMContentLoaded', () => {
    // Verificar token
    if (!token) {
        window.location.href = '/login';
        return;
    }
    
    // Cargar datos al iniciar
    cargarConceptos();
    cargarDatosRetenciones();
    initReporteForm();
    
    // Evento para editar porcentaje
    document.getElementById('btnGuardarPorcentaje').addEventListener('click', guardarPorcentaje);
    
    // Evento para generar reporte
    document.getElementById('reporteForm').addEventListener('submit', generarReporte);
    
    // Evento para guardar configuración
    document.getElementById('configuracionForm').addEventListener('submit', guardarConfiguracion);
});