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
    if (toastContainer) {
        toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
        
        // Auto-remove after hiding
        toastElement.addEventListener('hidden.bs.toast', function () {
            toastElement.remove();
        });
    }
}

// Inicializar interfaz
async function inicializarInterfaz() {
    console.log('Inicializando interfaz...');
    
    // Mostrar nombre de usuario actual
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (userData.name) {
        const currentUserElement = document.getElementById('currentUser');
        if (currentUserElement) {
            currentUserElement.innerText = userData.name;
        } else {
            console.warn('Elemento currentUser no encontrado');
        }
    }
    
    // Evento de cierre de sesión
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
            window.location.href = 'login.html';
        });
    } else {
        console.warn('Elemento logoutBtn no encontrado');
    }
    
    // Evento para abrir modal de nueva categoría
    const nuevaCategoriaBtn = document.getElementById('nuevaCategoriaBtn');
    if (nuevaCategoriaBtn) {
        nuevaCategoriaBtn.addEventListener('click', () => {
            abrirModalNuevaCategoria();
        });
    } else {
        console.warn('Elemento nuevaCategoriaBtn no encontrado');
    }
    
    // Evento para guardar categoría
    const guardarCategoriaBtn = document.getElementById('guardarCategoriaBtn');
    if (guardarCategoriaBtn) {
        guardarCategoriaBtn.addEventListener('click', () => {
            guardarCategoria();
        });
    } else {
        console.warn('Elemento guardarCategoriaBtn no encontrado');
    }
    
    // Cargar las categorías iniciales
    await cargarCategorias();
}

// Cargar categorías desde el servidor
async function cargarCategorias() {
    try {
        console.log('Iniciando carga de categorías...');
        console.log('Token disponible:', !!token);
        
        // Debug para verificar el toastContainer
        const toastContainer = document.getElementById('toastContainer');
        console.log('¿Existe toast container?', !!toastContainer);
        
        try {
            showToast('Cargando categorías...', 'success');
        } catch (e) {
            console.error('Error al mostrar toast:', e);
        }
        
        const url = '/api/categorias-ingreso?incluirSubcategorias=true';
        console.log('URL de la petición:', url);
        
        // Para debugging - mostrar todos los headers
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        console.log('Headers enviados:', headers);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });
        
        console.log('Respuesta recibida, status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Error de servidor: ${response.status} ${response.statusText}`);
        }
          const result = await response.json();
        console.log('Respuesta parseada:', result);
        
        if (result && typeof result === 'object') {
            if (!result.success) {
                throw new Error(result.error || 'Error al cargar categorías');
            }
            
            if (Array.isArray(result.data)) {
                categorias = result.data;
            } else if (result.data === null || result.data === undefined) {
                categorias = [];
                console.warn('Los datos de categorías son null o undefined, usando array vacío');
            } else if (typeof result.data === 'object') {
                categorias = [result.data];
                console.warn('Los datos de categorías no son un array pero son un objeto, convirtiéndolo a array');
            } else {
                categorias = [];
                console.error('Formato de datos inesperado:', result.data);
            }
        } else {
            // Si result no es un objeto, intentamos usarlo directamente como array de categorías
            if (Array.isArray(result)) {
                categorias = result;
                console.warn('La respuesta no tiene el formato esperado (success, data), usando la respuesta directamente');
            } else {
                categorias = [];
                console.error('Respuesta en formato desconocido, usando array vacío');
            }
        }
        
        console.log('Categorías cargadas:', categorias);
        
        // Mostrar mensaje si no hay categorías
        if (categorias.length === 0) {
            document.getElementById('tablaCategorias').innerHTML = '<tr><td colspan="8" class="text-center">No hay categorías registradas</td></tr>';
            showToast('No hay categorías para mostrar', 'info');
            return;
        }
        
        // Renderizar tabla de categorías
        renderizarTablaCategorias();
        
        // Actualizar select de categorías padre en el modal
        actualizarSelectCategoriaPadre();
        
        showToast(`${categorias.length} categorías cargadas exitosamente`, 'success');
        
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        document.getElementById('tablaCategorias').innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error al cargar categorías</td></tr>';
        showToast('Error al cargar categorías: ' + error.message, 'error');
    }
}

