// Variables globales
let token = localStorage.getItem('token');
let categorias = [];
let modoEdicion = false;
let categoriaEditando = null;

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
    
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '1080';
        document.body.appendChild(container);
    }
    
    document.getElementById('toastContainer').innerHTML += toastHTML;
    const toastElement = new bootstrap.Toast(document.getElementById(toastId));
    toastElement.show();
}

// Inicializar interfaz
async function inicializarInterfaz() {
    // Mostrar nombre de usuario actual
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (userData.name) {
        document.getElementById('currentUser').innerText = userData.name;
    }
    
    // Evento de cierre de sesión
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        window.location.href = 'login.html';
    });
    
    // Evento para abrir modal de nueva categoría
    document.getElementById('nuevaCategoriaBtn').addEventListener('click', () => {
        abrirModalNuevaCategoria();
    });
    
    // Evento para guardar categoría
    document.getElementById('guardarCategoriaBtn').addEventListener('click', () => {
        guardarCategoria();
    });
    
    // Cargar las categorías iniciales
    await cargarCategorias();
}

// Cargar categorías desde el servidor
async function cargarCategorias() {
    try {
        const response = await fetch('/api/categorias-ingreso?incluirSubcategorias=true', {
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
        
        categorias = result.data;
        console.log('Categorías cargadas:', categorias);
        
        // Renderizar tabla de categorías
        renderizarTablaCategorias();
        
        // Actualizar select de categorías padre en el modal
        actualizarSelectCategoriaPadre();
        
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        showToast('Error al cargar categorías: ' + error.message, 'error');
    }
}

// Función para renderizar la tabla de categorías
function renderizarTablaCategorias() {
    const tablaCategorias = document.getElementById('tablaCategorias');
    tablaCategorias.innerHTML = '';
    
    // Primero agregar las categorías principales
    const categoriasPrincipales = categorias.filter(cat => !cat.categoria_padre_id);
    
    categoriasPrincipales.forEach(categoria => {
        // Renderizar categoría principal
        tablaCategorias.appendChild(crearFilaCategoria(categoria, false));
        
        // Renderizar subcategorías
        const subcategorias = categorias.filter(subcat => subcat.categoria_padre_id === categoria.id);
        subcategorias.forEach(subcategoria => {
            tablaCategorias.appendChild(crearFilaCategoria(subcategoria, true));
        });
    });
}

// Función para crear una fila de categoría
function crearFilaCategoria(categoria, esSubcategoria) {
    const tr = document.createElement('tr');
    
    // Agregar clase para las subcategorías
    if (esSubcategoria) {
        tr.classList.add('table-light');
    }
    
    tr.innerHTML = `
        <td>
            ${esSubcategoria ? '<span class="nested-category">' : ''}
            ${categoria.nombre}
            ${esSubcategoria ? '</span>' : ''}
        </td>
        <td>${categoria.descripcion || ''}</td>
        <td>${categoria.requiere_cliente ? '<span class="badge bg-success">Sí</span>' : '<span class="badge bg-secondary">No</span>'}</td>
        <td>${categoria.porcentaje_retencion}%</td>
        <td>${categoria.permite_comision ? '<span class="badge bg-success">Sí</span>' : '<span class="badge bg-secondary">No</span>'}</td>
        <td>${categoria.es_credito ? '<span class="badge bg-success">Sí</span>' : '<span class="badge bg-secondary">No</span>'}</td>
        <td>${categoria.es_activo ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-danger">Inactivo</span>'}</td>
        <td>
            <div class="btn-group btn-group-sm">
                <button type="button" class="btn btn-primary btn-editar" data-id="${categoria.id}">
                    <i class="fas fa-edit"></i>
                </button>
                ${!esSubcategoria ? `
                <button type="button" class="btn btn-info btn-add-sub" data-id="${categoria.id}">
                    <i class="fas fa-plus"></i>
                </button>` : ''}
                <button type="button" class="btn ${categoria.es_activo ? 'btn-warning' : 'btn-success'} btn-toggle-estado" data-id="${categoria.id}">
                    <i class="fas ${categoria.es_activo ? 'fa-ban' : 'fa-check'}"></i>
                </button>
            </div>
        </td>
    `;
    
    // Agregar event listeners
    tr.querySelector('.btn-editar').addEventListener('click', () => {
        abrirModalEditarCategoria(categoria.id);
    });
    
    if (!esSubcategoria) {
        tr.querySelector('.btn-add-sub').addEventListener('click', () => {
            abrirModalNuevaSubcategoria(categoria.id);
        });
    }
    
    tr.querySelector('.btn-toggle-estado').addEventListener('click', () => {
        cambiarEstadoCategoria(categoria.id, !categoria.es_activo);
    });
    
    return tr;
}

// Función para actualizar el select de categorías padre
function actualizarSelectCategoriaPadre() {
    const selectCategoriaPadre = document.getElementById('categoriaPadre');
    selectCategoriaPadre.innerHTML = '<option value="">Categoría Principal</option>';
    
    // Solo mostrar categorías principales como posibles padres
    const categoriasPrincipales = categorias.filter(cat => !cat.categoria_padre_id && cat.es_activo);
    
    categoriasPrincipales.forEach(categoria => {
        // Si estamos en modo edición, no mostrar la categoría actual como posible padre
        if (modoEdicion && categoriaEditando && categoriaEditando.id === categoria.id) {
            return;
        }
        
        const option = document.createElement('option');
        option.value = categoria.id;
        option.textContent = categoria.nombre;
        selectCategoriaPadre.appendChild(option);
    });
}

// Abrir modal para nueva categoría
function abrirModalNuevaCategoria() {
    modoEdicion = false;
    categoriaEditando = null;
    document.getElementById('categoriaModalTitle').textContent = 'Nueva Categoría de Ingreso';
    document.getElementById('categoriaId').value = '';
    document.getElementById('categoriaForm').reset();
    
    // Mostrar todas las categorías principales como posibles padres
    actualizarSelectCategoriaPadre();
    
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('categoriaModal'));
    modal.show();
}

// Abrir modal para nueva subcategoría
function abrirModalNuevaSubcategoria(categoriaPadreId) {
    modoEdicion = false;
    categoriaEditando = null;
    document.getElementById('categoriaModalTitle').textContent = 'Nueva Subcategoría de Ingreso';
    document.getElementById('categoriaId').value = '';
    document.getElementById('categoriaForm').reset();
    
    // Seleccionar categoría padre
    document.getElementById('categoriaPadre').value = categoriaPadreId;
    
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('categoriaModal'));
    modal.show();
}

