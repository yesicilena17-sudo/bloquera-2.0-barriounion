// Cargar el carrito guardado en la memoria de la PC
let carrito = JSON.parse(localStorage.getItem('carrito-bloquera')) || [];

// ==========================================
// 1. GESTIÓN DEL CONTADOR DEL MENÚ
// ==========================================
const actualizarContador = () => {
    const contador = document.getElementById('contador-carrito');
    if (contador) {
        const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
        contador.innerText = totalItems;
    }
};

// ==========================================
// 2. LÓGICA PARA AGREGAR PRODUCTOS DESDE EL CATÁLOGO
// ==========================================
document.querySelectorAll('.btn-agregar-circular').forEach(boton => {
    boton.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-agregar-circular');
        
        const id = btn.dataset.id;
        const nombre = btn.dataset.nombre;
        const precio = parseInt(btn.dataset.precio);
        
        const inputCantidad = btn.previousElementSibling;
        const cantidadAñadir = parseInt(inputCantidad.value) || 1;

        const existe = carrito.find(item => item.id === id);

        if (existe) {
            existe.cantidad += cantidadAñadir;
        } else {
            carrito.push({ id, nombre, precio, batch: 1, cantidad: cantidadAñadir });
        }

        guardarYRefrescar();
        inputCantidad.value = 1;
        alert(`Añadidas ${cantidadAñadir} unidades de "${nombre}" al pedido.`);
    });
});

// ==========================================
// 3. NUEVA LÓGICA DE EDICIÓN POR TECLADO EN EL MODAL
// ==========================================

// Función que se activa CADA VEZ que el usuario escribe un número nuevo en el modal
window.editarCantidadTeclado = (index, nuevoValor) => {
    const cantidad = parseInt(nuevoValor);
    
    // Si el usuario borra el número o pone 0, lo dejamos en 1 por seguridad (para borrar se usa la papelera)
    if (isNaN(cantidad) || cantidad <= 0) {
        carrito[index].cantidad = 1;
    } else {
        carrito[index].cantidad = cantidad;
    }
    
    // Guardamos en memoria y recalculamos el Total de la ventana sin cerrarla
    localStorage.setItem('carrito-bloquera', JSON.stringify(carrito));
    actualizarContador();
    
    // Recalcular el total general dinámicamente en pantalla
    actualizarTotalContenedor();
};

// Función para eliminar por completo el producto
window.eliminarProductoModal = (index) => {
    carrito.splice(index, 1);
    guardarYRefrescar();
};

// Función para actualizar el dinero acumulado en vivo
const actualizarTotalContenedor = () => {
    const totalSpan = document.getElementById('total-precio');
    if (totalSpan) {
        let total = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
        totalSpan.innerText = total.toLocaleString();
    }
};

const guardarYRefrescar = () => {
    localStorage.setItem('carrito-bloquera', JSON.stringify(carrito));
    actualizarContador(); 
    renderizarCarrito();
};