// Función para renderizar la tabla de categorías
function renderizarTablaCategorias() {
    console.log('Renderizando tabla de categorías, total categorías:', categorias ? categorias.length : 0);
    
    const tablaCategorias = document.getElementById('tablaCategorias');
    if (!tablaCategorias) {
        console.error('Error: Elemento tablaCategorias no encontrado en el DOM');
        alert('Error al mostrar las categorías: No se pudo encontrar la tabla en la página.');
        return;
    }
    
    tablaCategorias.innerHTML = '';
    
    if (!categorias || categorias.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="8" class="text-center">No hay categorías registradas</td>';
        tablaCategorias.appendChild(tr);
        return;
    }
    
    // Primero agregar las categorías principales
    const categoriasPrincipales = categorias.filter(cat => !cat.categoria_padre_id);
    console.log('Categorías principales:', categoriasPrincipales.length);
    
    // Si no hay categorías principales, mostrar todas
    if (categoriasPrincipales.length === 0) {
        console.log('No hay categorías principales, mostrando todas las categorías');
        categorias.forEach(categoria => {
            tablaCategorias.appendChild(crearFilaCategoria(categoria, false));
        });
        return;
    }
    
    // Mostrar categorías principales y sus subcategorías
    categoriasPrincipales.forEach(categoria => {
        // Renderizar categoría principal
        tablaCategorias.appendChild(crearFilaCategoria(categoria, false));
        
        // Renderizar subcategorías
        const subcategorias = categorias.filter(subcat => subcat.categoria_padre_id === categoria.id);
        console.log(`Subcategorías de ${categoria.nombre}:`, subcategorias.length);
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
          // Primero obtener todos los datos actuales de la categoría
        const catResponse = await fetch(`/api/categorias-ingreso/${categoriaId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const catData = await catResponse.json();
        if (!catData.success) {
            throw new Error('Error al obtener datos de la categoría');
        }
          const categoriaActual = catData.data;
        
        // Preparar el objeto de datos a enviar
        const updateData = {
            nombre: categoriaActual.nombre,
            descripcion: categoriaActual.descripcion,
            porcentaje_retencion: categoriaActual.porcentaje_retencion || 0,
            requiere_cliente: categoriaActual.requiere_cliente || false,
            permite_comision: categoriaActual.permite_comision || false,
            es_credito: categoriaActual.es_credito || false,
            es_activo: nuevoEstado
        };
        
        // Solo incluir categoria_padre_id si existe y no es null
        if (categoriaActual.categoria_padre_id) {
            updateData.categoria_padre_id = categoriaActual.categoria_padre_id;
        }
        
        console.log('Datos a enviar para actualizar estado:', updateData);
        
        // Llamar a la API para actualizar estado incluyendo todos los campos requeridos
        const response = await fetch(`/api/categorias-ingreso/${categoriaId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
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
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM cargado, iniciando aplicación de categorías');
    
    // Verificar token
    if (!token) {
        console.warn('No hay token de autenticación');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        // Añadir un mensaje inicial si existe el elemento tablaCategorias
        const tablaCategorias = document.getElementById('tablaCategorias');
        if (tablaCategorias) {
            tablaCategorias.innerHTML = '<tr><td colspan="8" class="text-center">Cargando categorías...</td></tr>';
        } else {
            console.warn('Elemento tablaCategorias no encontrado');
        }
        
        // Inicializar interfaz y añadir manejadores de eventos
        await inicializarInterfaz();
        
        // Cargar las categorías
        await cargarCategorias();
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        if (typeof showToast === 'function') {
            showToast('Error al inicializar: ' + error.message, 'error');
        } else {
            console.error('Función showToast no disponible');
            alert('Error al inicializar la aplicación: ' + error.message);
        }
        
        // Mostrar mensaje de error en la tabla si existe el elemento
        const tablaCategorias = document.getElementById('tablaCategorias');
        if (tablaCategorias) {
            tablaCategorias.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error al cargar: ' + error.message + '</td></tr>';
        }
    }
});
