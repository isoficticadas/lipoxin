// Patrones de validación (globales)
const namePattern = /^[A-Za-z\s]+$/;
const phonePattern = /^\+593\d{9}$/;

/**
 * Muestra un mensaje de validación al usuario.
 * Puedes reemplazar `alert` por cualquier implementación como modales personalizados.
 * @param {string} msg - Mensaje a mostrar.
 */
function showValidationMessage(msg) {
  alert(msg);
}

/**
 * Maneja el envío de un formulario con validación previa.
 * @param {string} formSelector - Selector CSS del formulario.
 * @param {string} nameSelector - Selector CSS del input de nombre.
 * @param {string} phoneSelector - Selector CSS del input de teléfono.
 */
function handleFormSubmit(formSelector, nameSelector, phoneSelector) {
  const form = document.querySelector(formSelector);
  if (!form) return; // Salir si el formulario no existe

  form.addEventListener("submit", async (event) => {
    event.preventDefault(); // Evita recargar la página

    const nameInput = document.querySelector(nameSelector);
    const phoneInput = document.querySelector(phoneSelector);

    // Salir si los inputs no existen
    if (!nameInput || !phoneInput) return;

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();

    // Validaciones
    if (!name || !namePattern.test(name)) {
      showValidationMessage("Por favor, ingrese un nombre válido.");
      nameInput.focus();
      return;
    }

    if (!phonePattern.test(phone)) {
      showValidationMessage(
        "Por favor, ingrese un número de teléfono válido. Ejemplo: +593933543342"
      );
      phoneInput.focus();
      return;
    }

    try {
      // Envío de datos con Fetch
      const response = await fetch("/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, phone }),
      });

      if (!response.ok) {
        throw new Error("Error en la respuesta del servidor");
      }

      const data = await response.json();
      showValidationMessage("Sus datos fueron enviados y un agente se comunicará con usted dentro de 1 a 5 minutos.");
      form.reset();

      // Ocultar ventana emergente si existe
      const popupWindow = document.querySelector(".popup-window");
      if (popupWindow) popupWindow.style.display = "none";
    } catch (error) {
      console.error(error);
      showValidationMessage("Error al enviar datos.");
    }
  });
}

/**
 * Inicializa la lógica de apertura y cierre del popup.
 */
function initPopup() {
  const feedbackBtn = document.querySelector(".feedback");
  const closePopupBtn = document.querySelector(".close-popup");
  const popupWindow = document.querySelector(".popup-window");

  if (feedbackBtn && popupWindow) {
    feedbackBtn.addEventListener("click", () => {
      popupWindow.style.display = "block";
    });
  }

  if (closePopupBtn && popupWindow) {
    closePopupBtn.addEventListener("click", () => {
      popupWindow.style.display = "none";
    });
  }
}

/**
 * Maneja la navegación entre secciones con desplazamiento suave.
 */
function initNavigation() {
  const links = document.querySelectorAll(".navigate");
  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();

      const targetId = link.getAttribute("data-target");
      const targetForm = document.getElementById(targetId);

      if (targetForm) {
        targetForm.style.display = "block";
        targetForm.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
}

/**
 * Inicializa las funcionalidades cuando el DOM está listo.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Manejo de formularios
  handleFormSubmit("#dataForm", "#name", "#phone");
  handleFormSubmit("#dataForm2", "#name2", "#phone2");
  handleFormSubmit("#dataForm3", "#name3", "#phone3");

  // Inicializa navegación y popup
  initNavigation();
  initPopup();
});
