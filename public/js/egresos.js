document.addEventListener('DOMContentLoaded', function() {
    // Verificación de autenticación
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Variables globales
    let currentPage = 1;
    let pageSize = 10;
    let totalPages = 0;
    let currentEgresoId = null;
    let egresos = [];
    let filtros = {
        fechaDesde: null,
        fechaHasta: null,
        categoria: '',
        estado: '',
        metodoPago: '',
        busqueda: ''
    };

    // Referencias a elementos del DOM
    const tablaCuerpo = document.getElementById('tablaEgresos');
    const paginacion = document.getElementById('paginacion');
    const totalRegistrosElement = document.getElementById('totalRegistros');
    const totalEgresosElement = document.getElementById('totalEgresos');
    const totalPagadoElement = document.getElementById('totalPagado');
    const totalPendienteElement = document.getElementById('totalPendiente');

    // Inicialización
    initDatePicker();
    cargarCategorias();
    cargarEgresos();
    setupEventListeners();

    // Inicializar Date Picker
    function initDatePicker() {
        $('#fechaRango').daterangepicker({
            opens: 'left',
            autoUpdateInput: false,
            locale: {
                format: 'DD/MM/YYYY',
                cancelLabel: 'Borrar',
                applyLabel: 'Aplicar',
                fromLabel: 'Desde',
                toLabel: 'Hasta',
                customRangeLabel: 'Personalizado',
                daysOfWeek: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
                monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
            }
        });

        $('#fechaRango').on('apply.daterangepicker', function(ev, picker) {
            $(this).val(picker.startDate.format('DD/MM/YYYY') + ' - ' + picker.endDate.format('DD/MM/YYYY'));
            filtros.fechaDesde = picker.startDate.format('YYYY-MM-DD');
            filtros.fechaHasta = picker.endDate.format('YYYY-MM-DD');
        });

        $('#fechaRango').on('cancel.daterangepicker', function(ev, picker) {
            $(this).val('');
            filtros.fechaDesde = null;
            filtros.fechaHasta = null;
        });
    }

    // Configuración de event listeners
    function setupEventListeners() {
        // Event listeners para los botones principales
        document.getElementById('btnNuevoEgreso').addEventListener('click', mostrarModalNuevoEgreso);
        document.getElementById('btnCategorias').addEventListener('click', mostrarModalCategorias);
        document.getElementById('btnProveedores').addEventListener('click', mostrarModalProveedores);
        document.getElementById('btnReportes').addEventListener('click', mostrarReportes);
        document.getElementById('btnExportar').addEventListener('click', exportarEgresos);

        // Event listeners para filtros
        document.getElementById('btnBuscar').addEventListener('click', aplicarFiltros);
        document.getElementById('btnLimpiarFiltros').addEventListener('click', limpiarFiltros);

        // Event listeners para modal de egreso
        document.getElementById('esRecurrente').addEventListener('change', function() {
            document.getElementById('seccionRecurrencia').style.display = this.checked ? 'block' : 'none';
        });

        document.getElementById('frecuencia').addEventListener('change', function() {
            const valor = this.value;
            const diaSemanaContainer = document.getElementById('diaSemanaContainer');
            const diaMesContainer = document.getElementById('diaMesContainer');
            
            if (valor === 'semanal' || valor === 'quincenal') {
                diaSemanaContainer.style.display = 'block';
                diaMesContainer.style.display = 'none';
            } else {
                diaSemanaContainer.style.display = 'none';
                diaMesContainer.style.display = 'block';
            }
        });

        // Event listeners para guardar formularios
        document.getElementById('btnGuardarEgreso').addEventListener('click', guardarEgreso);
        document.getElementById('btnGuardarCategoria').addEventListener('click', guardarCategoria);

        // Event listener para editar desde detalles
        document.getElementById('btnEditarDesdeDetalle').addEventListener('click', function() {
            $('#detalleEgresoModal').modal('hide');
            editarEgreso(currentEgresoId);
        });
    }

    // Carga las categorías desde la API
    function cargarCategorias() {
        fetch('/api/categorias-egreso', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar las categorías');
            }
            return response.json();
        })
        .then(data => {
            // Llenar selectores de categorías
            const categoriasSelect = document.getElementById('categoria');
            const categoriasFiltro = document.getElementById('categoriaFiltro');
            
            // Limpiar opciones existentes
            categoriasSelect.innerHTML = '<option value="">Seleccione una categoría</option>';
            categoriasFiltro.innerHTML = '<option value="">Todas las categorías</option>';
            
            data.forEach(categoria => {
                if (categoria.activa) {
                    const option = document.createElement('option');
                    option.value = categoria.id;
                    option.textContent = categoria.nombre;
                    categoriasSelect.appendChild(option.cloneNode(true));
                    categoriasFiltro.appendChild(option);
                }
            });
        })
        .catch(error => {
            mostrarNotificacion('Error', error.message, 'error');
        });
    }

    // Carga los egresos desde la API con paginación
    function cargarEgresos() {
        const queryParams = new URLSearchParams({
            page: currentPage,
            pageSize: pageSize,
            ...filtros
        });

        fetch(`/api/egresos?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar los egresos');
            }
            return response.json();
        })
        .then(data => {
            egresos = data.egresos;
            totalPages = data.totalPages;
            
            mostrarEgresos(data.egresos);
            actualizarPaginacion(data.currentPage, data.totalPages);
            actualizarEstadisticas(data.stats);
            
            totalRegistrosElement.textContent = data.totalItems;
        })
        .catch(error => {
            mostrarNotificacion('Error', error.message, 'error');
            tablaCuerpo.innerHTML = `<tr><td colspan="8" class="text-center">Error al cargar los datos: ${error.message}</td></tr>`;
        });
    }

    // Muestra los egresos en la tabla
    function mostrarEgresos(egresos) {
        if (egresos.length === 0) {
            tablaCuerpo.innerHTML = '<tr><td colspan="8" class="text-center">No se encontraron registros</td></tr>';
            return;
        }

        let filas = '';
        
        egresos.forEach(egreso => {
            // Formatear la fecha
            const fecha = new Date(egreso.fecha).toLocaleDateString('es-ES');
            
            // Determinar la clase y texto para el estado
            let estadoClass, estadoText;
            switch (egreso.estado) {
                case 'pagado':
                    estadoClass = 'success';
                    estadoText = 'Pagado';
                    break;
                case 'pendiente':
                    estadoClass = 'warning';
                    estadoText = 'Pendiente';
                    break;
                case 'anulado':
                    estadoClass = 'danger';
                    estadoText = 'Anulado';
                    break;
                default:
                    estadoClass = 'secondary';
                    estadoText = egreso.estado;
            }
            
            // Formatear el monto
            const monto = parseFloat(egreso.monto).toLocaleString('es-ES', {
                style: 'currency',
                currency: 'USD'
            });
            
            // Formatear el método de pago
            // Usar metodo_pago (del backend) o metodoPago (transformado en frontend)
            const metodoPagoValor = egreso.metodo_pago || egreso.metodoPago;
            
            let metodoPago;
            switch (metodoPagoValor) {
                case 'efectivo':
                    metodoPago = '<i class="fas fa-money-bill-wave text-success"></i> Efectivo';
                    break;
                case 'transferencia':
                    metodoPago = '<i class="fas fa-exchange-alt text-primary"></i> Transferencia';
                    break;
                case 'cheque':
                    metodoPago = '<i class="fas fa-money-check text-info"></i> Cheque';
                    break;
                case 'tarjeta':
                    metodoPago = '<i class="far fa-credit-card text-secondary"></i> Tarjeta';
                    break;
                default:
                    metodoPago = metodoPagoValor || 'No especificado';
            }
            
            filas += `
            <tr>
                <td>${egreso.numero_comprobante || egreso.comprobante || '-'}</td>
                <td>${fecha}</td>
                <td>${egreso.categoria?.nombre || '-'}</td>
                <td>${egreso.concepto}</td>
                <td class="text-end">${monto}</td>
                <td>${metodoPago}</td>
                <td><span class="badge bg-${estadoClass}">${estadoText}</span></td>
                <td class="action-buttons">
                    <button onclick="verDetalle(${egreso.id})" class="btn btn-sm btn-info" title="Ver detalle">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editarEgreso(${egreso.id})" class="btn btn-sm btn-primary" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="eliminarEgreso(${egreso.id})" class="btn btn-sm btn-danger" title="Eliminar">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>`;
        });
        
        tablaCuerpo.innerHTML = filas;
    }

    // Actualiza la paginación
    function actualizarPaginacion(currentPage, totalPages) {
        paginacion.innerHTML = '';
        
        if (totalPages <= 1) {
            return;
        }
        
        const maxPagesToShow = 5;
        let startPage = Math.max(currentPage - Math.floor(maxPagesToShow / 2), 1);
        let endPage = Math.min(startPage + maxPagesToShow - 1, totalPages);
        
        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(endPage - maxPagesToShow + 1, 1);
        }
        
        // Botón anterior
        const anteriorLi = document.createElement('li');
        anteriorLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        anteriorLi.innerHTML = `<a class="page-link" href="#" aria-label="Anterior">
            <span aria-hidden="true">&laquo;</span>
        </a>`;
        if (currentPage > 1) {
            anteriorLi.addEventListener('click', () => cambiarPagina(currentPage - 1));
        }
        paginacion.appendChild(anteriorLi);
        
        // Páginas
        for (let i = startPage; i <= endPage; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === currentPage ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            li.addEventListener('click', () => cambiarPagina(i));
            paginacion.appendChild(li);
        }
        
        // Botón siguiente
        const siguienteLi = document.createElement('li');
        siguienteLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        siguienteLi.innerHTML = `<a class="page-link" href="#" aria-label="Siguiente">
            <span aria-hidden="true">&raquo;</span>
        </a>`;
        if (currentPage < totalPages) {
            siguienteLi.addEventListener('click', () => cambiarPagina(currentPage + 1));
        }
        paginacion.appendChild(siguienteLi);
    }

    // Cambiar de página
    function cambiarPagina(pagina) {
        currentPage = pagina;
        cargarEgresos();
    }

    // Actualiza las estadísticas en la parte superior
    function actualizarEstadisticas(stats) {
        if (stats) {
            totalEgresosElement.textContent = formatearMoneda(stats.totalEgresos || 0);
            totalPagadoElement.textContent = formatearMoneda(stats.totalPagado || 0);
            totalPendienteElement.textContent = formatearMoneda(stats.totalPendiente || 0);
        }
    }

    // Aplicar filtros de búsqueda
    function aplicarFiltros() {
        filtros.categoria = document.getElementById('categoriaFiltro').value;
        filtros.estado = document.getElementById('estadoFiltro').value;
        filtros.metodoPago = document.getElementById('metodoFiltro').value;
        filtros.busqueda = document.getElementById('busquedaTexto').value;
        
        // Fecha ya se actualiza en el event listener del datepicker
        
        currentPage = 1; // Volver a la primera página
        cargarEgresos();
    }

    // Limpiar filtros
    function limpiarFiltros() {
        document.getElementById('fechaRango').value = '';
        document.getElementById('categoriaFiltro').value = '';
        document.getElementById('estadoFiltro').value = '';
        document.getElementById('metodoFiltro').value = '';
        document.getElementById('busquedaTexto').value = '';
        
        filtros = {
            fechaDesde: null,
            fechaHasta: null,
            categoria: '',
            estado: '',
            metodoPago: '',
            busqueda: ''
        };
        
        currentPage = 1;
        cargarEgresos();
    }

    // Mostrar modal para nuevo egreso
    function mostrarModalNuevoEgreso() {
        const modalTitle = document.getElementById('egresoModalTitle');
        const form = document.getElementById('egresoForm');
        
        modalTitle.textContent = 'Nuevo Egreso';
        form.reset();
        document.getElementById('egresoId').value = '';
        document.getElementById('seccionRecurrencia').style.display = 'none';
        document.getElementById('archivosActualesContainer').style.display = 'none';
        document.getElementById('fecha').valueAsDate = new Date();
        
        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('egresoModal'));
        modal.show();
    }

    // Guardar egreso (nuevo o actualización)
    function guardarEgreso() {
        const egresoId = document.getElementById('egresoId').value;
        const esNuevo = !egresoId;
        
        // Validar formulario
        const form = document.getElementById('egresoForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Construir objeto con los datos del formulario
        const formData = new FormData();
        formData.append('fecha', document.getElementById('fecha').value);
        formData.append('categoria_id', document.getElementById('categoria').value); // Cambiado de categoriaId a categoria_id
        formData.append('concepto', document.getElementById('concepto').value);
        formData.append('monto', document.getElementById('monto').value);
        formData.append('estado', document.getElementById('estado').value);
        formData.append('metodoPago', document.getElementById('metodoPago').value);
        formData.append('beneficiario', document.getElementById('beneficiario').value);
        formData.append('referenciaPago', document.getElementById('referenciaPago').value);
        formData.append('descripcion', document.getElementById('descripcion').value);
        
        // Datos de recurrencia
        const esRecurrente = document.getElementById('esRecurrente').checked;
        formData.append('esRecurrente', esRecurrente);
        
        if (esRecurrente) {
            formData.append('recurrencia[fechaInicio]', document.getElementById('fechaInicio').value);
            formData.append('recurrencia[fechaFin]', document.getElementById('fechaFin').value || null);
            formData.append('recurrencia[frecuencia]', document.getElementById('frecuencia').value);
            formData.append('recurrencia[cantidadRepeticiones]', document.getElementById('cantidadRepeticiones').value || null);
            
            const frecuencia = document.getElementById('frecuencia').value;
            if (frecuencia === 'semanal' || frecuencia === 'quincenal') {
                formData.append('recurrencia[diaSemana]', document.getElementById('diaSemana').value);
            } else {
                formData.append('recurrencia[diaMes]', document.getElementById('diaMes').value);
            }
        }
        
        // Archivos adjuntos
        const archivos = document.getElementById('archivosAdjuntos').files;
        for (let i = 0; i < archivos.length; i++) {
            formData.append('archivos', archivos[i]);
        }

        // Determinar URL y método HTTP
        const url = esNuevo ? '/api/egresos' : `/api/egresos/${egresoId}`;
        const method = esNuevo ? 'POST' : 'PUT';
        
        // Enviar datos a la API
        fetch(url, {
            method: method,
            body: formData,
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.message || 'Error al guardar el egreso');
                });
            }
            return response.json();
        })
        .then(data => {
            mostrarNotificacion('Éxito', `Egreso ${esNuevo ? 'creado' : 'actualizado'} correctamente`, 'success');
            // Cerrar el modal
            bootstrap.Modal.getInstance(document.getElementById('egresoModal')).hide();
            // Recargar los egresos
            cargarEgresos();
        })
        .catch(error => {
            mostrarNotificacion('Error', error.message, 'error');
        });
    }

    // Editar un egreso existente
    function editarEgreso(id) {
        fetch(`/api/egresos/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener los datos del egreso');
            }
            return response.json();
        })
        .then(egreso => {
            // Llenar el formulario con los datos obtenidos
            document.getElementById('egresoId').value = egreso.id;
            document.getElementById('egresoModalTitle').textContent = 'Editar Egreso';
            document.getElementById('fecha').value = egreso.fecha.substring(0, 10);
            document.getElementById('categoria').value = egreso.categoria_id || ''; // Cambiado de categoriaId a categoria_id
            document.getElementById('concepto').value = egreso.concepto;
            document.getElementById('monto').value = egreso.monto;
            document.getElementById('estado').value = egreso.estado;
            document.getElementById('metodoPago').value = egreso.metodoPago;
            document.getElementById('beneficiario').value = egreso.beneficiario || '';
            document.getElementById('referenciaPago').value = egreso.referenciaPago || '';
            document.getElementById('descripcion').value = egreso.descripcion || '';
            
            // Configurar recurrencia si existe
            const esRecurrente = !!egreso.recurrencia;
            document.getElementById('esRecurrente').checked = esRecurrente;
            document.getElementById('seccionRecurrencia').style.display = esRecurrente ? 'block' : 'none';
            
            if (esRecurrente && egreso.recurrencia) {
                document.getElementById('fechaInicio').value = egreso.recurrencia.fechaInicio.substring(0, 10);
                if (egreso.recurrencia.fechaFin) {
                    document.getElementById('fechaFin').value = egreso.recurrencia.fechaFin.substring(0, 10);
                } else {
                    document.getElementById('fechaFin').value = '';
                }
                document.getElementById('frecuencia').value = egreso.recurrencia.frecuencia;
                document.getElementById('cantidadRepeticiones').value = egreso.recurrencia.cantidadRepeticiones || '';
                
                // Configurar visibilidad de campos según frecuencia
                const frecuencia = egreso.recurrencia.frecuencia;
                if (frecuencia === 'semanal' || frecuencia === 'quincenal') {
                    document.getElementById('diaSemanaContainer').style.display = 'block';
                    document.getElementById('diaMesContainer').style.display = 'none';
                    document.getElementById('diaSemana').value = egreso.recurrencia.diaSemana || '1';
                } else {
                    document.getElementById('diaSemanaContainer').style.display = 'none';
                    document.getElementById('diaMesContainer').style.display = 'block';
                    document.getElementById('diaMes').value = egreso.recurrencia.diaMes || '1';
                }
            }
            
            // Mostrar archivos adjuntos si los hay
            if (egreso.archivos && egreso.archivos.length > 0) {
                mostrarArchivosActuales(egreso.archivos);
                document.getElementById('archivosActualesContainer').style.display = 'block';
            } else {
                document.getElementById('archivosActualesContainer').style.display = 'none';
            }
            
            // Mostrar el modal
            const modal = new bootstrap.Modal(document.getElementById('egresoModal'));
            modal.show();
        })
        .catch(error => {
            mostrarNotificacion('Error', error.message, 'error');
        });
    }

    // Mostrar archivos actuales en el formulario de edición
    function mostrarArchivosActuales(archivos) {
        const listaArchivos = document.getElementById('listaArchivosActuales');
        listaArchivos.innerHTML = '';
        
        archivos.forEach(archivo => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            
            const nombreArchivo = document.createElement('span');
            nombreArchivo.textContent = archivo.nombreOriginal || archivo.ruta.split('/').pop();
            
            const botonesAccion = document.createElement('div');
            
            const btnDescargar = document.createElement('button');
            btnDescargar.className = 'btn btn-sm btn-outline-primary me-2';
            btnDescargar.innerHTML = '<i class="fas fa-download"></i>';
            btnDescargar.title = 'Descargar';
            btnDescargar.onclick = () => descargarArchivo(archivo.id);
            
            const btnEliminar = document.createElement('button');
            btnEliminar.className = 'btn btn-sm btn-outline-danger';
            btnEliminar.innerHTML = '<i class="fas fa-trash"></i>';
            btnEliminar.title = 'Eliminar';
            btnEliminar.onclick = () => eliminarArchivo(archivo.id);
            
            botonesAccion.appendChild(btnDescargar);
            botonesAccion.appendChild(btnEliminar);
            
            li.appendChild(nombreArchivo);
            li.appendChild(botonesAccion);
            
            listaArchivos.appendChild(li);
        });
    }

    // Eliminar un egreso - Modificado para usar modal de confirmación
    function eliminarEgreso(id) {
        // Buscar el egreso en la lista actual
        const egreso = egresos.find(e => e.id === id);
        if (!egreso) {
            mostrarNotificacion('Error', 'No se encontró el egreso a eliminar', 'error');
            return;
        }
        
        // Llenar el modal con los datos del egreso
        document.getElementById('eliminarFecha').textContent = new Date(egreso.fecha).toLocaleDateString('es-ES');
        document.getElementById('eliminarConcepto').textContent = egreso.concepto;
        document.getElementById('eliminarCategoria').textContent = egreso.categoria?.nombre || '-';
        document.getElementById('eliminarMonto').textContent = formatearMoneda(egreso.monto);
        
        let estadoText;
        switch (egreso.estado) {
            case 'pagado': estadoText = 'Pagado'; break;
            case 'pendiente': estadoText = 'Pendiente'; break;
            case 'anulado': estadoText = 'Anulado'; break;
            default: estadoText = egreso.estado;
        }
        document.getElementById('eliminarEstado').textContent = estadoText;
        
        // Mostrar el modal
        const confirmarModal = new bootstrap.Modal(document.getElementById('confirmarEliminarModal'));
        confirmarModal.show();
        
        // Configurar el botón de confirmar
        const btnConfirmar = document.getElementById('btnConfirmarEliminar');
        
        // Remover event listeners anteriores
        const nuevoBtn = btnConfirmar.cloneNode(true);
        btnConfirmar.parentNode.replaceChild(nuevoBtn, btnConfirmar);
        
        // Añadir nuevo event listener
        nuevoBtn.addEventListener('click', function() {
            confirmarModal.hide();
            
            // Enviar la solicitud de eliminación
            fetch(`/api/egresos/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al eliminar el egreso');
                }
                return response.json();
            })
            .then(data => {
                mostrarNotificacion('Éxito', 'Egreso eliminado correctamente', 'success');
                cargarEgresos();
            })
            .catch(error => {
                mostrarNotificacion('Error', error.message, 'error');
            });
        });
    }

    // Ver detalle de un egreso
    function verDetalle(id) {
        fetch(`/api/egresos/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener los datos del egreso');
            }
            return response.json();
        })
        .then(egreso => {
            currentEgresoId = egreso.id;
            
            // Llenar los detalles básicos
            document.getElementById('detalleComprobante').textContent = egreso.comprobante || '-';
            document.getElementById('detalleFecha').textContent = new Date(egreso.fecha).toLocaleDateString('es-ES');
            document.getElementById('detalleCategoria').textContent = egreso.categoria?.nombre || '-';
            document.getElementById('detalleConcepto').textContent = egreso.concepto;
            document.getElementById('detalleDescripcion').textContent = egreso.descripcion || '-';
            
            // Información de pago
            document.getElementById('detalleMonto').textContent = formatearMoneda(egreso.monto);
            
            let estadoHTML = '';
            switch (egreso.estado) {
                case 'pagado':
                    estadoHTML = '<span class="badge bg-success">Pagado</span>';
                    break;
                case 'pendiente':
                    estadoHTML = '<span class="badge bg-warning">Pendiente</span>';
                    break;
                case 'anulado':
                    estadoHTML = '<span class="badge bg-danger">Anulado</span>';
                    break;
                default:
                    estadoHTML = `<span class="badge bg-secondary">${egreso.estado}</span>`;
            }
            document.getElementById('detalleEstado').innerHTML = estadoHTML;
            
            let metodoHTML = '';
            switch (egreso.metodoPago) {
                case 'efectivo':
                    metodoHTML = '<i class="fas fa-money-bill-wave text-success me-1"></i> Efectivo';
                    break;
                case 'transferencia':
                    metodoHTML = '<i class="fas fa-exchange-alt text-primary me-1"></i> Transferencia';
                    break;
                case 'cheque':
                    metodoHTML = '<i class="fas fa-money-check text-info me-1"></i> Cheque';
                    break;
                case 'tarjeta':
                    metodoHTML = '<i class="far fa-credit-card text-secondary me-1"></i> Tarjeta';
                    break;
                default:
                    metodoHTML = egreso.metodoPago;
            }
            document.getElementById('detalleMetodo').innerHTML = metodoHTML;
            
            document.getElementById('detalleBeneficiario').textContent = egreso.beneficiario || '-';
            
            // Información de recurrencia si existe
            const recurrenciaContainer = document.getElementById('detalleRecurrenciaContainer');
            if (egreso.recurrencia) {
                document.getElementById('detalleRecurrenciaFrecuencia').textContent = capitalizarPrimeraLetra(egreso.recurrencia.frecuencia);
                document.getElementById('detalleRecurrenciaInicio').textContent = new Date(egreso.recurrencia.fechaInicio).toLocaleDateString('es-ES');
                
                const fechaFin = egreso.recurrencia.fechaFin 
                    ? new Date(egreso.recurrencia.fechaFin).toLocaleDateString('es-ES')
                    : 'Sin fecha límite';
                document.getElementById('detalleRecurrenciaFin').textContent = fechaFin;
                
                // Calcular próximo pago
                const proximoPago = calcularProximoPago(egreso.recurrencia);
                document.getElementById('detalleProximoPago').textContent = proximoPago 
                    ? proximoPago.toLocaleDateString('es-ES')
                    : 'No hay pagos pendientes';
                
                recurrenciaContainer.style.display = 'block';
            } else {
                recurrenciaContainer.style.display = 'none';
            }
            
            // Mostrar archivos adjuntos
            const archivosContainer = document.getElementById('detalleArchivosContainer');
            const detalleArchivos = document.getElementById('detalleArchivos');
            
            if (egreso.archivos && egreso.archivos.length > 0) {
                let html = '<ul class="list-group">';
                egreso.archivos.forEach(archivo => {
                    html += `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span>${archivo.nombreOriginal || archivo.ruta.split('/').pop()}</span>
                        <button onclick="descargarArchivo(${archivo.id})" class="btn btn-sm btn-outline-primary">
                            <i class="fas fa-download"></i> Descargar
                        </button>
                    </li>`;
                });
                html += '</ul>';
                detalleArchivos.innerHTML = html;
                archivosContainer.style.display = 'block';
            } else {
                detalleArchivos.innerHTML = '<p>No hay archivos adjuntos.</p>';
                archivosContainer.style.display = 'block';
            }
            
            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('detalleEgresoModal'));
            modal.show();
        })
        .catch(error => {
            mostrarNotificacion('Error', error.message, 'error');
        });
    }

    // Calcular próximo pago para recurrencia
    function calcularProximoPago(recurrencia) {
        if (!recurrencia.fechaInicio) {
            return null;
        }
        
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        let fechaInicio = new Date(recurrencia.fechaInicio);
        fechaInicio.setHours(0, 0, 0, 0);
        
        if (recurrencia.fechaFin) {
            let fechaFin = new Date(recurrencia.fechaFin);
            fechaFin.setHours(0, 0, 0, 0);
            
            if (fechaFin < hoy) {
                return null; // Ya no hay pagos pendientes
            }
        }
        
        let proximaFecha = new Date(fechaInicio);
        
        switch (recurrencia.frecuencia) {
            case 'semanal':
                // Ajustar al día de la semana correcto
                const diaSemana = parseInt(recurrencia.diaSemana) || 1;
                proximaFecha.setDate(proximaFecha.getDate() + (diaSemana - proximaFecha.getDay() + 7) % 7);
                
                // Avanzar semanas hasta encontrar una fecha futura
                while (proximaFecha < hoy) {
                    proximaFecha.setDate(proximaFecha.getDate() + 7);
                }
                break;
                
            case 'quincenal':
                // Similar a semanal pero avanza de 14 en 14 días
                const diaSemanaQuincenal = parseInt(recurrencia.diaSemana) || 1;
                proximaFecha.setDate(proximaFecha.getDate() + (diaSemanaQuincenal - proximaFecha.getDay() + 7) % 7);
                
                while (proximaFecha < hoy) {
                    proximaFecha.setDate(proximaFecha.getDate() + 14);
                }
                break;
                
            case 'mensual':
                // Ajustar al día del mes correcto
                const diaMes = parseInt(recurrencia.diaMes) || 1;
                proximaFecha.setDate(diaMes);
                
                // Avanzar meses hasta encontrar una fecha futura
                while (proximaFecha < hoy) {
                    proximaFecha.setMonth(proximaFecha.getMonth() + 1);
                }
                break;
                
            case 'trimestral':
                const diaMesTrimestral = parseInt(recurrencia.diaMes) || 1;
                proximaFecha.setDate(diaMesTrimestral);
                
                while (proximaFecha < hoy) {
                    proximaFecha.setMonth(proximaFecha.getMonth() + 3);
                }
                break;
                
            case 'anual':
                const diaMesAnual = parseInt(recurrencia.diaMes) || 1;
                proximaFecha.setDate(diaMesAnual);
                
                while (proximaFecha < hoy) {
                    proximaFecha.setFullYear(proximaFecha.getFullYear() + 1);
                }
                break;
        }
        
        return proximaFecha;
    }

    // Mostrar modal de categorías
    function mostrarModalCategorias() {
        cargarCategoriasTodas();
        const modal = new bootstrap.Modal(document.getElementById('categoriasModal'));
        modal.show();
    }

    // Cargar todas las categorías para la gestión
    function cargarCategoriasTodas() {
        fetch('/api/categorias-egreso', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar las categorías');
            }
            return response.json();
        })
        .then(categorias => {
            const tablaCategorias = document.getElementById('tablaCategorias');
            
            if (categorias.length === 0) {
                tablaCategorias.innerHTML = '<tr><td colspan="4" class="text-center">No hay categorías registradas</td></tr>';
                return;
            }
            
            let html = '';
            categorias.forEach(categoria => {
                const estadoClass = categoria.activa ? 'success' : 'danger';
                const estadoText = categoria.activa ? 'Activa' : 'Inactiva';
                
                html += `
                <tr>
                    <td>${categoria.nombre}</td>
                    <td>${categoria.descripcion || '-'}</td>
                    <td><span class="badge bg-${estadoClass}">${estadoText}</span></td>
                    <td>
                        <button onclick="editarCategoria(${categoria.id})" class="btn btn-sm btn-primary">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="eliminarCategoria(${categoria.id})" class="btn btn-sm btn-danger">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>`;
            });
            
            tablaCategorias.innerHTML = html;
        })
        .catch(error => {
            mostrarNotificacion('Error', error.message, 'error');
            document.getElementById('tablaCategorias').innerHTML = 
                `<tr><td colspan="4" class="text-center">Error al cargar los datos: ${error.message}</td></tr>`;
        });
    }

    // Mostrar modal para nueva categoría
    document.getElementById('btnNuevaCategoria').addEventListener('click', function() {
        document.getElementById('categoriaModalTitle').textContent = 'Nueva Categoría';
        document.getElementById('categoriaForm').reset();
        document.getElementById('categoriaId').value = '';
        document.getElementById('categoriaActiva').checked = true;
        
        const modal = new bootstrap.Modal(document.getElementById('categoriaFormModal'));
        modal.show();
    });

    // Editar categoría
    window.editarCategoria = function(id) {
        fetch(`/api/categorias-egreso/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener los datos de la categoría');
            }
            return response.json();
        })
        .then(categoria => {
            document.getElementById('categoriaModalTitle').textContent = 'Editar Categoría';
            document.getElementById('categoriaId').value = categoria.id;
            document.getElementById('categoriaNombre').value = categoria.nombre;
            document.getElementById('categoriaDescripcion').value = categoria.descripcion || '';
            document.getElementById('categoriaActiva').checked = categoria.activa;
            
            const modal = new bootstrap.Modal(document.getElementById('categoriaFormModal'));
            modal.show();
        })
        .catch(error => {
            mostrarNotificacion('Error', error.message, 'error');
        });
    };

    // Guardar categoría
    function guardarCategoria() {
        const categoriaId = document.getElementById('categoriaId').value;
        const esNueva = !categoriaId;
        
        // Validar formulario
        const form = document.getElementById('categoriaForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Construir objeto con los datos
        const datosCategoria = {
            nombre: document.getElementById('categoriaNombre').value,
            descripcion: document.getElementById('categoriaDescripcion').value,
            activa: document.getElementById('categoriaActiva').checked
        };
        
        // Determinar URL y método HTTP
        const url = esNueva ? '/api/categorias-egreso' : `/api/categorias-egreso/${categoriaId}`;
        const method = esNueva ? 'POST' : 'PUT';
        
        // Enviar datos a la API
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(datosCategoria)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.message || 'Error al guardar la categoría');
                });
            }
            return response.json();
        })
        .then(data => {
            mostrarNotificacion('Éxito', `Categoría ${esNueva ? 'creada' : 'actualizada'} correctamente`, 'success');
            // Cerrar el modal
            bootstrap.Modal.getInstance(document.getElementById('categoriaFormModal')).hide();
            // Recargar categorías
            cargarCategoriasTodas();
            cargarCategorias();
        })
        .catch(error => {
            mostrarNotificacion('Error', error.message, 'error');
        });
    }

    // Eliminar categoría
    window.eliminarCategoria = function(id) {
        if (!confirm('¿Está seguro de eliminar esta categoría? Esta acción podría afectar a los egresos asociados.')) {
            return;
        }
        
        fetch(`/api/categorias-egreso/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al eliminar la categoría');
            }
            return response.json();
        })
        .then(data => {
            mostrarNotificacion('Éxito', 'Categoría eliminada correctamente', 'success');
            cargarCategoriasTodas();
            cargarCategorias();
        })
        .catch(error => {
            mostrarNotificacion('Error', error.message, 'error');
        });
    };

    // Mostrar modal de proveedores
    function mostrarModalProveedores() {
        // TODO: Implementar gestión de proveedores
        mostrarNotificacion('Información', 'La gestión de proveedores se implementará próximamente', 'info');
    }

    // Mostrar reportes
    function mostrarReportes() {
        // TODO: Implementar reportes
        mostrarNotificacion('Información', 'Los reportes se implementarán próximamente', 'info');
    }

    // Exportar egresos
    function exportarEgresos() {
        // Construir la URL con los filtros actuales
        const queryParams = new URLSearchParams({
            ...filtros
        });
        
        // Abrir en nueva ventana la descarga
        window.open(`/api/egresos/export?${queryParams}`, '_blank');
    }

    // Descargar archivo adjunto
    window.descargarArchivo = function(id) {
        window.open(`/api/egresos/archivos/${id}/download`, '_blank');
    };

    // Eliminar archivo adjunto
    window.eliminarArchivo = function(id) {
        if (!confirm('¿Está seguro de eliminar este archivo? Esta acción no se puede deshacer.')) {
            return;
        }
        
        fetch(`/api/egresos/archivos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al eliminar el archivo');
            }
            return response.json();
        })
        .then(data => {
            mostrarNotificacion('Éxito', 'Archivo eliminado correctamente', 'success');
            // Actualizar la lista de archivos
            const egresoId = document.getElementById('egresoId').value;
            if (egresoId) {
                // Recargar los detalles del egreso para actualizar la lista de archivos
                fetch(`/api/egresos/${egresoId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
                .then(response => response.json())
                .then(egreso => {
                    if (egreso.archivos && egreso.archivos.length > 0) {
                        mostrarArchivosActuales(egreso.archivos);
                    } else {
                        document.getElementById('archivosActualesContainer').style.display = 'none';
                    }
                });
            }
        })
        .catch(error => {
            mostrarNotificacion('Error', error.message, 'error');
        });
    };

    // Funciones auxiliares
    function formatearMoneda(valor) {
        return parseFloat(valor).toLocaleString('es-ES', {
            style: 'currency',
            currency: 'USD'
        });
    }

    function capitalizarPrimeraLetra(texto) {
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    }

    // Mostrar notificación
    function mostrarNotificacion(titulo, mensaje, tipo) {
        const toastContainer = document.getElementById('toastContainer');
        
        // Crear elemento toast
        const toastElement = document.createElement('div');
        toastElement.className = `toast align-items-center border-0 bg-${tipo === 'error' ? 'danger' : tipo}`;
        toastElement.setAttribute('role', 'alert');
        toastElement.setAttribute('aria-live', 'assertive');
        toastElement.setAttribute('aria-atomic', 'true');
        
        const toastHeader = document.createElement('div');
        toastHeader.className = 'toast-header';
        
        let iconClass;
        switch (tipo) {
            case 'success': iconClass = 'fas fa-check-circle text-success'; break;
            case 'error': iconClass = 'fas fa-exclamation-circle text-danger'; break;
            case 'warning': iconClass = 'fas fa-exclamation-triangle text-warning'; break;
            default: iconClass = 'fas fa-info-circle text-info';
        }
        
        toastHeader.innerHTML = `
            <i class="${iconClass} me-2"></i>
            <strong class="me-auto">${titulo}</strong>
            <small>ahora</small>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Cerrar"></button>
        `;
        
        const toastBody = document.createElement('div');
        toastBody.className = 'toast-body';
        toastBody.textContent = mensaje;
        
        toastElement.appendChild(toastHeader);
        toastElement.appendChild(toastBody);
        toastContainer.appendChild(toastElement);
        
        // Inicializar toast
        const toast = new bootstrap.Toast(toastElement, {
            delay: 5000,
            autohide: true
        });
        toast.show();
        
        // Eliminar el toast del DOM cuando se oculte
        toastElement.addEventListener('hidden.bs.toast', function () {
            toastContainer.removeChild(toastElement);
        });
    }

    // Exportar funciones al contexto global para acceder desde los onclick en HTML
    window.verDetalle = verDetalle;
    window.editarEgreso = editarEgreso;
    window.eliminarEgreso = eliminarEgreso;
});