/**
 * Sidebar Handler - Carga y configura el sidebar compartido para todos los módulos
 * Implementa la gestión centralizada del sidebar para mantener una experiencia
 * coherente en toda la aplicación
 */

document.addEventListener('DOMContentLoaded', function() {
    // Cargar el sidebar desde la plantilla
    loadSidebar();
    
    // Configurar eventos y comportamiento del sidebar
    setTimeout(() => {
        setupSidebarBehavior();
        highlightCurrentModule();
        setupModuleSpecificActions();
        loadUserInfo();
    }, 100);
});

/**
 * Carga el HTML del sidebar desde la plantilla
 */
function loadSidebar() {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) return;
    
    fetch('/templates/sidebar.html')
        .then(response => response.text())
        .then(html => {
            sidebarContainer.innerHTML = html;
            // Configurar el comportamiento después de cargar
            setupSidebarBehavior();
            highlightCurrentModule();
            setupModuleSpecificActions();
            loadUserInfo();
        })
        .catch(error => {
            console.error('Error al cargar el sidebar:', error);
            sidebarContainer.innerHTML = `
                <div class="alert alert-danger">
                    Error al cargar el sidebar. Por favor, recargue la página.
                </div>
            `;
        });
}

/**
 * Configura el comportamiento del sidebar (colapsar/expandir)
 */
function setupSidebarBehavior() {
    // Botón principal de colapso
    const sidebarCollapseBtn = document.getElementById('sidebarCollapse');
    if (sidebarCollapseBtn) {
        sidebarCollapseBtn.addEventListener('click', function() {
            document.getElementById('sidebar').classList.toggle('active');
            document.getElementById('content').classList.toggle('full-width');
        });
    }
    
    // Botón para dispositivos móviles
    const sidebarCollapseSmall = document.getElementById('sidebarCollapseSmall');
    if (sidebarCollapseSmall) {
        sidebarCollapseSmall.addEventListener('click', function() {
            document.getElementById('sidebar').classList.toggle('active');
        });
    }
    
    // Mantener estado del sidebar entre páginas
    const sidebarState = localStorage.getItem('sidebarState');
    if (sidebarState === 'collapsed') {
        document.getElementById('sidebar')?.classList.add('active');
        document.getElementById('content')?.classList.add('full-width');
    }
    
    // Guardar estado al cambiar
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.addEventListener('transitionend', function() {
            const isCollapsed = sidebar.classList.contains('active');
            localStorage.setItem('sidebarState', isCollapsed ? 'collapsed' : 'expanded');
        });
    }
    
    // Configurar desplegables del sidebar
    const dropdownToggles = document.querySelectorAll('.sidebar-dropdown > a');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            const submenuId = this.getAttribute('href');
            const submenu = document.querySelector(submenuId);
            
            // Cerrar todos los otros submenús
            document.querySelectorAll('.sidebar-dropdown > ul.show').forEach(menu => {
                if (menu !== submenu) {
                    menu.classList.remove('show');
                }
            });
            
            // Alternar el submenú actual
            submenu.classList.toggle('show');
        });
    });
}

/**
 * Destaca el módulo actual en el sidebar
 */
function highlightCurrentModule() {
    // Obtener la página actual
    const currentPath = window.location.pathname;
    const pageName = currentPath.split('/').pop();
    
    // Remover todas las clases activas
    document.querySelectorAll('#sidebar li').forEach(item => {
        item.classList.remove('active');
    });
    
    // Destacar el módulo activo
    switch (pageName) {
        case 'dashboard.html':
            document.getElementById('nav-dashboard')?.classList.add('active');
            break;
        case 'empleados.html':
            document.getElementById('nav-empleados')?.classList.add('active');
            break;
        case 'clientes.html':
            document.getElementById('nav-clientes')?.classList.add('active');
            break;
        case 'nomina.html':
            document.getElementById('nav-nomina')?.classList.add('active');
            break;
        case 'usuarios.html':
            document.getElementById('nav-usuarios')?.classList.add('active');
            document.getElementById('nav-administracion')?.classList.add('active');
            document.getElementById('administracionSubmenu')?.classList.add('show');
            break;
        case 'roles.html':
            document.getElementById('nav-roles')?.classList.add('active');
            document.getElementById('nav-administracion')?.classList.add('active');
            document.getElementById('administracionSubmenu')?.classList.add('show');
            break;
        case 'loans.html':
            document.getElementById('nav-loans')?.classList.add('active');
            break;
        case 'egresos.html':
            document.getElementById('nav-egresos')?.classList.add('active');
            break;
        default:
            // No se encontró coincidencia
            break;
    }
}

/**
 * Carga la información del usuario actual
 */