// Abrir modal para editar categoría
async function abrirModalEditarCategoria(categoriaId) {
    try {
        const response = await fetch(`/api/categorias-ingreso/${categoriaId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error al cargar categoría');
        }
        
        const categoria = result.data;
        modoEdicion = true;
        categoriaEditando = categoria;
        
        document.getElementById('categoriaModalTitle').textContent = 'Editar Categoría de Ingreso';
        document.getElementById('categoriaId').value = categoria.id;
        document.getElementById('categoriaNombre').value = categoria.nombre;
        document.getElementById('categoriaDescripcion').value = categoria.descripcion || '';
        document.getElementById('categoriaRetencion').value = categoria.porcentaje_retencion || 0;
        document.getElementById('categoriaRequiereCliente').checked = categoria.requiere_cliente || false;
        document.getElementById('categoriaPermiteComision').checked = categoria.permite_comision || false;
        document.getElementById('categoriaEsCredito').checked = categoria.es_credito || false;
        document.getElementById('categoriaEsActivo').checked = categoria.es_activo || false;
        
        // Actualizar select de categorías padre
        actualizarSelectCategoriaPadre();
        document.getElementById('categoriaPadre').value = categoria.categoria_padre_id || '';
        
        // Abrir modal
        const modal = new bootstrap.Modal(document.getElementById('categoriaModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error al cargar categoría para editar:', error);
        showToast('Error al cargar categoría: ' + error.message, 'error');
    }
}

// Guardar categoría (crear nueva o actualizar existente)
async function guardarCategoria() {
    try {
        // Recoger datos del formulario
        const categoriaId = document.getElementById('categoriaId').value;
        const nombre = document.getElementById('categoriaNombre').value.trim();
        const descripcion = document.getElementById('categoriaDescripcion').value.trim();
        const categoriaPadreId = document.getElementById('categoriaPadre').value;
        const porcentajeRetencion = parseFloat(document.getElementById('categoriaRetencion').value) || 0;
        const requiereCliente = document.getElementById('categoriaRequiereCliente').checked;
        const permiteComision = document.getElementById('categoriaPermiteComision').checked;
        const esCredito = document.getElementById('categoriaEsCredito').checked;
        const esActivo = document.getElementById('categoriaEsActivo').checked;
        
        // Validar datos
        if (!nombre) {
            showToast('El nombre de la categoría es obligatorio', 'error');
            return;
        }
        
        // Preparar datos para enviar
        const categoriaData = {
            nombre,
            descripcion,
            porcentaje_retencion: porcentajeRetencion,
            requiere_cliente: requiereCliente,
            permite_comision: permiteComision,
            es_credito: esCredito,
            es_activo: esActivo
        };
        
        // Añadir categoría padre si se seleccionó
        if (categoriaPadreId) {
            categoriaData.categoria_padre_id = parseInt(categoriaPadreId);
        } else {
            categoriaData.categoria_padre_id = null; // Explícitamente null para categorías principales
        }
        
        // URL y método según si es creación o edición
        const url = modoEdicion ? `/api/categorias-ingreso/${categoriaId}` : '/api/categorias-ingreso';
        const method = modoEdicion ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(categoriaData)
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error al guardar categoría');
        }
        
        // Cerrar modal
        bootstrap.Modal.getInstance(document.getElementById('categoriaModal')).hide();
        
        // Mostrar mensaje de éxito
        showToast(modoEdicion ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente');
        
        // Recargar categorías
        await cargarCategorias();
        
    } catch (error) {
        console.error('Error al guardar categoría:', error);
        showToast('Error al guardar categoría: ' + error.message, 'error');
    }
}

// Cambiar estado de categoría (activar/desactivar)
async function cambiarEstadoCategoria(categoriaId, nuevoEstado) {
    try {
        const categoria = categorias.find(cat => cat.id === categoriaId);
        if (!categoria) {
            throw new Error('Categoría no encontrada');
        }
        
        // Confirmar acción
        const confirmAction = await Swal.fire({
            title: `¿${nuevoEstado ? 'Activar' : 'Desactivar'} categoría?`,
            text: `¿Está seguro que desea ${nuevoEstado ? 'activar' : 'desactivar'} la categoría "${categoria.nombre}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Cancelar'
        });
        
        if (!confirmAction.isConfirmed) {
            return;
        }
        
        // Llamar a la API para actualizar estado
        const response = await fetch(`/api/categorias-ingreso/${categoriaId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                es_activo: nuevoEstado
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error al cambiar estado de categoría');
        }
        
        // Mostrar mensaje de éxito
        showToast(`Categoría ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente`);
        
        // Recargar categorías
        await cargarCategorias();
        
    } catch (error) {
        console.error('Error al cambiar estado de categoría:', error);
        showToast('Error al cambiar estado: ' + error.message, 'error');
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Verificar token
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    // Inicializar interfaz
    inicializarInterfaz();
});
