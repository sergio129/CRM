// Función para seleccionar una cuota específica para pago
async function seleccionarCuota(creditoId, cuotaId, valorCuota) {
    try {
        console.log(`Seleccionando cuota: CréditoID=${creditoId}, CuotaID=${cuotaId}, Valor=${valorCuota}`);
        
        // Guardar los datos para usarlos después
        window.cuotaSeleccionada = {
            creditoId: creditoId,
            cuotaId: cuotaId,
            valorCuota: valorCuota
        };
        
        // Almacenar ID en campos ocultos
        if (!document.getElementById('cuotaIdSeleccionada')) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.id = 'cuotaIdSeleccionada';
            input.name = 'cuotaIdSeleccionada';
            input.value = cuotaId;
            document.body.appendChild(input);
        } else {
            document.getElementById('cuotaIdSeleccionada').value = cuotaId;
        }
        
        if (!document.getElementById('creditoIdSeleccionado')) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.id = 'creditoIdSeleccionado';
            input.name = 'creditoIdSeleccionado';
            input.value = creditoId;
            document.body.appendChild(input);
        } else {
            document.getElementById('creditoIdSeleccionado').value = creditoId;
        }
        
        // PASO 1: Eliminar todas las modales existentes de Bootstrap
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            try {
                const bsModal = bootstrap.Modal.getInstance(modal);
                if (bsModal) {
                    console.log(`Cerrando y destruyendo modal: ${modal.id}`);
                    bsModal.hide();
                    bsModal.dispose();
                }
            } catch (e) {
                console.error(`Error al cerrar modal ${modal.id}:`, e);
            }
        });
        
        // PASO 2: Eliminar todos los backdrops y limpiar el DOM
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('padding-right');
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('position');
        document.body.style.removeProperty('top');
        document.body.style.removeProperty('width');
        document.body.removeAttribute('style');
        
        // PASO 3: Esperar a que el DOM se actualice
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // PASO 4: Crear completamente una nueva instancia del modal de ingreso
        const ingresoModalEl = document.getElementById('ingresoModal');
        
        // Verificar que existe
        if (!ingresoModalEl) {
            throw new Error("No se encontró el modal de ingreso con ID 'ingresoModal'");
        }
        
        // PASO 5: Configurar el contenido del modal antes de abrirlo
        // Cambiar el título del modal
        const modalTitle = ingresoModalEl.querySelector('.modal-title');
        if (modalTitle) {
            modalTitle.textContent = `Pago de Cuota ${cuotaId} - Nuevo Ingreso`;
        }
        
        // PASO 6: Crear una nueva instancia del modal y abrirla
        const ingresoModal = new bootstrap.Modal(ingresoModalEl, {
            backdrop: 'static',
            keyboard: false,
            focus: true
        });
        
        // PASO 7: Mostrar el modal
        ingresoModal.show();
        
        // PASO 8: Configurar el manejador de eventos para cuando se muestre el modal
        ingresoModalEl.addEventListener('shown.bs.modal', function modalShownHandler() {
            ingresoModalEl.removeEventListener('shown.bs.modal', modalShownHandler);
            
            console.log('Modal mostrada correctamente - actualizando valores');
            
            // Obtener detalles del crédito desde la variable global
            const detallesCredito = window.creditoDetallesCompletos || {};
            
            // Seleccionar la categoría de crédito
            const categoriasSelect = document.getElementById('categoriaIngreso');
            if (categoriasSelect) {
                // Buscar categoría de tipo crédito
                let creditCategoryFound = false;
                for (let i = 0; i < categoriasSelect.options.length; i++) {
                    const option = categoriasSelect.options[i];
                    if (option.dataset.credito === 'true' || 
                        option.textContent.toLowerCase().includes('crédito') || 
                        option.textContent.toLowerCase().includes('credito')) {
                        categoriasSelect.selectedIndex = i;
                        categoriasSelect.value = option.value;
                        
                        // Para select2, actualizar visualmente
                        if (window.jQuery && $.fn.select2) {
                            $(categoriasSelect).val(option.value).trigger('change');
                        } else {
                            // Disparar evento change
                            categoriasSelect.dispatchEvent(new Event('change'));
                        }
                        
                        creditCategoryFound = true;
                        console.log('Categoría seleccionada:', option.textContent);
                        break;
                    }
                }
                
                if (!creditCategoryFound && categoriasSelect.options.length > 1) {
                    categoriasSelect.selectedIndex = 1; // Primera opción real
                    if (window.jQuery && $.fn.select2) {
                        $(categoriasSelect).val(categoriasSelect.options[1].value).trigger('change');
                    } else {
                        categoriasSelect.dispatchEvent(new Event('change'));
                    }
                }
            }
            
            // Configurar sección de crédito
            if (document.getElementById('seccionCredito')) {
                document.getElementById('seccionCredito').style.display = 'block';
                
                // Llenar el select de crédito
                const creditoSelect = document.getElementById('creditoIngreso');
                if (creditoSelect && creditoId) {
                    let creditoEncontrado = false;
                    
                    // Buscar si el crédito ya está en las opciones
                    for (let i = 0; i < creditoSelect.options.length; i++) {
                        if (creditoSelect.options[i].value == creditoId) {
                            creditoSelect.selectedIndex = i;
                            creditoEncontrado = true;
                            break;
                        }
                    }
                    
                    // Si no lo encontramos, agregarlo
                    if (!creditoEncontrado) {
                        const option = document.createElement('option');
                        option.value = creditoId;
                        const loanNumber = detallesCredito.loan_number || `CRED-${creditoId}`;
                        const loanType = detallesCredito.interest_type || 'Crédito';
                        option.textContent = `${loanNumber} - ${loanType}`;
                        creditoSelect.appendChild(option);
                        option.selected = true;
                    }
                    
                    // Actualizar Select2 si está en uso
                    if (window.jQuery && $.fn.select2) {
                        $(creditoSelect).trigger('change');
                    }
                }
            }
            
            // Establecer valor bruto (monto de la cuota)
            const valorBrutoInput = document.getElementById('valorBruto');
            if (valorBrutoInput) {
                valorBrutoInput.value = valorCuota;
                valorBrutoInput.dispatchEvent(new Event('input')); // Recalcular
            }
            
            // Configurar concepto y descripción
            const conceptoInput = document.getElementById('conceptoIngreso');
            if (conceptoInput) {
                conceptoInput.value = `Pago cuota ${cuotaId} de crédito`;
            }
            
            const descripcionInput = document.getElementById('descripcionIngreso');
            if (descripcionInput) {
                const creditInfo = window.creditoDetallesCompletos || {};
                const loanNumber = creditInfo.loan_number || '';
                descripcionInput.value = `Pago correspondiente a cuota ${cuotaId} del crédito ${loanNumber || 'seleccionado'}`;
            }
            
            // Datos del cliente si están disponibles
            if (detallesCredito.client) {
                const cliente = detallesCredito.client;
                
                // Activar sección cliente si existe
                if (document.getElementById('seccionCliente')) {
                    document.getElementById('seccionCliente').style.display = 'block';
                }
                
                // Rellenar campos del cliente
                if (document.getElementById('nombrePagador')) {
                    document.getElementById('nombrePagador').value = cliente.full_name || cliente.nombre || '';
                }
                
                if (document.getElementById('telefonoPagador')) {
                    document.getElementById('telefonoPagador').value = cliente.phone || cliente.telefono || '';
                }
                
                if (document.getElementById('correoPagador')) {
                    document.getElementById('correoPagador').value = cliente.email || '';
                }
                
                if (document.getElementById('documentoPagador')) {
                    document.getElementById('documentoPagador').value = cliente.id_number || cliente.identification || '';
                }
                
                // Seleccionar cliente en dropdown
                const clienteSelect = document.getElementById('clienteIngreso');
                if (clienteSelect && cliente.id) {
                    let clienteEncontrado = false;
                    
                    for (let i = 0; i < clienteSelect.options.length; i++) {
                        if (clienteSelect.options[i].value == cliente.id) {
                            clienteSelect.selectedIndex = i;
                            clienteEncontrado = true;
                            break;
                        }
                    }
                    
                    if (!clienteEncontrado) {
                        const option = document.createElement('option');
                        option.value = cliente.id;
                        option.textContent = `${cliente.full_name || cliente.nombre || 'Cliente'} - ${cliente.id_number || cliente.identification || 'Sin documento'}`;
                        clienteSelect.appendChild(option);
                        option.selected = true;
                    }
                    
                    // Actualizar Select2
                    if (window.jQuery && $.fn.select2) {
                        $(clienteSelect).trigger('change');
                    }
                }
            }
            
            // Forzar recálculo de valores
            if (window.calcularValores) {
                calcularValores();
            }
            
            // Mensaje de éxito
            showToast(`Configurando pago para cuota ${cuotaId}`, 'success');
        });
        
    } catch (error) {
        console.error('Error al seleccionar cuota:', error);
        showToast('Error al seleccionar cuota: ' + error.message, 'error');
    }
}