// ==========================================
// 4. MOSTRAR PRODUCTOS EN EL MODAL (DISEÑO LIMPIO)
// ==========================================
const renderizarCarrito = () => {
    const lista = document.getElementById('lista-carrito');
    
    if (!lista) return;
    
    lista.innerHTML = '';

    if (carrito.length === 0) {
        lista.innerHTML = `<p style="text-align: center; color: #888; padding: 20px 0;">El carrito está vacío</p>`;
        actualizarTotalContenedor();
        return;
    }

    carrito.forEach((item, index) => {
        lista.innerHTML += `
            <div class="item-carrito" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; padding: 12px 0;">
                <div>
                    <p style="margin: 0; font-weight: bold;">${item.nombre}</p>
                    <p style="margin: 5px 0 0 0; color: #888; font-size: 0.85rem;">Precio unitario: $${item.precio.toLocaleString()} COP</p>
                </div>
                
                <div class="controles-carrito">
                    <input type="number" 
                           class="input-cantidad-modal" 
                           value="${item.cantidad}" 
                           min="1" 
                           oninput="editarCantidadTeclado(${index}, this.value)">
                    
                    <button class="btn-borrar-item" onclick="eliminarProductoModal(${index})" title="Eliminar">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    actualizarTotalContenedor();
};

// ==========================================
// 6. ENVÍO DEL PEDIDO A WHATSAPP Y NOTIFICACIÓN
// ==========================================
const formulario = document.getElementById('formulario-envio');

if (formulario) {
    formulario.addEventListener('submit', (e) => {
        e.preventDefault(); // Evita que la página se recargue sola

        // 1. Validar que el carrito no esté vacío
        if (carrito.length === 0) {
            alert("Tu carrito está vacío. Añade productos antes de enviar el pedido.");
            return;
        }

        // 2. Capturar los datos que el usuario escribió en el formulario
        const nombreCliente = document.getElementById('cliente-nombre').value;
        const direccionCliente = document.getElementById('cliente-direccion').value;

        // 3. Tu número de teléfono (Escríbelo con el código de país de Venezuela +58 o de donde sea tu línea, sin el signo +)
        const telefonoBloquera = "584149716960"; 

        // 4. Construir el texto del mensaje usando saltos de línea (%0A) y negritas (*)
        let textoMensaje = `📲 *NUEVO PEDIDO - BLOQUERA BARRIO UNIÓN*%0A%0A`;
        textoMensaje += `👤 *Cliente:* ${nombreCliente}%0A`;
        textoMensaje += `📍 *Dirección/Barrio:* ${direccionCliente}%0A%0A`;
        textoMensaje += `📦 *Detalle del Pedido:*%0A`;

        let total = 0;
        carrito.forEach(item => {
            textoMensaje += `- ${item.nombre} x${item.cantidad} unidades%0A`;
            total += item.precio * item.cantidad;
        });

        textoMensaje += `%0A💰 *Total a pagar:* $${total.toLocaleString()} COP%0A%0A`;
        textoMensaje += `⚡ _Pedido generado desde la página web._`;

        // 5. Crear la dirección web de WhatsApp con el mensaje listo
        const urlWhatsapp = `https://wa.me/${telefonoBloquera}?text=${textoMensaje}`;

        // 6. NOTIFICACIÓN VISUAL EN PANTALLA: Le avisamos al usuario que todo salió bien
        alert(`¡Gracias por tu compra, ${nombreCliente}! \nTu pedido ha sido procesado. Ahora serás redirigido a WhatsApp para confirmar el despacho.`);

        // 7. Abrir WhatsApp en una pestaña nueva
        window.open(urlWhatsapp, '_blank');

        // 8. LIMPIEZA: Vaciamos el carrito de la memoria de la PC para que no se quede el pedido viejo guardado
        carrito = [];
        localStorage.removeItem('carrito-bloquera');
        
        // 9. Actualizar la interfaz (El contador volverá a 0 y el modal se cerrará)
        actualizarContador();
        document.getElementById('modal-carrito').style.display = 'none';
        formulario.reset(); // Limpia las casillas del nombre y dirección
    });





        // ==========================================
    // 5. CONTROL DE APERTURA Y CIERRE DEL MODAL
    // ==========================================
    const modal = document.getElementById('modal-carrito');
    const iconoCarrito = document.querySelector('.carrito-icono');
    const botonCerrar = document.getElementById('cerrar-carrito');

    if (iconoCarrito && modal) {
        iconoCarrito.addEventListener('click', () => {
            modal.style.display = 'flex';
            renderizarCarrito();
        });
    }

    if (botonCerrar && modal) {
        botonCerrar.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Inicialización
    actualizarContador();

    // ==========================================
    // 7. INTERRUPTOR DE MODO CLARO / OSCURO
    // ==========================================
    const botonTema = document.getElementById('toggle-tema');

    // Comprobar si el usuario ya tenía guardado un tema preferido en su PC
    const temaGuardado = localStorage.getItem('tema-bloquera') || 'dark';
    document.documentElement.setAttribute('data-theme', temaGuardado);

    // Actualizar el icono según el tema cargado
    const actualizarIconoTema = (tema) => {
        if (botonTema) {
            const icono = botonTema.querySelector('i');
            if (tema === 'light') {
                icono.className = 'fa-solid fa-moon'; // Si está en claro, muestra la luna para cambiar a oscuro
            } else {
                icono.className = 'fa-solid fa-sun';  // Si está en oscuro, muestra el sol para cambiar a claro
            }
        }
    };

    // Inicializar el icono correcto al cargar la página
    actualizarIconoTema(temaGuardado);

    if (botonTema) {
        botonTema.addEventListener('click', () => {
            // Mirar cuál tema está activo actualmente
            const temaActual = document.documentElement.getAttribute('data-theme');
            let nuevoTema = 'dark';

            if (temaActual === 'dark') {
                nuevoTema = 'light';
            }

            // Aplicar el nuevo tema al contenedor raíz del HTML
            document.documentElement.setAttribute('data-theme', nuevoTema);
            // Guardar la elección en la memoria de la PC
            localStorage.setItem('tema-bloquera', nuevoTema);
            // Cambiar el icono
            actualizarIconoTema(nuevoTema);
        });
    }
}


// ==========================================
// ENVÍO DEL FORMULARIO DE CONTACTO A WHATSAPP
// ==========================================
// Buscamos el formulario dentro de la sección de contacto
const formContactoDirecto = document.querySelector('.form-side form');

if (formContactoDirecto) {
    formContactoDirecto.addEventListener('submit', (e) => {
        e.preventDefault(); // Evita que la página se recargue

        // Leemos los datos de las casillas en el orden exacto en que aparecen en tu HTML
        const inputNombre = formContactoDirecto.querySelector('input[type="text"]');
        const inputTelefono = formContactoDirecto.querySelector('input[type="tel"]');
        const inputTextarea = formContactoDirecto.querySelector('textarea');

        const nombre = inputNombre ? inputNombre.value : '';
        const telefonoCliente = inputTelefono ? inputTelefono.value : '';
        const mensaje = inputTextarea ? inputTextarea.value : '';

        // REEMPLAZA AQUÍ: Pon tu número real de WhatsApp (código de país adelante, sin el +)
        const tuNumeroWhatsapp = "584120000000"; 

        // Armamos el texto limpio para WhatsApp
        let textoAEnviar = `👷‍♂️ *NUEVA CONSULTA - BLOQUERA BARRIO UNIÓN*%0A%0A`;
        textoAEnviar += `👤 *Nombre:* ${nombre}%0A`;
        textoAEnviar += `📞 *Teléfono:* ${telefonoCliente}%0A%0A`;
        textoAEnviar += `💬 *Consulta:*%0A${mensaje}`;

        // Creamos el enlace oficial
        const urlChat = `https://wa.me/${tuNumeroWhatsapp}?text=${textoAEnviar}`;

        // Abrimos el chat en una pestaña nueva
        window.open(urlChat, '_blank');

        // Limpiamos tu formulario para que quede vacío y listo para otro mensaje
        formContactoDirecto.reset();
    });
}






