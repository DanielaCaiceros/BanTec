let currentModule = 1;

// Leer los parámetros de la URL para ver si un módulo ha sido completado
const params = new URLSearchParams(window.location.search);
const completedModule = params.get('completed');

if (completedModule) {
    currentModule = parseInt(completedModule) + 1;
    unlockModules();
}

// Función para ir a un módulo específico
function goToModule(moduleNumber) {
    window.location.href = `module.html?module=${moduleNumber}`;
}

// Función para desbloquear los módulos completados
function unlockModules() {
    for (let i = 1; i <= currentModule; i++) {
        const moduleCard = document.getElementById(`module-${i}`);
        moduleCard.classList.remove('locked');
        moduleCard.querySelector('button').disabled = false;
    }
}


