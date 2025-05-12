// Función para ver el detalle completo de un ingreso
async function verDetalleIngreso(id) {
    try {
        // Obtener los datos del ingreso desde la API
        const response = await fetch(`/api/ingresos/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error al obtener detalle del ingreso: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error al obtener el detalle del ingreso');
        }
        
        const ingreso = result.data;
        
        // Llenar el modal con los datos del ingreso
        document.getElementById('detalleNumeroComprobante').textContent = ingreso.numero_comprobante || `ING-${ingreso.id}`;
        document.getElementById('detalleFecha').textContent = new Date(ingreso.fecha).toLocaleDateString('es-CO');
        document.getElementById('detalleCategoria').textContent = ingreso.categoria ? ingreso.categoria.nombre : 'Sin categoría';
        document.getElementById('detalleConcepto').textContent = ingreso.concepto;
        document.getElementById('detalleDescripcion').textContent = ingreso.descripcion || 'Sin descripción';
        document.getElementById('detalleValorBruto').textContent = formatCurrency(ingreso.valor_bruto);
        document.getElementById('detalleValorRetencion').textContent = formatCurrency(ingreso.valor_retencion);
        document.getElementById('detallePorcentajeRetencion').textContent = `${ingreso.porcentaje_retencion}%`;
        document.getElementById('detalleValorNeto').textContent = formatCurrency(ingreso.valor_neto);
        document.getElementById('detalleMetodoPago').textContent = ingreso.metodo_pago || 'No especificado';
        document.getElementById('detalleReferenciaPago').textContent = ingreso.referencia_pago || 'No especificado';
        
        // Establecer clase para el estado
        let estadoClass = '';
        switch (ingreso.estado) {
            case 'confirmado': estadoClass = 'bg-success'; break;
            case 'pendiente': estadoClass = 'bg-warning'; break;
            case 'anulado': estadoClass = 'bg-danger'; break;
            default: estadoClass = 'bg-secondary';
        }
        
        document.getElementById('detalleEstado').className = `badge ${estadoClass}`;
        document.getElementById('detalleEstado').textContent = ingreso.estado;
        
        // Información del cliente si existe
        const detalleClienteElement = document.getElementById('detalleCliente');
        if (detalleClienteElement) {
            if (ingreso.cliente) {
                const nombreCliente = ingreso.cliente.full_name || 
                                     `${ingreso.cliente.nombre || ''} ${ingreso.cliente.apellido || ''}`.trim();
                detalleClienteElement.textContent = nombreCliente;
                
                // Mostrar sección de cliente
                document.getElementById('seccionDetalleCliente').style.display = 'block';
            } else {
                document.getElementById('seccionDetalleCliente').style.display = 'none';
            }
        }
        
        // Información del crédito si existe
        const detalleCreditoElement = document.getElementById('detalleCredito');
        if (detalleCreditoElement) {
            if (ingreso.credito) {
                detalleCreditoElement.textContent = ingreso.credito.numero || `CR-${ingreso.credito.id}`;
                
                // Mostrar sección de crédito
                document.getElementById('seccionDetalleCredito').style.display = 'block';
            } else {
                document.getElementById('seccionDetalleCredito').style.display = 'none';
            }
        }
        
        // Información del asesor y comisión si existe
        const detalleAsesorElement = document.getElementById('detalleAsesor');
        if (detalleAsesorElement) {
            if (ingreso.asesor) {
                const nombreAsesor = ingreso.asesor.full_name || 
                                    `${ingreso.asesor.nombre || ''} ${ingreso.asesor.apellido || ''}`.trim();
                detalleAsesorElement.textContent = nombreAsesor;
                
                document.getElementById('detallePorcentajeComision').textContent = `${ingreso.porcentaje_comision || 0}%`;
                document.getElementById('detalleValorComision').textContent = formatCurrency(ingreso.valor_comision || 0);
                
                // Mostrar sección de comisión
                document.getElementById('seccionDetalleComision').style.display = 'block';
            } else {
                document.getElementById('seccionDetalleComision').style.display = 'none';
            }
        }
        
        // Mostrar información de archivos adjuntos si hay
        const detalleAdjuntoElement = document.getElementById('detalleAdjuntos');
        if (detalleAdjuntoElement) {
            if (ingreso.adjuntos && ingreso.adjuntos.length > 0) {
                let adjuntosHTML = '';
                ingreso.adjuntos.forEach(adjunto => {
                    adjuntosHTML += `
                        <div class="mb-2">
                            <a href="${adjunto.url}" target="_blank" class="btn btn-sm btn-outline-info">
                                <i class="fas fa-file-download"></i> ${adjunto.nombre_original || 'Adjunto'}
                            </a>
                        </div>
                    `;
                });
                
                detalleAdjuntoElement.innerHTML = adjuntosHTML;
                document.getElementById('seccionDetalleAdjuntos').style.display = 'block';
            } else {
                document.getElementById('seccionDetalleAdjuntos').style.display = 'none';
            }
        }
        
        // Mostrar modal
        const detalleModal = new bootstrap.Modal(document.getElementById('detalleIngresoModal'));
        detalleModal.show();
        
    } catch (error) {
        console.error('Error al cargar detalle del ingreso:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

// Función para cargar un ingreso en el modal para editarlo
async function editarIngreso(id) {
    try {
        // Obtener los datos del ingreso desde la API
        const response = await fetch(`/api/ingresos/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error al obtener ingreso para editar: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error al obtener el ingreso para editar');
        }
        
        const ingreso = result.data;
        
        // Llenar el formulario con los datos del ingreso
        document.getElementById('ingresoModalLabel').textContent = 'Editar Ingreso';
        
        // Guardar el ID del ingreso
        if (document.getElementById('ingresoId')) {
            document.getElementById('ingresoId').value = ingreso.id;
        }
        if (document.getElementById('ingresoIdHidden')) {
            document.getElementById('ingresoIdHidden').value = ingreso.id;
        }
        
        // Datos básicos
        document.getElementById('fechaIngreso').value = ingreso.fecha.split('T')[0];
        document.getElementById('conceptoIngreso').value = ingreso.concepto;
        document.getElementById('descripcionIngreso').value = ingreso.descripcion || '';
        document.getElementById('valorBruto').value = ingreso.valor_bruto;
        document.getElementById('porcentajeRetencion').value = ingreso.porcentaje_retencion || 0;
        document.getElementById('valorRetencion').value = ingreso.valor_retencion || 0;
        document.getElementById('valorNeto').value = ingreso.valor_neto;
        document.getElementById('metodoPago').value = ingreso.metodo_pago || 'efectivo';
        document.getElementById('referenciaPago').value = ingreso.referencia_pago || '';
        document.getElementById('estadoIngreso').value = ingreso.estado;
        
        // Seleccionar categoría
        const categoriaSelect = document.getElementById('categoriaIngreso');
        if (ingreso.categoria_id && categoriaSelect) {
            categoriaSelect.value = ingreso.categoria_id;
            
            // Actualizar Select2 si está disponible
            if (window.jQuery && $.fn.select2) {
                try {
                    $(categoriaSelect).val(ingreso.categoria_id).trigger('change');
                } catch (e) {
                    console.error('Error al actualizar Select2:', e);
                    categoriaSelect.dispatchEvent(new Event('change'));
                }
            } else {
                categoriaSelect.dispatchEvent(new Event('change'));
            }
        }
        
        // Si tiene cliente, seleccionarlo
        if (ingreso.cliente_id) {
            document.getElementById('seccionCliente').style.display = 'block';
            
            // Cargar clientes si aún no están cargados
            if (clientes.length === 0) {
                await cargarClientes();
            }
            
            // Seleccionar cliente
            document.getElementById('clienteIngreso').value = ingreso.cliente_id;
        }
        
        // Si tiene crédito, seleccionarlo
        if (ingreso.credito_id) {
            document.getElementById('seccionCredito').style.display = 'block';
            
            // Cargar créditos del cliente
            await cargarCreditosCliente(ingreso.cliente_id);
            
            // Seleccionar crédito
            document.getElementById('creditoIngreso').value = ingreso.credito_id;
        }
        
        // Si tiene asesor y comisión
        if (ingreso.asesor_id) {
            document.getElementById('seccionComision').style.display = 'block';
            
            // Cargar asesores si aún no están cargados
            if (asesores.length === 0) {
                await cargarAsesores();
            }
            
            // Seleccionar asesor
            document.getElementById('asesorIngreso').value = ingreso.asesor_id;
            document.getElementById('porcentajeComision').value = ingreso.porcentaje_comision || 0;
            document.getElementById('valorComision').value = ingreso.valor_comision || 0;
        }
        
        // Mostrar el botón de actualizar y ocultar el de guardar
        if (document.getElementById('btnGuardarIngreso')) {
            document.getElementById('btnGuardarIngreso').style.display = 'none';
        }
        if (document.getElementById('btnActualizarIngreso')) {
            document.getElementById('btnActualizarIngreso').style.display = 'block';
        }
        
        // Abrir modal
        const ingresoModal = new bootstrap.Modal(document.getElementById('ingresoModal'));
        ingresoModal.show();
        
    } catch (error) {
        console.error('Error al cargar ingreso para editar:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

// Función para anular un ingreso
async function anularIngreso(id) {
    // Mostrar confirmación antes de anular
    if (!confirm('¿Está seguro que desea anular este ingreso? Esta acción no se puede deshacer.')) {
        return; // Si el usuario cancela, no hacer nada
    }
    
    try {
        const response = await fetch(`/api/ingresos/${id}/anular`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                estado: 'anulado',
                motivo_anulacion: 'Anulado por el usuario'
            })
        });
        
        if (!response.ok) {
            // Si el endpoint específico de anulación no existe, intentar con una actualización general
            if (response.status === 404) {
                return await anularIngresoAlternativo(id);
            }
            throw new Error(`Error al anular ingreso: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error al anular el ingreso');
        }
        
        showToast('Ingreso anulado correctamente', 'success');
        
        // Recargar lista de ingresos para reflejar el cambio
        cargarIngresos();
        
    } catch (error) {
        console.error('Error al anular ingreso:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

// Función alternativa para anular un ingreso si no existe el endpoint específico
async function anularIngresoAlternativo(id) {
    try {
        const response = await fetch(`/api/ingresos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                estado: 'anulado',
                motivo_anulacion: 'Anulado por el usuario'
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error al anular ingreso: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error al anular el ingreso');
        }
        
        showToast('Ingreso anulado correctamente', 'success');
        
        // Recargar lista de ingresos para reflejar el cambio
        cargarIngresos();
        
        return true;
    } catch (error) {
        console.error('Error en método alternativo de anulación:', error);
        throw error;
    }
}