function loadUserInfo() {
    const userNameElement = document.getElementById('currentUserName');
    if (!userNameElement) return;
    
    // Obtener información del usuario del localStorage
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (userInfo.fullName) {
        userNameElement.textContent = userInfo.fullName;
    } else {
        // Si no hay nombre almacenado, intentar obtener del API
        const token = localStorage.getItem('token');
        if (!token) {
            userNameElement.textContent = 'Usuario';
            return;
        }
        
        fetch('/api/users/current', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.user && data.user.fullName) {
                userNameElement.textContent = data.user.fullName;
                
                // Guardar en localStorage para futuras cargas
                localStorage.setItem('userInfo', JSON.stringify({
                    fullName: data.user.fullName,
                    role: data.user.role
                }));
            }
        })
        .catch(error => {
            console.error('Error al obtener información del usuario:', error);
        });
    }
}

/**
 * Configura las acciones específicas para cada módulo
 */
function setupModuleSpecificActions() {
    const actionsContainer = document.getElementById('module-actions');
    if (!actionsContainer) return;
    
    // Obtener la página actual
    const currentPath = window.location.pathname;
    const pageName = currentPath.split('/').pop();
    
    // Configurar acciones según la página
    let actionsHtml = '';
    
    switch (pageName) {
        case 'dashboard.html':
            actionsHtml = `
                <button class="btn btn-success btn-sm mb-2 w-100" onclick="exportDashboard()">
                    <i class="fas fa-file-export me-1"></i> Exportar Informes
                </button>
            `;
            break;
        case 'empleados.html':
            actionsHtml = `
                <button class="btn btn-success btn-sm mb-2 w-100" onclick="exportEmployeeList()">
                    <i class="fas fa-file-excel me-1"></i> Exportar Excel
                </button>
                <button class="btn btn-danger btn-sm mb-2 w-100" onclick="exportEmployeePDF()">
                    <i class="fas fa-file-pdf me-1"></i> Exportar PDF
                </button>
            `;
            break;
        case 'clientes.html':
            actionsHtml = `
                <div class="d-grid mb-3">
                    <button class="btn btn-success mb-2 w-100" onclick="exportClientList()">
                        <i class="fas fa-file-excel me-1"></i> Exportar Excel
                    </button>
                    <button class="btn btn-danger mb-2 w-100" onclick="exportClientPDF()">
                        <i class="fas fa-file-pdf me-1"></i> Exportar PDF
                    </button>
                </div>
            `;
            break;
        case 'nomina.html':
            actionsHtml = `
                <button class="btn btn-primary btn-sm mb-2 w-100" id="sidebarCreatePayrollButton" onclick="createNewPayroll()">
                    <i class="fas fa-plus me-1"></i> Nueva Nómina
                </button>
                <button class="btn btn-success btn-sm mb-2 w-100" onclick="openPayrollHistory()">
                    <i class="fas fa-history me-1"></i> Historial
                </button>
                <button class="btn btn-danger btn-sm mb-2 w-100" onclick="exportPayrollPDF()">
                    <i class="fas fa-file-pdf me-1"></i> Exportar PDF
                </button>
            `;
            break;
        case 'usuarios.html':
            actionsHtml = `
                <button class="btn btn-primary btn-sm mb-2 w-100" id="sidebarCreateUserButton" onclick="openUserModal()">
                    <i class="fas fa-plus me-1"></i> Nuevo Usuario
                </button>
                <button class="btn btn-warning btn-sm mb-2 w-100" onclick="managePermissions()">
                    <i class="fas fa-key me-1"></i> Permisos
                </button>
            `;
            break;
        case 'roles.html':
            actionsHtml = `
                <button class="btn btn-primary btn-sm mb-2 w-100" id="sidebarCreateRoleButton" onclick="openRoleModal()">
                    <i class="fas fa-plus me-1"></i> Nuevo Rol
                </button>
            `;
            break;
        case 'loans.html':
            actionsHtml = `
                <button class="btn btn-primary btn-sm mb-2 w-100" id="sidebarCreateLoanButton" onclick="openLoanModal()">
                    <i class="fas fa-plus me-1"></i> Nuevo Préstamo
                </button>
                <button class="btn btn-success btn-sm mb-2 w-100" onclick="openPaymentModal()">
                    <i class="fas fa-money-bill me-1"></i> Registrar Pago
                </button>
                <button class="btn btn-warning btn-sm mb-2 w-100" onclick="openPaymentHistoryModal()">
                    <i class="fas fa-history me-1"></i> Historial
                </button>
            `;
            break;
        case 'egresos.html':
            actionsHtml = `
                <!-- Los botones de acción para egresos ahora están en la interfaz principal -->
                <div class="alert alert-info">
                    <small>Utilice los botones en la parte superior de la página</small>
                </div>
            `;
            break;
        default:
            actionsHtml = `
                <div class="alert alert-info">
                    <small>Seleccione un módulo para ver acciones disponibles</small>
                </div>
            `;
            break;
    }
    
    // Insertar las acciones en el contenedor
    actionsContainer.innerHTML = actionsHtml;
}