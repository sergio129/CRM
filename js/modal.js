// Funcionalidad para controlar las modales

document.addEventListener('DOMContentLoaded', () => {
  // Función para abrir modal
  window.openModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('show');
      document.body.style.overflow = 'hidden'; // Prevenir scroll en el fondo
    }
  };

  // Función para cerrar modal
  window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = ''; // Restaurar scroll
    }
  };

  // Cerrar modales al hacer clic fuera
  document.addEventListener('click', (e) => {
    const modals = document.querySelectorAll('.modal.show');
    modals.forEach(modal => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });

  // Cerrar modales con la tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modals = document.querySelectorAll('.modal.show');
      modals.forEach(modal => {
        closeModal(modal.id);
      });
    }
  });

  // Configurar todos los botones de cierre en modales
  const closeButtons = document.querySelectorAll('.close-button');
  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const modal = button.closest('.modal');
      if (modal) {
        closeModal(modal.id);
      }
    });
  });
});
