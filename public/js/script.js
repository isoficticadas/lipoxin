// Patrones de validación (globales)
const namePattern = /^[A-Za-z\s]+$/;
const phonePattern = /^\+593\d{9}$/;

/**
 * Muestra un mensaje de validación al usuario.
 * Actualmente usa un alert, pero puedes cambiarlo por un modal, etc.
 * @param {string} msg - Mensaje a mostrar
 */
function showValidationMessage(msg) {
  alert(msg);
}

/**
 * Maneja el envío de un formulario, validando nombre y teléfono.
 * @param {string} formSelector - Selector CSS del formulario (ej: "#dataForm")
 * @param {string} nameSelector - Selector CSS del input de nombre (ej: "#name")
 * @param {string} phoneSelector - Selector CSS del input de teléfono (ej: "#phone")
 */
function handleFormSubmit(formSelector, nameSelector, phoneSelector) {
  const form = document.querySelector(formSelector);
  if (!form) return; // Evita errores si el formulario no existe

  form.addEventListener("submit", function (event) {
    event.preventDefault(); // Evita el comportamiento por defecto (recargar la página)

    const nameInput = document.querySelector(nameSelector);
    const phoneInput = document.querySelector(phoneSelector);

    // Verifica que existan los campos para evitar errores
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

    // Envío de datos con Fetch
    fetch("/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, phone }),
    })
      .then((response) => {
        // Comprobamos si la respuesta es exitosa (2xx)
        if (!response.ok) {
          throw new Error("Error en la respuesta del servidor");
        }
        return response.json();
      })
      .then((data) => {
        // data contendrá el JSON que devuelve el servidor
        showValidationMessage("Datos enviados correctamente.");
        form.reset();
        // Oculta el popup si está abierto
        const popupWindow = document.querySelector(".popup-window");
        if (popupWindow) {
          popupWindow.style.display = "none";
        }
      })
      .catch((error) => {
        console.error(error);
        showValidationMessage("Error al enviar datos.");
      });
  });
}

/**
 * Inicializa la lógica de apertura/cierre del popup
 */
function initPopup() {
  const feedbackBtn = document.querySelector(".feedback");
  const closePopupBtn = document.querySelector(".close-popup");
  const popupWindow = document.querySelector(".popup-window");

  // Mostrar popup
  if (feedbackBtn && popupWindow) {
    feedbackBtn.addEventListener("click", function () {
      popupWindow.style.display = "block";
    });
  }

  // Cerrar popup
  if (closePopupBtn && popupWindow) {
    closePopupBtn.addEventListener("click", function () {
      popupWindow.style.display = "none";
    });
  }
}

/**
 * Se ejecuta cuando el DOM está listo
 */
document.addEventListener("DOMContentLoaded", function () {
  // Manejo de formularios
  handleFormSubmit("#dataForm", "#name", "#phone");
  handleFormSubmit("#dataForm2", "#name2", "#phone2");
  handleFormSubmit("#dataForm3", "#name3", "#phone3");

  // Manejo de navegación
  const links = document.querySelectorAll(".navigate");
  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault(); // Evita el comportamiento predeterminado

      // Muestra el formulario objetivo
      const targetId = link.getAttribute("data-target");
      const targetForm = document.getElementById(targetId);

      if (targetForm) {
        targetForm.style.display = "block"; // Muestra el formulario
        targetForm.scrollIntoView({ behavior: "smooth" }); // Desplazamiento suave
      }
    });
  });

  // Inicializa el popup
  initPopup();
});
